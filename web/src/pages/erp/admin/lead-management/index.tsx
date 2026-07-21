import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, keepPreviousData } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Users, Search, Filter, Download, Eye, Edit, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { InfoDot } from "@/components/dev/InfoDot";
import { LeadErpEditForm } from "./lead-erp-edit-form";
import GooglePlacesAutocomplete, { type PlaceDetails } from "@/components/google-places-autocomplete";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

// Form schemas
// [Phase-1 §4+§5] New field order: Name → Phone → Email → Brand → User Type → Location → conditional.
// userTypeCategory: "b2c" | "b2b" — the top-level B2C/B2B selector.
// userType: the actual downstream type sent to the backend (end_user | detailer | distributor | installer).
// Location: Google place OR manual (state+pincode). For B2B, Google place is required.
const createLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email().optional().or(z.literal("")),
  brand: z.string().optional(),
  // [Phase-1 §4] B2C/B2B selector — replaces the raw "end_user/detailer/..." dropdown.
  userTypeCategory: z.enum(["b2c", "b2b"]).default("b2c"),
  userType: z.enum(["end_user", "detailer", "distributor", "installer"]).optional(),
  // [Phase-1 §5] Google location fields (filled by GooglePlacesAutocomplete).
  googlePlaceId: z.string().optional(),
  formattedAddress: z.string().optional(),
  googleCity: z.string().optional(),
  googleState: z.string().optional(),
  googlePostalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  // Manual fallback (B2C only — shown when no Google place chosen).
  state: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode").optional().or(z.literal("")),
  city: z.string().optional(),
  // B2C-only conditional fields.
  lead_type: z.enum(["hot", "warm", "cold"]).optional(),
  vehicleBrand: z.string().optional(),
  vehicleModel: z.string().optional(),
  comments: z.string().optional(),
  // Assignment (all types).
  detailerId: z.string().optional(),
  distributorId: z.string().optional(),
  leadSource: z.string().optional(),
  // Misc (kept for API compat).
  vehicle: z.string().optional(),
  external_id: z.string().optional(),
  external_source: z.string().optional(),
  alternatePhone: z.string().optional().or(z.literal("")),
  // [Phase-1 §3] callStatus/disposition removed from Create — use the View Lead "Call & Disposition" tab.
}).superRefine((val, ctx) => {
  const hasGoogle = !!val.googlePlaceId;
  if (val.userTypeCategory === "b2b" && !hasGoogle) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Google location is required for B2B leads", path: ["googlePlaceId"] });
  }
  if (val.userTypeCategory === "b2c" && !hasGoogle) {
    // B2C manual fallback: require state + pincode if no Google place.
    if (!val.state) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "State is required (or use Google location)", path: ["state"] });
    if (!val.pincode) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Pincode is required (or use Google location)", path: ["pincode"] });
  }
});

type CreateLeadData = z.infer<typeof createLeadSchema>;

// ERP Lead doctype → grouped, labelled fields (mirrors the ERP "Details" tab sections).
const ERP_FIELD_GROUPS: { title: string; fields: [string, string][] }[] = [
  { title: "Status & Type", fields: [
    ["status", "Status"], ["type", "Lead Type"], ["custom_lead_status", "Partner Assign"],
    ["custom_customer_group", "Customer Group"], ["custom_score", "Score"],
    ["source", "Source"], ["custom_brand", "Brand"], ["custom_sampling_status", "Sampling Status"],
  ]},
  { title: "Contact", fields: [
    ["mobile_no", "Mobile"], ["phone", "Phone"], ["whatsapp_no", "WhatsApp"],
    ["email_id", "Email"], ["website", "Website"],
  ]},
  { title: "Partner & Territory", fields: [
    ["custom_sales_partner_customer", "Sales Partner Customer"], ["territory", "Territory"],
    ["sales_partner", "Sales Partner"], ["custom_sales_partner_email", "Sales Partner Email"],
  ]},
  { title: "Organization", fields: [
    ["company_name", "Organization Name"], ["no_of_employees", "No. of Employees"],
    ["annual_revenue", "Annual Revenue"], ["industry", "Industry"], ["market_segment", "Market Segment"],
  ]},
  { title: "Address", fields: [
    ["custom_pincode", "Pincode"], ["city", "City"], ["state", "State"], ["country", "Country"],
  ]},
  { title: "Qualification", fields: [
    ["qualification_status", "Qualification Status"], ["qualified_by", "Qualified By"], ["qualified_on", "Qualified On"],
  ]},
  { title: "Vehicle", fields: [
    ["custom_vehicle_type", "Vehicle Type"], ["custom_body_type", "Body Type"],
    ["custom_car_brand", "Car Brand"], ["custom_car_model_name", "Car Model"],
    ["custom_bike_type", "Bike Type"], ["custom_bike_brand", "Bike Brand"], ["custom_bike_model_name", "Bike Model"],
  ]},
  { title: "Remarks", fields: [["custom_remarks", "Remarks"]] },
  { title: "Meta", fields: [
    ["owner", "Created By (ERP)"], ["creation", "Created"], ["modified", "Last Modified"], ["modified_by", "Modified By"],
  ]},
];

