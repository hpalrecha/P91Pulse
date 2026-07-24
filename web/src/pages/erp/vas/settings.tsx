import VasEmbed from './VasEmbed';

// Settings: embeds the real VAS /settings screen (account/business settings)
// inside Pulse.
export default function VASSettings() {
  return <VasEmbed route="/settings" title="Settings" />;
}
