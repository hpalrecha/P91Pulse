export const LEAD_LOSS_REASONS = [
  'price_issue',
  'lost_to_competitor',
  'budget_constraints',
  'timing_not_right',
  'no_response',
  'product_unavailable',
  'technical_issues',
  'changed_requirements',
  'other'
] as const;

export type LeadLossReason = typeof LEAD_LOSS_REASONS[number];
