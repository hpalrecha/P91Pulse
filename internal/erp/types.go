package erp

import (
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"
)

// Config holds the ERPNext connection settings.
// ID tags rows written to Postgres (customers.erp_source etc.); this build is
// single-source, so it defaults to "p91".
type Config struct {
	ID        string
	BaseURL   string
	APIKey    string
	APISecret string
}

// ConfigFromEnv reads ERPNEXT_BASE_URL / ERPNEXT_API_KEY / ERPNEXT_API_SECRET.
// Call godotenv.Load() first (cmd/sync does) if you rely on a .env file.
func ConfigFromEnv() (Config, error) {
	cfg := Config{
		ID:        "p91",
		BaseURL:   strings.TrimRight(strings.TrimSpace(os.Getenv("ERPNEXT_BASE_URL")), "/"),
		APIKey:    strings.TrimSpace(os.Getenv("ERPNEXT_API_KEY")),
		APISecret: strings.TrimSpace(os.Getenv("ERPNEXT_API_SECRET")),
	}
	var missing []string
	if cfg.BaseURL == "" {
		missing = append(missing, "ERPNEXT_BASE_URL")
	}
	if cfg.APIKey == "" {
		missing = append(missing, "ERPNEXT_API_KEY")
	}
	if cfg.APISecret == "" {
		missing = append(missing, "ERPNEXT_API_SECRET")
	}
	if len(missing) > 0 {
		return cfg, fmt.Errorf("erp config: missing %s", strings.Join(missing, ", "))
	}
	return cfg, nil
}

// Doc is one Frappe document (or list row) as decoded JSON. Frappe is loose
// about numeric vs string values (custom_score is a float, child-table pincodes
// are ints, ...), so accessors coerce instead of asserting.
type Doc map[string]any

// Str returns the value at key as a trimmed string. Numbers are formatted
// without a trailing ".0" (e.g. a pincode stored as int 400001 -> "400001").
// Missing/null keys return "".
func (d Doc) Str(key string) string {
	switch v := d[key].(type) {
	case nil:
		return ""
	case string:
		return strings.TrimSpace(v)
	case float64:
		if v == float64(int64(v)) {
			return strconv.FormatInt(int64(v), 10)
		}
		return strconv.FormatFloat(v, 'f', -1, 64)
	case json.Number:
		return v.String()
	case bool:
		if v {
			return "1"
		}
		return "0"
	default:
		return strings.TrimSpace(fmt.Sprint(v))
	}
}

// F64 returns the value at key as a float64, coercing strings ("87" or "87.5")
// and JSON numbers. Missing/null/unparseable values return 0.
func (d Doc) F64(key string) float64 {
	switch v := d[key].(type) {
	case float64:
		return v
	case json.Number:
		f, _ := v.Float64()
		return f
	case string:
		f, _ := strconv.ParseFloat(strings.TrimSpace(v), 64)
		return f
	case int:
		return float64(v)
	case int64:
		return float64(v)
	default:
		return 0
	}
}

// Rows returns the child-table rows stored at key (Frappe returns child tables
// as arrays of objects on the full document). Missing or non-array values
// return nil.
func (d Doc) Rows(key string) []Doc {
	arr, ok := d[key].([]any)
	if !ok {
		return nil
	}
	out := make([]Doc, 0, len(arr))
	for _, it := range arr {
		if m, ok := it.(map[string]any); ok {
			out = append(out, Doc(m))
		}
	}
	return out
}
