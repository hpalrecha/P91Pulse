import React, { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  ChevronRight,
  ArrowLeft,
  Upload,
  Check,
  AlertCircle,
  Loader2
} from "lucide-react";

// Personal information step schema
const personalInfoSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters" }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  confirmPassword: z.string(),
  position: z.string({ required_error: "Please select a position" }),
  profileImage: z.any().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Business details step schema
const businessDetailsSchema = z.object({
  legalName: z.string().min(2, { message: "Business name must be at least 2 characters" }),
  workspaceName: z.string().min(2, { message: "Workspace name must be at least 2 characters" }),
  // For detailers, we'll auto-select "Detailing" as business type
  businessTypes: z.array(z.string()).default(["Detailing"]),
  country: z.string().min(1, { message: "Country is required" }),
  state: z.string().min(1, { message: "State/Province is required" }),
  city: z.string().optional(),
  street: z.string().optional(),
  addressDetails: z.string().optional(),
  postalCode: z.string().optional(),
  // Store Location field
  storeLocation: z.string().min(2, { message: "Store location is required" }),
  businessEmail: z.string().email({ message: "Please enter a valid email address" }),
  website: z.string().optional(),
  businessPhone: z.string().min(10, { message: "Phone number must be at least 10 digits" }),
  shopFavicon: z.any().optional(),
  productsAndServices: z.array(z.string()).optional(),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

// Complete signup schema combining both steps
const signupSchema = z.object({
  personalInfo: personalInfoSchema,
  businessDetails: businessDetailsSchema,
});

type SignupFormValues = z.infer<typeof signupSchema>;

// Business types checkboxes options
const businessTypes = [
  { id: "PPF", label: "PPF" },
  { id: "Vinyl Wrap", label: "Vinyl Wrap" },
  { id: "Window Film (Tint)", label: "Window Film (Tint)" },
  { id: "Windshield", label: "Windshield" },
  { id: "Detailer", label: "Detailer" },
  { id: "Other", label: "Other" },
];

// List of countries for dropdown
const countries = [
  { id: "india", label: "India" },
  { id: "usa", label: "United States" },
  { id: "uk", label: "United Kingdom" },
  { id: "uae", label: "United Arab Emirates" },
  { id: "singapore", label: "Singapore" },
  // Add more countries as needed
];

// List of states for dropdown (example for India)
const states = {
  india: [
    { id: "karnataka", label: "Karnataka" },
    { id: "maharashtra", label: "Maharashtra" },
    { id: "tamil_nadu", label: "Tamil Nadu" },
    { id: "delhi", label: "Delhi" },
    { id: "uttar_pradesh", label: "Uttar Pradesh" },
    // Add more states as needed
  ],
  usa: [
    { id: "california", label: "California" },
    { id: "new_york", label: "New York" },
    { id: "texas", label: "Texas" },
    { id: "florida", label: "Florida" },
    // Add more states as needed
  ],
  // Add states for other countries
};

// Position options for dropdown
const positions = [
  { id: "Owner", label: "Owner" },
  { id: "Manager", label: "Manager" },
  { id: "Installer", label: "Installer" },
  { id: "Sales Representative", label: "Sales Representative" },
  { id: "Administrator", label: "Administrator" },
  { id: "Other", label: "Other" },
];

// P91 products and services options
const p91Products = [
  { id: "ppf_basic", label: "PPF Basic" },
  { id: "ppf_prime", label: "PPF Prime" },
  { id: "ppf_spectrum", label: "PPF Spectrum" },
  { id: "ceramic_coating_p91_3", label: "Ceramic Coating P91 3" },
  { id: "ceramic_coating_p91_5", label: "Ceramic Coating P91 5" },
  { id: "ceramic_coating_p91_7", label: "Ceramic Coating P91 7" },
  { id: "ceramic_coating_p91_graphene", label: "Ceramic Coating P91 Graphene" },
  { id: "home_glass", label: "Home Series Glass" },
  { id: "home_fabric", label: "Home Series Fabric" },
  { id: "home_wood", label: "Home Series Wood" },
  { id: "home_leather", label: "Home Series Leather" },
];

export default function SignUpPage() {
  const [step, setStep] = useState(1);
  const [personalInfo, setPersonalInfo] = useState<z.infer<typeof personalInfoSchema> | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Personal Information form
  const personalInfoForm = useForm<z.infer<typeof personalInfoSchema>>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      position: "",
    },
  });

  // Business Details form
  const businessDetailsForm = useForm<z.infer<typeof businessDetailsSchema>>({
    resolver: zodResolver(businessDetailsSchema),
    defaultValues: {
      legalName: "",
      workspaceName: "",
      businessTypes: [],
      country: "",
      state: "",
      city: "",
      street: "",
      addressDetails: "",
      postalCode: "",
      storeLocation: "",
      businessEmail: "",
      website: "",
      businessPhone: "",
      productsAndServices: [],
      termsAccepted: false,
    },
  });

  // Handle country selection to update states dropdown
  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    businessDetailsForm.setValue("country", value);
    businessDetailsForm.setValue("state", ""); // Reset state when country changes
  };

  // Mutation for submitting the form
  const signupMutation = useMutation({
    mutationFn: async (data: SignupFormValues) => {
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Append personal info fields
      Object.entries(data.personalInfo).forEach(([key, value]) => {
        if (key === "profileImage" && value instanceof File) {
          formData.append("profileImage", value);
        } else if (key !== "profileImage") {
          formData.append(key, String(value));
        }
      });
      
      // Append business details fields
      Object.entries(data.businessDetails).forEach(([key, value]) => {
        if (key === "shopFavicon" && value instanceof File) {
          formData.append("shopFavicon", value);
        } else if (key === "businessTypes" || key === "productsAndServices") {
          // Handle arrays
          if (Array.isArray(value)) {
            value.forEach(item => {
              formData.append(`${key}[]`, item);
            });
          }
        } else if (key !== "shopFavicon") {
          formData.append(key, String(value));
        }
      });
      
      try {
        // Make sure to handle the response properly
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          body: formData,
          // Don't set Content-Type header for FormData - browser will set it with boundary
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Signup error response:", errorText);
          try {
            // Try to parse as JSON first
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || errorJson.message || "Registration failed");
          } catch (e) {
            // If not JSON, use the text directly
            throw new Error(errorText || "Registration failed. Please try again.");
          }
        }
        
        return await response.json();
      } catch (error) {
        console.error("Signup error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Sign up successful!",
        description: "Your account has been created and is pending approval. You will be redirected to the login page.",
      });
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        setLocation("/erp/login");
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle personal information form submission
  const onPersonalInfoSubmit = (data: z.infer<typeof personalInfoSchema>) => {
    setPersonalInfo(data);
    setStep(2);
  };

  // Handle business details form submission
  const onBusinessDetailsSubmit = (data: z.infer<typeof businessDetailsSchema>) => {
    if (!personalInfo) return;
    
    // Combine both forms' data and submit
    const formData: SignupFormValues = {
      personalInfo,
      businessDetails: {
        ...data,
        // Ensure businessTypes has at least "Detailing" for detailer registration
        businessTypes: data.businessTypes?.length ? data.businessTypes : ["Detailing"]
      },
    };
    
    signupMutation.mutate(formData);
  };

  // Handle file uploads
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "profileImage" | "shopFavicon",
    form: any
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast({
        title: "File too large",
        description: "The file must be less than 1MB",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    // Check file type (jpg or png)
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG or PNG file",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    // Set the file in the form
    form.setValue(fieldName, file);
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="container-premium max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-header font-bold mb-4">Sign Up</h1>
          <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
            P91 Pulse is a powerful but simple platform that puts a wide selection of tools at your fingertips. 
            Now, you can manage your shop, customers, and more to boost your shop performance.
          </p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <div className={`rounded-full h-10 w-10 flex items-center justify-center text-white ${step === 1 ? 'bg-primary' : 'bg-primary'}`}>
              {step > 1 ? <Check className="h-5 w-5" /> : '1'}
            </div>
            <div className={`h-1 w-20 ${step > 1 ? 'bg-primary' : 'bg-neutral-300'}`}></div>
            <div className={`rounded-full h-10 w-10 flex items-center justify-center ${step === 2 ? 'bg-primary text-white' : 'bg-neutral-300 text-neutral-600'}`}>
              2
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Main Content */}
          <motion.div 
            className="flex-1"
            initial={{ opacity: 0, x: step === 1 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            key={`step-${step}`}
          >
            <Card className="shadow-md border-0">
              <CardContent className="pt-6">
                {step === 1 ? (
                  // Step 1: Personal Information
                  <div>
                    <h2 className="text-2xl font-header font-semibold mb-6">Personal Information</h2>
                    <Form {...personalInfoForm}>
                      <form onSubmit={personalInfoForm.handleSubmit(onPersonalInfoSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={personalInfoForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Input placeholder="John" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={personalInfoForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Input placeholder="Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={personalInfoForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="john.doe@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={personalInfoForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mobile Number <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input type="tel" placeholder="+91 98765 43210" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={personalInfoForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormDescription>
                                  At least 8 characters with uppercase, lowercase, and a number.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={personalInfoForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm Password <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={personalInfoForm.control}
                          name="position"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Position <span className="text-red-500">*</span></FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select your position" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {positions.map(position => (
                                    <SelectItem key={position.id} value={position.id}>
                                      {position.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={personalInfoForm.control}
                          name="profileImage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Profile Picture (JPG/PNG, Max 1MB)</FormLabel>
                              <FormControl>
                                <div className="flex items-center space-x-4">
                                  <Label 
                                    htmlFor="profile-upload" 
                                    className="flex items-center space-x-2 px-4 py-2 border border-neutral-300 rounded-md cursor-pointer hover:bg-neutral-100 transition-colors"
                                  >
                                    <Upload className="h-4 w-4" />
                                    <span>Choose File</span>
                                  </Label>
                                  <input
                                    id="profile-upload"
                                    type="file"
                                    accept="image/jpeg,image/png"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(e, 'profileImage', personalInfoForm)}
                                  />
                                  <span className="text-sm text-neutral-500">
                                    {field.value instanceof File 
                                      ? field.value.name 
                                      : "No file chosen"}
                                  </span>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="pt-4 flex justify-end">
                          <Button type="submit" className="px-6">
                            Next <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                ) : (
                  // Step 2: Business Details
                  <div>
                    <h2 className="text-2xl font-header font-semibold mb-6">Business Details</h2>
                    <Form {...businessDetailsForm}>
                      <form onSubmit={businessDetailsForm.handleSubmit(onBusinessDetailsSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={businessDetailsForm.control}
                            name="legalName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Business Name (Legal Name) <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Input placeholder="Acme Detailing Co." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={businessDetailsForm.control}
                            name="workspaceName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Workspace Name <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Input placeholder="Acme Pro Detailing" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={businessDetailsForm.control}
                          name="businessTypes"
                          render={() => (
                            <FormItem>
                              <div className="mb-4">
                                <FormLabel>Shop Business Type <span className="text-red-500">*</span></FormLabel>
                                <FormDescription>
                                  Select all that apply
                                </FormDescription>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {businessTypes.map((type) => (
                                  <FormField
                                    key={type.id}
                                    control={businessDetailsForm.control}
                                    name="businessTypes"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={type.id}
                                          className="flex items-start space-x-3 space-y-0"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(type.id)}
                                              onCheckedChange={(checked) => {
                                                const currentValue = field.value || [];
                                                return checked
                                                  ? field.onChange([...currentValue, type.id])
                                                  : field.onChange(
                                                      currentValue.filter(
                                                        (value) => value !== type.id
                                                      )
                                                    );
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="font-normal">
                                            {type.label}
                                          </FormLabel>
                                        </FormItem>
                                      );
                                    }}
                                  />
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Business Address <span className="text-red-500">*</span></h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={businessDetailsForm.control}
                              name="country"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Country <span className="text-red-500">*</span></FormLabel>
                                  <Select 
                                    onValueChange={(value) => handleCountryChange(value)} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select country" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {countries.map(country => (
                                        <SelectItem key={country.id} value={country.id}>
                                          {country.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={businessDetailsForm.control}
                              name="state"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>State / Province <span className="text-red-500">*</span></FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                    disabled={!selectedCountry}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder={selectedCountry ? "Select state" : "Select country first"} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {selectedCountry && states[selectedCountry as keyof typeof states]?.map(state => (
                                        <SelectItem key={state.id} value={state.id}>
                                          {state.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={businessDetailsForm.control}
                              name="city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Bangalore" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={businessDetailsForm.control}
                              name="postalCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Postal Code</FormLabel>
                                  <FormControl>
                                    <Input placeholder="560001" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={businessDetailsForm.control}
                            name="street"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Street</FormLabel>
                                <FormControl>
                                  <Input placeholder="123 Main Street" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={businessDetailsForm.control}
                            name="addressDetails"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address Details</FormLabel>
                                <FormControl>
                                  <Input placeholder="Suite 101, Landmark Building" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={businessDetailsForm.control}
                            name="storeLocation"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Store Location <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Input placeholder="P91 India Flagship Store" {...field} />
                                </FormControl>
                                <FormDescription>
                                  The name of your store location as it will appear to customers
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={businessDetailsForm.control}
                            name="businessEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Business Email <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Input placeholder="info@acmedetailing.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={businessDetailsForm.control}
                            name="businessPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Business Phone Number <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Input placeholder="+91 98765 43210" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={businessDetailsForm.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website</FormLabel>
                              <FormControl>
                                <Input placeholder="https://www.acmedetailing.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={businessDetailsForm.control}
                          name="shopFavicon"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Shop Favicon (JPG/PNG, Max 1MB)</FormLabel>
                              <FormControl>
                                <div className="flex items-center space-x-4">
                                  <Label 
                                    htmlFor="favicon-upload" 
                                    className="flex items-center space-x-2 px-4 py-2 border border-neutral-300 rounded-md cursor-pointer hover:bg-neutral-100 transition-colors"
                                  >
                                    <Upload className="h-4 w-4" />
                                    <span>Choose File</span>
                                  </Label>
                                  <input
                                    id="favicon-upload"
                                    type="file"
                                    accept="image/jpeg,image/png"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(e, 'shopFavicon', businessDetailsForm)}
                                  />
                                  <span className="text-sm text-neutral-500">
                                    {field.value instanceof File 
                                      ? field.value.name 
                                      : "No file chosen"}
                                  </span>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={businessDetailsForm.control}
                          name="productsAndServices"
                          render={() => (
                            <FormItem>
                              <div className="mb-4">
                                <FormLabel>P91 Products and Services</FormLabel>
                                <FormDescription>
                                  Select all products and services you offer or plan to offer
                                </FormDescription>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {p91Products.map((product) => (
                                  <FormField
                                    key={product.id}
                                    control={businessDetailsForm.control}
                                    name="productsAndServices"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={product.id}
                                          className="flex items-start space-x-3 space-y-0"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(product.id)}
                                              onCheckedChange={(checked) => {
                                                const currentValue = field.value || [];
                                                return checked
                                                  ? field.onChange([...currentValue, product.id])
                                                  : field.onChange(
                                                      currentValue.filter(
                                                        (value) => value !== product.id
                                                      )
                                                    );
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="font-normal">
                                            {product.label}
                                          </FormLabel>
                                        </FormItem>
                                      );
                                    }}
                                  />
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={businessDetailsForm.control}
                          name="termsAccepted"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  I have read and agree on <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> and <Link href="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link>
                                </FormLabel>
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />

                        {/* Submit buttons */}
                        <div className="pt-4 flex justify-between">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setStep(1)}
                            className="px-6"
                          >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                          </Button>
                          
                          <Button 
                            type="submit" 
                            className="px-6"
                            disabled={signupMutation.isPending}
                          >
                            {signupMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing
                              </>
                            ) : (
                              <>
                                Register <ChevronRight className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Side Info Column */}
          <div className="w-full md:w-80 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="bg-primary text-white shadow-md border-0">
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-4">P91 Pulse Features</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
                      <span>eWarranty Dashboard for tracking product installations</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
                      <span>Product Library for quick access to P91 product information</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
                      <span>Customer Management and Vehicle Database</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
                      <span>Claims Processing and Warranty Support</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
                      <span>Training Resources and Knowledge Hub</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Alert className="bg-blue-50 text-blue-700 border-blue-200">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>
                  All new accounts require approval by P91 India administrators. This typically takes 1-2 business days.
                </AlertDescription>
              </Alert>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center"
            >
              <p className="text-neutral-600 mb-3">Already have an account?</p>
              <Link href="/erp/login">
                <Button variant="outline" className="w-full">
                  Login to P91 Pulse
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}