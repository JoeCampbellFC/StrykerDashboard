"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type SearchTerm = {
  id: string;
  term: string;
  category: string;
  created_date: string;
};

type Bucket = {
  bucket_date: string; // YYYY-MM-DD
  count: number;
};

type DocumentRow = {
  id: number;
  title: string;
  text: string;
  document_date: string;
  customer: string;
  file_link: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function DocumentsPage() {
  const [terms, setTerms] = useState<SearchTerm[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>("");

  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  const [selectedRange, setSelectedRange] = useState<{
    startDate: string;
    endDate: string;
    label: string;
    count: number;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);

  const selectedTerm = useMemo(() => {
    if (!selectedTermId) return undefined;
    return terms.find((t) => String(t.id) === String(selectedTermId));
  }, [selectedTermId, terms]);

  useEffect(() => {
    fetch("/api/search-terms", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTerms(data);
      })
      .catch(() => setError("Unable to load search terms"));
  }, []);

  async function loadChart(term: string) {
    setLoadingChart(true);
    setError(null);
    setSelectedRange(null);
    setDocuments([]);
    setBuckets([]);

    try {
      const res = await fetch(`/api/documents?term=${encodeURIComponent(term)}`);
      if (!res.ok) {
        setError("Could not fetch document trends");
        return;
      }

      const data = (await res.json()) as { buckets: Bucket[] };
      setBuckets(Array.isArray(data?.buckets) ? data.buckets : []);
    } catch (e) {
      console.error(e);
      setError("Unexpected error fetching chart data");
    } finally {
      setLoadingChart(false);
    }
  }

  async function loadDocumentsForDate(date: string, count: number) {
    const termValue = terms.find((t) => String(t.id) === String(selectedTermId))?.term;
    if (!termValue) return;

    setLoadingDocuments(true);
    setError(null);
    setSelectedRange({
      startDate: date,
      endDate: date,
      label: formatDate(date),
      count,
    });
    setDocuments([]);

    try {
      const res = await fetch(
        `/api/documents?term=${encodeURIComponent(termValue)}&startDate=${date}&endDate=${date}`
      );

      if (!res.ok) {
        setError("Could not fetch matching documents");
        return;
      }

      const data = (await res.json()) as { documents: DocumentRow[] };
      setDocuments(Array.isArray(data?.documents) ? data.documents : []);
    } catch (e) {
      console.error(e);
      setError("Unexpected error fetching documents");
    } finally {
      setLoadingDocuments(false);
    }
  }

  function onSelectTerm(termId: string) {
    setSelectedTermId(termId);
    const termValue = terms.find((t) => String(t.id) === String(termId))?.term;
    if (termValue) loadChart(termValue).catch(console.error);
  }

  const totalMentions = useMemo(
    () => buckets.reduce((sum, b) => sum + b.count, 0),
    [buckets]
  );

  const daysWithMentions = useMemo(() => buckets.filter((b) => b.count > 0).length, [buckets]);

  const chartData = useMemo(
    () =>
      buckets.map((b) => ({
        ...b,
        label: formatShortDate(b.bucket_date),
      })),
    [buckets]
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-10">
        {/* Header (dashboard-ish) */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>

              {/* Search term next to title */}
              <div className="flex items-center gap-2">
                <Select value={selectedTermId} onValueChange={onSelectTerm}>
                  <SelectTrigger className="w-[320px]">
                    <SelectValue placeholder="Choose a search term" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.term}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedTerm?.category ? (
                  <Badge variant="secondary" className="hidden sm:inline-flex">
                    {selectedTerm.category}
                  </Badge>
                ) : null}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Pick a term, then click a bar to view matching documents for that date.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/">Manage terms</Link>
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* KPI cards (shadcn dashboard vibe) */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total mentions</CardDescription>
              <CardTitle className="text-2xl">{totalMentions}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Across all returned dates for the selected term.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Selected term</CardDescription>
              <CardTitle className="text-xl">
                {selectedTerm ? selectedTerm.term : "—"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {selectedTerm?.category ? `Category: ${selectedTerm.category}` : "Choose a term to begin."}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Days with mentions</CardDescription>
              <CardTitle className="text-2xl">{selectedTerm ? daysWithMentions : "—"}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Number of dates that have at least one match.
            </CardContent>
          </Card>
        </div>

        {/* Chart + (optional) list */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Mentions by date</CardTitle>
            <CardDescription>
              {selectedTerm ? "Click a bar to drill into documents for that day." : "Choose a term to see the trend."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Separator />

            <div className="rounded-lg border p-4">
              {loadingChart ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : !selectedTerm ? (
                <div className="text-sm text-muted-foreground">Select a term to load the chart.</div>
              ) : chartData.length ? (
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      onClick={(state: any) => {
                        // Clicking a bar gives activePayload[0].payload
                        const p = state?.activePayload?.[0]?.payload as Bucket | undefined;
                        if (p?.bucket_date) loadDocumentsForDate(p.bucket_date, (p as any).count).catch(console.error);
                      }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        width={30}
                      />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted))" }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const row = payload[0].payload as any;
                          return (
                            <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-sm">
                              <div className="font-medium">{formatDate(row.bucket_date)}</div>
                              <div className="text-muted-foreground">{row.count} mentions</div>
                              <div className="mt-1 text-muted-foreground">Click to view documents</div>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No matching documents for this term yet.</div>
              )}
            </div>

            {/* Keep a compact list underneath (nice on mobile + mirrors your previous UI) */}
            {!!selectedTerm && !loadingChart && buckets.length > 0 && (
              <div className="rounded-lg border">
                <div className="px-4 py-3 text-sm font-medium">Quick select</div>
                <div className="divide-y">
                  {buckets.map((b) => (
                    <button
                      key={b.bucket_date}
                      onClick={() => loadDocumentsForDate(b.bucket_date, b.count)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{b.count}</Badge>
                        <span className="text-sm">{formatDate(b.bucket_date)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">View</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents table */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Matching documents</CardTitle>
            <CardDescription>
              {selectedRange
                ? `${selectedRange.count} hits on ${selectedRange.label}`
                : "Select a date from the chart to view documents."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {loadingDocuments && <p className="text-sm text-muted-foreground">Loading…</p>}
            {selectedRange && !documents.length && !loadingDocuments && (
              <p className="text-sm text-muted-foreground">No documents matched this date.</p>
            )}

            {documents.length > 0 && (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead className="whitespace-nowrap">Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>File</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="align-top">
                          <div className="space-y-1">
                            <div className="font-medium">{doc.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {doc.text.slice(0, 140)}
                              {doc.text.length > 140 ? "…" : ""}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap align-top">
                          {formatDate(doc.document_date)}
                        </TableCell>
                        <TableCell className="align-top">{doc.customer}</TableCell>
                        <TableCell className="align-top">
                          <Button asChild variant="link" className="h-auto p-0">
                            <a href={doc.file_link} target="_blank" rel="noreferrer">
                              Open
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
