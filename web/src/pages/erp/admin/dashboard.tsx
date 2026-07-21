import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/dev/MetricCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LeadsInsights } from '@/components/leads/LeadsInsights';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import { 
  Users, 
  UserCheck, 
  Package, 
  Database, 
  FileText, 
  BookOpen, 
  BarChart2, 
  Settings, 
  List, 
  LayoutDashboard,
  ClipboardList,
  Activity,
  Webhook,
  CheckCircle,
  XCircle,
  Clock,
  Car
} from 'lucide-react';

// Webhook Activity Component
function WebhookActivity() {
  const { data: webhookDeliveries, isLoading, error } = useQuery({
    queryKey: ['/api/webhook-deliveries'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/webhook-deliveries');
        return await response.json();
      } catch (err) {
        console.error("Error fetching webhook deliveries:", err);
        throw err;
      }
    }
  });

  if (isLoading) {
    return <div className="py-6 text-center">Loading webhook activity...</div>;
  }

  if (error) {
    return <div className="py-6 text-center text-red-500">Error loading webhook activity</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-4 w-4" />
          Recent Lead Status Updates
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Lead Name</TableHead>
              <TableHead>Status Change</TableHead>
              <TableHead>Updated By</TableHead>
              <TableHead>Webhook Status</TableHead>
              <TableHead>Response Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {webhookDeliveries?.length > 0 ? (
              webhookDeliveries.slice(0, 10).map((delivery: any) => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-medium">
                    {format(new Date(delivery.deliveredAt || delivery.createdAt), 'MMM dd, HH:mm')}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{delivery.leadData?.name || 'Unknown Lead'}</div>
                    <div className="text-sm text-gray-500">{delivery.leadData?.phone}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="text-xs w-fit">
                        {delivery.trigger.replace('_', ' ')}
                      </Badge>
                      {delivery.leadData?.status && (
                        <div className="text-sm text-gray-600">
                          → {delivery.leadData.status}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {delivery.leadData?.updatedBy || 'System'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {delivery.leadData?.updatedByRole || 'auto'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {delivery.success ? (
                      <Badge variant="default" className="flex items-center gap-1 w-fit">
                        <CheckCircle className="h-3 w-3" />
                        Success
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                        <XCircle className="h-3 w-3" />
                        Failed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-3 w-3" />
                      {delivery.responseTime ? `${delivery.responseTime}ms` : 'N/A'}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No webhook activity yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Contact Form Submissions Component
function ContactFormSubmissions() {
  const { data: contactSubmissions, isLoading, error } = useQuery({
    queryKey: ['/api/contact-submissions'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/contact-submissions');
        return await response.json();
      } catch (err) {
        console.error("Error fetching contact submissions:", err);
        throw err;
      }
    }
  });

  if (isLoading) {
    return <div className="py-6 text-center">Loading contact submissions...</div>;
  }

  if (error) {
    return <div className="py-6 text-center text-red-500">Error loading contact submissions</div>;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contactSubmissions?.length > 0 ? (
              contactSubmissions.map((submission: any) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">
                    {format(new Date(submission.createdAt), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>{submission.name}</TableCell>
                  <TableCell>{submission.email}</TableCell>
                  <TableCell>{submission.subject}</TableCell>
                  <TableCell className="max-w-xs truncate">{submission.message}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  No contact form submissions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Installer Applications Component
function InstallerApplicationSubmissions() {
  const { data: installerApplications, isLoading, error } = useQuery({
    queryKey: ['/api/installer-applications'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/installer-applications');
        return await response.json();
      } catch (err) {
        console.error("Error fetching installer applications:", err);
        throw err;
      }
    }
  });

  if (isLoading) {
    return <div className="py-6 text-center">Loading installer applications...</div>;
  }

  if (error) {
    return <div className="py-6 text-center text-red-500">Error loading installer applications</div>;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {installerApplications?.length > 0 ? (
              installerApplications.map((application: any) => (
                <TableRow key={application.id}>
                  <TableCell className="font-medium">
                    {format(new Date(application.createdAt), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>{application.name}</TableCell>
                  <TableCell>{application.businessName}</TableCell>
                  <TableCell>
                    <div>{application.email}</div>
                    <div className="text-xs text-gray-500">{application.phone}</div>
                  </TableCell>
                  <TableCell>{application.city}</TableCell>
                  <TableCell>{application.businessType}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">View</Button>
                      <Button variant="outline" size="sm">Convert</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6">
                  No installer applications found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Warranty Registrations Component
function WarrantyRegistrationSubmissions() {
  const { data: warrantyRegistrations, isLoading, error } = useQuery({
    queryKey: ['/api/warranty-registrations'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/warranty-registrations');
        return await response.json();
      } catch (err) {
        console.error("Error fetching warranty registrations:", err);
        throw err;
      }
    }
  });

  if (isLoading) {
    return <div className="py-6 text-center">Loading warranty registrations...</div>;
  }

  if (error) {
    return <div className="py-6 text-center text-red-500">Error loading warranty registrations</div>;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Warranty Code</TableHead>
              <TableHead>Installation</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warrantyRegistrations?.length > 0 ? (
              warrantyRegistrations.map((registration: any) => (
                <TableRow key={registration.id}>
                  <TableCell className="font-medium">
                    {format(new Date(registration.createdAt), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>{registration.name}</TableCell>
                  <TableCell>
                    <div>{registration.email}</div>
                    <div className="text-xs text-gray-500">{registration.phone}</div>
                  </TableCell>
                  <TableCell>{registration.productType}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{registration.warrantyCode}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>{registration.installationDate}</div>
                    <div className="text-xs text-gray-500">{registration.installer}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6">
                  No warranty registrations found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Live activity feed (point 5): recent lead status changes, auto-refreshing.
// Provisioned ERP logins (dashboard goal 1.1): every ERP customer/sales-partner
// given a Pulse login, with the credentials the admin hands out.
function ProvisionedLogins() {
  const [search, setSearch] = useState('');
  const { data: logins } = useQuery<any[]>({
    queryKey: ['/api/erp/admin/provisioned-logins'],
  });
  const filtered = (logins || []).filter((u) =>
    [u.name, u.phone, u.email, u.username, u.erpRef].join(' ').toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>ERP User Logins ({logins?.length ?? 0} provisioned)</CardTitle>
        <p className="text-sm text-muted-foreground">
          Logins auto-created from ERP Customers (excl. End User / P91 Car Care) and Sales Partners.
          Username = registered mobile. Share the password with the user; it should be changed on first login.
        </p>
      </CardHeader>
      <CardContent>
        <input
          className="mb-3 w-full max-w-sm rounded-md border border-gray-200 px-3 py-1.5 text-sm"
          placeholder="Search name / mobile / email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Territory</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>ERP Ref</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 300).map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="capitalize">{u.role}</TableCell>
                  <TableCell className="text-xs">{u.territory || '—'}</TableCell>
                  <TableCell>{u.phone}</TableCell>
                  <TableCell>{u.email || '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{u.username}</TableCell>
                  <TableCell className="font-mono text-xs">{u.password || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.erpRef}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                    No provisioned logins yet — run the customers sync.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {filtered.length > 300 && (
            <p className="text-xs text-muted-foreground mt-2">Showing first 300 of {filtered.length} — refine the search.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LiveActivity() {
  const { data: activity, isLoading } = useQuery({
    queryKey: ['/api/erp/admin/activity'],
    queryFn: async () => {
      const r = await apiRequest('GET', '/api/erp/admin/activity');
      return await r.json();
    },
    refetchInterval: 15000,
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Live Activity — lead status changes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>By</TableHead>
              <TableHead>Lead</TableHead>
              <TableHead>Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-6">Loading…</TableCell></TableRow>
            ) : (activity && activity.length > 0) ? (
              activity.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.at ? format(new Date(a.at), 'MMM dd, HH:mm') : ''}</TableCell>
                  <TableCell>
                    <div>{a.actor_name || (a.actor_id ? `#${a.actor_id}` : 'System')}</div>
                    <div className="text-xs text-gray-500">{a.actor_role || ''}</div>
                  </TableCell>
                  <TableCell>{a.customer_name || `#${a.customer_id}`}</TableCell>
                  <TableCell className="text-sm text-gray-600">{(a.from_status || '—')} → {(a.to_status || '—')}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={4} className="text-center py-6 text-gray-500">No activity yet — change a lead's status to see it here.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Simple admin dashboard component without sidebar
// Uses the common SidebarLayout component from App.tsx
export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState('dashboard');

  // Fetch dashboard statistics
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/erp/admin/dashboard-stats'],
    enabled: !!user && user.role === 'admin',
    refetchInterval: 30000, // real-time-ish: refresh KPIs every 30s
  });

  // Leads overview: unassigned bifurcation + pincode responsibility (goal 1.3)
  const { data: leadsOverview } = useQuery<any>({
    queryKey: ['/api/erp/admin/leads-overview'],
    enabled: !!user && user.role === 'admin',
    refetchInterval: 30000,
  });

  useEffect(() => {
    // Fetch current user data
    const fetchUser = async () => {
      try {
        const response = await apiRequest('GET', '/api/erp/me');
        const userData = await response.json();
        
        // Verify user is admin
        if (userData.role !== 'admin') {
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'You do not have permission to access the admin dashboard.',
          });
          setLocation('/erp/login');
          return;
        }
        
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'Please login to access the dashboard.',
        });
        setLocation('/erp/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [setLocation, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const modules = [
    { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5 mr-3" /> },
    { id: 'users', name: 'User Management', icon: <Users className="w-5 h-5 mr-3" /> },
    { id: 'installer-applications', name: 'Installer Applications', icon: <UserCheck className="w-5 h-5 mr-3" /> },
    { id: 'webforms', name: 'Web Forms', icon: <ClipboardList className="w-5 h-5 mr-3" /> },
    { id: 'distributors', name: 'Distributor Management', icon: <UserCheck className="w-5 h-5 mr-3" /> },
    { id: 'products', name: 'Products Management', icon: <Package className="w-5 h-5 mr-3" /> },
    { id: 'vehicle-management', name: 'Vehicle Management', icon: <Car className="w-5 h-5 mr-3" /> },
    { id: 'inventory', name: 'Inventory Management', icon: <Database className="w-5 h-5 mr-3" /> },
    { id: 'claims', name: 'Claim Management', icon: <FileText className="w-5 h-5 mr-3" /> },
    { id: 'knowledge', name: 'Knowledge Hub', icon: <BookOpen className="w-5 h-5 mr-3" /> },
    { id: 'reports', name: 'Reports & Analytics', icon: <BarChart2 className="w-5 h-5 mr-3" /> },
    { id: 'settings', name: 'System Settings', icon: <Settings className="w-5 h-5 mr-3" /> },
    { id: 'logs', name: 'Audit Logs', icon: <List className="w-5 h-5 mr-3" /> },
  ];

  return (
    <div className="p-6">
      {/* Dashboard Content */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome to the P91 admin dashboard. Here's an overview of your system.
        </p>
      </div>
      
      {/* KPI Cards — MetricCard adds a developer-only "i" info/notes dot per box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <MetricCard
          widgetId="admin.dashboard.totalUsers"
          title="Total Users"
          loading={statsLoading}
          value={dashboardStats?.totalUsers || 0}
          subtitle="Pulse logins (ERP users + partners)"
        />

        <MetricCard
          widgetId="admin.dashboard.activeDistributors"
          title="Active Distributors"
          loading={statsLoading}
          value={dashboardStats?.activeDistributors || 0}
          subtitle="ERP Sales Partners"
        />

        <MetricCard
          widgetId="admin.dashboard.activeDetailers"
          title="Active Detailers"
          loading={statsLoading}
          value={dashboardStats?.activeDetailers || 0}
          subtitle="ERP Sales Partners"
        />

        <MetricCard
          widgetId="admin.dashboard.activeInstallers"
          title="Active Installers"
          loading={statsLoading}
          value={dashboardStats?.activeInstallers || 0}
          subtitle="ERP Sales Partners"
        />

        <MetricCard
          widgetId="admin.dashboard.unassignedLeads"
          title="Unassigned Leads"
          loading={!leadsOverview}
          value={leadsOverview?.unassigned || 0}
          subtitle={`${leadsOverview?.unassignedNoPin ?? 0} without pincode`}
          subtitleClassName="text-yellow-500"
        />

        <MetricCard
          widgetId="admin.dashboard.assignedLeads"
          title="Assigned Leads"
          loading={!leadsOverview}
          value={leadsOverview?.assigned || 0}
          subtitle="Partner responsible"
        />
      </div>

      {/* Interactive insights form: date range + territory, instant results */}
      <div className="mb-8">
        <LeadsInsights />
      </div>

      {/* Live activity feed — hidden per owner request (component kept) */}
      {/*
      <div className="mb-8">
        <LiveActivity />
      </div>
      */}

      {/* Provisioned ERP logins (goal 1.1) */}
      <div className="mb-8">
        <ProvisionedLogins />
      </div>

      {/* Regional Distribution and Top Brands */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Regional Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-center py-6 text-gray-500">Loading...</div>
            ) : dashboardStats?.regionalDistribution && Object.keys(dashboardStats.regionalDistribution).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(dashboardStats.regionalDistribution)
                  .sort((a: any, b: any) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([state, count]: [string, any]) => {
                    const total = Object.values(dashboardStats.regionalDistribution).reduce((a: number, b: any) => a + Number(b), 0);
                    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={state}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{state || 'Unknown'}</span>
                          <span className="text-sm font-medium">{count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-primary h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No regional data available
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Top Brands</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-center py-6 text-gray-500">Loading...</div>
            ) : dashboardStats?.topProducts && dashboardStats.topProducts.length > 0 ? (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Brand</TableHead>
                      <TableHead className="text-right">Leads</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardStats.topProducts.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.product}</TableCell>
                        <TableCell className="text-right">{item.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No brand data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Webhook Activity Section — hidden for now (redundant with Live Activity above) */}
      {/*
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Webhook Activity
        </h2>
        <WebhookActivity />
      </div>
      */}
    </div>
  );
}