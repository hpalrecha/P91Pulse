// Package erp is a thin read client for the ERPNext (Frappe) REST API.
// Auth is Frappe token auth ("Authorization: token KEY:SECRET"); reads go
// through the paged /api/resource/{doctype} endpoint.
package erp

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

type Client struct {
	// ID tags rows written to Postgres (erp_source); "p91" in this build.
	ID      string
	baseURL string
	token   string // "api_key:api_secret"
	http    *http.Client
}

// NewClient builds a client from an explicit Config.
func NewClient(cfg Config) *Client {
	return &Client{
		ID:      cfg.ID,
		baseURL: strings.TrimRight(cfg.BaseURL, "/"),
		token:   cfg.APIKey + ":" + cfg.APISecret,
		http:    &http.Client{Timeout: 60 * time.Second},
	}
}

// NewClientFromEnv builds a client from ERPNEXT_BASE_URL / ERPNEXT_API_KEY /
// ERPNEXT_API_SECRET (load .env first via godotenv.Load()).
func NewClientFromEnv() (*Client, error) {
	cfg, err := ConfigFromEnv()
	if err != nil {
		return nil, err
	}
	return NewClient(cfg), nil
}

// get retries transient failures (network/DNS/timeout, 429, 5xx) with capped
// exponential backoff so a flaky link doesn't abort a long backfill.
func (c *Client) get(ctx context.Context, path string, q url.Values) ([]byte, error) {
	var lastErr error
	for attempt := 0; attempt < 5; attempt++ {
		if attempt > 0 {
			d := time.Duration(500*(1<<uint(attempt-1))) * time.Millisecond
			if d > 8*time.Second {
				d = 8 * time.Second
			}
			select {
			case <-time.After(d):
			case <-ctx.Done():
				return nil, ctx.Err()
			}
		}
		body, status, err := c.doOnce(ctx, path, q)
		if err != nil {
			lastErr = err // network/DNS/timeout -> retry
			continue
		}
		if status == http.StatusTooManyRequests || status >= 500 {
			lastErr = fmt.Errorf("erp[%s] GET %s -> %d: %s", c.ID, path, status, snippet(body))
			continue
		}
		if status < 200 || status >= 300 {
			return nil, fmt.Errorf("erp[%s] GET %s -> %d: %s", c.ID, path, status, snippet(body))
		}
		return body, nil
	}
	return nil, fmt.Errorf("erp[%s] GET %s failed after retries: %w", c.ID, path, lastErr)
}

func (c *Client) doOnce(ctx context.Context, path string, q url.Values) ([]byte, int, error) {
	u := c.baseURL + path
	if len(q) > 0 {
		u += "?" + q.Encode()
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, 0, err
	}
	req.Header.Set("Authorization", "token "+c.token)
	req.Header.Set("Accept", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, resp.StatusCode, err
	}
	return body, resp.StatusCode, nil
}

// List fetches one page of documents from /api/resource/{doctype}.
//
//   - fields:        Frappe field list (nil/empty -> Frappe's default columns).
//   - filters:       optional raw Frappe filters JSON, e.g. `[["status","=","Open"]]`.
//   - modifiedAfter: when non-empty, appends ["modified", ">", modifiedAfter]
//     (the incremental-cursor filter).
//   - limitStart / pageLen: paging (limit_start / limit_page_length).
//
// Results are always ordered "modified asc" so the caller's cursor
// (max modified seen) advances deterministically page by page.
func (c *Client) List(ctx context.Context, doctype string, fields []string, filters, modifiedAfter string, limitStart, pageLen int) ([]Doc, error) {
	var fl []any
	if strings.TrimSpace(filters) != "" {
		if err := json.Unmarshal([]byte(filters), &fl); err != nil {
			return nil, fmt.Errorf("erp[%s] bad filters JSON %q: %w", c.ID, filters, err)
		}
	}
	if modifiedAfter != "" {
		fl = append(fl, []any{"modified", ">", modifiedAfter})
	}

	q := url.Values{}
	if len(fields) > 0 {
		b, _ := json.Marshal(fields)
		q.Set("fields", string(b))
	}
	if len(fl) > 0 {
		b, _ := json.Marshal(fl)
		q.Set("filters", string(b))
	}
	if pageLen > 0 {
		q.Set("limit_page_length", strconv.Itoa(pageLen))
	}
	if limitStart > 0 {
		q.Set("limit_start", strconv.Itoa(limitStart))
	}
	q.Set("order_by", "modified asc")

	body, err := c.get(ctx, "/api/resource/"+url.PathEscape(doctype), q)
	if err != nil {
		return nil, err
	}
	var out struct {
		Data []Doc `json:"data"`
	}
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, fmt.Errorf("erp[%s] decode %s list: %w", c.ID, doctype, err)
	}
	return out.Data, nil
}

// GetDoc fetches one full document (including child tables) from
// /api/resource/{doctype}/{name}.
func (c *Client) GetDoc(ctx context.Context, doctype, name string) (Doc, error) {
	body, err := c.get(ctx, "/api/resource/"+url.PathEscape(doctype)+"/"+url.PathEscape(name), nil)
	if err != nil {
		return nil, err
	}
	var out struct {
		Data Doc `json:"data"`
	}
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, fmt.Errorf("erp[%s] decode %s/%s: %w", c.ID, doctype, name, err)
	}
	return out.Data, nil
}

func snippet(b []byte) string {
	s := string(b)
	if len(s) > 300 {
		return s[:300] + "..."
	}
	return s
}
