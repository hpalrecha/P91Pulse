import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Search, ArrowRight, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Form validation schema
const formSchema = z.object({
  warrantyId: z.number({
    required_error: "Warranty ID is required",
  }),
  customerId: z.number({
    required_error: "Customer ID is required",
  }),
  vehicleId: z.number({
    required_error: "Vehicle ID is required",
  }),
  detailerId: z.number({
    required_error: "Detailer ID is required",
  }),
  issue: z.string().min(5, {
    message: "Issue must be at least 5 characters",
  }),
  issueDescription: z.string().min(20, {
    message: "Description must be at least 20 characters",
  }),
  serialNumber: z.string().min(1, {
    message: "Serial/LOT number is required",
  }),
  images: z.array(z.string()).optional(),
});

export default function ClaimFormPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [selectedWarranty, setSelectedWarranty] = useState<any>(null);
  const [serialSearchValue, setSerialSearchValue] = useState("");
  const [searching, setSearching] = useState(false);
  const [productInfo, setProductInfo] = useState<any>(null);
  const [serialNumberError, setSerialNumberError] = useState("");

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      issue: "",
      issueDescription: "",
      serialNumber: "",
      images: [],
    },
  });

  // Load current user and warranties
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get current user
        const userResponse = await apiRequest('GET', '/api/erp/me');
        const userData = await userResponse.json();
        setUser(userData);

        // Get warranties
        const warrantiesResponse = await apiRequest('GET', '/api/erp/detailer/warranties');
        const warrantiesData = await warrantiesResponse.json();
        setWarranties(warrantiesData);

        // Set form defaults if user is found
        if (userData && userData.id) {
          form.setValue('detailerId', userData.id);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load data. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast, form]);

  // Handle serial number search
  const handleSerialSearch = async () => {
    if (!serialSearchValue.trim()) {
      setSerialNumberError("Please enter a serial number");
      return;
    }
    
    setSearching(true);
    setSerialNumberError("");
    
    try {
      const response = await apiRequest('GET', `/api/erp/serial-number/${serialSearchValue.trim()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to find serial number');
      }
      
      const data = await response.json();
      setProductInfo(data);
      form.setValue('serialNumber', serialSearchValue.trim());
      
      // Show success toast
      toast({
        title: 'Serial Number Found',
        description: `Product: ${data.product.name}`,
      });
      
    } catch (error) {
      console.error('Error searching serial number:', error);
      setSerialNumberError(error instanceof Error ? error.message : 'Failed to find serial number');
      setProductInfo(null);
    } finally {
      setSearching(false);
    }
  };

  // Handle warranty selection
  const handleWarrantySelect = (warranty: any) => {
    setSelectedWarranty(warranty);
    
    // Set form values
    form.setValue('warrantyId', warranty.id);
    form.setValue('customerId', warranty.customerId);
    form.setValue('vehicleId', warranty.vehicleId);
  };

  // Form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedWarranty) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a warranty record',
      });
      return;
    }
    
    if (!productInfo) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please search for a valid serial number',
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await apiRequest('POST', '/api/erp/claims', values);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit claim');
      }
      
      // Show success message
      toast({
        title: 'Claim Submitted',
        description: 'Your warranty claim has been submitted successfully.',
      });
      
      // Navigate back to claims page
      navigate('/erp/detailer/claims');
      
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Error',
        description: error instanceof Error ? error.message : 'Failed to submit claim. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Submit Warranty Claim</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new warranty claim for a customer product.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Warranty Selection */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Select Warranty</CardTitle>
            <CardDescription>
              Choose the warranty record for which you're submitting a claim
            </CardDescription>
          </CardHeader>
          <CardContent>
            {warranties.length === 0 ? (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertTitle>No Warranties Found</AlertTitle>
                <AlertDescription>
                  You don't have any active warranties in the system. Only active warranties are eligible for claims.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <Input 
                  placeholder="Search warranties..." 
                  className="mb-4"
                />
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {warranties.map((warranty) => (
                    <Card 
                      key={warranty.id} 
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedWarranty?.id === warranty.id ? 'bg-gray-50 border-primary' : ''
                      }`}
                      onClick={() => handleWarrantySelect(warranty)}
                    >
                      <CardContent className="p-4">
                        <div className="font-medium">{warranty.customerName}</div>
                        <div className="text-sm text-gray-500">
                          {warranty.vehicleMake} {warranty.vehicleModel} ({warranty.vehicleYear})
                        </div>
                        <div className="text-sm text-gray-500">
                          Product: {warranty.productName}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Warranty Code: {warranty.warrantyCode}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Claim Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Claim Details</CardTitle>
            <CardDescription>
              Provide information about the issue and product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Serial Number Search */}
                <div>
                  <Label>Serial/LOT Number Lookup</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="Enter serial or LOT number"
                      value={serialSearchValue}
                      onChange={(e) => setSerialSearchValue(e.target.value)}
                    />
                    <Button 
                      type="button" 
                      onClick={handleSerialSearch}
                      disabled={searching}
                    >
                      {searching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                      Search
                    </Button>
                  </div>
                  {serialNumberError && (
                    <p className="text-sm text-red-500 mt-1">{serialNumberError}</p>
                  )}
                </div>
                
                {/* Product Information */}
                {productInfo && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Product Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Product:</span>
                          <span className="font-medium">{productInfo.product.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Category:</span>
                          <span>{productInfo.product.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Type:</span>
                          <span>{productInfo.product.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Serial:</span>
                          <span>{productInfo.serialNumber.childSerial}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <Separator />
                
                {/* Hidden Fields */}
                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem hidden>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="warrantyId"
                  render={({ field }) => (
                    <FormItem hidden>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem hidden>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="vehicleId"
                  render={({ field }) => (
                    <FormItem hidden>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="detailerId"
                  render={({ field }) => (
                    <FormItem hidden>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {/* Visible Fields */}
                <FormField
                  control={form.control}
                  name="issue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Title</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g. Peeling edges on front bumper" {...field} />
                      </FormControl>
                      <FormDescription>
                        Briefly describe the issue in a few words
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="issueDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide detailed information about the issue..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Include when the issue appeared, any contributing factors, and relevant details
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={submitting || !selectedWarranty || !productInfo}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Claim
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}