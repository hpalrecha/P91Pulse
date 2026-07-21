package httpapi

import (
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/p91/pulse/internal/auth"
	"github.com/p91/pulse/internal/db/sqlc"
)

// --- list -------------------------------------------------------------------

func (s *Server) handleListUsers(w http.ResponseWriter, r *http.Request) {
	var arg sqlc.ListUsersParams
	if v := strings.TrimSpace(r.URL.Query().Get("role")); v != "" {
		arg.RoleCode = &v
	}
	if v := strings.TrimSpace(r.URL.Query().Get("status")); v != "" {
		arg.Status = &v
	}
	if v := strings.TrimSpace(r.URL.Query().Get("search")); v != "" {
		arg.Search = &v
	}
	rows, err := s.q.ListUsers(r.Context(), arg)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list users")
		return
	}
	if rows == nil {
		rows = []sqlc.ListUsersRow{}
	}
	writeJSON(w, http.StatusOK, rows)
}

// --- create -----------------------------------------------------------------

type createUserRequest struct {
	Name     string   `json:"name"`
	Email    *string  `json:"email"`
	Phone    *string  `json:"phone"`
	Username *string  `json:"username"`
	Password *string  `json:"password"`
	RoleCode string   `json:"role_code"`
	BrandIDs []string `json:"brand_ids"` // per-user brand access (may be some, not all)
	ParentID *string  `json:"parent_user_id"`
	Approved *bool    `json:"approved"` // toggle -> status approved/pending
}

func (s *Server) handleCreateUser(w http.ResponseWriter, r *http.Request) {
	var req createUserRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if strings.TrimSpace(req.Name) == "" || req.RoleCode == "" {
		writeError(w, http.StatusBadRequest, "name and role_code are required")
		return
	}

	// Golden rule: phone is ALWAYS required.
	phone := normalizePhone(req.Phone)
	if phone == nil || len(*phone) < 10 {
		writeError(w, http.StatusBadRequest, "a valid 10-digit phone number is required")
		return
	}

	role, err := s.q.GetRoleByCode(r.Context(), req.RoleCode)
	if err != nil {
		writeError(w, http.StatusBadRequest, "unknown role_code: "+req.RoleCode)
		return
	}

	// Parse brand ids up front.
	brandIDs := make([]uuid.UUID, 0, len(req.BrandIDs))
	for _, b := range req.BrandIDs {
		id, err := uuid.Parse(b)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid brand id: "+b)
			return
		}
		brandIDs = append(brandIDs, id)
	}

	arg := sqlc.CreateUserParams{
		RoleID:   role.ID,
		Name:     strings.TrimSpace(req.Name),
		Email:    normalizeEmail(req.Email),
		Phone:    *phone,
		Username: req.Username,
		IsActive: true,
	}
	if req.ParentID != nil {
		id, err := uuid.Parse(*req.ParentID)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid parent_user_id")
			return
		}
		arg.ParentUserID = &id
	}
	if req.Password != nil && *req.Password != "" {
		hash, err := auth.HashPassword(*req.Password)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "could not hash password")
			return
		}
		arg.PasswordHash = &hash
	}
	// Approved toggle -> status.
	if req.Approved != nil && *req.Approved {
		arg.Status = "approved"
	} else {
		arg.Status = "pending"
	}

	// Create user + brand access atomically.
	tx, err := s.pool.Begin(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not start transaction")
		return
	}
	defer tx.Rollback(r.Context())
	qtx := s.q.WithTx(tx)

	user, err := qtx.CreateUser(r.Context(), arg)
	if err != nil {
		writeError(w, http.StatusConflict, "could not create user (duplicate email/phone/username?)")
		return
	}
	for _, bid := range brandIDs {
		if err := qtx.AddUserBrand(r.Context(), sqlc.AddUserBrandParams{UserID: user.ID, BrandID: bid}); err != nil {
			writeError(w, http.StatusBadRequest, "could not assign brand")
			return
		}
	}
	if err := tx.Commit(r.Context()); err != nil {
		writeError(w, http.StatusInternalServerError, "could not commit")
		return
	}
	writeJSON(w, http.StatusCreated, user)
}

// --- get / update / delete --------------------------------------------------

func (s *Server) handleGetUser(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	row, err := s.q.GetUserByID(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	writeJSON(w, http.StatusOK, row)
}

type updateUserRequest struct {
	Name     *string  `json:"name"`
	Email    *string  `json:"email"`
	Phone    *string  `json:"phone"`
	Username *string  `json:"username"`
	RoleCode *string  `json:"role_code"`
	BrandIDs []string `json:"brand_ids"` // when present, replaces the user's brand access set
	ParentID *string  `json:"parent_user_id"`
}

func (s *Server) handleUpdateUser(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	var req updateUserRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	arg := sqlc.UpdateUserParams{
		ID:       id,
		Name:     req.Name,
		Email:    normalizeEmail(req.Email),
		Phone:    normalizePhone(req.Phone),
		Username: req.Username,
	}
	if req.RoleCode != nil {
		role, err := s.q.GetRoleByCode(r.Context(), *req.RoleCode)
		if err != nil {
			writeError(w, http.StatusBadRequest, "unknown role_code")
			return
		}
		arg.RoleID = &role.ID
	}
	if req.ParentID != nil {
		pid, err := uuid.Parse(*req.ParentID)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid parent_user_id")
			return
		}
		arg.ParentUserID = &pid
	}

	var brandIDs []uuid.UUID
	if req.BrandIDs != nil {
		brandIDs = make([]uuid.UUID, 0, len(req.BrandIDs))
		for _, b := range req.BrandIDs {
			bid, err := uuid.Parse(b)
			if err != nil {
				writeError(w, http.StatusBadRequest, "invalid brand id: "+b)
				return
			}
			brandIDs = append(brandIDs, bid)
		}
	}

	tx, err := s.pool.Begin(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not start transaction")
		return
	}
	defer tx.Rollback(r.Context())
	qtx := s.q.WithTx(tx)

	user, err := qtx.UpdateUser(r.Context(), arg)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not update user")
		return
	}
	if req.BrandIDs != nil {
		if err := qtx.ClearUserBrands(r.Context(), id); err != nil {
			writeError(w, http.StatusInternalServerError, "could not update brand access")
			return
		}
		for _, bid := range brandIDs {
			if err := qtx.AddUserBrand(r.Context(), sqlc.AddUserBrandParams{UserID: id, BrandID: bid}); err != nil {
				writeError(w, http.StatusBadRequest, "could not assign brand")
				return
			}
		}
	}
	if err := tx.Commit(r.Context()); err != nil {
		writeError(w, http.StatusInternalServerError, "could not commit")
		return
	}
	writeJSON(w, http.StatusOK, user)
}

