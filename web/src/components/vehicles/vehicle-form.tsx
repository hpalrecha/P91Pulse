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
  FormDescription,
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Loader2, CalendarIcon, UploadCloud, X, Check, Plus } from 'lucide-react';
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

export default function VehicleForm({ 
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
  const [brandSearch, setBrandSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  
  const isEditMode = !!vehicleId;

  // For editing, we need to find the corresponding brand/model IDs based on names
  const [initialBrandId, setInitialBrandId] = useState<string>('');
  const [initialModelId, setInitialModelId] = useState<string>('');
  const [formInitialized, setFormInitialized] = useState(false);
  
  // Initialize the form with empty values first - will be updated later
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

  // Initialize the new model form
  const newModelForm = useForm<z.infer<typeof newModelSchema>>({
    resolver: zodResolver(newModelSchema),
    defaultValues: {
      name: '',
      brandId: form.watch('brandId') || '',
      category: '',
    },
  });
  
  // Main initialization logic
  useEffect(() => {
    // Step 1: Load all brands
    const initializeForm = async () => {
      try {
        setLoading(true);
        
        console.log("Initializing vehicle form, edit mode:", isEditMode);
        
        // Load all brands first
        const brandsResponse = await apiRequest("GET", "/api/erp/vehicle-management/brands");
        const allBrands = await brandsResponse.json();
        setBrands(allBrands);
        
        // If in edit mode, populate form with initial data
        if (isEditMode && initialData) {
          console.log("Populating edit form with data:", initialData);
          
          // Set all text fields first
          form.setValue('registrationNumber', initialData.licensePlate || '');
          form.setValue('color', initialData.color || '');
          form.setValue('vinNumber', initialData.vinNumber || '');
          form.setValue('notes', initialData.notes || '');
          form.setValue('engineNumber', initialData.engineNumber || '');
          form.setValue('insuranceProvider', initialData.insuranceProvider || '');
          form.setValue('insurerGstin', initialData.insurerGstin || '');
          form.setValue('insurerAddress', initialData.insurerAddress || '');
          form.setValue('policyNumber', initialData.policyNumber || '');
          
          // Set date fields if available
          if (initialData.purchaseDate) {
            form.setValue('purchaseDate', new Date(initialData.purchaseDate));
          }
          if (initialData.insuranceExpiryDate) {
            form.setValue('insuranceExpiryDate', new Date(initialData.insuranceExpiryDate));
          }
          
          // Find matching brand
          const matchingBrand = allBrands.find(
            (brand: any) => brand.name.toLowerCase() === initialData.make?.toLowerCase()
          );
          
          if (matchingBrand) {
            console.log("Found matching brand:", matchingBrand.name, matchingBrand.id);
            const brandIdString = matchingBrand.id.toString();
            
            // Set brand ID
            form.setValue('brandId', brandIdString);
            setInitialBrandId(brandIdString);
            
            // Load models for this brand
            const modelsResponse = await apiRequest(
              "GET", 
              `/api/erp/vehicle-management/brands/${matchingBrand.id}/models`
            );
            const brandModels = await modelsResponse.json();
            setModels(brandModels);
            
            // Find matching model
            const matchingModel = brandModels.find(
              (model: any) => model.name.toLowerCase() === initialData.model?.toLowerCase()
            );
            
            if (matchingModel) {
              console.log("Found matching model:", matchingModel.name, matchingModel.id);
              const modelIdString = matchingModel.id.toString();
              
              // Set model ID
              form.setValue('modelId', modelIdString);
              setInitialModelId(modelIdString);
            } else {
              console.log("No matching model found for:", initialData.model);
            }
          } else {
            console.log("No matching brand found for:", initialData.make);
          }
        }
        
        // Mark form as initialized
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
  }, [isEditMode, initialData]);
  
  // Load models when brand changes (but only after initialization)
  useEffect(() => {
    // Skip this effect during initial form setup
    if (!formInitialized) return;
    
    const brandId = form.watch('brandId');
    if (brandId && brandId !== 'undefined' && brandId !== 'NaN') {
      const parsedBrandId = parseInt(brandId);
      if (!isNaN(parsedBrandId)) {
        loadModels(parsedBrandId);
      } else {
        setModels([]);
      }
    } else {
      setModels([]);
    }
  }, [form.watch('brandId'), formInitialized]);
  
  // When the brand changes in the main form, update the new model form
  useEffect(() => {
    // Skip this effect during initial form setup
    if (!formInitialized) return;
    
    const brandId = form.watch('brandId');
    if (brandId) {
      newModelForm.setValue('brandId', brandId);
    }
  }, [form.watch('brandId'), formInitialized]);
  
  // Load all vehicle brands
  const loadBrands = async () => {
    try {
      setLoading(true);
      const response = await apiRequest("GET", "/api/erp/vehicle-management/brands");
      const data = await response.json();
      setBrands(data);
    } catch (error) {
      console.error("Failed to load brands:", error);
      toast({
        title: "Error",
        description: "Failed to load vehicle brands. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load models for a specific brand
  const loadModels = async (brandId: number) => {
    // Validate brandId is a valid number
    if (isNaN(brandId) || brandId <= 0) {
      console.error('Invalid brand ID:', brandId);
      setModels([]);
      return Promise.resolve([]);
    }
    
    try {
      setLoading(true);
      const response = await apiRequest("GET", `/api/erp/vehicle-management/brands/${brandId}/models`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load models');
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setModels(data);
        return data;
      } else {
        console.error("Unexpected models data format:", data);
        setModels([]);
        return [];
      }
    } catch (error) {
      console.error("Failed to load models:", error);
      toast({
        title: "Error",
        description: "Failed to load vehicle models. Please try again.",
        variant: "destructive",
      });
      setModels([]);
      return [];
    } finally {
      setLoading(false);
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
        response = await fetch(`/api/erp/customers/${customerId}/vehicles/${vehicleId}`, {
          method: 'PATCH',
          body: formData,
          credentials: 'include',
        });
      } else {
        // Create new vehicle
        response = await fetch(`/api/erp/customers/${customerId}/vehicles`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
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
  
  // Filter brands by search query
  const filteredBrands = brandSearch 
    ? brands.filter(brand => brand.name.toLowerCase().includes(brandSearch.toLowerCase()))
    : brands;
  
  // Filter models by search query
  const filteredModels = modelSearch
    ? models.filter(model => model.name.toLowerCase().includes(modelSearch.toLowerCase()))
    : models;
  
  return (
    <div className="space-y-6">
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
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a brand" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <div className="px-3 py-2">
                        <Input 
                          placeholder="Search brands..."
                          value={brandSearch}
                          onChange={(e) => setBrandSearch(e.target.value)}
                          className="mb-2"
                        />
                      </div>
                      {loading ? (
                        <div className="flex justify-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : filteredBrands.length > 0 ? (
                        filteredBrands.map(brand => (
                          <SelectItem key={brand.id} value={brand.id.toString()}>
                            {brand.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No brands found
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Model Selection with Add New Option */}
            <FormField
              control={form.control}
              name="modelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model *</FormLabel>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!form.watch('brandId')}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a model" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <div className="px-3 py-2">
                            <Input 
                              placeholder="Search models..."
                              value={modelSearch}
                              onChange={(e) => setModelSearch(e.target.value)}
                              className="mb-2"
                            />
                          </div>
                          {loading ? (
                            <div className="flex justify-center p-4">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                          ) : filteredModels.length > 0 ? (
                            filteredModels.map(model => (
                              <SelectItem key={model.id} value={model.id.toString()}>
                                {model.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              No models found
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <Dialog open={addModelOpen} onOpenChange={setAddModelOpen}>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={!form.watch('brandId')}
                          className="flex-shrink-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Vehicle Model</DialogTitle>
                          <DialogDescription>
                            Create a new model for the selected brand
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...newModelForm}>
                          <form onSubmit={newModelForm.handleSubmit(handleAddModel)} className="space-y-4">
                            <FormField
                              control={newModelForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Model Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Civic, Innova" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={newModelForm.control}
                              name="brandId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Brand</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a brand" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {brands.map(brand => (
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
                            
                            <FormField
                              control={newModelForm.control}
                              name="category"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="SUV">SUV</SelectItem>
                                      <SelectItem value="Sedan">Sedan</SelectItem>
                                      <SelectItem value="Hatchback">Hatchback</SelectItem>
                                      <SelectItem value="MUV">MUV</SelectItem>
                                      <SelectItem value="Coupe">Coupe</SelectItem>
                                      <SelectItem value="Convertible">Convertible</SelectItem>
                                      <SelectItem value="Wagon">Wagon</SelectItem>
                                      <SelectItem value="Van">Van</SelectItem>
                                      <SelectItem value="XL">Extra Large</SelectItem>
                                      <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setAddModelOpen(false)}>
                                Cancel
                              </Button>
                              <Button type="submit" disabled={newModelLoading}>
                                {newModelLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Model
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
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
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
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
                  <FormLabel>VIN / Chassis Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter VIN or chassis number" {...field} />
                  </FormControl>
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
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Insurance Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Insurance Provider */}
              <FormField
                control={form.control}
                name="insuranceProvider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Provider</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter insurance provider" {...field} />
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
                  <FormItem className="md:col-span-2">
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
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
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
                            date < new Date()
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
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Document Uploads</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Registration Document Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Registration Certificate
                </label>
                <div className="border border-dashed border-gray-300 rounded-md p-4">
                  <div className="flex flex-col items-center space-y-2">
                    {registrationFile ? (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                          <div className="flex-shrink-0">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                              <Check className="h-4 w-4 text-green-600" />
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{registrationFile.name}</p>
                            <p className="text-xs text-gray-500">
                              {(registrationFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm"
                          onClick={() => setRegistrationFile(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="h-10 w-10 text-gray-400" />
                        <div className="text-center">
                          <Button
                            type="button" 
                            variant="secondary" 
                            size="sm"
                            onClick={() => document.getElementById('registration-upload')?.click()}
                          >
                            Choose file
                          </Button>
                          <p className="mt-2 text-xs text-gray-500">
                            PDF, JPG, PNG, HEIC up to 10MB
                          </p>
                        </div>
                        <input
                          id="registration-upload"
                          type="file"
                          className="hidden"
                          accept=".jpg,.jpeg,.png,.pdf,.heic"
                          onChange={handleRegistrationUpload}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Insurance Document Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Insurance Document
                </label>
                <div className="border border-dashed border-gray-300 rounded-md p-4">
                  <div className="flex flex-col items-center space-y-2">
                    {insuranceFile ? (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                          <div className="flex-shrink-0">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                              <Check className="h-4 w-4 text-green-600" />
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{insuranceFile.name}</p>
                            <p className="text-xs text-gray-500">
                              {(insuranceFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm"
                          onClick={() => setInsuranceFile(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="h-10 w-10 text-gray-400" />
                        <div className="text-center">
                          <Button
                            type="button" 
                            variant="secondary" 
                            size="sm"
                            onClick={() => document.getElementById('insurance-upload')?.click()}
                          >
                            Choose file
                          </Button>
                          <p className="mt-2 text-xs text-gray-500">
                            PDF, JPG, PNG, HEIC up to 10MB
                          </p>
                        </div>
                        <input
                          id="insurance-upload"
                          type="file"
                          className="hidden"
                          accept=".jpg,.jpeg,.png,.pdf,.heic"
                          onChange={handleInsuranceUpload}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes</FormLabel>
                <FormControl>
                  <Input placeholder="Any additional notes about the vehicle" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end space-x-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Vehicle
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}