import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { WarrantyCardA4, type WarrantyCardData } from '@/components/warranty/WarrantyCard';

/**
 * Standalone print page — renders only the A4 warranty card, then auto-triggers
 * the browser print dialog. User selects "Save as PDF" to download.
 * Opened in a new tab by the Download button on warranty-card-page.
 */
export default function WarrantyPrintPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const role = params.get('role') || 'detailer';

  const { data: warranty, isLoading } = useQuery({
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

  // Once the card is ready, wait for images/fonts then open the print dialog
  useEffect(() => {
    if (!cardData) return;
    const timer = setTimeout(async () => {
      await document.fonts.ready;
      // Wait for images inside the page
      const imgs = Array.from(document.querySelectorAll('img'));
      await Promise.all(imgs.map(img =>
        img.complete ? Promise.resolve() :
          new Promise<void>(res => { img.onload = () => res(); img.onerror = () => res(); })
      ));
      window.print();
    }, 600);
    return () => clearTimeout(timer);
  }, [cardData]);

  if (isLoading || !cardData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#666' }}>
        Preparing warranty card…
      </div>
    );
  }

  return (
    <>
      {/* Print-specific styles injected directly — forces colours and exact A4 sizing */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oxanium:wght@400;500;600;700&family=Sarabun:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          margin: 0;
          padding: 0;
          background: #fff;
        }

        @media screen {
          body {
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
            background: #e5e7eb;
            padding: 32px;
          }
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html, body {
            width: 210mm;
            height: 297mm;
            overflow: hidden;
          }
          body {
            display: block;
            background: #fff;
            padding: 0;
          }
          /* Force all background colours and images to print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          /* Hide the screen hint */
          .screen-hint { display: none !important; }
        }
      `}</style>

      {/* Small hint visible on screen only, hidden when printing */}
      <div className="screen-hint" style={{ position: 'fixed', top: 16, right: 16, background: '#4DB848', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontFamily: 'sans-serif', zIndex: 9999, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        Print dialog opening… → choose <strong>Save as PDF</strong>
      </div>

      <WarrantyCardA4 data={cardData} />
    </>
  );
}
