import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { z } from "zod";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Loader2, 
  ClipboardList, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Search, 
  Plus, 
  Filter, 
  ArrowLeft,
  Upload,
  X,
  Info,
  FileText,
  CloudUpload,
  Image,
  Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; 
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { InfoDot } from '@/components/dev/InfoDot';
import { useLocation, Link } from "wouter";

// Define the claim form schema
const claimFormSchema = z.object({
  productType: z.enum(["unused", "registered"], {
    required_error: "Please select a product type",
  }),
  batchNumber: z.string().optional(),
  eWarrantyNumber: z.string().optional(),
  productId: z.number().optional(),
  productName: z.string().optional(),
  productSize: z.string().optional(),
  serialNumber: z.string().optional(),
  lotNumber: z.string().optional(),
  
  // Claim dimensions details
  problemLength: z.string().min(1, "Length is required"),
  problemWidth: z.string().min(1, "Width is required"),
  claimArea: z.string().optional(), // Auto-calculated field
  
  // Problem information
  problemArea: z.string().min(1, "Problem area is required"),
  issueType: z.string().min(1, "Issue type is required"),
  description: z.string().min(10, "Please provide a detailed description (min 10 characters)"),
  
  // Product storage status fields (all required with defaults)
  boxOpened: z.enum(["yes", "no"]).default("no"),
  productUsed: z.enum(["yes", "no"]).default("no"),
  labelPreserved: z.enum(["yes", "no"]).default("no"),
  tapedAfterUse: z.enum(["yes", "no"]).default("no"),
  capIncluded: z.enum(["yes", "no"]).default("no"),
  
  // File uploads - required at least one file
  fileUploads: z.array(z.any()).min(1, "At least one photo or video is required"),

  // Auto-fetched claim raiser info (will be populated from API)
  distributorName: z.string().optional(),
  detailerName: z.string().optional(),
  city: z.string().optional(),
  contactInfo: z.string().optional(),
  role: z.string().optional(),
  
  // If distributor is submitting on behalf of a detailer
  detailerId: z.number().optional(),
})
  .refine(
    (data) => {
      if (data.productType === "unused") {
        return !!data.batchNumber;
      }
      if (data.productType === "registered") {
        return !!data.eWarrantyNumber;
      }
      return false;
    },
    {
      message: "Batch number or e-warranty number is required based on product type",
      path: ["batchNumber"],
    }
  );

type ClaimFormValues = z.infer<typeof claimFormSchema>;

