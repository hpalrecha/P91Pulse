import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Loader2, CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Define the form schema
const vehicleFormSchema = z.object({
  registrationNumber: z.string().optional(),
  brandId: z.string().min(1, "Brand is required"),
  modelId: z.string().min(1, "Model is required"),
  purchaseDate: z.date().optional(),
  engineNumber: z.string().optional(),
  vinNumber: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurerGstin: z.string().optional(),
  insurerAddress: z.string().optional(),
  policyNumber: z.string().optional(),
  insuranceExpiryDate: z.date().optional(),
  color: z.string().optional(),
  notes: z.string().optional(),
});

// Define a schema for adding a new vehicle model
const newModelSchema = z.object({
  name: z.string().min(1, "Model name is required"),
  brandId: z.string().min(1, "Brand is required"),
  category: z.string().min(1, "Category is required"),
});

export type VehicleFormData = z.infer<typeof vehicleFormSchema>;

interface VehicleFormProps {
  customerId: number;
  vehicleId?: number;
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function FixedVehicleForm({ 
  customerId, 
  vehicleId,
  initialData,
  onSuccess, 
  onCancel 
}: VehicleFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [addModelOpen, setAddModelOpen] = useState(false);
  const [newModelLoading, setNewModelLoading] = useState(false);
  const [registrationFile, setRegistrationFile] = useState<File | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  
  const isEditMode = !!vehicleId;
  
  // Debug logs
  console.log("FixedVehicleForm - Initial Data:", initialData);
  
  // Create the form with empty initial values
  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      registrationNumber: '',
      brandId: '',
      modelId: '',
      engineNumber: '',
      vinNumber: '',
      insuranceProvider: '',
      insurerGstin: '',
      insurerAddress: '',
      policyNumber: '',
      color: '',
      notes: '',
    },
  });
  
  // Create form for adding new models
  const newModelForm = useForm<z.infer<typeof newModelSchema>>({
    resolver: zodResolver(newModelSchema),
    defaultValues: {
      name: '',
      brandId: '',
      category: '',
    },
  });
  
  // Keep track if form has been initialized
  const [formInitialized, setFormInitialized] = useState(false);
  
  // Load brands on component mount
  useEffect(() => {
    const loadBrands = async () => {
      try {
        // First load all brands
        const brandsResponse = await apiRequest("GET", "/api/erp/vehicle-management/brands");
        const brandsData = await brandsResponse.json();
        console.log("Loaded brands:", brandsData);
        setBrands(brandsData);
        return brandsData;
      } catch (error) {
        console.error("Failed to load brands:", error);
        toast({
          title: "Error",
          description: "Failed to load vehicle brands. Please try again.",
          variant: "destructive",
        });
        return [];
      }
    };
    
    loadBrands();
  }, []);
  
  // Handle initialization of form data
  useEffect(() => {
    const initializeForm = async () => {
      // Skip if already initialized or no initial data
      if (formInitialized || !isEditMode || !initialData) {
        return;
      }
      
      try {
        setLoading(true);
        console.log("INITIALIZING FORM WITH DATA:", initialData);
        
        // Set text fields
        form.setValue('registrationNumber', initialData.licensePlate || '');
        form.setValue('vinNumber', initialData.vinNumber || '');
        form.setValue('engineNumber', initialData.engineNumber || '');
        form.setValue('color', initialData.color || '');
        form.setValue('insuranceProvider', initialData.insuranceProvider || '');
        form.setValue('insurerGstin', initialData.insurerGstin || '');
        form.setValue('insurerAddress', initialData.insurerAddress || '');
        form.setValue('policyNumber', initialData.policyNumber || '');
        form.setValue('notes', initialData.notes || '');
        
        // Set date fields if available
        if (initialData.purchaseDate) {
          form.setValue('purchaseDate', new Date(initialData.purchaseDate));
        }
        if (initialData.insuranceExpiryDate) {
          form.setValue('insuranceExpiryDate', new Date(initialData.insuranceExpiryDate));
        }
        
        // First, load all the brands from the API
        console.log("Loading brands for vehicle form");
        const brandsResponse = await apiRequest("GET", "/api/erp/vehicle-management/brands");
        const brandsData = await brandsResponse.json();
        console.log("SUCCESS: Loaded brands for vehicle form:", brandsData);
        setBrands(brandsData);
          
        // Find the matching brand
        const matchingBrand = brandsData.find(
          (brand: any) => brand.name.toLowerCase() === initialData.make?.toLowerCase()
        );
          
        if (matchingBrand) {
          console.log("***FOUND MATCHING BRAND***:", matchingBrand.name, matchingBrand.id);
          
          // Set the brand ID directly to the form
          const brandIdString = matchingBrand.id.toString();
          console.log("Setting brandId to:", brandIdString);
          form.setValue('brandId', brandIdString, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
          
          try {
            // Now load all models for this brand
            console.log("Loading models for brand ID:", matchingBrand.id);
            const modelsResponse = await apiRequest(
              "GET", 
              `/api/erp/vehicle-management/brands/${matchingBrand.id}/models`
            );
            const modelsData = await modelsResponse.json();
            console.log("SUCCESS: Loaded models for brand:", modelsData);
            setModels(modelsData);
            
            // Find the matching model
            const matchingModel = modelsData.find(
              (model: any) => model.name.toLowerCase() === initialData.model?.toLowerCase()
            );
            
            if (matchingModel) {
              console.log("***FOUND MATCHING MODEL***:", matchingModel.name, matchingModel.id);
              const modelIdString = matchingModel.id.toString();
              console.log("Setting modelId to:", modelIdString);
              form.setValue('modelId', modelIdString, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
            } else {
              console.log("No matching model found for:", initialData.model);
            }
          } catch (error) {
            console.error("Error loading models:", error);
          }
        } else {
          console.log("No matching brand found for:", initialData.make);
        }
        
        setFormInitialized(true);
      } catch (error) {
        console.error("Failed to initialize form:", error);
        toast({
          title: "Error",
          description: "Failed to load vehicle data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    initializeForm();
  }, [initialData, isEditMode]);
  
  // Load models whenever brand changes
  const handleBrandChange = async (brandId: string) => {
    if (!brandId) {
      setModels([]);
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiRequest("GET", `/api/erp/vehicle-management/brands/${brandId}/models`);
      const data = await response.json();
      console.log("Models loaded for brand change:", data);
      setModels(data);
    } catch (error) {
      console.error("Failed to load models:", error);
      toast({
        title: "Error",
        description: "Failed to load vehicle models. Please try again.",
        variant: "destructive",
      });
      setModels([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle adding a new model
  const handleAddModel = async (data: z.infer<typeof newModelSchema>) => {
    try {
      setNewModelLoading(true);
      const response = await apiRequest("POST", "/api/erp/vehicle-management/models", {
        name: data.name,
        brandId: parseInt(data.brandId),
        category: data.category,
        isActive: true,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create model');
      }
      
      const newModel = await response.json();
      
      // Update models list
      setModels(prev => [...prev, newModel]);
      
      // Select the new model in the form
      form.setValue('modelId', newModel.id.toString());
      
      // Close the dialog
      setAddModelOpen(false);
      
      // Reset new model form
      newModelForm.reset({
        name: '',
        brandId: form.watch('brandId'),
        category: '',
      });
      
      // Display success message
      toast({
        title: "Success",
        description: "New vehicle model added",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to create model:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create model. Please try again.",
        variant: "destructive",
      });
    } finally {
      setNewModelLoading(false);
    }
  };
  
  // Handle form submission
  const onSubmit = async (data: VehicleFormData) => {
    try {
      setLoading(true);
      
      // Create FormData object to handle file uploads
      const formData = new FormData();
      
      // Append form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof Date) {
          formData.append(key, value.toISOString());
        } else if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      
      // Append files if present
      if (registrationFile) {
        formData.append('registrationDoc', registrationFile);
      }
      
      if (insuranceFile) {
        formData.append('insuranceDoc', insuranceFile);
      }
      
      let response;
      
      if (isEditMode && vehicleId) {
        // Update existing vehicle
        response = await fetch(`/api/erp/vehicle-management/${vehicleId}`, {
          method: 'PATCH',
          body: formData,
        });
      } else {
        // Create new vehicle
        response = await fetch(`/api/erp/customers/${customerId}/vehicles`, {
          method: 'POST',
          body: formData,
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditMode ? 'update' : 'create'} vehicle`);
      }
      
      // Display success message
      toast({
        title: "Success",
        description: `Vehicle ${isEditMode ? 'updated' : 'added'} successfully`,
        variant: "default",
      });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} vehicle:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} vehicle. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle registration document upload
  const handleRegistrationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRegistrationFile(e.target.files[0]);
    }
  };
  
  // Handle insurance document upload
  const handleInsuranceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setInsuranceFile(e.target.files[0]);
    }
  };
  
  return (
    <div className="space-y-6">
      {loading && (
        <div className="flex justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Registration Number */}
            <FormField
              control={form.control}
              name="registrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter vehicle registration number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Brand Selection */}
            <FormField
              control={form.control}
              name="brandId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand *</FormLabel>
                  <Select
                    key={`brand-select-${field.value || 'empty'}`}
                    defaultValue={field.value}
                    onValueChange={(value) => {
                      console.log("Brand changed to:", value);
                      field.onChange(value);
                      handleBrandChange(value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a brand">
                          {field.value ? brands.find(b => b.id.toString() === field.value)?.name || "Select a brand" : "Select a brand"}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id.toString()}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Model Selection */}
            <FormField
              control={form.control}
              name="modelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model *</FormLabel>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Select
                        key={`model-select-${field.value || 'empty'}-${models.length}`}
                        defaultValue={field.value}
                        onValueChange={(value) => {
                          console.log("Model changed to:", value);
                          field.onChange(value);
                        }}
                        disabled={!form.watch('brandId')}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a model">
                              {field.value ? models.find(m => m.id.toString() === field.value)?.name || "Select a model" : "Select a model"}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {models.length > 0 ? (
                            models.map((model) => (
                              <SelectItem key={model.id} value={model.id.toString()}>
                                {model.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-center text-sm text-muted-foreground">
                              No models available
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={() => setAddModelOpen(true)}
                      disabled={!form.watch('brandId')}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Purchase Date */}
            <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Purchase Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Color */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter vehicle color" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Engine Number */}
            <FormField
              control={form.control}
              name="engineNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Engine Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter engine number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* VIN/Chassis Number */}
            <FormField
              control={form.control}
              name="vinNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>VIN/Chassis Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter VIN or chassis number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input placeholder="Additional notes about the vehicle" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Insurance Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Insurance Provider */}
              <FormField
                control={form.control}
                name="insuranceProvider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Provider</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter insurance provider name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Insurer GSTIN */}
              <FormField
                control={form.control}
                name="insurerGstin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurer GSTIN</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter insurer GSTIN" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Insurer Address */}
              <FormField
                control={form.control}
                name="insurerAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurer Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter insurer address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Policy Number */}
              <FormField
                control={form.control}
                name="policyNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter policy number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Insurance Expiry Date */}
              <FormField
                control={form.control}
                name="insuranceExpiryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Insurance Expiry Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
          </div>
        </form>
      </Form>
      
      {/* Add New Model Dialog */}
      <Dialog open={addModelOpen} onOpenChange={setAddModelOpen}>
        <DialogContent>
          <DialogTitle>Add New Model</DialogTitle>
          <Form {...newModelForm}>
            <form onSubmit={newModelForm.handleSubmit(handleAddModel)} className="space-y-4">
              <FormField
                control={newModelForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter model name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={newModelForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SUV">SUV</SelectItem>
                        <SelectItem value="Sedan">Sedan</SelectItem>
                        <SelectItem value="Hatchback">Hatchback</SelectItem>
                        <SelectItem value="Coupe">Coupe</SelectItem>
                        <SelectItem value="Convertible">Convertible</SelectItem>
                        <SelectItem value="Truck">Truck</SelectItem>
                        <SelectItem value="Van">Van</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-4 pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={newModelLoading}>
                  {newModelLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Model
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}