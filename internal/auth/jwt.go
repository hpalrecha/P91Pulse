package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var ErrInvalidToken = errors.New("invalid or expired token")

// Claims is the JWT payload carried on the access token. It is intentionally
// small: identity + role. Effective permissions are looked up per request (so
// an admin's permission change takes effect without re-login).
type Claims struct {
	UserID   uuid.UUID `json:"uid"`
	RoleCode string    `json:"role"`
	jwt.RegisteredClaims
}

// Manager issues and validates JWTs using an HMAC secret.
type Manager struct {
	secret     []byte
	accessTTL  time.Duration
	refreshTTL time.Duration
}

func NewManager(secret string, accessTTL, refreshTTL time.Duration) *Manager {
	return &Manager{secret: []byte(secret), accessTTL: accessTTL, refreshTTL: refreshTTL}
}

// IssueAccess mints a signed access token for the given identity.
func (m *Manager) IssueAccess(userID uuid.UUID, roleCode string, now time.Time) (string, error) {
	claims := Claims{
		UserID:   userID,
		RoleCode: roleCode,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(m.accessTTL)),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(m.secret)
}

// IssueSession mints a longer-lived token for cookie-based browser sessions
// (the ported frontend relies on a session cookie, not a short access token).
func (m *Manager) IssueSession(userID uuid.UUID, roleCode string, now time.Time) (string, error) {
	claims := Claims{
		UserID:   userID,
		RoleCode: roleCode,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(m.refreshTTL)),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(m.secret)
}

// Parse validates a token string and returns its claims.
func (m *Manager) Parse(tokenStr string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return m.secret, nil
	})
	if err != nil || !token.Valid {
		return nil, ErrInvalidToken
	}
	return claims, nil
}
