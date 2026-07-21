import React from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { InfoDot } from '@/components/dev/InfoDot';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { FileInput, ClipboardList, Mail, UserPlus, FileWarning, UserCheck } from 'lucide-react';

// Pending user approvals — signups/applications waiting for an admin decision.
function PendingApprovals() {
  const { toast } = useToast();
  const { data: users } = useQuery<any[]>({ queryKey: ['/api/erp/users'] });
  const pending = (users || []).filter((u) => u.status === 'pending');

  const act = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'reject' }) => {
      await apiRequest('POST', `/api/erp/users/${id}/${action}`);
    },
    onSuccess: (_d, v) => {
      toast({ title: v.action === 'approve' ? 'User approved' : 'User rejected' });
      queryClient.invalidateQueries({ queryKey: ['/api/erp/users'] });
    },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Action failed', description: e.message }),
  });

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Pending Approvals {pending.length > 0 && <Badge variant="secondary">{pending.length}</Badge>}
        </CardTitle>
        <CardDescription>User registrations waiting for an admin decision.</CardDescription>
      </CardHeader>
      <CardContent>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No pending approvals.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Decision</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="capitalize">{String(u.role || '').replace(/_/g, ' ')}</TableCell>
                  <TableCell>{u.phone}</TableCell>
                  <TableCell>{u.email || '—'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" onClick={() => act.mutate({ id: u.id, action: 'approve' })} disabled={act.isPending}>
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => act.mutate({ id: u.id, action: 'reject' })} disabled={act.isPending}>
                      Reject
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

export default function WebformsIndex() {
  const [, setLocation] = useLocation();

  // Define available webform types
  const webformTypes = [
    {
      id: 'contact',
      name: 'Contact Form Submissions',
      description: 'Customer inquiries and messages submitted through the contact form',
      icon: <Mail className="h-8 w-8 mb-2" />,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      id: 'installer-application',
      name: 'Installer Applications',
      description: 'Applications from detailers interested in becoming authorized P91 installers',
      icon: <UserPlus className="h-8 w-8 mb-2" />,
      color: 'bg-green-50 text-green-600'
    },
    {
      id: 'warranty-registration',
      name: 'Warranty Registrations',
      description: 'Customer warranty registration submissions for P91 products',
      icon: <FileWarning className="h-8 w-8 mb-2" />,
      color: 'bg-purple-50 text-purple-600'
    },
    {
      id: 'ppf-partner-applications',
      name: 'PPF Partner Applications',
      description: 'Partnership applications submitted through the PPF Program form',
      icon: <ClipboardList className="h-8 w-8 mb-2" />,
      color: 'bg-orange-50 text-orange-600'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold mb-2">Web Forms Management</h1>
          <InfoDot widgetId="admin.webforms.page" fallbackLabel="Web Forms Management" />
        </div>
        <p className="text-gray-500">
          Manage and review all form submissions from your website in one place.
        </p>
      </div>

      <PendingApprovals />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {webformTypes.map((type) => (
          <Card key={type.id} className="overflow-hidden transition-all hover:shadow-md">
            <CardHeader className={type.color + " py-4"}>
              <div className="flex justify-center">
                {type.icon}
              </div>
              <CardTitle className="text-center">{type.name}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <CardDescription className="text-center mb-4">
                {type.description}
              </CardDescription>
              <Button 
                className="w-full" 
                onClick={() => {
                  // Special redirects for specific modules
                  if (type.id === 'warranty-registration') {
                    setLocation('/erp/admin/warranty-registrations');
                  } else if (type.id === 'installer-application') {
                    setLocation('/erp/admin/installer-applications');
                  } else if (type.id === 'ppf-partner-applications') {
                    setLocation('/erp/admin/ppf-partner-applications');
                  } else if (type.id === 'contact') {
                    setLocation('/erp/admin/webforms/contact');
                  } else {
                    setLocation(`/erp/admin/webforms/list/${type.id}`);
                  }
                }}
              >
                View Submissions
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}