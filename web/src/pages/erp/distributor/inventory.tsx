import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction, Clock } from 'lucide-react';
import { InfoDot } from '@/components/dev/InfoDot';

export default function DistributorInventoryPage() {
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <InfoDot widgetId="distributor.inventory.page" fallbackLabel="Inventory Management" />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Track and manage your product inventory.
        </p>
      </div>

      {/* Coming Soon Card */}
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-blue-100 p-6">
                <Construction className="w-12 h-12 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Inventory management features are currently under development and will be available soon.
            </p>
            <div className="flex items-center justify-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-2" />
              <span>We're working hard to bring this feature to you</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
