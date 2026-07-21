import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InfoDot } from '@/components/dev/InfoDot';
import { Plus } from 'lucide-react';

export default function SalesCustomers() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { data: customers = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/erp/customers'],
    queryFn: async () => (await apiRequest('GET', '/api/erp/customers')).json(),
  });

  const createCustomer = useMutation({
    mutationFn: async (body: any) => {
      const res = await apiRequest('POST', '/api/erp/customers', body);
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/erp/customers'] });
      setOpen(false);
      toast({ title: 'Customer added', description: 'It is now tracked under you.' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createCustomer.mutate({
      name: fd.get('name'),
      phone: fd.get('phone'),
      email: fd.get('email'),
      city: fd.get('city'),
      brand: fd.get('brand'),
      remarks: fd.get('remarks'),
      status: 'new',
      userType: 'end_user', // salesperson tracks only end users
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">My Customers</h1>
            <InfoDot widgetId="sales.customers.table" fallbackLabel="My Customers" />
          </div>
          <p className="text-gray-500 mt-1">End users you brought in</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Customer</Button></DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Add End-User Customer</DialogTitle>
              <DialogDescription>Captured in Pulse and written to ERP as an End User lead.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label htmlFor="name">Full Name</Label><Input id="name" name="name" required className="mt-1" /></div>
                <div><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" required className="mt-1" /></div>
                <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" className="mt-1" /></div>
                <div><Label htmlFor="city">City</Label><Input id="city" name="city" className="mt-1" /></div>
                <div><Label htmlFor="brand">Brand</Label><Input id="brand" name="brand" placeholder="P91" className="mt-1" /></div>
                <div className="col-span-2"><Label htmlFor="remarks">Remarks</Label><Textarea id="remarks" name="remarks" className="mt-1" /></div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createCustomer.isPending}>{createCustomer.isPending ? 'Saving…' : 'Add Customer'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>City</TableHead>
                <TableHead>Brand</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-gray-500">Loading…</TableCell></TableRow>
              ) : customers.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-gray-500">No customers yet</TableCell></TableRow>
              ) : customers.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell>{c.city || 'N/A'}</TableCell>
                  <TableCell>{c.brand || 'N/A'}</TableCell>
                  <TableCell><Badge variant="secondary">{c.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
