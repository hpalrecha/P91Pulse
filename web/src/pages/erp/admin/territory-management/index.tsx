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
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronRight, ChevronDown, ChevronsUpDown, Plus, Trash2, Pencil,
  Settings2, Search, MapPin, RefreshCw,
} from "lucide-react";

/* ---------------------------------------------------------------- types */

interface TerritoryNode {
  id: string;
  name: string;
  level: string; // national | region | state | city
  parentId: string;
  children: TerritoryNode[];
}
interface FlatNode { value: string; label: string; level: string; name: string }

/* ------------------------------------------------------------- helpers */

function flattenTree(nodes: TerritoryNode[], prefix: string[] = []): FlatNode[] {
  let out: FlatNode[] = [];
  for (const n of nodes || []) {
    const path = [...prefix, n.name];
    out.push({ value: n.id, label: path.join(" ▸ "), level: n.level, name: n.name });
    if (n.children && n.children.length) out = out.concat(flattenTree(n.children, path));
  }
  return out;
}

function toastErr(toast: any, e: any, fallback: string) {
  const msg = String(e?.message || fallback).replace(/^\d+:\s*/, "");
  toast({ title: "Error", description: msg, variant: "destructive" });
}

/* -------------------------------------------------- multi-select (checkbox list) */

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
          <span className="truncate">
            {selected.length ? `${selected.length} selected` : (placeholder || "Select...")}
          </span>
          <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="max-h-64 overflow-y-auto p-2 space-y-1">
          {options.length === 0 && (
            <p className="text-sm text-muted-foreground px-2 py-1">No options</p>
          )}
          {options.map((o) => (
            <label
              key={o.value}
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent cursor-pointer text-sm"
            >
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

export default function TerritoryManagementPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="w-6 h-6" /> Territory Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Edit the geographic tree, map pincodes to cities, and assign salesperson coverage.
        </p>
      </div>

      <Tabs defaultValue="tree">
        <TabsList>
          <TabsTrigger value="tree">Territory Tree</TabsTrigger>
          <TabsTrigger value="pincodes">Pincode Mapping</TabsTrigger>
          <TabsTrigger value="coverage">Salesperson Coverage</TabsTrigger>
        </TabsList>
        <TabsContent value="tree"><TerritoryTreeTab /></TabsContent>
        <TabsContent value="pincodes"><PincodeMappingTab /></TabsContent>
        <TabsContent value="coverage"><CoverageTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ============================================================ TAB 1 — TREE */

function TerritoryTreeTab() {
  const { toast } = useToast();
  const treeQuery = useQuery<any>({ queryKey: ["/api/erp/territory-tree"] });
  const roots: TerritoryNode[] = Array.isArray(treeQuery.data) ? treeQuery.data : [];
  const nationalRoot = useMemo(
    () => roots.find((n) => n.level === "national") || roots[0],
    [roots],
  );
  const allStates = useMemo(
    () => flattenTree(roots).filter((n) => n.level === "state"),
    [roots],
  );

  // single reusable "enter a name" dialog for add/rename actions
  const [nameDlg, setNameDlg] = useState<{ open: boolean; title: string; value: string; submit: (v: string) => void }>(
    { open: false, title: "", value: "", submit: () => {} },
  );
  const [manageRegion, setManageRegion] = useState<TerritoryNode | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/erp/territory-tree"] });

  const createNode = useMutation({
    mutationFn: async (b: { name: string; level: string; parentId?: string }) =>
      (await apiRequest("POST", "/api/erp/territory-tree", b)).json(),
    onSuccess: () => { invalidate(); toast({ title: "Node added" }); },
    onError: (e) => toastErr(toast, e, "Add failed"),
  });
  const renameNode = useMutation({
    mutationFn: async (b: { id: string; name: string }) =>
      (await apiRequest("PUT", `/api/erp/territory-tree/${b.id}`, { name: b.name })).json(),
    onSuccess: () => { invalidate(); toast({ title: "Renamed" }); },
    onError: (e) => toastErr(toast, e, "Rename failed"),
  });
  const reparentNode = useMutation({
    mutationFn: async (b: { id: string; parentId: string }) =>
      (await apiRequest("PUT", `/api/erp/territory-tree/${b.id}`, { parentId: b.parentId })).json(),
    onError: (e) => toastErr(toast, e, "Re-parent failed"),
  });
  const deleteNode = useMutation({
    mutationFn: async (id: string) =>
      (await apiRequest("DELETE", `/api/erp/territory-tree/${id}`)).json(),
    onSuccess: () => { invalidate(); toast({ title: "Deleted" }); },
    onError: (e) => toastErr(toast, e, "Delete failed (node may have children or pincodes)"),
  });

  const askName = (title: string, initial: string, submit: (v: string) => void) =>
    setNameDlg({ open: true, title, value: initial, submit });

  const onAddChild = (parent: TerritoryNode | undefined, level: string, label: string) => {
    if (!parent) { toast({ title: "No parent", description: "Create the National root first (seed).", variant: "destructive" }); return; }
    askName(`Add ${label}`, "", (name) => createNode.mutate({ name, level, parentId: parent.id }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Territory Tree</CardTitle>
          <CardDescription>National → Region → State → City. Regions group states.</CardDescription>
        </div>
        <Button size="sm" onClick={() => onAddChild(nationalRoot, "region", "Region")}>
          <Plus className="w-4 h-4 mr-1" /> Add Region
        </Button>
      </CardHeader>
      <CardContent>
        {treeQuery.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!treeQuery.isLoading && roots.length === 0 && (
          <p className="text-sm text-amber-700">
            No territories yet. Seed the tree (run cmd/mappincodes) to create the National root, states and cities.
          </p>
        )}
        <div className="space-y-1">
          {roots.map((n) => (
            <TreeNodeItem
              key={n.id}
              node={n}
              depth={0}
              onRename={(node) => askName("Rename", node.name, (name) => renameNode.mutate({ id: node.id, name }))}
              onDelete={(node) => deleteNode.mutate(node.id)}
              onAddState={(region) => onAddChild(region, "state", "State")}
              onAddCity={(state) => onAddChild(state, "city", "City")}
              onManageRegion={(region) => setManageRegion(region)}
            />
          ))}
        </div>
      </CardContent>

      {/* name dialog (add / rename) */}
      <Dialog open={nameDlg.open} onOpenChange={(o) => setNameDlg((s) => ({ ...s, open: o }))}>
        <DialogContent>
          <DialogHeader><DialogTitle>{nameDlg.title}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              autoFocus
              value={nameDlg.value}
              onChange={(e) => setNameDlg((s) => ({ ...s, value: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && nameDlg.value.trim()) {
                  nameDlg.submit(nameDlg.value.trim());
                  setNameDlg((s) => ({ ...s, open: false }));
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNameDlg((s) => ({ ...s, open: false }))}>Cancel</Button>
            <Button
              disabled={!nameDlg.value.trim()}
              onClick={() => { nameDlg.submit(nameDlg.value.trim()); setNameDlg((s) => ({ ...s, open: false })); }}
            >Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* manage-region (add/remove states) */}
      <ManageRegionDialog
        region={manageRegion}
        allStates={allStates}
        roots={roots}
        nationalRootId={nationalRoot?.id || ""}
        onClose={() => setManageRegion(null)}
        onReparent={(id, parentId) => reparentNode.mutateAsync({ id, parentId })}
        onDone={() => { queryClient.invalidateQueries({ queryKey: ["/api/erp/territory-tree"] }); setManageRegion(null); }}
      />
    </Card>
  );
}

function TreeNodeItem({
  node, depth, onRename, onDelete, onAddState, onAddCity, onManageRegion,
}: {
  node: TerritoryNode;
  depth: number;
  onRename: (n: TerritoryNode) => void;
  onDelete: (n: TerritoryNode) => void;
  onAddState: (region: TerritoryNode) => void;
  onAddCity: (state: TerritoryNode) => void;
  onManageRegion: (region: TerritoryNode) => void;
}) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = (node.children || []).length > 0;
  return (
    <div>
      <div
        className="flex items-center gap-1 py-1 rounded hover:bg-accent/50 group"
        style={{ paddingLeft: depth * 18 }}
      >
        <button className="p-0.5 shrink-0" onClick={() => setOpen((o) => !o)} aria-label="expand">
          {hasChildren ? (open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />) : <span className="w-4 inline-block" />}
        </button>
        <span className="text-sm">{node.name}</span>
        <Badge variant="outline" className="text-[10px] px-1 py-0">{node.level}</Badge>

        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100">
          {node.level === "region" && (
            <>
              <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => onAddState(node)}>+ State</Button>
              <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => onManageRegion(node)}>
                <Settings2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
          {node.level === "state" && (
            <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => onAddCity(node)}>+ City</Button>
          )}
          {node.level !== "national" && (
            <>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onRename(node)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-600" onClick={() => onDelete(node)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
      {open && hasChildren && (
        <div>
          {node.children.map((c) => (
            <TreeNodeItem
              key={c.id} node={c} depth={depth + 1}
              onRename={onRename} onDelete={onDelete}
              onAddState={onAddState} onAddCity={onAddCity} onManageRegion={onManageRegion}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ManageRegionDialog({
  region, allStates, roots, nationalRootId, onClose, onReparent, onDone,
}: {
  region: TerritoryNode | null;
  allStates: FlatNode[];
  roots: TerritoryNode[];
  nationalRootId: string;
  onClose: () => void;
  onReparent: (id: string, parentId: string) => Promise<any>;
  onDone: () => void;
}) {
  const { toast } = useToast();
  // states currently under this region (by parentId in the flat set)
  const currentlyUnder = useMemo(() => {
    if (!region) return new Set<string>();
    const set = new Set<string>();
    const walk = (nodes: TerritoryNode[]) => {
      for (const n of nodes) {
        if (n.level === "state" && n.parentId === region.id) set.add(n.id);
        if (n.children) walk(n.children);
      }
    };
    walk(roots);
    return set;
  }, [region, roots]);

  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  // reset selection when the region changes
  useEffect(() => { setSelected(Array.from(currentlyUnder)); }, [region?.id]);

  const save = async () => {
    if (!region) return;
    setSaving(true);
    try {
      const target = new Set(selected);
      const changes: Promise<any>[] = [];
      for (const st of allStates) {
        const wasUnder = currentlyUnder.has(st.value);
        const nowUnder = target.has(st.value);
        if (nowUnder && !wasUnder) changes.push(onReparent(st.value, region.id));       // add
        else if (!nowUnder && wasUnder) changes.push(onReparent(st.value, nationalRootId)); // remove → back to national
      }
      await Promise.all(changes);
      toast({ title: "Region updated", description: `${changes.length} state(s) re-parented` });
      onDone();
    } catch (e) {
      toastErr(toast, e, "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!region} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage {region?.name}</DialogTitle>
          <DialogDescription>Check the states that belong to this region. Unchecking moves a state back under National.</DialogDescription>
        </DialogHeader>
        <div className="max-h-72 overflow-y-auto space-y-1 border rounded p-2">
          {allStates.length === 0 && <p className="text-sm text-muted-foreground">No state nodes yet.</p>}
          {allStates.map((s) => (
            <label key={s.value} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent cursor-pointer text-sm">
              <Checkbox
                checked={selected.includes(s.value)}
                onCheckedChange={() =>
                  setSelected((cur) => cur.includes(s.value) ? cur.filter((x) => x !== s.value) : [...cur, s.value])
                }
              />
              <span className="truncate">{s.name}</span>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ==================================================== TAB 2 — PINCODE MAPPING */

function PincodeMappingTab() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 50;

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setOffset(0); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const listQuery = useQuery<any>({
    queryKey: [`/api/erp/pincode-territory?search=${encodeURIComponent(debounced)}&limit=${limit}&offset=${offset}`],
  });
  const treeQuery = useQuery<any>({ queryKey: ["/api/erp/territory-tree"] });
  const cityOptions = useMemo(
    () => flattenTree(Array.isArray(treeQuery.data) ? treeQuery.data : []).filter((n) => n.level === "city"),
    [treeQuery.data],
  );

  const rows: any[] = listQuery.data?.data || [];
  const total: number = listQuery.data?.total || 0;

  const [edit, setEdit] = useState<any | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [`/api/erp/pincode-territory?search=${encodeURIComponent(debounced)}&limit=${limit}&offset=${offset}`] });

  const upsert = useMutation({
    mutationFn: async (b: any) => (await apiRequest("PUT", "/api/erp/pincode-territory", b)).json(),
    onSuccess: () => { invalidate(); setEdit(null); toast({ title: "Pincode saved" }); },
    onError: (e) => toastErr(toast, e, "Save failed"),
  });
  const remove = useMutation({
    mutationFn: async (pincode: string) => (await apiRequest("DELETE", `/api/erp/pincode-territory/${pincode}`)).json(),
    onSuccess: () => { invalidate(); toast({ title: "Pincode removed" }); },
    onError: (e) => toastErr(toast, e, "Delete failed"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pincode Mapping</CardTitle>
        <CardDescription>Map each pincode to its city node ({total} total).</CardDescription>
        <div className="relative mt-2 max-w-sm">
          <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search pincode / state / city…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pincode</TableHead>
                <TableHead>State</TableHead>
                <TableHead>City</TableHead>
                <TableHead>City Node</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.isLoading && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">Loading…</TableCell></TableRow>}
              {!listQuery.isLoading && rows.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">No pincodes.</TableCell></TableRow>}
              {rows.map((r) => (
                <TableRow key={r.pincode}>
                  <TableCell className="font-mono">{r.pincode}</TableCell>
                  <TableCell>{r.state || "—"}</TableCell>
                  <TableCell>{r.city || "—"}</TableCell>
                  <TableCell>{r.cityNodeName || <span className="text-muted-foreground">unmapped</span>}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEdit({ ...r })}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600" onClick={() => remove.mutate(r.pincode)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* pager */}
        <div className="flex items-center justify-between mt-3 text-sm">
          <span className="text-muted-foreground">
            {total ? `${offset + 1}–${Math.min(offset + limit, total)} of ${total}` : "0"}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>Prev</Button>
            <Button size="sm" variant="outline" disabled={offset + limit >= total} onClick={() => setOffset(offset + limit)}>Next</Button>
          </div>
        </div>
      </CardContent>

      {/* edit dialog */}
      <Dialog open={!!edit} onOpenChange={(o) => { if (!o) setEdit(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit pincode {edit?.pincode}</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              <div><Label>Pincode</Label><Input value={edit.pincode} disabled /></div>
              <div><Label>State</Label><Input value={edit.state || ""} onChange={(e) => setEdit({ ...edit, state: e.target.value })} /></div>
              <div><Label>City</Label><Input value={edit.city || ""} onChange={(e) => setEdit({ ...edit, city: e.target.value })} /></div>
              <div>
                <Label>City Node</Label>
                <Select value={edit.cityTerritoryId || "none"} onValueChange={(v) => setEdit({ ...edit, cityTerritoryId: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Select a city node…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unmapped</SelectItem>
                    {cityOptions.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button>
            <Button
              disabled={upsert.isPending}
              onClick={() => upsert.mutate({ pincode: edit.pincode, cityTerritoryId: edit.cityTerritoryId || "", state: edit.state || "", city: edit.city || "" })}
            >Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ================================================ TAB 3 — SALESPERSON COVERAGE */

const SALES_ROLES = ["national_sales_manager", "regional_sales_manager", "asm", "salesperson"];
const ROLE_LABEL: Record<string, string> = {
  national_sales_manager: "NSM", regional_sales_manager: "RSM", asm: "ASM", salesperson: "Salesperson",
};

function CoverageTab() {
  const usersQuery = useQuery<any>({ queryKey: ["/api/erp/users"] });
  const salesUsers: any[] = (Array.isArray(usersQuery.data) ? usersQuery.data : []).filter((u: any) => SALES_ROLES.includes(u.role));
  const nameById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const u of (Array.isArray(usersQuery.data) ? usersQuery.data : [])) m[u.id] = u.name;
    return m;
  }, [usersQuery.data]);

  const [target, setTarget] = useState<any | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Salesperson Coverage</CardTitle>
        <CardDescription>Assign territory nodes, brands, customer groups, company, and a manager.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Territories</TableHead>
                <TableHead>Brands</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersQuery.isLoading && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">Loading…</TableCell></TableRow>}
              {!usersQuery.isLoading && salesUsers.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">No sales users.</TableCell></TableRow>}
              {salesUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name}</TableCell>
                  <TableCell><Badge variant="outline">{ROLE_LABEL[u.role] || u.role}</Badge></TableCell>
                  <CoverageCountCells userId={u.id} />
                  <TableCell>{u.distributorId ? (nameById[u.distributorId] || "—") : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setTarget(u)}>Assign Coverage</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <AssignCoverageDialog
        user={target}
        salesUsers={salesUsers}
        onClose={() => setTarget(null)}
      />
    </Card>
  );
}

// Per-row coverage counts (its own query so the list stays a single request).
function CoverageCountCells({ userId }: { userId: string }) {
  const { data } = useQuery<any>({
    queryKey: ["/api/erp/salesperson-coverage", userId],
    queryFn: async () => (await apiRequest("GET", `/api/erp/salesperson-coverage/${userId}`)).json(),
  });
  const terr = data?.territory?.length ?? 0;
  const brands = data?.brand?.length ?? 0;
  return (<><TableCell>{terr}</TableCell><TableCell>{brands}</TableCell></>);
}

function AssignCoverageDialog({
  user, salesUsers, onClose,
}: {
  user: any | null;
  salesUsers: any[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const open = !!user;

  const coverageQuery = useQuery<any>({
    queryKey: ["/api/erp/salesperson-coverage", user?.id],
    queryFn: async () => (await apiRequest("GET", `/api/erp/salesperson-coverage/${user.id}`)).json(),
    enabled: open,
  });
  const treeQuery = useQuery<any>({ queryKey: ["/api/erp/territory-tree"], enabled: open });
  const brandsQuery = useQuery<any>({ queryKey: ["/api/brands"], enabled: open });
  const groupsQuery = useQuery<any>({ queryKey: ["/api/erp/customer-groups"], enabled: open });
  const companiesQuery = useQuery<any>({ queryKey: ["/api/erp/companies"], enabled: open });

  const [territory, setTerritory] = useState<string[]>([]);
  const [brand, setBrand] = useState<string[]>([]);
  const [group, setGroup] = useState<string[]>([]);
  const [company, setCompany] = useState<string[]>([]);
  const [parentUserId, setParentUserId] = useState<string>("none");

  // preload once coverage arrives (keyed to the user)
  useEffect(() => {
    if (coverageQuery.data) {
      setTerritory(coverageQuery.data.territory || []);
      setBrand(coverageQuery.data.brand || []);
      setGroup(coverageQuery.data.customer_group || []);
      setCompany(coverageQuery.data.company || []);
      setParentUserId(coverageQuery.data.parentUserId || "none");
    }
  }, [coverageQuery.data, user?.id]);

  const territoryOptions = useMemo(
    () => flattenTree(Array.isArray(treeQuery.data) ? treeQuery.data : []).map((n) => ({ value: n.value, label: `${n.label} (${n.level})` })),
    [treeQuery.data],
  );
  const brandOptions = useMemo(
    () => (Array.isArray(brandsQuery.data) ? brandsQuery.data : []).map((b: any) => ({ value: b.name, label: b.name })),
    [brandsQuery.data],
  );
  const groupOptions = useMemo(
    () => (Array.isArray(groupsQuery.data) ? groupsQuery.data : []).map((g: any) => ({ value: g.name, label: g.name })),
    [groupsQuery.data],
  );
  const companyOptions = useMemo(
    () => (Array.isArray(companiesQuery.data) ? companiesQuery.data : []).map((c: any) => ({ value: c.name, label: c.name })),
    [companiesQuery.data],
  );
  const managerOptions = salesUsers.filter((u) => u.id !== user?.id);

  const save = useMutation({
    mutationFn: async () => (await apiRequest("PUT", `/api/erp/salesperson-coverage/${user.id}`, {
      territory, brand, customer_group: group, company,
      parentUserId: parentUserId === "none" ? "" : parentUserId,
    })).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/salesperson-coverage", user.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/erp/users"] });
      toast({ title: "Coverage saved" });
      onClose();
    },
    onError: (e) => toastErr(toast, e, "Save failed"),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Coverage — {user?.name}</DialogTitle>
          <DialogDescription>Each dimension left empty means unrestricted on that dimension.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div><Label className="mb-1 block">Territory nodes</Label>
            <MultiSelect options={territoryOptions} selected={territory} onChange={setTerritory} placeholder="Any territory" />
          </div>
          <div><Label className="mb-1 block">Brands</Label>
            <MultiSelect options={brandOptions} selected={brand} onChange={setBrand} placeholder="Any brand" />
          </div>
          <div><Label className="mb-1 block">Customer groups</Label>
            <MultiSelect options={groupOptions} selected={group} onChange={setGroup} placeholder="Any customer group" />
          </div>
          <div><Label className="mb-1 block">Company</Label>
            <MultiSelect options={companyOptions} selected={company} onChange={setCompany} placeholder="Any company" />
          </div>
          <div><Label className="mb-1 block">Manager (parent)</Label>
            <Select value={parentUserId} onValueChange={setParentUserId}>
              <SelectTrigger><SelectValue placeholder="No manager" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No manager</SelectItem>
                {managerOptions.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name} ({ROLE_LABEL[m.role] || m.role})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />} Save Coverage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
