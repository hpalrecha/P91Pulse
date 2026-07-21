import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import SidebarLayout from "@/components/layouts/sidebar-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check, X, Clock, FileDown, Printer, Maximize2, Image, ZoomIn } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function WarrantyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [holdReason, setHoldReason] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  console.log('WarrantyDetailPage - ID from params:', id);
  console.log('Current location:', window.location.pathname);

  // Fetch user data first to ensure authenticated
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/erp/me'],
  });

  // Fetch warranty registration details
  const { data: entry, isLoading: isLoadingEntry, refetch } = useQuery({
    queryKey: [`/api/warranty-registrations/${id}`],
    enabled: !!user && !!id, // Only run when user is authenticated and ID exists
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', `/api/warranty-registrations/${id}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        console.log('Warranty details loaded:', data);
        return data;
      } catch (error) {
        console.error('Failed to load warranty details:', error);
        throw error;
      }
    }
  });

  // Combined loading state
  const isLoading = isLoadingUser || isLoadingEntry;

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, reason }: { status: string, reason?: string }) => {
      const res = await apiRequest('POST', `/api/warranty-registrations/${id}/status`, { status, reason });
      return await res.json();
    },
    onSuccess: (data) => {
      console.log('Status updated successfully:', data);
      toast({
        title: 'Success',
        description: `Warranty registration has been ${data.status}`,
      });
      setNotes('');
      setRejectReason('');
      setHoldReason('');
      // Refetch the warranty details
      refetch();
    },
    onError: (error: Error) => {
      console.error('Failed to update status:', error);
      toast({
        title: 'Error',
        description: `Failed to update status: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleApprove = () => {
    updateStatusMutation.mutate({ status: 'approved', reason: notes });
  };

  const handleReject = () => {
    updateStatusMutation.mutate({ status: 'rejected', reason: rejectReason });
  };

  const handleHold = () => {
    updateStatusMutation.mutate({ status: 'on-hold', reason: holdReason });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return dateString || 'N/A';
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
      default:
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
    }
  };
  
  // Function to print the warranty details
  const handlePrint = () => {
    window.print();
  };
  
  // Function to export warranty details to CSV
  const exportToCSV = () => {
    if (!entry) return;
    
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
      return lotNumbers.map((item: any) => `${item.lotNumber}: ${item.quantity}`).join('; ');
    };
    
    // Define all fields to include in the CSV
    const fields = [
      { label: 'ID', value: entry.id },
      { label: 'Registration Date', value: formatDateForCSV(entry.createdAt) },
      { label: 'Status', value: entry.status || 'pending' },
      { label: 'Status Date', value: formatDateForCSV(entry.statusDate) },
      { label: 'Status Notes', value: entry.statusNotes || '' },
      
      // Warranty Information
      { label: 'Warranty Code', value: entry.warrantyCode || '' },
      { label: 'Product Type', value: entry.productType || '' },
      { label: 'Installation Date', value: formatDateForCSV(entry.installationDate) },
      
      // Installer & Store Details
      { label: 'Installer Name', value: entry.installer || '' },
      { label: 'Installer Mobile', value: entry.installerMobile || '' },
      { label: 'Store Name', value: entry.storeName || '' },
      { label: 'Store Email', value: entry.storeEmail || '' },
      { label: 'Store Location', value: entry.storeLocation || '' },
      
      // Customer Information
      { label: 'Customer Name', value: entry.name || '' },
      { label: 'Customer Email', value: entry.email || '' },
      { label: 'Customer Phone', value: entry.phone || '' },
      
      // Vehicle Information
      { label: 'Vehicle Make', value: entry.vehicleMake || '' },
      { label: 'Vehicle Model', value: entry.vehicleModel || '' },
      { label: 'Vehicle Year', value: entry.vehicleYear || '' },
      { label: 'Vehicle Color', value: entry.vehicleColor || '' },
      { label: 'Vehicle VIN', value: entry.vehicleVIN || '' },
      
      // PPF Installation Areas
      { label: 'Full Car PPF', value: formatBooleanForCSV(entry.fullCarPPF) },
      { label: 'Partial Car PPF', value: formatBooleanForCSV(entry.partialCarPPF) },
      { label: 'Front Fender', value: formatBooleanForCSV(entry.frontFender) },
      { label: 'Front Bumper', value: formatBooleanForCSV(entry.frontBumper) },
      { label: 'Front Bonnet', value: formatBooleanForCSV(entry.frontBonnet) },
      { label: 'A-Pillar', value: formatBooleanForCSV(entry.aPillar) },
      { label: 'Doors', value: formatBooleanForCSV(entry.doors) },
      { label: 'Roof', value: formatBooleanForCSV(entry.roof) },
      { label: 'Rear Fender', value: formatBooleanForCSV(entry.rearFender) },
      { label: 'Back Cover', value: formatBooleanForCSV(entry.backCover) },
      { label: 'Light Reflector', value: formatBooleanForCSV(entry.lightReflector) },
      { label: 'Head Light', value: formatBooleanForCSV(entry.headLight) },
      
      // Lot Numbers
      { label: 'Lot Numbers', value: formatLotNumbersForCSV(entry.lotNumbers) },
    ];
    
    // Create CSV header and row
    const csvHeader = fields.map(field => field.label).join(',');
    const csvRow = fields.map(field => {
      // Escape and quote values if they contain commas or quotes
      const value = String(field.value || '');
      return `"${value.replace(/"/g, '""')}"`;
    }).join(',');
    
    // Combine header and row
    const csvContent = `${csvHeader}\n${csvRow}`;
    
    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `warranty_${entry.id}_${formatDateForCSV(new Date())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SidebarLayout activeModule="warranty-registrations">
      <div className="p-8">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center">
            <Button 
              variant="outline"
              onClick={() => setLocation(`/erp/admin/warranty-registrations`)}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Warranty Registrations
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Warranty Registration Details</h1>
              <p className="text-gray-500">ID: {id}</p>
            </div>
          </div>
          
          {entry && (
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  {getStatusBadge(entry.status)}
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  {/* Export and Print buttons */}
                  <Button 
                    variant="outline" 
                    onClick={exportToCSV}
                    className="flex items-center"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handlePrint}
                    className="flex items-center print:hidden"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  
                  {/* Action Buttons - Approve/Reject/Hold */}
                  {(!entry.status || entry.status === "pending" || entry.status === "on-hold") && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Approve Warranty Registration</DialogTitle>
                      <DialogDescription>
                        This will approve the warranty registration and generate a warranty certificate.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea 
                          id="notes"
                          placeholder="Add any notes about this approval..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={handleApprove} disabled={updateStatusMutation.isPending}>
                        {updateStatusMutation.isPending ? "Processing..." : "Approve Warranty"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              
              {(!entry.status || entry.status === "pending") && (
                <>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Clock className="h-4 w-4 mr-2" />
                        Put on Hold
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Put Warranty Registration on Hold</DialogTitle>
                        <DialogDescription>
                          This will mark the warranty registration as on hold for further review.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="holdReason">Reason for Hold</Label>
                          <Textarea 
                            id="holdReason"
                            placeholder="Explain why this warranty registration is being put on hold..."
                            value={holdReason}
                            onChange={(e) => setHoldReason(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" onClick={handleHold} disabled={updateStatusMutation.isPending || !holdReason}>
                          {updateStatusMutation.isPending ? "Processing..." : "Put on Hold"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reject Warranty Registration</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. The warranty registration will be rejected.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="rejectReason">Reason for Rejection</Label>
                          <Textarea 
                            id="rejectReason"
                            placeholder="Explain why this warranty registration is being rejected..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                          />
                        </div>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleReject}
                          disabled={updateStatusMutation.isPending || !rejectReason}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {updateStatusMutation.isPending ? "Processing..." : "Reject"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {!id ? (
          <div className="text-center p-8">
            <h2 className="text-xl font-semibold text-red-600">Error: No warranty ID provided</h2>
            <p className="text-gray-500 mt-2">The warranty ID is missing from the URL.</p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Loading warranty details...</p>
          </div>
        ) : !entry ? (
          <div className="text-center p-8">
            <h2 className="text-xl font-semibold text-red-600">Warranty Not Found</h2>
            <p className="text-gray-500 mt-2">The warranty registration with ID {id} could not be found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid grid-cols-2 w-full max-w-md">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="status-history">Status History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-6 pt-4">
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">Warranty Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Warranty Code</h3>
                      <p className="text-base font-medium">{entry.warrantyCode}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Product Type</h3>
                      <p className="text-base">{entry.productType}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Installation Date</h3>
                      <p className="text-base">{formatDate(entry.installationDate)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Status</h3>
                      <p className="text-base">
                        <Badge variant={
                          entry.status === "approved" ? "success" : 
                          entry.status === "rejected" ? "destructive" : 
                          entry.status === "hold" ? "warning" : 
                          "outline"
                        }>
                          {entry.status ? entry.status.charAt(0).toUpperCase() + entry.status.slice(1) : "Pending"}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Name</h3>
                      <p className="text-base font-medium">{entry.name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Email</h3>
                      <p className="text-base">{entry.email}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                      <p className="text-base">{entry.phone}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Registration Date</h3>
                      <p className="text-base">{formatDate(entry.createdAt)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">Vehicle Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Make</h3>
                      <p className="text-base font-medium">{entry.vehicleMake || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Model</h3>
                      <p className="text-base">{entry.vehicleModel || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Year</h3>
                      <p className="text-base">{entry.vehicleYear || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Color</h3>
                      <p className="text-base">{entry.vehicleColor || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">VIN/Registration</h3>
                      <p className="text-base">{entry.vehicleVIN || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Installer & Store Information */}
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">Installer & Store Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Installer Name</h3>
                      <p className="text-base font-medium">{entry.installer || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Installer Mobile</h3>
                      <p className="text-base">{entry.installerMobile || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Store Name</h3>
                      <p className="text-base">{entry.storeName || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Store Email</h3>
                      <p className="text-base">{entry.storeEmail || 'N/A'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-medium text-gray-500">Store Location</h3>
                      <p className="text-base">{entry.storeLocation || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                {/* PPF Installation Areas */}
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">PPF Installation Areas</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-3 rounded-md border ${entry.fullCarPPF ? 'bg-primary/10 border-primary' : 'bg-gray-50'}`}>
                      <h3 className="text-sm font-medium">{entry.fullCarPPF ? '✓' : '○'} Full Car PPF</h3>
                    </div>
                    <div className={`p-3 rounded-md border ${entry.partialCarPPF ? 'bg-primary/10 border-primary' : 'bg-gray-50'}`}>
                      <h3 className="text-sm font-medium">{entry.partialCarPPF ? '✓' : '○'} Partial Car PPF</h3>
                    </div>
                    <div className={`p-3 rounded-md border ${entry.frontFender ? 'bg-primary/10 border-primary' : 'bg-gray-50'}`}>
                      <h3 className="text-sm font-medium">{entry.frontFender ? '✓' : '○'} Front Fender</h3>
                    </div>
                    <div className={`p-3 rounded-md border ${entry.frontBumper ? 'bg-primary/10 border-primary' : 'bg-gray-50'}`}>
                      <h3 className="text-sm font-medium">{entry.frontBumper ? '✓' : '○'} Front Bumper</h3>
                    </div>
                    <div className={`p-3 rounded-md border ${entry.frontBonnet ? 'bg-primary/10 border-primary' : 'bg-gray-50'}`}>
                      <h3 className="text-sm font-medium">{entry.frontBonnet ? '✓' : '○'} Front Bonnet</h3>
                    </div>
                    <div className={`p-3 rounded-md border ${entry.aPillar ? 'bg-primary/10 border-primary' : 'bg-gray-50'}`}>
                      <h3 className="text-sm font-medium">{entry.aPillar ? '✓' : '○'} A-Pillar</h3>
                    </div>
                    <div className={`p-3 rounded-md border ${entry.doors ? 'bg-primary/10 border-primary' : 'bg-gray-50'}`}>
                      <h3 className="text-sm font-medium">{entry.doors ? '✓' : '○'} Doors</h3>
                    </div>
                    <div className={`p-3 rounded-md border ${entry.roof ? 'bg-primary/10 border-primary' : 'bg-gray-50'}`}>
                      <h3 className="text-sm font-medium">{entry.roof ? '✓' : '○'} Roof</h3>
                    </div>
                    <div className={`p-3 rounded-md border ${entry.rearFender ? 'bg-primary/10 border-primary' : 'bg-gray-50'}`}>
                      <h3 className="text-sm font-medium">{entry.rearFender ? '✓' : '○'} Rear Fender</h3>
                    </div>
                    <div className={`p-3 rounded-md border ${entry.backCover ? 'bg-primary/10 border-primary' : 'bg-gray-50'}`}>
                      <h3 className="text-sm font-medium">{entry.backCover ? '✓' : '○'} Back Cover</h3>
                    </div>
                    <div className={`p-3 rounded-md border ${entry.lightReflector ? 'bg-primary/10 border-primary' : 'bg-gray-50'}`}>
                      <h3 className="text-sm font-medium">{entry.lightReflector ? '✓' : '○'} Light Reflector</h3>
                    </div>
                    <div className={`p-3 rounded-md border ${entry.headLight ? 'bg-primary/10 border-primary' : 'bg-gray-50'}`}>
                      <h3 className="text-sm font-medium">{entry.headLight ? '✓' : '○'} Head Light</h3>
                    </div>
                  </div>
                </div>
                
                {/* Lot Numbers */}
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">Lot Numbers</h2>
                  {entry.lotNumbers && Array.isArray(entry.lotNumbers) && entry.lotNumbers.length > 0 ? (
                    <div className="overflow-hidden rounded-md border">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lot Number</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {entry.lotNumbers.map((lot: any, index: number) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lot.lotNumber}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lot.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-gray-50 rounded-md">
                      <p className="text-gray-500">No lot numbers available</p>
                    </div>
                  )}
                </div>
                
                {/* Photo Attachments */}
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Image className="h-5 w-5 mr-2" />
                    Attached Images
                  </h2>
                  
                  {(() => {
                    // Process photos data
                    let photos: string[] = [];
                    
                    if (entry.photos) {
                      if (Array.isArray(entry.photos)) {
                        photos = entry.photos;
                      } else if (typeof entry.photos === 'string') {
                        try {
                          const parsed = JSON.parse(entry.photos);
                          if (Array.isArray(parsed)) {
                            photos = parsed;
                          } else {
                            photos = [entry.photos];
                          }
                        } catch (e) {
                          photos = [entry.photos];
                        }
                      }
                    }
                    
                    // If no photos, show placeholder
                    if (photos.length === 0) {
                      return (
                        <div className="text-center p-6 bg-gray-50 rounded-md">
                          <p className="text-gray-500">No images attached with this submission</p>
                        </div>
                      );
                    }
                    
                    // Photos grid with image modal viewer
                    return (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {photos.map((photo, index) => (
                            <div 
                              key={index} 
                              className="border rounded-md overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                              onClick={() => setSelectedImage(photo)}
                            >
                              <div className="relative aspect-video bg-gray-100">
                                <img 
                                  src={photo} 
                                  alt={`Attached image ${index + 1}`} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjM1MCIgdmlld0JveD0iMCAwIDUwMCAzNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSIzNTAiIGZpbGw9IiNlZWUiLz48dGV4dCB4PSIyNTAiIHk9IjE3NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjYWFhIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW1hZ2UgTG9hZCBFcnJvcjwvdGV4dD48L3N2Zz4=';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity flex items-center justify-center opacity-0 hover:opacity-100">
                                  <ZoomIn className="h-8 w-8 text-white" />
                                </div>
                              </div>
                              <div className="p-2 bg-gray-50 flex justify-between items-center">
                                <span className="text-sm text-gray-500">Image {index + 1}</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="p-1 h-auto text-blue-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImage(photo);
                                  }}
                                >
                                  <Maximize2 className="h-4 w-4 mr-1" />
                                  <span className="text-xs">View</span>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Image modal */}
                        <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
                          <DialogContent className="max-w-4xl w-[90vw]">
                            <DialogHeader>
                              <DialogTitle>Image Viewer</DialogTitle>
                            </DialogHeader>
                            
                            <div className="relative aspect-auto max-h-[70vh] overflow-auto bg-gray-900 rounded-md flex items-center justify-center">
                              {selectedImage && (
                                <img 
                                  src={selectedImage} 
                                  alt="Full size image" 
                                  className="max-w-full max-h-[70vh] object-contain"
                                />
                              )}
                            </div>
                            
                            <DialogFooter className="sm:justify-between">
                              <div className="text-sm text-gray-500">
                                Click outside or press ESC to close
                              </div>
                              <div className="flex gap-2">
                                <DialogClose asChild>
                                  <Button variant="outline">Close</Button>
                                </DialogClose>
                                <Button 
                                  variant="outline"
                                  onClick={() => {
                                    if (selectedImage) {
                                      window.open(selectedImage, '_blank');
                                    }
                                  }}
                                >
                                  Open in New Tab
                                </Button>
                              </div>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </>
                    );
                  })()}
                </div>
              </TabsContent>
              
              <TabsContent value="status-history" className="space-y-6 pt-4">
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">Status History</h2>
                  {Array.isArray(entry.statusHistory) && entry.statusHistory.length > 0 ? (
                    <div className="space-y-4">
                      {entry.statusHistory.map((status: any, index: number) => (
                        <div key={index} className="flex items-start border-b pb-4 last:border-0">
                          <div className="flex-1">
                            <div className="flex items-center">
                              {getStatusBadge(status.status)}
                              <span className="ml-2 text-sm text-gray-500">
                                {formatDate(status.date)}
                              </span>
                            </div>
                            {status.reason && (
                              <p className="mt-2 text-sm text-gray-700">{status.reason}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-gray-50 rounded-md">
                      <p className="text-gray-500">No status history available</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}