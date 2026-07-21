import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Search,
  Car,
  Filter,
  Plus
} from 'lucide-react';

import { RequestVehicleDialog } from "@/components/vehicles/request-vehicle-dialog";
import { InfoDot } from '@/components/dev/InfoDot';

export default function DetailerVehiclesPage() {
  const { toast } = useToast();
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('all');
  const [showRequestDialog, setShowRequestDialog] = useState(false);


  useEffect(() => {
    fetchBrands();
    fetchModels();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await apiRequest("GET", "/api/erp/vehicle-management/brands");
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch brands');
      }
      
      const data = await response.json();
      console.log('Fetched brands:', data);
      setBrands(data);
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vehicle brands. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await apiRequest("GET", "/api/erp/vehicle-management/models");
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch models');
      }
      
      const data = await response.json();
      console.log('Fetched models:', data);
      setModels(data);
    } catch (error) {
      console.error('Error fetching models:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vehicle models. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredModels = models.filter(model => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      model.name?.toLowerCase().includes(searchLower) ||
      model.brandName?.toLowerCase().includes(searchLower) ||
      model.category?.toLowerCase().includes(searchLower)
    );
    
    const matchesBrand = selectedBrandFilter === 'all' || model.brandId == selectedBrandFilter;
    
    return matchesSearch && matchesBrand;
  });



  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Database</h1>
          <p className="text-gray-500 mt-1">View predefined vehicle brands and models used across the system</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Button 
            onClick={() => setShowRequestDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Request New Vehicle
          </Button>
        </div>
      </div>

      {/* Vehicle Brands Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between gap-2">
              <span className="flex items-center">Total Brands</span>
              <InfoDot widgetId="detailer.vehicles.totalBrands" fallbackLabel="Total Brands" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brands.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between gap-2">
              <span className="flex items-center">Total Models</span>
              <InfoDot widgetId="detailer.vehicles.totalModels" fallbackLabel="Total Models" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{models.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between gap-2">
              <span className="flex items-center">Categories</span>
              <InfoDot widgetId="detailer.vehicles.categories" fallbackLabel="Categories" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.from(new Set(models.map(m => m.category))).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mt-6 mb-4">
        <div className="flex-1">
          <div className="flex items-center max-w-md border rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <Search className="h-4 w-4 mr-2 text-gray-400" />
            <Input
              placeholder="Search models and brands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedBrandFilter} onValueChange={setSelectedBrandFilter}>
            <SelectTrigger className="w-48">
              <div className="flex">
                <Filter className="h-4 w-4 mr-2" />
                <span>Filter Brand</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id.toString()}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Vehicle Models Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center">Vehicle Models Database</span>
            <InfoDot widgetId="detailer.vehicles.table" fallbackLabel="Vehicle Models Database" />
          </CardTitle>
          <CardDescription>
            Predefined vehicle models that can be selected when creating leads and customer records
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model Name</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Loading vehicle models...</p>
                  </TableCell>
                </TableRow>
              ) : filteredModels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <div className="flex flex-col items-center">
                      <Car className="h-10 w-10 text-gray-300 mb-2" />
                      <p className="text-gray-500">No vehicle models found</p>
                      <p className="text-sm text-gray-400">Try adjusting your search filters or add some models</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredModels.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell className="font-medium">{model.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {model.brandName}
                      </Badge>
                    </TableCell>
                    <TableCell>{model.category}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {model.createdAt ? new Date(model.createdAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-400">
                        View Only
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Vehicle Request Dialog */}
      <RequestVehicleDialog 
        open={showRequestDialog}
        onOpenChange={setShowRequestDialog}
      />
    </div>
  );
}