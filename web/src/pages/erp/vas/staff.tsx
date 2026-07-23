import VasEmbed from './VasEmbed';

// Staff Management: embeds the real VAS /partner-staff screen inside Pulse.
// (VAS's partner-staff management route; the closest/dedicated staff UI page.)
export default function VASStaff() {
  return <VasEmbed route="/partner-staff" title="Staff Management" />;
}