// "Show everything": the full ERP Lead document, live-fetched, grouped to mirror the ERP tabs.
function LeadErpDoc({ customerId, open }: { customerId: number; open: boolean }) {
  const { data, isLoading } = useQuery<any>({
    queryKey: [`/api/erp/customers/${customerId}/erp-doc`],
    enabled: open && !!customerId,
  });

  if (isLoading) return <p className="text-sm text-muted-foreground py-2">Loading full ERP record…</p>;
  const lead = data?.lead;
  if (!lead) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        {data && data.erpReachable === false ? "Live ERP record unavailable for this lead." : "No ERP record found."}
      </p>
    );
  }

  // Only blank/null counts as "unset" — a real 0 (e.g. score 0) must still show.
  const show = (v: any) => (v === null || v === undefined || v === "" ? "" : String(v));
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Live from ERPNext · {data?.resolved?.lead}
        {data?.resolved?.opportunity ? ` · Opp ${data.resolved.opportunity}` : ""}
      </p>
      {ERP_FIELD_GROUPS.map((g) => {
        const rows = g.fields
          .map(([f, label]) => [label, show(lead[f])] as [string, string])
          .filter(([, v]) => v !== "");
        if (rows.length === 0) return null;
        return (
          <div key={g.title}>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{g.title}</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {rows.map(([label, v]) => (
                <div key={label} className={g.title === "Remarks" ? "col-span-2" : ""}>
                  <span className="text-xs text-muted-foreground">{label}: </span>
                  <span className="text-sm break-words">{v}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Tracks tab: live ERP activity (Version/Comment/ToDo) merged with Pulse lead_history.
// Fetched on demand (only while the View dialog is open) so it's always fresh.
function LeadTracks({ customerId, open }: { customerId: number; open: boolean }) {
  const { data, isLoading } = useQuery<any>({
    queryKey: [`/api/erp/customers/${customerId}/activity`],
    enabled: open && !!customerId,
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-4">Loading activity from ERP…</p>;
  }

  const all: any[] = [...(data?.erp ?? []), ...(data?.local ?? [])]
    .sort((a, b) => String(b.when || "").localeCompare(String(a.when || "")));

  if (all.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No activity found{data && data.erpReachable === false ? " — ERP history unavailable for this lead" : ""}.
      </p>
    );
  }

  const fmt = (w: string | null) => {
    if (!w) return "";
    const d = new Date(String(w).replace(" ", "T"));
    return isNaN(d.getTime()) ? String(w) : d.toLocaleString();
  };
  const chipColor = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes("assign")) return "bg-blue-100 text-blue-800";
    if (l.startsWith("task")) return "bg-amber-100 text-amber-800";
    if (l.includes("change")) return "bg-purple-100 text-purple-800";
    if (l.includes("event")) return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
      {all.map((e: any, i: number) => (
        <div key={i} className="flex gap-3 border-l-2 border-gray-200 pl-3 py-1">
          <div className="w-32 shrink-0 text-xs text-muted-foreground">{fmt(e.when)}</div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={chipColor(e.label)}>{e.label}</Badge>
              {e.doctype && (
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{e.doctype}</span>
              )}
            </div>
            <p className="text-sm break-words mt-0.5">{e.title}</p>
            {e.who && <p className="text-xs text-muted-foreground">by {e.who}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminLeadManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterLeadType, setFilterLeadType] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterCustomerGroup, setFilterCustomerGroup] = useState("all");
  const [filterTerritory, setFilterTerritory] = useState("all");
  const [filterCreatedBy, setFilterCreatedBy] = useState("all");
  const [filterCallStatus, setFilterCallStatus] = useState("all"); // RNR / BUSY / CALL WAITING / ATTENDED
  const [filterAssignment, setFilterAssignment] = useState("all"); // all | assigned | unassigned
  const [brandArm, setBrandArm] = useState<"all" | "p91cc" | "others">("all"); // P91 CC is a separate B2C arm
  // [Phase-1 §1] showAll state removed — clean view always on (hardcoded showAll:"0" in leadParams).
  // [Phase-1 §1] groupByBusiness state removed — toggle button removed; can restore in Phase 2.
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  // States for B2B Task & Event forms
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [taskAllocatedTo, setTaskAllocatedTo] = useState("");

  const [eventSubject, setEventSubject] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventStartsOn, setEventStartsOn] = useState("");
  const [eventEndsOn, setEventEndsOn] = useState("");
  const [eventType, setEventType] = useState("Private");

  // Debounce the search box so typing doesn't refetch on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const [filterLeadCategory, setFilterLeadCategory] = useState("all");
  const [filterB2bCategory, setFilterB2bCategory] = useState("all");

  const PAGE_SIZE = 50;
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1); // back to page 1 whenever a filter/search changes
  }, [debouncedSearch, filterStatus, filterLeadType, filterBrand, filterCustomerGroup,
      filterTerritory, filterCreatedBy, filterCallStatus, filterAssignment, brandArm,
      filterLeadCategory, filterB2bCategory]);

  // Server-side paged + filtered + de-duped list. The server ships ONE page (~50 rows) + facets +
  // stats instead of all ~42k rows, so the tab loads fast. keepPreviousData keeps the current page
  // visible while the next one loads.
  const leadParams = new URLSearchParams({
    paged: "1", page: String(page), pageSize: String(PAGE_SIZE),
    showAll: "0", // [Phase-1 §1] always clean view (test/dupe rows hidden); user toggle removed
    arm: brandArm, assignment: filterAssignment,
  });
  if (debouncedSearch) leadParams.set("search", debouncedSearch);
  if (filterLeadCategory !== "all") leadParams.set("leadCategory", filterLeadCategory);
  if (filterLeadCategory === "b2b" && filterB2bCategory !== "all") {
    leadParams.set("customerGroup", filterB2bCategory);
  } else if (filterCustomerGroup && filterCustomerGroup !== "all") {
    leadParams.set("customerGroup", filterCustomerGroup);
  }

  ([["status", filterStatus], ["leadType", filterLeadType], ["brand", filterBrand],
    ["territory", filterTerritory], ["createdBy", filterCreatedBy],
    ["callStatus", filterCallStatus]] as const).forEach(([k, v]) => {
    if (v && v !== "all") leadParams.set(k, v);
  });
  const leadsUrl = `/api/erp/customers?${leadParams.toString()}`;

  const { data: leadResp, isLoading, isFetching } = useQuery<any>({
    queryKey: [leadsUrl],
    placeholderData: keepPreviousData,
  });

  const leads: any[] = leadResp?.rows ?? [];
  const facets: Record<string, { value: string; count: number }[]> = leadResp?.facets ?? {};
  const stats = leadResp?.stats ?? { total: 0, new: 0, contacted: 0, qualified: 0, converted: 0 };
  const total: number = leadResp?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const facetValues = (k: string) => (facets[k] || []).map((f) => f.value);
  const statusOptions = facetValues("status");
  const leadTypeOptions = facetValues("leadType");
  const brandOptions = facetValues("brand");
  const customerGroupOptions = facetValues("customerGroup");
  const territoryOptions = facetValues("territory");
  const createdByOptions = facetValues("createdBy");
  const armCounts = (() => {
    const p91cc = (facets.customerGroup || []).filter((f) => f.value === "P91 Car Care")
      .reduce((a, f) => a + f.count, 0);
    return { all: stats.total, p91cc, others: Math.max(0, stats.total - p91cc) };
  })();

  // [Phase-1 §1] "Group by business" (businessGroups) is removed. The memo is commented out to avoid
  // an unused-var error; it can be restored in Phase 2 when the B2B grouping feature is revisited.
  /*
  const businessGroups = useMemo(() => {
    const map = new Map<string, any[]>();
    const solo: any[] = [];
    for (const l of leads) {
      const b = String(l?.prospectName || "").trim();
      if (b) { if (!map.has(b)) map.set(b, []); map.get(b)!.push(l); }
      else solo.push(l);
    }
    return { groups: Array.from(map.entries()), solo };
  }, [leads]);
  */

  // Fetch users for assignment
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/erp/users"],
  });

  // Vehicle brand/model options (from Vehicle Management) + call-status constants.
  const { data: vehicleBrands = [] } = useQuery<any[]>({ queryKey: ["/api/erp/vehicle-management/brands"] });
  const { data: vehicleModels = [] } = useQuery<any[]>({ queryKey: ["/api/erp/vehicle-management/models"] });
  const CALL_STATUS_OPTIONS = ["RNR", "BUSY", "CALL WAITING", "ATTENDED"];
  const LEAD_BRAND_OPTIONS = ["STEK", "P91 Car Care", "P91 India", "Just Signs"];
  const DISPOSITION_OPTIONS = ["interested", "not interested", "opportunity", "converted", "prospect"];

  // Current user — fetched early because it drives B2B sub-type options and role-based field visibility.
  // NOTE: the const below (canEditLocation/canEditDisposition) is computed again after the form setup
  // using the same query result; useQuery deduplicates so no extra network call is made.
  const { data: currentUser } = useQuery<any>({ queryKey: ["/api/erp/me"] });

  const form = useForm<CreateLeadData>({
    // This form is now Create-only; the Edit dialog is the separate ERP-mirrored LeadErpEditForm.
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      brand: undefined,
      userTypeCategory: "b2c",
      userType: "end_user",
      lead_type: "warm",
      city: "",
      state: "",
      pincode: "",
    },
  });

  // [Phase-1 §5] Google location state — tracks the selected place from GooglePlacesAutocomplete.
  const [googlePlace, setGooglePlace] = useState<PlaceDetails | null>(null);

  // [Phase-1 §4] Watch the B2C/B2B category to show/hide conditional fields.
  const userTypeCategory = form.watch("userTypeCategory");
  const isB2C = userTypeCategory !== "b2b";

  // [Phase-1 §4] B2B sub-type options — role-scoped (one level down in the hierarchy).
  // distributor → [detailer]; nsm|rsm|salesperson → [distributor, detailer]; admin → all.
  const b2bSubtypeOptions: { value: string; label: string }[] = useMemo(() => {
    const role = currentUser?.role;
    if (role === "admin") return [
      { value: "distributor", label: "Distributor" },
      { value: "detailer", label: "Detailer" },
      { value: "installer", label: "Installer" },
    ];
    if (["national_sales_manager", "regional_sales_manager", "salesperson"].includes(role)) return [
      { value: "distributor", label: "Distributor" },
      { value: "detailer", label: "Detailer" },
    ];
    if (role === "distributor") return [{ value: "detailer", label: "Detailer" }];
    return [{ value: "detailer", label: "Detailer" }]; // fallback
  }, [currentUser?.role]);

  // Vehicle model dropdown depends on the selected vehicle brand.
  const activeVehicleBrands = useMemo(
    () => (vehicleBrands as any[]).filter((b: any) => b.isActive !== false)
      .sort((a: any, b: any) => String(a.name).localeCompare(String(b.name))),
    [vehicleBrands],
  );
  const selectedVehicleBrandName = form.watch("vehicleBrand");
  const modelsForSelectedBrand = useMemo(() => {
    const brand = activeVehicleBrands.find((b: any) => b.name === selectedVehicleBrandName);
    if (!brand) return [];
    return (vehicleModels as any[]).filter((m: any) => m.brandId === brand.id && m.isActive !== false)
      .sort((a: any, b: any) => String(a.name).localeCompare(String(b.name)));
  }, [activeVehicleBrands, vehicleModels, selectedVehicleBrandName]);

  // [Phase-1 §5] Pincode auto-fill (manual fallback only — B2C without Google place).
  // Also attempts to resolve territory from the Pulse pincode_territory table.
  const pincodeValue = form.watch("pincode");
  useEffect(() => {
    const pin = (pincodeValue || "").trim();
    if (!/^\d{6}$/.test(pin)) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await apiRequest("GET", `/api/erp/pincode/${pin}`);
        const data = await res.json();
        if (cancelled) return;
        if (data?.state) form.setValue("state", data.state);
        if (data?.cities?.[0] && !form.getValues("city")) form.setValue("city", data.cities[0]);
      } catch {
        /* ignore lookup failures — user can pick manually */
      }
    }, 500);
    return () => { cancelled = true; clearTimeout(t); };
  }, [pincodeValue]);

  // Relative "x ago" label for activity timestamps.
  const timeAgo = (dateStr?: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const secs = Math.floor((Date.now() - d.getTime()) / 1000);
    if (secs < 45) return "just now";
    let v = secs / 60;
    if (v < 60) return `${Math.floor(v)} minute${Math.floor(v) === 1 ? "" : "s"} ago`;
    v /= 60;
    if (v < 24) return `${Math.floor(v)} hour${Math.floor(v) === 1 ? "" : "s"} ago`;
    v /= 24;
    if (v < 30) return `${Math.floor(v)} day${Math.floor(v) === 1 ? "" : "s"} ago`;
    const months = Math.floor(v / 30);
    if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
    return `${Math.floor(months / 12)} year${Math.floor(months / 12) === 1 ? "" : "s"} ago`;
  };

  // id → user, to resolve activity authors.
  const usersById = useMemo(() => {
    const m = new Map<number, any>();
    (users as any[]).forEach((u: any) => m.set(u.id, u));
    return m;
  }, [users]);

  // Activity / notes thread for the lead open in the View dialog (what the assignee logged).
  const { data: leadActivity = [] } = useQuery<any[]>({
    queryKey: ["/api/erp/customers", selectedLead?.id, "comments"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/erp/customers/${selectedLead.id}/comments`);
      return res.json();
    },
    enabled: isViewDialogOpen && !!selectedLead?.id,
  });

  // Role-based field visibility — derived from currentUser (fetched earlier before the form setup).
  // Brand + location editable only by admin/NSM/RSM; frozen (read-only) for others.
  const canEditLocation = ["admin", "national_sales_manager", "regional_sales_manager"].includes(currentUser?.role);
  // Call status + disposition editable by admin and the sales roles.
  const canEditDisposition = ["admin", "national_sales_manager", "regional_sales_manager", "distributor", "detailer", "installer", "salesperson"].includes(currentUser?.role);

  // "Others" free-text + add-to-catalog for the vehicle brand/model dropdowns.
  const OTHER_VALUE = "__other__";
  const [brandOther, setBrandOther] = useState(false);
  const [modelOther, setModelOther] = useState(false);
  const addBrandMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/erp/vehicle-management/brands", { name });
      return res.json();
    },
    onSuccess: (brand: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/vehicle-management/brands"] });
      form.setValue("vehicleBrand", brand.name);
      setBrandOther(false);
      toast({ title: "Brand added", description: `"${brand.name}" added to Vehicle Management` });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message || "Failed to add brand", variant: "destructive" }),
  });
  const addModelMutation = useMutation({
    mutationFn: async ({ name, brandId }: { name: string; brandId: number }) => {
      const res = await apiRequest("POST", "/api/erp/vehicle-management/models", { name, brandId });
      return res.json();
    },
    onSuccess: (model: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/vehicle-management/models"] });
      form.setValue("vehicleModel", model.name);
      setModelOther(false);
      toast({ title: "Model added", description: `"${model.name}" added to Vehicle Management` });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message || "Failed to add model", variant: "destructive" }),
  });
  const handleAddBrand = () => {
    const name = (form.getValues("vehicleBrand") || "").trim();
    if (!name) { toast({ title: "Enter a brand name first", variant: "destructive" }); return; }
    const existing = activeVehicleBrands.find((b: any) => b.name.toLowerCase() === name.toLowerCase());
    if (existing) { form.setValue("vehicleBrand", existing.name); setBrandOther(false); return; }
    addBrandMutation.mutate(name);
  };
  const handleAddModel = () => {
    const name = (form.getValues("vehicleModel") || "").trim();
    if (!name) { toast({ title: "Enter a model name first", variant: "destructive" }); return; }
    const brand = activeVehicleBrands.find((b: any) => b.name === selectedVehicleBrandName);
    if (!brand) { toast({ title: "Select/add a catalog brand first", variant: "destructive" }); return; }
    const existing = modelsForSelectedBrand.find((m: any) => m.name.toLowerCase() === name.toLowerCase());
    if (existing) { form.setValue("vehicleModel", existing.name); setModelOther(false); return; }
    addModelMutation.mutate({ name, brandId: brand.id });
  };

  const createLeadMutation = useMutation({
    mutationFn: async (data: CreateLeadData) => {
      // [Phase-1 §5] Derive location fields: prefer Google place, fall back to manual.
      const gp = googlePlace;
      const payload = {
        ...data,
        status: "new",
        detailerId: data.detailerId && data.detailerId !== "unassigned" ? Number(data.detailerId) : null,
        distributorId: data.distributorId && data.distributorId !== "unassigned" ? Number(data.distributorId) : null,
        // Google location (stored in Pulse only; territory resolved server-side from pincode).
        ...(gp ? {
          city: gp.city || data.city,
          state: gp.state || data.state,
          pincode: gp.postalCode || data.pincode,
          latitude: gp.latitude,
          longitude: gp.longitude,
          googlePlaceId: gp.placeId,
          formattedAddress: gp.formattedAddress,
        } : {}),
        // [Phase-1 §4] The userTypeCategory field is UI-only — strip it before sending.
        userTypeCategory: undefined,
        origin: "pulse-ui",
      };
      const response = await apiRequest("POST", "/api/erp/customers", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/customers"] });
      setIsCreateDialogOpen(false);
      form.reset();
      setGooglePlace(null); // clear the Google place selection
      toast({
        title: "Success",
        description: "Lead created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create lead",
        variant: "destructive",
      });
    },
  });

  // [Phase-1 §3] Disposition quick-save: updates callStatus + disposition on the Pulse row
  // (PATCH /api/erp/customers/:id). The ERP sync will pick this up on next sync cycle.
  const [dispositionEdit, setDispositionEdit] = useState<{ callStatus: string; disposition: string }>({ callStatus: "", disposition: "" });
  const updateDispositionMutation = useMutation({
    mutationFn: async ({ id, callStatus, disposition }: { id: number; callStatus: string; disposition: string }) => {
      const res = await apiRequest("PATCH", `/api/erp/customers/${id}`, { callStatus, disposition });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/customers"] });
      toast({ title: "Saved", description: "Call status and disposition updated." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message || "Failed to save disposition", variant: "destructive" }),
  });

  // B2B Task & Event creation mutations
  const createTaskMutation = useMutation({
    mutationFn: async ({ customerId, description, date, priority, allocatedTo }: { customerId: number; description: string; date: string; priority: string; allocatedTo?: string }) => {
      const res = await apiRequest("POST", `/api/erp/customers/${customerId}/tasks`, {
        description,
        date,
        priority,
        allocatedTo,
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/erp/customers/${selectedLead?.id}/activity`] });
      toast({ title: "Success", description: "Task created successfully in ERPNext." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to create task", variant: "destructive" });
    }
  });

  const createEventMutation = useMutation({
    mutationFn: async ({ customerId, subject, description, startsOn, endsOn, eventType }: { customerId: number; subject: string; description?: string; startsOn: string; endsOn: string; eventType?: string }) => {
      const res = await apiRequest("POST", `/api/erp/customers/${customerId}/events`, {
        subject,
        description,
        startsOn,
        endsOn,
        eventType,
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/erp/customers/${selectedLead?.id}/activity`] });
      toast({ title: "Success", description: "Event created successfully in ERPNext." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to create event", variant: "destructive" });
    }
  });

  // NOTE: the old partial-edit mutation (PUT /api/erp/customers/:id with a handful of Pulse columns)
  // is replaced by the ERP-mirrored <LeadErpEditForm/>, which writes the full Lead doctype straight
  // to ERPNext via PUT /api/erp/customers/:id/erp-lead. Kept commented (not deleted) for reference.
  /*
  const updateLeadMutation = useMutation({
    mutationFn: async (data: CreateLeadData & { id: number }) => {
      const { id, ...updateData } = data;
      const cleanData = {
        ...updateData,
        detailerId: updateData.detailerId && updateData.detailerId !== "unassigned" ? Number(updateData.detailerId) : null,
        distributorId: updateData.distributorId && updateData.distributorId !== "unassigned" ? Number(updateData.distributorId) : null,
      };
      const response = await apiRequest("PUT", `/api/erp/customers/${id}`, cleanData);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Update failed: ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/customers"] });
      setIsEditDialogOpen(false);
      form.reset();
      setSelectedLead(null);
      toast({ title: "Success", description: "Lead updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update lead", variant: "destructive" });
    },
  });
  */

  // O(1) user lookup so getUserName doesn't scan the whole users array for each
  // of the (up to tens of thousands of) rendered rows.
  const usersByIdRole = useMemo(() => {
    const m = new Map<string, any>();
    users.forEach((u: any) => m.set(`${u.id}|${u.role}`, u));
    return m;
  }, [users]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-800";
      case "contacted": return "bg-yellow-100 text-yellow-800";
      case "qualified": return "bg-green-100 text-green-800";
      case "converted": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getUserName = (userId: number, role: string) => {
    const user = usersByIdRole.get(`${userId}|${role}`);
    return user ? user.name : "Unassigned";
  };

  const detailers = users.filter((u: any) => (u.role === "detailer" || u.role === "installer") && u.status === "approved");
  const distributors = users.filter((u: any) => u.role === "distributor" && u.status === "approved");

  // This form is Create-only now (edits go through <LeadErpEditForm/>).
  const onSubmit = (data: CreateLeadData) => {
    createLeadMutation.mutate(data);
  };

  const handleViewLead = (lead: any) => {
    setSelectedLead(lead);
    // Seed the disposition editor with the lead's current values so the user sees the current state.
    setDispositionEdit({ callStatus: lead.callStatus || "", disposition: lead.disposition || "" });
    setIsViewDialogOpen(true);
  };

  // Edit now opens the ERP-mirrored dialog, which fetches the live Lead doc itself — no form.reset.
  const handleEditLead = (lead: any) => {
    setSelectedLead(lead);
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Management</h1>
          <p className="text-muted-foreground">
            Manage and track all customer leads across the platform
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
              <DialogDescription>
                Add a new customer lead to the system
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Row 1: Name + Phone */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter customer name" {...field} />
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
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Row 2: Email (optional) */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Row 3: Brand */}
                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LEAD_BRAND_OPTIONS.map((b) => (
                            <SelectItem key={b} value={b}>{b}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Row 4: [Phase-1 §4] User Type — B2C / B2B selector */}
                <FormField
                  control={form.control}
                  name="userTypeCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User Type *</FormLabel>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={field.value === "b2c" ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => {
                            field.onChange("b2c");
                            form.setValue("userType", "end_user");
                          }}
                        >
                          B2C — End User
                        </Button>
                        <Button
                          type="button"
                          variant={field.value === "b2b" ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => {
                            field.onChange("b2b");
                            form.setValue("userType", b2bSubtypeOptions[0]?.value as any || "detailer");
                          }}
                        >
                          B2B — Business
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* B2B sub-type dropdown — role-scoped hierarchy */}
                {!isB2C && (
                  <FormField
                    control={form.control}
                    name="userType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>B2B Customer Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select B2B type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {b2bSubtypeOptions.map((o) => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Row 5: [Phase-1 §5] Location — Google Places Autocomplete */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Location {!isB2C ? "*" : ""}
                    {isB2C && <span className="text-muted-foreground text-xs ml-1">(or enter manually below)</span>}
                  </label>
                  <GooglePlacesAutocomplete
                    value={googlePlace}
                    onChange={(place) => {
                      setGooglePlace(place);
                      if (place) {
                        // Auto-fill manual fallback fields from the Google place.
                        if (place.state) form.setValue("state", place.state);
                        if (place.postalCode) form.setValue("pincode", place.postalCode);
                        if (place.city) form.setValue("city", place.city);
                      }
                    }}
                    label=""
                    placeholder="Search location on Google Maps…"
                    required={!isB2C}
                  />
                  {form.formState.errors.googlePlaceId && (
                    <p className="text-sm text-destructive">{form.formState.errors.googlePlaceId.message}</p>
                  )}
                </div>

                {/* B2C manual fallback: State + Pincode (hidden once a Google place is chosen) */}
                {isB2C && !googlePlace && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
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
                  </div>
                )}

                {/* B2C conditional fields: Vehicle Brand/Model, Lead Type (hot/warm/cold), Comments */}
                {isB2C && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="vehicleBrand"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vehicle Brand</FormLabel>
                            {brandOther ? (
                              <div className="flex gap-2">
                                <FormControl>
                                  <Input placeholder="Enter vehicle brand" value={field.value || ""} onChange={field.onChange} />
                                </FormControl>
                                <Button type="button" size="sm" onClick={handleAddBrand} disabled={addBrandMutation.isPending}>
                                  {addBrandMutation.isPending ? "Adding..." : "Add"}
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => { setBrandOther(false); setModelOther(false); field.onChange(""); form.setValue("vehicleModel", ""); }}>List</Button>
                              </div>
                            ) : (
                              <Select
                                value={field.value || ""}
                                onValueChange={(v) => {
                                  if (v === OTHER_VALUE) { setBrandOther(true); setModelOther(false); field.onChange(""); form.setValue("vehicleModel", ""); }
                                  else { field.onChange(v); form.setValue("vehicleModel", ""); }
                                }}
                              >
                                <FormControl><SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger></FormControl>
                                <SelectContent className="max-h-72">
                                  {activeVehicleBrands.map((b: any) => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                                  <SelectItem value={OTHER_VALUE}>Others</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="vehicleModel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vehicle Model</FormLabel>
                            {(brandOther || modelOther) ? (
                              <div className="flex gap-2">
                                <FormControl>
                                  <Input placeholder="Enter vehicle model" value={field.value || ""} onChange={field.onChange} />
                                </FormControl>
                                {!brandOther && (
                                  <>
                                    <Button type="button" size="sm" onClick={handleAddModel} disabled={addModelMutation.isPending}>
                                      {addModelMutation.isPending ? "Adding..." : "Add"}
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => { setModelOther(false); field.onChange(""); }}>List</Button>
                                  </>
                                )}
                              </div>
                            ) : (
                              <Select value={field.value || ""} onValueChange={(v) => { if (v === OTHER_VALUE) { setModelOther(true); field.onChange(""); } else field.onChange(v); }} disabled={!selectedVehicleBrandName}>
                                <FormControl><SelectTrigger><SelectValue placeholder={selectedVehicleBrandName ? "Select model" : "Select a brand first"} /></SelectTrigger></FormControl>
                                <SelectContent className="max-h-72">
                                  {modelsForSelectedBrand.map((m: any) => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
                                  <SelectItem value={OTHER_VALUE}>Others</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="lead_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lead Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="hot">🔥 Hot Lead</SelectItem>
                              <SelectItem value="warm">🌤 Warm Lead</SelectItem>
                              <SelectItem value="cold">❄️ Cold Lead</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="comments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comments</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Additional notes..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {/* B2B placeholder — richer fields in Phase 2 */}
                {!isB2C && (
                  <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                    <p className="font-medium mb-0.5">B2B Lead</p>
                    <p>Customer Group and business context are derived server-side. Richer B2B/Prospect/Opportunity fields coming in Phase 2.</p>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createLeadMutation.isPending}
                  >
                    {createLeadMutation.isPending ? "Creating..." : "Create Lead"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <InfoDot widgetId="admin.leadManagement.statTotal" fallbackLabel="Total Leads" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
            <InfoDot widgetId="admin.leadManagement.statUnassigned" fallbackLabel="Unassigned leads" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{(stats as any).unassigned ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <InfoDot widgetId="admin.leadManagement.statAssigned" fallbackLabel="Assigned leads" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{(stats as any).assigned ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quotation</CardTitle>
            <InfoDot widgetId="admin.leadManagement.statQuotation" fallbackLabel="Quotation-stage leads" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{(stats as any).quotation ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Converted</CardTitle>
            <InfoDot widgetId="admin.leadManagement.statConverted" fallbackLabel="Converted leads" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.converted}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center">All Leads</span>
            <InfoDot widgetId="admin.leadManagement.table" fallbackLabel="All Leads table" />
          </CardTitle>
          <CardDescription>
            Complete list of customer leads with filtering options
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Brand arm segmentation — keep the P91 CC B2C book separate from partner-brand leads */}
          <div className="flex flex-wrap gap-2 mb-4">
            {([
              ["all", "All Brands", armCounts.all],
              ["p91cc", "P91 CC (B2C)", armCounts.p91cc],
              ["others", "Other Brands", armCounts.others],
            ] as const).map(([val, label, count]) => (
              <Button
                key={val}
                type="button"
                size="sm"
                variant={brandArm === val ? "default" : "outline"}
                onClick={() => setBrandArm(val)}
              >
                {label}
                <Badge variant="secondary" className="ml-2">{count.toLocaleString()}</Badge>
              </Button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row md:flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterLeadCategory} onValueChange={(v) => { setFilterLeadCategory(v); setFilterB2bCategory("all"); }}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Lead Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="b2c">B2C Leads</SelectItem>
                <SelectItem value="b2b">B2B Leads</SelectItem>
              </SelectContent>
            </Select>

            {filterLeadCategory === "b2b" && (
              <Select value={filterB2bCategory} onValueChange={setFilterB2bCategory}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="B2B Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All B2B Categories</SelectItem>
                  <SelectItem value="CDC">CDC</SelectItem>
                  <SelectItem value="CWS">CWS</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[170px]">
                <SelectValue placeholder="Lead status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterLeadType} onValueChange={setFilterLeadType}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Lead type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {leadTypeOptions.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterBrand} onValueChange={setFilterBrand}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brandOptions.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCustomerGroup} onValueChange={setFilterCustomerGroup}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Customer Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customer Groups</SelectItem>
                {customerGroupOptions.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterTerritory} onValueChange={setFilterTerritory}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Territory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Territories</SelectItem>
                {territoryOptions.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCreatedBy} onValueChange={setFilterCreatedBy}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Created By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Creators</SelectItem>
                {createdByOptions.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCallStatus} onValueChange={setFilterCallStatus}>
              <SelectTrigger className="w-full md:w-[170px]">
                <SelectValue placeholder="Call Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Call Status</SelectItem>
                {CALL_STATUS_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterAssignment} onValueChange={setFilterAssignment}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Assignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
            {/* [Phase-1 §1] "Clean view (no test/dupes)" toggle removed — clean view is now always on
                (showAll hardcoded to "0" in leadParams). Restore if an admin override is needed.
            <Button
              type="button"
              variant={showAll ? "secondary" : "outline"}
              onClick={() => setShowAll((v) => !v)}
              title="Toggle internal/test rows and phone-duplicate collapsing"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showAll ? "Showing all rows" : "Clean view (no test/dupes)"}
            </Button> */}
            {/* [Phase-1 §1] "Group by business" toggle removed — the groupByBusiness render block
                below is also removed. Restore in Phase 2 with the B2B grouping feature.
            <Button
              type="button"
              variant={groupByBusiness ? "default" : "outline"}
              onClick={() => setGroupByBusiness((v) => !v)}
              title="Group B2B leads under their business (Prospect)"
            >
              <Users className="h-4 w-4 mr-2" />
              {groupByBusiness ? "Grouped by business" : "Group by business"}
            </Button> */}
          </div>

          {/* Leads Table */}
          <div className="space-y-3">
            {isFetching && (
              <p className="text-xs text-muted-foreground">Updating…</p>
            )}
            {leads.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {isLoading ? "Loading…" : "No leads found matching your criteria"}
                </p>
              </div>
            ) : (
              /* [Phase-1 §1] groupByBusiness render removed — now a flat list. Phase 2 placeholder. */
              leads.map((lead: any) => {
                return (
                <div key={lead.id}>
                <Card className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{lead.name}</h3>
                          <Badge className={getStatusColor(lead.status || "new")}>
                            {lead.status || "new"}
                          </Badge>
                          {lead.lead_type && (
                            <Badge variant="outline">{lead.lead_type}</Badge>
                          )}
                          {lead.callStatus && (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200" title="Call status">
                              📞 {lead.callStatus}
                            </Badge>
                          )}
                          {lead.prospectName && (
                            <Badge variant="secondary" title="Business (Prospect)">🏢 {lead.prospectName}</Badge>
                          )}
                          {lead.dupCount > 1 && (
                            <Badge
                              variant="outline"
                              title="This phone has multiple ERP records (e.g. a Lead and its Opportunity), collapsed into one card. Toggle 'Showing all rows' to see them separately."
                            >
                              🔗 {lead.dupCount} ERP records
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Contact:</span> {lead.phone}
                            {lead.email && <span className="block">{lead.email}</span>}
                          </div>
                          <div>
                            <span className="font-medium">Location:</span> {lead.city || "Not specified"}
                            {lead.brand && <span className="block">Brand: {lead.brand}</span>}
                          </div>
                          <div>
                            <span className="font-medium">Assigned to:</span>
                            <div>
                              {lead.detailerId && (
                                <span className="block">Detailer: {getUserName(lead.detailerId, "detailer")}</span>
                              )}
                              {lead.distributorId && (
                                <span className="block">Distributor: {getUserName(lead.distributorId, "distributor")}</span>
                              )}
                              {/* ERP Sales Partner without a Pulse login yet — still show WHO owns the lead */}
                              {!lead.detailerId && !lead.distributorId && lead.assignedTo && (
                                <span className="block">Partner: {lead.assignedTo}</span>
                              )}
                              {!lead.detailerId && !lead.distributorId && !lead.assignedTo && "Unassigned"}
                            </div>
                            {lead.updatedAt && (
                              <span className="block mt-1 text-xs">Updated: {new Date(lead.updatedAt).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        {lead.comments && (
                          <p className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                            {lead.comments}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewLead(lead)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditLead(lead)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </div>
                );
              })
            )}
          </div>

          {total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, total)} of{" "}
                {total.toLocaleString()} leads
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm whitespace-nowrap">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Lead Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedLead?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="tracks">Tracks</TabsTrigger>
                <TabsTrigger value="disposition">Call &amp; Disposition</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Customer Name</h4>
                  <p className="text-base">{selectedLead.name}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Phone Number</h4>
                  <p className="text-base">{selectedLead.phone}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Email</h4>
                  <p className="text-base">{selectedLead.email || "Not provided"}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">City</h4>
                  <p className="text-base">{selectedLead.city || "Not specified"}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Status</h4>
                  <Badge className={getStatusColor(selectedLead.status || "new")}>
                    {selectedLead.status || "new"}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Lead Type</h4>
                  <p className="text-base">{selectedLead.lead_type || "Not specified"}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Brand</h4>
                  <p className="text-base">{selectedLead.brand || "Not specified"}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Vehicle</h4>
                  <p className="text-base">{selectedLead.vehicle || "Not specified"}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Vehicle Brand / Model</h4>
                  <p className="text-base">{[selectedLead.vehicleBrand, selectedLead.vehicleModel].filter(Boolean).join(" ") || "Not specified"}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Alternative Number</h4>
                  <p className="text-base">{selectedLead.alternatePhone || "Not specified"}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Lead Source</h4>
                  <p className="text-base">{selectedLead.leadSource || "Not specified"}</p>
                </div>
                {(selectedLead.external_id || selectedLead.external_source) && (
                  <>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">External ID</h4>
                      <p className="text-base text-blue-600 font-mono text-sm">{selectedLead.external_id || "N/A"}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">External Source</h4>
                      <p className="text-base">{selectedLead.external_source || "N/A"}</p>
                    </div>
                  </>
                )}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Created</h4>
                  <p className="text-base">
                    {selectedLead.createdAt ? new Date(selectedLead.createdAt).toLocaleDateString() : "Unknown"}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Assignment</h4>
                <div className="space-y-1">
                  {selectedLead.detailerId && (
                    <p className="text-sm">Detailer: {getUserName(selectedLead.detailerId, "detailer")}</p>
                  )}
                  {selectedLead.distributorId && (
                    <p className="text-sm">Distributor: {getUserName(selectedLead.distributorId, "distributor")}</p>
                  )}
                  {!selectedLead.detailerId && !selectedLead.distributorId && selectedLead.assignedTo && (
                    <p className="text-sm">Partner: {selectedLead.assignedTo} <span className="text-muted-foreground">(no Pulse login yet)</span></p>
                  )}
                  {!selectedLead.detailerId && !selectedLead.distributorId && !selectedLead.assignedTo && (
                    <p className="text-sm text-muted-foreground">Unassigned</p>
                  )}
                </div>
              </div>

              {selectedLead.comments && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Comments</h4>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedLead.comments}</p>
                </div>
              )}

              {/* Activity & Notes — the thread of what the assignee logged. */}
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Activity &amp; Notes</h4>
                {(leadActivity as any[]).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity logged yet</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {(leadActivity as any[]).map((c: any) => {
                      const author = usersById.get(c.userId);
                      return (
                        <div key={c.id} className="bg-gray-50 p-3 rounded">
                          <div className="flex justify-between items-center text-xs text-muted-foreground mb-1 gap-2">
                            <span className="font-medium">
                              {author ? author.name : `User #${c.userId}`}{author?.role ? ` · ${author.role}` : ""}
                            </span>
                            <span className="whitespace-nowrap" title={c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}>
                              {timeAgo(c.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{c.comment}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-2">All ERP fields (live)</h4>
                <LeadErpDoc customerId={selectedLead.id} open={isViewDialogOpen} />
              </div>
              </TabsContent>
              <TabsContent value="tracks" className="mt-4">
                <LeadTracks customerId={selectedLead.id} open={isViewDialogOpen} />
              </TabsContent>
              {/* [Phase-1 §3] Call & Disposition tab — moved here from the Edit-ERP form.
                  B2C leads show editable selects; B2B shows a Phase-2 placeholder. */}
              <TabsContent value="disposition" className="mt-4 space-y-4">
                {selectedLead.lead_type === "b2b" ? (
                  <div className="space-y-6">
                    <Tabs defaultValue="b2b-task" className="w-full">
                      <TabsList className="grid grid-cols-2 w-full">
                        <TabsTrigger value="b2b-task">📋 New Task</TabsTrigger>
                        <TabsTrigger value="b2b-event">📅 New Event</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="b2b-task" className="mt-4 space-y-4 border p-4 rounded-md bg-card">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Description *</label>
                          <Textarea
                            placeholder="Enter task description (e.g. Follow-up meeting, collect documents)..."
                            value={taskDesc}
                            onChange={(e) => setTaskDesc(e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium">Due Date *</label>
                            <Input
                              type="date"
                              value={taskDate}
                              onChange={(e) => setTaskDate(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium">Priority *</label>
                            <Select value={taskPriority} onValueChange={setTaskPriority}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Low">Low</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Assign To (Optional)</label>
                          <Select value={taskAllocatedTo} onValueChange={setTaskAllocatedTo}>
                            <SelectTrigger><SelectValue placeholder="Select user to assign..." /></SelectTrigger>
                            <SelectContent className="max-h-64">
                              <SelectItem value="none">Unassigned</SelectItem>
                              {users.map((u: any) => (
                                <SelectItem key={u.id} value={u.email}>{u.name} ({u.role})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            disabled={createTaskMutation.isPending || !taskDesc || !taskDate}
                            onClick={() => {
                              createTaskMutation.mutate({
                                customerId: selectedLead.id,
                                description: taskDesc,
                                date: taskDate,
                                priority: taskPriority,
                                allocatedTo: taskAllocatedTo === "none" || !taskAllocatedTo ? undefined : taskAllocatedTo,
                              }, {
                                onSuccess: () => {
                                  setTaskDesc("");
                                  setTaskDate("");
                                  setTaskAllocatedTo("");
                                }
                              });
                            }}
                          >
                            {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="b2b-event" className="mt-4 space-y-4 border p-4 rounded-md bg-card">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Subject *</label>
                          <Input
                            placeholder="Event subject (e.g. Site Visit)..."
                            value={eventSubject}
                            onChange={(e) => setEventSubject(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Description (Optional)</label>
                          <Textarea
                            placeholder="Event details..."
                            value={eventDesc}
                            onChange={(e) => setEventDesc(e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium">Starts On *</label>
                            <Input
                              type="datetime-local"
                              value={eventStartsOn}
                              onChange={(e) => setEventStartsOn(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium">Ends On *</label>
                            <Input
                              type="datetime-local"
                              value={eventEndsOn}
                              onChange={(e) => setEventEndsOn(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Event Type *</label>
                          <Select value={eventType} onValueChange={setEventType}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Private">Private</SelectItem>
                              <SelectItem value="Public">Public</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            disabled={createEventMutation.isPending || !eventSubject || !eventStartsOn || !eventEndsOn}
                            onClick={() => {
                              createEventMutation.mutate({
                                customerId: selectedLead.id,
                                subject: eventSubject,
                                description: eventDesc,
                                startsOn: eventStartsOn,
                                endsOn: eventEndsOn,
                                eventType,
                              }, {
                                onSuccess: () => {
                                  setEventSubject("");
                                  setEventDesc("");
                                  setEventStartsOn("");
                                  setEventEndsOn("");
                                }
                              });
                            }}
                          >
                            {createEventMutation.isPending ? "Creating..." : "Create Event"}
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Call Status</label>
                        {canEditDisposition ? (
                          <Select
                            value={dispositionEdit.callStatus || "__none__"}
                            onValueChange={(v) => setDispositionEdit((prev) => ({ ...prev, callStatus: v === "__none__" ? "" : v }))}
                          >
                            <SelectTrigger><SelectValue placeholder="Select call status" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">—</SelectItem>
                              {CALL_STATUS_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm bg-muted rounded px-3 py-2">{selectedLead.callStatus || "Not specified"}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Disposition</label>
                        {canEditDisposition ? (
                          <Select
                            value={dispositionEdit.disposition || "__none__"}
                            onValueChange={(v) => setDispositionEdit((prev) => ({ ...prev, disposition: v === "__none__" ? "" : v }))}
                          >
                            <SelectTrigger><SelectValue placeholder="Select disposition" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">—</SelectItem>
                              {DISPOSITION_OPTIONS.map((o) => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm bg-muted rounded px-3 py-2 capitalize">{selectedLead.disposition || "Not specified"}</p>
                        )}
                      </div>
                    </div>
                    {canEditDisposition && (
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          disabled={updateDispositionMutation.isPending}
                          onClick={() => updateDispositionMutation.mutate({
                            id: selectedLead.id,
                            callStatus: dispositionEdit.callStatus,
                            disposition: dispositionEdit.disposition,
                          })}
                        >
                          {updateDispositionMutation.isPending ? "Saving…" : "Save"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit dialog: ERP-mirrored form (mirrors the full Lead doctype, writes to ERPNext). */}
      <LeadErpEditForm
        customerId={selectedLead?.id}
        leadName={selectedLead?.erpLeadId}
        prospectName={selectedLead?.prospectName}
        open={isEditDialogOpen}
        onClose={() => { setIsEditDialogOpen(false); setSelectedLead(null); }}
      />

      {/* Old partial Edit form — superseded by <LeadErpEditForm/> above. Kept (disabled) for
          reference rather than deleted, per project preference. */}
      {false && (
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setSelectedLead(null);
          form.reset();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>
              Update lead information for {selectedLead?.name}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter customer name" {...field} />
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
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email address" {...field} />
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
                        <Input placeholder="Enter city" {...field} readOnly={!canEditLocation} className={!canEditLocation ? "bg-gray-100 cursor-not-allowed" : ""} />
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="distributorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to Distributor</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select distributor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {distributors.map((distributor: any) => (
                            <SelectItem key={distributor.id} value={distributor.id.toString()}>
                              {distributor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="detailerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to Detailer</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select detailer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {detailers.map((detailer: any) => (
                            <SelectItem key={detailer.id} value={detailer.id.toString()}>
                              {detailer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="lead_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hot">Hot Lead</SelectItem>
                          <SelectItem value="warm">Warm Lead</SelectItem>
                          <SelectItem value="cold">Cold Lead</SelectItem>
                          {/* "End User" removed — that's a User Type (field beside this), not a lead
                              temperature. Lead Type = Hot/Warm/Cold only (mirrors the Create form). */}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="userType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="end_user">End User</SelectItem>
                          <SelectItem value="detailer">Detailer</SelectItem>
                          <SelectItem value="distributor">Distributor</SelectItem>
                          <SelectItem value="installer">Installer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      {canEditLocation ? (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select brand" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LEAD_BRAND_OPTIONS.map((b) => (
                              <SelectItem key={b} value={b}>{b}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <FormControl>
                          <Input value={field.value || "Not specified"} readOnly className="bg-gray-100 cursor-not-allowed" />
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Pulse additions: alternate number, vehicle brand/model, call status, disposition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="alternatePhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alternative Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter alternative number" value={field.value || ""} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehicleBrand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Brand</FormLabel>
                      {brandOther ? (
                        <div className="flex gap-2">
                          <FormControl>
                            <Input placeholder="Enter vehicle brand" value={field.value || ""} onChange={field.onChange} />
                          </FormControl>
                          <Button type="button" size="sm" onClick={handleAddBrand} disabled={addBrandMutation.isPending}>
                            {addBrandMutation.isPending ? "Adding..." : "Add"}
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => { setBrandOther(false); setModelOther(false); field.onChange(""); form.setValue("vehicleModel", ""); }}>List</Button>
                        </div>
                      ) : (
                        <Select
                          value={field.value || ""}
                          onValueChange={(v) => {
                            if (v === OTHER_VALUE) { setBrandOther(true); setModelOther(false); field.onChange(""); form.setValue("vehicleModel", ""); }
                            else { field.onChange(v); form.setValue("vehicleModel", ""); }
                          }}
                        >
                          <FormControl><SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger></FormControl>
                          <SelectContent className="max-h-72">
                            {activeVehicleBrands.map((b: any) => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                            <SelectItem value={OTHER_VALUE}>Others</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vehicleModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Model</FormLabel>
                      {(brandOther || modelOther) ? (
                        <div className="flex gap-2">
                          <FormControl>
                            <Input placeholder="Enter vehicle model" value={field.value || ""} onChange={field.onChange} />
                          </FormControl>
                          {!brandOther && (
                            <>
                              <Button type="button" size="sm" onClick={handleAddModel} disabled={addModelMutation.isPending}>
                                {addModelMutation.isPending ? "Adding..." : "Add"}
                              </Button>
                              <Button type="button" variant="outline" size="sm" onClick={() => { setModelOther(false); field.onChange(""); }}>List</Button>
                            </>
                          )}
                        </div>
                      ) : (
                        <Select value={field.value || ""} onValueChange={(v) => { if (v === OTHER_VALUE) { setModelOther(true); field.onChange(""); } else field.onChange(v); }} disabled={!selectedVehicleBrandName}>
                          <FormControl><SelectTrigger><SelectValue placeholder={selectedVehicleBrandName ? "Select model" : "Select a brand first"} /></SelectTrigger></FormControl>
                          <SelectContent className="max-h-72">
                            {modelsForSelectedBrand.map((m: any) => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
                            <SelectItem value={OTHER_VALUE}>Others</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* [Phase-1 §3] callStatus and disposition FormFields removed from this disabled form.
                    They are no longer in createLeadSchema (removed from Create) and live in
                    the View Lead dialog's "Call & Disposition" tab instead. */}
              </div>

              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comments</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedLead(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Update Lead
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}