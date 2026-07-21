import { useLocation } from 'wouter';
import { useMe } from '@/lib/useMe';
import { InfoDot } from './InfoDot';

/**
 * Floating, in-content developer "i" for the CURRENT page/tab. Renders nothing
 * for non-developers. Keyed `tab:${location}` so it shares the same info + notes
 * thread as the matching sidebar-tab "i". Gives every tab an "i" inside the page
 * content (not just on the sidebar). Mounted once in the layout → covers all pages.
 */
export function PageNotesButton() {
  const { isDeveloper } = useMe();
  const [location] = useLocation();

  if (!isDeveloper) return null;

  const seg = location.split('/').filter(Boolean).pop() || 'home';
  const label = `Page: ${seg}`;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-lg">
      <span className="text-xs font-medium text-gray-600">Page notes</span>
      <InfoDot widgetId={`tab:${location}`} fallbackLabel={label} className="p-0.5" />
    </div>
  );
}

export default PageNotesButton;
