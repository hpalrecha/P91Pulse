import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

interface AddVehicleBrandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface VehicleBrand {
  id: number;
  name: string;
  isActive: boolean;
}

export function AddVehicleBrandDialog({ open, onOpenChange }: AddVehicleBrandDialogProps) {
  const [activeTab, setActiveTab] = useState<'brand' | 'model'>('brand');
  const [brandName, setBrandName] = useState('');
  const [modelName, setModelName] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vehicle brands for model creation
  const { data: brands } = useQuery<VehicleBrand[]>({
    queryKey: ['/api/erp/vehicle-management/brands'],
    enabled: activeTab === 'model',
  });

  // Create brand mutation
  const createBrandMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await apiRequest('POST', '/api/erp/vehicle-management/brands', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Vehicle brand created successfully" });
      setBrandName('');
      queryClient.invalidateQueries({ queryKey: ['/api/erp/vehicle-management/brands'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create vehicle brand",
        variant: "destructive",
      });
    },
  });

  // Create model mutation
  const createModelMutation = useMutation({
    mutationFn: async (data: { name: string; brandId: number; category: string }) => {
      const response = await apiRequest('POST', '/api/erp/vehicle-management/models', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Vehicle model created successfully" });
      setModelName('');
      setSelectedBrandId('');
      setCategory('');
      queryClient.invalidateQueries({ queryKey: ['/api/erp/vehicle-management/models'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create vehicle model",
        variant: "destructive",
      });
    },
  });

  const handleCreateBrand = () => {
    if (!brandName.trim()) {
      toast({
        title: "Validation Error",
        description: "Brand name is required",
        variant: "destructive",
      });
      return;
    }

    createBrandMutation.mutate({ name: brandName.trim() });
  };

  const handleCreateModel = () => {
    if (!modelName.trim() || !selectedBrandId || !category) {
      toast({
        title: "Validation Error", 
        description: "All fields are required for creating a model",
        variant: "destructive",
      });
      return;
    }

    createModelMutation.mutate({
      name: modelName.trim(),
      brandId: parseInt(selectedBrandId),
      category: category,
    });
  };

  const resetForm = () => {
    setBrandName('');
    setModelName('');
    setSelectedBrandId('');
    setCategory('');
    setActiveTab('brand');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Vehicle Brand/Model
          </DialogTitle>
          <DialogDescription>
            Create a new vehicle brand or model directly in the system
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="brand">New Brand</TabsTrigger>
            <TabsTrigger value="model">New Model</TabsTrigger>
          </TabsList>

          <TabsContent value="brand" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand Name</Label>
              <Input
                id="brandName"
                placeholder="Enter vehicle brand name (e.g., Tesla, BMW)"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="model" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="brandSelect">Select Brand</Label>
              <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a vehicle brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands?.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id.toString()}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelName">Model Name</Label>
              <Input
                id="modelName"
                placeholder="Enter vehicle model name (e.g., Model 3, X5)"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sedan">Sedan</SelectItem>
                  <SelectItem value="SUV">SUV</SelectItem>
                  <SelectItem value="Hatchback">Hatchback</SelectItem>
                  <SelectItem value="Coupe">Coupe</SelectItem>
                  <SelectItem value="Convertible">Convertible</SelectItem>
                  <SelectItem value="Wagon">Wagon</SelectItem>
                  <SelectItem value="Pickup">Pickup</SelectItem>
                  <SelectItem value="Van">Van</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          {activeTab === 'brand' ? (
            <Button 
              onClick={handleCreateBrand}
              disabled={createBrandMutation.isPending}
              className="bg-[#4db848] hover:bg-[#3da037]"
            >
              {createBrandMutation.isPending ? 'Creating...' : 'Create Brand'}
            </Button>
          ) : (
            <Button 
              onClick={handleCreateModel}
              disabled={createModelMutation.isPending}
              className="bg-[#4db848] hover:bg-[#3da037]"
            >
              {createModelMutation.isPending ? 'Creating...' : 'Create Model'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}