// Package rbac holds the pure permission model used to enforce access.
// It is deliberately storage-agnostic: the HTTP layer loads a user's effective
// permissions (role template +/- overrides) and builds a Set for the request.
package rbac

import "github.com/google/uuid"

// Perm is a single "module:action" capability.
type Perm struct {
	Module string
	Action string
}

// Set is the effective permission set for one request.
type Set map[Perm]struct{}

func NewSet(perms []Perm) Set {
	s := make(Set, len(perms))
	for _, p := range perms {
		s[p] = struct{}{}
	}
	return s
}

// Has reports whether the set grants module:action.
func (s Set) Has(module, action string) bool {
	_, ok := s[Perm{Module: module, Action: action}]
	return ok
}

// Principal is the authenticated identity for a request, carried in context.
type Principal struct {
	UserID      uuid.UUID
	RoleCode    string
	Permissions Set
}

// IsPlatform reports whether this principal is the platform super-admin tier,
// which governs platform config, not business data.
func (p *Principal) IsPlatform() bool { return p.RoleCode == "platform_super_admin" }
