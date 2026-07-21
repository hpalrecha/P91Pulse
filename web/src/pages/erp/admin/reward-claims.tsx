import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Gift, 
  Loader2, 
  CheckCircle, 
  XCircle,
  FileText,
  Download,
  Eye,
  Search,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoDot } from '@/components/dev/InfoDot';

interface RewardClaim {
  id: number;
  detailerId: number;
  detailerName: string;
  detailerEmail: string;
  invoiceUrl: string;
  invoiceFilename: string;
  invoiceAmount: string | null;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  pointsAwarded: number;
  adminNotes: string | null;
  reviewedBy: number | null;
  reviewedAt: string | null;
  createdAt: string;
}

export default function AdminRewardClaimsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedClaim, setSelectedClaim] = useState<RewardClaim | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [pointsToAward, setPointsToAward] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const { data: claimsData, isLoading } = useQuery<{ success: boolean; data: RewardClaim[] }>({
    queryKey: ['/api/erp/rewards/claims'],
  });
  const claims = claimsData?.data || [];

  const approveMutation = useMutation({
    mutationFn: async ({ claimId, points, notes }: { claimId: number; points: number; notes?: string }) => {
      const response = await apiRequest('POST', `/api/erp/rewards/claims/${claimId}/approve`, {
        pointsAwarded: points,
        adminNotes: notes,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Claim approved',
        description: 'The reward claim has been approved and points awarded.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/erp/rewards/claims'] });
      setIsReviewDialogOpen(false);
      setSelectedClaim(null);
      setPointsToAward('');
      setAdminNotes('');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve claim',
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ claimId, notes }: { claimId: number; notes?: string }) => {
      const response = await apiRequest('POST', `/api/erp/rewards/claims/${claimId}/reject`, {
        adminNotes: notes,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Claim rejected',
        description: 'The reward claim has been rejected.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/erp/rewards/claims'] });
      setIsReviewDialogOpen(false);
      setSelectedClaim(null);
      setPointsToAward('');
      setAdminNotes('');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject claim',
        variant: 'destructive',
      });
    },
  });

  const handleReviewClick = (claim: RewardClaim) => {
    setSelectedClaim(claim);
    setPointsToAward(claim.pointsAwarded > 0 ? claim.pointsAwarded.toString() : '');
    setAdminNotes(claim.adminNotes || '');
    setIsReviewDialogOpen(true);
  };

  const handleApprove = () => {
    if (!selectedClaim || !pointsToAward) {
      toast({
        title: 'Points required',
        description: 'Please enter the number of points to award.',
        variant: 'destructive',
      });
      return;
    }
    approveMutation.mutate({
      claimId: selectedClaim.id,
      points: parseInt(pointsToAward, 10),
      notes: adminNotes,
    });
  };

  const handleReject = () => {
    if (!selectedClaim) return;
    rejectMutation.mutate({
      claimId: selectedClaim.id,
      notes: adminNotes,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = 
      claim.detailerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.detailerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.invoiceFilename?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingClaims = claims.filter(c => c.status === 'pending');
  const approvedClaims = claims.filter(c => c.status === 'approved');
  const rejectedClaims = claims.filter(c => c.status === 'rejected');

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <Gift className="h-8 w-8 text-primary" />
          Reward Claims Management
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and approve detailer reward claims
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card data-testid="card-total-claims">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between gap-2">
              <span className="flex items-center">Total Claims</span>
              <InfoDot widgetId="admin.rewardClaims.totalClaims" fallbackLabel="Total Claims" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{claims.length}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-pending-claims">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600 flex items-center justify-between gap-2">
              <span className="flex items-center">Pending Review</span>
              <InfoDot widgetId="admin.rewardClaims.pendingReview" fallbackLabel="Pending Review" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingClaims.length}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-approved-claims">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 flex items-center justify-between gap-2">
              <span className="flex items-center">Approved</span>
              <InfoDot widgetId="admin.rewardClaims.approved" fallbackLabel="Approved" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedClaims.length}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-rejected-claims">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 flex items-center justify-between gap-2">
              <span className="flex items-center">Rejected</span>
              <InfoDot widgetId="admin.rewardClaims.rejected" fallbackLabel="Rejected" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedClaims.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center">All Claims</span>
            <InfoDot widgetId="admin.rewardClaims.table" fallbackLabel="All Claims" />
          </CardTitle>
          <CardDescription>
            View and manage reward claims submitted by detailers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by detailer name, email, or filename..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredClaims.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Gift className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No claims found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Detailer</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClaims.map((claim) => (
                    <TableRow key={claim.id} data-testid={`row-claim-${claim.id}`}>
                      <TableCell>
                        {format(new Date(claim.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{claim.detailerName || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{claim.detailerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a 
                          href={claim.invoiceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                          data-testid={`link-invoice-${claim.id}`}
                        >
                          <FileText className="h-4 w-4" />
                          {claim.invoiceFilename || 'View'}
                        </a>
                      </TableCell>
                      <TableCell>
                        {claim.invoiceAmount ? `₹${claim.invoiceAmount}` : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(claim.status)}</TableCell>
                      <TableCell>
                        {claim.status === 'approved' ? (
                          <span className="font-semibold text-green-600">
                            +{claim.pointsAwarded}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReviewClick(claim)}
                            data-testid={`button-review-${claim.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a 
                              href={claim.invoiceUrl} 
                              download
                              data-testid={`button-download-${claim.id}`}
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Reward Claim</DialogTitle>
            <DialogDescription>
              Review the invoice and decide whether to approve or reject this claim.
            </DialogDescription>
          </DialogHeader>
          
          {selectedClaim && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Detailer</Label>
                  <p className="font-medium">{selectedClaim.detailerName || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">{selectedClaim.detailerEmail}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Submitted</Label>
                  <p className="font-medium">
                    {format(new Date(selectedClaim.createdAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm text-gray-500">Invoice</Label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mt-1">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <a 
                      href={selectedClaim.invoiceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      {selectedClaim.invoiceFilename || 'View Invoice'}
                    </a>
                    {selectedClaim.invoiceAmount && (
                      <p className="text-sm text-gray-500">Amount: ₹{selectedClaim.invoiceAmount}</p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedClaim.invoiceUrl} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </a>
                  </Button>
                </div>
              </div>

              {selectedClaim.description && (
                <div>
                  <Label className="text-sm text-gray-500">Description</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedClaim.description}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <Label className="text-sm text-gray-500">Current Status</Label>
                <div className="mt-1">{getStatusBadge(selectedClaim.status)}</div>
              </div>

              {selectedClaim.status === 'pending' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="points">Points to Award *</Label>
                    <Input
                      id="points"
                      type="number"
                      placeholder="e.g., 100"
                      value={pointsToAward}
                      onChange={(e) => setPointsToAward(e.target.value)}
                      min="0"
                      data-testid="input-points"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Admin Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any notes about this decision..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      data-testid="input-admin-notes"
                    />
                  </div>
                </>
              )}

              {selectedClaim.status !== 'pending' && selectedClaim.adminNotes && (
                <div>
                  <Label className="text-sm text-gray-500">Admin Notes</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedClaim.adminNotes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedClaim?.status === 'pending' ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsReviewDialogOpen(false)}
                  data-testid="button-cancel-review"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={rejectMutation.isPending}
                  data-testid="button-reject-claim"
                >
                  {rejectMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  Reject
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={approveMutation.isPending || !pointsToAward}
                  data-testid="button-approve-claim"
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Approve
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setIsReviewDialogOpen(false)}
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
