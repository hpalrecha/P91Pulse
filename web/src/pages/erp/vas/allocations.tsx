import { VASListPage } from './VASListPage';

// VAS Allocations (partner-level) surfaced inside Pulse (read).
export default function VASAllocations() {
  return (
    <VASListPage
      title="Allocation"
      description="Your VAS brand/service allocations."
      endpoint="/api/vas/allocations"
      columns={[
        { key: 'name', label: 'Allocation', fallback: 'id' },
        { key: 'priority', label: 'Priority' },
        { key: 'brand', label: 'Brand' },
        { key: 'category', label: 'Category' },
        { key: 'isActive', label: 'Active', bool: true },
      ]}
    />
  );
}
