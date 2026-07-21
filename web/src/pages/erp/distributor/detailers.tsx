import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { User, Building2, CheckCircle, XCircle, Clock, UserCheck, UserPlus, Loader2, Link } from 'lucide-react';
import { useLocation } from 'wouter';
import { InfoDot } from '@/components/dev/InfoDot';

// Form schema for adding a new detailer
const addDetailerFormSchema = z.object({
  name: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  studioName: z.string().min(2, { message: "Studio name must be at least 2 characters." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  city: z.string().min(2, { message: "City is required." }),
  pincode: z.string().optional(),
  address: z.string().optional(),
});

type AddDetailerFormValues = z.infer<typeof addDetailerFormSchema>;

// Add Detailer Form Component
interface AddDetailerFormProps {
  onSubmit: (data: AddDetailerFormValues) => void;
  loading: boolean;
}

// DetailerDetails component to display detailer information in a dialog
interface DetailerDetailsProps {
  detailer: any;
  open: boolean;
  onClose: () => void;
}

function DetailerDetails({ detailer, open, onClose }: DetailerDetailsProps) {
  if (!detailer) return null;
  
  // Extract metadata if available - using P91 Pulse standardized format
  const metadata = detailer.metadata || {};
  const studioName = metadata.businessName || metadata.workspaceName || metadata.studioName || 'Not specified';
  const joinedDate = new Date(detailer.createdAt).toLocaleDateString();
  const warrantiesIssued = detailer.warrantiesIssued || 0;
  const customerCount = detailer.customerCount || 0;
  
  // State for the send credentials dialog
  const [isSendCredentialsOpen, setIsSendCredentialsOpen] = useState(false);
  const [isGeneratingPassword, setIsGeneratingPassword] = useState(true);
  const [manualPassword, setManualPassword] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{success: boolean, message: string} | null>(null);
  const { toast } = useToast();
  
  // Send login credentials
  const handleSendCredentials = async () => {
    setIsSending(true);
    setSendResult(null);
    
    try {
      const password = isGeneratingPassword ? undefined : manualPassword;
      
      const response = await fetch(`/api/users/${detailer.id}/send-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generateNewPassword: isGeneratingPassword,
          password: password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send login credentials');
      }
      
      setSendResult({
        success: true,
        message: data.message || 'Login credentials sent successfully'
      });
      
      toast({
        title: "Success",
        description: data.message || 'Login credentials sent successfully',
        variant: "default",
      });
      
      // Close the send credentials dialog after a successful send
      setTimeout(() => {
        setIsSendCredentialsOpen(false);
        setSendResult(null);
      }, 2000);
      
    } catch (error) {
      setSendResult({
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      });
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to send login credentials',
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detailer Profile</DialogTitle>
            <DialogDescription>
              Detailed information about {detailer.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Name:</Label>
              <div className="col-span-3 text-foreground">{detailer.name}</div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Studio:</Label>
              <div className="col-span-3 text-foreground">{studioName}</div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Email:</Label>
              <div className="col-span-3 text-foreground">{detailer.email}</div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Phone:</Label>
              <div className="col-span-3 text-foreground">{detailer.phone}</div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Location:</Label>
              <div className="col-span-3 text-foreground">
                {detailer.address || metadata.address || (metadata.city ? `${metadata.city}${metadata.pincode ? `, ${metadata.pincode}` : ''}` : 'Not provided')}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Date Joined:</Label>
              <div className="col-span-3 text-foreground">{joinedDate}</div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Warranties:</Label>
              <div className="col-span-3 text-foreground">{warrantiesIssued}</div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-medium">Customers:</Label>
              <div className="col-span-3 text-foreground">{customerCount}</div>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              Close
            </Button>
            
            <Button
              variant="default"
              onClick={() => setIsSendCredentialsOpen(true)}
            >
              Send Login Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Send Credentials Dialog */}
      <Dialog open={isSendCredentialsOpen} onOpenChange={setIsSendCredentialsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Login Credentials</DialogTitle>
            <DialogDescription>
              Send login details to {detailer.name} via email.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <Label>Email will be sent to:</Label>
              <div className="px-3 py-2 bg-muted rounded-md">{detailer.email}</div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label>Password Options:</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="generate-password"
                  checked={isGeneratingPassword}
                  onCheckedChange={setIsGeneratingPassword}
                />
                <Label htmlFor="generate-password">Generate new password automatically</Label>
              </div>
            </div>
            
            {!isGeneratingPassword && (
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="manual-password">Manual Password:</Label>
                <Input
                  id="manual-password"
                  type="text"
                  value={manualPassword}
                  onChange={(e) => setManualPassword(e.target.value)}
                  placeholder="Enter password to send"
                />
              </div>
            )}
            
            {sendResult && (
              <div className={`p-3 rounded-md ${sendResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {sendResult.message}
              </div>
            )}
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setIsSendCredentialsOpen(false);
                setSendResult(null);
              }}
              disabled={isSending}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleSendCredentials}
              disabled={!isGeneratingPassword && !manualPassword || isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Login Details'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AddDetailerForm({ onSubmit, loading }: AddDetailerFormProps) {
  const form = useForm<AddDetailerFormValues>({
    resolver: zodResolver(addDetailerFormSchema),
    defaultValues: {
      name: "",
      studioName: "",
      phone: "",
      email: "",
      city: "",
      pincode: "",
      address: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name*</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="studioName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Studio Name*</FormLabel>
              <FormControl>
                <Input placeholder="P91 Studio" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number*</FormLabel>
                <FormControl>
                  <Input placeholder="9876543210" {...field} />
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
                <FormLabel>Email*</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="detailer@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City*</FormLabel>
              <FormControl>
                <Input placeholder="Mumbai" {...field} />
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
                <Input placeholder="400001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter complete address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" type="button" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Adding...
              </div>
            ) : (
              "Add Detailer"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function DistributorDetailersPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [detailers, setDetailers] = useState<any[]>([]);
  const [pendingDetailers, setPendingDetailers] = useState<any[]>([]);
  const [isAddDetailerDialogOpen, setIsAddDetailerDialogOpen] = useState(false);
  const [isAddingDetailer, setIsAddingDetailer] = useState(false);
  const [selectedDetailer, setSelectedDetailer] = useState<any>(null);
  const [isDetailerDetailsOpen, setIsDetailerDetailsOpen] = useState(false);
  
  // Function to fetch detailers
  const fetchDetailers = async () => {
    try {
      // Get detailers (active) for this distributor
      const activeDetailersResponse = await apiRequest('GET', '/api/erp/distributor/detailers/active');
      const activeDetailersData = await activeDetailersResponse.json();
      
      // Use real data if available, otherwise keep using the existing data
      if (activeDetailersData && Array.isArray(activeDetailersData)) {
        setDetailers(activeDetailersData);
      }
      
      // Get pending detailer applications for this distributor
      const pendingDetailersResponse = await apiRequest('GET', '/api/erp/distributor/detailers/pending');
      const pendingDetailersData = await pendingDetailersResponse.json();
      
      // Use real data if available, otherwise keep using the existing data
      if (pendingDetailersData && Array.isArray(pendingDetailersData)) {
        setPendingDetailers(pendingDetailersData);
      }
    } catch (error) {
      console.error('Error fetching detailers:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to refresh detailer data.',
      });
    }
  };
  
  // Function to handle adding a new detailer
  const handleAddDetailer = async (data: AddDetailerFormValues) => {
    try {
      setIsAddingDetailer(true);
      
      // Check if the phone number is already registered using the new endpoint
      const checkPhoneResponse = await fetch(`/api/check-phone?phone=${encodeURIComponent(data.phone)}`);
      if (checkPhoneResponse.ok) {
        const phoneCheckResult = await checkPhoneResponse.json();
        if (phoneCheckResult.exists) {
          toast({
            title: "Phone already registered",
            description: "This phone number is already registered in the system.",
            variant: "destructive",
          });
          setIsAddingDetailer(false);
          return;
        }
      }
      
      // Create a new detailer user
      const detailerData = {
        name: data.name,
        username: data.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000),
        email: data.email,
        phone: data.phone,
        password: `P91${Math.random().toString(36).substring(2, 10)}`, // Generate a temporary password that will be replaced by the server
        role: "detailer",
        status: "approved", // Automatically approve detailers added by distributors
        metadata: {
          studioName: data.studioName,
          city: data.city,
          pincode: data.pincode || null,
          address: data.address || null,
          addedBy: user?.id,
          addedOn: new Date().toISOString(),
        },
        distributorId: user?.id, // Associate with the current distributor
      };
      
      // Make API call to create the detailer
      const response = await fetch('/api/erp/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(detailerData),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        // Check specific validation errors
        if (responseData.errors) {
          // Handle email duplication error
          if (responseData.errors.email) {
            toast({
              title: "Email already registered",
              description: responseData.errors.email[0] || "This email is already registered in the system.",
              variant: "destructive",
            });
            setIsAddingDetailer(false);
            return;
          }
          
          // Handle password validation error
          if (responseData.errors.password) {
            toast({
              title: "Password validation failed",
              description: responseData.errors.password[0] || "Password does not meet requirements.",
              variant: "destructive",
            });
            setIsAddingDetailer(false);
            return;
          }
          
          // Handle any other validation errors
          const errorMessage = Object.values(responseData.errors)
            .flat()
            .join(', ');
          
          toast({
            title: "Validation error",
            description: errorMessage || "Please check all fields and try again.",
            variant: "destructive",
          });
          setIsAddingDetailer(false);
          return;
        }
        
        throw new Error(responseData.message || 'Failed to create detailer');
      }
      
      // Add to local state for immediate UI update
      setDetailers([...detailers, responseData]);
      
      // Close the dialog
      setIsAddDetailerDialogOpen(false);
      setIsAddingDetailer(false);
      
      // Show success message with login email sent confirmation
      toast({
        title: "Detailer added successfully",
        description: `${data.name} has been added as a detailer. Login credentials have been sent to their email.`,
      });
      
      // Refresh the detailer list
      fetchDetailers();
      
    } catch (error) {
      console.error('Error adding detailer:', error);
      toast({
        title: "Failed to add detailer",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAddingDetailer(false);
    }
  };

  useEffect(() => {
    const fetchUserAndDetailers = async () => {
      try {
        // Get current user
        const userResponse = await apiRequest('GET', '/api/erp/me');
        const userData = await userResponse.json();
        setUser(userData);

        // Get detailers (active) - using correct distributor-specific endpoint
        const activeDetailersResponse = await apiRequest('GET', '/api/erp/distributor/detailers/active');
        const activeDetailersData = await activeDetailersResponse.json();
        
        // Use real data from API
        if (Array.isArray(activeDetailersData)) {
          setDetailers(activeDetailersData);
        } else {
          setDetailers([]);
        }

        // Get pending detailer applications - Check if endpoint exists
        try {
          const pendingDetailersResponse = await apiRequest('GET', '/api/erp/distributor/detailers/pending');
          const pendingDetailersData = await pendingDetailersResponse.json();
          
          if (Array.isArray(pendingDetailersData)) {
            setPendingDetailers(pendingDetailersData);
          } else {
            setPendingDetailers([]);
          }
        } catch (error) {
          // If endpoint doesn't exist, just set empty array
          console.log('Pending detailers endpoint not available:', error);
          setPendingDetailers([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load detailer data. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndDetailers();
  }, [toast]);

  const handleApproveReject = async (detailerId: number, action: 'approve' | 'reject') => {
    try {
      setLoading(true);
      
      const endpoint = action === 'approve'
        ? `/api/erp/distributor/detailers/${detailerId}/approve`
        : `/api/erp/distributor/detailers/${detailerId}/reject`;
      
      const response = await apiRequest('POST', endpoint);
      
      if (response.ok) {
        // Update the local state by moving the approved/rejected detailer
        const updatedPendingDetailers = pendingDetailers.filter(d => d.id !== detailerId);
        setPendingDetailers(updatedPendingDetailers);
        
        if (action === 'approve') {
          const approvedDetailer = pendingDetailers.find(d => d.id === detailerId);
          if (approvedDetailer) {
            const newDetailer = {
              ...approvedDetailer,
              status: 'active',
              warrantiesIssued: 0,
              customerCount: 0
            };
            setDetailers([...detailers, newDetailer]);
          }
          
          toast({
            title: 'Detailer Approved',
            description: 'The detailer has been successfully approved.',
          });
        } else {
          toast({
            title: 'Detailer Rejected',
            description: 'The detailer application has been rejected.',
          });
        }
      } else {
        throw new Error('Failed to process the request');
      }
    } catch (error) {
      console.error(`Error ${action}ing detailer:`, error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to ${action} detailer. Please try again.`,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Detailer Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage detailers in your distribution area.
        </p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between gap-2">
              <span className="flex items-center">Active Detailers</span>
              <InfoDot widgetId="distributor.detailers.activeSummary" fallbackLabel="Active Detailers" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{detailers.length}</div>
            <div className="flex items-center mt-1">
              <UserCheck className="w-4 h-4 text-green-500 mr-1" />
              <p className="text-xs text-green-500">All detailers active and in good standing</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between gap-2">
              <span className="flex items-center">Pending Applications</span>
              <InfoDot widgetId="distributor.detailers.pendingSummary" fallbackLabel="Pending Applications" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingDetailers.length}</div>
            <div className="flex items-center mt-1">
              <Clock className="w-4 h-4 text-amber-500 mr-1" />
              <p className="text-xs text-amber-500">Applications requiring your review</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between gap-2">
              <span className="flex items-center">Total Warranties</span>
              <InfoDot widgetId="distributor.detailers.warrantiesSummary" fallbackLabel="Total Warranties" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {detailers.reduce((sum, detailer) => sum + detailer.warrantiesIssued, 0)}
            </div>
            <div className="flex items-center mt-1">
              <CheckCircle className="w-4 h-4 text-primary mr-1" />
              <p className="text-xs text-primary">Warranties issued by your detailers</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-end mb-6">
        <Button 
          onClick={() => setLocation('/erp/distributor/detailer-invite')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Link className="h-4 w-4" />
          Invite Detailer
        </Button>
      </div>
      
      {/* Add Detailer Dialog */}
      <Dialog open={isAddDetailerDialogOpen} onOpenChange={setIsAddDetailerDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Detailer</DialogTitle>
            <DialogDescription>
              Add a new detailer to your P91 franchise network. They will be assigned to your territory.
            </DialogDescription>
          </DialogHeader>
          
          <AddDetailerForm onSubmit={handleAddDetailer} loading={isAddingDetailer} />
          
        </DialogContent>
      </Dialog>
      
      {/* Tabs for Active Detailers and Pending Applications */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="active">
            Active Detailers
            <Badge variant="outline" className="ml-2">{detailers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending Applications
            <Badge variant="outline" className="ml-2">{pendingDetailers.length}</Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center">Active Detailers</span>
                <InfoDot widgetId="distributor.detailers.activeTable" fallbackLabel="Active Detailers Table" />
              </CardTitle>
              <CardDescription>
                List of all active detailers in your distribution area.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>All active detailers as of {new Date().toLocaleDateString()}</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Warranties</TableHead>
                    <TableHead>Customers</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailers.map((detailer) => (
                    <TableRow key={detailer.id}>
                      <TableCell className="font-medium">{detailer.name}</TableCell>
                      <TableCell>
                        <div>{detailer.email}</div>
                        <div className="text-xs text-gray-500">{detailer.phone}</div>
                      </TableCell>
                      <TableCell>{detailer.address}</TableCell>
                      <TableCell>{new Date(detailer.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{detailer.warrantiesIssued}</TableCell>
                      <TableCell>{detailer.customerCount}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSelectedDetailer(detailer);
                            setIsDetailerDetailsOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center">Pending Applications</span>
                <InfoDot widgetId="distributor.detailers.pendingTable" fallbackLabel="Pending Applications Table" />
              </CardTitle>
              <CardDescription>
                Review and approve/reject detailer applications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingDetailers.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <h3 className="text-sm font-medium text-gray-900">No pending applications</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    All detailer applications have been processed.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableCaption>Pending applications requiring your review</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Applied On</TableHead>
                      <TableHead>Business Type</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingDetailers.map((detailer) => (
                      <TableRow key={detailer.id}>
                        <TableCell className="font-medium">{detailer.name}</TableCell>
                        <TableCell>
                          <div>{detailer.email}</div>
                          <div className="text-xs text-gray-500">{detailer.phone}</div>
                        </TableCell>
                        <TableCell>{detailer.address}</TableCell>
                        <TableCell>{new Date(detailer.appliedOn).toLocaleDateString()}</TableCell>
                        <TableCell>{detailer.businessType}</TableCell>
                        <TableCell>{detailer.experience}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 text-green-500 border-green-500 hover:bg-green-50"
                              onClick={() => handleApproveReject(detailer.id, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 text-red-500 border-red-500 hover:bg-red-50"
                              onClick={() => handleApproveReject(detailer.id, 'reject')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Detailer Details Dialog */}
      {selectedDetailer && (
        <DetailerDetails
          detailer={selectedDetailer}
          open={isDetailerDetailsOpen}
          onClose={() => setIsDetailerDetailsOpen(false)}
        />
      )}
    </div>
  );
}