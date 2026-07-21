package httpapi

import (
	"net/http"
	"time"
)

const sessionCookieName = "pulse_session"

// setSessionCookie writes the session JWT as an httpOnly cookie. SameSite=Lax +
// Path=/ is sufficient for the dev setup where the Vite proxy makes the API
// same-origin with the SPA.
func setSessionCookie(w http.ResponseWriter, token string, ttl time.Duration) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(ttl),
		MaxAge:   int(ttl.Seconds()),
	})
}

// clearSessionCookie expires the session cookie (logout).
func clearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
	})
}

// roleToFE maps the backend role codes to the role strings the ported frontend
// understands (its sidebar/menus branch on these). The greenfield uses the
// nsm/rsm/asm codes; the FE was built against the legacy long-form names.
func roleToFE(code string) string {
	switch code {
	case "nsm":
		return "national_sales_manager"
	case "rsm":
		return "regional_sales_manager"
	case "asm":
		return "asm" // first-class in the ported FE (sidebar routes it with the sales roles)
	case "platform_super_admin":
		return "admin"
	default:
		// admin, distributor, detailer, installer, salesperson, sales_partner
		return code
	}
}
