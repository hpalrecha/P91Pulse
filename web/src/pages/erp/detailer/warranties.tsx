import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import WarrantyTable from '@/components/warranty/WarrantyTable';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle, Clock, Plus, BarChart } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { InfoDot } from '@/components/dev/InfoDot';

export default function DetailerWarrantiesPage() {
  const [, setLocation] = useLocation();

  // Fetch warranty registrations
  const { data: warranties = [], isLoading } = useQuery({
    queryKey: ['/api/erp/detailer/warranties'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/erp/detailer/warranties');
        return await response.json();
      } catch (err) {
        console.error("Error fetching warranty registrations:", err);
        throw err;
      }
    }
  });

  // Calculate metrics
  const totalWarranties = Array.isArray(warranties) ? warranties.length : 0;
  const activeWarranties = Array.isArray(warranties) 
    ? warranties.filter((w: any) => w.status === 'approved' || w.status === 'active').length 
    : 0;
  const pendingWarranties = Array.isArray(warranties) 
    ? warranties.filter((w: any) => w.status === 'pending' || w.status === 'submitted').length 
    : 0;

  // Handle view warranty details
  const handleViewDetails = (id: number) => {
    console.log('Navigating to warranty detail:', id);
    setLocation(`/erp/detailer/warranty-detail/${id}`);
  };

  // Navigate to registration form
  const handleRegisterNew = () => {
    setLocation('/erp/detailer/warranty-registration');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold">Warranty Dashboard</h1>
        <Button 
          onClick={handleRegisterNew}
          className="mt-4 md:mt-0"
          size="lg"
        >
          <Plus className="mr-2 h-4 w-4" />
          Register New Warranty
        </Button>
      </div>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card className="bg-slate-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between gap-2">
              <span className="flex items-center">
                <BarChart className="h-5 w-5 mr-2 text-muted-foreground" />
                Total Warranties
              </span>
              <InfoDot widgetId="detailer.warranties.total" fallbackLabel="Total Warranties" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalWarranties}</p>
            <p className="text-sm text-muted-foreground">Total registrations</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between gap-2">
              <span className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Active Warranties
              </span>
              <InfoDot widgetId="detailer.warranties.active" fallbackLabel="Active Warranties" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{activeWarranties}</p>
            <p className="text-sm text-muted-foreground">Currently valid warranties</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between gap-2">
              <span className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-amber-600" />
                Pending for Approval
              </span>
              <InfoDot widgetId="detailer.warranties.pending" fallbackLabel="Pending for Approval" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{pendingWarranties}</p>
            <p className="text-sm text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Warranty Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center">Warranty Registrations</span>
            <InfoDot widgetId="detailer.warranties.table" fallbackLabel="Warranty Registrations" />
          </CardTitle>
          <CardDescription>
            View all warranties registered by you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WarrantyTable
            userRole="detailer"
            onViewDetails={handleViewDetails}
          />
        </CardContent>
      </Card>
    </div>
  );
}