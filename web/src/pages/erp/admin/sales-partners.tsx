import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { InfoDot } from '@/components/dev/InfoDot';
import { Search, Users, Award, TrendingUp, MapPin, CheckCircle2, UserPlus, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';

// Sales Partners = the ACTIVE lead receivers synced from the ERP Sales Partner
// doctype (distributors + detailers). Real data via GET /api/erp/sales-partners.
export default function SalesPartnersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data, isLoading } = useQuery<any>({ queryKey: ['/api/erp/sales-partners'] });

  // Invite flow: generate an /onboard/<token> link for a partner role.
  const [inviteRole, setInviteRole] = useState('detailer');
  const [inviteLink, setInviteLink] = useState('');
  const [inviting, setInviting] = useState(false);
  const genInvite = async () => {
    setInviting(true);
    try {
      const res = await apiRequest('POST', '/api/erp/invites', { role: inviteRole });
      const d = await res.json();
      setInviteLink(window.location.origin + d.path);
    } catch { /* ignore */ } finally { setInviting(false); }
  };

  const partners: any[] = data?.partners ?? [];
  const summary = data?.summary ?? {};
  const q = searchQuery.toLowerCase();
  const filtered = partners.filter((p) =>
    [p.name, p.territory, p.brands, p.partnerType].join(' ').toLowerCase().includes(q),
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Sales Partner Management</h1>
            <InfoDot widgetId="admin.salespartners.header" fallbackLabel="Sales Partners Overview" />
          </div>
          <p className="text-muted-foreground mt-1">
            Active lead-receiving partners synced from ERP (distributors &amp; detailers) with their pincode coverage and assigned leads.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="rounded-md border border-gray-200 px-2 py-1.5 text-sm">
              <option value="detailer">Detailer</option>
              <option value="installer">Installer</option>
              <option value="distributor">Distributor</option>
            </select>
            <Button onClick={genInvite} disabled={inviting}><UserPlus className="h-4 w-4 mr-2" />Invite Partner</Button>
          </div>
          {inviteLink && (
            <div className="flex items-center gap-2 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-1 text-xs">
              <span className="font-mono truncate max-w-[18rem]">{inviteLink}</span>
              <button onClick={() => navigator.clipboard.writeText(inviteLink)} title="Copy"><Copy className="h-3.5 w-3.5" /></button>
            </div>
          )}
        </div>
      </div>

      {/* Real metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Partners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total ?? '…'}</div>
            <p className="text-xs text-muted-foreground mt-1">{summary.distributors ?? 0} distributors · {summary.detailers ?? 0} detailers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leads Assigned</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalLeads ?? '…'}</div>
            <p className="text-xs text-muted-foreground mt-1">across all partners</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Distributors</CardTitle>
            <Award className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.distributors ?? '…'}</div>
            <p className="text-xs text-muted-foreground mt-1">pincode-list partners</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detailers</CardTitle>
            <MapPin className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.detailers ?? '…'}</div>
            <p className="text-xs text-muted-foreground mt-1">studio / 5km-radius partners</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registered Partner Directory</CardTitle>
          <CardDescription>Live from ERP. Search by name, territory, brand or type.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex max-w-sm gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search partner, territory, brand…" className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Territory</TableHead>
                  <TableHead>Brands</TableHead>
                  <TableHead className="text-right">Pincodes</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead>Pulse Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">Loading partners…</TableCell></TableRow>
                )}
                {!isLoading && filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">No partners found. Run the partner sync if this is empty.</TableCell></TableRow>
                )}
                {filtered.slice(0, 300).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold text-slate-900">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={p.partnerType === 'Distributor' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}>
                        {p.partnerType || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-700 text-sm">{p.territory || '—'}</TableCell>
                    <TableCell className="text-slate-600 text-xs">{p.brands || '—'}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{p.pincodeCount}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">{p.leadCount}</TableCell>
                    <TableCell>
                      {p.hasLogin
                        ? <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Yes</span>
                        : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filtered.length > 300 && <p className="text-xs text-muted-foreground">Showing first 300 of {filtered.length} — refine the search.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
