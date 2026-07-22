import React from "react";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, lazy, Suspense } from "react";
import { MainLayout } from "./layouts/MainLayout";
import SidebarLayout from "@/components/layouts/sidebar-layout";
import NotFound from "@/pages/not-found";
// Pages are lazy-loaded so each route ships its own JS chunk instead of being
// bundled into one giant graph reachable from App.tsx. This drastically cuts the
// initial load (and dev-server module count). A <Suspense> boundary in App()
// covers all of these. NotFound + the layouts stay eager (tiny, always needed).
const HomePage = lazy(() => import("@/pages/home"));
const AboutPage = lazy(() => import("@/pages/about"));
const PPFPage = lazy(() => import("@/pages/products/ppf"));
const CeramicCoatingPage = lazy(() => import("@/pages/products/ceramic"));
const HomeCoatingPage = lazy(() => import("@/pages/products/home-coating"));
const StorePage = lazy(() => import("@/pages/store"));
const DistributorsPage = lazy(() => import("@/pages/partners/distributors"));
const InstallersPage = lazy(() => import("@/pages/partners/installers"));
const WarrantyPage = lazy(() => import("@/pages/warranty"));
const ContactPage = lazy(() => import("@/pages/contact"));
const P91PulsePage = lazy(() => import("@/pages/p91-pulse"));
const P91PulseSignupPage = lazy(() => import("@/pages/p91-pulse-signup"));
const PPFProgramPage = lazy(() => import("@/pages/ppf-program"));
const TestPage = lazy(() => import("@/pages/erp/test-page"));

// ERP claim pages
const DetailerClaimsPage = lazy(() => import("@/pages/erp/detailer/claims"));

// ERP pages
const ErpLogin = lazy(() => import("@/pages/erp/login"));
const ErpSignup = lazy(() => import("@/pages/erp/signup"));
const OtplessLoginPage = lazy(() => import("@/pages/erp/otpless-login"));
const ForgotPasswordPage = lazy(() => import("@/pages/erp/forgot-password"));
const ResetPasswordPage = lazy(() => import("@/pages/erp/reset-password"));
const AdminDashboard = lazy(() => import("@/pages/erp/admin/dashboard"));
const WarrantyRegistrationsPage = lazy(() => import("@/pages/erp/admin/warranty-registrations/index"));
const WarrantyDetailPage = lazy(() => import("@/pages/erp/admin/warranty-registrations/[id]"));
const WarrantyDetail = lazy(() => import("@/pages/erp/admin/warranty-detail"));
const WarrantyTestPage = lazy(() => import("@/pages/erp/admin/warranty-test"));
const DistributorDashboard = lazy(() => import("@/pages/erp/distributor/dashboard"));
const DetailerDashboard = lazy(() => import("@/pages/erp/detailer/dashboard"));

// Sales-team (NSM / RSM / salesperson) modules
const SalesDashboard = lazy(() => import("@/pages/erp/sales/dashboard"));
const SalesTeam = lazy(() => import("@/pages/erp/sales/team"));
const SalesDistributors = lazy(() => import("@/pages/erp/sales/distributors"));
const SalesCustomers = lazy(() => import("@/pages/erp/sales/customers"));
const SalesLeads = lazy(() => import("@/pages/erp/sales/leads"));

