import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Eye, Search, FileDown, Check, X, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InfoDot } from "@/components/dev/InfoDot";

export default function WarrantyRegistrationsPage() {
  const [, navigate] = useLocation();
  const initialBatch = new URLSearchParams(window.location.search).get('batch') || '';
  const [searchTerm, setSearchTerm] = useState(initialBatch);
  const { toast } = useToast();
  const [actionReason, setActionReason] = useState("");
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    warrantyId: number;
    action: 'approve' | 'reject' | 'hold';
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Handle view details action - testing with static route
  const handleViewDetails = (id: number) => {
    const url = `/erp/admin/warranty-detail?id=${id}`;
    console.log(`Testing navigation to: ${url}`);
    navigate(url);
  };

  // Status update mutation
  const statusUpdateMutation = useMutation({
    mutationFn: async ({ warrantyId, status, reason }: { warrantyId: number; status: string; reason?: string }) => {
      const response = await apiRequest('POST', `/api/warranty-registrations/${warrantyId}/status`, {
        status,
        reason
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Status Updated",
        description: `Warranty status updated to ${variables.status}`,
      });
      // Invalidate and refetch the warranties list
      queryClient.invalidateQueries({ queryKey: ['/api/warranty-registrations'] });
      setActionDialogOpen(false);
      setPendingAction(null);
      setActionReason("");
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update warranty status",
        variant: "destructive",
      });
    }
  });

  const handleStatusAction = (warrantyId: number, action: 'approve' | 'reject' | 'hold') => {
    if (action === 'approve') {
      // Approve directly without reason
      statusUpdateMutation.mutate({ 
        warrantyId, 
        status: 'approved' 
      });
    } else {
      // For reject or hold, open dialog for reason
      setPendingAction({ warrantyId, action });
      setActionDialogOpen(true);
    }
  };

  const confirmAction = () => {
    if (!pendingAction) return;
    
    const status = pendingAction.action === 'reject' ? 'rejected' : 'on-hold';
    statusUpdateMutation.mutate({
      warrantyId: pendingAction.warrantyId,
      status,
      reason: actionReason
    });
  };

  // Fetch user data first to ensure authenticated
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/erp/me'],
  });

  // Fetch warranty registrations only if user is authenticated
  const { data: warrantyRegistrations = [], isLoading: isLoadingWarranties } = useQuery({
    queryKey: ['/api/warranty-registrations'],
    enabled: !!userData, // Only run this query if we have user data
  });
  
  // Combined loading state
  const isLoading = isLoadingUser || isLoadingWarranties;

  // Filter registrations based on search term and status
  const filteredRegistrations = Array.isArray(warrantyRegistrations) ? 
    warrantyRegistrations.filter((registration: any) => {
      const matchesSearch = searchTerm === "" || 
        registration.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.phone?.includes(searchTerm) ||
        registration.warrantyCode?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || registration.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    }) : [];

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "on-hold":
        return <Badge className="bg-yellow-100 text-yellow-800">On Hold</Badge>;
      case "pending":
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
    }
  };
  
  // Handle export to CSV functionality
  const exportToCSV = (registrations: any[]) => {
    // Define all fields to include in the CSV
    const csvFields = [
      { label: 'ID', key: 'id' },
      { label: 'Registration Date', key: 'createdAt' },
      { label: 'Status', key: 'status' },
      { label: 'Status Date', key: 'statusDate' },
      { label: 'Status Notes', key: 'statusNotes' },
      
      // Warranty Information
      { label: 'Warranty Code', key: 'warrantyCode' },
      { label: 'Product Type', key: 'productType' },
      { label: 'Installation Date', key: 'installationDate' },
      
      // Installer & Store Details
      { label: 'Installer Name', key: 'installer' },
      { label: 'Installer Mobile', key: 'installerMobile' },
      { label: 'Store Name', key: 'storeName' },
      { label: 'Store Email', key: 'storeEmail' },
      { label: 'Store Location', key: 'storeLocation' },
      
      // Customer Information
      { label: 'Customer Name', key: 'name' },
      { label: 'Customer Email', key: 'email' },
      { label: 'Customer Phone', key: 'phone' },
      
      // Vehicle Information
      { label: 'Vehicle Make', key: 'vehicleMake' },
      { label: 'Vehicle Model', key: 'vehicleModel' },
      { label: 'Vehicle Year', key: 'vehicleYear' },
      { label: 'Vehicle Color', key: 'vehicleColor' },
      { label: 'Vehicle VIN', key: 'vehicleVIN' },
      
      // PPF Installation Areas
      { label: 'Full Car PPF', key: 'fullCarPPF' },
      { label: 'Partial Car PPF', key: 'partialCarPPF' },
      { label: 'Front Fender', key: 'frontFender' },
      { label: 'Front Bumper', key: 'frontBumper' },
      { label: 'Front Bonnet', key: 'frontBonnet' },
      { label: 'A-Pillar', key: 'aPillar' },
      { label: 'Doors', key: 'doors' },
      { label: 'Roof', key: 'roof' },
      { label: 'Rear Fender', key: 'rearFender' },
      { label: 'Back Cover', key: 'backCover' },
      { label: 'Light Reflector', key: 'lightReflector' },
      { label: 'Head Light', key: 'headLight' },
    ];
    
    // Format date values for CSV
    const formatDateForCSV = (dateValue: any) => {
      if (!dateValue) return '';
      try {
        if (dateValue instanceof Date) {
          return format(dateValue, 'yyyy-MM-dd');
        }
        return format(new Date(dateValue), 'yyyy-MM-dd');
      } catch (error) {
        return String(dateValue || '');
      }
    };
    
    // Format boolean values for CSV 
    const formatBooleanForCSV = (value: any) => {
      return value === true ? 'Yes' : value === false ? 'No' : '';
    };
    
    // Format lot numbers for CSV
    const formatLotNumbersForCSV = (lotNumbers: any) => {
      if (!lotNumbers || !Array.isArray(lotNumbers)) return '';
      return lotNumbers.map(item => `${item.lotNumber}: ${item.quantity}`).join('; ');
    };
    
    // Create the CSV header row
    const header = csvFields.map(field => field.label).join(',');
    
    // Create rows for each registration
    const rows = registrations.map(registration => {
      return csvFields.map(field => {
        const value = registration[field.key];
        
        // Format different types of values appropriately
        if (field.key === 'createdAt' || field.key === 'installationDate' || field.key === 'statusDate') {
          return `"${formatDateForCSV(value)}"`;
        } else if (field.key === 'statusNotes') {
          // Escape quotes in text fields
          return value ? `"${String(value).replace(/"/g, '""')}"` : '""';
        } else if (field.key === 'fullCarPPF' || field.key === 'partialCarPPF' || 
                   field.key === 'frontFender' || field.key === 'frontBumper' || 
                   field.key === 'frontBonnet' || field.key === 'aPillar' || 
                   field.key === 'doors' || field.key === 'roof' || 
                   field.key === 'rearFender' || field.key === 'backCover' || 
                   field.key === 'lightReflector' || field.key === 'headLight') {
          return formatBooleanForCSV(value);
        } else if (field.key === 'lotNumbers') {
          return `"${formatLotNumbersForCSV(value)}"`;
        } else {
          // For all other fields, convert to string and escape quotes
          return value ? `"${String(value).replace(/"/g, '""')}"` : '""';
        }
      }).join(',');
    }).join('\n');
    
    // Combine header and rows to create CSV content
    const csvContent = `${header}\n${rows}`;
    
    // Create a blob and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `warranty_registrations_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">Warranty Registrations</h1>
        <InfoDot widgetId="admin.warrantyRegistrations.page" fallbackLabel="Warranty Registrations" />
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by name, email, phone or warranty code..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-64">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => exportToCSV(filteredRegistrations)}
          disabled={isLoading || filteredRegistrations.length === 0}
          className="flex items-center"
        >
          <FileDown className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList className="grid w-full md:w-auto grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <WarrantyTable
            registrations={filteredRegistrations}
            isLoading={isLoading}
            onViewDetails={handleViewDetails}
            onStatusAction={handleStatusAction}
            formatDate={formatDate}
            getStatusBadge={getStatusBadge}
            isUpdating={statusUpdateMutation.isPending}
          />
        </TabsContent>
        
        <TabsContent value="pending" className="mt-6">
          <WarrantyTable
            registrations={filteredRegistrations.filter((r: any) => !r.status || r.status === "pending")}
            isLoading={isLoading}
            onViewDetails={handleViewDetails}
            onStatusAction={handleStatusAction}
            formatDate={formatDate}
            getStatusBadge={getStatusBadge}
            isUpdating={statusUpdateMutation.isPending}
          />
        </TabsContent>
        
        <TabsContent value="approved" className="mt-6">
          <WarrantyTable
            registrations={filteredRegistrations.filter((r: any) => r.status === "approved")}
            isLoading={isLoading}
            onViewDetails={handleViewDetails}
            onStatusAction={handleStatusAction}
            formatDate={formatDate}
            getStatusBadge={getStatusBadge}
            isUpdating={statusUpdateMutation.isPending}
          />
        </TabsContent>
        
        <TabsContent value="rejected" className="mt-6">
          <WarrantyTable
            registrations={filteredRegistrations.filter((r: any) => r.status === "rejected")}
            isLoading={isLoading}
            onViewDetails={handleViewDetails}
            onStatusAction={handleStatusAction}
            formatDate={formatDate}
            getStatusBadge={getStatusBadge}
            isUpdating={statusUpdateMutation.isPending}
          />
        </TabsContent>
      </Tabs>

      {/* Status Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {pendingAction?.action === 'reject' ? 'Reject Warranty' : 'Hold Warranty'}
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for {pendingAction?.action === 'reject' ? 'rejecting' : 'putting on hold'} this warranty.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder={`Enter reason for ${pendingAction?.action}...`}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={confirmAction}
              disabled={!actionReason.trim() || statusUpdateMutation.isPending}
              variant={pendingAction?.action === 'reject' ? 'destructive' : 'default'}
            >
              {statusUpdateMutation.isPending ? 'Processing...' : 
                pendingAction?.action === 'reject' ? 'Reject' : 'Put on Hold'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface WarrantyTableProps {
  registrations: any[];
  isLoading: boolean;
  onViewDetails: (id: number) => void;
  onStatusAction: (warrantyId: number, action: 'approve' | 'reject' | 'hold') => void;
  formatDate: (date: string) => string;
  getStatusBadge: (status: string) => JSX.Element;
  isUpdating: boolean;
}

function WarrantyTable({ registrations, isLoading, onViewDetails, onStatusAction, formatDate, getStatusBadge, isUpdating }: WarrantyTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center">
          <p className="text-gray-500">Loading warranty registrations...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (registrations.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center">
          <p className="text-gray-500">No warranty registrations found.</p>
        </CardContent>
      </Card>
    );
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
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations.map((registration: any) => (
              <TableRow key={registration.id}>
                <TableCell className="font-medium">
                  {formatDate(registration.createdAt)}
                </TableCell>
                <TableCell>{registration.name || `${registration.customerFirstName || ''} ${registration.customerLastName || ''}`}</TableCell>
                <TableCell>
                  <div>{registration.email || registration.customerEmail}</div>
                  <div className="text-xs text-gray-500">{registration.phone || registration.customerMobile}</div>
                </TableCell>
                <TableCell>{registration.productType || registration.productInstalled}</TableCell>
                <TableCell>
                  <Badge variant="outline">{registration.warrantyCode}</Badge>
                </TableCell>
                <TableCell>
                  {getStatusBadge(registration.status || "pending")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        console.log(`Viewing warranty detail for ID: ${registration.id}`);
                        onViewDetails(registration.id);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    
                    {/* Status Action Buttons - Only show for pending warranties */}
                    {(!registration.status || registration.status === "pending") && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onStatusAction(registration.id, 'approve')}
                          disabled={isUpdating}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onStatusAction(registration.id, 'reject')}
                          disabled={isUpdating}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onStatusAction(registration.id, 'hold')}
                          disabled={isUpdating}
                          className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Hold
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}