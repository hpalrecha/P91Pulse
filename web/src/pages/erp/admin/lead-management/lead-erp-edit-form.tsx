import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// ── ERP Lead dropdown option lists (verbatim from the live ERP Custom Field / DocType meta).
const STATUS = ["Lead", "Prospect", "Open", "Replied", "Opportunity", "Quotation", "Lost Quotation", "Interested", "Not Interested", "Converted", "Do Not Contact"];
const LEAD_TYPE = ["End User", "Client", "Channel Partner", "Consultant", "B2B"];
const EMPLOYEES = ["", "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];
const PARTNER_ASSIGN = ["Not Assigned", "Assigned"];
const VEHICLE_TYPE = ["", "Car", "Bike"];
const BODY_TYPE = ["", "Hatchback", "Sedan", "SUV", "CSUV"];
const CAR_BRAND = ["", "TATA", "MAHINDRA", "Mercedes Benz", "MARUTI SUZUKI", "HONDA", "TOYOTA", "AUDI", "MG MOTOR", "FERRARI", "HUNDAI", "RENAULT", "NISSAN", "KIA", "CADILLAC", "BENTLEY", "LAMBORGHINI", "SKODA", "BMW", "VOLKSWAGEN"];
const BIKE_TYPE = ["", "EV (Electric Vehicle)", "Moped", "Motorbike"];
const BIKE_BRAND = ["", "Hero MotoCorp", "Honda", "TVS", "Bajaj Auto", "Royal Enfield", "Yamaha", "Suzuki", "KTM", "Mahindra", "Piaggio India", "Jawa Motorcycles", "Kawasaki", "Harley-Davidson", "Triumph", "Ducati", "Benelli", "BMW Motorrad", "Husqvarna", "Okinawa", "Ather Energy", "Ampere Vehicles", "TVS iQube", "LML", "Revolt Motors", "Hero Electric", "Bounce Infinity", "Pure EV", "Ola Electric", "Komaki Electric", "Tork Motors", "Ultraviolette Automotive", "Joy e-bike", "Lectro E-Mobility", "Emflux Motors", "Detel Easy", "BGauss", "Evolet", "Kabira Mobility", "Okinawa Autotech", "Ether Energy"];

const END_USER = "End User"; // B2C lead type — hides the Organization tab/fields
const BRAND = ["", "STEK", "P91 Car Care", "P91 India", "Just Signs"]; // P91 company brands
// [Phase-1 §3] CALL_STATUS and DISPOSITION are no longer used in the Edit-ERP form
// (Call & Disposition moved to the View Lead dialog). Kept as comments for reference.
// const CALL_STATUS = ["", "RNR", "BUSY", "CALL WAITING", "ATTENDED"];
// const DISPOSITION = ["", "interested", "not interested", "opportunity", "converted", "prospect"];
const STATES = ["", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"];

type Ctrl = "text" | "textarea" | "select" | "date";
// roles: when present, only these Pulse roles see the field. freezeIfSet: read-only once ERP holds a
// value (ERP-owned). locked: always read-only (e.g. the phone number / lead key — never edited here).
type Field = { fn: string; label: string; control: Ctrl; options?: string[]; link?: boolean; roles?: string[]; freezeIfSet?: boolean; locked?: boolean };
type Tab = { id: string; title: string; b2bOnly?: boolean; fields: Field[] };

// Tabs mirror the ERP Lead doctype sections. Removed per request: the whole Qualification section,
// plus Print Language, Disabled, Unsubscribed, Blog Subscriber. Organization is B2B-only.
const TABS: Tab[] = [
  { id: "general", title: "General", fields: [
    { fn: "lead_name", label: "Full Name", control: "text" },
    { fn: "source", label: "Source", control: "text", link: true },
    { fn: "status", label: "Status", control: "select", options: STATUS },
    { fn: "type", label: "Lead Type", control: "select", options: LEAD_TYPE },
    { fn: "custom_brand", label: "Brand", control: "select", options: BRAND },
    { fn: "custom_score", label: "Score", control: "text" },
    // Campaign Name is visible only to admin & National Sales Manager.
    { fn: "campaign_name", label: "Campaign Name", control: "text", link: true, roles: ["admin", "national_sales_manager"] },
  ]},
  { id: "contact", title: "Contact Info", fields: [
    { fn: "email_id", label: "Email", control: "text" },
    // Phone is the lead's key — locked here so it can't be changed from Pulse.
    { fn: "mobile_no", label: "Mobile No", control: "text", locked: true },
    { fn: "phone", label: "Alternative Mobile Number", control: "text" },
    { fn: "website", label: "Website", control: "text" },
    { fn: "custom_customer_email_id", label: "Customer Email Id", control: "text" },
  ]},
  // [Phase-1 §3] "Call & Disposition" tab removed from Edit-ERP form — moved to View Lead dialog.
  // { id: "disposition", title: "Call & Disposition", fields: [
  //   { fn: "custom_call_status", label: "Call Status", control: "select", options: CALL_STATUS },
  //   { fn: "custom_disposition", label: "Disposition", control: "select", options: DISPOSITION },
  // ]},
  { id: "organization", title: "Organization", b2bOnly: true, fields: [
    { fn: "custom_organization_name", label: "Organization Name", control: "text" },
    { fn: "no_of_employees", label: "No of Employees", control: "select", options: EMPLOYEES },
    { fn: "annual_revenue", label: "Annual Revenue", control: "text" },
    { fn: "industry", label: "Industry", control: "text", link: true },
    { fn: "market_segment", label: "Market Segment", control: "text", link: true },
    { fn: "fax", label: "Fax", control: "text" },
  ]},
  { id: "address", title: "Address", fields: [
    { fn: "custom_pincode", label: "Pincode", control: "text" },
    { fn: "city", label: "City", control: "text" },
    { fn: "state", label: "State", control: "select", options: STATES },
    { fn: "country", label: "Country", control: "text", link: true },
  ]},
  { id: "vehicle", title: "Vehicle", fields: [
    { fn: "custom_vehicle_type", label: "Vehicle Type", control: "select", options: VEHICLE_TYPE },
    { fn: "custom_vehicle_no", label: "Vehicle No", control: "text" },
    { fn: "custom_car_brand", label: "Car Brand", control: "select", options: CAR_BRAND },
    { fn: "custom_car_model_name", label: "Car Model / Name", control: "text" },
    { fn: "custom_bike_type", label: "Bike Type", control: "select", options: BIKE_TYPE },
    { fn: "custom_bike_brand", label: "Bike Brand", control: "select", options: BIKE_BRAND },
    { fn: "custom_bike_model_name", label: "Bike Model Name", control: "text" },
  ]},
  { id: "assignment", title: "Assignment", fields: [
    { fn: "custom_sales_partner", label: "Sales Partner", control: "text", link: true },
  ]},
];

const ALL_FIELDS = TABS.flatMap((t) => t.fields);
const NONE = "__none__"; // shadcn Select can't use an empty-string value

function FieldInput({ field, value, onChange, disabled }: { field: Field; value: any; onChange: (v: any) => void; disabled?: boolean }) {
  const lockedClass = disabled ? "bg-muted cursor-not-allowed" : "";
  if (field.control === "select") {
    const opts = field.options ?? [];
    const v = value === undefined || value === null || value === "" ? NONE : String(value);
    return (
      <Select value={v} onValueChange={(val) => onChange(val === NONE ? "" : val)} disabled={disabled}>
        <SelectTrigger className={lockedClass}><SelectValue placeholder="Select" /></SelectTrigger>
        <SelectContent className="max-h-64">
          {opts.map((o) =>
            o === "" ? <SelectItem key={NONE} value={NONE}>—</SelectItem> : <SelectItem key={o} value={o}>{o}</SelectItem>,
          )}
        </SelectContent>
      </Select>
    );
  }
  if (field.control === "textarea") {
    return <Textarea rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)} readOnly={disabled} className={lockedClass} />;
  }
  if (field.control === "date") {
    return <Input type="date" value={value ? String(value).slice(0, 10) : ""} onChange={(e) => onChange(e.target.value)} readOnly={disabled} className={lockedClass} />;
  }
  return <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} readOnly={disabled} className={lockedClass} />;
}

