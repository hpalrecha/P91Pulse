import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DistributorLayout from '@/components/distributor/DistributorLayout';

export default function DistributorCustomersPage() {
  return (
    <DistributorLayout activeModule="customers">
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Customer Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and analyze customer data across your region.
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Customer Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This page is under construction. Here you'll be able to view and analyze customer data from all detailers in your region.</p>
          </CardContent>
        </Card>
      </div>
    </DistributorLayout>
  );
}