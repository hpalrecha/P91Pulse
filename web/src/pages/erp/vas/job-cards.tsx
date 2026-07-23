import VasEmbed from './VasEmbed';

// Job Cards: embeds the real VAS /job-cards screen inside Pulse.
export default function VASJobCards() {
  return <VasEmbed route="/job-cards" title="Job Cards" />;
}
