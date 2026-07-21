import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { InfoDot } from './InfoDot';

/**
 * Drop-in replacement for the repeated dashboard KPI card
 * (Card > CardHeader > CardTitle > CardContent). Visually identical to the
 * hand-rolled boxes, but takes an optional `widgetId` that renders a
 * developer-only "i" InfoDot in the header (info box + comment thread).
 */
export interface MetricCardProps {
  title: React.ReactNode;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  subtitleClassName?: string;
  /** Stable widget id (e.g. "admin.dashboard.totalUsers") — enables the InfoDot. */
  widgetId?: string;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  subtitleClassName,
  widgetId,
  loading,
  icon,
  className,
}: MetricCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between gap-2">
          <span className="flex items-center">
            {icon}
            {title}
          </span>
          {widgetId ? <InfoDot widgetId={widgetId} /> : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? '...' : value}</div>
        {subtitle != null && (
          <p className={cn('text-xs text-gray-500 mt-1', subtitleClassName)}>{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default MetricCard;
