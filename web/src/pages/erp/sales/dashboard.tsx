import { useQuery } from '@tanstack/react-query';
import { LeadsInsights } from '@/components/leads/LeadsInsights';
import { MyCoverage } from '@/components/leads/MyCoverage';

// Sales hierarchy (NSM / RSM / salesperson) — role-scoped dashboard: the shared Leads Insights panel (the server
// scopes every number to this login) + the user's coverage/team card.
export default function SalesDashboard() {
  const { data: user } = useQuery<any>({ queryKey: ['/api/erp/me'] });

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome{user?.name ? `, ${user.name}` : ''} — leads and coverage for your{' '}
          {String(user?.role || '').replace(/_/g, ' ') || 'role'} view.
        </p>
      </div>
      <LeadsInsights />
      <MyCoverage />
    </div>
  );
}
