import React from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PieChart,
  UserCheck,
  Calendar,
  User, 
  Building2, 
  Briefcase, 
  MapPin, 
  Mail, 
  Phone, 
  Shield, 
  Clock, 
  FileCheck,
  FileClock,
  FileX,
  UserCog,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import SidebarLayout from '@/components/layouts/sidebar-layout';
import { Separator } from '@/components/ui/separator';

export default function UserDetailPage() {
  const { id } = useParams();
  const userId = parseInt(id, 10);
  const { toast } = useToast();
  
  const { data: user, isLoading: isLoadingUser, error: userError } = useQuery({
    queryKey: ['/api/erp/users', userId],
    queryFn: async () => {
      const res = await fetch(`/api/erp/users/${userId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch user data');
      }
      return res.json();
    },
    enabled: !isNaN(userId)
  });
  
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['/api/erp/users/metrics', userId],
    queryFn: async () => {
      const res = await fetch(`/api/erp/users/${userId}/metrics`);
      if (!res.ok) {
        throw new Error('Failed to fetch user metrics');
      }
      return res.json();
    },
    enabled: !isNaN(userId) && Boolean(user)
  });
  
  if (isLoadingUser || isNaN(userId)) {
    return <LoadingUserProfile />;
  }
  
  if (userError || !user) {
    return (
      <ErrorState 
        title="User not found" 
        description="We couldn't find the user you're looking for. Please check the ID and try again."
      />
    );
  }
  
  return (
    <SidebarLayout>
      <div className="container mx-auto py-8 max-w-7xl">
        <div className="flex flex-col gap-6">
          {/* Header with basic user info */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-primary/20">
                <AvatarFallback className="text-2xl bg-primary/10 text-primary-foreground">
                  {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h1 className="text-3xl font-bold">{user.name || user.username}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  {getRoleBadge(user.role)}
                  {getApprovalStatus(user)}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Send Message
              </Button>
              <Button variant="outline">
                <UserCog className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
              <Button variant={user.isActive ? "destructive" : "default"}>
                <Shield className="mr-2 h-4 w-4" />
                {user.isActive ? "Disable Access" : "Enable Access"}
              </Button>
            </div>
          </div>
          
          <Separator />
          
          {/* Main content with tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full md:w-[400px] grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Business Information */}
                <Card className="col-span-1 md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building2 className="mr-2 h-5 w-5" />
                      Business Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Business Name</p>
                          <p className="font-medium">{getBusinessName(user)}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground">Business Type</p>
                          <p className="font-medium">{getBusinessDescriptionByRole(user.role)}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground">Location</p>
                          <p className="font-medium">{getLocation(user)}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{user.email || "Not provided"}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">{user.phone || "Not provided"}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground">Member Since</p>
                          <p className="font-medium">{user.createdAt ? formatDate(user.createdAt) : "Unknown"}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Account Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="mr-2 h-5 w-5" />
                      Account Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <div className="mt-1">{getApprovalStatus(user)}</div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">Access</p>
                        <Badge variant={user.isActive ? "default" : "destructive"} className="mt-1">
                          {user.isActive ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">Last Login</p>
                        <p className="font-medium">
                          {user.lastLogin ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true }) : "Never"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Metrics */}
                <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {user.role === 'distributor' && (
                    <>
                      <MetricCard 
                        title="Active Detailers" 
                        value={metrics?.activeDetailers || 0}
                        icon={<Users className="h-5 w-5" />}
                        description="Approved detailers under this distributor"
                      />
                      
                      <MetricCard 
                        title="B2B Leads" 
                        value={metrics?.b2bLeads || 0}
                        icon={<Briefcase className="h-5 w-5" />}
                        description="Business-to-business leads"
                      />
                      
                      <MetricCard 
                        title="End User Leads" 
                        value={metrics?.endUserLeads || 0}
                        icon={<User className="h-5 w-5" />}
                        description="Direct consumer leads"
                      />
                    </>
                  )}
                  
                  {(user.role === 'detailer' || user.role === 'installer') && (
                    <>
                      <MetricCard 
                        title="Total Leads" 
                        value={metrics?.totalLeads || 0}
                        icon={<UserCheck className="h-5 w-5" />}
                        description="All customer leads"
                      />
                      
                      <MetricCard 
                        title="Converted Leads" 
                        value={metrics?.convertedLeads || 0}
                        icon={<FileCheck className="h-5 w-5" />}
                        description="Successfully converted leads"
                        percentage={metrics?.totalLeads ? (metrics.convertedLeads / metrics.totalLeads) * 100 : 0}
                      />
                      
                      <MetricCard 
                        title="Lost Leads" 
                        value={metrics?.lostLeads || 0}
                        icon={<FileX className="h-5 w-5" />}
                        description="Lost opportunities"
                        percentage={metrics?.totalLeads ? (metrics.lostLeads / metrics.totalLeads) * 100 : 0}
                      />
                    </>
                  )}
                  
                  {/* Common metrics for all roles */}
                  <MetricCard 
                    title="Registered Warranties" 
                    value={metrics?.warrantyRegistrations || 0}
                    icon={<PieChart className="h-5 w-5" />}
                    description="Total warranties registered"
                  />
                  
                  <MetricCard 
                    title="Pending Warranties" 
                    value={metrics?.pendingWarranties || 0}
                    icon={<FileClock className="h-5 w-5" />}
                    description="Warranties awaiting approval"
                  />
                  
                  <MetricCard 
                    title="Active Since" 
                    value={metrics?.activeSince ? formatDistanceToNow(new Date(metrics.activeSince)) : "Unknown"}
                    icon={<Calendar className="h-5 w-5" />}
                    description="Time as active member"
                    isText={true}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="activity" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest actions performed by this user
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Activity log will be implemented in a future update.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SidebarLayout>
  );
}

function LoadingUserProfile() {
  return (
    <SidebarLayout>
      <div className="container mx-auto py-8 max-w-7xl">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-gray-200 animate-pulse"></div>
            <div>
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mt-2"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2 h-80 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-80 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-40 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-40 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-40 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

function ErrorState({ title, description }: { title: string; description: string }) {
  return (
    <SidebarLayout>
      <div className="container mx-auto py-8 max-w-7xl flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    </SidebarLayout>
  );
}

function MetricCard({ 
  title, 
  value, 
  icon, 
  description, 
  percentage,
  isText = false
}: { 
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description: string;
  percentage?: number;
  isText?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          {percentage !== undefined && !isNaN(percentage) && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({percentage.toFixed(0)}%)
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function getRoleBadge(role: string) {
  switch (role) {
    case 'admin':
      return <Badge variant="default" className="bg-purple-500">Admin</Badge>;
    case 'distributor':
      return <Badge variant="default" className="bg-blue-500">Distributor</Badge>;
    case 'detailer':
      return <Badge variant="default" className="bg-green-500">Detailer</Badge>;
    default:
      return <Badge variant="outline">{role}</Badge>;
  }
}

function getBusinessDescriptionByRole(role: string) {
  switch (role) {
    case 'admin':
      return 'P91 Administration';
    case 'distributor':
      return 'Product Distribution';
    case 'detailer':
      return 'Installation & Services';
    default:
      return 'Unknown';
  }
}

function getBusinessName(user: any) {
  if (user.businessName) return user.businessName;
  if (user.studioName) return user.studioName;
  if (user.name) return `${user.name}'s Business`;
  return 'Not specified';
}

function getLocation(user: any) {
  if (user.city && user.pincode) return `${user.city}, ${user.pincode}`;
  if (user.city) return user.city;
  if (user.address) return user.address;
  return 'Not specified';
}

function getApprovalStatus(user: any) {
  switch (user.status) {
    case 'approved':
      return <Badge variant="default" className="bg-green-500">Approved</Badge>;
    case 'pending':
      return <Badge variant="default" className="bg-yellow-500 text-black">Pending</Badge>;
    case 'rejected':
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="outline">{user.status || 'Unknown'}</Badge>;
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}