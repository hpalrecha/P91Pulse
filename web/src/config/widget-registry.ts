/**
 * Widget metadata registry — DEFAULTS ONLY.
 *
 * Each dashboard metric box has a stable id (e.g. "admin.dashboard.totalUsers").
 * This file holds the seed/default "i" info content so boxes are documented out
 * of the box. Developers can edit the content in-app (the "i" popover); those
 * edits are stored in the `widget_info` DB table and OVERRIDE these defaults.
 *
 * Resolution at read time = DB row ?? this default. Keep ids in sync with the
 * `widgetId` passed to <MetricCard> / <InfoDot> in the dashboards.
 */
export interface WidgetMeta {
  id: string;
  label: string;
  description: string;
  source?: string;
  formula?: string;
  freshness?: string;
}

export const WIDGET_DEFAULTS: Record<string, WidgetMeta> = {
  // --- Admin dashboard (GET /api/erp/admin/dashboard-stats) ---
  'admin.dashboard.totalUsers': {
    id: 'admin.dashboard.totalUsers',
    label: 'Total Users',
    description: 'All registered Pulse users across every role and brand.',
    source: 'ERP customer master (Customer.customer_group) mirrored into the users/customers tables.',
    formula: 'count of user/customer records (all roles)',
    freshness: 'Synced from ERP by backend-go; dashboard refetches ~every 30s.',
  },
  'admin.dashboard.activeDistributors': {
    id: 'admin.dashboard.activeDistributors',
    label: 'Active Distributors',
    description: 'Distributors that are approved and active.',
    source: 'ERP customer master — customer_group = Distributor.',
    formula: "count(role = 'distributor' AND status = 'approved' AND isActive)",
    freshness: 'Synced from ERP by backend-go; dashboard refetches ~every 30s.',
  },
  'admin.dashboard.activeDetailers': {
    id: 'admin.dashboard.activeDetailers',
    label: 'Active Detailers',
    description: 'Detailers that are approved and active.',
    source: 'ERP customer master — customer_group = Detailer.',
    formula: "count(role = 'detailer' AND status = 'approved' AND isActive)",
    freshness: 'Synced from ERP by backend-go; dashboard refetches ~every 30s.',
  },
  'admin.dashboard.activeInstallers': {
    id: 'admin.dashboard.activeInstallers',
    label: 'Active Installers',
    description: 'Installers that are approved and active. (Installer classification rule is still being finalised.)',
    source: 'ERP customer master / users table.',
    formula: "count(role = 'installer' AND status = 'approved' AND isActive)",
    freshness: 'Synced from ERP by backend-go; dashboard refetches ~every 30s.',
  },
  'admin.dashboard.totalWarranties': {
    id: 'admin.dashboard.totalWarranties',
    label: 'Warranty Registrations',
    description: 'Total warranty registrations recorded in Pulse.',
    source: 'warranty_registrations table (synced with ERP warranty doctype).',
    formula: 'count of warranty registrations',
    freshness: 'Synced from ERP by backend-go.',
  },
  'admin.dashboard.openClaims': {
    id: 'admin.dashboard.openClaims',
    label: 'Open Claims',
    description: 'Claims not yet closed/resolved — require attention.',
    source: 'claims table.',
    formula: "count(claims where status NOT IN ('closed','rejected'))",
    freshness: 'Live from Pulse DB; dashboard refetches ~every 30s.',
  },

  // --- Sales dashboard (GET /api/erp/sales/overview) ---
  'sales.overview.distributors': {
    id: 'sales.overview.distributors',
    label: 'Distributors',
    description: 'Distributors visible to this sales user (scoped by their territory/hierarchy).',
    source: 'users table scoped via sales hierarchy (NSM = all, RSM = assigned states, salesperson = own).',
    formula: "count of distributors in the sales user's scope",
    freshness: 'Live from Pulse DB; dashboard refetches ~every 30s.',
  },
  'sales.overview.totalLeads': {
    id: 'sales.overview.totalLeads',
    label: 'Total Leads',
    description: 'Leads within this sales user’s scope.',
    source: 'customers/leads table (synced from ERP Lead doctype) scoped by hierarchy.',
    formula: 'count of leads in scope',
    freshness: 'Synced from ERP by backend-go.',
  },
  'sales.overview.conversions': {
    id: 'sales.overview.conversions',
    label: 'Conversions',
    description: 'Leads in scope that have converted (won).',
    source: 'lead/opportunity status (join key party_name) from ERP.',
    formula: 'count of converted/won leads in scope',
    freshness: 'Synced from ERP by backend-go.',
  },
  'sales.overview.regionalManagers': {
    id: 'sales.overview.regionalManagers',
    label: 'Regional Managers',
    description: 'Regional Sales Managers reporting in this hierarchy (NSM view).',
    source: "users table — role = 'regional_sales_manager'.",
    formula: "count(role = 'regional_sales_manager' under this NSM)",
    freshness: 'Live from Pulse DB.',
  },
  'sales.overview.salespeople': {
    id: 'sales.overview.salespeople',
    label: 'Salespeople',
    description: 'Salespeople in this hierarchy.',
    source: "users table — role = 'salesperson'.",
    formula: "count(role = 'salesperson' in scope)",
    freshness: 'Live from Pulse DB.',
  },
  'sales.overview.salesTeam': {
    id: 'sales.overview.salesTeam',
    label: 'Sales Team',
    description: 'Your reporting sales team — regional sales managers and salespeople (NSM view).',
    source: 'users table — roles regional_sales_manager + salesperson reporting to this NSM (managerId).',
    formula: 'count(RSM) · count(salesperson)',
    freshness: 'Live from Pulse DB; refetches ~every 30s.',
  },

  // --- Distributor dashboard ---
  'distributor.dashboard.activeDetailers': {
    id: 'distributor.dashboard.activeDetailers',
    label: 'Active Detailers',
    description: 'Approved detailers in your region (mapped to you as their distributor).',
    source: 'GET /api/erp/distributor/detailers/active — users where distributor_id/assigned_distributor_id = you.',
    formula: 'count of approved detailers in your hierarchy',
    freshness: 'Live from Pulse DB.',
  },
  'distributor.dashboard.b2bPartners': {
    id: 'distributor.dashboard.b2bPartners',
    label: 'B2B Partners Brought',
    description: 'Detailers / installers you onboarded — leads flagged lead_type = b2b.',
    source: 'GET /api/erp/customers in your hierarchy, filtered to lead_type = "b2b".',
    formula: "count(customers where lead_type = 'b2b')",
    freshness: 'Synced from ERP by backend-go.',
  },
  'distributor.dashboard.myCustomers': {
    id: 'distributor.dashboard.myCustomers',
    label: 'My Customers',
    description: 'End-user customers across your hierarchy (non-B2B leads).',
    source: 'GET /api/erp/customers in your hierarchy, filtered to lead_type != "b2b".',
    formula: "count(customers where lead_type != 'b2b')",
    freshness: 'Synced from ERP by backend-go.',
  },
  'distributor.dashboard.territory': {
    id: 'distributor.dashboard.territory',
    label: 'Territory Assignment',
    description: 'Your assigned territory and contact — used to scope leads to you.',
    source: 'users.metadata (city / state / territory) + phone.',
    freshness: 'Set at onboarding; editable by admin.',
  },

  // --- Detailer dashboard ---
  'detailer.dashboard.myCustomers': {
    id: 'detailer.dashboard.myCustomers',
    label: 'My Customers',
    description: 'All leads/customers assigned to you (self-created or ERP-assigned via detailerId).',
    source: 'GET /api/erp/customers — customers where detailer_id = you.',
    formula: 'count of your assigned customers',
    freshness: 'Synced from ERP by backend-go; refetches ~every 30s.',
  },
  'detailer.dashboard.activeLeads': {
    id: 'detailer.dashboard.activeLeads',
    label: 'Active Leads',
    description: 'Your leads still in play — new, contacted, qualified, or followed up.',
    source: 'GET /api/erp/customers filtered by status.',
    formula: 'count(status in new | contacted | qualified | followedup)',
    freshness: 'Synced from ERP by backend-go; refetches ~every 30s.',
  },
  'detailer.dashboard.converted': {
    id: 'detailer.dashboard.converted',
    label: 'Converted',
    description: 'Your leads that converted (won customers).',
    source: 'GET /api/erp/customers filtered by status = converted.',
    formula: "count(status = 'converted')",
    freshness: 'Synced from ERP by backend-go; refetches ~every 30s.',
  },
};
