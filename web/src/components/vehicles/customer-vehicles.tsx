import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, FileIcon, Car, Calendar, ShieldCheck, Eye } from 'lucide-react';
import { format } from 'date-fns';
import AddVehicleDialog from './add-vehicle-dialog';
import ViewVehicleDialog from './view-vehicle-dialog';

interface CustomerVehiclesProps {
  customerId: number;
  customerName?: string;
  showAddButton?: boolean;
}

export default function CustomerVehicles({
  customerId,
  customerName,
  showAddButton = true,
}: CustomerVehiclesProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    fetchVehicles();
  }, [customerId]);

  const fetchVehicles = async () => {
    if (!customerId) return;
    
    try {
      setLoading(true);
      const response = await apiRequest("GET", `/api/erp/customers/${customerId}/vehicles`);
      
      // Check if the response was ok
      if (!response.ok) {
        const errorData = await response.json();
        console.warn("Vehicle fetch warning:", errorData);
        
        // If the customer doesn't exist, just show empty state rather than an error
        if (response.status === 404) {
          setVehicles([]);
          return;
        }
        
        // For permission errors or server errors, show toast
        if (response.status === 403 || response.status === 500) {
          throw new Error(errorData.error || "Failed to load vehicles");
        }
      }
      
      const data = await response.json();
      setVehicles(data);
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load vehicles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Don't render the component at all if there are no vehicles and we can't add any
  if (!loading && vehicles.length === 0 && !showAddButton) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-lg">Vehicles</CardTitle>
        {showAddButton && (
          <AddVehicleDialog 
            customerId={customerId} 
            customerName={customerName}
            onSuccess={fetchVehicles}
          />
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="w-full py-10 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Car className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No vehicles found for this customer</p>
            {showAddButton && (
              <AddVehicleDialog 
                customerId={customerId} 
                customerName={customerName}
                onSuccess={fetchVehicles}
              >
                <Button variant="link" size="sm" className="mt-2">
                  Add Vehicle
                </Button>
              </AddVehicleDialog>
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registration #</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead>Insurance Status</TableHead>
                  <TableHead>Documents</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id} className="cursor-pointer hover:bg-muted/40" onClick={(e) => e.stopPropagation()}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <ViewVehicleDialog 
                          vehicleId={vehicle.id} 
                          customerId={customerId}
                          customerName={customerName}
                          onUpdate={fetchVehicles}
                        >
                          <div className="flex items-center hover:text-primary">
                            <span>{vehicle.registrationNumber || vehicle.licensePlate || 'N/A'}</span>
                          </div>
                        </ViewVehicleDialog>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{vehicle.make}</span>
                        <span className="text-xs text-muted-foreground">{vehicle.model}</span>
                        {vehicle.color && (
                          <Badge variant="outline" className="mt-1 w-fit">
                            {vehicle.color}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {/* Year from the vehicles table (database doesn't have purchaseDate field) */}
                      {vehicle.year || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {/* The vehicles table doesn't have insurance data */}
                      <span className="text-sm text-muted-foreground">Not available</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ViewVehicleDialog 
                          vehicleId={vehicle.id} 
                          customerId={customerId}
                          customerName={customerName}
                          onUpdate={fetchVehicles}
                        >
                          <Button variant="ghost" size="sm" className="flex items-center text-xs h-8 px-2">
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View Details
                          </Button>
                        </ViewVehicleDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}