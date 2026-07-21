import { useState, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ClaimUpdates } from "@/components/claim-updates";
import { format } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { 
  ClipboardList, 
  Loader2, 
  Search, 
  Plus, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Upload,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { InfoDot } from "@/components/dev/InfoDot";

// Typed interface for a claim record returned by the API
interface ClaimDetail {
  id: number;
  claimNumber: string;
  status: string;
  submissionDate: string;
  productName: string;
  serialNumber: string;
  customerName: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  problemArea: string;
  problemLength: string;
  problemWidth: string;
  issueType: string;
  /** Primary issue description (server field is 'issue') */
  issue: string;
  /** Legacy alias kept for backward compat */
  description?: string;
  adminNotes: string;
  images: string[];
  resolution: string;
  issueDate: string;
  batchNumber: string;
  warrantyCode: string;
  claimQuantity: number;
  soldUnitId: number | null;
  erpnextClaimId: string | null;
  syncStatus: string | null;
  [key: string]: unknown;
}

// Enriched lot entry returned by the product-lookup endpoint
interface LotOption {
  lotNumber: string;
  quantity: string;
  soldUnitId: number | null;
}

// Define the claim form schema
const claimFormSchema = z.object({
  productType: z.enum(["unused", "registered"], {
    required_error: "Please select a product type",
  }),
  batchNumber: z.string().optional(),
  eWarrantyNumber: z.string().optional(),
  claimQuantity: z.number().int().positive().default(1),
  issueDate: z.string().optional(),
  selectedSoldUnitId: z.number().int().positive().optional(),
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

export default function DetailerClaimsPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: currentUser } = useQuery<{ id: number; role: string }>({
    queryKey: ['/api/erp/me'],
  });
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<ClaimDetail[]>([]);
  const [filteredClaims, setFilteredClaims] = useState<ClaimDetail[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedClaim, setSelectedClaim] = useState<ClaimDetail | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [claimFormOpen, setClaimFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [lotOptions, setLotOptions] = useState<LotOption[]>([]);
  const [warrantyExtra, setWarrantyExtra] = useState<{
    vehicleMake?: string; vehicleModel?: string; vehicleYear?: string;
    installerName?: string; installerCity?: string; customerName?: string;
  } | null>(null);
  const [maxClaimArea, setMaxClaimArea] = useState<number | null>(null);      // soft: warranty card qty
  const [batchAvailable, setBatchAvailable] = useState<number | null>(null);  // hard: qty_sold - claimed
  const [batchFound, setBatchFound] = useState<boolean | null>(null);         // null = not yet looked up
  
  // Initialize form for claim registration
  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      productType: "unused",
      batchNumber: "",
      eWarrantyNumber: "",
      claimQuantity: 1,
      issueDate: "",
      selectedSoldUnitId: undefined,
      problemLength: "",
      problemWidth: "",
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
  
  // Effect to fetch user info when form opens
  useEffect(() => {
    if (claimFormOpen) {
      fetchUserInfo();
    }
  }, [claimFormOpen]);
  
  // Function to fetch logged-in user info
  const fetchUserInfo = async () => {
    try {
      const res = await apiRequest('GET', '/api/erp/me');
      const userData = await res.json();
      
      if (userData) {
        // Auto-populate user information
        form.setValue("detailerName", userData.name || "Not Available");
        form.setValue("contactInfo", userData.phone || userData.email || "Not Available");
        form.setValue("role", "Detailer");
        
        // Check if user has city information in metadata or use fallback
        let cityValue = "Not Configured";
        if (userData.metadata && userData.metadata.city) {
          cityValue = userData.metadata.city;
        } else if (userData.metadata && userData.metadata.studioCity) {
          cityValue = userData.metadata.studioCity;
        }
        form.setValue("city", cityValue);
        
        // If the detailer has an assigned distributor, fetch that info
        if (userData.distributorId) {
          try {
            const distributorRes = await apiRequest('GET', `/api/erp/users/${userData.distributorId}`);
            const distributorData = await distributorRes.json();
            
            if (distributorData) {
              form.setValue("distributorName", distributorData.name || "");
            }
          } catch (error) {
            console.error("Error fetching distributor info:", error);
            // Set a fallback value instead of leaving "Loading..."
            form.setValue("distributorName", "Not Available");
          }
        } else {
          // No distributor assigned
          form.setValue("distributorName", "Not Assigned");
        }
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
      toast({
        title: "Information Error",
        description: "Could not fetch your account information",
        variant: "destructive",
      });
    }
  };

  // Fetch claims
  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const res = await apiRequest('GET', '/api/erp/detailer/claims');
        const data = await res.json();
        setClaims(data);
        setFilteredClaims(data);
      } catch (error) {
        console.error('Error fetching claims:', error);
        toast({
          title: 'Error',
          description: 'Failed to load claims. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, [toast]);
  
  // Filter claims based on search and status
  useEffect(() => {
    if (!claims) return;
    
    let filtered = [...claims];
    
    // Filter by status
    if (activeTab !== 'all') {
      filtered = filtered.filter(claim => claim.status === activeTab);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(claim => 
        claim.claimNumber?.toLowerCase().includes(query) ||
        claim.customerName?.toLowerCase().includes(query) ||
        claim.productName?.toLowerCase().includes(query) ||
        claim.issue?.toLowerCase().includes(query) ||
        `${claim.vehicleMake} ${claim.vehicleModel}`.toLowerCase().includes(query)
      );
    }
    
    setFilteredClaims(filtered);
  }, [claims, searchQuery, activeTab]);

  // Handlers
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };
  
  const handleViewDetails = (claim: any) => {
    setSelectedClaim(claim);
    setDetailsOpen(true);
  };
  
  const handleCreateClaim = () => {
    // Open the claim form modal instead of redirecting
    setClaimFormOpen(true);
  };
  
  // Get badge for claim status
  const getClaimStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50">Pending</Badge>;
      case 'processing':
        return <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50">Processing</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-500 border-green-200 bg-green-50">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Handle product lookup
  const handleProductLookup = async () => {
    const productType = form.getValues("productType");
    let searchValue = "";
    let searchType = "";
    
    // Clear any previous errors
    form.clearErrors("productId");
    
    if (productType === "unused") {
      searchValue = form.getValues("batchNumber") || "";
      searchType = "batch";
    } else {
      searchValue = form.getValues("eWarrantyNumber") || "";
      searchType = "warranty";
    }
    
    if (!searchValue) {
      const errorField = productType === "unused" ? "batchNumber" : "eWarrantyNumber";
      form.setError(errorField, {
        type: "manual",
        message: productType === "unused" 
          ? "Please enter a batch number" 
          : "Please enter an e-warranty number"
      });
      
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
        `/api/erp/product-lookup?type=${searchType}&value=${encodeURIComponent(searchValue)}`
      );
      const data = await res.json();
      
      if (data.success) {
        // Update form with product information
        form.setValue("productId", data.id);
        form.setValue("productName", data.name);
        form.setValue("productSize", data.size);
        form.setValue("serialNumber", data.serialNumber || "");
        form.setValue("lotNumber", data.lotNumber || "");
        // Auto-fill issue date from warranty installation date (registered path)
        if (data.issueDate || data.installationDate) {
          const rawDate = data.issueDate || data.installationDate;
          form.setValue("issueDate", rawDate ? rawDate.toString().substring(0, 10) : "");
        }
        // Store enriched lot options for the batch selector
        const lots: LotOption[] = Array.isArray(data.lotNumbers) ? data.lotNumbers : [];
        setLotOptions(lots);
        // Store extra warranty details for display
        setWarrantyExtra({
          vehicleMake: data.vehicleMake || undefined,
          vehicleModel: data.vehicleModel || undefined,
          vehicleYear: data.vehicleYear || undefined,
          installerName: data.installerName || undefined,
          installerCity: data.installerCity || undefined,
          customerName: data.customerName || undefined,
        });
        // Auto-select soldUnitId when there is exactly one lot
        if (lots.length === 1 && lots[0].soldUnitId) {
          form.setValue("selectedSoldUnitId", lots[0].soldUnitId);
        } else if (data.soldUnitId) {
          form.setValue("selectedSoldUnitId", data.soldUnitId);
        } else {
          form.setValue("selectedSoldUnitId", undefined);
        }
        
        // Store max claimable area limits
        setMaxClaimArea(typeof data.maxClaimArea === 'number' ? data.maxClaimArea : null);
        setBatchFound(typeof data.batchFound === 'boolean' ? data.batchFound : null);
        setBatchAvailable(typeof data.batchAvailable === 'number' ? data.batchAvailable : null);

        // Clear any errors
        form.clearErrors("productId");
        
        toast({
          title: "Product found",
          description: `Successfully found product: ${data.name}`,
          variant: "default",
        });
      } else {
        // Set error in the form
        form.setError("productId", {
          type: "manual",
          message: data.message || "No product found with the provided number"
        });
        
        toast({
          title: "Product not found",
          description: data.message || "No product found with the provided number. Please check and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error looking up product:", error);

      // Try to extract a structured error message from the thrown error string
      // apiRequest throws: "403: <JSON body>" or "404: <text>"
      let errorMsg = "There was an error looking up the product. Please try again.";
      let errorTitle = "Lookup failed";
      if (error instanceof Error) {
        const match = error.message.match(/^\d+:\s*(.+)$/s);
        if (match) {
          try {
            const parsed = JSON.parse(match[1]);
            if (parsed.message) errorMsg = parsed.message;
          } catch { errorMsg = match[1]; }
        }
        if (error.message.startsWith("403")) errorTitle = "Not authorised";
        else if (error.message.startsWith("422")) errorTitle = "Claim not valid";
      }

      const errorField = form.getValues("productType") === "unused" ? "batchNumber" : "eWarrantyNumber";
      form.setError(errorField, { type: "manual", message: errorMsg });

      toast({
        title: errorTitle,
        description: errorMsg,
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

    // Block submission based on batch availability checks
    const claimLen = parseFloat(values.problemLength);
    const claimWid = parseFloat(values.problemWidth);
    if (!isNaN(claimLen) && !isNaN(claimWid)) {
      const calcArea = claimLen * claimWid;

      // Hard block: batch not found in sold_units DB
      if (batchFound === false) {
        toast({
          title: "Batch not found",
          description: "This batch is not in our records. Please contact admin to register it before raising a claim.",
          variant: "destructive",
        });
        return;
      }

      // Hard block: exceeds sold_units remaining (qty_sold - claimed)
      if (batchAvailable !== null && calcArea > batchAvailable) {
        toast({
          title: "Invalid claim area",
          description: `Only ${batchAvailable} sq. ft. remaining for this batch. Your claim of ${calcArea.toFixed(2)} sq. ft. exceeds that.`,
          variant: "destructive",
        });
        return;
      }

      // Soft block: exceeds warranty card limit
      if (maxClaimArea !== null && calcArea > maxClaimArea) {
        toast({
          title: "Invalid claim area",
          description: `${calcArea.toFixed(2)} sq. ft. exceeds the warranty card limit of ${maxClaimArea} sq. ft.`,
          variant: "destructive",
        });
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      // Calculate area for the claim
      const area = parseFloat(values.problemLength) * parseFloat(values.problemWidth);
      
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add all the claim data to FormData
      formData.append("productId", values.productId?.toString() || "");
      formData.append("productType", values.productType);
      formData.append("claimQuantity", (values.claimQuantity ?? 1).toString());
      if (values.issueDate) formData.append("issueDate", values.issueDate);
      if (values.selectedSoldUnitId) formData.append("soldUnitId", values.selectedSoldUnitId.toString());
      if (values.productType === 'unused' && values.batchNumber) {
        formData.append("batchNumber", values.batchNumber);
      }
      if (values.productType === 'registered' && values.eWarrantyNumber) {
        formData.append("eWarrantyNumber", values.eWarrantyNumber);
      }
      if (values.serialNumber) formData.append("serialNumber", values.serialNumber);
      if (values.lotNumber) formData.append("lotNumber", values.lotNumber);
      formData.append("problemLength", values.problemLength);
      formData.append("problemWidth", values.problemWidth);
      formData.append("problemArea", values.problemArea);
      formData.append("issueType", values.issueType);
      formData.append("description", values.description);
      formData.append("claimArea", isNaN(area) ? "0" : area.toString());
      
      // Include Product Storage Status
      if (values.boxOpened) formData.append("boxOpened", values.boxOpened);
      if (values.productUsed) formData.append("productUsed", values.productUsed);
      if (values.labelPreserved) formData.append("labelPreserved", values.labelPreserved);
      if (values.tapedAfterUse) formData.append("tapedAfterUse", values.tapedAfterUse);
      if (values.capIncluded) formData.append("capIncluded", values.capIncluded);
      
      // Include claim raiser information
      if (values.distributorName) formData.append("distributorName", values.distributorName);
      if (values.detailerName) formData.append("detailerName", values.detailerName);
      if (values.city) formData.append("city", values.city);
      if (values.contactInfo) formData.append("contactInfo", values.contactInfo);
      if (values.role) formData.append("role", values.role);
      
      // Append actual proof files under the 'files' key (multer field name)
      uploadedFiles.forEach(file => {
        formData.append('files', file);
      });
      
      // Send as multipart/form-data — do NOT set Content-Type; browser sets it with boundary
      const res = await fetch("/api/erp/claims/register", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || "Request failed");
      }
      
      const data = await res.json();
      
      if (data.success) {
        toast({
          title: "Claim registered successfully",
          description: "Your claim has been submitted for review",
        });
        
        // Close the modal
        setClaimFormOpen(false);
        
        // Reset form and lot options
        form.reset();
        setLotOptions([]);
        setWarrantyExtra(null);
        setMaxClaimArea(null);
        setBatchAvailable(null);
        setBatchFound(null);
        
        // Refresh claims data
        const refreshResponse = await apiRequest('GET', '/api/erp/detailer/claims');
        const refreshedClaims = await refreshResponse.json();
        setClaims(refreshedClaims);
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
        description: error instanceof Error ? error.message : "There was an error submitting your claim",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading claims...</span>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Warranty Claims</h1>
              <InfoDot widgetId="detailer.claims.table" fallbackLabel="Warranty Claims" />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Manage and submit warranty claims for your customers.
            </p>
          </div>
          <Button onClick={handleCreateClaim}>
            <Plus className="h-4 w-4 mr-2" />
            Submit New Claim
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between gap-2">
              <span className="flex items-center">Total Claims</span>
              <InfoDot widgetId="detailer.claims.total" fallbackLabel="Total Claims" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{claims.length}</div>
            <div className="flex items-center mt-1">
              <ClipboardList className="w-4 h-4 text-primary mr-1" />
              <p className="text-xs text-primary">All time claims</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between gap-2">
              <span className="flex items-center">Pending</span>
              <InfoDot widgetId="detailer.claims.pending" fallbackLabel="Pending Claims" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {claims.filter(c => c.status === 'submitted').length}
            </div>
            <div className="flex items-center mt-1">
              <AlertCircle className="w-4 h-4 text-amber-500 mr-1" />
              <p className="text-xs text-amber-500">Awaiting review</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between gap-2">
              <span className="flex items-center">Approved</span>
              <InfoDot widgetId="detailer.claims.approved" fallbackLabel="Approved Claims" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {claims.filter(c => c.status === 'approved').length}
            </div>
            <div className="flex items-center mt-1">
              <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
              <p className="text-xs text-green-500">Approved claims</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between gap-2">
              <span className="flex items-center">Rejected</span>
              <InfoDot widgetId="detailer.claims.rejected" fallbackLabel="Rejected Claims" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {claims.filter(c => c.status === 'rejected').length}
            </div>
            <div className="flex items-center mt-1">
              <XCircle className="w-4 h-4 text-red-500 mr-1" />
              <p className="text-xs text-red-500">Rejected claims</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          <div className="flex-1 relative">
            <Input 
              placeholder="Search claims..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="submitted">Pending</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Claims Table */}
      <ClaimsTable 
        claims={filteredClaims} 
        formatDate={formatDate}
        getClaimStatusBadge={getClaimStatusBadge}
        onViewDetails={handleViewDetails}
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
            
            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              {/* Product / Claim Reference */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg space-y-1.5 text-sm">
                  <p className="font-semibold text-gray-700 mb-2">Claim Reference</p>
                  <p><span className="text-gray-500">Type:</span> {(selectedClaim as any).claimType === 'unused' ? 'Batch (Unused Product)' : 'Registered Warranty'}</p>
                  {(selectedClaim as any).batchNumber && <p><span className="text-gray-500">Batch No:</span> {(selectedClaim as any).batchNumber}</p>}
                  {(selectedClaim as any).warrantyCode && <p><span className="text-gray-500">Warranty Code:</span> {(selectedClaim as any).warrantyCode}</p>}
                  {selectedClaim.productName && <p><span className="text-gray-500">Product:</span> {selectedClaim.productName}</p>}
                  {(selectedClaim as any).claimQuantity && <p><span className="text-gray-500">Claimed Area:</span> {(selectedClaim as any).claimQuantity} sq ft</p>}
                  <p><span className="text-gray-500">Submitted:</span> {formatDate((selectedClaim as any).createdAt)}</p>
                  {selectedClaim.erpnextClaimId && (
                    <p className="mt-1 pt-1 border-t border-gray-200">
                      <span className="text-gray-500">Service Request ID:</span>{' '}
                      <span className="font-semibold text-blue-700">{selectedClaim.erpnextClaimId}</span>
                    </p>
                  )}
                </div>
                <div className="p-3 bg-gray-50 rounded-lg space-y-1.5 text-sm">
                  <p className="font-semibold text-gray-700 mb-2">Contact Info</p>
                  <p><span className="text-gray-500">Detailer:</span> {(selectedClaim as any).detailerName || '—'}</p>
                  <p><span className="text-gray-500">Distributor:</span> {(selectedClaim as any).distributorName || '—'}</p>
                  <p><span className="text-gray-500">City:</span> {(selectedClaim as any).city || '—'}</p>
                  <p><span className="text-gray-500">Contact:</span> {(selectedClaim as any).contactInfo || '—'}</p>
                </div>
              </div>

              {/* Problem Details */}
              <div className="p-3 bg-gray-50 rounded-lg space-y-2 text-sm">
                <p className="font-semibold text-gray-700 mb-1">Problem Details</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedClaim.issueType && <p><span className="text-gray-500">Issue Type:</span> {selectedClaim.issueType}</p>}
                  {selectedClaim.problemArea && <p><span className="text-gray-500">Area:</span> {selectedClaim.problemArea}</p>}
                  {selectedClaim.problemLength && selectedClaim.problemWidth && (
                    <p><span className="text-gray-500">Size:</span> {selectedClaim.problemLength} × {selectedClaim.problemWidth} ft</p>
                  )}
                  {(selectedClaim as any).claimArea && <p><span className="text-gray-500">Claim Area:</span> {(selectedClaim as any).claimArea} sq. ft.</p>}
                  {(selectedClaim as any).issueDate && <p><span className="text-gray-500">Issue Date:</span> {formatDate((selectedClaim as any).issueDate)}</p>}
                </div>
                <div className="mt-1">
                  <p className="text-gray-500">Description:</p>
                  <p className="mt-0.5 text-gray-800 whitespace-pre-line">{selectedClaim.issue || (selectedClaim as any).description || '—'}</p>
                </div>
              </div>

              {/* Product Storage Status */}
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-semibold text-gray-700 mb-2">Product Storage Check</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { label: 'Box Opened', val: (selectedClaim as any).boxOpened },
                    { label: 'Product Used', val: (selectedClaim as any).productUsed },
                    { label: 'Label Preserved', val: (selectedClaim as any).labelPreserved },
                    { label: 'Taped After Use', val: (selectedClaim as any).tapedAfterUse },
                    { label: 'Cap Included', val: (selectedClaim as any).capIncluded },
                  ].map(({ label, val }) => (
                    <p key={label}>
                      <span className="text-gray-500">{label}:</span>{' '}
                      <span className={val === 'yes' ? 'text-green-600 font-medium' : 'text-gray-700'}>{val || '—'}</span>
                    </p>
                  ))}
                </div>
              </div>

              {/* Photos / Videos */}
              {Array.isArray(selectedClaim.images) && selectedClaim.images.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  <p className="font-semibold text-gray-700 mb-2">Attached Photos / Videos</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedClaim.images.map((url: string, i: number) => {
                      const isVideo = url.match(/\.(mp4|mov|avi|webm)$/i);
                      return isVideo ? (
                        <video key={i} src={url} controls className="w-full rounded border" />
                      ) : (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt={`Attachment ${i + 1}`} className="w-full rounded border object-cover aspect-square" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Resolution */}
              {(selectedClaim as any).resolution && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                  <p className="font-semibold text-gray-700 mb-1">Resolution</p>
                  <p className="whitespace-pre-line text-gray-800">{(selectedClaim as any).resolution}</p>
                </div>
              )}

              {/* Updates / Conversation Thread — shown only after admin sends first message */}
              {currentUser && (
                <ClaimUpdates
                  claimId={(selectedClaim as any).id}
                  currentRole="detailer"
                  currentUserId={currentUser.id}
                />
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailsOpen(false)}>
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
              {/* Single column layout as requested */}
              <div className="space-y-6">
                {/* Product Information - Top Section */}
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
                                    type="button"
                                    variant="outline"
                                    onClick={handleProductLookup}
                                    disabled={isLookingUp}
                                    className="flex-shrink-0"
                                  >
                                    {isLookingUp ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Search className="h-4 w-4 mr-1" />
                                        <span>Search</span>
                                      </>
                                    )}
                                  </Button>
                                </div>
                                <FormDescription>
                                  Enter the batch number and click Search to auto-populate product details
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : null}
                        {/* Quantity input — only relevant for batch (unused) claims */}
                        {form.watch("productType") === "unused" && (
                          <FormField
                            control={form.control}
                            name="claimQuantity"
                            render={({ field }) => (
                              <FormItem className="w-28 flex-shrink-0">
                                <FormLabel>Quantity</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={1}
                                    placeholder="1"
                                    {...field}
                                    onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        {form.watch("productType") !== "unused" && (
                          <FormField
                            control={form.control}
                            name="eWarrantyNumber"
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel>e-Warranty Number</FormLabel>
                                <div className="flex space-x-2">
                                  <FormControl>
                                    <Input placeholder="Enter e-warranty number" {...field} />
                                  </FormControl>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleProductLookup}
                                    disabled={isLookingUp}
                                    className="flex-shrink-0"
                                  >
                                    {isLookingUp ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Search className="h-4 w-4 mr-1" />
                                        <span>Search</span>
                                      </>
                                    )}
                                  </Button>
                                </div>
                                <FormDescription>
                                  Enter the e-warranty number and click Search to auto-populate product details
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>

                      {/* Loading indicator for product lookup */}
                      {isLookingUp && (
                        <div className="flex items-center justify-center p-3 bg-blue-50 rounded-md border border-blue-100">
                          <Loader2 className="h-5 w-5 text-primary animate-spin mr-2" />
                          <p className="text-sm text-blue-700">Looking up product information...</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Product details display */}
                    {form.watch("productName") && (
                      <div className="rounded-md border p-4 mt-4 bg-gray-50 space-y-4">
                        {/* Product info */}
                        <div>
                          <h3 className="font-medium text-primary text-sm mb-2">Product Details</h3>
                          <div className="space-y-2 text-sm">
                            <div className="grid grid-cols-2">
                              <span className="text-gray-600 font-medium">Product Name:</span>
                              <span className="font-medium">{form.watch("productName")}</span>
                            </div>
                            <div className="grid grid-cols-2">
                              <span className="text-gray-600 font-medium">
                                {form.watch("productType") === "unused" ? "Batch Number:" : "e-Warranty Number:"}
                              </span>
                              <span className="font-medium">
                                {form.watch("productType") === "unused"
                                  ? form.watch("batchNumber")
                                  : form.watch("eWarrantyNumber")}
                              </span>
                            </div>
                            <div className="grid grid-cols-2">
                              <span className="text-gray-600 font-medium">Product Size:</span>
                              <span className="font-medium">{form.watch("productSize")}</span>
                            </div>
                            <div className="grid grid-cols-2">
                              <span className="text-gray-600 font-medium">Lot Number:</span>
                              <span className="font-medium">{form.watch("lotNumber") || "N/A"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Vehicle info (registered path) */}
                        {warrantyExtra && (warrantyExtra.vehicleMake || warrantyExtra.vehicleModel) && (
                          <div className="border-t pt-3">
                            <h3 className="font-medium text-primary text-sm mb-2">Vehicle Details</h3>
                            <div className="space-y-2 text-sm">
                              {warrantyExtra.customerName && (
                                <div className="grid grid-cols-2">
                                  <span className="text-gray-600 font-medium">Customer:</span>
                                  <span>{warrantyExtra.customerName}</span>
                                </div>
                              )}
                              {(warrantyExtra.vehicleMake || warrantyExtra.vehicleModel) && (
                                <div className="grid grid-cols-2">
                                  <span className="text-gray-600 font-medium">Car Make / Model:</span>
                                  <span>
                                    {[warrantyExtra.vehicleYear, warrantyExtra.vehicleMake, warrantyExtra.vehicleModel]
                                      .filter(Boolean).join(" ") || "N/A"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Installer info (registered path) */}
                        {warrantyExtra && (warrantyExtra.installerName || warrantyExtra.installerCity) && (
                          <div className="border-t pt-3">
                            <h3 className="font-medium text-primary text-sm mb-2">Installer Details</h3>
                            <div className="space-y-2 text-sm">
                              {warrantyExtra.installerName && (
                                <div className="grid grid-cols-2">
                                  <span className="text-gray-600 font-medium">Installer:</span>
                                  <span>{warrantyExtra.installerName}</span>
                                </div>
                              )}
                              {warrantyExtra.installerCity && (
                                <div className="grid grid-cols-2">
                                  <span className="text-gray-600 font-medium">City / Location:</span>
                                  <span>{warrantyExtra.installerCity}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Error display for product lookup */}
                    {form.formState.errors.productId && (
                      <div className="rounded-md border border-red-200 bg-red-50 p-3 mt-2">
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                          <p className="text-sm text-red-700">
                            {form.formState.errors.productId.message || "Product not found. Please check the number and try again."}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Batch (Lot) Selector — shown for registered path when multiple lots found */}
                {form.watch("productType") === "registered" && lotOptions.length > 1 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Select Batch / Lot</CardTitle>
                      <CardDescription>
                        Multiple batches are linked to this warranty. Select the batch for this claim.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="selectedSoldUnitId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Batch / Lot Number</FormLabel>
                            <Select
                              onValueChange={(val) => {
                                const id = parseInt(val, 10);
                                field.onChange(isNaN(id) ? undefined : id);
                                const chosen = lotOptions.find(l => l.soldUnitId === id);
                                if (chosen) form.setValue("lotNumber", chosen.lotNumber);
                              }}
                              value={field.value?.toString() ?? ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a batch…" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {lotOptions.filter(lot => !!lot.soldUnitId).map((lot) => (
                                  <SelectItem
                                    key={lot.soldUnitId!}
                                    value={lot.soldUnitId!.toString()}
                                  >
                                    {lot.lotNumber}
                                    {lot.quantity ? ` — ${lot.quantity}` : ""}
                                  </SelectItem>
                                ))}
                                {lotOptions.some(lot => !lot.soldUnitId) && (
                                  <div className="px-2 py-1.5 text-xs text-gray-400 border-t">
                                    Some lots have no sold-unit record and cannot be selected
                                  </div>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Issue Date */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Issue Date</CardTitle>
                    <CardDescription>Date when the issue was first noticed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="issueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="date" {...field} max={new Date().toISOString().substring(0, 10)} />
                          </FormControl>
                          <FormDescription>
                            Auto-filled from warranty installation date when available
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Auto-fetched Claim Raiser Information */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Claim Raised By</CardTitle>
                    <CardDescription>
                      Automatically populated from your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Distributor Name</h4>
                        <p className="text-sm">{form.watch("distributorName") || "Loading..."}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Detailer Name</h4>
                        <p className="text-sm">{form.watch("detailerName") || "Loading..."}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">City</h4>
                        <p className="text-sm">{form.watch("city") || "Loading..."}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Contact Number</h4>
                        <p className="text-sm">{form.watch("contactInfo") || "Loading..."}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Claim Dimensions & Area */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Claim Dimensions & Area</CardTitle>
                    <CardDescription>
                      Provide detailed measurements of the affected area
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
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
                      
                      {/* Auto-calculated area field with two-tier validation */}
                      {(() => {
                        const len = parseFloat(form.watch("problemLength"));
                        const wid = parseFloat(form.watch("problemWidth"));
                        const calcArea = !isNaN(len) && !isNaN(wid) ? len * wid : null;

                        // Determine validation state
                        let isError = false;
                        let statusMsg: ReactNode = (
                          <p className="text-sm text-muted-foreground">
                            Automatically calculated based on length × width
                          </p>
                        );

                        if (calcArea !== null) {
                          // Check 1: batch not in sold_units DB
                          if (batchFound === false) {
                            isError = true;
                            statusMsg = (
                              <p className="text-sm text-red-500 font-medium">
                                Batch not found in our records. Please contact admin to register this batch before raising a claim.
                              </p>
                            );
                          }
                          // Check 2: hard limit — exceeds remaining in sold_units (qty_sold - claimed)
                          else if (batchAvailable !== null && calcArea > batchAvailable) {
                            isError = true;
                            statusMsg = (
                              <p className="text-sm text-red-500 font-medium">
                                Only <strong>{batchAvailable} sq. ft.</strong> remaining for this warranty claim in the batch. Please reduce the dimensions.
                              </p>
                            );
                          }
                          // Check 3: soft limit — exceeds warranty card qty
                          else if (maxClaimArea !== null && calcArea > maxClaimArea) {
                            isError = true;
                            statusMsg = (
                              <p className="text-sm text-amber-600 font-medium">
                                Exceeds warranty card limit of <strong>{maxClaimArea} sq. ft.</strong>. Please reduce the dimensions.
                              </p>
                            );
                          }
                          // All OK
                          else if (batchFound === true && batchAvailable !== null) {
                            statusMsg = (
                              <p className="text-sm text-green-600">
                                Valid — {calcArea.toFixed(2)} sq. ft. of <strong>{batchAvailable} sq. ft.</strong> available in batch
                                {maxClaimArea !== null && ` (warranty card limit: ${maxClaimArea} sq. ft.)`}
                              </p>
                            );
                          }
                        }

                        return (
                          <div className="space-y-1.5">
                            <Label htmlFor="calculated-area">Claim Area (sq. ft.)</Label>
                            <Input
                              id="calculated-area"
                              disabled
                              className={isError ? "bg-red-50 border-red-400" : "bg-gray-50"}
                              value={calcArea !== null ? calcArea.toFixed(2) : ""}
                              placeholder="Auto-calculated from dimensions"
                            />
                            {statusMsg}
                          </div>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Problem Area Information */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Problem Information</CardTitle>
                    <CardDescription>
                      Specify the problem location and type
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
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
                    </div>
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
                          const allowedFiles = droppedFiles.slice(0, 5);
                          setUploadedFiles(allowedFiles);
                          form.setValue("fileUploads", allowedFiles);
                          
                          if (droppedFiles.length > 5) {
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
                      <h3 className="text-sm font-medium">Drag & drop files or click to upload</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Supported formats: JPG, PNG, GIF, HEIC, MP4, MOV
                      </p>
                      <div className="mt-4">
                        <input 
                          type="file" 
                          className="hidden" 
                          id="file-upload"
                          accept=".jpg,.jpeg,.png,.gif,.heic,.mp4,.mov"
                          multiple
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const files = Array.from(e.target.files);
                              // Limit to 5 files
                              const allowedFiles = files.slice(0, 5);
                              setUploadedFiles(allowedFiles);
                              form.setValue("fileUploads", allowedFiles);
                              
                              if (files.length > 5) {
                                toast({
                                  title: "Too many files",
                                  description: "Only the first 5 files have been selected",
                                  variant: "destructive"
                                });
                              }
                            }
                          }}
                        />
                        <label htmlFor="file-upload">
                          <Button type="button" variant="outline" size="sm" asChild>
                            <span>Select Files</span>
                          </Button>
                        </label>
                      </div>
                    </div>
                    
                    {/* File list preview */}
                    {uploadedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium">Selected Files:</h4>
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                            <div className="flex items-center space-x-2">
                              <div className="flex-shrink-0 bg-primary/10 p-2 rounded-md">
                                {file.type.startsWith('image/') ? (
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={file.name}
                                    className="h-8 w-8 object-cover rounded"
                                  />
                                ) : (
                                  <div className="h-8 w-8 flex items-center justify-center bg-gray-200 rounded">
                                    {file.type.startsWith('video/') ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                      </svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                      </svg>
                                    )}
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
                              onClick={() => {
                                const newFiles = [...uploadedFiles];
                                newFiles.splice(index, 1);
                                setUploadedFiles(newFiles);
                                form.setValue("fileUploads", newFiles);
                              }}
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
                            <FormLabel>Has the product box been opened?</FormLabel>
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
                            <FormLabel>Is the cap included?</FormLabel>
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
                    <CardTitle className="text-base">Description</CardTitle>
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
                          <FormLabel>Describe the issue in detail</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the issue in detail including when it was noticed, how it has progressed, steps taken to fix it, etc."
                              className="min-h-[150px]"
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
                      "Submit"
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
  formatDate, 
  getClaimStatusBadge,
  onViewDetails,
}: { 
  claims: any[],
  formatDate: (date: string | null) => string,
  getClaimStatusBadge: (status: string) => JSX.Element,
  onViewDetails: (claim: any) => void,
}) {
  const { data: messageCounts = {} } = useQuery<Record<number, { total: number; adminCount: number }>>({
    queryKey: ['/api/erp/claims/message-counts'],
    queryFn: async () => {
      const res = await fetch('/api/erp/claims/message-counts', { credentials: 'include' });
      return res.json();
    },
    refetchInterval: 30000,
  });

  return (
    <Card>
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
                <TableHead>Claim #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map((claim) => {
                const msgInfo = messageCounts[(claim as any).id];
                const hasAdminMsg = msgInfo && msgInfo.adminCount > 0;
                return (
                <TableRow key={claim.id} className={hasAdminMsg ? 'bg-blue-50/40 hover:bg-blue-50' : ''}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <span>{claim.claimNumber}</span>
                      {hasAdminMsg && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-100 rounded px-1.5 py-0.5 w-fit">
                          <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          {msgInfo.total} Update{msgInfo.total !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{claim.customerName}</TableCell>
                  <TableCell>
                    {claim.vehicleYear} {claim.vehicleMake} {claim.vehicleModel}
                  </TableCell>
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
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}