import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Eye, 
  Pencil, 
  FileText, 
  Car, 
  Calendar, 
  ShieldCheck, 
  Info, 
  BarChart4,
  Box, 
  Loader2,
  UploadCloud
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import FixedVehicleForm from './fixed-vehicle-form';
import { Badge } from '@/components/ui/badge';

interface ViewVehicleDialogProps {
  vehicleId: number;
  customerId: number;
  customerName?: string;
  onUpdate?: () => void;
  children?: React.ReactNode;
}

export default function ViewVehicleDialog({
  vehicleId,
  customerId,
  customerName,
  onUpdate,
  children
}: ViewVehicleDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vehicle, setVehicle] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (open) {
      loadVehicleDetails();
    }
  }, [open, vehicleId]);

  const loadVehicleDetails = async () => {
    try {
      setLoading(true);
      const response = await apiRequest("GET", `/api/erp/vehicles/${vehicleId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load vehicle details");
      }
      
      const data = await response.json();
      console.log("Loaded vehicle data:", data);
      setVehicle(data);
    } catch (error) {
      console.error("Failed to fetch vehicle details:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load vehicle details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setEditMode(false);
    loadVehicleDetails();
    if (onUpdate) {
      onUpdate();
    }
    toast({
      title: "Success",
      description: "Vehicle details updated successfully",
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="w-full py-10 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Loading vehicle details...</p>
          </div>
        ) : editMode ? (
          <>
            <DialogHeader>
              <DialogTitle>Edit Vehicle</DialogTitle>
              <DialogDescription>
                {customerName 
                  ? `Update vehicle details for ${customerName}`
                  : 'Update vehicle details for this customer'}
              </DialogDescription>
            </DialogHeader>
            <FixedVehicleForm 
              customerId={customerId} 
              vehicleId={vehicleId}
              initialData={vehicle}
              onSuccess={handleSuccess}
              onCancel={() => setEditMode(false)}
            />
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center">
                  <Car className="h-5 w-5 mr-2" />
                  {vehicle?.make} {vehicle?.model}
                </DialogTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={() => setEditMode(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </Button>
              </div>
              <DialogDescription>
                {customerName 
                  ? `Vehicle details for ${customerName}`
                  : 'Vehicle details for this customer'}
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="details" className="flex items-center gap-1">
                  <Info className="h-4 w-4" />
                  <span>Basic Details</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>Documents</span>
                </TabsTrigger>
                <TabsTrigger value="service" className="flex items-center gap-1">
                  <BarChart4 className="h-4 w-4" />
                  <span>Service History</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Vehicle Information</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="grid grid-cols-2 p-4 gap-4">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Registration Number</p>
                            <p className="text-base">{vehicle?.licensePlate || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Vehicle Make & Model</p>
                            <p className="text-base">{vehicle?.make} {vehicle?.model}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Year</p>
                            <p className="text-base">{vehicle?.year || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Color</p>
                            <p className="text-base">
                              {vehicle?.color ? (
                                <Badge variant="outline">{vehicle.color}</Badge>
                              ) : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">VIN/Chassis Number</p>
                            <p className="text-base">{vehicle?.vinNumber || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Additional Notes</p>
                            <p className="text-base">{vehicle?.notes || 'No notes available'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium">Vehicle Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="border rounded-md p-4 flex flex-col items-center justify-center text-center">
                        <FileText className="h-12 w-12 text-muted-foreground/20 mb-2" />
                        <p className="font-medium">Registration Document</p>
                        <p className="text-sm text-muted-foreground mb-3">No document uploaded</p>
                        <Button variant="outline" size="sm" disabled>
                          <UploadCloud className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                      
                      <div className="border rounded-md p-4 flex flex-col items-center justify-center text-center">
                        <ShieldCheck className="h-12 w-12 text-muted-foreground/20 mb-2" />
                        <p className="font-medium">Insurance Document</p>
                        <p className="text-sm text-muted-foreground mb-3">No document uploaded</p>
                        <Button variant="outline" size="sm" disabled>
                          <UploadCloud className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="service">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium">Service History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="py-6 flex flex-col items-center justify-center text-center">
                      <Box className="h-12 w-12 text-muted-foreground/20 mb-2" />
                      <p className="text-muted-foreground">No service history available</p>
                      <p className="text-sm text-muted-foreground mt-1">Service records will appear here once created</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="mt-4 flex justify-end">
              <DialogClose asChild>
                <Button variant="secondary">Close</Button>
              </DialogClose>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}