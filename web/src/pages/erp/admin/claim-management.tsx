import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Search, FileText, Calendar, User, AlertCircle, CheckCircle, Clock, Loader2, RefreshCw, ChevronDown, Link2, XCircle, HelpCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ClaimUpdates } from '@/components/claim-updates';
import { InfoDot } from '@/components/dev/InfoDot';

interface Claim {
  id: number;
  claimNumber: string | null;
  claimType: string | null;
  batchNumber: string | null;
  warrantyCode: string | null;
  productName: string | null;
  issueType: string | null;
  problemArea: string | null;
  issue: string;
  claimArea: string | null;
  detailerName: string | null;
  distributorName: string | null;
  city: string | null;
  contactInfo: string | null;
  status: string;
  resolution: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string | null;
  boxOpened: string | null;
  productUsed: string | null;
  labelPreserved: string | null;
  tapedAfterUse: string | null;
  capIncluded: string | null;
  problemLength: string | null;
  problemWidth: string | null;
  claimQuantity: number | null;
  images: string[] | null;
  erpnextClaimId: string | null;
  syncStatus: string | null;
  syncError: string | null;
  syncAttempts: number | null;
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200',
};

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Pending',
  processing: 'Processing',
  approved: 'Approved',
  rejected: 'Rejected',
  closed: 'Closed',
};

function formatDate(d: string | null) {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMM yyyy'); } catch { return '—'; }
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'approved') return <CheckCircle className="h-4 w-4" />;
  if (status === 'rejected') return <AlertCircle className="h-4 w-4" />;
  if (status === 'processing') return <RefreshCw className="h-4 w-4" />;
  return <Clock className="h-4 w-4" />;
}

