import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

// Extended schema with validations
const warrantyRegistrationSchema = z.object({
  // Customer Information
  name: z.string().min(2, { message: "Customer name is required" }),
  email: z.string().email({ message: "Valid email is required" }),
  phone: z.string().min(6, { message: "Valid phone number is required" }),
  address: z.string().optional(),
  
  // Vehicle Information
  vehicleMake: z.string().min(1, { message: "Vehicle make is required" }),
  vehicleModel: z.string().min(1, { message: "Vehicle model is required" }),
  vehicleYear: z.string().min(4, { message: "Vehicle year is required" }),
  vehicleColor: z.string().optional(),
  vehicleVIN: z.string().optional(),
  
  // Product Information
  productType: z.string().min(1, { message: "Product type is required" }),
  warrantyCode: z.string().optional(),
  installationDate: z.string().min(1, { message: "Installation date is required" }),
  
  // Installation Details
  installer: z.string().min(1, { message: "Installer name is required" }),
  lotNumbers: z.array(z.string()).optional(),
  
  // Installation Areas - PPF
  fullCarPPF: z.boolean().optional(),
  partialCarPPF: z.boolean().optional(),
  frontFender: z.boolean().optional(),
  frontBumper: z.boolean().optional(),
  frontBonnet: z.boolean().optional(),
  aPillar: z.boolean().optional(),
  doors: z.boolean().optional(),
  roof: z.boolean().optional(),
  rearFender: z.boolean().optional(),
  backCover: z.boolean().optional(),
  lightReflector: z.boolean().optional(),
  headLight: z.boolean().optional(),
  
  // Optional detailer selection for distributor
  detailerId: z.string().optional(),
  
  // Notes
  notes: z.string().optional(),
});

// Define props
interface WarrantyRegistrationFormProps {
  userRole: 'distributor' | 'detailer';
  onSuccess?: () => void;
}

