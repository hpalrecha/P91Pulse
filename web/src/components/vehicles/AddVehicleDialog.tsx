import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus } from 'lucide-react';
import { apiRequest } from "@/lib/queryClient";

interface Brand {
  id: number;
  name: string;
}

interface AddVehicleDialogProps {
  onVehicleAdded?: () => void;
}

export function AddVehicleDialog({ onVehicleAdded }: AddVehicleDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    brandId: '',
    category: '',
    logoUrl: '',
    description: ''
  });
  const { toast } = useToast();

  // Fetch brands when dialog opens
  useEffect(() => {
    if (open) {
      fetchBrands();
    }
  }, [open]);

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
      if (formData.type === 'brand') {
        // Add new brand
        const response = await apiRequest('POST', '/api/erp/vehicle-management/brands', {
          name: formData.name,
          logoUrl: formData.logoUrl || null,
          isActive: true
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "Vehicle brand added successfully!"
          });
        }
      } else if (formData.type === 'model') {
        // Add new model
        const response = await apiRequest('POST', '/api/erp/vehicle-management/models', {
          name: formData.name,
          brandId: parseInt(formData.brandId),
          category: formData.category,
          isActive: true
        });

        if (response.ok) {
          toast({
            title: "Success", 
            description: "Vehicle model added successfully!"
          });
        }
      }

      // Reset form and close dialog
      setFormData({
        type: '',
        name: '',
        brandId: '',
        category: '',
        logoUrl: '',
        description: ''
      });
      setOpen(false);
      onVehicleAdded?.();

    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add vehicle. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Vehicle
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Vehicle</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brand">Brand</SelectItem>
                <SelectItem value="model">Model</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={formData.type === 'brand' ? 'e.g. Toyota' : 'e.g. Camry'}
              required
            />
          </div>

          {formData.type === 'brand' && (
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

          {formData.type === 'model' && (
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

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.type || !formData.name}
              className="flex-1"
            >
              {isSubmitting ? 'Adding...' : 'Add Vehicle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}