import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, Eye, User, Calendar, MapPin } from 'lucide-react';
import { ViewVehicleDialog } from './ViewVehicleDialog';

interface VehicleWithDetailer {
  id: number;
  customerId: number;
  customerName: string;
  make: string;
  model: string;
  year: string;
  vinNumber?: string;
  color?: string;
  licensePlate?: string;
  notes?: string;
  createdAt: string;
  brandName: string;
  modelName: string;
  registrationNumber?: string;
  registrationDoc?: string;
  insuranceDoc?: string;
  // Detailer information
  detailerId: number;
  detailerName: string;
  detailerLocation?: string;
  detailerState?: string;
  detailerPhone?: string;
  detailerEmail?: string;
  leadStatus?: string;
}

interface SearchFilters {
  search?: string;
  brand?: string;
  year?: string;
  detailerId?: string;
  state?: string;
}

export function AdminVehicleSearch() {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithDetailer | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  // Fetch all vehicles with detailer information for admin
  const { data: vehicles, isLoading, refetch } = useQuery<VehicleWithDetailer[]>({
    queryKey: ['/api/erp/vehicles/admin/search', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(`/api/erp/vehicles/admin/search?${params}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles');
      }
      
      return await response.json();
    }
  });

  // Fetch brands for filter dropdown
  const { data: brands } = useQuery({
    queryKey: ['/api/erp/vehicles/brands'],
  });

  // Fetch detailers for filter dropdown
  const { data: detailers } = useQuery({
    queryKey: ['/api/erp/users', { role: 'detailer', status: 'approved' }],
  });

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value === 'all' ? undefined : value });
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 2000; year--) {
      years.push(year.toString());
    }
    return years;
  };

  const uniqueStates = Array.from(new Set((vehicles || []).map(v => v.detailerState).filter(Boolean)));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Car className="w-5 h-5 mr-2" />
            Vehicle Search - All Detailers
          </CardTitle>
          <CardDescription>
            Search and view all vehicles across the entire system with detailer information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Search by customer, vehicle, VIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch} className="bg-[#4db848] hover:bg-[#3da037]">
                Search
              </Button>
            </div>
            
            <Select onValueChange={(value) => handleFilterChange('brand', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {(brands as any[])?.map((brand: any) => (
                  <SelectItem key={brand.id} value={brand.name}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select onValueChange={(value) => handleFilterChange('year', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {getYearOptions().map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={(value) => handleFilterChange('state', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {uniqueStates.map((state) => (
                  <SelectItem key={state} value={state!}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          {Object.keys(filters).length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {Object.entries(filters).map(([key, value]) => 
                value && (
                  <Badge key={key} variant="secondary" className="capitalize">
                    {key}: {value}
                  </Badge>
                )
              )}
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Search Results ({vehicles?.length || 0})
          </CardTitle>
          <CardDescription>
            All vehicles registered in the system with detailer ownership information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4db848]"></div>
              <span className="ml-2">Searching vehicles...</span>
            </div>
          ) : !vehicles?.length ? (
            <div className="text-center py-8">
              <Car className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No vehicles found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-semibold text-lg">
                          {vehicle.brandName} {vehicle.modelName} ({vehicle.year})
                        </h4>
                        <Badge variant="outline">
                          {vehicle.leadStatus || 'Active'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span><strong>Customer:</strong> {vehicle.customerName}</span>
                          </div>
                          {vehicle.licensePlate && (
                            <div className="flex items-center space-x-2">
                              <Car className="w-4 h-4 text-muted-foreground" />
                              <span><strong>License:</strong> {vehicle.licensePlate}</span>
                            </div>
                          )}
                          {vehicle.vinNumber && (
                            <p><strong>VIN:</strong> {vehicle.vinNumber}</p>
                          )}
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span><strong>Added:</strong> {new Date(vehicle.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-blue-500" />
                            <span><strong>Detailer:</strong> {vehicle.detailerName}</span>
                          </div>
                          {vehicle.detailerLocation && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span><strong>Location:</strong> {vehicle.detailerLocation}</span>
                            </div>
                          )}
                          {vehicle.detailerState && (
                            <p><strong>State:</strong> {vehicle.detailerState}</p>
                          )}
                          {vehicle.detailerPhone && (
                            <p><strong>Phone:</strong> {vehicle.detailerPhone}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        setShowViewDialog(true);
                      }}
                      className="ml-4"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Vehicle Dialog */}
      {selectedVehicle && (
        <ViewVehicleDialog
          open={showViewDialog}
          onOpenChange={(open) => {
            setShowViewDialog(open);
            if (!open) setSelectedVehicle(null);
          }}
          vehicle={{
            id: selectedVehicle.id,
            name: `${selectedVehicle.brandName} ${selectedVehicle.modelName}`,
            brandName: selectedVehicle.brandName,
            category: selectedVehicle.year,
            isActive: true,
            createdAt: selectedVehicle.createdAt
          }}
        />
      )}
    </div>
  );
}