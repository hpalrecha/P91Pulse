import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// My Coverage — the current user's territory: states, pincode set (from the
// linked ERP Sales Partner; ASM inherits the distributor's) and the team
// seated under them (detailers / installers / salespeople in their area).
export function MyCoverage() {
  const { data } = useQuery<any>({ queryKey: ['/api/erp/my-coverage'] });
  const pincodes: string[] = data?.pincodes ?? [];
  const states: string[] = data?.states ?? [];
  const team: any[] = data?.team ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Coverage</CardTitle>
        <p className="text-sm text-muted-foreground">
          {data?.partnerName
            ? `Linked ERP partner: ${data.partnerName} (${data.partnerType ?? '—'})`
            : 'Territory and team attached to your login.'}
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <h4 className="text-sm font-semibold mb-2">States</h4>
          <div className="flex flex-wrap gap-1.5">
            {states.length === 0 && <span className="text-sm text-muted-foreground">No states assigned</span>}
            {states.map((s) => (
              <Badge key={s} variant="secondary">{s === '*' ? 'All India' : s}</Badge>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-2">Pincodes assigned ({pincodes.length})</h4>
          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
            {pincodes.length === 0 && <span className="text-sm text-muted-foreground">No pincodes on file</span>}
            {pincodes.slice(0, 200).map((p) => (
              <span key={p} className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">{p}</span>
            ))}
            {pincodes.length > 200 && (
              <span className="text-xs text-muted-foreground">+{pincodes.length - 200} more</span>
            )}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-2">My team ({team.length})</h4>
          {team.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users seated under you yet.</p>
          ) : (
            <div className="max-h-56 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {team.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="capitalize">{String(t.role || '').replace(/_/g, ' ')}</TableCell>
                      <TableCell>{t.phone}</TableCell>
                      <TableCell>{t.isActive ? 'Yes' : 'No'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
