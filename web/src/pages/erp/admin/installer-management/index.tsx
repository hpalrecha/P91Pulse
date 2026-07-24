import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Wrench, Plus, Pencil, Trash2, ChevronsUpDown, ChevronRight, ChevronDown,
  UserCheck, UserX, RefreshCw, CheckCircle, XCircle, Eye,
} from "lucide-react";

/* ------------------------------------------------------------ helpers */

function toastErr(toast: any, e: any, fallback: string) {
  const msg = String(e?.message || fallback).replace(/^\d+:\s*/, "");
  toast({ title: "Error", description: msg, variant: "destructive" });
}

interface TerritoryNode { id: string; name: string; level: string; parentId: string; children: TerritoryNode[] }
function flattenTree(nodes: TerritoryNode[], prefix: string[] = []): { value: string; label: string; level: string }[] {
  let out: { value: string; label: string; level: string }[] = [];
  for (const n of nodes || []) {
    const path = [...prefix, n.name];
    out.push({ value: n.id, label: `${path.join(" ▸ ")} (${n.level})`, level: n.level });
    if (n.children && n.children.length) out = out.concat(flattenTree(n.children, path));
  }
  return out;
}

function MultiSelect({
  options, selected, onChange, placeholder,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between font-normal">
          <span className="truncate">{selected.length ? `${selected.length} selected` : (placeholder || "Select...")}</span>
          <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="max-h-64 overflow-y-auto p-2 space-y-1">
          {options.length === 0 && <p className="text-sm text-muted-foreground px-2 py-1">No options</p>}
          {options.map((o) => (
            <label key={o.value} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent cursor-pointer text-sm">
              <Checkbox checked={selected.includes(o.value)} onCheckedChange={() => toggle(o.value)} />
              <span className="truncate">{o.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ================================================================ PAGE */

export default function InstallerManagementPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Wrench className="w-6 h-6" /> Installer Management</h1>
        <p className="text-muted-foreground mt-1">Manage installers, their coverage, and the onboarding forms they submitted.</p>
      </div>
      <Tabs defaultValue="installers">
        <TabsList>
          <TabsTrigger value="installers">Installers</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>
        <TabsContent value="installers"><InstallersTab /></TabsContent>
        <TabsContent value="applications"><ApplicationsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ============================================================ TAB 1 — LIST */

const EMPTY_FORM = { id: "", name: "", email: "", phone: "", password: "", businessName: "", city: "", state: "", businessType: "", teamSize: "", distributorId: "none" };

function InstallersTab() {
  const { toast } = useToast();
  const listQuery = useQuery<any>({ queryKey: ["/api/erp/installers"] });
  const installers: any[] = Array.isArray(listQuery.data) ? listQuery.data : [];
  const parentsQuery = useQuery<any>({ queryKey: ["/api/erp/installer-parents"] });
  const parents: any[] = Array.isArray(parentsQuery.data) ? parentsQuery.data : [];

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState<any | null>(null); // add/edit form state (null = closed)
  const [assignTarget, setAssignTarget] = useState<any | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/erp/installers"] });

  const createOrUpdate = useMutation({
    mutationFn: async (f: any) => {
      const body: any = {
        name: f.name, email: f.email, phone: f.phone, role: "installer",
        businessName: f.businessName, city: f.city, state: f.state,
        businessType: f.businessType, teamSize: f.teamSize,
        distributorId: f.distributorId === "none" ? "" : f.distributorId,
      };
      if (f.id) return (await apiRequest("PUT", `/api/erp/users/${f.id}`, body)).json();
      body.password = f.password;
      return (await apiRequest("POST", "/api/erp/users/create", body)).json();
    },
    onSuccess: () => { invalidate(); setForm(null); toast({ title: "Installer saved" }); },
    onError: (e) => toastErr(toast, e, "Save failed"),
  });
  const action = useMutation({
    mutationFn: async ({ id, act }: { id: string; act: string }) =>
      (await apiRequest("POST", `/api/erp/users/${id}/${act}`)).json(),
    onSuccess: () => { invalidate(); toast({ title: "Updated" }); },
    onError: (e) => toastErr(toast, e, "Action failed"),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => (await apiRequest("DELETE", `/api/erp/users/${id}`)).json(),
    onSuccess: () => { invalidate(); toast({ title: "Installer deleted" }); },
    onError: (e) => toastErr(toast, e, "Delete failed"),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Installers</CardTitle>
          <CardDescription>Role-installer users, enriched with ERP Sales Partner data.</CardDescription>
        </div>
        <Button size="sm" onClick={() => setForm({ ...EMPTY_FORM })}><Plus className="w-4 h-4 mr-1" /> Add Installer</Button>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>City / State</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Brands</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.isLoading && <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-6">Loading…</TableCell></TableRow>}
              {!listQuery.isLoading && installers.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-6">No installers yet.</TableCell></TableRow>}
              {installers.map((u) => (
                <>
                  <TableRow key={u.id}>
                    <TableCell>
                      <button className="p-0.5" onClick={() => setExpanded((s) => ({ ...s, [u.id]: !s[u.id] }))} aria-label="expand">
                        {expanded[u.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.email || u.phone}</div>
                    </TableCell>
                    <TableCell>{u.businessName || "—"}</TableCell>
                    <TableCell>{[u.city, u.state].filter(Boolean).join(", ") || "—"}</TableCell>
                    <TableCell>{u.parentName || "—"}</TableCell>
                    <TableCell>{u.spBrands || u.brand || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={u.status === "approved" ? "default" : u.status === "pending" ? "outline" : "secondary"}>{u.status}</Badge>
                      {!u.isActive && <Badge variant="secondary" className="ml-1">disabled</Badge>}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Edit"
                        onClick={() => setForm({ id: u.id, name: u.name, email: u.email, phone: u.phone, password: "", businessName: u.businessName, city: u.city, state: u.state, businessType: u.businessType, teamSize: u.teamSize, distributorId: u.parentId || "none" })}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title={u.isActive ? "Disable" : "Enable"}
                        onClick={() => action.mutate({ id: u.id, act: u.isActive ? "disable" : "enable" })}>
                        {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 ml-1" onClick={() => setAssignTarget(u)}>Assign</Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600" title="Delete" onClick={() => remove.mutate(u.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expanded[u.id] && (
                    <TableRow key={u.id + "-d"}>
                      <TableCell></TableCell>
                      <TableCell colSpan={7}>
                        <div className="text-sm grid grid-cols-2 md:grid-cols-4 gap-2 py-2">
                          <Detail label="Business name" value={u.businessName} />
                          <Detail label="Business type" value={u.businessType} />
                          <Detail label="Team size" value={u.teamSize} />
                          <Detail label="Brand (form)" value={u.brand} />
                          <Detail label="ERP territory" value={u.spTerritory} />
                          <Detail label="Pincodes covered" value={u.pincodeCount != null ? String(u.pincodeCount) : ""} />
                          <Detail label="ERP brands" value={u.spBrands} />
                          <Detail label="Phone" value={u.phone} />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Add / Edit form */}
      <InstallerFormDialog form={form} parents={parents} onClose={() => setForm(null)} onSave={(f) => createOrUpdate.mutate(f)} saving={createOrUpdate.isPending} />

      {/* Assign parent + coverage */}
      <AssignDialog user={assignTarget} parents={parents} onClose={() => setAssignTarget(null)} />
    </Card>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div>{value || "—"}</div>
    </div>
  );
}

function InstallerFormDialog({
  form, parents, onClose, onSave, saving,
}: { form: any | null; parents: any[]; onClose: () => void; onSave: (f: any) => void; saving: boolean }) {
  const [f, setF] = useState<any>(form || EMPTY_FORM);
  useEffect(() => { setF(form || EMPTY_FORM); }, [form]);
  const isEdit = !!form?.id;
  const set = (k: string, v: string) => setF((s: any) => ({ ...s, [k]: v }));
  const valid = f.name?.trim() && f.phone?.trim()?.length >= 10 && (isEdit || (f.password?.length ?? 0) >= 6);

  return (
    <Dialog open={!!form} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Installer" : "Add Installer"}</DialogTitle>
          <DialogDescription>Role is set to installer. Business fields are saved to the onboarding profile.</DialogDescription>
        </DialogHeader>
        {form && (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Name *</Label><Input value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div><Label>Phone *</Label><Input value={f.phone} onChange={(e) => set("phone", e.target.value)} /></div>
            <div><Label>Email</Label><Input value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
            {!isEdit && <div className="col-span-2"><Label>Password *</Label><Input type="password" value={f.password} onChange={(e) => set("password", e.target.value)} /></div>}
            <div className="col-span-2"><Label>Business name</Label><Input value={f.businessName} onChange={(e) => set("businessName", e.target.value)} /></div>
            <div><Label>City</Label><Input value={f.city} onChange={(e) => set("city", e.target.value)} /></div>
            <div><Label>State</Label><Input value={f.state} onChange={(e) => set("state", e.target.value)} /></div>
            <div><Label>Business type</Label><Input value={f.businessType} onChange={(e) => set("businessType", e.target.value)} /></div>
            <div><Label>Team size</Label><Input value={f.teamSize} onChange={(e) => set("teamSize", e.target.value)} /></div>
            <div className="col-span-2">
              <Label>Parent (detailer / distributor)</Label>
              <Select value={f.distributorId} onValueChange={(v) => set("distributorId", v)}>
                <SelectTrigger><SelectValue placeholder="No parent" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent</SelectItem>
                  {parents.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.role})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!valid || saving} onClick={() => onSave(f)}>
            {saving && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Assign parent (manager) + territory/brand coverage in one PUT.
function AssignDialog({ user, parents, onClose }: { user: any | null; parents: any[]; onClose: () => void }) {
  const { toast } = useToast();
  const open = !!user;
  const coverageQuery = useQuery<any>({
    queryKey: ["/api/erp/salesperson-coverage", user?.id],
    queryFn: async () => (await apiRequest("GET", `/api/erp/salesperson-coverage/${user.id}`)).json(),
    enabled: open,
  });
  const treeQuery = useQuery<any>({ queryKey: ["/api/erp/territory-tree"], enabled: open });
  const brandsQuery = useQuery<any>({ queryKey: ["/api/brands"], enabled: open });

  const [territory, setTerritory] = useState<string[]>([]);
  const [brand, setBrand] = useState<string[]>([]);
  const [parentUserId, setParentUserId] = useState("none");

  useEffect(() => {
    if (coverageQuery.data) {
      setTerritory(coverageQuery.data.territory || []);
      setBrand(coverageQuery.data.brand || []);
      setParentUserId(coverageQuery.data.parentUserId || "none");
    }
  }, [coverageQuery.data, user?.id]);

  const territoryOptions = useMemo(
    () => flattenTree(Array.isArray(treeQuery.data) ? treeQuery.data : []).map((n) => ({ value: n.value, label: n.label })),
    [treeQuery.data],
  );
  const brandOptions = useMemo(
    () => (Array.isArray(brandsQuery.data) ? brandsQuery.data : []).map((b: any) => ({ value: b.name, label: b.name })),
    [brandsQuery.data],
  );

  const save = useMutation({
    mutationFn: async () => (await apiRequest("PUT", `/api/erp/salesperson-coverage/${user.id}`, {
      territory, brand, customer_group: [], company: [],
      parentUserId: parentUserId === "none" ? "" : parentUserId,
    })).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/salesperson-coverage", user.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/erp/installers"] });
      toast({ title: "Coverage saved" });
      onClose();
    },
    onError: (e) => toastErr(toast, e, "Save failed"),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign — {user?.name}</DialogTitle>
          <DialogDescription>Set the manager and territory/brand coverage (empty = unrestricted on that dimension).</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div><Label className="mb-1 block">Manager (parent)</Label>
            <Select value={parentUserId} onValueChange={setParentUserId}>
              <SelectTrigger><SelectValue placeholder="No manager" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No manager</SelectItem>
                {parents.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.role})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label className="mb-1 block">Territory nodes</Label>
            <MultiSelect options={territoryOptions} selected={territory} onChange={setTerritory} placeholder="Any territory" />
          </div>
          <div><Label className="mb-1 block">Brands</Label>
            <MultiSelect options={brandOptions} selected={brand} onChange={setBrand} placeholder="Any brand" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ==================================================== TAB 2 — APPLICATIONS */

function ApplicationsTab() {
  const { toast } = useToast();
  const appsQuery = useQuery<any>({ queryKey: ["/api/erp/installer-applications"] });
  const apps: any[] = Array.isArray(appsQuery.data) ? appsQuery.data : [];
  const [detail, setDetail] = useState<any | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/erp/installer-applications"] });
  const decide = useMutation({
    mutationFn: async ({ id, act }: { id: string; act: string }) =>
      (await apiRequest("POST", `/api/erp/users/${id}/${act}`)).json(),
    onSuccess: (_d, v) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["/api/erp/installers"] });
      toast({ title: v.act === "approve" ? "Approved" : "Rejected" });
      setDetail(null);
    },
    onError: (e) => toastErr(toast, e, "Action failed"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Applications</CardTitle>
        <CardDescription>Onboarding forms installers submitted (pending shown first).</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appsQuery.isLoading && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">Loading…</TableCell></TableRow>}
              {!appsQuery.isLoading && apps.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  No installer applications yet. When an installer completes the onboarding form (invite signup), it will appear here for review.
                </TableCell></TableRow>
              )}
              {apps.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.businessName || a.name || "—"}</TableCell>
                  <TableCell>
                    <div>{a.name}</div>
                    <div className="text-xs text-muted-foreground">{a.email || a.phone}</div>
                  </TableCell>
                  <TableCell>{[a.city, a.state].filter(Boolean).join(", ") || "—"}</TableCell>
                  <TableCell>{a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : "—"}</TableCell>
                  <TableCell><Badge variant={a.status === "pending" ? "outline" : a.status === "approved" ? "default" : "secondary"}>{a.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="View" onClick={() => setDetail(a)}><Eye className="w-3.5 h-3.5" /></Button>
                    {a.status === "pending" && (
                      <>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600" title="Approve" onClick={() => decide.mutate({ id: a.id, act: "approve" })}><CheckCircle className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600" title="Reject" onClick={() => decide.mutate({ id: a.id, act: "reject" })}><XCircle className="w-3.5 h-3.5" /></Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* application detail */}
      <Dialog open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Application — {detail?.businessName || detail?.name}</DialogTitle></DialogHeader>
          {detail && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="Name" value={detail.name} />
              <Detail label="Status" value={detail.status} />
              <Detail label="Email" value={detail.email} />
              <Detail label="Phone" value={detail.phone} />
              <Detail label="Business name" value={detail.businessName} />
              <Detail label="Business type" value={detail.businessType} />
              <Detail label="City" value={detail.city} />
              <Detail label="State" value={detail.state} />
              <Detail label="Postal code" value={detail.postalCode} />
              <Detail label="Brand" value={detail.brand} />
              <Detail label="Team size" value={detail.teamSize} />
              <Detail label="Place" value={detail.placeName} />
              <Detail label="Source" value={detail.onboardSource} />
              <Detail label="Submitted" value={detail.submittedAt ? new Date(detail.submittedAt).toLocaleString() : ""} />
            </div>
          )}
          <DialogFooter>
            {detail?.status === "pending" && (
              <>
                <Button variant="outline" className="text-red-600" onClick={() => decide.mutate({ id: detail.id, act: "reject" })}>Reject</Button>
                <Button onClick={() => decide.mutate({ id: detail.id, act: "approve" })}>Approve</Button>
              </>
            )}
            <Button variant="outline" onClick={() => setDetail(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
