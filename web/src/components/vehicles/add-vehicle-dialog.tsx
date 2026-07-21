import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import VehicleForm from './vehicle-form';

interface AddVehicleDialogProps {
  customerId: number;
  customerName?: string;
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export default function AddVehicleDialog({
  customerId,
  customerName,
  onSuccess,
  children,
}: AddVehicleDialogProps) {
  const [open, setOpen] = useState(false);
  const [customerExists, setCustomerExists] = useState(true);

  // Quick verification before opening the form
  const checkCustomerExists = async () => {
    try {
      const response = await fetch(`/api/erp/customers/${customerId}`);
      if (!response.ok && response.status === 404) {
        setCustomerExists(false);
        return false;
      }
      setCustomerExists(true);
      return true;
    } catch (error) {
      console.error("Error checking customer:", error);
      return true; // Default to allowing the form to open on errors
    }
  };

  const handleOpen = async (newOpen: boolean) => {
    if (newOpen) {
      const exists = await checkCustomerExists();
      if (!exists) {
        setOpen(false);
        return;
      }
    }
    setOpen(newOpen);
  };

  const handleSuccess = () => {
    setOpen(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" className="flex items-center gap-1" 
            onClick={async (e) => {
              e.preventDefault();
              const exists = await checkCustomerExists();
              if (!exists) {
                alert(`Customer ID ${customerId} doesn't exist. Please select a valid customer before adding a vehicle.`);
                return;
              }
              setOpen(true);
            }}>
            <Plus className="h-4 w-4" />
            <span>Add Vehicle</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Vehicle</DialogTitle>
          <DialogDescription>
            {customerName 
              ? `Add a new vehicle for ${customerName}`
              : 'Add a new vehicle for this customer'}
          </DialogDescription>
        </DialogHeader>
        <VehicleForm 
          customerId={customerId} 
          onSuccess={handleSuccess}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}