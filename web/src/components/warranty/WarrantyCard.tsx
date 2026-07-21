import { forwardRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import p91LogoSrc from '@assets/P91-logo.png';

export type LotNumberEntry = { lotNumber: string; quantity?: number } | string;

export interface WarrantyCardData {
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
  lotNumbers?: LotNumberEntry[] | string | null;
  installationDate: string;
  expiryDate?: string | null;
  status: string;
  photos?: string[] | null;
}

function resolvePhotoUrl(photo: string): string {
  if (!photo) return '';
  if (photo.startsWith('data:image/')) return photo;
  if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
  if (photo.startsWith('/uploads/')) return photo;
  return `/uploads/warranty/${photo}`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
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

function getLotDisplay(lotNumbers: LotNumberEntry[] | string | null | undefined): string {
  if (!lotNumbers) return 'N/A';
  if (typeof lotNumbers === 'string') return lotNumbers;
  if (Array.isArray(lotNumbers)) {
    return lotNumbers.map((l) => (typeof l === 'object' ? l.lotNumber : l)).join(', ') || 'N/A';
  }
  return 'N/A';
}

export const VERIFY_BASE = typeof window !== 'undefined'
  ? `${window.location.origin}/verify`
  : 'https://pulsevas.p91india.com/verify';

const TERMS = [
  'This warranty covers manufacturing defects including yellowing, bubbling, and cracking under normal driving conditions.',
  'Warranty is valid only if installation is performed by an authorized P91 India Technical Atelier or Certified Studio.',
  'Maintenance must be performed using P91 approved ceramic coatings and pH-neutral maintenance washes every 6 months.',
  'Damage caused by collisions, road hazards, or aggressive chemical exposure is not covered under this technical certificate.',
  'Warranty is non-transferable unless requested in writing within 30 days of ownership change of the registered vehicle.',
];

/* ------------------------------------------------------------------ */
/* Shared style tokens                                                  */
/* ------------------------------------------------------------------ */
const GREEN = '#4DB848';
const DARK = '#2D3436';
const OUTLINE = '#717973';
const OUTLINE_VAR = '#c0c9c2';
const SURFACE_LOW = '#f2f4f3';

/* ------------------------------------------------------------------ */
/* A4 Card (794 × 1123 px) — Technical Elegance design                 */
/* ------------------------------------------------------------------ */

interface WarrantyCardA4Props {
  data: WarrantyCardData;
}

export const WarrantyCardA4 = forwardRef<HTMLDivElement, WarrantyCardA4Props>(({ data }, ref) => {
  const studioName = data.storeName || data.installer || 'N/A';
  const location = data.storeLocation || 'N/A';
  const vehicleDisplay = [data.vehicleMake, data.vehicleModel].filter(Boolean).join(' ') || 'N/A';
  const vinDisplay = data.vehicleVIN || 'N/A';
  const rollNumber = data.serialNumber || getLotDisplay(data.lotNumbers);
  const expiryDisplay = data.expiryDate ? formatDate(data.expiryDate) : computeExpiry(data.installationDate);
  const verifyUrl = `${VERIFY_BASE}/${data.warrantyCode}`;
  // Resolve up to 3 installation photo URLs
  const photos = (data.photos ?? []).slice(0, 3).map(resolvePhotoUrl).filter(Boolean);

  const detailRows = [
    { label: 'Studio / Installer', value: studioName },
    { label: 'Location', value: location },
    { label: 'Customer Name', value: data.name },
    { label: 'Car Make & Model', value: vehicleDisplay },
    { label: 'VIN / Registration', value: vinDisplay },
    { label: 'Product Series', value: data.productType, isPill: true },
    { label: 'Roll / Serial Number', value: rollNumber },
    { label: 'Date of Installation', value: formatDate(data.installationDate) },
  ];

  return (
    <div
      ref={ref}
      style={{
        width: '794px',
        height: '1123px',
        backgroundColor: '#ffffff',
        backgroundImage: `radial-gradient(${OUTLINE_VAR} 0.5px, transparent 0.5px)`,
        backgroundSize: '20px 20px',
        fontFamily: 'Sarabun, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
        padding: '44px 52px',
      }}
    >
      {/* Corner accents */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '64px', height: '64px', borderTop: `2px solid rgba(77,184,72,0.2)`, borderRight: `2px solid rgba(77,184,72,0.2)` }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '64px', height: '64px', borderBottom: `2px solid rgba(77,184,72,0.2)`, borderLeft: `2px solid rgba(77,184,72,0.2)` }} />

      {/* HEADER — 3-column grid so title never overlaps the badge */}
      <header
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          marginBottom: '32px',
          paddingBottom: '24px',
          borderBottom: `1px solid rgba(192,201,194,0.3)`,
        }}
      >
        {/* Col 1: Logo (left-aligned) */}
        <img src={p91LogoSrc} alt="P91 India" style={{ height: '48px', width: 'auto', objectFit: 'contain', justifySelf: 'start' }} />

        {/* Col 2: Title (centred) */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'Oxanium, sans-serif', fontWeight: '700', fontSize: '20px', letterSpacing: '-0.02em', color: DARK, margin: 0, whiteSpace: 'nowrap' }}>
            LIMITED E-WARRANTY CARD
          </h1>
          <p style={{ fontFamily: 'Sarabun, sans-serif', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: GREEN, fontWeight: '700', margin: '4px 0 0' }}>
            Premium Paint Protection
          </p>
        </div>

        {/* Col 3: Warranty ID badge (right-aligned) */}
        <div style={{ justifySelf: 'end', backgroundColor: GREEN, padding: '8px 16px', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontFamily: 'Sarabun, sans-serif', fontSize: '9px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', fontWeight: '700' }}>
            Warranty ID
          </span>
          <span style={{ fontFamily: 'Oxanium, sans-serif', fontWeight: '700', fontSize: '15px', color: '#ffffff', lineHeight: 1, marginTop: '2px', letterSpacing: '0.03em' }}>
            {data.warrantyCode}
          </span>
        </div>
      </header>

      {/* INSTALLATION DETAILS GRID */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 52px', marginBottom: '28px' }}>
        {detailRows.map((row) => (
          <div key={row.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontFamily: 'Sarabun, sans-serif', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.18em', color: OUTLINE, fontWeight: '700' }}>
              {row.label}
            </label>
            {row.isPill ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', backgroundColor: '#E8F5E9', color: GREEN, borderRadius: '999px', width: 'fit-content' }}>
                <span style={{ fontFamily: 'Oxanium, sans-serif', fontWeight: '700', fontSize: '12px' }}>{row.value}</span>
              </div>
            ) : (
              <div style={{ fontFamily: 'Oxanium, sans-serif', fontSize: '17px', fontWeight: '600', color: DARK }}>
                {row.value}
              </div>
            )}
          </div>
        ))}

        {/* Validity — col-span-2 */}
        <div
          style={{
            gridColumn: '1 / -1',
            marginTop: '8px',
            padding: '20px 24px',
            backgroundColor: SURFACE_LOW,
            borderRadius: '8px',
            border: `1px solid rgba(77,184,72,0.2)`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Verified check circle */}
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: 'Sarabun, sans-serif', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.18em', color: OUTLINE, fontWeight: '700' }}>
                Warranty Period
              </div>
              <div style={{ fontFamily: 'Oxanium, sans-serif', fontSize: '22px', fontWeight: '700', color: DARK }}>
                5 YEARS COMPREHENSIVE
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Sarabun, sans-serif', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.18em', color: OUTLINE, fontWeight: '700' }}>
              Expires On
            </div>
            <div style={{ fontFamily: 'Oxanium, sans-serif', fontSize: '22px', fontWeight: '700', color: GREEN }}>
              {expiryDisplay}
            </div>
          </div>
        </div>
      </section>

      {/* PHOTOS + QR ROW */}
      <section
        style={{
          display: 'flex',
          gap: '20px',
          marginBottom: '24px',
          padding: '18px 20px',
          backgroundColor: SURFACE_LOW,
          borderRadius: '10px',
          border: `1px solid rgba(77,184,72,0.18)`,
          alignItems: 'stretch',
        }}
      >
        {/* Photos */}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Oxanium, sans-serif', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.18em', color: OUTLINE, fontWeight: '700', marginBottom: '10px' }}>
            Installation Photos
          </div>
          {photos.length > 0 ? (
            <div style={{ display: 'flex', gap: '10px', height: '130px' }}>
              {photos.map((url, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: `1px solid rgba(192,201,194,0.4)`,
                    backgroundColor: '#e8ecea',
                  }}
                >
                  <img
                    src={url}
                    alt={`Installation photo ${i + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px dashed rgba(192,201,194,0.5)`, borderRadius: '6px', color: OUTLINE_VAR }}>
              <span style={{ fontFamily: 'Sarabun, sans-serif', fontSize: '11px' }}>No installation photos available</span>
            </div>
          )}
        </div>

        {/* QR Code (compact, right side) */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', paddingLeft: '16px', borderLeft: `1px solid rgba(192,201,194,0.35)` }}>
          <div style={{ padding: '8px', border: `2px solid rgba(77,184,72,0.3)`, borderRadius: '6px', backgroundColor: '#ffffff' }}>
            <QRCodeCanvas value={verifyUrl} size={90} level="M" bgColor="#ffffff" fgColor={DARK} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Oxanium, sans-serif', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.15em', color: GREEN, fontWeight: '700' }}>
              Scan to Verify
            </div>
            <div style={{ fontFamily: 'Sarabun, sans-serif', fontSize: '8px', color: OUTLINE, marginTop: '2px' }}>
              p91india.com/verify
            </div>
          </div>
        </div>
      </section>

      {/* TERMS & CONDITIONS */}
      <section style={{ flex: 1 }}>
        <h2
          style={{
            fontFamily: 'Oxanium, sans-serif',
            fontWeight: '700',
            color: DARK,
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          Terms &amp; Conditions
          <div style={{ height: '1px', flex: 1, backgroundColor: `rgba(192,201,194,0.35)` }} />
        </h2>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {TERMS.map((term, i) => (
            <li key={i} style={{ display: 'flex', gap: '10px', fontFamily: 'Sarabun, sans-serif', fontSize: '10px', lineHeight: '1.65', color: '#414944' }}>
              <span style={{ color: GREEN, fontWeight: '700', fontFamily: 'Oxanium, sans-serif', flexShrink: 0, minWidth: '20px' }}>
                {String(i + 1).padStart(2, '0')}.
              </span>
              {term}
            </li>
          ))}
        </ul>
      </section>

      {/* FOOTER */}
      <footer style={{ marginTop: 'auto', paddingTop: '16px' }}>
        <div
          style={{
            backgroundColor: DARK,
            color: '#ffffff',
            padding: '28px 32px',
            borderRadius: '8px 8px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontFamily: 'Oxanium, sans-serif', fontWeight: '700', fontSize: '18px', color: GREEN }}>P91 INDIA</div>
            <div style={{ fontFamily: 'Sarabun, sans-serif', fontSize: '10px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.65' }}>
              info@p91india.com &nbsp;|&nbsp; +91 79753 79525
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Oxanium, sans-serif', fontWeight: '700', letterSpacing: '0.18em', color: GREEN }}>
              P91INDIA.COM
            </div>
          </div>
        </div>
        <div style={{ width: '100%', textAlign: 'center', padding: '14px 0' }}>
          <span style={{ fontFamily: 'Sarabun, sans-serif', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.28em', color: OUTLINE, fontWeight: '500' }}>
            Electronically Generated Warranty – No Physical Signature Required
          </span>
        </div>
      </footer>
    </div>
  );
});

WarrantyCardA4.displayName = 'WarrantyCardA4';

/* ------------------------------------------------------------------ */
/* Compact card (85 × 55 mm = 321 × 208 px at 96 dpi)                 */
/* ------------------------------------------------------------------ */

interface WarrantyCardCompactProps {
  data: WarrantyCardData;
}

export const WarrantyCardCompact = forwardRef<HTMLDivElement, WarrantyCardCompactProps>(
  ({ data }, ref) => {
    const studioName = data.storeName || data.installer || 'N/A';
    const vehicleDisplay =
      [data.vehicleMake, data.vehicleModel].filter(Boolean).join(' ') || 'N/A';
    const expiryDisplay = data.expiryDate
      ? formatDate(data.expiryDate)
      : computeExpiry(data.installationDate);
    const verifyUrl = `${VERIFY_BASE}/${data.warrantyCode}`;

    return (
      <div
        ref={ref}
        style={{
          width: '321px',
          height: '208px',
          backgroundColor: '#ffffff',
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: GREEN,
            padding: '7px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ color: '#ffffff', fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Oxanium, sans-serif' }}>
              P91 INDIA
            </div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '5.5px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Limited E-Warranty</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '5.5px', textTransform: 'uppercase' }}>Warranty ID</div>
            <div style={{ color: '#ffffff', fontSize: '6.5px', fontWeight: '700', fontFamily: 'Oxanium, sans-serif' }}>
              {data.warrantyCode}
            </div>
          </div>
        </div>

        {/* Stripe */}
        <div style={{ height: '2px', backgroundColor: DARK, flexShrink: 0 }} />

        {/* Body */}
        <div style={{ flex: 1, padding: '8px 10px', display: 'flex', gap: '10px', overflow: 'hidden' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { label: 'Studio', value: studioName },
              { label: 'Customer', value: data.name },
              { label: 'Vehicle', value: vehicleDisplay },
              { label: 'VIN / Reg', value: data.vehicleVIN || 'N/A' },
              { label: 'Product', value: data.productType },
              { label: 'Installed', value: formatDate(data.installationDate) },
              { label: 'Valid Until', value: expiryDisplay },
            ].map((row) => (
              <div key={row.label} style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '5px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{row.label}</span>
                <span style={{ fontSize: '7px', color: '#111827', fontWeight: '600', lineHeight: '1.2' }}>{row.value}</span>
              </div>
            ))}
          </div>

          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <div style={{ padding: '4px', border: `1px solid ${GREEN}`, borderRadius: '3px', backgroundColor: '#fff' }}>
              <QRCodeCanvas value={verifyUrl} size={72} level="M" bgColor="#ffffff" fgColor={DARK} />
            </div>
            <span style={{ fontSize: '5px', color: '#9ca3af', textAlign: 'center' }}>Verify Warranty</span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            backgroundColor: DARK,
            padding: '5px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '5.5px' }}>p91india.com</span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '5.5px' }}>info@p91india.com</span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '5.5px' }}>+91 79753 79525</span>
        </div>
      </div>
    );
  }
);

WarrantyCardCompact.displayName = 'WarrantyCardCompact';

/* ------------------------------------------------------------------ */
/* Digital Card — green card view shown in "View Warranty Card" dialog */
/* ------------------------------------------------------------------ */

function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr)
      .toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      .toUpperCase();
  } catch {
    return dateStr ?? 'N/A';
  }
}

function computeExpiryShort(installationDate: string): string {
  try {
    const d = new Date(installationDate);
    d.setFullYear(d.getFullYear() + 5);
    return d
      .toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      .toUpperCase();
  } catch {
    return 'N/A';
  }
}

interface WarrantyCardDigitalProps {
  data: WarrantyCardData;
}

const CARD_HEIGHT = 320;

export function WarrantyCardDigital({ data }: WarrantyCardDigitalProps) {
  const [flipped, setFlipped] = useState(false);

  const vehicleDisplay =
    [data.vehicleMake, data.vehicleModel, data.vehicleYear].filter(Boolean).join(' ') || 'N/A';
  const studioDisplay = data.storeName || data.installer || 'N/A';
  const customerDisplay = data.name || 'N/A';
  const rollNumber = data.serialNumber || getLotDisplay(data.lotNumbers);
  const installShort = formatDateShort(data.installationDate);
  const expiryShort = data.expiryDate
    ? formatDateShort(data.expiryDate)
    : computeExpiryShort(data.installationDate);
  const verifyUrl = `${VERIFY_BASE}/${data.warrantyCode}`;

  const frontLabel: React.CSSProperties = {
    fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em',
    fontWeight: '700', marginBottom: '4px', color: 'rgba(255,255,255,0.65)',
  };
  const backLabel: React.CSSProperties = {
    fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em',
    fontWeight: '700', marginBottom: '4px', color: OUTLINE,
  };

  return (
    <div style={{ fontFamily: 'Sarabun, sans-serif', width: '100%', userSelect: 'none' }}>
      {/* Floating scene + shadow stack */}
      <div style={{ position: 'relative', paddingBottom: '32px' }}>

        {/* Ground shadow — pulses in sync with float */}
        <div
          className="warranty-card-shadow"
          style={{
            position: 'absolute',
            bottom: '4px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80%',
            height: '18px',
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.28) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        {/* Floating wrapper */}
        <div className="warranty-card-float">
          {/* 3-D perspective container */}
          <div style={{ perspective: '1200px' }}>
            {/* Flip inner */}
            <div
              style={{
                position: 'relative',
                height: `${CARD_HEIGHT}px`,
                transformStyle: 'preserve-3d',
                transition: 'transform 0.75s cubic-bezier(0.34, 1.25, 0.64, 1)',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                cursor: 'pointer',
              }}
              onClick={() => setFlipped(f => !f)}
            >

              {/* ── FRONT FACE: green card ── */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  backgroundColor: GREEN,
                  borderRadius: '16px',
                  padding: '22px 26px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(77,184,72,0.35), 0 4px 16px rgba(0,0,0,0.18)',
                }}
              >
                {/* dot texture */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '18px 18px', pointerEvents: 'none', borderRadius: '16px' }} />
                {/* sheen strip */}
                <div style={{ position: 'absolute', top: 0, left: '-40%', width: '60%', height: '100%', background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)', pointerEvents: 'none' }} />

                {/* logo + label */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                  <img src={p91LogoSrc} alt="P91 India" style={{ height: '32px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: '700' }}>E-WARRANTY CARD</div>
                </div>

                {/* details + QR */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '14px', position: 'relative', zIndex: 1 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={frontLabel}>VEHICLE MODEL</div>
                    <div style={{ fontFamily: 'Oxanium, sans-serif', fontWeight: '700', fontSize: '18px', color: '#ffffff', marginBottom: '14px', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {vehicleDisplay}
                    </div>
                    <div style={{ display: 'flex', gap: '18px', marginBottom: '14px', flexWrap: 'wrap' }}>
                      {[
                        { label: 'CUSTOMER', value: customerDisplay },
                        { label: 'STUDIO', value: studioDisplay },
                        { label: 'PRODUCT', value: data.productType || 'N/A' },
                      ].map((f) => (
                        <div key={f.label} style={{ minWidth: 0 }}>
                          <div style={frontLabel}>{f.label}</div>
                          <div style={{ fontFamily: 'Oxanium, sans-serif', fontWeight: '600', fontSize: '11px', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>{f.value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={frontLabel}>WARRANTY ID</div>
                    <div style={{ fontFamily: 'Oxanium, sans-serif', fontWeight: '700', fontSize: '14px', color: '#ffffff', letterSpacing: '0.03em' }}>
                      {data.warrantyCode}
                    </div>
                  </div>
                  {/* QR */}
                  <div style={{ backgroundColor: '#ffffff', padding: '8px', borderRadius: '8px', flexShrink: 0, boxShadow: '0 4px 16px rgba(0,0,0,0.22)' }}>
                    <QRCodeCanvas value={verifyUrl} size={88} level="M" bgColor="#ffffff" fgColor={DARK} />
                  </div>
                </div>
              </div>

              {/* ── BACK FACE: specs card ── */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '22px 26px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.10)',
                  border: `1px solid rgba(192,201,194,0.5)`,
                }}
              >
                {/* subtle dot texture */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${OUTLINE_VAR} 0.5px, transparent 0.5px)`, backgroundSize: '16px 16px', opacity: 0.4, pointerEvents: 'none', borderRadius: '16px' }} />
                {/* green top stripe */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${GREEN}, #8BC34A)`, borderRadius: '16px 16px 0 0' }} />

                {/* specs grid */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <img src={p91LogoSrc} alt="P91" style={{ height: '26px', objectFit: 'contain' }} />
                    <div style={{ fontFamily: 'Oxanium, sans-serif', fontSize: '9px', fontWeight: '700', color: GREEN, textTransform: 'uppercase', letterSpacing: '0.15em' }}>SPECIFICATIONS</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                    {[
                      { label: 'INSTALLATION', value: installShort },
                      { label: 'EXPIRY DATE', value: expiryShort },
                      { label: 'SERIAL NO.', value: rollNumber },
                    ].map((item) => (
                      <div key={item.label}>
                        <div style={backLabel}>{item.label}</div>
                        <div style={{ fontFamily: 'Oxanium, sans-serif', fontSize: '13px', fontWeight: '700', color: GREEN, lineHeight: 1.3 }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                  {/* VIN row */}
                  <div style={{ padding: '10px 14px', backgroundColor: '#f2f4f3', borderRadius: '8px', marginBottom: '14px' }}>
                    <div style={backLabel}>VIN / REGISTRATION</div>
                    <div style={{ fontFamily: 'Oxanium, sans-serif', fontSize: '14px', fontWeight: '700', color: DARK }}>{data.vehicleVIN || 'N/A'}</div>
                  </div>
                </div>

                {/* footer */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ flexShrink: 0, width: '24px', height: '24px', border: `2px solid ${GREEN}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div style={{ fontSize: '10px', color: '#414944', lineHeight: 1.6 }}>
                      Authentic P91 India installation — Technical Atelier certified.
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '9px', color: OUTLINE }}>info@p91india.com &nbsp;|&nbsp; p91india.com</div>
                    <div style={{ fontFamily: 'Oxanium, sans-serif', fontSize: '9px', fontWeight: '700', color: OUTLINE, textTransform: 'uppercase', letterSpacing: '0.1em' }}>CERTIFIED</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flip hint button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
        <button
          onClick={() => setFlipped(f => !f)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 20px',
            borderRadius: '999px',
            border: `1.5px solid rgba(77,184,72,0.35)`,
            backgroundColor: 'rgba(77,184,72,0.06)',
            color: GREEN,
            fontSize: '11px',
            fontFamily: 'Sarabun, sans-serif',
            fontWeight: '700',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(77,184,72,0.12)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(77,184,72,0.06)'; }}
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            style={{ transition: 'transform 0.4s ease', transform: flipped ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0 1 15.46-4.5M20 15a9 9 0 0 1-15.46 4.5"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {flipped ? 'Flip to Front' : 'Flip to Back'}
        </button>
      </div>
    </div>
  );
}