export default function DistributorClaimsPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [user, setUser] = useState<any>(null);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [claims, setClaims] = useState<any[]>([]);
  const [filteredClaims, setFilteredClaims] = useState<any[]>([]);
  const [detailers, setDetailers] = useState<any[]>([]);
  const [selectedDetailerId, setSelectedDetailerId] = useState<string>('all');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [claimFormOpen, setClaimFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [showDetailerSelection, setShowDetailerSelection] = useState(false);

  // File upload state
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const MAX_FILES = 5;
  
  // Initialize form for claim registration
  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      productType: "unused",
      batchNumber: "",
      eWarrantyNumber: "",
      problemLength: "",
      problemWidth: "",
      claimArea: "",
      problemArea: "",
      issueType: "",
      description: "",
      boxOpened: "no",
      productUsed: "no",
      labelPreserved: "no",
      tapedAfterUse: "no",
      capIncluded: "no",
      fileUploads: [],
      distributorName: "",
      detailerName: "",
      city: "",
      contactInfo: "",
      role: "",
    },
  });

  // Prefill user data when form opens or when user data loads
  useEffect(() => {
    if (user && (claimFormOpen || form.getValues("distributorName") === "")) {
      // Set distributor information
      form.setValue("distributorName", user.name || user.username);
      form.setValue("city", user.city || "");
      form.setValue("contactInfo", user.contactNumber || "");
      form.setValue("role", "distributor");
    }
  }, [claimFormOpen, user, form]);
  
  // Calculate area automatically when length or width changes
  useEffect(() => {
    // Set up watch specifically on the fields we need
    const subscription = form.watch((value, { name }) => {
      // Only recalculate when those specific fields change
      if (name === "problemLength" || name === "problemWidth") {
        const length = parseFloat(form.getValues("problemLength"));
        const width = parseFloat(form.getValues("problemWidth"));
        
        if (!isNaN(length) && !isNaN(width)) {
          const area = length * width;
          form.setValue("claimArea", area.toFixed(2), { shouldValidate: true });
        } else {
          form.setValue("claimArea", "", { shouldValidate: true });
        }
      }
    });
    
    // Initial calculation
    const initialLength = parseFloat(form.getValues("problemLength"));
    const initialWidth = parseFloat(form.getValues("problemWidth"));
    if (!isNaN(initialLength) && !isNaN(initialWidth)) {
      const area = initialLength * initialWidth;
      form.setValue("claimArea", area.toFixed(2), { shouldValidate: true });
    }
    
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await apiRequest('GET', '/api/erp/me');
        const userData = await userResponse.json();
        setUser(userData);
        
        // Fetch claims
        const claimsResponse = await apiRequest('GET', '/api/erp/distributor/claims');
        const claimsData = await claimsResponse.json();
        setClaims(claimsData.length > 0 ? claimsData : []);
        
        // Fetch detailers
        const detailersResponse = await apiRequest('GET', '/api/erp/distributor/detailers');
        const detailersData = await detailersResponse.json();
        setDetailers(detailersData.length > 0 ? detailersData : []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load claim data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  // Filter claims based on search query and selected tab/detailer
  useEffect(() => {
    let result = [...claims];
    
    // Filter by detailer
    if (selectedDetailerId !== 'all') {
      result = result.filter(claim => 
        claim.detailerId === parseInt(selectedDetailerId)
      );
    }
    
    // Filter by status
    if (activeTab !== 'all') {
      result = result.filter(claim => {
        if (activeTab === 'pending') return claim.status === 'submitted';
        if (activeTab === 'approved') return claim.status === 'approved';
        if (activeTab === 'rejected') return claim.status === 'rejected';
        if (activeTab === 'processing') return claim.status === 'processing';
        return true;
      });
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(claim => 
        claim.claimNumber?.toLowerCase().includes(query) ||
        claim.customerName?.toLowerCase().includes(query) ||
        claim.detailerName?.toLowerCase().includes(query) ||
        claim.productName?.toLowerCase().includes(query) ||
        claim.issue?.toLowerCase().includes(query)
      );
    }
    
    setFilteredClaims(result);
  }, [claims, searchQuery, activeTab, selectedDetailerId]);
  
  // Handle file uploading
  const onFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = event.target;
    if (!fileInput.files || fileInput.files.length === 0) return;
    
    // Check if adding these files would exceed the limit
    if (files.length + fileInput.files.length > MAX_FILES) {
      setFileError(`Maximum ${MAX_FILES} files allowed`);
      return;
    }
    
    setFileError("");
    
    // Add new files to state
    const newFiles = Array.from(fileInput.files);
    setFiles(prev => [...prev, ...newFiles]);
    
    // Update form value with file objects
    form.setValue("fileUploads", [...files, ...newFiles], { shouldValidate: true });
    
    // Reset the input so the same file can be selected again
    fileInput.value = "";
  }, [files, form, MAX_FILES]);
  
  // Handle file removal
  const removeFile = useCallback((index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      form.setValue("fileUploads", newFiles, { shouldValidate: true });
      return newFiles;
    });
  }, [form]);
  
  // Handle drag and drop file upload
  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    if (!event.dataTransfer.files || event.dataTransfer.files.length === 0) return;
    
    // Check if adding these files would exceed the limit
    if (files.length + event.dataTransfer.files.length > MAX_FILES) {
      setFileError(`Maximum ${MAX_FILES} files allowed`);
      return;
    }
    
    setFileError("");
    
    // Add new files to state
    const newFiles = Array.from(event.dataTransfer.files);
    setFiles(prev => [...prev, ...newFiles]);
    
    // Update form value with file objects
    form.setValue("fileUploads", [...files, ...newFiles], { shouldValidate: true });
  }, [files, form, MAX_FILES]);
  
  // Handle product lookup
  const handleProductLookup = async () => {
    const productType = form.getValues("productType");
    let value, type;
    
    if (productType === "unused") {
      value = form.getValues("batchNumber");
      type = "batch";
    } else {
      value = form.getValues("eWarrantyNumber");
      type = "warranty";
    }
    
    if (!value) {
      toast({
        title: "Missing information",
        description: productType === "unused" 
          ? "Please enter a batch number" 
          : "Please enter an e-warranty number",
        variant: "destructive",
      });
      return;
    }
    
    setIsLookingUp(true);
    
    try {
      const res = await apiRequest(
        "GET", 
        `/api/erp/product-lookup?type=${type}&value=${encodeURIComponent(value)}`
      );
      const data = await res.json();
      
      if (data.success) {
        // Update form with product information
        form.setValue("productId", data.id);
        form.setValue("productName", data.name);
        form.setValue("productSize", data.size);
        form.setValue("serialNumber", data.serialNumber || "");
        form.setValue("lotNumber", data.lotNumber || "");
        
        toast({
          title: "Product found",
          description: `Found: ${data.name}`,
        });
      } else {
        form.setError("productId", {
          type: "manual",
          message: data.message || "No product found with the provided number"
        });
        
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
  const onSubmitClaim = async (values: ClaimFormValues) => {
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
      const length = parseFloat(values.problemLength);
      const width = parseFloat(values.problemWidth);
      const area = length * width;
      
      // Prepare payload for claim submission
      const payload = {
        productId: values.productId,
        serialNumber: values.serialNumber,
        lotNumber: values.lotNumber,
        problemLength: values.problemLength,
        problemWidth: values.problemWidth,
        problemArea: values.problemArea,
        issueType: values.issueType,
        description: values.description,
        boxOpened: values.boxOpened,
        productUsed: values.productUsed,
        labelPreserved: values.labelPreserved,
        tapedAfterUse: values.tapedAfterUse,
        capIncluded: values.capIncluded,
        claimArea: isNaN(area) ? "0" : area.toString(),
        detailerId: values.detailerId,
        fileUploads: values.fileUploads
      };
      
      const res = await apiRequest("POST", "/api/erp/claims/register", payload);
      const data = await res.json();
      
      if (data.success) {
        toast({
          title: "Claim registered successfully",
          description: "Your claim has been submitted for review",
        });
        
        // Close the modal
        setClaimFormOpen(false);
        
        // Reset form
        form.reset();
        
        // Refresh claims data
        const refreshResponse = await apiRequest('GET', '/api/erp/distributor/claims');
        const refreshedClaims = await refreshResponse.json();
        setClaims(refreshedClaims.length > 0 ? refreshedClaims : claims);
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
  
  const handleCreateClaim = () => {
    // Open the claim form modal instead of navigating
    setClaimFormOpen(true);
  };
  
  const handleUpdateStatus = async (claimId: number, newStatus: string, resolution: string = '') => {
    if (updatingStatus) return;
    
    setUpdatingStatus(true);
    
    try {
      const res = await apiRequest("POST", `/api/erp/claims/${claimId}/status`, {
        status: newStatus,
        resolution
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Update the claim in the local state
        const updatedClaims = claims.map(claim => {
          if (claim.id === claimId) {
            return {
              ...claim,
              status: newStatus,
              resolution: resolution || claim.resolution
            };
          }
          return claim;
        });
        
        setClaims(updatedClaims);
        
        // Update selected claim if it's the one being updated
        if (selectedClaim && selectedClaim.id === claimId) {
          setSelectedClaim({
            ...selectedClaim,
            status: newStatus,
            resolution: resolution || selectedClaim.resolution
          });
        }
        
        // Close the details dialog if it's open
        setDetailsOpen(false);
        
        toast({
          title: "Status updated",
          description: `Claim status has been updated to ${newStatus}`,
        });
      } else {
        toast({
          title: "Update failed",
          description: data.message || "Failed to update status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating the claim status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };
  
  const handleViewClaimDetails = (claim: any) => {
    setSelectedClaim(claim);
    setDetailsOpen(true);
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  const getClaimStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-500 border-green-200 bg-green-50">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">Rejected</Badge>;
      case 'processing':
        return <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50">Processing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-gray-500">Loading claims...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Warranty Claims</h1>
            <p className="mt-1 text-sm text-gray-500">
              Review and manage warranty claims from your detailers.
            </p>
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between gap-2">
              <span className="flex items-center">Total Claims</span>
              <InfoDot widgetId="distributor.claims.totalSummary" fallbackLabel="Total Claims" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{claims.length}</div>
            <div className="flex items-center mt-1">
              <ClipboardList className="w-4 h-4 text-primary mr-1" />
              <p className="text-xs text-primary">All time warranty claims</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between gap-2">
              <span className="flex items-center">Pending Review</span>
              <InfoDot widgetId="distributor.claims.pendingSummary" fallbackLabel="Pending Review" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {claims.filter(c => c.status === 'submitted').length}
            </div>
            <div className="flex items-center mt-1">
              <AlertCircle className="w-4 h-4 text-amber-500 mr-1" />
              <p className="text-xs text-amber-500">Awaiting your review</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between gap-2">
              <span className="flex items-center">Approved</span>
              <InfoDot widgetId="distributor.claims.approvedSummary" fallbackLabel="Approved" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {claims.filter(c => c.status === 'approved').length}
            </div>
            <div className="flex items-center mt-1">
              <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
              <p className="text-xs text-green-500">Claims approved</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between gap-2">
              <span className="flex items-center">Rejected</span>
              <InfoDot widgetId="distributor.claims.rejectedSummary" fallbackLabel="Rejected" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {claims.filter(c => c.status === 'rejected').length}
            </div>
            <div className="flex items-center mt-1">
              <XCircle className="w-4 h-4 text-red-500 mr-1" />
              <p className="text-xs text-red-500">Claims rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 sm:items-center">
          <div className="flex-1 relative">
            <Input
              placeholder="Search claims..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          
          <div className="flex items-center space-x-2">
            <p className="text-sm whitespace-nowrap">Detailer:</p>
            <Select
              value={selectedDetailerId}
              onValueChange={setSelectedDetailerId}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Detailers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Detailers</SelectItem>
                {detailers.map((detailer) => (
                  <SelectItem key={detailer.id} value={detailer.id.toString()}>
                    {detailer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Claims Table */}
      <ClaimsTable 
        claims={filteredClaims} 
        onViewDetails={handleViewClaimDetails}
      />
      
      {/* Claim Details Dialog */}
      {selectedClaim && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <div className="flex justify-between items-center">
                <DialogTitle>Claim Details</DialogTitle>
                <Badge className="ml-2">{getClaimStatusBadge(selectedClaim.status)}</Badge>
              </div>
              <DialogDescription>
                Claim #{selectedClaim.claimNumber} submitted on {formatDate(selectedClaim.submissionDate)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Customer & Detailer</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Customer</h4>
                      <p className="text-sm">{selectedClaim.customerName}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Detailer</h4>
                      <p className="text-sm">{selectedClaim.detailerName}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Product Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Product</h4>
                      <p className="text-sm">{selectedClaim.productName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Serial Number</h4>
                        <p className="text-sm">{selectedClaim.serialNumber || "N/A"}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Lot Number</h4>
                        <p className="text-sm">{selectedClaim.lotNumber || "N/A"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Claim Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Area</h4>
                      <p className="text-sm">{selectedClaim.problemArea}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Size</h4>
                      <p className="text-sm">{selectedClaim.problemLength} × {selectedClaim.problemWidth} cm</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Issue Type</h4>
                      <p className="text-sm">{selectedClaim.issueType}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Description</h4>
                    <p className="text-sm whitespace-pre-line">{selectedClaim.description}</p>
                  </div>
                </CardContent>
              </Card>
              
              {selectedClaim.attachmentURLs && selectedClaim.attachmentURLs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Attachments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedClaim.attachmentURLs.map((url: string, index: number) => (
                        <div key={index} className="text-sm border rounded p-2 flex items-center">
                          <span className="text-gray-500">File {index + 1}</span>
                          <Button variant="link" className="ml-auto">View</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {selectedClaim.resolution && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-base">Resolution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-line">{selectedClaim.resolution}</p>
                  </CardContent>
                </Card>
              )}
              
              {/* Status decisions are handled by admin only — view is read-only */}
              {(selectedClaim.status === 'submitted' || selectedClaim.status === 'processing') && (
                <p className="text-sm text-gray-500 text-right italic">
                  Awaiting admin review
                </p>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setDetailsOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Claim Registration Modal */}
      <Dialog open={claimFormOpen} onOpenChange={setClaimFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register New Warranty Claim</DialogTitle>
            <DialogDescription>
              Enter product information and claim details below
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitClaim)} className="space-y-6">
              <div className="space-y-6">
                {/* Product Information Section */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Product Information</CardTitle>
                    <CardDescription>
                      Select product type and enter identification number
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="productType"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel>Product Type</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex space-x-4"
                            >
                              <div className="flex items-center space-x-2">
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="registered" />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">Registered Product</FormLabel>
                                </FormItem>
                              </div>
                              <div className="flex items-center space-x-2">
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="unused" />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">Unused Product</FormLabel>
                                </FormItem>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  
                    <div className="flex flex-col space-y-4">
                      <div className="flex space-x-2">
                        {form.watch("productType") === "unused" ? (
                          <FormField
                            control={form.control}
                            name="batchNumber"
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel>Batch Number</FormLabel>
                                <div className="flex space-x-2">
                                  <FormControl>
                                    <Input placeholder="Enter batch number" {...field} />
                                  </FormControl>
                                  <Button
                                    className="mt-0"
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
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : (
                          <FormField
                            control={form.control}
                            name="eWarrantyNumber"
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel>eWarranty Number</FormLabel>
                                <div className="flex space-x-2">
                                  <FormControl>
                                    <Input placeholder="Enter eWarranty number" {...field} />
                                  </FormControl>
                                  <Button
                                    className="mt-0"
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
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </div>
                  
                    {/* Product details display */}
                    {form.watch("productName") && (
                      <div className="rounded-md border p-4">
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
                    
                    {/* Detailer selection (for distributor only) */}
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <FormLabel>Submit claim on behalf of a detailer?</FormLabel>
                      </div>
                      <RadioGroup
                        defaultValue="no"
                        onValueChange={(value) => {
                          const isDetailerSelected = value === "yes";
                          setShowDetailerSelection(isDetailerSelected);
                          
                          // If switching to "no", reset detailer-related fields
                          if (!isDetailerSelected) {
                            form.setValue("detailerId", undefined);
                            form.setValue("detailerName", "");
                            form.setValue("role", "distributor"); // Reset to distributor role
                            // Restore distributor information for city and contact
                            if (user) {
                              form.setValue("city", user.city || "");
                              form.setValue("contactInfo", user.contactNumber || "");
                            }
                          }
                        }}
                        className="flex flex-row space-x-4 mt-2"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="no" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            No, submit as distributor
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="yes" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Yes, select a detailer
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                      
                      {showDetailerSelection && (
                        <FormField
                          control={form.control}
                          name="detailerId"
                          render={({ field }) => (
                            <FormItem className="mt-4">
                              <FormLabel>Select Detailer</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  const detailerId = parseInt(value);
                                  field.onChange(detailerId);
                                  
                                  // Find the selected detailer and update form fields
                                  const selectedDetailer = detailers.find(d => d.id === detailerId);
                                  if (selectedDetailer) {
                                    form.setValue("detailerName", selectedDetailer.name || "");
                                    form.setValue("city", selectedDetailer.city || "");
                                    form.setValue("contactInfo", selectedDetailer.contactNumber || "");
                                    form.setValue("role", "detailer"); // Update role when detailer is selected
                                  }
                                }}
                                defaultValue={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a detailer" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {detailers.map((detailer) => (
                                    <SelectItem 
                                      key={detailer.id} 
                                      value={detailer.id.toString()}
                                    >
                                      {detailer.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Select the detailer for whom you are submitting this claim
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Claim Raised By */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Claim Raised By</CardTitle>
                    <CardDescription>
                      Information about who is raising this claim
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="distributorName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Distributor Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Distributor name"
                                {...field}
                                disabled
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="detailerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Detailer Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Detailer name"
                                {...field}
                                disabled={!showDetailerSelection}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="City"
                                {...field}
                                disabled
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="contactInfo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Contact number"
                                {...field}
                                disabled
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Claim Dimensions & Area */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Claim Dimensions & Area</CardTitle>
                    <CardDescription>
                      Enter the dimensions of the affected area
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="problemLength"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Length (ft)</FormLabel>
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
                            <FormLabel>Width (ft)</FormLabel>
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
                      name="claimArea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Calculated Area (sq ft)</FormLabel>
                          <FormControl>
                            <Input
                              readOnly
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Area is automatically calculated based on length × width
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    

                  </CardContent>
                </Card>
                
                {/* Problem Information */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Problem Information</CardTitle>
                    <CardDescription>
                      Describe the issue with the product
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                              <SelectItem value="adhesive">Adhesive</SelectItem>
                              <SelectItem value="adhesive_remain">Adhesive (Remain)</SelectItem>
                              <SelectItem value="color_levitation">Color (Levitation)</SelectItem>
                              <SelectItem value="color_leaching">Color (Leaching)</SelectItem>
                              <SelectItem value="contamination_water_spot">Contamination (Water spot)</SelectItem>
                              <SelectItem value="contamination_yellowing">Contamination (Yellowing)</SelectItem>
                              <SelectItem value="crack">Crack</SelectItem>
                              <SelectItem value="crater">Crater</SelectItem>
                              <SelectItem value="creasing">Creasing</SelectItem>
                              <SelectItem value="delamination_layer">Delamination (Layer)</SelectItem>
                              <SelectItem value="distortion_section">Distortion (Section)</SelectItem>
                              <SelectItem value="dot_black">Dot (Black)</SelectItem>
                              <SelectItem value="dot_gel_agglomeration">Dot (Gel Agglomeration)</SelectItem>
                              <SelectItem value="white_spot">White Spot</SelectItem>
                              <SelectItem value="haze">Haze</SelectItem>
                              <SelectItem value="foreign_substance_bug">Foreign Substance (Bug)</SelectItem>
                              <SelectItem value="gel">Gel</SelectItem>
                              <SelectItem value="impression">Impression</SelectItem>
                              <SelectItem value="specification_error">Specification Error</SelectItem>
                              <SelectItem value="line">Line</SelectItem>
                              <SelectItem value="matting">Matting</SelectItem>
                              <SelectItem value="penetration">Penetration</SelectItem>
                              <SelectItem value="scratch">Scratch</SelectItem>
                              <SelectItem value="shrinkage">Shrinkage</SelectItem>
                              <SelectItem value="stretch">Stretch</SelectItem>
                              <SelectItem value="surface_uncoated">Surface (Uncoated)</SelectItem>
                              <SelectItem value="tunnel">Tunnel</SelectItem>
                              <SelectItem value="wrinkle">Wrinkle</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="problemArea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Problem Area</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select problem area" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="width_direction">Width Direction (TD)</SelectItem>
                              <SelectItem value="roll_direction">Roll Direction (MD)</SelectItem>
                              <SelectItem value="right_side">Right Side</SelectItem>
                              <SelectItem value="left_side">Left Side</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
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
                          <FormLabel>Additional Details</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Please describe the issue in detail. Include when you first noticed the problem and any relevant circumstances."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum 10 characters. Provide as much detail as possible.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                
                {/* Photo & Video Uploads */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Upload Photos/Videos of Damage</CardTitle>
                    <CardDescription>
                      Please provide visual evidence of the issue to help us assess the claim.
                      <div className="mt-2 text-sm text-gray-500">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Acceptable formats: JPG, JPEG, PNG, GIF, HEIC, MP4, MOV</li>
                          <li>Maximum 5 files (100MB each)</li>
                          <li>At least one photo/video is required</li>
                          <li>Include close-up shots of the affected area</li>
                        </ul>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const droppedFiles = Array.from(e.dataTransfer.files);
                        if (droppedFiles.length > 0) {
                          // Limit to 5 files
                          const allowedFiles = droppedFiles.slice(0, MAX_FILES - files.length);
                          setFiles(prev => [...prev, ...allowedFiles]);
                          form.setValue("fileUploads", [...files, ...allowedFiles], { shouldValidate: true });
                          
                          if (droppedFiles.length > (MAX_FILES - files.length)) {
                            toast({
                              title: "Too many files",
                              description: "Only the first 5 files have been selected",
                              variant: "destructive"
                            });
                          }
                        }
                      }}
                    >
                      <Upload className="h-10 w-10 text-gray-400 mb-2" />
                      <h3 className="text-sm font-medium text-gray-900">Drag files here or click to upload</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum 5 files, 100MB each
                      </p>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        className="sr-only"
                        accept="image/jpeg,image/png,image/gif,image/heic,video/mp4,video/quicktime"
                        onChange={onFileChange}
                      />
                      <label htmlFor="file-upload">
                        <Button type="button" variant="outline" size="sm" asChild className="mt-4">
                          <span>Select Files</span>
                        </Button>
                      </label>
                    </div>
                    
                    {files.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium">Selected Files ({files.length}/5)</h4>
                        {files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between border rounded-md p-2">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                {file.type.startsWith('image/') ? (
                                  <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-gray-500" />
                                  </div>
                                ) : (
                                  <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-gray-500" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-500"
                              onClick={() => removeFile(index)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Product Storage Status */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Product Storage Status</CardTitle>
                    <CardDescription>
                      Provide information about how the product was stored
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="boxOpened"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel>Was the product opened prior to application?</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex space-x-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="yes" />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">Yes</FormLabel>
                                  </FormItem>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="no" />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">No</FormLabel>
                                  </FormItem>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="productUsed"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel>Has the product been used?</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex space-x-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="yes" />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">Yes</FormLabel>
                                  </FormItem>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="no" />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">No</FormLabel>
                                  </FormItem>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="labelPreserved"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel>Is the product label preserved?</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex space-x-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="yes" />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">Yes</FormLabel>
                                  </FormItem>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="no" />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">No</FormLabel>
                                  </FormItem>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="tapedAfterUse"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel>Has the product been taped after use?</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex space-x-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="yes" />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">Yes</FormLabel>
                                  </FormItem>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="no" />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">No</FormLabel>
                                  </FormItem>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="capIncluded"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel>Was the original cap included?</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex space-x-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="yes" />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">Yes</FormLabel>
                                  </FormItem>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="no" />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">No</FormLabel>
                                  </FormItem>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Description */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Detailed Description</CardTitle>
                    <CardDescription>
                      Provide a detailed description of the issue
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
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
                  </CardContent>
                </Card>
                
                {/* Form Submission */}
                <div className="flex justify-end space-x-3 pt-4 pb-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setClaimFormOpen(false)}
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
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
    );
}

function ClaimsTable({
  claims,
  onViewDetails,
}: {
  claims: any[],
  onViewDetails: (claim: any) => void,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center">Claims</span>
          <InfoDot widgetId="distributor.claims.table" fallbackLabel="Claims Table" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {claims.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardList className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900">No claims found</h3>
            <p className="text-sm text-gray-500 mt-1">
              No claims match your current filter criteria.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Detailer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell className="font-medium">{claim.claimNumber}</TableCell>
                  <TableCell>{claim.customerName}</TableCell>
                  <TableCell>{claim.detailerName}</TableCell>
                  <TableCell>{claim.productName}</TableCell>
                  <TableCell className="max-w-xs truncate" title={claim.issue}>
                    {claim.issue}
                  </TableCell>
                  <TableCell>{formatDate(claim.submissionDate)}</TableCell>
                  <TableCell>
                    {getClaimStatusBadge(claim.status)}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onViewDetails(claim)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function formatDate(dateString: string) {
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch (error) {
    return 'Invalid date';
  }
}

function getClaimStatusBadge(status: string) {
  switch (status) {
    case 'submitted':
      return <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50">Pending</Badge>;
    case 'approved':
      return <Badge variant="outline" className="text-green-500 border-green-200 bg-green-50">Approved</Badge>;
    case 'rejected':
      return <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">Rejected</Badge>;
    case 'processing':
      return <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50">Processing</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}