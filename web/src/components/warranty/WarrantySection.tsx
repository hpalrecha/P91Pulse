import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ImagePlus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

const warrantyFormSchema = z.object({
  // Installer & Store Details
  installerName: z.string().min(1, { message: "Installer name is required" }),
  installerMobile: z.string().min(10, { message: "Valid mobile number is required" }),
  storeEmail: z.string().email({ message: "Valid email is required" }),
  storeName: z.string().min(1, { message: "Store name is required" }),
  storeLocation: z.string().min(1, { message: "Store location is required" }),
  
  // Customer Details
  customerFirstName: z.string().min(1, { message: "First name is required" }),
  customerLastName: z.string().min(1, { message: "Last name is required" }),
  customerMobile: z.string().min(10, { message: "Valid mobile number is required" }),
  customerEmail: z.string().email({ message: "Valid email is required" }),
  customerAddress: z.string().min(1, { message: "Address is required" }),
  
  // Car Details
  carMake: z.string().min(1, { message: "Car make is required" }),
  carModel: z.string().min(1, { message: "Car model is required" }),
  carColor: z.string().min(1, { message: "Car color is required" }),
  carRegOrVIN: z.string().min(1, { message: "Registration or VIN number is required" }),
  
  // Installation Details
  productInstalled: z.string().min(1, { message: "Product is required" }),
  installationDate: z.date({
    required_error: "Installation date is required",
  }),
  
  // PPF Installation Area
  fullCarPPF: z.boolean().default(false),
  partialCarPPF: z.boolean().default(false),
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
  
  // Product Details
  lotNumbers: z.array(z.object({
    lotNumber: z.string().min(1, { message: "Lot number is required" }),
    quantity: z.string().min(1, { message: "Quantity is required" }),
  })).min(1, { message: "At least one lot number is required" }),
});

type WarrantyFormValues = z.infer<typeof warrantyFormSchema>;

