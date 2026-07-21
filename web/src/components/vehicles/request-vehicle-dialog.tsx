import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface RequestVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface VehicleRequestData {
  requestType: 'brand' | 'model';
  requestedName: string;
  brandId?: number;
  description?: string;
}

interface VehicleBrand {
  id: number;
  name: string;
}

export function RequestVehicleDialog({ open, onOpenChange }: RequestVehicleDialogProps) {
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [newBrandName, setNewBrandName] = useState<string>('');
  const [modelName, setModelName] = useState<string>('');
  const [brands, setBrands] = useState<VehicleBrand[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch brands when dialog opens
  useEffect(() => {
    if (open) {
      fetchBrands();
    }
  }, [open]);

  const fetchBrands = async () => {
    try {
      const response = await apiRequest("GET", "/api/erp/vehicle-management/brands");
      if (response.ok) {
        const data = await response.json();
        setBrands(data);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const createRequestMutation = useMutation({
    mutationFn: async (data: VehicleRequestData) => {
      const response = await apiRequest('POST', '/api/erp/vehicle-requests', data);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create vehicle request');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Request Submitted",
        description: "Your vehicle request has been submitted for admin review.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/erp/vehicle-requests/my-requests'] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedBrand('');
    setNewBrandName('');
    setModelName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!modelName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please specify the model name.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedBrand) {
      toast({
        title: "Missing Information",
        description: "Please select a brand or choose to add a new brand.",
        variant: "destructive",
      });
      return;
    }

    if (selectedBrand === 'new' && !newBrandName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please specify the new brand name.",
        variant: "destructive",
      });
      return;
    }

    // Prepare request data
    let requestData: VehicleRequestData;
    
    if (selectedBrand === 'new') {
      // New brand request - requestedName should be the brand name
      requestData = {
        requestType: 'brand',
        requestedName: newBrandName.trim(),
        description: `New brand request: ${newBrandName.trim()} with initial model ${modelName.trim()}`
      };
    } else {
      // Existing brand, new model request - requestedName should be the model name
      const selectedBrandName = brands.find(b => b.id.toString() === selectedBrand)?.name || 'Unknown Brand';
      requestData = {
        requestType: 'model',
        requestedName: modelName.trim(),
        brandId: parseInt(selectedBrand),
        description: `New model request: ${modelName.trim()} for brand ${selectedBrandName}`
      };
    }

    createRequestMutation.mutate(requestData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Request New Vehicle
          </DialogTitle>
          <DialogDescription>
            Add a new vehicle to the database. Choose an existing brand or add a completely new brand with model.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brand">Select Brand</Label>
            <Select 
              value={selectedBrand} 
              onValueChange={(value) => {
                setSelectedBrand(value);
                if (value !== 'new') {
                  setNewBrandName('');
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a brand or add new..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Brand
                  </div>
                </SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id.toString()}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedBrand === 'new' && (
            <div className="space-y-2">
              <Label htmlFor="newBrandName">New Brand Name</Label>
              <Input
                id="newBrandName"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="e.g., Tesla, BMW, Mercedes"
                required
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="modelName">Model Name</Label>
            <Input
              id="modelName"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="e.g., Camry, Corolla, RAV4"
              required
            />
          </div>



          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              resetForm();
              onOpenChange(false);
            }}>
              Cancel
            </Button>
            <Button type="submit" disabled={createRequestMutation.isPending}>
              {createRequestMutation.isPending ? (
                <>Submitting...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}