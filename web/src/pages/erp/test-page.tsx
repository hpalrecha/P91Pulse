import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestPage() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Test Page</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This is a simple test page to check routing.</p>
          <Button>Test Button</Button>
        </CardContent>
      </Card>
    </div>
  );
}