import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Search, Car, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import ViewVehicleDialog from '@/components/vehicles/view-vehicle-dialog';
import { Badge } from '@/components/ui/badge';
import { InfoDot } from '@/components/dev/InfoDot';

export default function VehicleSearch() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [customerNameFilter, setCustomerNameFilter] = useState<string>('');
  const [registrationFilter, setRegistrationFilter] = useState<string>('');
  const [searchParams, setSearchParams] = useState<{ customerName: string; registration: string }>({
    customerName: '',
    registration: '',
  });

  // Fetch all vehicles for the distributor's hierarchy
  const {
    data: vehicles,
    isLoading: isLoadingVehicles,
    isError: isErrorVehicles,
    refetch: refetchVehicles,
  } = useQuery({
    queryKey: ['/api/erp/vehicles/search'],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchParams.customerName) params.append('customerName', searchParams.customerName);
      if (searchParams.registration) params.append('registration', searchParams.registration);
      
      const response = await fetch(`/api/erp/vehicles/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles');
      }
      
      return response.json();
    },
    enabled: true,
  });

  // Fetch customer data for displaying customer names
  const {
    data: customers,
    isLoading: isLoadingCustomers,
  } = useQuery({
    queryKey: ['/api/erp/customers'],
    queryFn: async () => {
      const response = await fetch('/api/erp/customers');
      
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      
      return response.json();
    },
  });

  // Get customer name by ID
  const getCustomerName = (customerId: number) => {
    if (!customers) return 'Loading...';
    const customer = customers.find((c: any) => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  // Handle search
  const handleSearch = () => {
    setSearchParams({
      customerName: customerNameFilter,
      registration: registrationFilter,
    });
    refetchVehicles();
  };

  // Clear filters
  const handleClearFilters = () => {
    setCustomerNameFilter('');
    setRegistrationFilter('');
    setSearchParams({
      customerName: '',
      registration: '',
    });
    refetchVehicles();
  };

  // Navigate to customer details
  const handleCustomerClick = (customerId: number) => {
    navigate(`/erp/distributor/customers/${customerId}`);
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'draft':
        return 'bg-gray-400';
      case 'submitted':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Vehicle Search</h1>
      
      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center">Search Filters</span>
            <InfoDot widgetId="distributor.vehicleSearch.filters" fallbackLabel="Search Filters" />
          </CardTitle>
          <CardDescription>
            Search for vehicles by customer name or registration number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Customer Name</label>
              <Input
                placeholder="Enter customer name"
                value={customerNameFilter}
                onChange={(e) => setCustomerNameFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Registration Number</label>
              <Input
                placeholder="Enter vehicle registration number"
                value={registrationFilter}
                onChange={(e) => setRegistrationFilter(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button 
                className="flex-1" 
                onClick={handleSearch}
                disabled={isLoadingVehicles}
              >
                {isLoadingVehicles ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Search
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClearFilters}
                disabled={isLoadingVehicles}
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center">Search Results</span>
            <InfoDot widgetId="distributor.vehicleSearch.results" fallbackLabel="Search Results" />
          </CardTitle>
          <CardDescription>
            {vehicles?.length || 0} vehicles found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingVehicles ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isErrorVehicles ? (
            <div className="text-center py-8 text-red-500">
              Failed to load vehicles. Please try again.
            </div>
          ) : vehicles?.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Registration Number</TableHead>
                    <TableHead>Vehicle Brand & Model</TableHead>
                    <TableHead>Linked Lead Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle: any) => (
                    <TableRow key={vehicle.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell 
                        className="font-medium hover:underline"
                        onClick={() => handleCustomerClick(vehicle.customerId)}
                      >
                        {getCustomerName(vehicle.customerId)}
                      </TableCell>
                      <TableCell>{vehicle.licensePlate || 'N/A'}</TableCell>
                      <TableCell>
                        {vehicle.make} {vehicle.model}
                      </TableCell>
                      <TableCell>
                        {vehicle.leadStatus ? (
                          <Badge className={getStatusBadgeColor(vehicle.leadStatus)}>
                            {vehicle.leadStatus}
                          </Badge>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        <ViewVehicleDialog 
                          vehicleId={vehicle.id}
                          customerId={vehicle.customerId}
                          customerName={getCustomerName(vehicle.customerId)}
                          onUpdate={refetchVehicles}
                        >
                          <Button variant="outline" size="sm">
                            <Car className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </ViewVehicleDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No vehicles found. Try adjusting your search filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}