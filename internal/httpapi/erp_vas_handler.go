package httpapi

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

// VAS (SetuPPF) provisioning — port of stage ppf-setu-webhook.ts.
// Pulse is the identity source of truth for VAS: toggling access fires the
// HMAC-signed user-access webhook that creates/activates the partner there.
// Payload contract (verified against SetuPPF pulseWebhookService):
//   POST {PPF_SETU_WEBHOOK_URL}  header x-pulse-signature: hex(hmacSHA256(body, PULSE_WEBHOOK_SECRET))
//   {action: activate|deactivate, user: {name, username, phone, email, role: STUDIO|INSTALLER, partnerId}, timestamp}

type vasWebhookPayload struct {
	Action string `json:"action"`
	User   struct {
		Name      string `json:"name"`
		Username  string `json:"username"`
		Phone     string `json:"phone"`
		Email     string `json:"email"`
		Role      string `json:"role"`
		PartnerID string `json:"partnerId"`
	} `json:"user"`
	Timestamp string `json:"timestamp"`
}

// sendVasWebhook fires the user-access webhook. Graceful dev mode: when the
// URL/secret are not configured it logs the signed payload and reports ok so
// the local flag still toggles.
func sendVasWebhook(action, name, username, phone, email, partnerType, partnerID string) error {
	url := os.Getenv("PPF_SETU_WEBHOOK_URL")
	secret := os.Getenv("PULSE_WEBHOOK_SECRET")

	var p vasWebhookPayload
	p.Action = action
	p.User.Name = name
	p.User.Username = username
	p.User.Phone = phone
	p.User.Email = email
	p.User.Role = partnerType // STUDIO | INSTALLER
	p.User.PartnerID = partnerID
	p.Timestamp = time.Now().UTC().Format(time.RFC3339)

	// VAS verifies the HMAC over JSON.stringify(req.body) — its re-stringified
	// parse of our bytes. Disable Go's HTML escaping (< etc.) so our sent
	// bytes match what Express will re-stringify (docs/VAS-INTEGRATION-PLAN.md).
	var buf bytes.Buffer
	enc := json.NewEncoder(&buf)
	enc.SetEscapeHTML(false)
	if err := enc.Encode(p); err != nil {
		return err
	}
	body := bytes.TrimRight(buf.Bytes(), "\n")
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	sig := hex.EncodeToString(mac.Sum(nil))

	if url == "" || secret == "" {
		log.Printf("VAS webhook DRY-RUN (PPF_SETU_WEBHOOK_URL/PULSE_WEBHOOK_SECRET not set): %s x-pulse-signature=%s body=%s",
			action, sig, string(body))
		return nil
	}

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-pulse-signature", sig)
	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("VAS webhook returned %d", resp.StatusCode)
	}
	log.Printf("VAS webhook %s ok for %s (%s)", action, name, partnerType)
	return nil
}
