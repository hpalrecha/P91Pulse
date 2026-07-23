import VasEmbed from './VasEmbed';

// VAS Admin: embeds the FULL VAS super-admin console (with VAS's own nav) inside
// Pulse. Pulse admins authenticate AS the configured VAS super-admin. Uses
// chromeless={false} so VAS shows its own navigation, landing on /dashboard.
export default function VASAdminConsole() {
  return <VasEmbed route="/dashboard" chromeless={false} title="VAS Admin" />;
}
