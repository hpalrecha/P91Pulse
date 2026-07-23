package httpapi

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// territoryNode is one node of the hierarchical tree (national → region →
// state → city). Children is always a (possibly empty) array for clean JSON.
type territoryNode struct {
	ID       string           `json:"id"`
	Name     string           `json:"name"`
	Level    string           `json:"level"`
	ParentID string           `json:"parentId"`
	Children []*territoryNode `json:"children"`
}

var territoryLevels = map[string]bool{"national": true, "region": true, "state": true, "city": true}

// handleTerritoryTree — GET /api/erp/territory-tree : the whole tree, nested.
func (s *Server) handleTerritoryTree(w http.ResponseWriter, r *http.Request) {
	rows, err := s.pool.Query(r.Context(),
		`SELECT id::text, COALESCE(parent_id::text,''), name, level FROM territories ORDER BY level, name`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load territories")
		return
	}
	defer rows.Close()

	byID := map[string]*territoryNode{}
	order := []*territoryNode{}
	for rows.Next() {
		n := &territoryNode{Children: []*territoryNode{}}
		if err := rows.Scan(&n.ID, &n.ParentID, &n.Name, &n.Level); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to read territories")
			return
		}
		byID[n.ID] = n
		order = append(order, n)
	}
	roots := []*territoryNode{}
	for _, n := range order {
		if n.ParentID == "" {
			roots = append(roots, n)
			continue
		}
		if parent, ok := byID[n.ParentID]; ok {
			parent.Children = append(parent.Children, n)
		} else {
			roots = append(roots, n) // orphan → surface at top rather than hide
		}
	}
	writeJSON(w, http.StatusOK, roots)
}

// handleCreateTerritory — POST /api/erp/territory-tree {name, level, parentId?}.
func (s *Server) handleCreateTerritory(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var body map[string]any
	if err := decodeLooseJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	str := func(k string) string {
		if v, ok := body[k].(string); ok {
			return strings.TrimSpace(v)
		}
		return ""
	}
	name := str("name")
	level := str("level")
	if name == "" || !territoryLevels[level] {
		writeError(w, http.StatusBadRequest, "name and a valid level (national|region|state|city) are required")
		return
	}
	var parent *uuid.UUID
	if pid := str("parentId"); pid != "" {
		if u, e := uuid.Parse(pid); e == nil {
			parent = &u
		} else {
			writeError(w, http.StatusBadRequest, "invalid parentId")
			return
		}
	}
	p := principalFrom(ctx)
	var id uuid.UUID
	err := s.pool.QueryRow(ctx, `
INSERT INTO territories (name, level, parent_id, created_by)
VALUES ($1,$2,$3,$4) RETURNING id`, name, level, parent, p.UserID).Scan(&id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not create territory")
		return
	}
	s.writeAudit(ctx, p.UserID, "territory.created", "territories", id.String())
	writeJSON(w, http.StatusCreated, map[string]any{"id": id.String(), "name": name, "level": level})
}

// handleUpdateTerritory — PUT /api/erp/territory-tree/{id} {name?, parentId?}.
// Re-parenting is how the admin "adds/removes states from a region".
func (s *Server) handleUpdateTerritory(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	var body map[string]any
	if err := decodeLooseJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	if v, ok := body["name"]; ok {
		if name, _ := v.(string); strings.TrimSpace(name) != "" {
			if _, err := s.pool.Exec(ctx, `UPDATE territories SET name=$2 WHERE id=$1`, id, strings.TrimSpace(name)); err != nil {
				writeError(w, http.StatusInternalServerError, "rename failed")
				return
			}
		}
	}
	// parentId present → re-parent (empty string / null detaches to a root).
	if v, ok := body["parentId"]; ok {
		var parent *uuid.UUID
		if ps, _ := v.(string); strings.TrimSpace(ps) != "" {
			u, e := uuid.Parse(strings.TrimSpace(ps))
			if e != nil {
				writeError(w, http.StatusBadRequest, "invalid parentId")
				return
			}
			if u == id {
				writeError(w, http.StatusBadRequest, "a node cannot be its own parent")
				return
			}
			parent = &u
		}
		if _, err := s.pool.Exec(ctx, `UPDATE territories SET parent_id=$2 WHERE id=$1`, id, parent); err != nil {
			writeError(w, http.StatusInternalServerError, "re-parent failed")
			return
		}
	}
	p := principalFrom(ctx)
	s.writeAudit(ctx, p.UserID, "territory.updated", "territories", id.String())
	writeJSON(w, http.StatusOK, map[string]any{"success": true})
}

// handleDeleteTerritory — DELETE /api/erp/territory-tree/{id}. Blocked (409) if
// the node still has child nodes or mapped pincodes.
func (s *Server) handleDeleteTerritory(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	var children, pincodes int
	if err := s.pool.QueryRow(ctx,
		`SELECT (SELECT count(*) FROM territories WHERE parent_id=$1),
		        (SELECT count(*) FROM pincode_territory WHERE city_territory_id=$1)`, id).
		Scan(&children, &pincodes); err != nil {
		writeError(w, http.StatusInternalServerError, "delete precheck failed")
		return
	}
	if children > 0 || pincodes > 0 {
		writeError(w, http.StatusConflict, "cannot delete: node still has child nodes or mapped pincodes")
		return
	}
	if _, err := s.pool.Exec(ctx, `DELETE FROM territories WHERE id=$1`, id); err != nil {
		writeError(w, http.StatusInternalServerError, "delete failed")
		return
	}
	p := principalFrom(ctx)
	s.writeAudit(ctx, p.UserID, "territory.deleted", "territories", id.String())
	writeJSON(w, http.StatusOK, map[string]any{"success": true})
}

