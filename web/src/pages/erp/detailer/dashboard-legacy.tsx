import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/dev/MetricCard';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Plus,
  Users,
  UserPlus,
  ExternalLink,
  ShieldOff
} from 'lucide-react';

export default function DetailerDashboard() {
  const [, setLocation] = useLocation();

  // Fetch current user data
  const { data: user } = useQuery({
    queryKey: ['/api/erp/me'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/erp/me');
      return response.json();
    }
  });

  // My customers (assigned to me — both self-created and ERP-assigned via detailerId).
  // Auto-refreshes so a newly added/assigned customer shows up without a manual reload.
  const { data: customers = [] } = useQuery({
    queryKey: ['/api/erp/customers'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/erp/customers');
      return response.json();
    },
    refetchInterval: 30000,
  });
  const customerList: any[] = Array.isArray(customers) ? customers : [];
  const totalCustomers = customerList.length;
  const activeLeads = customerList.filter(c =>
    ['new', 'contacted', 'qualified', 'followedup'].includes(String(c.status || '').toLowerCase())
  ).length;
  const convertedCount = customerList.filter(c =>
    String(c.status || '').toLowerCase() === 'converted'
  ).length;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome to your detailer dashboard. Here's an overview of your business.
        </p>
      </div>

      {/* KPI cards — my assigned customers/leads (MetricCard adds dev-only "i" dots) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <MetricCard
          widgetId="detailer.dashboard.myCustomers"
          title="My Customers"
          value={totalCustomers}
          subtitle="All leads/customers assigned to you"
        />
        <MetricCard
          widgetId="detailer.dashboard.activeLeads"
          title="Active Leads"
          value={activeLeads}
          subtitle="New / contacted / qualified"
        />
        <MetricCard
          widgetId="detailer.dashboard.converted"
          title="Converted"
          value={convertedCount}
          subtitle="Won customers"
          subtitleClassName="text-green-500"
        />
      </div>

      {/* PPF Setu Access Section */}
      {user && (
        <div className="mb-8">
          {user.ppfSetuAccess ? (
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-purple-900 flex items-center">
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Pulse VAS Portal Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-purple-700 mb-4">
                  You have been granted access to the Pulse VAS portal. Click below to access your account.
                </p>
                <div className="flex items-center gap-4">
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => window.open('https://pulsevas.p91india.com/', '_blank')}
                    data-testid="button-access-ppf-setu"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Access Pulse VAS Portal
                  </Button>
                  {user.ppfSetuPartnerType && (
                    <div className="text-sm text-purple-600">
                      Partner Type: <span className="font-semibold">{user.ppfSetuPartnerType}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gray-50 border-gray-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-700 flex items-center">
                  <ShieldOff className="w-5 h-5 mr-2" />
                  Pulse VAS Portal Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Access to Pulse VAS portal has not been granted yet. Please contact your administrator for access.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Quick Actions for Detailers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-8">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800 flex items-center">
              <UserPlus className="w-4 h-4 mr-2" />
              Add New Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-green-600 mb-3">Register a new customer/end user for your business</p>
            <Button 
              size="sm" 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => setLocation('/erp/detailer/customers')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create End User
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Manage Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-blue-600 mb-3">View and manage all your customers</p>
            <Button 
              size="sm" 
              variant="outline"
              className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
              onClick={() => setLocation('/erp/detailer/customers')}
            >
              <Users className="w-4 h-4 mr-2" />
              View Customers
            </Button>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}