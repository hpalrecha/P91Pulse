import { useState, useEffect, useRef, Suspense } from 'react';
import { useLocation } from 'wouter';
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  FileText,
  Package,
  BookOpen,
  FileInput,
  LogOut,
  Menu,
  X,
  FileCheck,
  ClipboardList,
  Webhook,
  Zap,
  Car,
  ShoppingCart,
  Gift,
  Sliders
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { User } from '@shared/schema';
import DevToolbar from '@/components/dev/DevToolbar';
import { InfoDot } from '@/components/dev/InfoDot';
import { PageNotesButton } from '@/components/dev/PageNotesButton';
import p91PulseLogo from "@assets/P91 PULSE logo-02_1761587817659.png";

interface SidebarLayoutProps {
  children: React.ReactNode;
  activeModule?: string;
}

export default function SidebarLayout({ children, activeModule }: SidebarLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch user data on component mount
  useEffect(() => {
    
    const fetchUser = async () => {
      try {
        const response = await apiRequest('GET', '/api/erp/me');
        const userData = await response.json();
        if (userData && typeof userData === 'object') {
          setUser(userData);
        } else {
          throw new Error('Invalid user data received');
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'Please log in to access this page.',
        });
        // Preserve the originally requested URL so the user is sent back here
        // after a successful login (e.g. when arriving from an email link).
        const currentPath = window.location.pathname + window.location.search;
        const isAuthPath = currentPath.startsWith('/erp/login') || currentPath.startsWith('/erp/otpless-login');
        const loginUrl = !isAuthPath
          ? `/erp/login?next=${encodeURIComponent(currentPath)}`
          : '/erp/login';
        setLocation(loginUrl);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [setLocation, toast]);

  // Client-side role guard: keep each role inside its own /erp/<role>/* section.
  // The backend already enforces data access; this stops a logged-in user from
  // loading another role's page shell just by typing the URL.
  useEffect(() => {
    if (!user) return;
    const section = location.startsWith('/erp/admin')
      ? 'admin'
      : location.startsWith('/erp/distributor')
      ? 'distributor'
      : location.startsWith('/erp/detailer')
      ? 'detailer'
      : location.startsWith('/erp/sales')
      ? 'sales'
      : null;
    if (!section) return;
    const allowed =
      user.role === 'admin'
        ? 'admin'
        : user.role === 'distributor'
        ? 'distributor'
        : user.role === 'detailer' || user.role === 'installer'
        ? 'detailer'
        : user.role === 'national_sales_manager' || user.role === 'regional_sales_manager' || user.role === 'asm' || user.role === 'salesperson'
        ? 'sales'
        : null;
    if (allowed && section !== allowed) {
      setLocation(`/erp/${allowed}/dashboard`);
    }
  }, [user, location, setLocation]);

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');

      // Clear cached queries so the next user in this browser doesn't see stale data.
      queryClient.clear();

      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });

      setLocation('/erp/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'There was an error during logout. Please try again.',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Define navigation modules based on user role
  const getModulesForRole = () => {
    if (user?.role === 'admin') {
      return [
        { 
          id: 'dashboard', 
          name: 'Dashboard', 
          icon: <LayoutDashboard className="w-5 h-5 mr-3" />,
          path: '/erp/admin/dashboard'
        },
        { 
          id: 'user-management', 
          name: 'User Management', 
          icon: <Users className="w-5 h-5 mr-3" />,
          path: '/erp/admin/user-management'
        },
        { 
          id: 'sales-partners', 
          name: 'Sales Partner Management', 
          icon: <Users className="w-5 h-5 mr-3" />,
          path: '/erp/admin/sales-partners'
        },
        { 
          id: 'management', 
          name: 'Management', 
          icon: <Sliders className="w-5 h-5 mr-3" />,
          path: '/erp/admin/management'
        },
        { 
          id: 'lead-management', 
          name: 'Lead Management', 
          icon: <ClipboardList className="w-5 h-5 mr-3" />,
          path: '/erp/admin/lead-management'
        },
        { 
          id: 'vehicle-management', 
          name: 'Vehicle Management', 
          icon: <Car className="w-5 h-5 mr-3" />,
          path: '/erp/admin/vehicle-management'
        },
        { 
          id: 'webforms', 
          name: 'Web Forms', 
          icon: <FileInput className="w-5 h-5 mr-3" />,
          path: '/erp/admin/webforms'
        },
        { 
          id: 'warranty-registrations', 
          name: 'Warranty Management', 
          icon: <ShieldCheck className="w-5 h-5 mr-3" />,
          path: '/erp/admin/warranty-registrations'
        },
        { 
          id: 'claims', 
          name: 'Claim Management', 
          icon: <FileText className="w-5 h-5 mr-3" />,
          path: '/erp/admin/claims'
        },
        { 
          id: 'inventory', 
          name: 'Inventory', 
          icon: <Package className="w-5 h-5 mr-3" />,
          path: '/erp/admin/inventory'
        },
        { 
          id: 'sold-units', 
          name: 'Sold Units Database', 
          icon: <FileCheck className="w-5 h-5 mr-3" />,
          path: '/erp/admin/sold-units'
        },
        { 
          id: 'knowledge', 
          name: 'Knowledge Hub', 
          icon: <BookOpen className="w-5 h-5 mr-3" />,
          path: '/erp/admin/knowledge'
        },
        { 
          id: 'webhook-management', 
          name: 'Webhook Management', 
          icon: <Webhook className="w-5 h-5 mr-3" />,
          path: '/erp/admin/webhook-management'
        },
        { 
          id: 'pulse-applications', 
          name: 'P91 Pulse Applications', 
          icon: <Zap className="w-5 h-5 mr-3" />,
          path: '/erp/admin/pulse-applications'
        },
        { 
          id: 'orders', 
          name: 'Order Management', 
          icon: <ShoppingCart className="w-5 h-5 mr-3" />,
          path: '/erp/admin/orders'
        },
        { 
          id: 'reward-claims', 
          name: 'Reward Claims', 
          icon: <Gift className="w-5 h-5 mr-3" />,
          path: '/erp/admin/reward-claims'
        },
      ];
    } else if (user?.role === 'distributor') {
      return [
        { 
          id: 'dashboard', 
          name: 'Dashboard', 
          icon: <LayoutDashboard className="w-5 h-5 mr-3" />,
          path: '/erp/distributor/dashboard'
        },
        { 
          id: 'user-management', 
          name: 'User Management', 
          icon: <Users className="w-5 h-5 mr-3" />,
          path: '/erp/distributor/user-management'
        },
        { 
          id: 'sales-partners', 
          name: 'Sales Partner Management', 
          icon: <Users className="w-5 h-5 mr-3" />,
          path: '/erp/distributor/sales-partners'
        },
        { 
          id: 'management', 
          name: 'Management', 
          icon: <Sliders className="w-5 h-5 mr-3" />,
          path: '/erp/distributor/management'
        },
        { 
          id: 'detailer-invite', 
          name: 'Detailer Invite', 
          icon: <Users className="w-5 h-5 mr-3" />,
          path: '/erp/distributor/detailer-invite'
        },
        { 
          id: 'detailers', 
          name: 'Detailer Management', 
          icon: <Users className="w-5 h-5 mr-3" />,
          path: '/erp/distributor/detailers'
        },
        { 
          id: 'inventory', 
          name: 'Inventory Management', 
          icon: <Package className="w-5 h-5 mr-3" />,
          path: '/erp/distributor/inventory'
        },
        { 
          id: 'warranties', 
          name: 'Warranty Dashboard', 
          icon: <ShieldCheck className="w-5 h-5 mr-3" />,
          path: '/erp/distributor/warranties'
        },
        { 
          id: 'claims', 
          name: 'Claim Management', 
          icon: <ClipboardList className="w-5 h-5 mr-3" />,
          path: '/erp/distributor/claims'
        },
        { 
          id: 'leads', 
          name: 'Lead Management', 
          icon: <ClipboardList className="w-5 h-5 mr-3" />,
          path: '/erp/distributor/leads'
        },
        { 
          id: 'vehicle-search', 
          name: 'Vehicle Search', 
          icon: <FileText className="w-5 h-5 mr-3" />,
          path: '/erp/distributor/vehicle-search'
        },
        { 
          id: 'knowledge', 
          name: 'Knowledge Hub', 
          icon: <BookOpen className="w-5 h-5 mr-3" />,
          path: '/erp/distributor/knowledge-hub'
        },
        { 
          id: 'orders', 
          name: 'Place Order', 
          icon: <ShoppingCart className="w-5 h-5 mr-3" />,
          path: '/erp/distributor/orders'
        },
      ];
    } else if (user?.role === 'national_sales_manager' || user?.role === 'regional_sales_manager' || user?.role === 'asm' || user?.role === 'salesperson') {
      // Sales team — nav depends on the specific sales role
      const sales = [
        {
          id: 'dashboard',
          name: 'Dashboard',
          icon: <LayoutDashboard className="w-5 h-5 mr-3" />,
          path: '/erp/sales/dashboard'
        },
      ];
      if (user?.role === 'national_sales_manager') {
        sales.push({
          id: 'team',
          name: 'Sales Team',
          icon: <Users className="w-5 h-5 mr-3" />,
          path: '/erp/sales/team'
        });
      }
      if (user?.role === 'national_sales_manager' || user?.role === 'regional_sales_manager') {
        sales.push({
          id: 'leads',
          name: 'Lead Management',
          icon: <ClipboardList className="w-5 h-5 mr-3" />,
          path: '/erp/sales/leads'
        });
        sales.push({
          id: 'user-management',
          name: 'User Management',
          icon: <Users className="w-5 h-5 mr-3" />,
          path: '/erp/sales/user-management'
        });
        sales.push({
          id: 'sales-partners',
          name: 'Sales Partner Management',
          icon: <Users className="w-5 h-5 mr-3" />,
          path: '/erp/sales/sales-partners'
        });
        sales.push({
          id: 'management',
          name: 'Management',
          icon: <Sliders className="w-5 h-5 mr-3" />,
          path: '/erp/sales/management'
        });
        sales.push({
          id: 'distributors',
          name: 'Distributors',
          icon: <Users className="w-5 h-5 mr-3" />,
          path: '/erp/sales/distributors'
        });
      }
      if (user?.role === 'asm') {
        // ASM works his distributor's leads (inherited coverage).
        sales.push({
          id: 'leads',
          name: 'Lead Management',
          icon: <ClipboardList className="w-5 h-5 mr-3" />,
          path: '/erp/sales/leads'
        });
      }
      if (user?.role === 'salesperson') {
        // The salesperson's main job IS lead management (the unassigned queue).
        sales.push({
          id: 'leads',
          name: 'Lead Management',
          icon: <ClipboardList className="w-5 h-5 mr-3" />,
          path: '/erp/sales/leads'
        });
        sales.push({
          id: 'customers',
          name: 'My Customers',
          icon: <Users className="w-5 h-5 mr-3" />,
          path: '/erp/sales/customers'
        });
      }
      return sales;
    } else {
      // Detailer role
      return [
        {
          id: 'dashboard',
          name: 'Dashboard',
          icon: <LayoutDashboard className="w-5 h-5 mr-3" />,
          path: '/erp/detailer/dashboard'
        },
        { 
          id: 'customers', 
          name: 'Customer Management', 
          icon: <Users className="w-5 h-5 mr-3" />,
          path: '/erp/detailer/customers'
        },
        { 
          id: 'leads', 
          name: 'Lead Management', 
          icon: <ClipboardList className="w-5 h-5 mr-3" />,
          path: '/erp/detailer/leads'
        },
        { 
          id: 'vehicles', 
          name: 'Vehicle Management', 
          icon: <Package className="w-5 h-5 mr-3" />,
          path: '/erp/detailer/vehicles'
        },
        { 
          id: 'vehicle-search', 
          name: 'Vehicle Search', 
          icon: <FileText className="w-5 h-5 mr-3" />,
          path: '/erp/detailer/vehicle-search'
        },
        { 
          id: 'warranties', 
          name: 'Warranty Dashboard', 
          icon: <ShieldCheck className="w-5 h-5 mr-3" />,
          path: '/erp/detailer/warranties'
        },
        { 
          id: 'claims', 
          name: 'Claim Management', 
          icon: <ClipboardList className="w-5 h-5 mr-3" />,
          path: '/erp/detailer/claims'
        },
        { 
          id: 'inventory', 
          name: 'My Inventory', 
          icon: <Package className="w-5 h-5 mr-3" />,
          path: '/erp/detailer/inventory'
        },
        { 
          id: 'knowledge', 
          name: 'Knowledge Hub', 
          icon: <BookOpen className="w-5 h-5 mr-3" />,
          path: '/erp/detailer/knowledge-hub'
        },
        { 
          id: 'orders', 
          name: 'Place Order', 
          icon: <ShoppingCart className="w-5 h-5 mr-3" />,
          path: '/erp/detailer/orders'
        },
        { 
          id: 'rewards', 
          name: 'Claim Rewards', 
          icon: <Gift className="w-5 h-5 mr-3" />,
          path: '/erp/detailer/rewards'
        },
      ];
    }
  };

  // P91pulse scope (docs/LEAD-FLOW-SPEC.md): only the target tabs are live —
  // Dashboard, User Management, Sales Partners, Lead Management. The other
  // stage modules stay in the codebase but are hidden until they're ported.
  const SCOPED_MODULE_IDS = ['dashboard', 'user-management', 'sales-partners', 'lead-management', 'leads', 'webforms'];
  const modules = getModulesForRole().filter((m) => SCOPED_MODULE_IDS.includes(m.id));

  const getRoleTitle = () => {
    switch (user?.role) {
      case 'admin':
        return 'P91 Pulse';
      case 'distributor':
        return 'P91 Pulse';
      case 'detailer':
        return 'P91 Pulse';
      default:
        return 'P91 Pulse';
    }
  };

  // Prevent double rendering
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100" key="sidebar-layout-main">
      {/* Mobile menu toggle */}
      <div className="md:hidden fixed top-0 left-0 z-20 p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="bg-white shadow-md"
        >
          <Menu />
        </Button>
      </div>

      {/* Sidebar - Mobile */}
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black bg-opacity-50">
          <div className="h-full w-64 bg-white">
            <div className="flex items-center justify-between p-4 border-b">
              <img src={p91PulseLogo} alt="P91 Pulse" className="h-10" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
              <nav className="flex-1 px-3 space-y-2">
                {modules.map((module) => (
                  <div key={module.id} className="flex items-center gap-1">
                    <Button
                      variant={
                        activeModule === module.id || location === module.path
                          ? "default"
                          : "ghost"
                      }
                      className="flex-1 justify-start text-left"
                      onClick={() => {
                        setLocation(module.path);
                        setIsMobileSidebarOpen(false);
                      }}
                    >
                      {module.icon}
                      {module.name}
                    </Button>
                    {/* Dev-only "i": notes + meaning for this sidebar tab (DB-backed). */}
                    <InfoDot widgetId={`tab:${module.path}`} fallbackLabel={module.name} className="shrink-0 p-1" />
                  </div>
                ))}
              </nav>
            </div>
            
            <div className="p-4 border-t">
              <div className="flex items-center mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white shadow-lg z-10">
        <div className="flex items-center justify-center h-16 border-b">
          <img src={p91PulseLogo} alt="P91 Pulse" className="h-10" />
        </div>
        
        <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
          <nav className="flex-1 px-3 space-y-2">
            {modules.map((module) => (
              <div key={module.id} className="flex items-center gap-1">
                <Button
                  variant={
                    activeModule === module.id || location === module.path
                      ? "default"
                      : "ghost"
                  }
                  className="flex-1 justify-start text-left"
                  onClick={() => setLocation(module.path)}
                >
                  {module.icon}
                  {module.name}
                </Button>
                {/* Dev-only "i": notes + meaning for this sidebar tab (DB-backed). */}
                <InfoDot widgetId={`tab:${module.path}`} fallbackLabel={module.name} className="shrink-0 p-1" />
              </div>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t">
          <div className="flex items-center mb-4">
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 min-h-screen overflow-auto">
        {/* Developer toolbar (impersonation switcher + annotation mode).
            Renders nothing unless the logged-in user has the dev capability. */}
        <DevToolbar />
        {/* Mobile header */}
        <div className="md:hidden bg-white shadow-sm p-4 flex items-center">
          <h1 className="text-xl font-bold text-primary ml-10">{getRoleTitle()}</h1>
        </div>
        {/* Suspense lives inside the layout so navigating between lazy-loaded
            pages only swaps the content area — the sidebar stays mounted and we
            don't re-fetch /api/erp/me on every navigation. */}
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }
        >
          {children}
        </Suspense>
        {/* Floating in-content "i" for the current tab (dev-only). */}
        <PageNotesButton />
      </div>
    </div>
  );
}