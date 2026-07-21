import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Gift, 
  Upload, 
  Loader2, 
  Trophy, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileText,
  Star,
  TrendingUp
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
import { InfoDot } from '@/components/dev/InfoDot';

interface RewardClaim {
  id: number;
  detailerId: number;
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

interface PointsBalance {
  totalPoints: number;
  pendingPoints: number;
  claimsCount: number;
  pendingClaimsCount: number;
}

interface LeaderboardEntry {
  rank: number;
  detailerId: number;
  detailerName: string;
  totalPoints: number;
}

export default function DetailerRewardsPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: claimsData, isLoading: claimsLoading } = useQuery<{ success: boolean; data: RewardClaim[] }>({
    queryKey: ['/api/erp/rewards/claims/mine'],
  });
  const claims = claimsData?.data || [];

  const { data: balanceData, isLoading: balanceLoading } = useQuery<{ success: boolean; data: PointsBalance }>({
    queryKey: ['/api/erp/rewards/points'],
  });
  const balance = balanceData?.data;

  const { data: leaderboardData } = useQuery<{ success: boolean; data: LeaderboardEntry[] }>({
    queryKey: ['/api/erp/rewards/leaderboard'],
  });
  const leaderboard = leaderboardData?.data || [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image (JPEG, PNG, GIF) or PDF file.',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload a file smaller than 10MB.',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
      setIsSubmitDialogOpen(true);
    }
  };

  const handleSubmitClaim = async () => {
    if (!selectedFile) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('invoice', selectedFile);
      if (invoiceAmount) formData.append('invoiceAmount', invoiceAmount);
      if (description) formData.append('description', description);

      const response = await fetch('/api/erp/rewards/claims', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit claim');
      }

      toast({
        title: 'Claim submitted!',
        description: 'Your reward claim has been submitted for review.',
      });

      queryClient.invalidateQueries({ queryKey: ['/api/erp/rewards/claims/mine'] });
      queryClient.invalidateQueries({ queryKey: ['/api/erp/rewards/points'] });

      setIsSubmitDialogOpen(false);
      setSelectedFile(null);
      setInvoiceAmount('');
      setDescription('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit claim',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
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

  if (claimsLoading || balanceLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Gift className="h-8 w-8 text-primary" />
            Claim Rewards
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload invoices to earn reward points
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,application/pdf"
            className="hidden"
            data-testid="input-file-invoice"
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            size="lg"
            data-testid="button-upload-invoice"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card data-testid="card-total-points">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Total Points
              </span>
              <InfoDot widgetId="detailer.rewards.totalPoints" fallbackLabel="Total Points" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary" data-testid="text-total-points">
              {balance?.totalPoints || 0}
            </div>
            <p className="text-sm text-gray-500">Lifetime earned points</p>
          </CardContent>
        </Card>

        <Card data-testid="card-pending-claims">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                Pending Claims
              </span>
              <InfoDot widgetId="detailer.rewards.pendingClaims" fallbackLabel="Pending Claims" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600" data-testid="text-pending-claims">
              {balance?.pendingClaimsCount || 0}
            </div>
            <p className="text-sm text-gray-500">Awaiting review</p>
          </CardContent>
        </Card>

        <Card data-testid="card-approved-claims">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Approved Claims
              </span>
              <InfoDot widgetId="detailer.rewards.approvedClaims" fallbackLabel="Approved Claims" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600" data-testid="text-approved-claims">
              {balance?.approvedClaimsCount || 0}
            </div>
            <p className="text-sm text-gray-500">Successfully processed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  My Claims
                </span>
                <InfoDot widgetId="detailer.rewards.table" fallbackLabel="My Claims" />
              </CardTitle>
              <CardDescription>
                Track the status of your reward claims
              </CardDescription>
            </CardHeader>
            <CardContent>
              {claims.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Gift className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No claims yet. Upload an invoice to get started!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {claims.map((claim) => (
                        <TableRow key={claim.id} data-testid={`row-claim-${claim.id}`}>
                          <TableCell>
                            {format(new Date(claim.createdAt), 'MMM dd, yyyy')}
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Leaderboard
                </span>
                <InfoDot widgetId="detailer.rewards.leaderboard" fallbackLabel="Leaderboard" />
              </CardTitle>
              <CardDescription>
                Top performers this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <Star className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No rankings yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.slice(0, 10).map((entry, index) => (
                    <div 
                      key={entry.detailerId} 
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
                      data-testid={`leaderboard-entry-${index}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-bold text-lg ${
                          index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-gray-400' :
                          index === 2 ? 'text-amber-600' : 'text-gray-600'
                        }`}>
                          #{entry.rank}
                        </span>
                        <span className="font-medium truncate max-w-[120px]">
                          {entry.detailerName}
                        </span>
                      </div>
                      <Badge variant="secondary">
                        {entry.totalPoints} pts
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Reward Claim</DialogTitle>
            <DialogDescription>
              Upload your invoice to earn reward points. Our team will review and approve your claim.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FileText className="h-8 w-8 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedFile?.name}</p>
                <p className="text-sm text-gray-500">
                  {selectedFile && (selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceAmount">Invoice Amount (Optional)</Label>
              <Input
                id="invoiceAmount"
                type="text"
                placeholder="e.g., 5000"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value)}
                data-testid="input-invoice-amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Any additional notes about this invoice..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                data-testid="input-description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSubmitDialogOpen(false);
                setSelectedFile(null);
                setInvoiceAmount('');
                setDescription('');
              }}
              data-testid="button-cancel-claim"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitClaim}
              disabled={isSubmitting}
              data-testid="button-submit-claim"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Claim'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
