import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WarrantyPage() {
  const [, navigate] = useLocation();

  const { data: user, isLoading } = useQuery<any>({
    queryKey: ["/api/erp/me"],
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect logged-in users to the appropriate internal warranty registration page
      const role = user.role;
      if (role === "admin") {
        navigate("/erp/admin/warranty-registrations");
      } else if (role === "distributor") {
        navigate("/erp/admin/warranty-registrations");
      } else {
        navigate("/erp/detailer/warranty-registration");
      }
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-[#4DB848] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in — show the gate screen
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-[#4DB848]" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Warranty Registration
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Please log in to the P91 Pulse portal to register a warranty.
              Only authorised studios and installers can submit warranty
              registrations.
            </p>
          </div>

          <Button
            className="w-full bg-[#4DB848] hover:bg-[#3da038] text-white font-semibold py-3 rounded-xl gap-2"
            onClick={() => navigate("/erp/login")}
          >
            <LogIn className="w-4 h-4" />
            Log In to P91 Pulse
          </Button>

          <p className="text-xs text-gray-400">
            Don't have an account?{" "}
            <a
              href="https://p91india.com/p91-pulse"
              className="text-[#4DB848] hover:underline"
            >
              Register on the P91 Pulse portal
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
