export type Bucket = {
  bucket_date: string; // YYYY-MM-DD
  count: number;
};

export type ChartGranularity = "day" | "month" | "year";

export type DocumentRow = {
  id: number;
  title: string;
  text: string;
  document_date: string;
  customer: string;
  file_link: string;
};

export type SelectedRange = {
  startDate: string;
  endDate: string;
  label: string;
  count: number;
} | null;

export type ChartDataPoint = Bucket & { label: string; trend: number };

export type MonthTrend = {
  totalCount: number;
  addedLast30: number;
  baseBefore30: number;
  percentChange: number | null;
};
