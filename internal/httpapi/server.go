// Package httpapi wires the REST API: router, middleware and handlers.
package httpapi

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/p91/pulse/internal/auth"
	"github.com/p91/pulse/internal/db/sqlc"
	"github.com/p91/pulse/internal/vas"
)

// Server holds the dependencies shared by all handlers.
type Server struct {
	q          *sqlc.Queries
	pool       *pgxpool.Pool
	auth       *auth.Manager
	corsOrigin string
	vas        *vas.Gateway
}

func NewServer(pool *pgxpool.Pool, authMgr *auth.Manager, corsOrigin string, vasGW *vas.Gateway) *Server {
	return &Server{
		q:          sqlc.New(pool),
		pool:       pool,
		auth:       authMgr,
		corsOrigin: corsOrigin,
		vas:        vasGW,
	}
}

// Router builds the HTTP handler tree.
func (s *Server) Router() http.Handler {
	r := chi.NewRouter()
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Recoverer)
	r.Use(s.cors)

	r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	r.Route("/api", func(r chi.Router) {
		// Public
		r.Post("/auth/login", s.handleLogin)
		// Public onboarding: an invitee validates their link + submits the form.
		r.Get("/erp/invites/{token}", s.handleValidateInvite)
		r.Post("/erp/onboarding/signup", s.handleOnboardingSignup)

		// Authenticated
		r.Group(func(r chi.Router) {
			r.Use(s.authenticate)

			r.Get("/auth/me", s.handleMe)
			r.Post("/auth/logout", s.handleLogout)
			r.Get("/me/permissions", s.handleMyPermissions)

			// Frontend-facing (ported p91pulse_stage) contract under /api/erp.
			r.Get("/erp/me", s.handleErpMe)
			r.Get("/erp/my-coverage", s.handleMyCoverage)

			// VAS (SetuPPF) embedded tabs — SSO proxy, role-scoped.
			r.Get("/vas/me", s.handleVASMe)
			r.HandleFunc("/vas/*", s.handleVASProxy)

			// Dashboard
			r.Get("/erp/admin/dashboard-stats", s.handleDashboardStats)
			r.Get("/erp/admin/activity", s.handleAdminActivity)
			r.With(requirePerm("users_rbac", "view")).Get("/erp/admin/provisioned-logins", s.handleProvisionedLogins)
			r.With(requirePerm("leads", "view")).Get("/erp/admin/leads-overview", s.handleLeadsOverview)
			r.With(requirePerm("leads", "view")).Get("/erp/leads-insights", s.handleLeadsInsights)
			r.Get("/warranty-registrations", emptyList)
			r.Get("/warranty-registrations/{id}", func(w http.ResponseWriter, _ *http.Request) {
				writeError(w, http.StatusNotFound, "not found")
			})
			r.Get("/installer-applications", emptyList)
			r.Get("/contact-submissions", emptyList)
			r.Get("/webhook-deliveries", emptyList)
			r.Get("/ppf-partner-applications", emptyList)
			r.Get("/erp/pulse-applications", emptyList)

			// User management (ported UI contract)
			r.Route("/erp/users", func(r chi.Router) {
				r.With(requirePerm("users_rbac", "view")).Get("/", s.handleErpListUsers)
				r.With(requirePerm("users_rbac", "create")).Post("/create", s.handleErpCreateUser)
				r.With(requirePerm("users_rbac", "view")).Get("/{id}", s.handleErpGetUser)
				r.With(requirePerm("users_rbac", "edit")).Put("/{id}", s.handleErpUpdateUser)
				r.With(requirePerm("users_rbac", "delete")).Delete("/{id}", s.handleErpDeleteUser)
				r.With(requirePerm("users_rbac", "approve")).Post("/{id}/approve", s.handleErpUserAction("approve"))
				r.With(requirePerm("users_rbac", "approve")).Post("/{id}/reject", s.handleErpUserAction("reject"))
				r.With(requirePerm("users_rbac", "edit")).Post("/{id}/enable", s.handleErpUserAction("enable"))
				r.With(requirePerm("users_rbac", "edit")).Post("/{id}/disable", s.handleErpUserAction("disable"))
				r.With(requirePerm("users_rbac", "edit")).Post("/{id}/password-reset", s.handleErpUserAction("password-reset"))
				r.With(requirePerm("users_rbac", "edit")).Put("/{id}/assign-distributor", s.handleErpAssignDistributor)
			})
			r.With(requirePerm("users_rbac", "view")).Get("/erp/distributors", s.handleErpListDistributors)
			r.With(requirePerm("users_rbac", "view")).Get("/erp/sales-partners", s.handleListSalesPartners)
			r.With(requirePerm("users_rbac", "create")).Post("/erp/invites", s.handleCreateInvite)
			r.With(requirePerm("users_rbac", "edit")).Patch("/users/{id}/ppf-setu-access", s.handlePpfSetuAccess)

			// Lead management (B2C flow)
			r.Route("/erp/customers", func(r chi.Router) {
				r.With(requirePerm("leads", "view")).Get("/", s.handleListCustomers)
				r.With(requirePerm("leads", "create")).Post("/", s.handleCreateCustomer)
				r.Get("/pincode/{pin}", s.handlePincodeLookup)
				r.With(requirePerm("leads", "edit")).Patch("/{id}", s.handlePatchCustomer)
				r.With(requirePerm("leads", "view")).Get("/{id}/comments", s.handleLeadComments)
				r.With(requirePerm("leads", "edit")).Post("/{id}/comments", s.handleLeadComments)
				r.With(requirePerm("leads", "view")).Get("/{id}/activity", s.handleLeadActivity)
				r.With(requirePerm("leads", "view")).Get("/{id}/erp-doc", s.handleLeadErpDoc)
				r.With(requirePerm("leads", "edit")).Put("/{id}/erp-lead", s.handleLeadErpEdit)
				r.With(requirePerm("leads", "edit")).Post("/{id}/tasks", s.handleLeadTaskOrEvent("task"))
				r.With(requirePerm("leads", "edit")).Post("/{id}/events", s.handleLeadTaskOrEvent("event"))
			})
			r.Get("/erp/pincode/{pin}", s.handlePincodeLookup)

			// Vehicle catalog (create-lead dialog)
			r.Get("/erp/vehicle-management/brands", s.handleVehicleBrands)
			r.Post("/erp/vehicle-management/brands", s.handleVehicleBrands)
			r.Get("/erp/vehicle-management/models", s.handleVehicleModels)
			r.Post("/erp/vehicle-management/models", s.handleVehicleModels)

			// Users & RBAC
			r.Route("/users", func(r chi.Router) {
				r.With(requirePerm("users_rbac", "view")).Get("/", s.handleListUsers)
				r.With(requirePerm("users_rbac", "create")).Post("/", s.handleCreateUser)
				r.With(requirePerm("users_rbac", "view")).Get("/{id}", s.handleGetUser)
				r.With(requirePerm("users_rbac", "edit")).Put("/{id}", s.handleUpdateUser)
				r.With(requirePerm("users_rbac", "delete")).Delete("/{id}", s.handleDeleteUser)
				r.With(requirePerm("users_rbac", "edit")).Post("/{id}/status", s.handleSetUserStatus)
				r.With(requirePerm("users_rbac", "edit")).Post("/{id}/active", s.handleSetUserActive)
				r.With(requirePerm("users_rbac", "edit")).Post("/{id}/password", s.handleSetUserPassword)
				r.With(requirePerm("users_rbac", "view")).Get("/{id}/permissions", s.handleGetUserPermissions)
				r.With(requirePerm("users_rbac", "edit")).Put("/{id}/permissions", s.handleSetUserPermissions)
			})

			// Reference data for the admin UI
			r.With(requirePerm("users_rbac", "view")).Get("/roles", s.handleListRoles)
			r.With(requirePerm("users_rbac", "view")).Get("/permissions", s.handleListPermissions)
			r.With(requirePerm("users_rbac", "view")).Get("/brands", s.handleListBrands)
		})
	})

	// Serve the built frontend (web/dist) for everything else. No-op if the
	// dist folder isn't present (local `go run` during frontend dev).
	mountStatic(r, "./web/dist")

	return r
}
