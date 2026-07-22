import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// VAS Job Cards inside Pulse — with the installer lifecycle actions
// (acknowledge / start / complete) driven through the /api/vas proxy.
export default function VASJobCards() {
  const { toast } = useToast();
  const { data, isLoading, error } = useQuery<any>({ queryKey: ['/api/vas/job-cards'] });
  const rows: any[] = Array.isArray(data) ? data : data?.data ?? data?.jobCards ?? [];

  const act = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      await apiRequest('POST', `/api/vas/job-cards/${id}/${action}`, {});
    },
    onSuccess: (_d, v) => {
      toast({ title: `Job ${v.action}d` });
      queryClient.invalidateQueries({ queryKey: ['/api/vas/job-cards'] });
    },
    onError: (e: any) => toast({ variant: 'destructive', title: 'Action failed', description: (e?.message || '').replace(/^\d+:\s*/, '') }),
  });

  // Which action is available at each VAS job-card status.
  const nextAction = (status: string): { action: string; label: string } | null => {
    const s = String(status || '').toUpperCase();
    if (s.includes('ASSIGN') || s === 'PENDING' || s === 'CREATED') return { action: 'acknowledge', label: 'Acknowledge' };
    if (s.includes('ACKNOWLEDGE')) return { action: 'start', label: 'Start' };
    if (s.includes('PROGRESS') || s.includes('START')) return { action: 'complete', label: 'Complete' };
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Job Cards</h1>
        <p className="text-muted-foreground mt-1">Your VAS job cards — acknowledge, start and complete right here in Pulse.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Job Cards ({rows.length})</CardTitle>
          <CardDescription>Live from Pulse VAS via your single Pulse login.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-sm text-amber-700 py-4">
              Couldn't load from VAS. If you were just given VAS access, it may take a moment to link — try again shortly.
            </p>
          )}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job ID</TableHead>
                  <TableHead>Work Order</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">Loading…</TableCell></TableRow>}
                {!isLoading && rows.length === 0 && !error && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">No job cards yet.</TableCell></TableRow>}
                {rows.map((jc, i) => {
                  const na = nextAction(jc.status);
                  return (
                    <TableRow key={jc.id || i}>
                      <TableCell className="font-mono text-xs">{jc.jobCardNumber || jc.id}</TableCell>
                      <TableCell>{jc.workOrderNumber || jc.workOrderId || '—'}</TableCell>
                      <TableCell>{jc.regNo || jc.vehicle || '—'}</TableCell>
                      <TableCell><Badge variant="outline">{jc.status || '—'}</Badge></TableCell>
                      <TableCell className="text-right">
                        {na ? (
                          <Button size="sm" disabled={act.isPending} onClick={() => act.mutate({ id: jc.id, action: na.action })}>
                            {na.label}
                          </Button>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
