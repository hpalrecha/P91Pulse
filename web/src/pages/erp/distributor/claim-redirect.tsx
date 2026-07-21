import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export default function ClaimRedirectPage() {
  const [, navigate] = useLocation();
  
  useEffect(() => {
    // Redirect to the claim form after the component mounts
    navigate("/erp/distributor/claim-form");
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-gray-500">Redirecting to claim form...</p>
      </div>
    </div>
  );
}