export default function ClaimManagementPage() {
  const initialBatch = new URLSearchParams(window.location.search).get('batch') || '';
  const [searchTerm, setSearchTerm] = useState(initialBatch);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [resolution, setResolution] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const { toast } = useToast();

  const { data: currentUser } = useQuery<{ id: number; role: string }>({
    queryKey: ['/api/erp/me'],
  });

  const { data: claims = [], isLoading, refetch } = useQuery<Claim[]>({
    queryKey: ['/api/erp/admin/claims'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/erp/admin/claims');
      return res.json();
    },
  });

  const { data: messageCounts = {} } = useQuery<Record<number, { total: number; adminCount: number }>>({
    queryKey: ['/api/erp/claims/message-counts'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/erp/claims/message-counts');
      return res.json();
    },
    refetchInterval: 30000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, resolution, adminNotes }: { id: number; status: string; resolution?: string; adminNotes?: string }) => {
      const res = await apiRequest('POST', `/api/erp/claims/${id}/status`, { status, resolution, adminNotes });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['/api/erp/admin/claims'] });
      toast({ title: 'Status updated', description: `Claim status changed to ${STATUS_LABELS[vars.status] || vars.status}` });
      if (selectedClaim) {
        setSelectedClaim({ ...selectedClaim, status: vars.status, resolution: vars.resolution || selectedClaim.resolution, adminNotes: vars.adminNotes || selectedClaim.adminNotes });
      }
    },
    onError: () => toast({ title: 'Update failed', description: 'Could not update claim status', variant: 'destructive' }),
  });

  const handleOpenClaim = (claim: Claim) => {
    setSelectedClaim(claim);
    setResolution(claim.resolution || '');
    setAdminNotes(claim.adminNotes || '');
    setShowDetail(true);
  };

  const handleStatusUpdate = (status: string) => {
    if (!selectedClaim) return;
    updateStatusMutation.mutate({ id: selectedClaim.id, status, resolution, adminNotes });
  };

  const filtered = claims.filter(c => {
    const matchSearch =
      !searchTerm ||
      c.claimNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.detailerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.distributorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.warrantyCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.issue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    total: claims.length,
    submitted: claims.filter(c => c.status === 'submitted').length,
    processing: claims.filter(c => c.status === 'processing').length,
    approved: claims.filter(c => c.status === 'approved').length,
    rejected: claims.filter(c => c.status === 'rejected').length,
    closed: claims.filter(c => c.status === 'closed').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Claim Management</h1>
          <p className="text-gray-600 mt-1">Review and manage all warranty claims</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: 'Total', key: 'total', color: 'text-gray-900' },
          { label: 'Pending', key: 'submitted', color: 'text-yellow-600' },
          { label: 'Processing', key: 'processing', color: 'text-blue-600' },
          { label: 'Approved', key: 'approved', color: 'text-green-600' },
          { label: 'Rejected', key: 'rejected', color: 'text-red-600' },
          { label: 'Closed', key: 'closed', color: 'text-gray-500' },
        ].map(({ label, key, color }) => (
          <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(key === 'total' ? 'all' : key)}>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className={`text-sm font-medium ${color} flex items-center justify-between gap-2`}>
                <span className="flex items-center">{label}</span>
                <InfoDot widgetId={`admin.claims.stat.${key}`} fallbackLabel={`${label} claims`} />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className={`text-2xl font-bold ${color}`}>{counts[key as keyof typeof counts]}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by claim number, detailer, product, batch..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="submitted">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Claims List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center">Claims</span>
            <InfoDot widgetId="admin.claims.table" fallbackLabel="Claims table" />
          </CardTitle>
          <CardDescription>Showing {filtered.length} of {claims.length} claims</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {claims.length === 0 ? 'No claims submitted yet.' : 'No claims match your search.'}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(claim => (
                <div key={claim.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {claim.claimNumber || `#${claim.id}`}
                        </Badge>
                        <Badge className={`text-xs border ${STATUS_COLORS[claim.status] || 'bg-gray-100 text-gray-800'}`}>
                          <StatusIcon status={claim.status} />
                          <span className="ml-1">{STATUS_LABELS[claim.status] || claim.status}</span>
                        </Badge>
                        {claim.claimType && (
                          <Badge variant="secondary" className="text-xs">
                            {claim.claimType === 'unused' ? 'Batch Number' : 'E-Warranty'}
                          </Badge>
                        )}
                        {claim.syncStatus === 'synced' && claim.erpnextClaimId && (
                          <Badge className="text-xs border bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
                            <Link2 className="h-3 w-3" />
                            {claim.erpnextClaimId}
                          </Badge>
                        )}
                        {messageCounts[claim.id]?.total > 0 && (
                          <Badge className="text-xs border bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {messageCounts[claim.id].total} {messageCounts[claim.id].total === 1 ? 'message' : 'messages'}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 text-sm">
                        <div className="flex items-center gap-1 text-gray-700">
                          <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{claim.detailerName || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <span className="font-medium">Product:</span>
                          <span className="truncate">{claim.productName || (claim.batchNumber ? `Batch: ${claim.batchNumber}` : claim.warrantyCode || '—')}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <span>{formatDate(claim.createdAt)}</span>
                        </div>
                      </div>
                      {claim.issueType && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Issue:</span> {claim.issueType}
                          {claim.problemArea ? ` • ${claim.problemArea}` : ''}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{claim.issue}</p>
                    </div>
                    <Button variant="outline" size="sm" className="flex-shrink-0" onClick={() => handleOpenClaim(claim)}>
                      View &amp; Act
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Claim Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Claim {selectedClaim?.claimNumber || `#${selectedClaim?.id}`}</DialogTitle>
            <DialogDescription>
              Submitted on {formatDate(selectedClaim?.createdAt || null)} by {selectedClaim?.detailerName || 'Unknown'}
            </DialogDescription>
          </DialogHeader>

          {selectedClaim && (
            <div className="space-y-5">
              {/* Status badge + ERP sync status */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={`text-sm border ${STATUS_COLORS[selectedClaim.status] || 'bg-gray-100 text-gray-800'}`}>
                  <StatusIcon status={selectedClaim.status} />
                  <span className="ml-1">{STATUS_LABELS[selectedClaim.status] || selectedClaim.status}</span>
                </Badge>
                {selectedClaim.syncStatus === 'synced' && selectedClaim.erpnextClaimId && (
                  <Badge className="text-xs border bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    ERP: {selectedClaim.erpnextClaimId}
                  </Badge>
                )}
                {selectedClaim.syncStatus === 'failed' && (
                  <Badge
                    className="text-xs border bg-red-50 text-red-700 border-red-200 flex items-center gap-1 cursor-help"
                    title={selectedClaim.syncError || 'Unknown sync error'}
                  >
                    <XCircle className="h-3 w-3" />
                    ERP Sync Failed
                  </Badge>
                )}
                {selectedClaim.syncStatus === 'pending' && !selectedClaim.erpnextClaimId && (
                  <Badge className="text-xs border bg-gray-50 text-gray-500 border-gray-200 flex items-center gap-1">
                    <HelpCircle className="h-3 w-3" />
                    ERP Sync Pending
                  </Badge>
                )}
              </div>

              {/* Claimant Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg space-y-1.5 text-sm">
                  <p className="font-semibold text-gray-700 mb-2">Claimant Information</p>
                  <p><span className="text-gray-500">Detailer:</span> {selectedClaim.detailerName || '—'}</p>
                  <p><span className="text-gray-500">Distributor:</span> {selectedClaim.distributorName || '—'}</p>
                  <p><span className="text-gray-500">City:</span> {selectedClaim.city || '—'}</p>
                  <p><span className="text-gray-500">Contact:</span> {selectedClaim.contactInfo || '—'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg space-y-1.5 text-sm">
                  <p className="font-semibold text-gray-700 mb-2">Product Information</p>
                  <p><span className="text-gray-500">Type:</span> {selectedClaim.claimType === 'unused' ? 'Batch (Unused Product)' : 'Registered Warranty'}</p>
                  {selectedClaim.batchNumber && <p><span className="text-gray-500">Batch Number:</span> {selectedClaim.batchNumber}</p>}
                  {selectedClaim.warrantyCode && <p><span className="text-gray-500">Warranty Code:</span> {selectedClaim.warrantyCode}</p>}
                  {selectedClaim.productName && <p><span className="text-gray-500">Product:</span> {selectedClaim.productName}</p>}
                </div>
              </div>

              {/* Problem Details */}
              <div className="p-3 bg-gray-50 rounded-lg space-y-1.5 text-sm">
                <p className="font-semibold text-gray-700 mb-2">Problem Details</p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedClaim.issueType && <p><span className="text-gray-500">Issue Type:</span> {selectedClaim.issueType}</p>}
                  {selectedClaim.problemArea && <p><span className="text-gray-500">Problem Area:</span> {selectedClaim.problemArea}</p>}
                  {selectedClaim.problemLength && <p><span className="text-gray-500">Length:</span> {selectedClaim.problemLength} ft</p>}
                  {selectedClaim.problemWidth && <p><span className="text-gray-500">Width:</span> {selectedClaim.problemWidth} ft</p>}
                  {selectedClaim.claimArea && <p><span className="text-gray-500">Claim Area:</span> {selectedClaim.claimArea} sq. ft.</p>}
                </div>
                <div className="mt-2">
                  <p className="text-gray-500">Description:</p>
                  <p className="mt-1 text-gray-800">{selectedClaim.issue}</p>
                </div>
              </div>

              {/* Product Storage Status */}
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-semibold text-gray-700 mb-2">Product Storage Status</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { label: 'Box Opened', val: selectedClaim.boxOpened },
                    { label: 'Product Used', val: selectedClaim.productUsed },
                    { label: 'Label Preserved', val: selectedClaim.labelPreserved },
                    { label: 'Taped After Use', val: selectedClaim.tapedAfterUse },
                    { label: 'Cap Included', val: selectedClaim.capIncluded },
                  ].map(({ label, val }) => (
                    <p key={label}>
                      <span className="text-gray-500">{label}:</span>{' '}
                      <span className={val === 'yes' ? 'text-green-600 font-medium' : 'text-gray-700'}>{val || '—'}</span>
                    </p>
                  ))}
                </div>
              </div>

              {/* Attached Photos / Videos */}
              {Array.isArray(selectedClaim.images) && selectedClaim.images.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  <p className="font-semibold text-gray-700 mb-2">Attached Photos / Videos</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedClaim.images.map((url, i) => {
                      const isVideo = url.match(/\.(mp4|mov|avi|webm)$/i);
                      return isVideo ? (
                        <video key={i} src={url} controls className="w-full rounded border" />
                      ) : (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt={`Attachment ${i + 1}`} className="w-full rounded border object-cover aspect-square" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Updates / Conversation Thread */}
              {currentUser && (
                <ClaimUpdates
                  claimId={selectedClaim.id}
                  currentRole="admin"
                  currentUserId={currentUser.id}
                />
              )}

              {/* Resolution / Admin Notes */}
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Resolution Notes</Label>
                  <Textarea
                    className="mt-1"
                    placeholder="Add resolution notes..."
                    value={resolution}
                    onChange={e => setResolution(e.target.value)}
                    rows={2}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Admin Notes (internal)</Label>
                  <Textarea
                    className="mt-1"
                    placeholder="Internal notes not visible to claimant..."
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-wrap gap-2 pt-2">
            {selectedClaim && ['approved', 'rejected', 'closed'].includes(selectedClaim.status) ? (
              <Button variant="outline" onClick={() => setShowDetail(false)}>Close</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowDetail(false)}>Cancel</Button>
                <Button
                  variant="outline"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  disabled={updateStatusMutation.isPending}
                  onClick={() => handleStatusUpdate('processing')}
                >
                  Mark Processing
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  disabled={updateStatusMutation.isPending}
                  onClick={() => handleStatusUpdate('rejected')}
                >
                  Reject
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  disabled={updateStatusMutation.isPending}
                  onClick={() => handleStatusUpdate('approved')}
                >
                  {updateStatusMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
