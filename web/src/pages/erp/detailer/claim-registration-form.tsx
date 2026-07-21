import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, ArrowLeft, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the claim form schema
const claimFormSchema = z.object({
  serialOrLotNumber: z.string().min(1, "Serial or Lot number is required"),
  lookupType: z.enum(["serial", "lot"], {
    required_error: "Please select a lookup type",
  }),
  productId: z.number().optional(),
  productName: z.string().optional(),
  productSize: z.string().optional(),
  serialNumber: z.string().optional(),
  lotNumber: z.string().optional(),
  
  // Claim details
  problemLength: z.string().min(1, "Length is required"),
  problemWidth: z.string().min(1, "Width is required"),
  problemArea: z.string().min(1, "Problem area is required"),
  issueType: z.string().min(1, "Issue type is required"),
  description: z.string().min(10, "Please provide a detailed description (min 10 characters)"),
});

type ClaimFormValues = z.infer<typeof claimFormSchema>;

export default function DetailerClaimRegForm() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  
  // Initialize the form with default values
  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      serialOrLotNumber: "",
      lookupType: "serial",
      problemLength: "",
      problemWidth: "",
      problemArea: "",
      issueType: "",
      description: "",
    },
  });
  
  // Handle product lookup
  const handleProductLookup = async () => {
    const serialOrLotNumber = form.getValues("serialOrLotNumber");
    const lookupType = form.getValues("lookupType");
    
    if (!serialOrLotNumber) {
      toast({
        title: "Missing information",
        description: "Please enter a serial or lot number",
        variant: "destructive",
      });
      return;
    }
    
    setIsLookingUp(true);
    
    try {
      const res = await apiRequest(
        "GET", 
        `/api/erp/product-lookup?type=${lookupType}&value=${encodeURIComponent(serialOrLotNumber)}`
      );
      const data = await res.json();
      
      if (data.success) {
        // Update form with product information
        form.setValue("productId", data.id);
        form.setValue("productName", data.name);
        form.setValue("productSize", data.size);
        form.setValue("serialNumber", data.serialNumber);
        form.setValue("lotNumber", data.lotNumber);
        
        toast({
          title: "Product found",
          description: `Found: ${data.name}`,
        });
      } else {
        toast({
          title: "Product not found",
          description: data.message || "No product found with the provided number",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error looking up product:", error);
      toast({
        title: "Lookup failed",
        description: "There was an error looking up the product",
        variant: "destructive",
      });
    } finally {
      setIsLookingUp(false);
    }
  };
  
  // Handle form submission
  const onSubmit = async (values: ClaimFormValues) => {
    if (!values.productId) {
      toast({
        title: "Missing product information",
        description: "Please lookup a valid product first",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Calculate area for the claim
      const area = parseFloat(values.problemLength) * parseFloat(values.problemWidth);
      
      // Prepare payload
      const payload = {
        productId: values.productId,
        serialNumber: values.serialNumber,
        lotNumber: values.lotNumber,
        problemLength: values.problemLength,
        problemWidth: values.problemWidth,
        problemArea: values.problemArea,
        issueType: values.issueType,
        description: values.description,
        area: isNaN(area) ? 0 : area
      };
      
      const res = await apiRequest("POST", "/api/erp/claims/register", payload);
      const data = await res.json();
      
      if (data.success) {
        toast({
          title: "Claim registered successfully",
          description: "Your claim has been submitted for review",
        });
        
        // Navigate back to claims list
        navigate("/erp/detailer/claims");
      } else {
        toast({
          title: "Registration failed",
          description: data.message || "Failed to register the claim",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error registering claim:", error);
      toast({
        title: "Registration failed",
        description: "There was an error submitting your claim",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/erp/detailer/claims")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Register New Warranty Claim</h1>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Lookup Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>
              Enter the serial number or lot number to look up the product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="lookupType"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Lookup Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-row space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="serial" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Serial Number
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="lot" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Lot Number
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex space-x-2">
                <FormField
                  control={form.control}
                  name="serialOrLotNumber"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Serial/Lot Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  className="mt-8"
                  type="button"
                  variant="outline"
                  onClick={handleProductLookup}
                  disabled={isLookingUp}
                >
                  {isLookingUp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Product details display */}
              {form.watch("productName") && (
                <div className="rounded-md border p-4 mt-4">
                  <h3 className="font-medium">Product Details</h3>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="grid grid-cols-2">
                      <span className="text-gray-500">Product:</span>
                      <span>{form.watch("productName")}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-gray-500">Size/Type:</span>
                      <span>{form.watch("productSize")}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-gray-500">Serial Number:</span>
                      <span>{form.watch("serialNumber")}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-gray-500">Lot Number:</span>
                      <span>{form.watch("lotNumber")}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Claim Details Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Claim Details</CardTitle>
            <CardDescription>
              Provide information about the issue with the product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="problemLength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Length (cm)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter length"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="problemWidth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Width (cm)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter width"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="problemArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Problem Area</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Front Bumper, Hood, etc."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="issueType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select issue type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="peeling">Peeling</SelectItem>
                          <SelectItem value="bubbling">Bubbling</SelectItem>
                          <SelectItem value="discoloration">Discoloration</SelectItem>
                          <SelectItem value="adhesion_failure">Adhesion Failure</SelectItem>
                          <SelectItem value="edge_lifting">Edge Lifting</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the issue in detail including when it was noticed, how it has progressed, etc."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/erp/detailer/claims")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !form.watch("productId")}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Claim"
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