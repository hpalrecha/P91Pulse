// Package pincode resolves a 6-digit Indian PIN code to its state/UT name
// (India Post postal-circle prefix scheme). Ported from the stage backend
// (p91pulse_stage/backend-go/internal/store/pincode.go). Approximate but
// standard — good enough to derive a state for territory scoping when ERP
// didn't supply one.
package pincode

import "strings"

// stateByPrefix2 maps the first 2 digits of an Indian PIN code to its state/UT.
var stateByPrefix2 = map[string]string{
	"11": "Delhi",
	"12": "Haryana", "13": "Haryana",
	"14": "Punjab", "15": "Punjab", "16": "Punjab",
	"17": "Himachal Pradesh",
	"18": "Jammu and Kashmir", "19": "Jammu and Kashmir",
	"20": "Uttar Pradesh", "21": "Uttar Pradesh", "22": "Uttar Pradesh",
	"23": "Uttar Pradesh", "24": "Uttar Pradesh", "25": "Uttar Pradesh",
	"26": "Uttar Pradesh", "27": "Uttar Pradesh", "28": "Uttar Pradesh",
	"30": "Rajasthan", "31": "Rajasthan", "32": "Rajasthan",
	"33": "Rajasthan", "34": "Rajasthan",
	"36": "Gujarat", "37": "Gujarat", "38": "Gujarat", "39": "Gujarat",
	"40": "Maharashtra", "41": "Maharashtra", "42": "Maharashtra",
	"43": "Maharashtra", "44": "Maharashtra",
	"45": "Madhya Pradesh", "46": "Madhya Pradesh", "47": "Madhya Pradesh", "48": "Madhya Pradesh",
	"49": "Chhattisgarh",
	"50": "Telangana", "51": "Andhra Pradesh", "52": "Andhra Pradesh", "53": "Andhra Pradesh",
	"56": "Karnataka", "57": "Karnataka", "58": "Karnataka", "59": "Karnataka",
	"60": "Tamil Nadu", "61": "Tamil Nadu", "62": "Tamil Nadu",
	"63": "Tamil Nadu", "64": "Tamil Nadu",
	"67": "Kerala", "68": "Kerala", "69": "Kerala",
	"70": "West Bengal", "71": "West Bengal", "72": "West Bengal",
	"73": "West Bengal", "74": "West Bengal",
	"75": "Odisha", "76": "Odisha", "77": "Odisha",
	"78": "Assam",
	"79": "Arunachal Pradesh",
	"80": "Bihar", "81": "Bihar", "82": "Bihar", "83": "Bihar", "84": "Bihar", "85": "Bihar",
}

// stateByPrefix3 handles 3-digit prefixes that fall inside a 2-digit block but
// belong to a different state (the common exceptions). Checked first.
var stateByPrefix3 = map[string]string{
	"246": "Uttarakhand", "248": "Uttarakhand", "249": "Uttarakhand", "263": "Uttarakhand",
	"403": "Goa",
	"605": "Puducherry", "533": "Andhra Pradesh",
	"737": "Sikkim",
	"744": "Andaman and Nicobar Islands",
	"682": "Lakshadweep",
	"855": "Bihar",
}

// StateForPincode returns the state/UT for a 6-digit Indian PIN, or "" when the
// input is not a 6-digit number or the prefix is unknown.
func StateForPincode(pin string) string {
	pin = strings.TrimSpace(pin)
	if len(pin) != 6 {
		return ""
	}
	for _, r := range pin {
		if r < '0' || r > '9' {
			return ""
		}
	}
	if s, ok := stateByPrefix3[pin[:3]]; ok {
		return s
	}
	return stateByPrefix2[pin[:2]]
}
