import { useParams } from "wouter";
import SidebarLayout from "@/components/layouts/sidebar-layout";

export default function WarrantyTestPage() {
  const { id } = useParams<{ id: string }>();
  
  return (
    <SidebarLayout activeModule="warranty-registrations">
      <div className="p-8">
        <h1 className="text-2xl font-bold">Test Warranty Detail Page</h1>
        <p className="mt-4">ID from URL: {id || "No ID found"}</p>
        <p className="mt-2">Current URL: {window.location.pathname}</p>
        <p className="mt-2">This is a test page to verify routing works.</p>
      </div>
    </SidebarLayout>
  );
}