export function WarrantySection() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("installer");

  const form = useForm<WarrantyFormValues>({
    resolver: zodResolver(warrantyFormSchema),
    defaultValues: {
      installerName: "",
      installerMobile: "",
      storeEmail: "",
      storeName: "",
      storeLocation: "",
      
      customerFirstName: "",
      customerLastName: "",
      customerMobile: "",
      customerEmail: "",
      customerAddress: "",
      
      carMake: "",
      carModel: "",
      carColor: "",
      carRegOrVIN: "",
      
      productInstalled: "",
      installationDate: new Date(),
      
      fullCarPPF: false,
      partialCarPPF: false,
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
      
      lotNumbers: [{ lotNumber: "", quantity: "" }],
    },
  });
  
  // Fix to properly handle adding and removing lot numbers
  const lotNumbers = form.watch('lotNumbers');
  
  const addLotNumber = () => {
    const currentLotNumbers = form.getValues('lotNumbers') || [];
    form.setValue('lotNumbers', [...currentLotNumbers, { lotNumber: '', quantity: '' }]);
  };
  
  const removeLotNumber = (index: number) => {
    const currentLotNumbers = form.getValues('lotNumbers');
    if (currentLotNumbers.length > 1) {
      form.setValue('lotNumbers', currentLotNumbers.filter((_, i) => i !== index));
    }
  };
  const watchFullCarPPF = form.watch('fullCarPPF');
  const watchPartialCarPPF = form.watch('partialCarPPF');

  // Define type for the JSON data we'll submit
  type WarrantySubmissionData = {
    name: string;
    email: string;
    phone: string;
    productType: string;
    installationDate: string;
    installer: string;
    warrantyCode: string;
    
    // Vehicle details
    vehicleMake: string;
    vehicleModel: string;
    vehicleYear?: string;
    vehicleColor: string;
    vehicleVIN: string;
    
    // Extended fields
    installerMobile: string;
    storeName: string;
    storeEmail: string;
    storeLocation: string;
    
    // PPF Installation Areas
    fullCarPPF: boolean;
    partialCarPPF: boolean;
    frontFender: boolean;
    frontBumper: boolean;
    frontBonnet: boolean;
    aPillar: boolean;
    doors: boolean;
    roof: boolean;
    rearFender: boolean;
    backCover: boolean;
    lightReflector: boolean;
    headLight: boolean;
    
    // Lot numbers
    lotNumbers: Array<{lotNumber: string, quantity: string}>;
    
    // Photos
    photos?: string[];
  };

  const mutation = useMutation({
    mutationFn: async (data: WarrantySubmissionData) => {
      return await apiRequest("POST", "/api/warranty-registration", data);
    },
    onSuccess: () => {
      toast({
        title: "Warranty Registered",
        description: "Your warranty has been successfully registered.",
      });
      setSubmitted(true);
      form.reset();
      setPhotos([]);
    },
    onError: (error) => {
      console.error("Error submitting warranty:", error);
      toast({
        title: "Error",
        description: "There was a problem registering your warranty. Please try again.",
        variant: "destructive",
      });
    },
  });

  async function onSubmit(data: WarrantyFormValues) {
    // Convert photos to base64 strings with resizing
    const photoPromises = photos.map(file => 
      new Promise<string>((resolve) => {
        // Create an image element to resize the image
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = (e) => {
          img.src = e.target?.result as string;
          
          img.onload = () => {
            // Create a canvas to resize the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Calculate new dimensions (max width 1200px)
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            
            // Resize the canvas and draw the image
            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Get the resized image as a data URL (with reduced quality)
            const resizedImage = canvas.toDataURL('image/jpeg', 0.7);
            resolve(resizedImage);
          };
        };
        
        reader.readAsDataURL(file);
      })
    );
    
    // Wait for all photos to be converted to base64
    const photoBase64 = await Promise.all(photoPromises);
    
    // Create a comprehensive object with all fields
    const warrantyData: WarrantySubmissionData = {
      // Customer information
      name: `${data.customerFirstName} ${data.customerLastName}`,
      email: data.customerEmail,
      phone: data.customerMobile,
      
      // Product & installation information
      productType: data.productInstalled,
      installationDate: format(data.installationDate, 'yyyy-MM-dd'),
      warrantyCode: data.lotNumbers[0].lotNumber, // Using first lot number as warranty code
      
      // Installer & store details
      installer: data.installerName,
      installerMobile: data.installerMobile,
      storeName: data.storeName,
      storeEmail: data.storeEmail,
      storeLocation: data.storeLocation,
      
      // Vehicle details
      vehicleMake: data.carMake,
      vehicleModel: data.carModel,
      vehicleColor: data.carColor,
      vehicleVIN: data.carRegOrVIN,
      
      // PPF Installation Areas
      fullCarPPF: data.fullCarPPF,
      partialCarPPF: data.partialCarPPF,
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
      
      // Include the photo base64 strings
      photos: photoBase64.length > 0 ? photoBase64 : undefined,
    };
    
    // Submit the data as JSON directly
    mutation.mutate(warrantyData);
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      // Limit to 4 photos total
      const totalPhotos = [...photos, ...newFiles];
      if (totalPhotos.length > 4) {
        toast({
          title: "Too many photos",
          description: "Maximum 4 photos allowed (one from each angle)",
          variant: "destructive",
        });
        return;
      }
      
      setPhotos(prev => [...prev, ...newFiles]);
    }
  };
  
  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <section id="warranty" className="py-20 bg-neutral-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-header font-bold text-3xl md:text-4xl mb-4 scroll-trigger">eWarranty Registration</h2>
          <p className="text-neutral-500 max-w-3xl mx-auto scroll-trigger">
            Register your P91 product to activate your warranty coverage and receive important product updates.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {submitted ? (
            <div className="text-center py-8 bg-white rounded-xl shadow-md p-8">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-16 w-16 text-primary mx-auto mb-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-header font-bold mb-2">Warranty Registered Successfully!</h3>
              <p className="text-neutral-500 mb-6">Your P91 product warranty has been activated. You will receive a confirmation email with your warranty details shortly.</p>
              <Button 
                onClick={() => setSubmitted(false)}
                className="bg-secondary text-primary hover:shadow-neon"
              >
                Register Another Warranty
              </Button>
            </div>
          ) : (
            <Form {...form}>
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
                      <CardFooter className="justify-end">
                        <Button 
                          type="button" 
                          onClick={async () => {
                            const isValid = await form.trigger(['installerName', 'installerMobile', 'storeEmail', 'storeName', 'storeLocation']);
                            if (isValid) {
                              setActiveTab("customer");
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
                      <CardFooter className="justify-end">
                        <Button 
                          type="button" 
                          onClick={async () => {
                            const isValid = await form.trigger(['customerFirstName', 'customerLastName', 'customerMobile', 'customerEmail', 'customerAddress']);
                            if (isValid) {
                              setActiveTab("car");
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
                            <Input
                              id="carMake"
                              {...form.register('carMake')}
                              placeholder="Enter car make"
                            />
                            {form.formState.errors.carMake && (
                              <p className="text-sm text-red-500">{form.formState.errors.carMake.message}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="carModel">Car Model</Label>
                            <Input
                              id="carModel"
                              {...form.register('carModel')}
                              placeholder="Enter car model"
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
                      <CardFooter className="justify-end">
                        <Button 
                          type="button" 
                          onClick={async () => {
                            const isValid = await form.trigger(['carMake', 'carModel', 'carColor', 'carRegOrVIN']);
                            if (isValid) {
                              setActiveTab("installation");
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
                                    <SelectValue placeholder="Select product" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="P91 Basics">P91 Basics</SelectItem>
                                    <SelectItem value="P91 Basics Matte">P91 Basics Matte</SelectItem>
                                    <SelectItem value="P91 Basics Spectrum">P91 Basics Spectrum</SelectItem>
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
                                  if (checked === true) {
                                    form.setValue('partialCarPPF', false);
                                  }
                                }} 
                              />
                              <Label htmlFor="fullCarPPF" className="font-medium">Full Car PPF</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="partialCarPPF" 
                                checked={form.watch('partialCarPPF')}
                                onCheckedChange={(checked) => {
                                  form.setValue('partialCarPPF', checked === true);
                                  if (checked === true) {
                                    form.setValue('fullCarPPF', false);
                                  }
                                }} 
                              />
                              <Label htmlFor="partialCarPPF" className="font-medium">Partial Car PPF</Label>
                            </div>
                            
                            {watchPartialCarPPF && (
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
                      <CardFooter className="justify-end">
                        <Button 
                          type="button" 
                          onClick={async () => {
                            const isValid = await form.trigger(['productInstalled', 'installationDate']);
                            if (isValid) {
                              setActiveTab("product");
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
                        {/* Lot Numbers */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label>Product Details</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addLotNumber}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Roll
                            </Button>
                          </div>
                          
                          {form.watch('lotNumbers')?.map((field, index) => (
                            <div key={index} className="flex items-end gap-4">
                              <div className="flex-1 space-y-2">
                                <Label htmlFor={`lotNumber-${index}`}>Lot Number</Label>
                                <Input
                                  id={`lotNumber-${index}`}
                                  {...form.register(`lotNumbers.${index}.lotNumber` as const)}
                                  placeholder="Enter lot number"
                                />
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
                                  onClick={() => removeLotNumber(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          
                          {form.formState.errors.lotNumbers && (
                            <p className="text-sm text-red-500">At least one lot number is required</p>
                          )}
                        </div>
                        
                        {/* Photos */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="photos">Car Post-Installation Photos (4 photos from each angle)</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={triggerFileInput}
                              disabled={photos.length >= 4}
                            >
                              <ImagePlus className="h-4 w-4 mr-2" />
                              Add Photo
                            </Button>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileChange}
                              multiple
                            />
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
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="justify-end">
                        <Button type="submit" disabled={mutation.isPending}>
                          {mutation.isPending ? 'Submitting...' : 'Register Warranty'}
                        </Button>
                      </CardFooter>
                    </Card>
                  </TabsContent>
                </Tabs>
              </form>
            </Form>
          )}
        </div>
      </div>
    </section>
  );
}
