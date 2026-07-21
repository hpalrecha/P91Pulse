import { useState, useRef, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ImagePlus, Plus, X, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Define the form schema for validation
const warrantyFormSchema = z.object({
  // Installer & Store Details
  installerName: z.string().min(1, 'Installer name is required'),
  installerMobile: z.string().min(10, 'Valid mobile number is required'),
  storeEmail: z.string().email('Valid email is required'),
  storeName: z.string().min(1, 'Store name is required'),
  storeLocation: z.string().min(1, 'Store location is required'),
  
  // Customer Details
  customerFirstName: z.string().min(1, 'First name is required'),
  customerLastName: z.string().min(1, 'Last name is required'),
  customerMobile: z.string().min(10, 'Valid mobile number is required'),
  customerEmail: z.string().email('Valid email is required'),
  customerAddress: z.string().min(1, 'Address is required'),
  
  // Car Details
  carMake: z.string().min(1, 'Car make is required'),
  carModel: z.string().min(1, 'Car model is required'),
  carColor: z.string().min(1, 'Car color is required'),
  carRegOrVIN: z.string().min(1, 'Registration or VIN number is required'),
  
  // Installation Details
  productInstalled: z.string().min(1, 'Product is required'),
  installationDate: z.date({
    required_error: "Installation date is required",
  }),
  
  // PPF Installation Area
  fullCarPPF: z.boolean().default(false),
  frontFender: z.boolean().default(false),
  frontBumper: z.boolean().default(false),
  frontBonnet: z.boolean().default(false),
  aPillar: z.boolean().default(false),
  doors: z.boolean().default(false),
  roof: z.boolean().default(false),
  rearFender: z.boolean().default(false),
  backCover: z.boolean().default(false),
  lightReflector: z.boolean().default(false),
  headLight: z.boolean().default(false),
  
  // Product Details - Batch Numbers (lot numbers)
  lotNumbers: z.array(z.object({
    lotNumber: z.string().min(1, 'Batch number is required'),
    quantity: z.string().min(1, 'Quantity is required'),
  })).min(1, 'At least one batch number is required'),
});

type WarrantyFormValues = z.infer<typeof warrantyFormSchema>;

export default function WarrantyRegistrationPage() {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState('installer');
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Batch validation state - one entry per batch number field
  const [batchValidations, setBatchValidations] = useState<Record<number, {
    isValidating: boolean;
    isValid: boolean | null;
    message: string;
  }>>({});
  
  // Debug effect to track photos state changes
  useEffect(() => {
    console.log('Photos state changed, current count:', photos.length);
    console.log('Photos details:', photos.map(p => ({name: p.name, size: p.size})));
  }, [photos]);
  const [submittedWarranty, setSubmittedWarranty] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch current user profile data
  const { data: userProfile } = useQuery({
    queryKey: ['/api/erp/me'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/erp/me');
      return await response.json();
    }
  });

  // Fetch product names from sold units
  const { data: productNames = [], isLoading: productNamesLoading } = useQuery<string[]>({
    queryKey: ['/api/erp/sold-units/product-names'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/erp/sold-units/product-names');
      return await response.json();
    }
  });

  // Fetch vehicle brands
  const { data: vehicleBrands = [], isLoading: brandsLoading } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['/api/erp/vehicle-management/brands'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/erp/vehicle-management/brands');
      return await response.json();
    }
  });

  // Fetch all vehicle models
  const { data: allVehicleModels = [], isLoading: modelsLoading } = useQuery<{ id: number; name: string; brandId: number }[]>({
    queryKey: ['/api/erp/vehicle-management/models'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/erp/vehicle-management/models');
      return await response.json();
    }
  });

  // Track selected brand ID to filter models
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  
  const form = useForm<WarrantyFormValues>({
    resolver: zodResolver(warrantyFormSchema),
    defaultValues: {
      installerName: '',
      installerMobile: '',
      storeEmail: '',
      storeName: '',
      storeLocation: '',
      
      customerFirstName: '',
      customerLastName: '',
      customerMobile: '',
      customerEmail: '',
      customerAddress: '',
      
      carMake: '',
      carModel: '',
      carColor: '',
      carRegOrVIN: '',
      
      productInstalled: '',
      installationDate: new Date(),
      
      fullCarPPF: false,
      frontFender: false,
      frontBumper: false,
      frontBonnet: false,
      aPillar: false,
      doors: false,
      roof: false,
      rearFender: false,
      backCover: false,
      lightReflector: false,
      headLight: false,
      
      lotNumbers: [{ lotNumber: '', quantity: '' }],
    },
  });

  // Auto-populate store details from user profile
  useEffect(() => {
    if (userProfile) {
      form.setValue('installerName', userProfile.name || '');
      form.setValue('installerMobile', userProfile.phone || '');
      form.setValue('storeEmail', userProfile.email || '');
      form.setValue('storeName', userProfile.businessName || userProfile.name || '');
      form.setValue('storeLocation', userProfile.address || userProfile.city || '');
    }
  }, [userProfile, form]);
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lotNumbers'
  });
  const watchFullCarPPF = form.watch('fullCarPPF');
  
  // Watch all batch numbers for validation
  const watchAllBatchNumbers = form.watch('lotNumbers');

  // Batch number validation with debouncing - validates ALL batch numbers independently
  useEffect(() => {
    const validateBatch = async (batchNumber: string, quantity: string, index: number) => {
      if (!batchNumber || batchNumber.trim() === '') {
        setBatchValidations(prev => ({
          ...prev,
          [index]: { isValidating: false, isValid: null, message: '' }
        }));
        return;
      }

      setBatchValidations(prev => ({
        ...prev,
        [index]: { isValidating: true, isValid: null, message: 'Checking...' }
      }));

      try {
        // Include quantity in validation request
        const qtyParam = quantity ? `?quantity=${encodeURIComponent(quantity)}` : '';
        const response = await apiRequest('GET', `/api/erp/validate-batch/${encodeURIComponent(batchNumber)}${qtyParam}`);
        const result = await response.json();

        setBatchValidations(prev => ({
          ...prev,
          [index]: {
            isValidating: false,
            isValid: result.valid,
            message: result.message
          }
        }));
      } catch (error) {
        console.error('Batch validation error:', error);
        setBatchValidations(prev => ({
          ...prev,
          [index]: {
            isValidating: false,
            isValid: false,
            message: 'Error validating batch'
          }
        }));
      }
    };

    // Clear validation timeouts
    const timeouts: NodeJS.Timeout[] = [];

    // Validate each batch number independently with debouncing
    watchAllBatchNumbers?.forEach((lotNumber, index) => {
      const timeoutId = setTimeout(() => {
        if (lotNumber.lotNumber) {
          validateBatch(lotNumber.lotNumber, lotNumber.quantity || '', index);
        }
      }, 500);
      timeouts.push(timeoutId);
    });

    return () => timeouts.forEach(timeout => clearTimeout(timeout));
  }, [JSON.stringify(watchAllBatchNumbers)]);

  const tabsOrder = ['installer', 'customer', 'car', 'installation', 'product'];
  
  const nextTab = () => {
    const currentIndex = tabsOrder.indexOf(activeTab);
    if (currentIndex < tabsOrder.length - 1) {
      setActiveTab(tabsOrder[currentIndex + 1]);
    }
  };

  const previousTab = () => {
    const currentIndex = tabsOrder.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabsOrder[currentIndex - 1]);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/erp/detailer/warranties', data);
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('Warranty submission successful:', data);
      setSubmittedWarranty(data.warranty);
      setIsSubmitted(true);
      
      toast({
        title: "Success",
        description: "Warranty has been registered successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to register warranty. Please try again.",
        variant: "destructive",
      });
      console.error("Warranty registration error:", error);
    },
  });

  const onSubmit = async (data: WarrantyFormValues) => {
    console.log('Form submission data:', data);
    console.log('Photos state before submission:', photos);
    console.log('Number of photos:', photos.length);
    
    // Create JSON payload instead of FormData for now
    const payload = {
      // Installer & Store Details
      installerName: data.installerName,
      installerMobile: data.installerMobile,
      storeEmail: data.storeEmail,
      storeName: data.storeName,
      storeLocation: data.storeLocation,
      
      // Customer Details
      customerFirstName: data.customerFirstName,
      customerLastName: data.customerLastName,
      customerMobile: data.customerMobile,
      customerEmail: data.customerEmail,
      customerAddress: data.customerAddress,
      
      // Car Details
      carMake: data.carMake,
      carModel: data.carModel,
      carColor: data.carColor,
      carRegOrVIN: data.carRegOrVIN,
      
      // Installation Details
      productInstalled: data.productInstalled,
      productType: data.productInstalled, // Send the actual product type
      installationDate: format(data.installationDate, 'yyyy-MM-dd'),
      
      // PPF Installation areas
      fullCarPPF: data.fullCarPPF,
      frontFender: data.frontFender,
      frontBumper: data.frontBumper,
      frontBonnet: data.frontBonnet,
      aPillar: data.aPillar,
      doors: data.doors,
      roof: data.roof,
      rearFender: data.rearFender,
      backCover: data.backCover,
      lightReflector: data.lightReflector,
      headLight: data.headLight,
      
      // Lot numbers
      lotNumbers: data.lotNumbers,
      
      // Photos - convert to base64 strings for submission
      photos: photos.length > 0 ? await Promise.all(
        photos.map(async (photo) => {
          console.log('Converting photo:', photo.name, photo.size);
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const result = e.target?.result as string;
              console.log('Photo converted, size:', result.length);
              resolve(result);
            };
            reader.onerror = (error) => {
              console.error('Error reading photo:', error);
              reject(error);
            };
            reader.readAsDataURL(photo);
          });
        })
      ) : []
    };

    console.log('Final payload photos:', payload.photos);
    console.log('Payload photos length:', payload.photos.length);
    
    mutation.mutate(payload);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileChange called, files:', e.target.files);
    console.log('Event target:', e.target);
    console.log('Files length:', e.target.files?.length);
    
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      console.log('New files to add:', newFiles.map(f => ({name: f.name, size: f.size, type: f.type})));
      
      // Limit to 4 photos total
      const totalPhotos = [...photos, ...newFiles];
      if (totalPhotos.length > 4) {
        console.log('Too many photos, limiting to 4');
        toast({
          title: "Too many photos",
          description: "Maximum 4 photos allowed (one from each angle)",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Setting photos state from:', photos.length, 'to:', totalPhotos.length);
      setPhotos(totalPhotos);
      
      // Clear input to allow re-selection of same files
      e.target.value = '';
    } else {
      console.log('No files selected or files is null');
    }
  };
  
  const removePhoto = (index: number) => {
    console.log('Removing photo at index:', index);
    setPhotos(prev => {
      const updated = prev.filter((_, i) => i !== index);
      console.log('Photos after removal, count:', updated.length);
      return updated;
    });
  };
  
  const triggerFileInput = () => {
    console.log('triggerFileInput called');
    if (fileInputRef.current) {
      console.log('File input ref exists, triggering click');
      fileInputRef.current.click();
    } else {
      console.log('File input ref is null');
    }
  };

  // Function to reset form for new warranty
  const handleNewWarranty = () => {
    console.log('Resetting form for new warranty');
    setIsSubmitted(false);
    setSubmittedWarranty(null);
    form.reset();
    setPhotos([]);
    setActiveTab('installer');
  };

  // Show success screen if warranty is submitted
  if (isSubmitted && submittedWarranty) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <CardTitle className="text-2xl text-green-700">Warranty Registered Successfully!</CardTitle>
              <CardDescription className="text-green-600 mt-2">
                Your warranty registration has been processed and submitted successfully.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="text-center space-y-4">
              <div className="bg-white rounded-lg p-4 border">
                <h3 className="font-semibold text-gray-700 mb-2">Warranty Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Warranty Code:</span>
                    <p className="font-medium">{submittedWarranty.warrantyCode}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Customer:</span>
                    <p className="font-medium">{submittedWarranty.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Product:</span>
                    <p className="font-medium">{submittedWarranty.productType}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <p className="font-medium capitalize">{submittedWarranty.status}</p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600">
                A confirmation email has been sent to the customer. The warranty is now active and can be viewed in your warranty dashboard.
              </p>
            </CardContent>
            
            <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleNewWarranty} className="bg-green-600 hover:bg-green-700">
                Register New Warranty
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/erp/detailer/warranties'}>
                View All Warranties
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">eWarranty Registration</h1>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-5 mb-6">
              <TabsTrigger value="installer">Installer Details</TabsTrigger>
              <TabsTrigger value="customer">Customer Details</TabsTrigger>
              <TabsTrigger value="car">Car Details</TabsTrigger>
              <TabsTrigger value="installation">Installation Details</TabsTrigger>
              <TabsTrigger value="product">Product & Photos</TabsTrigger>
            </TabsList>
            
            {/* Installer & Store Details */}
            <TabsContent value="installer">
              <Card>
                <CardHeader>
                  <CardTitle>Installer & Store Details</CardTitle>
                  <CardDescription>Enter information about the installer and store</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="installerName">Installer Name</Label>
                      <Input
                        id="installerName"
                        {...form.register('installerName')}
                        placeholder="Enter installer name"
                      />
                      {form.formState.errors.installerName && (
                        <p className="text-sm text-red-500">{form.formState.errors.installerName.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="installerMobile">Installer Mobile</Label>
                      <Input
                        id="installerMobile"
                        {...form.register('installerMobile')}
                        placeholder="Enter installer mobile"
                      />
                      {form.formState.errors.installerMobile && (
                        <p className="text-sm text-red-500">{form.formState.errors.installerMobile.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="storeEmail">Store Email</Label>
                      <Input
                        id="storeEmail"
                        type="email"
                        {...form.register('storeEmail')}
                        placeholder="Enter store email"
                      />
                      {form.formState.errors.storeEmail && (
                        <p className="text-sm text-red-500">{form.formState.errors.storeEmail.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="storeName">Store Name</Label>
                      <Input
                        id="storeName"
                        {...form.register('storeName')}
                        placeholder="Enter store name"
                      />
                      {form.formState.errors.storeName && (
                        <p className="text-sm text-red-500">{form.formState.errors.storeName.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="storeLocation">Store Location</Label>
                      <Input
                        id="storeLocation"
                        {...form.register('storeLocation')}
                        placeholder="Enter store location"
                      />
                      {form.formState.errors.storeLocation && (
                        <p className="text-sm text-red-500">{form.formState.errors.storeLocation.message}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" disabled>
                    Previous
                  </Button>
                  <Button 
                    type="button" 
                    onClick={async () => {
                      const isValid = await form.trigger(['installerName', 'installerMobile', 'storeEmail', 'storeName', 'storeLocation']);
                      if (isValid) {
                        nextTab();
                      }
                    }}
                  >
                    Next
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Customer Details */}
            <TabsContent value="customer">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Details</CardTitle>
                  <CardDescription>Enter information about the customer</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="customerFirstName">First Name</Label>
                      <Input
                        id="customerFirstName"
                        {...form.register('customerFirstName')}
                        placeholder="Enter customer's first name"
                      />
                      {form.formState.errors.customerFirstName && (
                        <p className="text-sm text-red-500">{form.formState.errors.customerFirstName.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="customerLastName">Last Name</Label>
                      <Input
                        id="customerLastName"
                        {...form.register('customerLastName')}
                        placeholder="Enter customer's last name"
                      />
                      {form.formState.errors.customerLastName && (
                        <p className="text-sm text-red-500">{form.formState.errors.customerLastName.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="customerMobile">Mobile</Label>
                      <Input
                        id="customerMobile"
                        {...form.register('customerMobile')}
                        placeholder="Enter customer's mobile number"
                      />
                      {form.formState.errors.customerMobile && (
                        <p className="text-sm text-red-500">{form.formState.errors.customerMobile.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail">Email</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        {...form.register('customerEmail')}
                        placeholder="Enter customer's email"
                      />
                      {form.formState.errors.customerEmail && (
                        <p className="text-sm text-red-500">{form.formState.errors.customerEmail.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="customerAddress">Address</Label>
                      <Textarea
                        id="customerAddress"
                        {...form.register('customerAddress')}
                        placeholder="Enter customer's address"
                        rows={3}
                      />
                      {form.formState.errors.customerAddress && (
                        <p className="text-sm text-red-500">{form.formState.errors.customerAddress.message}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={previousTab}>
                    Previous
                  </Button>
                  <Button 
                    type="button" 
                    onClick={async () => {
                      const isValid = await form.trigger(['customerFirstName', 'customerLastName', 'customerMobile', 'customerEmail', 'customerAddress']);
                      if (isValid) {
                        nextTab();
                      }
                    }}
                  >
                    Next
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Car Details */}
            <TabsContent value="car">
              <Card>
                <CardHeader>
                  <CardTitle>Car Details</CardTitle>
                  <CardDescription>Enter information about the car</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="carMake">Car Make</Label>
                      <Controller
                        control={form.control}
                        name="carMake"
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={(val) => {
                              field.onChange(val);
                              const brand = vehicleBrands.find(b => b.name === val);
                              setSelectedBrandId(brand ? brand.id : null);
                              form.setValue('carModel', '');
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={brandsLoading ? "Loading..." : "Select car make"} />
                            </SelectTrigger>
                            <SelectContent>
                              {brandsLoading ? (
                                <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...
                                </div>
                              ) : vehicleBrands.length === 0 ? (
                                <div className="py-2 px-3 text-sm text-muted-foreground">No brands available</div>
                              ) : (
                                vehicleBrands.map(brand => (
                                  <SelectItem key={brand.id} value={brand.name}>{brand.name}</SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {form.formState.errors.carMake && (
                        <p className="text-sm text-red-500">{form.formState.errors.carMake.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="carModel">Car Model</Label>
                      <Controller
                        control={form.control}
                        name="carModel"
                        render={({ field }) => {
                          const filteredModels = selectedBrandId
                            ? allVehicleModels.filter(m => m.brandId === selectedBrandId)
                            : allVehicleModels;
                          return (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={!form.watch('carMake')}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={
                                  modelsLoading ? "Loading..." :
                                  !form.watch('carMake') ? "Select make first" :
                                  "Select car model"
                                } />
                              </SelectTrigger>
                              <SelectContent>
                                {modelsLoading ? (
                                  <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...
                                  </div>
                                ) : filteredModels.length === 0 ? (
                                  <div className="py-2 px-3 text-sm text-muted-foreground">No models available</div>
                                ) : (
                                  filteredModels.map(model => (
                                    <SelectItem key={model.id} value={model.name}>{model.name}</SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          );
                        }}
                      />
                      {form.formState.errors.carModel && (
                        <p className="text-sm text-red-500">{form.formState.errors.carModel.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="carColor">Car Color</Label>
                      <Input
                        id="carColor"
                        {...form.register('carColor')}
                        placeholder="Enter car color"
                      />
                      {form.formState.errors.carColor && (
                        <p className="text-sm text-red-500">{form.formState.errors.carColor.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2 md:col-span-3">
                      <Label htmlFor="carRegOrVIN">Registration / VIN Number</Label>
                      <Input
                        id="carRegOrVIN"
                        {...form.register('carRegOrVIN')}
                        placeholder="Enter registration or VIN number"
                      />
                      {form.formState.errors.carRegOrVIN && (
                        <p className="text-sm text-red-500">{form.formState.errors.carRegOrVIN.message}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={previousTab}>
                    Previous
                  </Button>
                  <Button 
                    type="button" 
                    onClick={async () => {
                      const isValid = await form.trigger(['carMake', 'carModel', 'carColor', 'carRegOrVIN']);
                      if (isValid) {
                        nextTab();
                      }
                    }}
                  >
                    Next
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Installation Details */}
            <TabsContent value="installation">
              <Card>
                <CardHeader>
                  <CardTitle>Installation Details</CardTitle>
                  <CardDescription>Enter information about the installation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="productInstalled">Product Installed</Label>
                      <Controller
                        control={form.control}
                        name="productInstalled"
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={productNamesLoading ? "Loading products..." : "Select product"} />
                            </SelectTrigger>
                            <SelectContent>
                              {productNamesLoading ? (
                                <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Loading...
                                </div>
                              ) : productNames.length === 0 ? (
                                <div className="py-2 px-3 text-sm text-muted-foreground">No products available</div>
                              ) : (
                                productNames.map(name => (
                                  <SelectItem key={name} value={name}>{name}</SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {form.formState.errors.productInstalled && (
                        <p className="text-sm text-red-500">{form.formState.errors.productInstalled.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="installationDate">Installation Date</Label>
                      <Controller
                        control={form.control}
                        name="installationDate"
                        render={({ field }) => (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                                disabled={(date) => date > new Date()}
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      />
                      {form.formState.errors.installationDate && (
                        <p className="text-sm text-red-500">{form.formState.errors.installationDate.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4 mt-6">
                    <Label>PPF Installation Area</Label>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="fullCarPPF" 
                          checked={form.watch('fullCarPPF')}
                          onCheckedChange={(checked) => {
                            form.setValue('fullCarPPF', checked === true);
                          }} 
                        />
                        <Label htmlFor="fullCarPPF" className="font-medium">Full Car PPF</Label>
                      </div>
                      
                      {!watchFullCarPPF && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pl-6">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="frontFender" 
                              checked={form.watch('frontFender')}
                              onCheckedChange={(checked) => {
                                form.setValue('frontFender', checked === true);
                              }} 
                            />
                            <Label htmlFor="frontFender">Front Fender</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="frontBumper" 
                              checked={form.watch('frontBumper')}
                              onCheckedChange={(checked) => {
                                form.setValue('frontBumper', checked === true);
                              }} 
                            />
                            <Label htmlFor="frontBumper">Front Bumper</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="frontBonnet" 
                              checked={form.watch('frontBonnet')}
                              onCheckedChange={(checked) => {
                                form.setValue('frontBonnet', checked === true);
                              }} 
                            />
                            <Label htmlFor="frontBonnet">Front Bonnet</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="aPillar" 
                              checked={form.watch('aPillar')}
                              onCheckedChange={(checked) => {
                                form.setValue('aPillar', checked === true);
                              }} 
                            />
                            <Label htmlFor="aPillar">A Pillar</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="doors" 
                              checked={form.watch('doors')}
                              onCheckedChange={(checked) => {
                                form.setValue('doors', checked === true);
                              }} 
                            />
                            <Label htmlFor="doors">Doors</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="roof" 
                              checked={form.watch('roof')}
                              onCheckedChange={(checked) => {
                                form.setValue('roof', checked === true);
                              }} 
                            />
                            <Label htmlFor="roof">Roof</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="rearFender" 
                              checked={form.watch('rearFender')}
                              onCheckedChange={(checked) => {
                                form.setValue('rearFender', checked === true);
                              }} 
                            />
                            <Label htmlFor="rearFender">Rear Fender</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="backCover" 
                              checked={form.watch('backCover')}
                              onCheckedChange={(checked) => {
                                form.setValue('backCover', checked === true);
                              }} 
                            />
                            <Label htmlFor="backCover">Back Cover</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="lightReflector" 
                              checked={form.watch('lightReflector')}
                              onCheckedChange={(checked) => {
                                form.setValue('lightReflector', checked === true);
                              }} 
                            />
                            <Label htmlFor="lightReflector">Light Reflector</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="headLight" 
                              checked={form.watch('headLight')}
                              onCheckedChange={(checked) => {
                                form.setValue('headLight', checked === true);
                              }} 
                            />
                            <Label htmlFor="headLight">Head Light</Label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={previousTab}>
                    Previous
                  </Button>
                  <Button 
                    type="button" 
                    onClick={async () => {
                      const isValid = await form.trigger(['productInstalled', 'installationDate']);
                      if (isValid) {
                        nextTab();
                      }
                    }}
                  >
                    Next
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Product Details & Photos */}
            <TabsContent value="product">
              <Card>
                <CardHeader>
                  <CardTitle>Product Details & Photos</CardTitle>
                  <CardDescription>Enter product details and upload installation photos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Batch Numbers (Lot Numbers) - First one validates and enables auto-approval */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Batch Numbers & Quantities</Label>
                        <p className="text-xs text-gray-500">
                          First batch number will be validated for automatic warranty approval
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ lotNumber: '', quantity: '' })}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Roll
                      </Button>
                    </div>
                    
                    {form.watch('lotNumbers')?.map((field, index) => {
                      const validation = batchValidations[index] || { isValidating: false, isValid: null, message: '' };
                      
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-end gap-4">
                            <div className="flex-1 space-y-2">
                              <Label htmlFor={`lotNumber-${index}`}>
                                Batch Number {index === 0 && <span className="text-gray-500 text-sm">(validates for auto-approval)</span>}
                              </Label>
                              <div className="relative">
                                <Input
                                  id={`lotNumber-${index}`}
                                  data-testid={`input-batchNumber-${index}`}
                                  {...form.register(`lotNumbers.${index}.lotNumber` as const)}
                                  placeholder="Enter batch number"
                                  className={cn(
                                    validation.isValid === true && "border-green-500",
                                    validation.isValid === false && "border-red-500"
                                  )}
                                />
                                {validation.isValidating && (
                                  <div className="absolute right-3 top-3">
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                  </div>
                                )}
                              </div>
                            </div>
                          
                          <div className="flex-1 space-y-2">
                            <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                            <Input
                              id={`quantity-${index}`}
                              {...form.register(`lotNumbers.${index}.quantity` as const)}
                              placeholder="Enter quantity"
                            />
                          </div>
                          
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        {/* Validation badge for each batch number */}
                        {validation.message && (
                          <div className="flex items-center gap-2 ml-1">
                            {validation.isValid === true && (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                {validation.message}
                              </Badge>
                            )}
                            {validation.isValid === false && (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                {validation.message}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      );
                    })}
                    
                    {form.formState.errors.lotNumbers && (
                      <p className="text-sm text-red-500">At least one batch number is required</p>
                    )}
                  </div>
                  
                  {/* Photos */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="photos">Car Post-Installation Photos (4 photos from each angle)</Label>
                      <div className="text-sm text-gray-500">Current: {photos.length}/4</div>
                    </div>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <div className="text-center">
                        <ImagePlus className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 mb-4">Upload car photos (max 4)</p>
                        <input
                          type="file"
                          accept="image/*"
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          onChange={handleFileChange}
                          multiple
                          disabled={photos.length >= 4}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {photos.length > 0 ? (
                        photos.map((photo, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(photo)}
                              alt={`Car photo ${index + 1}`}
                              className="w-full h-40 object-cover rounded-md"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6"
                              onClick={() => removePhoto(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-8">
                          <ImagePlus className="h-10 w-10 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">Upload car photos (max 4)</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="mt-2"
                            onClick={triggerFileInput}
                          >
                            Browse Files
                          </Button>
                          <input
                            type="file"
                            accept="image/*"
                            className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            onChange={handleFileChange}
                            multiple
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={previousTab}>
                    Previous
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? 'Submitting...' : 'Register Warranty'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>
  );
}