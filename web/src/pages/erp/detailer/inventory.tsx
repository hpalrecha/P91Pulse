import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertCircle } from 'lucide-react';
import { InfoDot } from '@/components/dev/InfoDot';

export default function DetailerInventoryPage() {
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">My Inventory</h1>
          <InfoDot widgetId="detailer.inventory.page" fallbackLabel="My Inventory" />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Track your product inventory and serial numbers.
        </p>
      </div>
      
      <Card className="border-2 border-dashed">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-gray-600 max-w-2xl mx-auto">
              The inventory management feature is currently under development. 
              You'll soon be able to track your product inventory, manage serial numbers, 
              and monitor stock levels directly from this dashboard.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium text-blue-900">What's Coming</p>
                  <ul className="mt-2 text-sm text-blue-700 space-y-1">
                    <li>• View assigned serial numbers and quantities</li>
                    <li>• Track product usage and remaining stock</li>
                    <li>• Monitor inventory levels in real-time</li>
                    <li>• Request additional inventory from your distributor</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
