// Package vas is the Pulse⇄VAS(SetuPPF) gateway: it exchanges a Pulse identity
// for a per-user VAS token (SSO), then proxies scoped VAS API calls so VAS tabs
// render inside Pulse with no second login. VAS's own role checks enforce
// access — the gateway authorizes nothing itself (auth passthrough).
package vas

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"
)

// VASUser is the subset of the VAS user we surface to Pulse.
type VASUser struct {
	ID        string `json:"id"`
	Role      string `json:"role"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
	PartnerID string `json:"partnerId"`
}

type cachedToken struct {
	token   string
	user    VASUser
	expires time.Time
}

// Gateway talks to a SetuPPF instance. Enabled() reports whether it's configured.
type Gateway struct {
	baseURL string
	webURL  string
	secret  string
	http    *http.Client

	mu    sync.Mutex
	cache map[string]cachedToken // keyed by identifier
}

func New(baseURL, webURL, secret string) *Gateway {
	return &Gateway{
		baseURL: strings.TrimRight(baseURL, "/"),
		webURL:  webURL,
		secret:  secret,
		http:    &http.Client{Timeout: 20 * time.Second},
		cache:   map[string]cachedToken{},
	}
}

func (g *Gateway) Enabled() bool { return g != nil && g.baseURL != "" }
func (g *Gateway) WebURL() string { return g.webURL }

// sign produces the exact bytes to send plus the hex HMAC over them. VAS verifies
// the signature over JSON.stringify(body) — its re-serialization of our bytes —
// so we disable HTML escaping to match Express's output.
func (g *Gateway) sign(v any) ([]byte, string, error) {
	var buf bytes.Buffer
	enc := json.NewEncoder(&buf)
	enc.SetEscapeHTML(false)
	if err := enc.Encode(v); err != nil {
		return nil, "", err
	}
	body := bytes.TrimRight(buf.Bytes(), "\n")
	mac := hmac.New(sha256.New, []byte(g.secret))
	mac.Write(body)
	return body, hex.EncodeToString(mac.Sum(nil)), nil
}

// MintToken exchanges a Pulse identity for a VAS token via /api/sso/pulse.
// Cached per identifier until shortly before the 7-day VAS token expires.
func (g *Gateway) MintToken(identifier string) (string, VASUser, error) {
	g.mu.Lock()
	if c, ok := g.cache[identifier]; ok && time.Now().Before(c.expires) {
		g.mu.Unlock()
		return c.token, c.user, nil
	}
	g.mu.Unlock()

	body, sig, err := g.sign(map[string]string{"identifier": identifier})
	if err != nil {
		return "", VASUser{}, err
	}
	req, _ := http.NewRequest(http.MethodPost, g.baseURL+"/api/sso/pulse", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-pulse-signature", sig)
	resp, err := g.http.Do(req)
	if err != nil {
		return "", VASUser{}, err
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return "", VASUser{}, fmt.Errorf("vas sso: %d %s", resp.StatusCode, strings.TrimSpace(string(raw)))
	}
	var out struct {
		Token string  `json:"token"`
		User  VASUser `json:"user"`
	}
	if err := json.Unmarshal(raw, &out); err != nil {
		return "", VASUser{}, err
	}
	g.mu.Lock()
	g.cache[identifier] = cachedToken{token: out.Token, user: out.User, expires: time.Now().Add(6 * 24 * time.Hour)}
	g.mu.Unlock()
	return out.Token, out.User, nil
}

// Do forwards a request to VAS with the user's bearer token and returns the raw
// status + body (the proxy streams these straight back to the Pulse frontend).
func (g *Gateway) Do(method, path, token string, body io.Reader) (int, []byte, error) {
	req, err := http.NewRequest(method, g.baseURL+path, body)
	if err != nil {
		return 0, nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	resp, err := g.http.Do(req)
	if err != nil {
		return 0, nil, err
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)
	return resp.StatusCode, raw, nil
}

// Login proxies a VAS credential login (used by Pulse's central login to detect
// and redirect VAS-native users). Returns the VAS role + token, or an error.
func (g *Gateway) Login(identifier, password string) (VASUser, string, error) {
	payload, _ := json.Marshal(map[string]string{"email": identifier, "password": password})
	req, _ := http.NewRequest(http.MethodPost, g.baseURL+"/api/auth/login", bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	resp, err := g.http.Do(req)
	if err != nil {
		return VASUser{}, "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return VASUser{}, "", fmt.Errorf("vas login failed: %d", resp.StatusCode)
	}
	raw, _ := io.ReadAll(resp.Body)
	var out struct {
		Token string `json:"token"`
		User  struct {
			ID    string `json:"id"`
			Role  string `json:"role"`
			Name  string `json:"name"`
			Email string `json:"email"`
			Phone string `json:"phone"`
		} `json:"user"`
	}
	if err := json.Unmarshal(raw, &out); err != nil {
		return VASUser{}, "", err
	}
	return VASUser{ID: out.User.ID, Role: out.User.Role, Name: out.User.Name, Email: out.User.Email, Phone: out.User.Phone}, out.Token, nil
}
