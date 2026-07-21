import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  ShieldCheck,
  Search,
  Clock,
  CheckCircle,
  FileText,
  Calendar,
  Printer,
  Download
} from 'lucide-react';
import { InfoDot } from '@/components/dev/InfoDot';

export default function DistributorWarrantiesPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [user, setUser] = useState<any>(null);
  const [selectedWarranty, setSelectedWarranty] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [filteredWarranties, setFilteredWarranties] = useState<any[]>([]);
  const [expiringWarranties, setExpiringWarranties] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserAndWarranties = async () => {
      try {
        // Get current user
        const userResponse = await apiRequest('GET', '/api/erp/me');
        const userData = await userResponse.json();
        setUser(userData);

        // Get warranties - add cache buster to force fresh data
        const cacheBuster = `?_t=${Date.now()}`;
        const warrantyResponse = await apiRequest('GET', `/api/erp/distributor/warranties${cacheBuster}`);
        const warrantyData = await warrantyResponse.json();
        
        console.log('Warranty response:', warrantyData);
        
        // Handle new response format { warranties: [...], _timestamp: ... } or old format [...]
        const warrantiesArray = warrantyData.warranties || (Array.isArray(warrantyData) ? warrantyData : []);
        
        setWarranties(warrantiesArray);
        
        // Set expiring warranties (less than 3 months to expiry)
        const currentDate = new Date();
        const threeMonthsInMs = 90 * 24 * 60 * 60 * 1000;
        const currentTime = currentDate.getTime();
        
        const expiringWarrantiesData = warrantiesArray.filter(warranty => {
          const expiryTime = new Date(warranty.expiryDate).getTime();
          const isActive = warranty.status === 'active' || warranty.status === 'approved';
          return isActive && (expiryTime - currentTime) <= threeMonthsInMs;
        });
        
        setExpiringWarranties(expiringWarrantiesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load warranty data. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndWarranties();
  }, [toast]);

  useEffect(() => {
    // Filter warranties based on search query and active tab
    const filterWarranties = () => {
      let filtered = [...warranties];
      
      // Filter by status
      if (activeTab === 'active') {
        // Include both 'active' and 'approved' (legacy status)
        filtered = filtered.filter(warranty => 
          warranty.status === 'active' || warranty.status === 'approved'
        );
      } else if (activeTab === 'expired') {
        filtered = filtered.filter(warranty => warranty.status === 'expired');
      } else if (activeTab === 'expiring') {
        filtered = expiringWarranties;
      } else if (activeTab === 'all') {
        // Show all warranties regardless of status
        filtered = warranties;
      }

      // Filter by search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.trim().toLowerCase();
        filtered = filtered.filter(warranty => 
          (warranty.code?.toLowerCase()?.includes(query)) ||
          (warranty.customerName?.toLowerCase()?.includes(query)) ||
          (warranty.vehicleMake?.toLowerCase()?.includes(query)) ||
          (warranty.vehicleModel?.toLowerCase()?.includes(query)) ||
          (warranty.vehicleVIN?.toLowerCase()?.includes(query)) ||
          (warranty.productName?.toLowerCase()?.includes(query)) ||
          (warranty.detailerName?.toLowerCase()?.includes(query))
        );
      }
      
      setFilteredWarranties(filtered);
    };
    
    filterWarranties();
  }, [warranties, searchQuery, activeTab, expiringWarranties]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getWarrantyStatusBadge = (status: string, expiryDate: string) => {
    // Handle pending/submitted status first - these are awaiting approval
    if (status === 'pending' || status === 'submitted') {
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending Approval</Badge>;
    }
    
    // Handle rejected status
    if (status === 'rejected') {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
    }
    
    // For approved/active warranties, check expiry
    if (status === 'approved' || status === 'active') {
      if (!expiryDate) {
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
      }
      
      const today = new Date();
      const expiry = new Date(expiryDate);
      const threeMonthsFromNow = new Date(today.getTime() + (90 * 24 * 60 * 60 * 1000));
      
      if (expiry < today) {
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Expired</Badge>;
      } else if (expiry < threeMonthsFromNow) {
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Expiring Soon</Badge>;
      } else {
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
      }
    }
    
    // For expired status
    if (status === 'expired') {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Expired</Badge>;
    }
    
    // Default fallback
    return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">{status || 'Unknown'}</Badge>;
  };

  const handleViewDetails = (warranty: any) => {
    setSelectedWarranty(warranty);
    setDetailsOpen(true);
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Warranty Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage product warranties registered by detailers in your distribution area.
          </p>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card className="bg-slate-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between gap-2">
              <span className="flex items-center">
                <ShieldCheck className="h-5 w-5 mr-2 text-muted-foreground" />
                Total Warranties
              </span>
              <InfoDot widgetId="distributor.warranties.totalSummary" fallbackLabel="Total Warranties" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{warranties.length}</p>
            <p className="text-sm text-muted-foreground">Total registrations</p>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between gap-2">
              <span className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Active Warranties
              </span>
              <InfoDot widgetId="distributor.warranties.activeSummary" fallbackLabel="Active Warranties" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {warranties.filter(w => w.status === 'active' || w.status === 'approved').length}
            </p>
            <p className="text-sm text-muted-foreground">Currently valid warranties</p>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between gap-2">
              <span className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-amber-600" />
                Pending for Approval
              </span>
              <InfoDot widgetId="distributor.warranties.pendingSummary" fallbackLabel="Pending for Approval" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">
              {warranties.filter(w => w.status === 'pending' || w.status === 'submitted').length}
            </p>
            <p className="text-sm text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0 mb-6">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search warranties..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>
      
      {/* Tabs for Warranty Status */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="active">
            Active
            <Badge variant="outline" className="ml-2">
              {warranties.filter(w => w.status === 'active' || w.status === 'approved').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="expiring">
            Expiring Soon
            <Badge variant="outline" className="ml-2">{expiringWarranties.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="expired">
            Expired
            <Badge variant="outline" className="ml-2">
              {warranties.filter(w => w.status === 'expired').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="all">
            All Warranties
            <Badge variant="outline" className="ml-2">{warranties.length}</Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          <WarrantiesTable 
            warranties={filteredWarranties} 
            formatDate={formatDate} 
            getWarrantyStatusBadge={getWarrantyStatusBadge}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>
        
        <TabsContent value="expiring">
          <WarrantiesTable 
            warranties={filteredWarranties} 
            formatDate={formatDate} 
            getWarrantyStatusBadge={getWarrantyStatusBadge}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>
        
        <TabsContent value="expired">
          <WarrantiesTable 
            warranties={filteredWarranties} 
            formatDate={formatDate} 
            getWarrantyStatusBadge={getWarrantyStatusBadge}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>
        
        <TabsContent value="all">
          <WarrantiesTable 
            warranties={filteredWarranties} 
            formatDate={formatDate} 
            getWarrantyStatusBadge={getWarrantyStatusBadge}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>
      </Tabs>
      
      {/* Warranty Details Dialog */}
      {selectedWarranty && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Warranty Details</DialogTitle>
              <DialogDescription>
                Full information about warranty {selectedWarranty.code}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Warranty Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Warranty Code:</span>
                    <span className="font-medium">{selectedWarranty.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Registration Date:</span>
                    <span>{formatDate(selectedWarranty.registrationDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Expiry Date:</span>
                    <span>{formatDate(selectedWarranty.expiryDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span>{getWarrantyStatusBadge(selectedWarranty.status, selectedWarranty.expiryDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Product:</span>
                    <span>{selectedWarranty.productName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Coverage:</span>
                    <span>{selectedWarranty.coverageLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Serial Number:</span>
                    <span>{selectedWarranty.serialNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Registered By:</span>
                    <span>{selectedWarranty.registeredBy || selectedWarranty.detailerName || 'Via Public Page'}</span>
                  </div>
                </CardContent>
              </Card>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name:</span>
                      <span>{selectedWarranty.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span>{selectedWarranty.customerEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phone:</span>
                      <span>{selectedWarranty.customerPhone}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Vehicle Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Make & Model:</span>
                      <span>{selectedWarranty.vehicleMake} {selectedWarranty.vehicleModel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Year:</span>
                      <span>{selectedWarranty.vehicleYear}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Color:</span>
                      <span>{selectedWarranty.vehicleColor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">VIN:</span>
                      <span>{selectedWarranty.vehicleVIN}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {selectedWarranty.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{selectedWarranty.notes}</p>
                </CardContent>
              </Card>
            )}
            
            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => setDetailsOpen(false)}
              >
                Close
              </Button>
              <Button>
                <Printer className="h-4 w-4 mr-2" />
                Print Warranty
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Separate component for the warranties table
function WarrantiesTable({ 
  warranties, 
  formatDate, 
  getWarrantyStatusBadge,
  onViewDetails 
}: { 
  warranties: any[],
  formatDate: (date: string) => string,
  getWarrantyStatusBadge: (status: string, expiryDate: string) => JSX.Element | null,
  onViewDetails: (warranty: any) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center">Warranties</span>
          <InfoDot widgetId="distributor.warranties.table" fallbackLabel="Warranties Table" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {warranties.length === 0 ? (
          <div className="text-center py-8">
            <ShieldCheck className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900">No warranties found</h3>
            <p className="text-sm text-gray-500 mt-1">
              No warranties match your current filter criteria.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Warranty Code</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Registered By</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warranties.map((warranty) => (
                <TableRow key={warranty.id}>
                  <TableCell className="font-medium">{warranty.code}</TableCell>
                  <TableCell>{warranty.customerName}</TableCell>
                  <TableCell>
                    {warranty.vehicleMake} {warranty.vehicleModel} ({warranty.vehicleYear})
                  </TableCell>
                  <TableCell>{warranty.productName}</TableCell>
                  <TableCell>
                    {warranty.registeredBy || warranty.detailerName || 'Via Public Page'}
                  </TableCell>
                  <TableCell>{formatDate(warranty.registrationDate)}</TableCell>
                  <TableCell>{formatDate(warranty.expiryDate)}</TableCell>
                  <TableCell>
                    {getWarrantyStatusBadge(warranty.status, warranty.expiryDate)}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onViewDetails(warranty)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}