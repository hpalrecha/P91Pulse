import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Check, X, Clock, Download, Lock, Loader2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WarrantyCardDigital, WarrantyCardA4, type WarrantyCardData } from "@/components/warranty/WarrantyCard";

export default function WarrantyDetail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [holdReason, setHoldReason] = useState("");
  const [downloading, setDownloading] = useState<'a4' | 'card' | null>(null);
  const cardA4Ref = useRef<HTMLDivElement>(null);
  
  // Get ID from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');

  console.log('WarrantyDetail - ID from query:', id);

  // Fetch warranty registration details
  const { data: entry, isLoading, error, refetch } = useQuery({
    queryKey: [`/api/warranty-registrations/${id}`],
    enabled: !!id,
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/warranty-registrations/${id}`);
      const data = await res.json();
      console.log('Warranty details loaded:', data);
      return data;
    }
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, reason }: { status: string, reason?: string }) => {
      const res = await apiRequest('POST', `/api/warranty-registrations/${id}/status`, { status, reason });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: `Warranty registration has been ${data.status}`,
      });
      setNotes('');
      setRejectReason('');
      setHoldReason('');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/warranty-registrations'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update status: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleApprove = () => {
    updateStatusMutation.mutate({ status: 'approved', reason: notes });
  };

  const handleReject = () => {
    updateStatusMutation.mutate({ status: 'rejected', reason: rejectReason });
  };

  const handleHold = () => {
    updateStatusMutation.mutate({ status: 'on-hold', reason: holdReason });
  };

  const downloadPDF = async (type: 'a4' | 'card') => {
    const el = type === 'a4' ? cardA4Ref.current : cardCompactRef.current;
    if (!el) return;

    setDownloading(type);
    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default;

      const jspdfModule = await import('jspdf');
      const JsPDF = jspdfModule.jsPDF ?? jspdfModule.default;

      const scale = type === 'a4' ? 2 : 3;
      const canvas = await html2canvas(el, {
        scale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');

      if (type === 'a4') {
        const pdf = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pdfWidth = 210;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, 297));
        pdf.save(`P91-Warranty-${entry?.warrantyCode || 'Card'}.pdf`);
      } else {
        const pdf = new JsPDF({ orientation: 'landscape', unit: 'mm', format: [85, 55] });
        pdf.addImage(imgData, 'PNG', 0, 0, 85, 55);
        pdf.save(`P91-Warranty-Card-${entry?.warrantyCode || 'Compact'}.pdf`);
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      toast({
        title: 'Download failed',
        description: 'Could not generate the warranty card PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "on-hold":
        return <Badge className="bg-yellow-100 text-yellow-800">On Hold</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
    }
  };

  const isApproved = entry?.status === 'approved';

  const cardData: WarrantyCardData | null = entry ? {
    warrantyCode: entry.warrantyCode,
    name: entry.name,
    installer: entry.installer,
    storeName: entry.storeName ?? null,
    storeLocation: entry.storeLocation ?? null,
    vehicleMake: entry.vehicleMake ?? null,
    vehicleModel: entry.vehicleModel ?? null,
    vehicleVIN: entry.vehicleVIN ?? null,
    vehicleYear: entry.vehicleYear ?? null,
    productType: entry.productType,
    serialNumber: entry.serialNumber ?? null,
    lotNumbers: entry.lotNumbers ?? null,
    installationDate: entry.installationDate,
    expiryDate: null,
    status: entry.status,
    photos: (entry as any).photos ?? null,
  } : null;

  return (
      <div className="p-8">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center">
            <Button 
              variant="outline"
              onClick={() => setLocation(`/erp/admin/warranty-registrations`)}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Warranty Registrations
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Warranty Registration Details</h1>
              <p className="text-gray-500">ID: {id}</p>
            </div>
          </div>
          
          {entry && (
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  {getStatusBadge(entry.status)}
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  {/* Action Buttons - Approve/Reject/Hold */}
                  {(!entry.status || entry.status === "pending" || entry.status === "on-hold") && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="bg-green-600 hover:bg-green-700">
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Approve Warranty Registration</DialogTitle>
                          <DialogDescription>
                            This will approve the warranty registration and generate a warranty certificate.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea 
                              id="notes"
                              placeholder="Add any notes about this approval..."
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" onClick={handleApprove} disabled={updateStatusMutation.isPending}>
                            {updateStatusMutation.isPending ? "Processing..." : "Approve Warranty"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  {(!entry.status || entry.status === "pending") && (
                    <>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <Clock className="h-4 w-4 mr-2" />
                            Put on Hold
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Put Warranty Registration on Hold</DialogTitle>
                            <DialogDescription>
                              This will mark the warranty registration as on hold for further review.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="holdReason">Reason for Hold</Label>
                              <Textarea 
                                id="holdReason"
                                placeholder="Explain why this warranty registration is being put on hold..."
                                value={holdReason}
                                onChange={(e) => setHoldReason(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit" onClick={handleHold} disabled={updateStatusMutation.isPending || !holdReason}>
                              {updateStatusMutation.isPending ? "Processing..." : "Put on Hold"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Reject Warranty Registration</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. The warranty registration will be rejected.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="rejectReason">Reason for Rejection</Label>
                              <Textarea 
                                id="rejectReason"
                                placeholder="Explain why this warranty registration is being rejected..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                              />
                            </div>
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleReject}
                              disabled={updateStatusMutation.isPending || !rejectReason}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {updateStatusMutation.isPending ? "Processing..." : "Reject"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Loading warranty details...</p>
          </div>
        ) : error ? (
          <div className="text-center p-8">
            <h2 className="text-xl font-semibold text-red-600">Error Loading Warranty</h2>
            <p className="text-gray-500 mt-2">Failed to load warranty details: {error.message}</p>
          </div>
        ) : !entry ? (
          <div className="text-center p-8">
            <h2 className="text-xl font-semibold text-red-600">Warranty Not Found</h2>
            <p className="text-gray-500 mt-2">The warranty registration with ID {id} could not be found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Warranty Information Section */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">Warranty Information</h2>
                {getStatusBadge(entry.status)}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p><strong>Warranty Code:</strong> {entry.warrantyCode}</p>
                  <p><strong>Product Type:</strong> {entry.productType}</p>
                  <p><strong>Installation Date:</strong> {entry.installationDate}</p>
                </div>
                <div>
                  <p><strong>Installer:</strong> {entry.installer}</p>
                  <p><strong>Installer Mobile:</strong> {entry.installerMobile}</p>
                </div>
                <div>
                  <p><strong>Store:</strong> {entry.storeName}</p>
                  <p><strong>Store Email:</strong> {entry.storeEmail}</p>
                  <p><strong>Store Location:</strong> {entry.storeLocation}</p>
                </div>
              </div>
            </div>

            {/* Customer Details Section */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Customer Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Name:</strong> {entry.name}</p>
                  <p><strong>Email:</strong> {entry.email}</p>
                  <p><strong>Phone:</strong> {entry.phone}</p>
                </div>
              </div>
            </div>

            {/* Vehicle Details Section */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Vehicle Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Make:</strong> {entry.vehicleMake}</p>
                  <p><strong>Model:</strong> {entry.vehicleModel}</p>
                  <p><strong>Year:</strong> {entry.vehicleYear || 'Not specified'}</p>
                </div>
                <div>
                  <p><strong>Color:</strong> {entry.vehicleColor}</p>
                  <p><strong>VIN:</strong> {entry.vehicleVIN}</p>
                </div>
              </div>
            </div>

            {/* PPF Installation Areas Section */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h2 className="text-xl font-semibold mb-4">PPF Installation Areas</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {entry.fullCarPPF && <div className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Full Car PPF</div>}
                {entry.partialCarPPF && <div className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Partial Car PPF</div>}
                {entry.frontFender && <div className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Front Fender</div>}
                {entry.frontBumper && <div className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Front Bumper</div>}
                {entry.frontBonnet && <div className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Front Bonnet</div>}
                {entry.aPillar && <div className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>A-Pillar</div>}
                {entry.doors && <div className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Doors</div>}
                {entry.roof && <div className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Roof</div>}
                {entry.rearFender && <div className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Rear Fender</div>}
                {entry.backCover && <div className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Back Cover</div>}
                {entry.lightReflector && <div className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Light Reflector</div>}
                {entry.headLight && <div className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Head Light</div>}
              </div>
            </div>

            {/* Lot Numbers Section */}
            {entry.lotNumbers && entry.lotNumbers.length > 0 && (
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Lot Numbers</h2>
                <div className="space-y-2">
                  {entry.lotNumbers.map((lot: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span><strong>Lot:</strong> {lot.lotNumber}</span>
                      <span><strong>Quantity:</strong> {lot.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Installation Photos Section */}
            {entry.photos && entry.photos.length > 0 && (
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Installation Photos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {entry.photos.map((photo: string, index: number) => {
                    // Handle different photo formats - base64 data or file paths
                    let imageUrl = photo;
                    let originalFilename = '';
                    
                    // Handle different photo URL formats
                    if (typeof photo === 'string') {
                      // Check if it's base64 data (new format)
                      if (photo.startsWith('data:image/')) {
                        // Use base64 data directly
                        imageUrl = photo;
                      } else if (photo.includes('https://p91india.com/uploads/warranty/')) {
                        // Extract filename and use local server
                        originalFilename = photo.split('/').pop() || '';
                        imageUrl = `/uploads/warranty/${originalFilename}`;
                      } else if (!photo.startsWith('/uploads/') && !photo.startsWith('http')) {
                        // If it's just a filename, prepend the uploads path
                        originalFilename = photo;
                        imageUrl = `/uploads/warranty/${photo}`;
                      } else if (photo.startsWith('http://localhost') || photo.startsWith('https://localhost')) {
                        // Convert localhost URLs to relative paths
                        originalFilename = photo.split('/').pop() || '';
                        imageUrl = `/uploads/warranty/${originalFilename}`;
                      }
                    }
                    
                    console.log('Loading image:', imageUrl, 'from original:', photo);
                    
                    return (
                      <Dialog key={index}>
                        <DialogTrigger asChild>
                          <div className="relative group cursor-pointer">
                            <img 
                              src={imageUrl} 
                              alt={`Installation photo ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg border hover:opacity-90 transition-opacity"
                              onLoad={() => {
                                console.log('Image loaded successfully:', imageUrl);
                              }}
                              onError={(e) => {
                                console.error('Image failed to load:', imageUrl);
                                const target = e.target as HTMLImageElement;
                            
                            // Try alternative filenames by looking for similar timestamp patterns
                            const timestamp = originalFilename.match(/img_(\d+)_/);
                            if (timestamp) {
                              const baseTimestamp = timestamp[1];
                              
                              // Check if the images with correct hashes exist based on our known files
                              const knownFiles: Record<string, string[]> = {
                                '1747726932133': ['9b83219a619d2b76'],
                                '1747726932135': ['eebf29a53705759e'],
                                '1746701799720': ['502c3f2a7c86dcff'], 
                                '1746701799722': ['13b29d27ed96f004', '1f05a0a9f9998d79']
                              };
                              
                              const alternatives: string[] = [];
                              if (knownFiles[baseTimestamp]) {
                                alternatives.push(...knownFiles[baseTimestamp].map((hash: string) => 
                                  `/uploads/warranty/img_${baseTimestamp}_${hash}.jpg`
                                ));
                              } else {
                                // Fallback to common patterns
                                alternatives.push(
                                  `/uploads/warranty/img_${baseTimestamp}_eebf29a53705759e.jpg`,
                                  `/uploads/warranty/img_${baseTimestamp}_9b83219a619d2b76.jpg`,
                                  `/uploads/warranty/img_${baseTimestamp}_502c3f2a7c86dcff.jpg`,
                                  `/uploads/warranty/img_${baseTimestamp}_13b29d27ed96f004.jpg`,
                                  `/uploads/warranty/img_${baseTimestamp}_1f05a0a9f9998d79.jpg`
                                );
                              }
                              
                              const showErrorState = () => {
                                target.style.backgroundColor = '#f3f4f6';
                                target.style.color = '#9ca3af';
                                target.style.display = 'flex';
                                target.style.alignItems = 'center';
                                target.style.justifyContent = 'center';
                                target.style.fontSize = '12px';
                                target.style.textAlign = 'center';
                                target.alt = 'Image not available';
                                target.innerHTML = '<span style="padding: 10px;">Image not found<br/><small>' + originalFilename + '</small></span>';
                              };
                              
                              // Try alternatives sequentially
                              const tryAlternative = (altIndex: number) => {
                                if (altIndex < alternatives.length && alternatives[altIndex] !== imageUrl) {
                                  console.log(`Trying alternative image ${altIndex + 1}:`, alternatives[altIndex]);
                                  target.src = alternatives[altIndex];
                                  target.onerror = () => {
                                    if (altIndex + 1 < alternatives.length) {
                                      tryAlternative(altIndex + 1);
                                    } else {
                                      showErrorState();
                                    }
                                  };
                                  target.onload = () => {
                                    console.log(`✅ Successfully loaded alternative image: ${alternatives[altIndex]}`);
                                  };
                                } else {
                                  showErrorState();
                                }
                              };
                              
                              // Start trying alternatives
                              tryAlternative(0);
                            } else {
                              // No timestamp pattern found, show error
                              target.style.backgroundColor = '#f3f4f6';
                              target.style.color = '#9ca3af';
                              target.style.display = 'flex';
                              target.style.alignItems = 'center';
                              target.style.justifyContent = 'center';
                              target.style.fontSize = '12px';
                              target.style.textAlign = 'center';
                              target.alt = 'Image not available';
                              target.innerHTML = '<span style="padding: 10px;">Image not found<br/><small>' + originalFilename + '</small></span>';
                            }
                          }}
                        />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-lg">
                              <span className="text-white text-sm">Click to view full size</span>
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                          <img
                            src={imageUrl}
                            alt={`Installation photo ${index + 1} - Full size`}
                            className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
                          />
                        </DialogContent>
                      </Dialog>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* Warranty Card Section                                             */}
            {/* ------------------------------------------------------------------ */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-[#4DB848]" />
                      Warranty Card
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {isApproved
                        ? 'Warranty approved. Download the A4 PDF to share with the customer.'
                        : 'The warranty card is only available once this warranty has been approved.'}
                    </CardDescription>
                  </div>
                  {isApproved && (
                    <Button
                      onClick={() => window.print()}
                      className="bg-[#4DB848] hover:bg-[#3da83a] text-white shrink-0"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Warranty Card
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!isApproved ? (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <Lock className="h-5 w-5 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Not Yet Approved</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Approve this warranty to unlock the branded warranty card.
                      </p>
                    </div>
                  </div>
                ) : cardData ? (
                  <div className="max-w-lg mx-auto">
                    <WarrantyCardDigital data={cardData} />
                  </div>
                ) : null}
              </CardContent>
            </Card>

          </div>
        )}
        {/* Hidden A4 card — only rendered and visible when printing */}
        {isApproved && cardData && (
          <div
            id="warranty-a4-printable"
            aria-hidden="true"
            style={{ position: 'fixed', top: 0, left: '-9999px', pointerEvents: 'none' }}
          >
            <WarrantyCardA4 data={cardData} />
          </div>
        )}
      </div>
  );
}