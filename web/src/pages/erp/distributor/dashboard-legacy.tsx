import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/dev/MetricCard';
import { InfoDot } from '@/components/dev/InfoDot';
import { useEffect, useState } from 'react';
import { Plus, Users, Link, ExternalLink, ShieldOff, Eye, ClipboardCheck } from 'lucide-react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

export default function DistributorDashboard() {
  const [, setLocation] = useLocation();
  
  // Fetch current user data
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiRequest('GET', '/api/erp/me');
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    
    fetchUser();
  }, []);
  const [activeDetailersCount, setActiveDetailersCount] = useState(0);
  const [loadingDetailers, setLoadingDetailers] = useState(true);
  const [myCustomers, setMyCustomers] = useState(0);
  const [b2bPartners, setB2bPartners] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState<any>({ totalPending: 0, unassignedLeads: [], pendingUsers: [] });

  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        const response = await apiRequest('GET', '/api/erp/approvals/pending');
        const data = await response.json();
        setPendingApprovals(data);
      } catch (error) {
        console.error('Error fetching approvals:', error);
      }
    };
    fetchApprovals();
  }, []);

  useEffect(() => {
    // Fetch real detailer count
    const fetchDetailerCount = async () => {
      try {
        setLoadingDetailers(true);
        const response = await apiRequest('GET', '/api/erp/distributor/detailers/active');
        const detailers = await response.json();
        if (Array.isArray(detailers)) {
          setActiveDetailersCount(detailers.length);
        }
      } catch (error) {
        console.error('Error fetching detailer count:', error);
        setActiveDetailersCount(0);
      } finally {
        setLoadingDetailers(false);
      }
    };

    fetchDetailerCount();
  }, []);

  useEffect(() => {
    // Customers/leads in my hierarchy. Split end-user customers from B2B partners
    // (detailers/installers I brought in — flagged lead_type='b2b').
    const fetchCustomers = async () => {
      try {
        const response = await apiRequest('GET', '/api/erp/customers');
        const rows = await response.json();
        if (Array.isArray(rows)) {
          setB2bPartners(rows.filter((c: any) => String(c.lead_type).toLowerCase() === 'b2b').length);
          setMyCustomers(rows.filter((c: any) => String(c.lead_type).toLowerCase() !== 'b2b').length);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };

    fetchCustomers();
  }, []);
  
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome to your distributor dashboard. Here's an overview of your region.
        </p>
      </div>
      
      {/* Territory Information Section */}
      {user && user.city && (
        <Card className="mb-8 bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-indigo-900 flex items-center justify-between">
              <span className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Territory Assignment
              </span>
              <InfoDot widgetId="distributor.dashboard.territory" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-indigo-600 font-medium">Assigned Territory:</p>
                <p className="text-lg font-bold text-indigo-900">{user.metadata?.territory || user.city || 'Not assigned'}</p>
              </div>
              {user.phone && (
                <div>
                  <p className="text-sm text-indigo-600 font-medium">Contact:</p>
                  <p className="text-lg font-bold text-indigo-900">{user.phone}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Center Widget */}
      <Card className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-amber-900 flex items-center justify-between">
            <span className="flex items-center">
              <ClipboardCheck className="w-5 h-5 mr-2" />
              Approval Center
            </span>
            <InfoDot widgetId="distributor.dashboard.approvals" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-amber-600 font-medium">Unassigned Leads in Territory:</p>
              <p className="text-2xl font-bold text-amber-900">{pendingApprovals.unassignedLeads?.length || 0}</p>
              <Button size="sm" variant="outline" className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => setLocation('/erp/distributor/leads')}>View Leads</Button>
            </div>
            <div>
              <p className="text-sm text-amber-600 font-medium">Pending User Onboarding:</p>
              <p className="text-2xl font-bold text-amber-900">{pendingApprovals.pendingUsers?.length || 0}</p>
              <Button size="sm" variant="outline" className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => setLocation('/erp/distributor/detailers')}>View Users</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
              <Link className="w-4 h-4 mr-2" />
              Invite Detailer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-blue-600 mb-3">Send P91 Pulse registration link to potential detailers</p>
            <Button 
              size="sm" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => setLocation('/erp/distributor/detailer-invite')}
            >
              <Link className="w-4 h-4 mr-2" />
              Invite Detailer
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Add End User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-green-600 mb-3">Register a new customer/end user</p>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-green-300 text-green-700 hover:bg-green-100"
              onClick={() => setLocation('/erp/distributor/leads')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create End User
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Manage Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-purple-600 mb-3">View and manage all users in your organization</p>
            <Button 
              size="sm" 
              variant="outline"
              className="w-full border-purple-300 text-purple-700 hover:bg-purple-100"
              onClick={() => setLocation('/erp/distributor/detailers')}
            >
              <Eye className="w-4 h-4 mr-2" />
              View All Users
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards — MetricCard adds a developer-only "i" info/notes dot per box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          widgetId="distributor.dashboard.activeDetailers"
          title="Active Detailers"
          loading={loadingDetailers}
          value={activeDetailersCount}
          subtitle="All approved detailers in your region"
          subtitleClassName="text-green-500"
        />
        <MetricCard
          widgetId="distributor.dashboard.b2bPartners"
          title="B2B Partners Brought"
          value={b2bPartners}
          subtitle="Detailers / installers you onboarded (mapped to you)"
        />
        <MetricCard
          widgetId="distributor.dashboard.myCustomers"
          title="My Customers"
          value={myCustomers}
          subtitle="End-user customers across your hierarchy"
        />
      </div>
    </div>
  );
}