// Admin webforms module
const WebformsIndex = lazy(() => import("@/pages/erp/admin/webforms/index"));
const WebformsList = lazy(() => import("@/pages/erp/admin/webforms/list"));
const WebformDetail = lazy(() => import("@/pages/erp/admin/webforms/detail"));
const ContactSubmissionsPage = lazy(() => import("@/pages/erp/admin/webforms/contact"));
const UserManagementPage = lazy(() => import("@/pages/erp/admin/user-management"));
const AdminLeadManagement = lazy(() => import("@/pages/erp/admin/lead-management"));
const WebhookManagementPage = lazy(() => import("@/pages/erp/admin/webhook-management"));
const InstallerApplicationsPage = lazy(() => import("@/pages/erp/admin/installer-applications"));
const PpfPartnerApplicationsPage = lazy(() => import("@/pages/erp/admin/ppf-partner-applications"));
const PulseApplicationsPage = lazy(() => import("@/pages/erp/admin/pulse-applications"));
const AdminVehicleManagementPage = lazy(() => import("@/pages/erp/admin/vehicle-management"));
const ClaimManagementPage = lazy(() => import("@/pages/erp/admin/claim-management"));
const InventoryPage = lazy(() => import("@/pages/erp/admin/inventory"));
const SoldUnitsPage = lazy(() => import("@/pages/erp/admin/sold-units"));
const KnowledgeHubPage = lazy(() => import("@/pages/erp/admin/knowledge-hub"));
const AdminOrdersPage = lazy(() => import("@/pages/erp/admin/orders"));
const AdminRewardClaimsPage = lazy(() => import("@/pages/erp/admin/reward-claims"));
const UsersDetailPage = lazy(() => import("@/pages/erp/admin/users-detail"));
const SalesPartnersPage = lazy(() => import("@/pages/erp/admin/sales-partners"));
const ManagementPage = lazy(() => import("@/pages/erp/admin/management"));

// Distributor ERP modules
const DistributorDetailersPage = lazy(() => import("@/pages/erp/distributor/detailers"));
const DistributorInventoryPage = lazy(() => import("@/pages/erp/distributor/inventory"));
const DistributorWarrantiesPage = lazy(() => import("@/pages/erp/distributor/warranties"));
// Distributor warranty registration disabled - distributors can only view warranties from detailers
// import DistributorWarrantyRegistrationPage from "@/pages/erp/distributor/warranty-registration";
const DistributorClaimsPage = lazy(() => import("@/pages/erp/distributor/claims"));
const DistributorLeadsPage = lazy(() => import("@/pages/erp/distributor/leads"));
const DistributorKnowledgeHubPage = lazy(() => import("@/pages/erp/distributor/knowledge-hub"));
const DistributorOrdersPage = lazy(() => import("@/pages/erp/distributor/orders"));

// Detailer ERP modules
const LeadsPage = lazy(() => import("@/pages/erp/detailer/leads"));
const DetailerCustomersPage = lazy(() => import("@/pages/erp/detailer/customers"));
const DetailerCustomerDetailsPage = lazy(() => import("@/pages/erp/detailer/customers/[id]"));
const DistributorCustomerDetailsPage = lazy(() => import("@/pages/erp/distributor/customers/[id]"));
const WarrantyRegistrationPage = lazy(() => import("@/pages/erp/detailer/warranty-registration"));
const DetailerWarrantiesPage = lazy(() => import("@/pages/erp/detailer/warranties"));
const DetailerWarrantyDetailPage = lazy(() => import("@/pages/erp/detailer/warranty-detail"));
const DetailerVehicleSearchPage = lazy(() => import("@/pages/erp/detailer/vehicle-search"));
const DetailerVehiclesPage = lazy(() => import("@/pages/erp/detailer/vehicles"));
const DistributorVehicleSearchPage = lazy(() => import("@/pages/erp/distributor/vehicle-search"));
const DetailerKnowledgeHubPage = lazy(() => import("@/pages/erp/detailer/knowledge-hub"));
const DetailerInventoryPage = lazy(() => import("@/pages/erp/detailer/inventory"));
const DetailerOrdersPage = lazy(() => import("@/pages/erp/detailer/orders"));
const DetailerRewardsPage = lazy(() => import("@/pages/erp/detailer/rewards"));
const VerifyPage = lazy(() => import("@/pages/verify/VerifyPage"));
const WarrantyCardPage = lazy(() => import("@/pages/erp/warranty-card-page"));
const WarrantyPrintPage = lazy(() => import("@/pages/erp/warranty-print"));
const WarrantyCardPublicPage = lazy(() => import("@/pages/warranty/WarrantyCardPublicPage"));
const OnboardPage = lazy(() => import("@/pages/onboard"));
const VASWorkOrders = lazy(() => import("@/pages/erp/vas/work-orders"));
const VASJobCards = lazy(() => import("@/pages/erp/vas/job-cards"));
const VASAllocations = lazy(() => import("@/pages/erp/vas/allocations"));

