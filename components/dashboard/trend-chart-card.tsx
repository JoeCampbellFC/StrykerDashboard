import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Bucket, ChartDataPoint, ChartGranularity, MonthTrend } from "@/types/documents";

type TrendChartCardProps = {
  chartData: ChartDataPoint[];
  chartGranularity: ChartGranularity;
  loadingChart: boolean;
  buckets: Bucket[];
  onGranularityChange: (value: ChartGranularity) => void;
  onSelectBucket: (date: string, count: number) => void;
  monthTrend: MonthTrend | null;
};

export function TrendChartCard({
  chartData,
  chartGranularity,
  loadingChart,
  buckets,
  onGranularityChange,
  onSelectBucket,
  monthTrend,
}: TrendChartCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base">Document mentions over time</CardTitle>
          <p className="text-sm text-muted-foreground">
            Click a bar to load documents for that period.
          </p>
        </div>

        <Select value={chartGranularity} onValueChange={(value) => onGranularityChange(value as ChartGranularity)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select granularity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Daily</SelectItem>
            <SelectItem value="month">Monthly</SelectItem>
            <SelectItem value="year">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="pt-0">
        {loadingChart ? (
          <div className="grid gap-2">
            <Skeleton className="h-8 w-[160px]" />
            <Skeleton className="h-[280px] w-full" />
          </div>
        ) : buckets.length ? (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary align-middle" />
              Total mentions for selected period
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: 0, right: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis
                    allowDecimals={false}
                    width={36}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => [value, "Mentions"]}
                    labelFormatter={(value) => `Period: ${value}`}
                    contentStyle={{ borderRadius: 8 }}
                    cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
                  />
                  <Bar
                    dataKey="trend"
                    fill="hsl(var(--muted))"
                    radius={[6, 6, 0, 0]}
                    barSize={8}
                  />
                  <Bar
                    dataKey="count"
                    radius={[6, 6, 0, 0]}
                    className="cursor-pointer"
                    onClick={(data: { payload?: ChartDataPoint }) => {
                      const payload = data?.payload;
                      if (payload?.bucket_date) {
                        onSelectBucket(payload.bucket_date, payload.count);
                      }
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {monthTrend && monthTrend.percentChange !== null && (
              <div className="flex items-center gap-4 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                <div className="font-medium text-foreground">Last 30 days</div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1">
                  {monthTrend.percentChange > 0 ? "+" : ""}
                  {monthTrend.percentChange}% vs prior period
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div>{monthTrend.totalCount} total mentions</div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No matching documents for this term yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
