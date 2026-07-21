import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, UserPlus, Building2, MapPin } from "lucide-react";
import GooglePlacesAutocomplete, { PlaceDetails } from "@/components/google-places-autocomplete";

// Business types options (same as P91 Pulse signup)
const BUSINESS_TYPES = [
  "PPF",
  "Vinyl Wrap", 
  "Window Film (Tint)",
  "Windshield",
  "Detailer",
  "Other"
];

// India states + UTs (territory = state in P91) for the required State dropdown.
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

// Enhanced create user schema with P91 Pulse business details.
// Factory so password can be required on create but optional on edit (the edit form doesn't
// render a password field and strips a blank one before submit).
const makeCreateUserSchema = (editMode: boolean) => z.object({
  username: z.string().optional(), // removed from the form — auto-generated from email/phone on submit
  // Required (min 6) when creating; optional when editing (blank = keep current password). (H3)
  password: editMode ? z.string().optional() : z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")), // optional (business rule H2)
  phone: z.string().min(10, "Valid phone number is required"), // required for every user (H1)
  customerId: z.string().optional(),
  permissions: z.any().optional(),
  // Includes the sales-hierarchy roles so admins/NSMs can create a Territory Manager (RSM) etc.
  // (getAllowedRoles already offers them; the enum previously rejected them at validation.)
  // The roles the Go backend actually has (roles table). "asm" was missing,
  // which silently blocked ASM creation even though the dropdown offered it.
  role: z.enum(["admin", "national_sales_manager", "regional_sales_manager", "asm",
    "salesperson", "distributor", "detailer", "installer", "sales_partner"]),
  organizationId: z.string().optional(),
  distributorId: z.string().optional(),
  
  // P91 Pulse specific fields for detailers
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  position: z.string().optional(),
  businessName: z.string().optional(),
  workspaceName: z.string().optional(),
  businessTypes: z.array(z.string()).optional(),
  businessAddress: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().min(1, "State is required"), // required for every user (dropdown)
  country: z.string().optional(),
  postalCode: z.string().optional().or(z.literal("")), // pincode optional for installer; required for others (refine below)
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  placeId: z.string().optional(),
  placeName: z.string().optional(),
  
  // Distributor-specific fields
  businessType: z.string().optional(),
  territory: z.string().optional(),
  // Detailer-specific: number of installers on their team (optional)
  teamSize: z.string().optional(),
}).refine((data) => {
  // Business name required for detailer + distributor (they run a shop/territory). An installer is
  // an individual — no business name required.
  if (data.role === "detailer" || data.role === "distributor") {
    return !!data.businessName;
  }
  return true;
}, {
  message: "Business name is required for this role",
  path: ["businessName"],
}).refine((data) => {
  // Password validation: if provided, must be at least 6 characters
  if (data.password && data.password.length > 0) {
    return data.password.length >= 6;
  }
  return true;
}, {
  message: "Password must be at least 6 characters",
  path: ["password"],
}).refine((data) => {
  // Pincode optional for an installer (may cover a whole state); required (6-digit) for everyone
  // else. If an installer supplies one, it must still be a valid 6-digit pincode.
  if (data.role === "installer") {
    return !data.postalCode || /^\d{6}$/.test(data.postalCode);
  }
  return /^\d{6}$/.test(data.postalCode || "");
}, {
  message: "Enter a valid 6-digit pincode",
  path: ["postalCode"],
});

type CreateUserFormData = z.infer<ReturnType<typeof makeCreateUserSchema>>;

interface CreateUserFormProps {
  onSuccess: () => void;
  currentUserRole: string;
  editMode?: boolean;
  existingUser?: any;
}

