import { useState } from "react";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import bannerImage from "../../assets/bay-area.jpg";

// India states + UTs (territory = state in P91). Used for the installer's territory selection.
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

const installerFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(10, { message: "Please enter a valid phone number" }),
  businessName: z.string().min(2, { message: "Business name is required" }),
  city: z.string().min(2, { message: "City is required" }),
  pincode: z.string().regex(/^\d{6}$/, { message: "Enter a valid 6-digit pincode" }),
  state: z.string().min(1, { message: "Please select a state" }),
  businessType: z.string().min(1, { message: "Please select a business type" }),
  message: z.string().min(10, { message: "Please provide more information about your business" }),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms to continue",
  }),
});

type InstallerFormValues = z.infer<typeof installerFormSchema>;

export function BecomeInstaller() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<InstallerFormValues>({
    resolver: zodResolver(installerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      businessName: "",
      city: "",
      pincode: "",
      state: "",
      businessType: "",
      message: "",
      termsAccepted: false,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: InstallerFormValues) => {
      return apiRequest("POST", "/api/installer-application", {
        ...data,
        source: 'ppf_partner_form'
      });
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Thank you for your interest! We'll be in touch soon.",
      });
      setSubmitted(true);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was a problem submitting your application. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: InstallerFormValues) {
    mutation.mutate(data);
  }

  return (
    <section id="become-installer" className="py-20 bg-black relative overflow-hidden">
      <div 
        className="absolute inset-0 opacity-40" 
        style={{
          backgroundImage: `url(${bannerImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/70"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-header font-bold text-3xl md:text-4xl text-white mb-4 scroll-trigger">Apply to Become an Authorized P91 Center</h2>
            <p className="text-neutral-300 text-lg max-w-3xl mx-auto scroll-trigger">
              Partner with P91 India to elevate your detailing studio with our premium protection solutions
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-8 shadow-lg">
            {submitted ? (
              <div className="text-center py-8">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-16 w-16 text-primary mx-auto mb-4" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <h3 className="text-2xl font-header font-bold mb-2">Application Submitted!</h3>
                <p className="text-neutral-500 mb-6">Thank you for your interest in becoming an Authorized P91 Center. Our team will review your application and contact you soon.</p>
                <Button 
                  onClick={() => setSubmitted(false)}
                  className="bg-secondary text-primary"
                >
                  Submit Another Application
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 scroll-trigger">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="your@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+91 98765 43210" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your business name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Your city" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pincode</FormLabel>
                          <FormControl>
                            <Input placeholder="6-digit pincode" inputMode="numeric" maxLength={6} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State / Territory</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-64">
                              {INDIAN_STATES.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="businessType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select business type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="detail_shop">Detailing Shop</SelectItem>
                              <SelectItem value="body_shop">Body Shop</SelectItem>
                              <SelectItem value="car_dealership">Car Dealership</SelectItem>
                              <SelectItem value="home_service">Home Service Provider</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Why would you like to become an Authorized P91 Center?</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about your detailing business and why you're interested in becoming an Authorized P91 Center..." 
                            className="min-h-[120px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="termsAccepted"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I agree to receive information about P91 products, services, and partnership opportunities.
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <div className="text-center">
                    <Button 
                      type="submit" 
                      className="px-8 py-6 bg-secondary text-primary transition rounded-md font-medium"
                      disabled={mutation.isPending}
                    >
                      {mutation.isPending ? "Submitting..." : "Submit Application"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