func (s *Server) handleDeleteUser(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	if err := s.q.DeleteUser(r.Context(), id); err != nil {
		writeError(w, http.StatusInternalServerError, "could not delete user")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// --- status / active / password --------------------------------------------

type statusRequest struct {
	Status string `json:"status"` // approved | rejected | pending
}

func (s *Server) handleSetUserStatus(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	var req statusRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	switch req.Status {
	case "approved", "rejected", "pending":
	default:
		writeError(w, http.StatusBadRequest, "status must be approved, rejected or pending")
		return
	}
	if err := s.q.SetUserStatus(r.Context(), sqlc.SetUserStatusParams{ID: id, Status: req.Status}); err != nil {
		writeError(w, http.StatusInternalServerError, "could not update status")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": req.Status})
}

type activeRequest struct {
	IsActive bool `json:"is_active"`
}

func (s *Server) handleSetUserActive(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	var req activeRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := s.q.SetUserActive(r.Context(), sqlc.SetUserActiveParams{ID: id, IsActive: req.IsActive}); err != nil {
		writeError(w, http.StatusInternalServerError, "could not update active state")
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"is_active": req.IsActive})
}

type passwordRequest struct {
	Password string `json:"password"`
}

func (s *Server) handleSetUserPassword(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	var req passwordRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if len(req.Password) < 8 {
		writeError(w, http.StatusBadRequest, "password must be at least 8 characters")
		return
	}
	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not hash password")
		return
	}
	if err := s.q.SetUserPassword(r.Context(), sqlc.SetUserPasswordParams{ID: id, PasswordHash: &hash}); err != nil {
		writeError(w, http.StatusInternalServerError, "could not set password")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "password updated"})
}

// --- per-user permission overrides -----------------------------------------

func (s *Server) handleGetUserPermissions(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	eff, err := s.q.GetUserEffectivePermissions(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not load permissions")
		return
	}
	over, err := s.q.ListUserOverrides(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not load overrides")
		return
	}
	effective := make([]string, 0, len(eff))
	for _, p := range eff {
		effective = append(effective, p.Module+":"+p.Action)
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"effective": effective,
		"overrides": over,
	})
}

type permOverride struct {
	Module  string `json:"module"`
	Action  string `json:"action"`
	Granted bool   `json:"granted"`
}

type setPermissionsRequest struct {
	Overrides []permOverride `json:"overrides"`
}

// handleSetUserPermissions replaces a user's override set atomically: clear all,
// then re-apply the submitted overrides in one transaction.
func (s *Server) handleSetUserPermissions(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	var req setPermissionsRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	tx, err := s.pool.Begin(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not start transaction")
		return
	}
	defer tx.Rollback(r.Context())
	qtx := s.q.WithTx(tx)

	if err := qtx.ClearUserOverrides(r.Context(), id); err != nil {
		writeError(w, http.StatusInternalServerError, "could not clear overrides")
		return
	}
	for _, o := range req.Overrides {
		perm, err := qtx.GetPermissionByModuleAction(r.Context(), sqlc.GetPermissionByModuleActionParams{
			Module: o.Module, Action: o.Action,
		})
		if err != nil {
			writeError(w, http.StatusBadRequest, "unknown permission: "+o.Module+":"+o.Action)
			return
		}
		if err := qtx.UpsertUserOverride(r.Context(), sqlc.UpsertUserOverrideParams{
			UserID: id, PermissionID: perm.ID, Granted: o.Granted,
		}); err != nil {
			writeError(w, http.StatusInternalServerError, "could not save override")
			return
		}
	}
	if err := tx.Commit(r.Context()); err != nil {
		writeError(w, http.StatusInternalServerError, "could not commit")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "permissions updated"})
}

// --- helpers ----------------------------------------------------------------

func parseID(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return uuid.Nil, false
	}
	return id, true
}

func normalizeEmail(e *string) *string {
	if e == nil {
		return nil
	}
	v := strings.ToLower(strings.TrimSpace(*e))
	if v == "" {
		return nil
	}
	return &v
}

// normalizePhone keeps only digits and retains the last 10 (Indian mobile),
// so the same number always keys the same way regardless of +91/spacing.
func normalizePhone(p *string) *string {
	if p == nil {
		return nil
	}
	var digits strings.Builder
	for _, c := range *p {
		if c >= '0' && c <= '9' {
			digits.WriteRune(c)
		}
	}
	d := digits.String()
	if len(d) > 10 {
		d = d[len(d)-10:]
	}
	if d == "" {
		return nil
	}
	return &d
}

var _ = errors.Is // reserved for future typed error handling
