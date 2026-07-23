import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SsoResp {
  enabled: boolean;
  token?: string;
  webUrl?: string;
  error?: string;
}

// VasEmbed renders the REAL VAS app for a given VAS route inside Pulse via an
// auto-authenticated iframe. It mints a per-user VAS JWT through /api/vas/sso and
// hands it to VAS's /sso landing (URL fragment, never a query string) together
// with the target route, so VAS logs the user in and deep-links in one hop.
export default function VasEmbed({ route, title }: { route: string; title?: string }) {
  const { data, isLoading } = useQuery<SsoResp>({ queryKey: ['/api/vas/sso'] });

  if (isLoading || !data) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!data.enabled || !data.token || !data.webUrl) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{title || 'VAS'}</CardTitle>
            <CardDescription>Pulse VAS (SetuPPF)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-700">
              This account isn't linked to VAS yet
              {data.error ? ` (${data.error})` : ''}. Once your VAS access is set up, this tab will
              show your live VAS screens here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const base = String(data.webUrl).replace(/\/+$/, '');
  // Deep-link with ?embed=1 so VAS hides its own chrome (sidebar/header/logo)
  // and shows only the page content inside the Pulse iframe.
  const embeddedRoute = `${route}?embed=1`;
  const src = `${base}/sso#sso_token=${encodeURIComponent(data.token)}&redirect=${encodeURIComponent(embeddedRoute)}`;

  return (
    // Fill the sidebar-layout content region so the embedded app gets real height.
    <div className="h-screen w-full">
      <iframe
        src={src}
        title={title || 'Pulse VAS'}
        className="w-full h-full border-0"
      />
    </div>
  );
}
