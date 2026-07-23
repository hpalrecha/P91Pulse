import VasEmbed from './VasEmbed';

// Work Orders: embeds the real VAS /work-orders screen inside Pulse.
export default function VASWorkOrders() {
  return <VasEmbed route="/work-orders" title="Work Orders" />;
}
