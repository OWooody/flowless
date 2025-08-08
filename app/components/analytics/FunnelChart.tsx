'use client';

import { FunnelChart as RechartsFunnelChart, Funnel, Cell, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';

interface FunnelStep {
  eventType: string;
  count: number;
  conversionRate: number;
  filters: Record<string, string>;
}

interface FunnelChartProps {
  steps: FunnelStep[];
}

interface CustomTooltipProps extends TooltipProps<any, any> {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      value: number;
      conversionRate: number;
      filters: Record<string, string>;
    };
  }>;
}

export default function FunnelChart({ steps }: FunnelChartProps) {
  const data = steps.map((step, index) => ({
    name: step.eventType,
    value: step.count,
    conversionRate: step.conversionRate,
    filters: step.filters
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">Count: {data.value}</p>
          <p className="text-sm text-gray-600">Conversion: {data.conversionRate.toFixed(1)}%</p>
          {Object.entries(data.filters).length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-700">Filters:</p>
              {Object.entries(data.filters).map(([key, value]) => (
                <p key={key} className="text-sm text-gray-600">
                  {key}: {value}
                </p>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsFunnelChart>
          <Tooltip content={<CustomTooltip />} />
          <Funnel
            dataKey="value"
            data={data}
            isAnimationActive
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={1 - (index * 0.1)}
              />
            ))}
          </Funnel>
        </RechartsFunnelChart>
      </ResponsiveContainer>
    </div>
  );
} 