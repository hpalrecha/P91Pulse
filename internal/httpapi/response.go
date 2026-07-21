package httpapi

import (
	"encoding/json"
	"net/http"
)

// writeJSON serializes v as JSON with the given status code.
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if v != nil {
		_ = json.NewEncoder(w).Encode(v)
	}
}

// errorResponse is the uniform error envelope.
type errorResponse struct {
	Error string `json:"error"`
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, errorResponse{Error: msg})
}

// decodeJSON reads the request body into dst, rejecting unknown fields so typos
// in client payloads surface as errors instead of being silently dropped.
func decodeJSON(r *http.Request, dst any) error {
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	return dec.Decode(dst)
}

// jsonNewDecoder is the lenient counterpart used by the ported /api/erp
// endpoints, whose clients post wide payloads with extra fields.
func jsonNewDecoder(r *http.Request) *json.Decoder {
	return json.NewDecoder(r.Body)
}