function FieldGrid({ fields, form, set, lead, role }: { fields: Field[]; form: Record<string, any>; set: (fn: string, v: any) => void; lead: any; role?: string }) {
  // Role-gated fields (e.g. Campaign Name) are hidden for roles not in their allow-list.
  const visible = fields.filter((f) => !f.roles || (!!role && f.roles.includes(role)));
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
      {visible.map((f) => {
        // Always-locked (e.g. phone), or frozen because ERP already holds a freezeIfSet value.
        const frozen = !!f.locked || (!!f.freezeIfSet && String(lead?.[f.fn] ?? "").trim() !== "");
        return (
          <div key={f.fn} className={f.control === "textarea" ? "md:col-span-2" : ""}>
            <label className="text-xs text-muted-foreground">
              {f.label}{f.link ? <span className="ml-1 opacity-60">(link)</span> : null}
              {frozen ? <span className="ml-1 opacity-60">(locked)</span> : null}
            </label>
            <FieldInput field={f} value={form[f.fn]} onChange={(v) => set(f.fn, v)} disabled={frozen} />
          </div>
        );
      })}
    </div>
  );
}

// Tracked comment thread: shows existing ERP comments and input boxes to add new ones.
// B2B leads with a linked Prospect show two tabs for separate Lead and Prospect comment streams.
function CommentThread({
  entries,
  value,
  onChange,
  prospectValue,
  onChangeProspect,
  isB2B,
}: {
  entries: any[];
  value: string;
  onChange: (v: string) => void;
  prospectValue: string;
  onChangeProspect: (v: string) => void;
  isB2B: boolean;
}) {
  const leadComments = (entries ?? []).filter((e: any) => e?.source === "comment" && e?.doctype === "Lead");
  const prospectComments = (entries ?? []).filter((e: any) => e?.source === "comment" && e?.doctype === "Prospect");
  const otherComments = (entries ?? []).filter((e: any) => e?.source === "comment" && e?.doctype !== "Lead" && e?.doctype !== "Prospect");

  const renderFeed = (list: any[]) => (
    <div className="mt-2 max-h-44 overflow-y-auto space-y-2">
      {list.length === 0 ? (
        <p className="text-xs text-muted-foreground">No comments yet.</p>
      ) : list.map((c: any, i: number) => (
        <div key={i} className="rounded border bg-muted/30 p-2 text-sm">
          <div className="whitespace-pre-wrap">{c.detail || c.title}</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {c.who || "—"}{c.when ? ` · ${new Date(c.when).toLocaleString()}` : ""}
          </div>
        </div>
      ))}
    </div>
  );

  if (isB2B) {
    return (
      <div className="mt-4 border-t pt-3 space-y-3">
        <label className="text-sm font-medium">Comments <span className="text-xs text-muted-foreground">(tracked entries)</span></label>
        <Tabs defaultValue="lead-comm" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="lead-comm">📝 Lead Comments</TabsTrigger>
            <TabsTrigger value="prospect-comm">🏢 Prospect Comments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="lead-comm" className="mt-2 space-y-2">
            {renderFeed([...leadComments, ...otherComments])}
            <Textarea
              className="mt-2"
              rows={2}
              placeholder="Add a comment to the Lead doctype timeline..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          </TabsContent>
          
          <TabsContent value="prospect-comm" className="mt-2 space-y-2">
            {renderFeed(prospectComments)}
            <Textarea
              className="mt-2"
              rows={2}
              placeholder="Add a comment to the Prospect doctype timeline..."
              value={prospectValue}
              onChange={(e) => onChangeProspect(e.target.value)}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // B2C / general view
  return (
    <div className="mt-4 border-t pt-3">
      <label className="text-sm font-medium">Comments <span className="text-xs text-muted-foreground">(tracked — each save adds a new entry)</span></label>
      {renderFeed([...leadComments, ...prospectComments, ...otherComments])}
      <Textarea
        className="mt-2"
        rows={3}
        placeholder="Add a new comment… (saved to ERP as a tracked entry on Save)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// Full activity history for the lead — what the sales partner / team actually did: field changes,
// comments, and tasks (visits, follow-ups) with who + when. Read-only, newest first.
function ActivityTimeline({ entries }: { entries: any[] }) {
  const items = (entries ?? []).slice().sort(
    (a, b) => new Date(b?.when || 0).getTime() - new Date(a?.when || 0).getTime(),
  );
  return (
    <div className="mt-4 border-t pt-3">
      <label className="text-sm font-medium">Activity — what's happened on this lead</label>
      <div className="mt-2 max-h-60 overflow-y-auto space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">No recorded activity yet.</p>
        ) : items.map((e: any, i: number) => (
          <div key={i} className="rounded border p-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-xs uppercase tracking-wide text-muted-foreground">{e.label || e.source}</span>
              <span className="text-[11px] text-muted-foreground">{e.when ? new Date(e.when).toLocaleString() : ""}</span>
            </div>
            <div className="whitespace-pre-wrap mt-0.5">{e.title}</div>
            {e.who && <div className="text-[11px] text-muted-foreground mt-1">by {e.who}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// Read-only banner showing the REAL assignment (Opportunity + Sales Partner Assigned Lead), since the
// lead's own "Partner Assign" field is often "Not Assigned" even when a sales partner is assigned.
function AssignmentSummary({ opp, assigned }: { opp: any; assigned: any }) {
  if (!opp && !assigned) {
    return <p className="text-sm text-muted-foreground">No linked Opportunity or Sales Partner assignment found in ERP.</p>;
  }
  return (
    <div className="space-y-3">
      {assigned ? (
        <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm">
          <div className="font-medium text-blue-900">Assigned to {assigned.sales_partner || assigned.sales_partner_customer || "—"}</div>
          <div className="text-blue-800 text-xs mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {assigned.sales_partner_type && <span>Type: {assigned.sales_partner_type}</span>}
            {assigned.sales_partner_mobile_number && <span>Mobile: {assigned.sales_partner_mobile_number}</span>}
            {assigned.lead_status && <span>Lead status: {assigned.lead_status}</span>}
          </div>
          <div className="text-[10px] text-blue-700 mt-1">via Sales Partner Assigned Lead · {assigned.name}</div>
        </div>
      ) : (
        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          No Sales Partner Assigned Lead record — partner not assigned yet.
        </div>
      )}
      {opp && (
        <div className="rounded border border-gray-200 p-3 text-sm">
          <div className="font-medium flex items-center gap-2">
            Opportunity <Badge variant="outline">{opp.status}</Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
            <span>{opp.name}</span>
            {opp.sales_stage && <span>Stage: {opp.sales_stage}</span>}
            {opp.custom_brand && <span>Brand: {opp.custom_brand}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// Edit dialog that mirrors the ERP Lead doctype, organised into tabs. B2C (Lead Type = End User)
// hides the Organization tab. Saves changed fields straight to ERPNext.
export function LeadErpEditForm({
  customerId, leadName, prospectName, open, onClose,
}: { customerId: number | undefined; leadName?: string | null; prospectName?: string | null; open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const { data: me } = useQuery<any>({ queryKey: ["/api/erp/me"] });
  const role: string | undefined = me?.role;
  const { data, isLoading, isError } = useQuery<any>({
    queryKey: [`/api/erp/customers/${customerId}/erp-doc`],
    enabled: open && !!customerId,
  });
  const lead = data?.lead;
  // Tracked comment history (Version + Comment + ToDo) — we surface the Comment entries.
  const { data: activity } = useQuery<any>({
    queryKey: [`/api/erp/customers/${customerId}/activity`],
    enabled: open && !!customerId,
  });

  const [form, setForm] = useState<Record<string, any>>({});
  const [newComment, setNewComment] = useState("");
  const [newProspectComment, setNewProspectComment] = useState("");
  const [activeTab, setActiveTab] = useState("general");
  useEffect(() => {
    if (!lead) return;
    const init: Record<string, any> = {};
    for (const f of ALL_FIELDS) init[f.fn] = lead[f.fn] ?? "";
    setForm(init);
    setNewComment("");
    setNewProspectComment("");
    setActiveTab("general");
  }, [lead]);

  // Auto-fill City + State from the pincode (India Post) — only when the USER changes the pincode to a
  // new valid 6-digit value (not on initial load), so an existing city/state isn't clobbered on open.
  useEffect(() => {
    const pin = String(form.custom_pincode ?? "").trim();
    if (!/^\d{6}$/.test(pin) || pin === String(lead?.custom_pincode ?? "").trim()) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequest("GET", `/api/erp/customers/pincode/${pin}`);
        const d = await res.json();
        if (cancelled || !d || d.error) return;
        setForm((p) => ({ ...p, state: d.state || p.state, city: (d.cities?.[0]) || p.city }));
      } catch { /* best-effort */ }
    })();
    return () => { cancelled = true; };
  }, [form.custom_pincode, lead]);

  const set = (fn: string, v: any) => setForm((p) => ({ ...p, [fn]: v }));
  const isB2C = (form.type ?? lead?.type) === END_USER;
  const visibleTabs = TABS.filter((t) => !(t.b2bOnly && isB2C));
  // If the active tab gets hidden (e.g. switched to End User while on Organization), fall back.
  const effectiveTab = visibleTabs.some((t) => t.id === activeTab) ? activeTab : "general";

  const save = useMutation({
    mutationFn: async () => {
      const changed: Record<string, any> = {};
      for (const f of ALL_FIELDS) {
        // Don't write organization fields for a B2C lead.
        if (isB2C && TABS.find((t) => t.b2bOnly)?.fields.some((x) => x.fn === f.fn)) continue;
        // Don't write locked fields.
        if (f.locked) continue;
        const orig = lead?.[f.fn] ?? "";
        const cur = form[f.fn] ?? "";
        if (String(cur) !== String(orig)) changed[f.fn] = cur;
      }
      const comment = newComment.trim();
      const prospectComment = newProspectComment.trim();
      if (Object.keys(changed).length === 0 && !comment && !prospectComment) return { noop: true };
      // comment is appended to the ERP timeline (tracked); fields are written in place.
      const res = await apiRequest("PUT", `/api/erp/customers/${customerId}/erp-lead`, { fields: changed, comment, prospectComment });
      return res.json();
    },
    onSuccess: (r: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/erp/customers/${customerId}/erp-doc`] });
      queryClient.invalidateQueries({ queryKey: [`/api/erp/customers/${customerId}/activity`] });
      queryClient.invalidateQueries({ queryKey: ["/api/erp/customers"] });
      setNewComment("");
      setNewProspectComment("");
      toast({
        title: r?.noop ? "No changes" : "Saved to ERP",
        description: r?.noop ? "Nothing was modified." : "The lead was updated in ERPNext.",
      });
      onClose();
    },
    onError: (e: any) => toast({ title: "Save failed", description: String(e?.message || e), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit Lead (ERP){lead ? <Badge variant="secondary" className="ml-2">{isB2C ? "B2C" : "B2B"}</Badge> : null}
          </DialogTitle>
          <DialogDescription>Edit the linked ERP Lead — changes save straight to ERPNext.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-6">Loading the live ERP record…</p>
        ) : isError ? (
          <p className="text-sm text-muted-foreground py-6">
            Couldn't load the ERP record{leadName ? ` (${leadName})` : ""}. The API server may need to be
            restarted on the latest build, or ERPNext is unreachable.
          </p>
        ) : !lead ? (
          <p className="text-sm text-muted-foreground py-6">
            {data && data.erpReachable === false
              ? `ERP record${leadName ? ` ${leadName}` : ""} is unavailable right now — can't edit.`
              : "No ERP Lead is linked to this row, so there's nothing to edit in ERP."}
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">Live from ERPNext · {data?.resolved?.lead}</p>
            <Tabs value={effectiveTab} onValueChange={setActiveTab} className="w-full mt-2">
              <TabsList className="flex flex-wrap h-auto">
                {visibleTabs.map((t) => (
                  <TabsTrigger key={t.id} value={t.id}>{t.title}</TabsTrigger>
                ))}
              </TabsList>

              {visibleTabs.map((t) => (
                <TabsContent key={t.id} value={t.id} className="mt-4">
                  {t.id === "assignment" && (
                    <div className="mb-4">
                      <AssignmentSummary opp={data?.opportunity} assigned={data?.assignedLead} />
                    </div>
                  )}
                  <FieldGrid fields={t.fields} form={form} set={set} lead={lead} role={role} />
                  {/* [Phase-1 §3] CommentThread removed from the (now-deleted) disposition tab;
                      it is rendered once below the <Tabs> so it is always visible. */}
                  {t.id === "assignment" && (
                    <ActivityTimeline entries={activity?.erp ?? []} />
                  )}
                </TabsContent>
              ))}
            </Tabs>

            {/* [Phase-1 §3] CommentThread is now always visible below all tabs so the tracked
                comment → ERP timeline feature survives the disposition-tab removal. */}
            <CommentThread
              entries={activity?.erp ?? []}
              value={newComment}
              onChange={setNewComment}
              prospectValue={newProspectComment}
              onChangeProspect={setNewProspectComment}
              isB2B={!!prospectName}
            />

            <div className="flex justify-end gap-2 pt-4 mt-2 border-t sticky bottom-0 bg-background">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save to ERP"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
