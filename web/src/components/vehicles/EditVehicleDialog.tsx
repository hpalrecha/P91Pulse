import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Brand {
  id: number;
  name: string;
}

interface EditVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
  onItemUpdated?: () => void;
}

export function EditVehicleDialog({ open, onOpenChange, item, onItemUpdated }: EditVehicleDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    brandId: '',
    category: '',
    logoUrl: '',
    isActive: true
  });
  const { toast } = useToast();

  // Update form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        brandId: item.brandId?.toString() || '',
        category: item.category || '',
        logoUrl: item.logoUrl || '',
        isActive: item.isActive ?? true
      });
    }
  }, [item]);

  // Fetch brands when dialog opens for model editing
  useEffect(() => {
    if (open && item?.type === 'model') {
      fetchBrands();
    }
  }, [open, item]);

  const fetchBrands = async () => {
    try {
      const response = await apiRequest('GET', '/api/erp/vehicle-management/brands');
      const brandsData = await response.json();
      setBrands(brandsData);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (item.type === 'brand') {
        // Update brand
        const response = await apiRequest('PUT', `/api/erp/vehicle-management/brands/${item.id}`, {
          name: formData.name,
          logoUrl: formData.logoUrl || null,
          isActive: formData.isActive
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "Vehicle brand updated successfully!"
          });
        }
      } else if (item.type === 'model') {
        // Update model
        const response = await apiRequest('PUT', `/api/erp/vehicle-management/models/${item.id}`, {
          name: formData.name,
          brandId: parseInt(formData.brandId),
          category: formData.category,
          isActive: formData.isActive
        });

        if (response.ok) {
          toast({
            title: "Success", 
            description: "Vehicle model updated successfully!"
          });
        }
      }

      onOpenChange(false);
      onItemUpdated?.();

    } catch (error) {
      console.error('Error updating vehicle:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update vehicle. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {item.type === 'brand' ? 'Brand' : 'Model'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={item.type === 'brand' ? 'e.g. Toyota' : 'e.g. Camry'}
              required
            />
          </div>

          {item.type === 'brand' && (
            <div>
              <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
              <Input
                id="logoUrl"
                value={formData.logoUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                placeholder="https://example.com/logo.png"
              />
            </div>
          )}

          {item.type === 'model' && (
            <>
              <div>
                <Label htmlFor="brandId">Brand</Label>
                <Select 
                  value={formData.brandId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, brandId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id.toString()}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUV">SUV</SelectItem>
                    <SelectItem value="Sedan">Sedan</SelectItem>
                    <SelectItem value="Hatchback">Hatchback</SelectItem>
                    <SelectItem value="Coupe">Coupe</SelectItem>
                    <SelectItem value="Convertible">Convertible</SelectItem>
                    <SelectItem value="Truck">Truck</SelectItem>
                    <SelectItem value="Van">Van</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="isActive">Status</Label>
            <Select 
              value={formData.isActive ? 'true' : 'false'} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value === 'true' }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.name}
              className="flex-1"
            >
              {isSubmitting ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}