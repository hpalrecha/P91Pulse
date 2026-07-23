import VasEmbed from './VasEmbed';

// Allocation: embeds the real VAS /allocations screen inside Pulse.
export default function VASAllocations() {
  return <VasEmbed route="/allocations" title="Allocation" />;
}
