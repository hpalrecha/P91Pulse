package httpapi

import (
	"context"

	"github.com/p91/pulse/internal/rbac"
)

type ctxKey int

const principalKey ctxKey = iota

func withPrincipal(ctx context.Context, p *rbac.Principal) context.Context {
	return context.WithValue(ctx, principalKey, p)
}

// principalFrom returns the authenticated principal attached by the auth
// middleware, or nil if the request is unauthenticated.
func principalFrom(ctx context.Context) *rbac.Principal {
	p, _ := ctx.Value(principalKey).(*rbac.Principal)
	return p
}