export default function WarrantyRegistrationForm({ userRole, onSuccess }: WarrantyRegistrationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lotNumber, setLotNumber] = useState('');
  const [lotNumbers, setLotNumbers] = useState<string[]>([]);
  
  // Form definition
  const form = useForm<z.infer<typeof warrantyRegistrationSchema>>({
    resolver: zodResolver(warrantyRegistrationSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      vehicleMake: '',
      vehicleModel: '',
      vehicleYear: new Date().getFullYear().toString(),
      vehicleColor: '',
      vehicleVIN: '',
      productType: '',
      installationDate: new Date().toISOString().split('T')[0],
      installer: '',
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
      detailerId: 'none',
      notes: '',
    }
  });
  
  // Fetch detailers if user role is distributor
  const { data: detailers } = useQuery({
    queryKey: ['/api/erp/distributor/detailers/active'],
    enabled: userRole === 'distributor',
  });
  
  // Mutation for submitting the form
  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof warrantyRegistrationSchema>) => {
      // Prepare data with lot numbers
      const formData = {
        ...data,
        lotNumbers
      };
      
      // Define the endpoint based on user role
      const endpoint = userRole === 'distributor' 
        ? '/api/erp/distributor/warranties' 
        : '/api/erp/detailer/warranties';
      
      return await apiRequest('POST', endpoint, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [
        userRole === 'distributor' ? '/api/erp/distributor/warranties' : '/api/erp/detailer/warranties'
      ]});
      
      toast({
        title: "Success",
        description: "Warranty has been registered successfully",
      });
      
      // Reset form
      form.reset();
      setLotNumbers([]);
      
      if (onSuccess) {
        onSuccess();
      }
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
  
  // Handle lot number addition
  const addLotNumber = () => {
    if (lotNumber.trim() && !lotNumbers.includes(lotNumber.trim())) {
      setLotNumbers([...lotNumbers, lotNumber.trim()]);
      setLotNumber('');
    }
  };
  
  // Handle lot number removal
  const removeLotNumber = (indexToRemove: number) => {
    setLotNumbers(lotNumbers.filter((_, index) => index !== indexToRemove));
  };
  
  // Form submission
  const onSubmit = (data: z.infer<typeof warrantyRegistrationSchema>) => {
    // Add lot numbers to data
    const formData = {
      ...data,
      lotNumbers
    };
    
    // Submit the form
    mutation.mutate(formData);
  };
  
  // Generate warranty code
  const generateWarrantyCode = () => {
    const prefix = form.getValues('productType')?.substring(0, 3).toUpperCase() || 'WAR';
    const random = Math.floor(100000 + Math.random() * 900000).toString();
    const code = `${prefix}-${random}`;
    form.setValue('warrantyCode', code);
  };
  
  // Auto-generate warranty code when product type changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'productType' && value.productType) {
        generateWarrantyCode();
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch]);
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Customer Information */}
        <div>
          <h3 className="text-lg font-medium mb-4">Customer Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input placeholder="Email address" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone *</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Customer address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <Separator />
        
        {/* Vehicle Information */}
        <div>
          <h3 className="text-lg font-medium mb-4">Vehicle Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Make */}
            <FormField
              control={form.control}
              name="vehicleMake"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Make *</FormLabel>
                  <FormControl>
                    <Input placeholder="Vehicle make" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Model */}
            <FormField
              control={form.control}
              name="vehicleModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model *</FormLabel>
                  <FormControl>
                    <Input placeholder="Vehicle model" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Year */}
            <FormField
              control={form.control}
              name="vehicleYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year *</FormLabel>
                  <FormControl>
                    <Input placeholder="Vehicle year" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Color */}
            <FormField
              control={form.control}
              name="vehicleColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <Input placeholder="Vehicle color" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* VIN */}
            <FormField
              control={form.control}
              name="vehicleVIN"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>VIN (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Vehicle identification number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <Separator />
        
        {/* Product & Installation */}
        <div>
          <h3 className="text-lg font-medium mb-4">Product & Installation</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Type */}
            <FormField
              control={form.control}
              name="productType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PPF Basic">PPF Basic</SelectItem>
                      <SelectItem value="PPF Prime">PPF Prime</SelectItem>
                      <SelectItem value="PPF Spectrum">PPF Spectrum</SelectItem>
                      <SelectItem value="P91 3">P91 3 (Ceramic Coating)</SelectItem>
                      <SelectItem value="P91 5">P91 5 (Ceramic Coating)</SelectItem>
                      <SelectItem value="P91 7">P91 7 (Ceramic Coating)</SelectItem>
                      <SelectItem value="P91 Graphene">P91 Graphene (Ceramic Coating)</SelectItem>
                      <SelectItem value="P91 Glass">P91 Glass (Home Series)</SelectItem>
                      <SelectItem value="P91 Fabric">P91 Fabric (Home Series)</SelectItem>
                      <SelectItem value="P91 Wood">P91 Wood (Home Series)</SelectItem>
                      <SelectItem value="P91 Leather">P91 Leather (Home Series)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Warranty Code */}
            <FormField
              control={form.control}
              name="warrantyCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warranty Code</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        placeholder="Auto-generated on submission" 
                        {...field} 
                        readOnly
                      />
                    </FormControl>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={generateWarrantyCode}
                    >
                      Generate
                    </Button>
                  </div>
                  <FormDescription>
                    A unique code will be auto-generated based on the product type
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Installation Date */}
            <FormField
              control={form.control}
              name="installationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Installation Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Installer */}
            <FormField
              control={form.control}
              name="installer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Installer Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Name of installer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Lot Numbers */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex flex-col space-y-2">
                <FormLabel>Lot Numbers</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter lot number"
                    value={lotNumber}
                    onChange={(e) => setLotNumber(e.target.value)}
                  />
                  <Button 
                    type="button" 
                    onClick={addLotNumber} 
                    disabled={!lotNumber.trim()}
                  >
                    Add
                  </Button>
                </div>
                
                {lotNumbers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {lotNumbers.map((lot, index) => (
                      <div key={index} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md">
                        <span>{lot}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => removeLotNumber(index)}
                        >
                          &times;
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Installation Areas - PPF */}
        <div>
          <h3 className="text-lg font-medium mb-4">Installation Areas (PPF)</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Full Car */}
            <FormField
              control={form.control}
              name="fullCarPPF"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Full Car</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            {/* Partial */}
            <FormField
              control={form.control}
              name="partialCarPPF"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Partial</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            {/* Front Fender */}
            <FormField
              control={form.control}
              name="frontFender"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Front Fender</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            {/* Front Bumper */}
            <FormField
              control={form.control}
              name="frontBumper"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Front Bumper</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            {/* Front Bonnet */}
            <FormField
              control={form.control}
              name="frontBonnet"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Front Bonnet</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            {/* A-Pillar */}
            <FormField
              control={form.control}
              name="aPillar"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>A-Pillar</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            {/* Doors */}
            <FormField
              control={form.control}
              name="doors"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Doors</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            {/* Roof */}
            <FormField
              control={form.control}
              name="roof"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Roof</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            {/* Rear Fender */}
            <FormField
              control={form.control}
              name="rearFender"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Rear Fender</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            {/* Back Cover */}
            <FormField
              control={form.control}
              name="backCover"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Back Cover</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            {/* Light Reflector */}
            <FormField
              control={form.control}
              name="lightReflector"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Light Reflector</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            {/* Head Light */}
            <FormField
              control={form.control}
              name="headLight"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Head Light</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <Separator />
        
        {/* Detailer Selection (for distributor only) */}
        {userRole === 'distributor' && detailers && Array.isArray(detailers) && detailers.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-4">Assign to Detailer (Optional)</h3>
            
            <FormField
              control={form.control}
              name="detailerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Detailer</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a detailer (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Submit as Distributor</SelectItem>
                      {detailers.map((detailer: any) => (
                        <SelectItem key={detailer.id} value={detailer.id.toString()}>
                          {detailer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    If selected, this warranty will be registered on behalf of the detailer
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Separator className="my-6" />
          </div>
        )}
        
        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any additional information about this installation"
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full md:w-auto" 
          disabled={mutation.isPending}
        >
          {mutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Register Warranty
        </Button>
      </form>
    </Form>
  );
}