import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/dev/MetricCard';
import { apiRequest } from '@/lib/queryClient';
import { Users, Building2, ClipboardList, CheckCircle2, UserCog } from 'lucide-react';

const ROLE_LABEL: Record<string, string> = {
  national_sales_manager: 'National Sales Manager',
  regional_sales_manager: 'Regional Sales Manager',
  salesperson: 'Salesperson',
};

export default function SalesDashboard() {
  const [, setLocation] = useLocation();

  const { data: user } = useQuery({
    queryKey: ['/api/erp/me'],
    queryFn: async () => (await apiRequest('GET', '/api/erp/me')).json(),
  });

  const { data: overview, isLoading } = useQuery({
    queryKey: ['/api/erp/sales/overview'],
    queryFn: async () => (await apiRequest('GET', '/api/erp/sales/overview')).json(),
    refetchInterval: 30000,
  });

  const role = user?.role as string | undefined;
  const isNSM = role === 'national_sales_manager';
  const isRSM = role === 'regional_sales_manager';
  const isSalesperson = role === 'salesperson';

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          {role ? ROLE_LABEL[role] || 'Sales' : 'Sales'} · {user?.name || ''}
        </p>
      </div>

      {/* KPI cards — MetricCard adds a developer-only "i" info/notes dot per box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {!isSalesperson && (
          <MetricCard
            widgetId="sales.overview.distributors"
            title="Distributors"
            icon={<Building2 className="w-4 h-4 mr-2" />}
            loading={isLoading}
            value={overview?.distributors ?? 0}
            subtitle={isRSM ? 'In your states' : 'All distributors'}
          />
        )}
        <MetricCard
          widgetId="sales.overview.totalLeads"
          title={isSalesperson ? 'My Leads' : 'Total Leads'}
          icon={<ClipboardList className="w-4 h-4 mr-2" />}
          loading={isLoading}
          value={overview?.totalLeads ?? overview?.total_leads ?? 0}
          subtitle="Across B→C and B→B"
        />
        <MetricCard
          widgetId="sales.overview.conversions"
          title="Conversions"
          icon={<CheckCircle2 className="w-4 h-4 mr-2" />}
          loading={isLoading}
          value={overview?.conversions ?? 0}
          subtitle="Won customers"
          subtitleClassName="text-green-500"
        />
        {isNSM && (
          <MetricCard
            widgetId="sales.overview.salesTeam"
            title="Sales Team"
            icon={<Users className="w-4 h-4 mr-2" />}
            loading={isLoading}
            value={`${overview?.regionalManagers ?? 0} RSM · ${overview?.salespeople ?? 0} SP`}
            subtitle="Regional managers · salespeople"
          />
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isNSM && (
          <Card className="bg-purple-50 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-800 flex items-center">
                <UserCog className="w-4 h-4 mr-2" /> Manage Sales Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-purple-600 mb-3">Create / view regional managers and salespeople</p>
              <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => setLocation('/erp/sales/team')}>
                Open Team Management
              </Button>
            </CardContent>
          </Card>
        )}
        {!isSalesperson && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
                <Building2 className="w-4 h-4 mr-2" /> Distributor Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-blue-600 mb-3">Track distributors {isRSM ? 'in your states' : 'across regions'}</p>
              <Button size="sm" variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                onClick={() => setLocation('/erp/sales/distributors')}>
                View Distributors
              </Button>
            </CardContent>
          </Card>
        )}
        {isSalesperson && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-800 flex items-center">
                <ClipboardList className="w-4 h-4 mr-2" /> My Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-green-600 mb-3">View and manage the end users you brought in</p>
              <Button size="sm" className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => setLocation('/erp/sales/customers')}>
                View My Customers
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