export function CreateUserForm({ onSuccess, currentUserRole, editMode = false, existingUser }: CreateUserFormProps) {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string>("detailer");
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);

  // Get available distributors for detailer assignment
  const distributorsQuery = useQuery({
    queryKey: ['/api/erp/users', 'distributors'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/erp/users');
      const users = await response.json();
      return users.filter((user: any) => user.role === 'distributor' && user.status === 'approved');
    },
    enabled: (selectedRole === 'detailer' || selectedRole === 'installer') && currentUserRole === 'admin',
  });

  // Define allowed roles based on current user role (mirrors the backend allowedRoles map in
  // user-management-routes.ts). Admin can create every role incl. the sales team; NSM creates RSM +
  // salesperson; distributor/detailer create end users.
  const getAllowedRoles = () => {
    switch (currentUserRole) {
      case 'admin':
        return [
          { value: 'admin', label: 'Admin' },
          { value: 'national_sales_manager', label: 'National Sales Manager (NSM)' },
          { value: 'regional_sales_manager', label: 'Regional Sales Manager (RSM)' },
          { value: 'asm', label: 'Area Sales Manager (ASM)' },
          { value: 'salesperson', label: 'Salesperson' },
          { value: 'distributor', label: 'Distributor' },
          { value: 'detailer', label: 'Detailer' },
          { value: 'installer', label: 'Installer' },
          { value: 'sales_partner', label: 'Sales Partner' },
        ];
      case 'national_sales_manager':
        return [
          { value: 'regional_sales_manager', label: 'Regional Sales Manager (RSM)' },
          { value: 'asm', label: 'Area Sales Manager (ASM)' },
          { value: 'distributor', label: 'Distributor' },
          { value: 'sales_partner', label: 'Sales Partner' },
          { value: 'salesperson', label: 'Salesperson' },
        ];
      case 'regional_sales_manager':
        return [
          { value: 'distributor', label: 'Distributor' },
          { value: 'sales_partner', label: 'Sales Partner' },
          { value: 'salesperson', label: 'Salesperson' },
        ];
      case 'distributor':
        return [
          { value: 'detailer', label: 'Detailer' },
          { value: 'installer', label: 'Installer' },
          { value: 'sales_partner', label: 'Sales Partner' },
        ];
      case 'detailer':
        return [
          { value: 'installer', label: 'Installer' },
        ];
      default:
        return [];
    }
  };

  // Password is required on create, optional on edit — build the schema per mode. (H3)
  const createUserSchema = useMemo(() => makeCreateUserSchema(editMode), [editMode]);

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: editMode && existingUser ? (() => {
      // Parse metadata if it's a string
      const metadata = typeof existingUser.metadata === 'string' 
        ? JSON.parse(existingUser.metadata) 
        : (existingUser.metadata || {});
      
      return {
        username: existingUser.username || "",
        password: "", // Always empty for security
        name: existingUser.name || "",
        email: existingUser.email || "",
        phone: existingUser.phone || "",
        customerId: existingUser.customerId || "",
        role: existingUser.role || "detailer",
        organizationId: existingUser.organizationId || "",
        distributorId: existingUser.distributorId?.toString() || "",
        // P91 Pulse specific fields from metadata
        firstName: metadata.firstName || "",
        lastName: metadata.lastName || "",
        position: metadata.position || "",
        businessName: metadata.businessName || "",
        workspaceName: metadata.workspaceName || "",
        businessTypes: metadata.businessTypes || [],
        businessAddress: metadata.businessAddress || "",
        street: metadata.street || "",
        city: metadata.city || "",
        state: metadata.state || "",
        country: metadata.country || "",
        postalCode: metadata.postalCode || "",
        latitude: metadata.latitude?.toString() || "",
        longitude: metadata.longitude?.toString() || "",
        placeId: metadata.placeId || "",
        placeName: metadata.placeName || "",
        // Distributor fields from metadata
        businessType: metadata.businessType || "",
        territory: metadata.territory || "",
        // Detailer team size (installer count) from metadata
        teamSize: metadata.teamSize != null ? String(metadata.teamSize) : "",
        permissions: metadata.permissions || {},
      };
    })() : {
      username: "",
      password: "",
      name: "",
      email: "",
      phone: "",
      customerId: "",
      role: "detailer",
      organizationId: "",
      distributorId: "",
      // P91 Pulse fields
      firstName: "",
      lastName: "",
      position: "",
      businessName: "",
      workspaceName: "",
      businessTypes: [],
      businessAddress: "",
      street: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      latitude: "",
      longitude: "",
      placeId: "",
      placeName: "",
      // Distributor fields
      businessType: "",
      territory: "",
      // Detailer team size
      teamSize: "",
      permissions: {},
    },
  });

  // Watch role changes to update selectedRole
  const watchedRole = form.watch("role");
  if (watchedRole !== selectedRole) {
    setSelectedRole(watchedRole);
  }
  
  // Set initial selectedRole from existing user in edit mode
  if (editMode && existingUser && selectedRole === "detailer" && existingUser.role && existingUser.role !== "detailer") {
    setSelectedRole(existingUser.role);
  }

  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserFormData) => {
      if (editMode && existingUser) {
        // Remove empty password from update payload
        const updateData = { ...userData };
        if (!updateData.password || updateData.password.trim() === '') {
          delete updateData.password;
        }
        const response = await apiRequest("PUT", `/api/erp/users/${existingUser.id}`, updateData);
        return await response.json();
      } else {
        const response = await apiRequest("POST", "/api/erp/users/create", userData);
        return await response.json();
      }
    },
    onSuccess: (updatedUser) => {
      toast({
        title: editMode ? "User Updated Successfully" : "User Created Successfully",
        description: editMode 
          ? `${updatedUser.name} has been updated.`
          : `${updatedUser.name} has been added to your organization.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/erp/users"] });
      
      if (!editMode) form.reset();
      onSuccess();
    },
    onError: (error: any) => {
      const errorMessage = error.message || (editMode ? "Failed to update user" : "Failed to create user");
      toast({
        title: editMode ? "User Update Failed" : "User Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateUserFormData) => {
    // Username field was removed from the form — derive it from email, else phone (H2: email is
    // optional, phone is mandatory), so login + the unique-username rule still hold.
    const username = (data.username && data.username.trim()) || data.email || data.phone;
    createUserMutation.mutate({ ...data, username });
  };

  // Handler for Google Places Autocomplete
  const handlePlaceChange = (place: PlaceDetails | null) => {
    setPlaceDetails(place);
    if (place) {
      // Auto-fill all location fields from the selected place
      form.setValue('businessAddress', place.formattedAddress);
      form.setValue('street', place.street);
      form.setValue('city', place.city);
      form.setValue('state', place.state);
      form.setValue('country', place.country);
      form.setValue('postalCode', place.postalCode);
      form.setValue('latitude', place.latitude.toString());
      form.setValue('longitude', place.longitude.toString());
      form.setValue('placeId', place.placeId);
      form.setValue('placeName', place.name);
    } else {
      // Clear all location fields
      form.setValue('businessAddress', '');
      form.setValue('street', '');
      form.setValue('city', '');
      form.setValue('state', '');
      form.setValue('country', '');
      form.setValue('postalCode', '');
      form.setValue('latitude', '');
      form.setValue('longitude', '');
      form.setValue('placeId', '');
      form.setValue('placeName', '');
    }
  };

  const allowedRoles = getAllowedRoles();

  if (allowedRoles.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} data-testid="input-name" />
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
                    <Input placeholder="10-digit mobile number" {...field} data-testid="input-phone" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address (optional)</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@example.com" {...field} data-testid="input-email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pincode</FormLabel>
                  <FormControl>
                    <Input placeholder="6-digit pincode" inputMode="numeric" maxLength={6} {...field} data-testid="input-pincode" />
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-state">
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
          </div>

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User Role</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {allowedRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {!editMode && (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Minimum 6 characters — share with the user" {...field} data-testid="input-password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Detailer-specific shop block. Installer is an individual (no shop) — they only need the
              base fields (name, phone, state, optional pincode/email), so this block is detailer-only. */}
          {selectedRole === "detailer" && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Building2 className="h-4 w-4" />
                P91 Pulse Application Details
              </div>
              
              {/* Personal Information */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} data-testid="input-firstname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} data-testid="input-lastname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position/Role</FormLabel>
                    <FormControl>
                      <Input placeholder="Owner, Manager, etc." {...field} data-testid="input-position" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Business Information */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Legal Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Premium Auto Care Pvt Ltd" {...field} data-testid="input-businessname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workspaceName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workspace Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Premium Auto Hub" {...field} data-testid="input-workspacename" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Team Size — a detailer runs a team of installers (optional) */}
              <FormField
                control={form.control}
                name="teamSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Size <span className="text-xs text-muted-foreground">(number of installers — optional)</span></FormLabel>
                    <FormControl>
                      <Input type="number" min={0} inputMode="numeric" placeholder="e.g. 5" {...field} data-testid="input-teamsize" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Business Types */}
              <FormField
                control={form.control}
                name="businessTypes"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Business Types</FormLabel>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {BUSINESS_TYPES.map((type) => (
                        <FormField
                          key={type}
                          control={form.control}
                          name="businessTypes"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={type}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(type)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), type])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== type
                                            )
                                          )
                                    }}
                                    data-testid={`checkbox-businesstype-${type.toLowerCase().replace(/\s+/g, '-')}`}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {type}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location Information */}
              <div className="pt-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                  <MapPin className="h-4 w-4" />
                  Shop Location
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <GooglePlacesAutocomplete
                    value={placeDetails}
                    onChange={handlePlaceChange}
                    label=""
                    placeholder="Search for shop on Google Maps..."
                    required={selectedRole === 'detailer'}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 All location fields (address, city, state, coordinates) will be filled automatically
                  </p>
                </div>
              </div>

              {/* Distributor assignment for admin users */}
              {currentUserRole === 'admin' && distributorsQuery.data && distributorsQuery.data.length > 0 && (
                <FormField
                  control={form.control}
                  name="distributorId"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Assign to Distributor</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-distributor">
                            <SelectValue placeholder="Select distributor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">No Distributor (Direct to Admin)</SelectItem>
                          {distributorsQuery.data.map((distributor: any) => (
                            <SelectItem key={distributor.id} value={distributor.id.toString()}>
                              {distributor.name} - {distributor.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          )}

          {/* Distributor-specific fields */}
          {selectedRole === "distributor" && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <MapPin className="h-4 w-4" />
                Business Information
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Premium Auto Care Pvt Ltd" {...field} data-testid="input-distributor-businessname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Business Type dropdown commented out — these options (Automotive Distributor /
                    Detailing Franchise / Regional Partner / Wholesale Dealer) map to nothing in ERP.
                    A distributor is simply Customer.customer_group = CAD. Re-enable only with ERP-backed values.
                <FormField
                  control={form.control}
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-businesstype">
                            <SelectValue placeholder="Select business type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="automotive_distributor">Automotive Distributor</SelectItem>
                          <SelectItem value="detailing_franchise">Detailing Franchise</SelectItem>
                          <SelectItem value="regional_partner">Regional Partner</SelectItem>
                          <SelectItem value="wholesale_dealer">Wholesale Dealer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                */}
              </div>

              {/* Territory/Region dropdown commented out — it duplicates the required base
                  "State / Territory" field above (two state pickers could disagree). A distributor's
                  territory IS that base state. Re-enable only if a distinct sub-territory is needed.
              <FormField
                control={form.control}
                name="territory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Territory/Region <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-territory">
                          <SelectValue placeholder="Select state/territory" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[200px] overflow-y-auto">
                        <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                        <SelectItem value="Arunachal Pradesh">Arunachal Pradesh</SelectItem>
                        <SelectItem value="Assam">Assam</SelectItem>
                        <SelectItem value="Bihar">Bihar</SelectItem>
                        <SelectItem value="Chhattisgarh">Chhattisgarh</SelectItem>
                        <SelectItem value="Goa">Goa</SelectItem>
                        <SelectItem value="Gujarat">Gujarat</SelectItem>
                        <SelectItem value="Haryana">Haryana</SelectItem>
                        <SelectItem value="Himachal Pradesh">Himachal Pradesh</SelectItem>
                        <SelectItem value="Jharkhand">Jharkhand</SelectItem>
                        <SelectItem value="Karnataka">Karnataka</SelectItem>
                        <SelectItem value="Kerala">Kerala</SelectItem>
                        <SelectItem value="Madhya Pradesh">Madhya Pradesh</SelectItem>
                        <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                        <SelectItem value="Manipur">Manipur</SelectItem>
                        <SelectItem value="Meghalaya">Meghalaya</SelectItem>
                        <SelectItem value="Mizoram">Mizoram</SelectItem>
                        <SelectItem value="Nagaland">Nagaland</SelectItem>
                        <SelectItem value="Odisha">Odisha</SelectItem>
                        <SelectItem value="Punjab">Punjab</SelectItem>
                        <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                        <SelectItem value="Sikkim">Sikkim</SelectItem>
                        <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                        <SelectItem value="Telangana">Telangana</SelectItem>
                        <SelectItem value="Tripura">Tripura</SelectItem>
                        <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                        <SelectItem value="Uttarakhand">Uttarakhand</SelectItem>
                        <SelectItem value="West Bengal">West Bengal</SelectItem>
                        <SelectItem value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</SelectItem>
                        <SelectItem value="Chandigarh">Chandigarh</SelectItem>
                        <SelectItem value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</SelectItem>
                        <SelectItem value="Delhi">Delhi</SelectItem>
                        <SelectItem value="Jammu and Kashmir">Jammu and Kashmir</SelectItem>
                        <SelectItem value="Ladakh">Ladakh</SelectItem>
                        <SelectItem value="Lakshadweep">Lakshadweep</SelectItem>
                        <SelectItem value="Puducherry">Puducherry</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              */}

              <FormField
                control={form.control}
                name="businessAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Complete business address with office/warehouse details" {...field} data-testid="textarea-distributor-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* User Permissions (RBAC) */}
            <div className="border rounded-lg p-4 mt-6 bg-slate-50/50">
              <h3 className="font-semibold text-base mb-1">User Permissions</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Assign modules and specific actions that this user is authorized to perform.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    module: "Leads",
                    key: "leads",
                    options: [
                      { label: "View Leads", value: "view" },
                      { label: "Create Leads", value: "create" },
                      { label: "Edit Leads", value: "edit" },
                      { label: "Assign Leads", value: "assign" },
                      { label: "Delete Leads", value: "delete" }
                    ]
                  },
                  {
                    module: "Inventory",
                    key: "inventory",
                    options: [
                      { label: "View Stock", value: "view" },
                      { label: "Request Stock", value: "request" },
                      { label: "Approve Transfers", value: "approve" },
                      { label: "Direct Transfer", value: "transfer" }
                    ]
                  },
                  {
                    module: "Warranty",
                    key: "warranty",
                    options: [
                      { label: "View Registrations", value: "view" },
                      { label: "Approve Warranty", value: "approve" },
                      { label: "Create Claims", value: "create_claims" }
                    ]
                  },
                  {
                    module: "Rewards",
                    key: "rewards",
                    options: [
                      { label: "View Rewards Ledger", value: "view" },
                      { label: "Redeem Points", value: "redeem" },
                      { label: "Approve Redemptions", value: "approve" }
                    ]
                  },
                  {
                    module: "Users",
                    key: "users",
                    options: [
                      { label: "Create Sub-users", value: "create" },
                      { label: "Edit Sub-users", value: "edit" },
                      { label: "Disable Accounts", value: "disable" },
                      { label: "Manage Sub-hierarchy", value: "manage_sub" }
                    ]
                  }
                ].map((mod) => (
                  <div key={mod.key} className="space-y-3 bg-white p-3 rounded-md border shadow-sm">
                    <h4 className="font-medium text-xs text-slate-800 border-b pb-1.5 uppercase tracking-wide">{mod.module}</h4>
                    <div className="space-y-2">
                      {mod.options.map((opt) => {
                        const formValue = form.watch(`permissions.${mod.key}`) || [];
                        const isChecked = formValue.includes(opt.value);
                        
                        return (
                          <div key={opt.value} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`perm-${mod.key}-${opt.value}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                const currentVals = [...formValue];
                                if (checked) {
                                  if (!currentVals.includes(opt.value)) {
                                    currentVals.push(opt.value);
                                  }
                                } else {
                                  const idx = currentVals.indexOf(opt.value);
                                  if (idx > -1) {
                                    currentVals.splice(idx, 1);
                                  }
                                }
                                form.setValue(`permissions.${mod.key}`, currentVals);
                              }}
                            />
                            <label 
                              htmlFor={`perm-${mod.key}-${opt.value}`}
                              className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-slate-700"
                            >
                              {opt.label}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={createUserMutation.isPending}
              className="w-full"
              data-testid="button-submit"
            >
              {createUserMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editMode ? "Update User" : "Create User"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
