import { VASListPage } from './VASListPage';

// VAS Work Orders surfaced inside Pulse (read). Columns adapt to whatever VAS
// returns; we render the common fields.
export default function VASWorkOrders() {
  return (
    <VASListPage
      title="Work Orders"
      description="Your VAS work orders, shown inside Pulse."
      endpoint="/api/vas/work-orders"
      columns={[
        { key: 'workOrderNumber', label: 'WO #', fallback: 'id' },
        { key: 'customerName', label: 'Customer' },
        { key: 'regNo', label: 'Vehicle' },
        { key: 'status', label: 'Status', badge: true },
        { key: 'appointmentAt', label: 'Appointment', date: true },
        { key: 'estimatedPrice', label: 'Est. ₹' },
      ]}
    />
  );
}
