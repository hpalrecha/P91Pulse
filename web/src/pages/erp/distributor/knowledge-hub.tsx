import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoDot } from '@/components/dev/InfoDot';

export default function DistributorKnowledgeHubPage() {
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Knowledge Hub</h1>
        <p className="mt-1 text-sm text-gray-500">
          Access training materials, product specifications, and installation guides.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center">Knowledge Hub</span>
            <InfoDot widgetId="distributor.knowledge.main" fallbackLabel="Knowledge Hub" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>This page is under construction. Here you'll be able to access training materials, product documentation, installation guides, and share them with your detailers.</p>
        </CardContent>
      </Card>
    </div>
  );
}