import { useState, useRef } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, ShieldX, CheckCircle } from "lucide-react";
import {
  WarrantyCardA4,
  WarrantyCardDigital,
  type WarrantyCardData,
} from "@/components/warranty/WarrantyCard";
import { useToast } from "@/hooks/use-toast";
import p91LogoSrc from "@assets/P91-logo.png";

export default function WarrantyCardPublicPage() {
  const { code } = useParams<{ code: string }>();
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const cardA4Ref = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/erp/public/verify", code],
    queryFn: async () => {
      const res = await fetch(`/api/erp/public/verify/${code}`);
      if (!res.ok) throw new Error("Not found");
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Not found");
      return json.data;
    },
    enabled: !!code,
    retry: false,
  });

  const cardData: WarrantyCardData | null = data
    ? {
        warrantyCode: data.warrantyCode,
        name: data.name,
        installer: data.installer,
        storeName: data.storeName ?? null,
        storeLocation: data.storeLocation ?? null,
        vehicleMake: data.vehicleMake ?? null,
        vehicleModel: data.vehicleModel ?? null,
        vehicleVIN: data.vehicleVIN ?? null,
        vehicleYear: data.vehicleYear ?? null,
        productType: data.productType,
        serialNumber: data.serialNumber ?? null,
        lotNumbers: null,
        installationDate: data.installationDate,
        expiryDate: data.expiryDate ?? null,
        status: data.status,
        photos: null,
      }
    : null;

  const downloadPDF = async () => {
    const el = cardA4Ref.current;
    if (!el || !cardData) return;

    setDownloading(true);
    try {
      const html2canvasModule = await import("html2canvas");
      const html2canvas = html2canvasModule.default;
      const jspdfModule = await import("jspdf");
      const JsPDF = jspdfModule.jsPDF ?? jspdfModule.default;

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, Math.min(pdfHeight, 297));
      pdf.save(`P91-Warranty-${cardData.warrantyCode}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      toast({
        title: "Download failed",
        description: "Could not generate the warranty card PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a2e1a 0%, #0f1f0f 50%, #1a2e1a 100%)",
        fontFamily: "'Sarabun', sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid rgba(77,184,72,0.15)",
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(0,0,0,0.25)",
        }}
      >
        <img src={p91LogoSrc} alt="P91 India" style={{ height: "36px", width: "auto" }} />
        <span
          style={{
            fontSize: "11px",
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            fontWeight: 700,
          }}
        >
          Warranty Certificate
        </span>
      </div>

      {/* Main content */}
      <div
        style={{
          maxWidth: "860px",
          margin: "0 auto",
          padding: "40px 24px 60px",
        }}
      >
        {/* Loading */}
        {isLoading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: "80px",
              gap: "16px",
            }}
          >
            <Loader2 style={{ width: 40, height: 40, color: "#4DB848", animation: "spin 1s linear infinite" }} />
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>Loading warranty certificate…</p>
          </div>
        )}

        {/* Error / Not Found */}
        {(isError || (!isLoading && !data)) && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: "80px",
              gap: "16px",
              textAlign: "center",
            }}
          >
            <ShieldX style={{ width: 56, height: 56, color: "#e74c3c" }} />
            <h2 style={{ fontFamily: "'Oxanium', sans-serif", fontWeight: 700, fontSize: "24px", color: "#ffffff", margin: 0 }}>
              Warranty Not Found
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", maxWidth: "360px", lineHeight: 1.6 }}>
              No approved warranty found for code <strong style={{ color: "rgba(255,255,255,0.8)" }}>{code}</strong>.
              Please check the code and try again, or contact{" "}
              <a href="mailto:info@p91india.com" style={{ color: "#4DB848" }}>
                info@p91india.com
              </a>
              .
            </p>
          </div>
        )}

        {/* Warranty found */}
        {!isLoading && data && cardData && (
          <>
            {/* Status banner */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "rgba(77,184,72,0.12)",
                border: "1px solid rgba(77,184,72,0.3)",
                borderRadius: "10px",
                padding: "12px 20px",
                marginBottom: "36px",
              }}
            >
              <CheckCircle style={{ width: 20, height: 20, color: "#4DB848", flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: "'Oxanium', sans-serif", fontWeight: 700, fontSize: "14px", color: "#4DB848" }}>
                  Warranty Verified — Active
                </div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>
                  Your P91 warranty is authentic and currently active.
                </div>
              </div>
            </div>

            {/* Digital card — flip on click */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "40px" }}>
              <WarrantyCardDigital data={cardData} />
            </div>

            {/* Download button */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginBottom: "40px" }}>
              <button
                onClick={downloadPDF}
                disabled={downloading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  background: downloading ? "#3a9e36" : "#4DB848",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "16px 36px",
                  fontSize: "16px",
                  fontWeight: 700,
                  fontFamily: "'Oxanium', sans-serif",
                  letterSpacing: "0.03em",
                  cursor: downloading ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 20px rgba(77,184,72,0.4)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!downloading) (e.currentTarget as HTMLButtonElement).style.background = "#3aaa36";
                }}
                onMouseLeave={(e) => {
                  if (!downloading) (e.currentTarget as HTMLButtonElement).style.background = "#4DB848";
                }}
              >
                {downloading ? (
                  <Loader2 style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }} />
                ) : (
                  <Download style={{ width: 20, height: 20 }} />
                )}
                {downloading ? "Generating PDF…" : "Download Warranty Card (PDF)"}
              </button>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
                Downloads a full A4 warranty certificate
              </span>
            </div>

            {/* Footer note */}
            <p
              style={{
                textAlign: "center",
                fontSize: "11px",
                color: "rgba(255,255,255,0.3)",
                marginTop: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
              }}
            >
              Electronically Generated Warranty — No Physical Signature Required
            </p>
          </>
        )}
      </div>

      {/* Hidden A4 card captured by html2canvas for PDF download */}
      {cardData && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            top: 0,
            left: "-9999px",
            pointerEvents: "none",
            zIndex: -1,
          }}
        >
          <WarrantyCardA4 ref={cardA4Ref} data={cardData} />
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
