import VasEmbed from './VasEmbed';

// Payouts & Earnings: embeds the real VAS /payouts screen (partner earnings +
// payout history) inside Pulse.
export default function VASPayouts() {
  return <VasEmbed route="/payouts" title="Payouts & Earnings" />;
}