// handleListPincodeTerritory — GET /api/erp/pincode-territory?search=&limit=&offset=
func (s *Server) handleListPincodeTerritory(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	search := strings.TrimSpace(r.URL.Query().Get("search"))
	limit := 50
	if v, err := strconv.Atoi(r.URL.Query().Get("limit")); err == nil && v > 0 && v <= 500 {
		limit = v
	}
	offset := 0
	if v, err := strconv.Atoi(r.URL.Query().Get("offset")); err == nil && v > 0 {
		offset = v
	}
	args := []any{}
	where := ""
	if search != "" {
		args = append(args, "%"+search+"%")
		where = ` WHERE (pt.pincode ILIKE $1 OR pt.state ILIKE $1 OR pt.city ILIKE $1
		          OR COALESCE(t.name,'') ILIKE $1)`
	}
	var total int
	_ = s.pool.QueryRow(ctx, `SELECT count(*) FROM pincode_territory pt
		LEFT JOIN territories t ON t.id = pt.city_territory_id`+where, args...).Scan(&total)

	args = append(args, limit, offset)
	q := `SELECT pt.pincode, COALESCE(pt.city_territory_id::text,''), COALESCE(t.name,''),
	             COALESCE(pt.state,''), COALESCE(pt.city,''), COALESCE(pt.source,'')
	      FROM pincode_territory pt
	      LEFT JOIN territories t ON t.id = pt.city_territory_id` + where +
		` ORDER BY pt.pincode LIMIT $` + strconv.Itoa(len(args)-1) + ` OFFSET $` + strconv.Itoa(len(args))
	rows, err := s.pool.Query(ctx, q, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list pincodes")
		return
	}
	defer rows.Close()
	type pincodeRow struct {
		Pincode         string `json:"pincode"`
		CityTerritoryID string `json:"cityTerritoryId"`
		CityNodeName    string `json:"cityNodeName"`
		State           string `json:"state"`
		City            string `json:"city"`
		Source          string `json:"source"`
	}
	items := []pincodeRow{}
	for rows.Next() {
		var pr pincodeRow
		if err := rows.Scan(&pr.Pincode, &pr.CityTerritoryID, &pr.CityNodeName, &pr.State, &pr.City, &pr.Source); err == nil {
			items = append(items, pr)
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{"total": total, "limit": limit, "offset": offset, "data": items})
}

// handleUpsertPincodeTerritory — PUT /api/erp/pincode-territory
// {pincode, cityTerritoryId, state, city}.
func (s *Server) handleUpsertPincodeTerritory(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var body map[string]any
	if err := decodeLooseJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	str := func(k string) string {
		if v, ok := body[k].(string); ok {
			return strings.TrimSpace(v)
		}
		return ""
	}
	pincode := str("pincode")
	if pincode == "" {
		writeError(w, http.StatusBadRequest, "pincode is required")
		return
	}
	var cityID *uuid.UUID
	if cid := str("cityTerritoryId"); cid != "" {
		if u, e := uuid.Parse(cid); e == nil {
			cityID = &u
		} else {
			writeError(w, http.StatusBadRequest, "invalid cityTerritoryId")
			return
		}
	}
	p := principalFrom(ctx)
	if _, err := s.pool.Exec(ctx, `
INSERT INTO pincode_territory (pincode, city_territory_id, state, city, source, updated_by, updated_at)
VALUES ($1,$2,NULLIF($3,''),NULLIF($4,''),'admin',$5,now())
ON CONFLICT (pincode) DO UPDATE SET
  city_territory_id = EXCLUDED.city_territory_id,
  state = EXCLUDED.state, city = EXCLUDED.city,
  source = 'admin', updated_by = EXCLUDED.updated_by, updated_at = now()`,
		pincode, cityID, str("state"), str("city"), p.UserID); err != nil {
		writeError(w, http.StatusInternalServerError, "could not save pincode mapping")
		return
	}
	s.writeAudit(ctx, p.UserID, "pincode_territory.upserted", "pincode_territory", pincode)
	writeJSON(w, http.StatusOK, map[string]any{"success": true, "pincode": pincode})
}

// handleDeletePincodeTerritory — DELETE /api/erp/pincode-territory/{pincode}.
func (s *Server) handleDeletePincodeTerritory(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	pincode := strings.TrimSpace(chi.URLParam(r, "pincode"))
	if pincode == "" {
		writeError(w, http.StatusBadRequest, "invalid pincode")
		return
	}
	if _, err := s.pool.Exec(ctx, `DELETE FROM pincode_territory WHERE pincode=$1`, pincode); err != nil {
		writeError(w, http.StatusInternalServerError, "delete failed")
		return
	}
	p := principalFrom(ctx)
	s.writeAudit(ctx, p.UserID, "pincode_territory.deleted", "pincode_territory", pincode)
	writeJSON(w, http.StatusOK, map[string]any{"success": true})
}
