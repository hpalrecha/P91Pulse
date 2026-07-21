import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface VehicleData {
  id: number;
  name: string;
  brandName?: string;
  category?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
}

interface ViewVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: VehicleData;
}

export function ViewVehicleDialog({ open, onOpenChange, vehicle }: ViewVehicleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Vehicle Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-muted-foreground">ID</span>
              <p className="text-sm">{vehicle.id}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Status</span>
              <div>
                <Badge variant={vehicle.isActive ? 'default' : 'secondary'}>
                  {vehicle.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-muted-foreground">Name</span>
            <p className="text-sm font-semibold">{vehicle.name}</p>
          </div>

          {vehicle.brandName && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">Brand</span>
              <p className="text-sm">{vehicle.brandName}</p>
            </div>
          )}

          {vehicle.category && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">Category</span>
              <p className="text-sm">{vehicle.category}</p>
            </div>
          )}

          {vehicle.logoUrl && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">Logo</span>
              <div className="mt-2">
                <img 
                  src={vehicle.logoUrl} 
                  alt={`${vehicle.name} logo`}
                  className="h-12 w-12 object-contain rounded border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <span className="text-sm font-medium text-muted-foreground">Created Date</span>
            <p className="text-sm">{new Date(vehicle.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}