import "./lib/fonts.css";

function Router() {
  useEffect(() => {
    // Reveal in-view elements by toggling a class on them.
    const revealInView = () => {
      const elements = document.querySelectorAll('.scroll-trigger');

      elements.forEach(element => {
        const position = element.getBoundingClientRect();

        // Check if element is in viewport
        if (position.top < window.innerHeight - 100) {
          element.classList.add('scroll-visible');
        }
      });
    };

    // Throttle to one run per animation frame. The old handler ran a
    // querySelectorAll + getBoundingClientRect() on every single scroll event,
    // forcing a synchronous reflow each time — that was the layout-thrashing
    // source of scroll jank on the public pages.
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        revealInView();
        ticking = false;
      });
    };

    // Run once on load
    revealInView();

    // Passive listener — we never preventDefault, so this lets the browser
    // keep scrolling smoothly while our handler runs.
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup function
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Determine if the current path is an ERP route to conditionally apply main layout
  const [location] = useLocation();
  const isVerifyRoute = location.startsWith('/verify');
  const isOnboardRoute = location.startsWith('/onboard');
  const isErpRoute = location.startsWith('/erp');
  const isErpAuthRoute = location === '/erp/login' || location === '/erp/signup' || location === '/erp/otpless-login';
  const isDistributorRoute = location.startsWith('/erp/distributor');
  const isDetailerRoute = location.startsWith('/erp/detailer');
  const isAdminRoute = location.startsWith('/erp/admin');
  const isSalesRoute = location.startsWith('/erp/sales');

  const isWarrantyCardRoute = location.startsWith('/warranty-card');

  // Public verify route — no auth, no sidebar, no main layout
  if (isVerifyRoute) {
    return (
      <Switch>
        <Route path="/verify/:code" component={VerifyPage} />
        <Route path="/verify" component={VerifyPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Public onboarding route — invitee fills the signup form, no auth/sidebar
  if (isOnboardRoute) {
    return (
      <Switch>
        <Route path="/onboard/:token" component={OnboardPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Public warranty card download route — no auth, no sidebar
  if (isWarrantyCardRoute) {
    return (
      <Switch>
        <Route path="/warranty-card/:code" component={WarrantyCardPublicPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return isErpRoute ? (
    <Switch>
      {/* Auth routes - these don't have the sidebar */}
      <Route path="/erp/login" component={ErpLogin} />
      <Route path="/erp/signup" component={ErpSignup} />
      <Route path="/erp/otpless-login" component={OtplessLoginPage} />
      <Route path="/erp/forgot-password" component={ForgotPasswordPage} />
      <Route path="/erp/reset-password" component={ResetPasswordPage} />
      <Route path="/erp/test" component={TestPage} />
      
      {/* Shared warranty card view — no sidebar, full-page */}
      <Route path="/erp/warranty-card" component={WarrantyCardPage} />
      <Route path="/erp/warranty-print" component={WarrantyPrintPage} />

      {/* Admin routes - More specific routing to prevent double rendering */}
      <Route path="/erp/admin/warranty-detail">
        <SidebarLayout activeModule="warranty-registrations">
          <WarrantyDetail />
        </SidebarLayout>
      </Route>
      
      {/* Specific webform routes */}
      <Route path="/erp/admin/webforms/contact">
        <SidebarLayout activeModule="webforms">
          <ContactSubmissionsPage />
        </SidebarLayout>
      </Route>
      
      {/* VAS (SetuPPF) embedded tabs — available to any VAS-enabled Pulse user */}
      <Route path="/erp/vas/:rest*">
        <SidebarLayout activeModule={location.split('/').pop()}>
          <Switch>
            <Route path="/erp/vas/work-orders" component={VASWorkOrders} />
            <Route path="/erp/vas/job-cards" component={VASJobCards} />
            <Route path="/erp/vas/allocations" component={VASAllocations} />
          </Switch>
        </SidebarLayout>
      </Route>

      <Route path="/erp/admin/:rest*">
        <SidebarLayout activeModule={location.split('/').pop()}>
          <Switch>
            <Route path="/erp/admin/dashboard" component={AdminDashboard} />
            <Route path="/erp/admin/webforms" component={WebformsIndex} />
            <Route path="/erp/admin/webforms/list/:formType" component={WebformsList} />
            <Route path="/erp/admin/webforms/detail/:formType/:id" component={WebformDetail} />
            <Route path="/erp/admin/warranty-test/:id" component={WarrantyTestPage} />
            <Route path="/erp/admin/warranty-registrations" component={WarrantyRegistrationsPage} />
            <Route path="/erp/admin/warranty-management" component={WarrantyRegistrationsPage} />
            <Route path="/erp/admin/warranties" component={WarrantyRegistrationsPage} />
            <Route path="/erp/admin/claim-management" component={ClaimManagementPage} />
            <Route path="/erp/admin/claims" component={ClaimManagementPage} />
            <Route path="/erp/admin/user-management" component={UserManagementPage} />
            <Route path="/erp/admin/sales-partners" component={SalesPartnersPage} />
            <Route path="/erp/admin/management" component={ManagementPage} />
            <Route path="/erp/admin/installer-applications" component={InstallerApplicationsPage} />
            <Route path="/erp/admin/ppf-partner-applications" component={PpfPartnerApplicationsPage} />
            <Route path="/erp/admin/pulse-applications" component={PulseApplicationsPage} />
            <Route path="/erp/admin/lead-management" component={AdminLeadManagement} />
            <Route path="/erp/admin/vehicle-management" component={AdminVehicleManagementPage} />
            <Route path="/erp/admin/webhook-management" component={WebhookManagementPage} />
            <Route path="/erp/admin/inventory" component={InventoryPage} />
            <Route path="/erp/admin/sold-units" component={SoldUnitsPage} />
            <Route path="/erp/admin/knowledge" component={KnowledgeHubPage} />
            <Route path="/erp/admin/knowledge-hub" component={KnowledgeHubPage} />
            <Route path="/erp/admin/orders" component={AdminOrdersPage} />
            <Route path="/erp/admin/reward-claims" component={AdminRewardClaimsPage} />
            {/* Simple import for user details page */}
            <Route path="/erp/admin/users/:id" component={UsersDetailPage} />
            <Route component={NotFound} />
          </Switch>
        </SidebarLayout>
      </Route>
      
      {/* Specific distributor customer detail route - outside nested routing */}
      <Route path="/erp/distributor/customers/:id">
        <SidebarLayout activeModule="customers">
          <DistributorCustomerDetailsPage />
        </SidebarLayout>
      </Route>
      
      {/* Distributor routes */}
      <Route path="/erp/distributor/:rest*">
        <SidebarLayout activeModule={location.split('/').pop()}>
          <Switch>
            <Route path="/erp/distributor/dashboard" component={DistributorDashboard} />
            <Route path="/erp/distributor/user-management" component={UserManagementPage} />
            <Route path="/erp/distributor/sales-partners" component={SalesPartnersPage} />
            <Route path="/erp/distributor/management" component={ManagementPage} />
            <Route path="/erp/distributor/detailers" component={DistributorDetailersPage} />
            <Route path="/erp/distributor/inventory" component={DistributorInventoryPage} />
            <Route path="/erp/distributor/warranties" component={DistributorWarrantiesPage} />
            {/* Distributor warranty registration disabled - distributors can only view warranties from detailers */}
            {/* <Route path="/erp/distributor/warranty-registration" component={DistributorWarrantyRegistrationPage} /> */}
            {/* Claims routes - specific route first */}
            <Route path="/erp/distributor/claims" component={DistributorClaimsPage} />
            <Route path="/erp/distributor/leads" component={DistributorLeadsPage} />
            <Route path="/erp/distributor/knowledge-hub" component={DistributorKnowledgeHubPage} />
            <Route path="/erp/distributor/vehicle-search" component={DistributorVehicleSearchPage} />
            <Route path="/erp/distributor/orders" component={DistributorOrdersPage} />
            <Route path="/erp/distributor/detailer-invite">
              {() => {
                const InviteManagement = React.lazy(() => import('@/pages/erp/distributor/invite-management'));
                return (
                  <React.Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                    <InviteManagement />
                  </React.Suspense>
                );
              }}
            </Route>
            <Route component={NotFound} />
          </Switch>
        </SidebarLayout>
      </Route>
      
      {/* Sales-team routes (NSM / RSM / salesperson) */}
      <Route path="/erp/sales/:rest*">
        <SidebarLayout activeModule={location.split('/').pop()}>
          <Switch>
            <Route path="/erp/sales/dashboard" component={SalesDashboard} />
            <Route path="/erp/sales/user-management" component={UserManagementPage} />
            <Route path="/erp/sales/sales-partners" component={SalesPartnersPage} />
            <Route path="/erp/sales/management" component={ManagementPage} />
            <Route path="/erp/sales/team" component={SalesTeam} />
            <Route path="/erp/sales/distributors" component={SalesDistributors} />
            <Route path="/erp/sales/customers" component={SalesCustomers} />
            <Route path="/erp/sales/leads" component={SalesLeads} />
            <Route component={NotFound} />
          </Switch>
        </SidebarLayout>
      </Route>

      {/* Specific detailer warranty detail route - outside nested routing */}
      <Route path="/erp/detailer/warranty-detail/:id">
        <SidebarLayout activeModule="warranties">
          <DetailerWarrantyDetailPage />
        </SidebarLayout>
      </Route>
      
      {/* Specific detailer customer detail route - outside nested routing */}
      <Route path="/erp/detailer/customers/:id">
        <SidebarLayout activeModule="customers">
          <DetailerCustomerDetailsPage />
        </SidebarLayout>
      </Route>
      
      {/* Detailer routes */}
      <Route path="/erp/detailer/:rest*">
        <SidebarLayout activeModule={location.split('/').pop()}>
          <Switch>
            <Route path="/erp/detailer/dashboard" component={DetailerDashboard} />
            <Route path="/erp/detailer/leads" component={LeadsPage} />
            <Route path="/erp/detailer/customers" component={DetailerCustomersPage} />
            <Route path="/erp/detailer/warranties" component={DetailerWarrantiesPage} />
            <Route path="/erp/detailer/warranty-registration" component={WarrantyRegistrationPage} />
            {/* Claims routes - specific route first */}
            <Route path="/erp/detailer/claims" component={DetailerClaimsPage} />
            <Route path="/erp/detailer/vehicles" component={DetailerVehiclesPage} />
            <Route path="/erp/detailer/vehicle-search" component={DetailerVehicleSearchPage} />
            <Route path="/erp/detailer/inventory" component={DetailerInventoryPage} />
            <Route path="/erp/detailer/knowledge-hub" component={DetailerKnowledgeHubPage} />
            <Route path="/erp/detailer/orders" component={DetailerOrdersPage} />
            <Route path="/erp/detailer/rewards" component={DetailerRewardsPage} />
            <Route component={NotFound} />
          </Switch>
        </SidebarLayout>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  ) : (
    <MainLayout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/p91-pulse" component={P91PulsePage} />
        <Route path="/p91-pulse-signup" component={P91PulseSignupPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/products/ppf" component={PPFPage} />
        <Route path="/products/ceramic" component={CeramicCoatingPage} />
        <Route path="/products/home-coating" component={HomeCoatingPage} />
        <Route path="/store" component={StorePage} />
        <Route path="/partners/distributors" component={DistributorsPage} />
        <Route path="/partners/installers" component={InstallersPage} />
        <Route path="/warranty" component={WarrantyPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/ppfprogram" component={PPFProgramPage} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }
        >
          <Router />
        </Suspense>
        <Toaster />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
