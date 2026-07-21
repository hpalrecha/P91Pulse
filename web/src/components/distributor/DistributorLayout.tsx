import { useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Users, 
  Database, 
  ShieldCheck, 
  FileText, 
  UserSquare,
  BookOpen, 
  LogOut, 
  LayoutDashboard,
  ChevronUp,
  ChevronDown,
  Bell,
  ClipboardList,
  UserRound
} from 'lucide-react';

interface DistributorLayoutProps {
  children: ReactNode;
  activeModule: string;
}

export default function DistributorLayout({ children, activeModule }: DistributorLayoutProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Fetch current user data
    const fetchUser = async () => {
      try {
        const response = await apiRequest('GET', '/api/erp/me');
        const userData = await response.json();
        
        // Verify user is distributor
        if (userData.role !== 'distributor') {
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'You do not have permission to access the distributor portal.',
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

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/erp/logout');
      
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

  const handleModuleClick = (moduleId: string) => {
    switch (moduleId) {
      case 'dashboard':
        setLocation('/erp/distributor/dashboard');
        break;
      case 'detailers':
        setLocation('/erp/distributor/detailers');
        break;
      case 'inventory':
        setLocation('/erp/distributor/inventory');
        break;
      case 'warranties':
        setLocation('/erp/distributor/warranties');
        break;
      case 'claims':
        setLocation('/erp/distributor/claims');
        break;
      case 'leads':
        setLocation('/erp/distributor/leads');
        break;
      case 'knowledge':
        setLocation('/erp/distributor/knowledge-hub');
        break;
      default:
        setLocation('/erp/distributor/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const modules = [
    { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5 mr-3" /> },
    { id: 'detailers', name: 'Detailer Management', icon: <Users className="w-5 h-5 mr-3" /> },
    { id: 'inventory', name: 'Inventory Management', icon: <Database className="w-5 h-5 mr-3" /> },
    { id: 'warranties', name: 'Warranty Management', icon: <ShieldCheck className="w-5 h-5 mr-3" /> },
    { id: 'claims', name: 'Claim Management', icon: <FileText className="w-5 h-5 mr-3" /> },
    { id: 'leads', name: 'Lead Management', icon: <ClipboardList className="w-5 h-5 mr-3" /> },
    { id: 'knowledge', name: 'Knowledge Hub', icon: <BookOpen className="w-5 h-5 mr-3" /> },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white shadow-lg z-10">
        <div className="flex items-center justify-center h-16 border-b">
          <h1 className="text-xl font-bold text-primary">P91 Distributor Portal</h1>
        </div>
        
        <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
          <nav className="flex-1 px-3 space-y-2">
            {modules.map((module) => (
              <Button
                key={module.id}
                variant={activeModule === module.id ? "default" : "ghost"}
                className="w-full justify-start text-left"
                onClick={() => handleModuleClick(module.id)}
              >
                {module.icon}
                {module.name}
              </Button>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t">
          <div className="flex items-center mb-4">
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.name || 'Distributor User'}</p>
              <p className="text-xs text-gray-500">{user?.email || 'distributor@p91india.com'}</p>
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
      
      {/* Mobile header */}
      <div className="md:hidden bg-white shadow-sm z-10 fixed top-0 inset-x-0">
        <div className="px-4 flex items-center justify-between h-16">
          <h1 className="text-lg font-bold text-primary">P91 Distributor Portal</h1>
          
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
        </div>
        
        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white shadow-md">
            {modules.map((module) => (
              <Button
                key={module.id}
                variant={activeModule === module.id ? "default" : "ghost"}
                className="w-full justify-start text-left"
                onClick={() => {
                  handleModuleClick(module.id);
                  setMobileMenuOpen(false);
                }}
              >
                {module.icon}
                {module.name}
              </Button>
            ))}
            
            <Button
              variant="outline"
              className="w-full justify-start mt-2"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        )}
      </div>
      
      {/* Main content */}
      <div className="md:ml-64 flex-1 flex flex-col">
        <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}