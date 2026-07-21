import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useLayoutEffect, useRef, useState } from 'react';
import { CheckCircle, XCircle, Loader2, Shield, Search, Download } from 'lucide-react';
import { WarrantyCardA4, WarrantyCardDigital, type WarrantyCardData } from '@/components/warranty/WarrantyCard';
import { useToast } from '@/hooks/use-toast';
import p91LogoSrc from '@assets/P91-logo.png';

interface PublicWarranty {
  warrantyCode: string;
  name: string;
  installer: string;
  storeName?: string | null;
  storeLocation?: string | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vehicleVIN?: string | null;
  vehicleYear?: string | null;
  productType: string;
  serialNumber?: string | null;
  installationDate: string;
  expiryDate?: string | null;
  status: string;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function computeExpiry(installationDate: string): string {
  try {
    const d = new Date(installationDate);
    d.setFullYear(d.getFullYear() + 5);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return 'N/A';
  }
}

export default function VerifyPage() {
  const params = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const urlCode = (params.code || '').trim();
  const [inputValue, setInputValue] = useState(urlCode);
  const [activeCode, setActiveCode] = useState(urlCode);
  const [downloading, setDownloading] = useState(false);
  const cardA4Ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (urlCode) {
      const normalized = urlCode.trim().toUpperCase();
      setActiveCode(normalized);
      setInputValue(normalized);
    }
  }, [urlCode]);

  const { data: response, isLoading } = useQuery<{ success: boolean; data?: PublicWarranty; message?: string }>({
    queryKey: ['/api/erp/public/verify', activeCode],
    queryFn: async () => {
      const res = await fetch(`/api/erp/public/verify/${encodeURIComponent(activeCode)}`);
      return res.json();
    },
    enabled: !!activeCode,
    retry: false,
  });

  const warranty = response?.success ? response.data : null;
  const notFound = !!activeCode && !isLoading && !warranty;

  const cardData: WarrantyCardData | null = warranty
    ? {
        warrantyCode: warranty.warrantyCode,
        name: warranty.name,
        installer: warranty.installer,
        storeName: warranty.storeName,
        storeLocation: warranty.storeLocation,
        vehicleMake: warranty.vehicleMake,
        vehicleModel: warranty.vehicleModel,
        vehicleVIN: warranty.vehicleVIN,
        vehicleYear: warranty.vehicleYear,
        productType: warranty.productType,
        serialNumber: warranty.serialNumber,
        lotNumbers: null,
        installationDate: warranty.installationDate,
        expiryDate: warranty.expiryDate,
        status: warranty.status,
        photos: null,
      }
    : null;

  const expiryDisplay = warranty
    ? (warranty.expiryDate ? formatDate(warranty.expiryDate) : computeExpiry(warranty.installationDate))
    : '';

  function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    const code = inputValue.trim().toUpperCase();
    if (!code) return;
    setActiveCode(code);
    setInputValue(code);
    setLocation(`/verify/${encodeURIComponent(code)}`);
  }

  async function downloadPDF() {
    const el = cardA4Ref.current;
    if (!el || !cardData) return;
    setDownloading(true);
    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default;
      const jspdfModule = await import('jspdf');
      const JsPDF = jspdfModule.jsPDF ?? jspdfModule.default;

      const canvas = await html2canvas(el, {
        scale: 2, useCORS: true, allowTaint: false,
        backgroundColor: '#ffffff', logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, 297));
      pdf.save(`P91-Warranty-${cardData.warrantyCode}.pdf`);
    } catch (err) {
      console.error('PDF error:', err);
      toast({ title: 'Download failed', description: 'Could not generate PDF. Please try again.', variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a2420 0%, #2D3436 50%, #1a2420 100%)', fontFamily: 'Sarabun, sans-serif' }}>

      {/* Nav */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 32px', borderBottom: '1px solid rgba(77,184,72,0.15)',
        backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)',
      }}>
        <img src={p91LogoSrc} alt="P91 India" style={{ height: '36px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700', color: '#4DB848', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          <Shield size={15} />
          Warranty Verification
        </div>
      </nav>

      {/* Hero area */}
      <div style={{ textAlign: 'center', padding: '56px 24px 32px' }}>
        <div style={{ fontFamily: 'Oxanium, sans-serif', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.28em', color: '#4DB848', fontWeight: '700', marginBottom: '16px' }}>
          P91 India · Authentic Warranty Check
        </div>
        <h1 style={{ fontFamily: 'Oxanium, sans-serif', fontSize: 'clamp(24px, 5vw, 40px)', fontWeight: '800', color: '#ffffff', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
          Verify Your Warranty
        </h1>
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.55)', margin: '0 auto', maxWidth: '480px', lineHeight: '1.6' }}>
          Enter your warranty ID below to instantly confirm its authenticity and view your digital warranty card.
        </p>
      </div>

      {/* Search box */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 24px 48px' }}>
        <form
          onSubmit={handleCheck}
          style={{
            display: 'flex', gap: '10px', width: '100%', maxWidth: '540px',
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(77,184,72,0.25)',
            borderRadius: '12px', padding: '10px',
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="e.g. P91-MO0304XXXX"
            style={{
              flex: 1, padding: '10px 16px',
              background: 'transparent', border: 'none', outline: 'none',
              fontFamily: 'Oxanium, sans-serif', fontSize: '15px',
              color: '#ffffff', letterSpacing: '0.03em',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 24px', backgroundColor: '#4DB848', color: '#ffffff',
              border: 'none', borderRadius: '8px', fontFamily: 'Oxanium, sans-serif',
              fontWeight: '700', fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap',
            }}
          >
            <Search size={15} />
            Check
          </button>
        </form>
      </div>

      {/* Result area */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '80px', gap: '32px' }}>

        {/* Loading */}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: '#4DB848' }} />
            <p style={{ fontFamily: 'Oxanium, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Verifying…
            </p>
          </div>
        )}

        {/* Not found */}
        {notFound && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(186,26,26,0.3)',
            borderRadius: '16px', padding: '44px 56px', maxWidth: '480px', width: '90%',
            textAlign: 'center',
          }}>
            <XCircle size={52} color="#ff6b6b" />
            <div>
              <h2 style={{ fontFamily: 'Oxanium, sans-serif', fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: '0 0 10px' }}>
                Invalid Warranty
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
                No active warranty found for this ID. Please double-check the code or contact your installer.
              </p>
            </div>
            <a href="mailto:info@p91india.com" style={{ color: '#4DB848', fontSize: '13px', fontWeight: '600', textDecoration: 'none', fontFamily: 'Oxanium, sans-serif' }}>
              info@p91india.com
            </a>
          </div>
        )}

        {/* Valid — digital card + banner + download */}
        {!isLoading && warranty && cardData && (
          <>
            {/* Valid banner */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: 'rgba(77,184,72,0.15)', border: '1px solid rgba(77,184,72,0.35)',
              borderRadius: '12px', padding: '14px 28px', maxWidth: '600px', width: '90%',
            }}>
              <CheckCircle size={28} color="#4DB848" strokeWidth={2.5} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: 'Oxanium, sans-serif', fontWeight: '700', fontSize: '15px', color: '#4DB848' }}>
                  Warranty Verified — Active
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                  Your warranty is valid till <strong style={{ color: '#ffffff' }}>{expiryDisplay}</strong>
                </div>
              </div>
            </div>

            {/* Digital card */}
            <div style={{ width: '90%', maxWidth: '540px' }}>
              <WarrantyCardDigital data={cardData} />
            </div>

            {/* Download button */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={downloadPDF}
                disabled={downloading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '10px',
                  background: downloading ? '#3a9e36' : '#4DB848',
                  color: '#ffffff', border: 'none', borderRadius: '10px',
                  padding: '14px 36px', fontSize: '15px', fontWeight: 700,
                  fontFamily: 'Oxanium, sans-serif', letterSpacing: '0.03em',
                  cursor: downloading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 20px rgba(77,184,72,0.4)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { if (!downloading) (e.currentTarget as HTMLButtonElement).style.background = '#3aaa36'; }}
                onMouseLeave={e => { if (!downloading) (e.currentTarget as HTMLButtonElement).style.background = '#4DB848'; }}
              >
                {downloading
                  ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Download size={18} />
                }
                {downloading ? 'Generating PDF…' : 'Download Warranty Card (PDF)'}
              </button>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                Downloads a full A4 warranty certificate
              </span>
            </div>

            {/* Customer / vehicle detail strip */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px', maxWidth: '600px', width: '90%',
            }}>
              {[
                { label: 'Customer', value: warranty.name },
                { label: 'Vehicle', value: [warranty.vehicleMake, warranty.vehicleModel].filter(Boolean).join(' ') || 'N/A' },
                { label: 'Studio / Installer', value: warranty.storeName || warranty.installer || 'N/A' },
                { label: 'Product', value: warranty.productType },
              ].map(item => (
                <div key={item.label} style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px', padding: '14px 18px',
                }}>
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.4)', fontWeight: '700', marginBottom: '6px' }}>{item.label}</div>
                  <div style={{ fontFamily: 'Oxanium, sans-serif', fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>{item.value}</div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Electronically Generated Warranty — No Physical Signature Required
            </p>
          </>
        )}

        {/* Empty state — no code entered yet */}
        {!activeCode && (
          <div style={{ textAlign: 'center', opacity: 0.35 }}>
            <Shield size={64} color="#4DB848" strokeWidth={1} />
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginTop: '16px', fontFamily: 'Oxanium, sans-serif', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Enter a warranty code above
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'center',
        padding: '24px', fontSize: '11px', color: 'rgba(255,255,255,0.3)',
        letterSpacing: '0.08em',
      }}>
        <div style={{ fontFamily: 'Oxanium, sans-serif', fontWeight: '700', color: '#4DB848', marginBottom: '6px', fontSize: '14px' }}>P91 INDIA</div>
        info@p91india.com · +91 79753 79525 · p91india.com
        <br />
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>© 2025 P91 India. All rights reserved.</span>
      </div>

      {/* Hidden A4 for PDF capture */}
      {cardData && (
        <div
          aria-hidden="true"
          style={{ position: 'fixed', top: 0, left: '-9999px', pointerEvents: 'none', zIndex: -1 }}
        >
          <WarrantyCardA4 ref={cardA4Ref} data={cardData} />
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        ::placeholder { color: rgba(255,255,255,0.3) !important; }
      `}</style>
    </div>
  );
}
