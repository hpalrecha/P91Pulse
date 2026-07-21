import { useState } from "react";
import { useParams } from "wouter";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Check, Clock, X } from "lucide-react";
import SidebarLayout from "@/components/layouts/sidebar-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WarrantyRegistration } from "@shared/schema";

const formatDate = (dateValue: string | Date | undefined | null) => {
  if (!dateValue) return 'N/A';
  try {
    if (dateValue instanceof Date) {
      return format(dateValue, 'MMM dd, yyyy');
    }
    return format(new Date(dateValue), 'MMM dd, yyyy');
  } catch (error) {
    return String(dateValue);
  }
};

export default function WarrantyRegistrationDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const entryId = parseInt(params.id || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [holdReason, setHoldReason] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  
  // Fetch user data first to ensure authentication
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/erp/me'],
  });

  // Fetch specific warranty registration by ID only if user is authenticated
  const { data: entry, isLoading: isLoadingEntry } = useQuery<WarrantyRegistration>({
    queryKey: [`/api/warranty-registrations/${entryId}`],
    enabled: !!userData, // Only run this query if we have user data
  });
  
  // Combined loading state
  const isLoading = isLoadingUser || isLoadingEntry;

  // Status update mutations
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: number, status: string, reason?: string }) => {
      return await apiRequest("POST", `/api/warranty-registrations/${id}/status`, { status, reason });
    },
    onSuccess: () => {
      // Invalidate both the list and the specific detail
      queryClient.invalidateQueries({ queryKey: ['/api/warranty-registrations'] });
      queryClient.invalidateQueries({ queryKey: [`/api/warranty-registrations/${entryId}`] });
      toast({
        title: "Status updated",
        description: "The warranty registration status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update warranty status. Please try again.",
        variant: "destructive",
      });
      console.error("Update status error:", error);
    },
  });

  const handleApprove = () => {
    if (!entry) return;
    updateStatusMutation.mutate({ id: entry.id, status: "approved", reason: notes });
  };

  const handleReject = () => {
    if (!entry) return;
    updateStatusMutation.mutate({ id: entry.id, status: "rejected", reason: rejectReason });
  };

  const handleHold = () => {
    if (!entry) return;
    updateStatusMutation.mutate({ id: entry.id, status: "on-hold", reason: holdReason });
  };

  const getStatusBadge = (status: string | undefined) => {
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

  return (
    <SidebarLayout>
      <div className="p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
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
              <p className="text-gray-500">Viewing detailed information for this warranty registration</p>
            </div>
          </div>
          
          {entry && (
            <div className="flex items-center gap-2">
              <div className="mr-2">
                Status: {getStatusBadge(entry.status)}
              </div>
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
          )}
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Loading warranty details...</p>
          </div>
        ) : !entry ? (
          <div className="text-center p-12 bg-gray-50 rounded-md">
            <p className="text-gray-500">Warranty registration not found.</p>
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
                      <h3 className="text-sm font-medium text-gray-500">Installer</h3>
                      <p className="text-base">{entry.installer}</p>
                    </div>
                    {/* Optional fields are omitted as they don't exist in the schema */}
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
                
                {/* Installation Details and Product Details sections are conditionally rendered
                    based on metadata fields that might not be present in all warranty entries */}
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">Installation Details</h2>
                  <div className="text-center p-4 bg-gray-50 rounded-md">
                    <p className="text-gray-500">Installation details can be viewed in the raw data</p>
                  </div>
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