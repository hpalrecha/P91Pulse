import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InfoDot } from '@/components/dev/InfoDot';
import { Plus } from 'lucide-react';

interface TeamMember {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  total_leads: number;
  conversions: number;
  states: string[];
}

export default function SalesTeam() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<'regional_sales_manager' | 'salesperson'>('regional_sales_manager');

  const { data: team = [], isLoading } = useQuery<TeamMember[]>({
    queryKey: ['/api/erp/sales/team'],
    queryFn: async () => (await apiRequest('GET', '/api/erp/sales/team')).json(),
  });

  const createMember = useMutation({
    mutationFn: async (body: any) => {
      const res = await apiRequest('POST', '/api/erp/users/create', body);
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/erp/sales/team'] });
      setOpen(false);
      toast({ title: 'Created', description: 'Sales team member added.' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body: any = {
      name: fd.get('name'),
      username: fd.get('username'),
      email: fd.get('email'),
      phone: fd.get('phone'),
      password: fd.get('password'),
      role,
    };
    if (role === 'regional_sales_manager') {
      const states = String(fd.get('states') || '').split(',').map(s => s.trim()).filter(Boolean);
      body.states = states;
      body.state = states[0];
    }
    createMember.mutate(body);
  };

  const rsms = team.filter(m => m.role === 'regional_sales_manager');
  const sps = team.filter(m => m.role === 'salesperson');

  const renderTable = (rows: TeamMember[], showStates: boolean) => (
    <Card className="mt-2">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              {showStates && <TableHead>States</TableHead>}
              <TableHead>Leads</TableHead>
              <TableHead>Conversions</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={showStates ? 7 : 6} className="text-center py-8 text-gray-500">None yet</TableCell></TableRow>
            ) : rows.map(m => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell>{m.email}</TableCell>
                <TableCell>{m.phone || 'N/A'}</TableCell>
                {showStates && (
                  <TableCell>
                    {(m.states || []).length ? m.states.map(s => <Badge key={s} variant="secondary" className="mr-1">{s}</Badge>) : '—'}
                  </TableCell>
                )}
                <TableCell>{m.total_leads}</TableCell>
                <TableCell>{m.conversions}</TableCell>
                <TableCell>{m.is_active ? <Badge className="bg-green-100 text-green-800">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Team Management</h1>
          <p className="text-gray-500 mt-1">Create and track Regional Sales Managers and Salespeople</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Member</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Add Sales Team Member</DialogTitle>
              <DialogDescription>They report directly to you (the National Sales Manager).</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-3 py-2">
              <div>
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as any)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regional_sales_manager">Regional Sales Manager</SelectItem>
                    <SelectItem value="salesperson">Salesperson</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="name">Full Name</Label><Input id="name" name="name" required className="mt-1" /></div>
                <div><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" className="mt-1" /></div>
                <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required className="mt-1" /></div>
                <div><Label htmlFor="username">Username</Label><Input id="username" name="username" required className="mt-1" /></div>
                <div className="col-span-2"><Label htmlFor="password">Temporary Password</Label><Input id="password" name="password" type="text" required className="mt-1" /></div>
                {role === 'regional_sales_manager' && (
                  <div className="col-span-2">
                    <Label htmlFor="states">Assigned States (comma-separated)</Label>
                    <Input id="states" name="states" placeholder="Karnataka, Kerala" className="mt-1" />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMember.isPending}>{createMember.isPending ? 'Creating...' : 'Create'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 mt-4">
        <h2 className="text-lg font-semibold">Regional Sales Managers ({rsms.length})</h2>
        <InfoDot widgetId="sales.team.rsmTable" fallbackLabel="Regional Sales Managers" />
      </div>
      {isLoading ? <p className="text-sm text-gray-500 mt-2">Loading…</p> : renderTable(rsms, true)}

      <div className="flex items-center gap-2 mt-8">
        <h2 className="text-lg font-semibold">Salespeople ({sps.length})</h2>
        <InfoDot widgetId="sales.team.salespeopleTable" fallbackLabel="Salespeople" />
      </div>
      {isLoading ? <p className="text-sm text-gray-500 mt-2">Loading…</p> : renderTable(sps, false)}
    </div>
  );
}
