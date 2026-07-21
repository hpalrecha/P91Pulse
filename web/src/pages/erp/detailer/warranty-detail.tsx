import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, FileText, Car, User, Calendar, Package, Shield, Download, Lock } from 'lucide-react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { WarrantyCardDigital, WarrantyCardA4, type WarrantyCardData } from '@/components/warranty/WarrantyCard';

export default function DetailerWarrantyDetailPage() {
  const params = useParams();
  const [location, setLocation] = useLocation();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Extract ID from URL path manually as fallback
  const id = params.id || location.split('/').pop();

  const { data: warranty, isLoading, error } = useQuery({
    queryKey: [`/api/erp/detailer/warranties/${id}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/erp/detailer/warranties/${id}`);
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('Authentication failed - received HTML instead of JSON');
      }
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
      }
    },
    enabled: !!id,
  });

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: { color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const parseNotes = (notes: string) => {
    try { return JSON.parse(notes || '{}'); } catch { return {}; }
  };

  const getInstallationAreas = (warranty: any) => {
    const areas = {
      'Full Car PPF': warranty.fullCarPPF,
      'Partial Car PPF': warranty.partialCarPPF,
      'Front Fender': warranty.frontFender,
      'Front Bumper': warranty.frontBumper,
      'Front Bonnet': warranty.frontBonnet,
      'A Pillar': warranty.aPillar,
      'Doors': warranty.doors,
      'Roof': warranty.roof,
      'Rear Fender': warranty.rearFender,
      'Back Cover': warranty.backCover,
      'Light Reflector': warranty.lightReflector,
      'Head Light': warranty.headLight,
    };
    return Object.entries(areas).filter(([, value]) => value === true);
  };


  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !warranty) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Warranty Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error ? `Error: ${error.message}` : "The warranty you're looking for doesn't exist or you don't have permission to view it."}
          </p>
          <Button onClick={() => setLocation('/erp/detailer/warranties')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Warranties
          </Button>
        </div>
      </div>
    );
  }

  const parsedNotes = parseNotes(warranty.notes);
  const installationAreas = getInstallationAreas(warranty);
  const isApproved = warranty.status === 'approved';

  const cardData: WarrantyCardData = {
    warrantyCode: warranty.warrantyCode,
    name: warranty.name,
    installer: warranty.installer,
    storeName: warranty.storeName,
    storeLocation: warranty.storeLocation,
    vehicleMake: warranty.vehicleMake || warranty.make,
    vehicleModel: warranty.vehicleModel || warranty.model,
    vehicleVIN: warranty.vehicleVIN || warranty.vehicleVin || warranty.registration_number,
    vehicleYear: warranty.vehicleYear || warranty.year,
    productType: warranty.productType,
    serialNumber: warranty.serialNumber,
    lotNumbers: warranty.lotNumbers,
    installationDate: warranty.installationDate,
    expiryDate: warranty.expiryDate || null,
    status: warranty.status,
    photos: warranty.photos || null,
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => setLocation('/erp/detailer/warranties')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Warranties
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Warranty Details</h1>
            <p className="text-gray-600">Warranty Code: {warranty.warrantyCode}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(warranty.status)}
          <Badge variant="outline" className="flex items-center">
            <Shield className="mr-1 h-3 w-3" />
            ID: {warranty.id}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Customer Name</label>
              <p className="text-sm font-medium">{warranty.name || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phone Number</label>
              <p className="text-sm">{warranty.phone || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-sm">{warranty.email || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Address</label>
              <p className="text-sm">{warranty.address || 'Not provided'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Car className="mr-2 h-5 w-5" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Make & Model</label>
              <p className="text-sm font-medium">
                {warranty.vehicleMake || warranty.make || 'N/A'}{' '}
                {warranty.vehicleModel || warranty.model || ''}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Year</label>
              <p className="text-sm">{warranty.vehicleYear || warranty.year || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Color</label>
              <p className="text-sm">{warranty.vehicleColor || warranty.color || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Registration/VIN</label>
              <p className="text-sm font-mono">
                {warranty.vehicleVIN || warranty.vehicleVin || warranty.registration_number || 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Product Name</label>
              <p className="text-sm font-medium">{warranty.productType || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Serial Number</label>
              <p className="text-sm font-mono">{warranty.serialNumber || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Lot Number</label>
              <p className="text-sm font-mono">
                {Array.isArray(warranty.lotNumbers) && warranty.lotNumbers.length > 0
                  ? warranty.lotNumbers
                      .map((lot: any) => (typeof lot === 'object' ? `${lot.lotNumber} (${lot.quantity})` : lot))
                      .join(', ')
                  : 'Not provided'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Installer</label>
              <p className="text-sm">{warranty.installer || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Installation Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Installation Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Installation Date</label>
              <p className="text-sm font-medium">{warranty.installationDate || 'Aug 28, 2025'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Expiry Date</label>
              <p className="text-sm">{warranty.expiryDate || 'Aug 28, 2030'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Installer</label>
              <p className="text-sm">{warranty.installer || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Installation Areas */}
      {installationAreas.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Installation Areas
            </CardTitle>
            <CardDescription>Areas where the product was installed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {installationAreas.map(([area]) => (
                <div
                  key={area}
                  className="flex items-center space-x-2 p-3 rounded-lg border bg-green-50 border-green-200"
                >
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm font-medium">{area}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photos Section */}
      {warranty.photos && Array.isArray(warranty.photos) && warranty.photos.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Installation Photos
            </CardTitle>
            <CardDescription>Photos uploaded during warranty registration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {warranty.photos.map((photo: string, index: number) => (
                <Dialog key={index}>
                  <DialogTrigger asChild>
                    <div className="relative group cursor-pointer">
                      <img
                        src={photo}
                        alt={`Installation photo ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                          Click to enlarge
                        </span>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                    <img
                      src={photo}
                      alt={`Installation photo ${index + 1} - Full size`}
                      className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
                    />
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warranty Timeline */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Warranty Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium">Warranty Submitted</p>
                <p className="text-xs text-gray-500">{formatDate(warranty.createdAt)}</p>
              </div>
            </div>
            {warranty.status === 'approved' && (
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Warranty Approved</p>
                  <p className="text-xs text-gray-500">{formatDate(warranty.updatedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Warranty Card Section                                             */}
      {/* ------------------------------------------------------------------ */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#4DB848]" />
                Warranty Card
              </CardTitle>
              <CardDescription className="mt-1">
                {isApproved
                  ? 'Your warranty is approved. Download the A4 PDF to share with your customer.'
                  : 'The warranty card will be available once this warranty is approved by an admin.'}
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
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Once an admin approves this warranty, you'll be able to view and download the branded warranty card.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-lg mx-auto">
              <WarrantyCardDigital data={cardData} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden A4 card — only rendered and visible when printing */}
      {isApproved && (
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
