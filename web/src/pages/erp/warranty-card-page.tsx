import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { WarrantyCardDigital, WarrantyCardA4, type WarrantyCardData } from '@/components/warranty/WarrantyCard';

export default function WarrantyCardPage() {
  const [, setLocation] = useLocation();

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const role = params.get('role') || 'detailer';

  const { data: warranty, isLoading, error } = useQuery({
    queryKey: role === 'admin'
      ? [`/api/warranty-registrations/${id}`]
      : [`/api/erp/detailer/warranties/${id}`],
    enabled: !!id,
    queryFn: async () => {
      const endpoint = role === 'admin'
        ? `/api/warranty-registrations/${id}`
        : `/api/erp/detailer/warranties/${id}`;
      const res = await apiRequest('GET', endpoint);
      const text = await res.text();
      try { return JSON.parse(text); } catch {
        throw new Error('Failed to load warranty data');
      }
    },
  });

  const cardData: WarrantyCardData | null = warranty ? {
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
  } : null;

  const goBack = () => {
    if (role === 'admin') {
      setLocation(`/erp/admin/warranty-detail?id=${id}`);
    } else {
      setLocation(`/erp/detailer/warranty-detail/${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4">
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <Button
          onClick={() => window.print()}
          disabled={!cardData}
          className="bg-[#4DB848] hover:bg-[#3da83a] text-white"
        >
          <Download className="mr-2 h-4 w-4" />
          Download A4 PDF
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#4DB848]" />
        </div>
      )}
      {error && (
        <div className="text-center py-20 text-red-500 text-sm">
          Failed to load warranty card. Please go back and try again.
        </div>
      )}

      {cardData && (
        <div className="max-w-xl mx-auto px-4 py-10">
          <WarrantyCardDigital data={cardData} />
        </div>
      )}

      {/* Hidden A4 card — only visible when printing */}
      {cardData && (
        <div
          id="warranty-a4-printable"
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            left: '-9999px',
            pointerEvents: 'none',
          }}
        >
          <WarrantyCardA4 data={cardData} />
        </div>
      )}
    </div>
  );
}
