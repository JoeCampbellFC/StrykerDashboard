"use client";

import { useEffect, useMemo, useState } from "react";
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";
import Image from "next/image";
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
import { Input } from "@/components/ui/input";

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
  created_date: string;
};

type Bucket = {
  bucket_date: string; // YYYY-MM-DD
  count: number;
};

type ChartGranularity = "day" | "month" | "year";

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

function formatMonthYear(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

function formatYear(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
  });
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function DocumentsPage() {
  const [terms, setTerms] = useState<SearchTerm[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>("");
  const [termsLoading, setTermsLoading] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  const [isManageTermsOpen, setIsManageTermsOpen] = useState(false);
  const [newTerm, setNewTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTerm, setEditingTerm] = useState("");
  const [savingTermId, setSavingTermId] = useState<string | null>(null);
  const [deletingTermId, setDeletingTermId] = useState<string | null>(null);

  const [chartGranularity, setChartGranularity] =
    useState<ChartGranularity>("day");

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

  const selectedTermValue = selectedTerm?.term ?? "";

  useEffect(() => {
    refreshTerms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedTermValue) return;
    loadChart(selectedTermValue, chartGranularity).catch(console.error);
  }, [selectedTermValue, chartGranularity]);

  async function refreshTerms() {
    setTermsLoading(true);
    setTermsError(null);

    try {
      const res = await fetch("/api/search-terms", { cache: "no-store" });
      if (!res.ok) {
        setTermsError("Unable to load search terms");
        return;
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setTerms(data);
        if (
          selectedTermId &&
          !data.some((term) => String(term.id) === String(selectedTermId))
        ) {
          setSelectedTermId("");
        }
      }
    } catch (e) {
      console.error(e);
      setTermsError("Unable to load search terms");
    } finally {
      setTermsLoading(false);
    }
  }

  async function createTerm() {
    const termValue = newTerm.trim();
    if (!termValue) {
      setTermsError("Search term is required.");
      return;
    }

    setTermsError(null);
    setSavingTermId("new");
    try {
      const res = await fetch("/api/search-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: termValue }),
      });
      if (!res.ok) {
        setTermsError("Unable to create search term.");
        return;
      }

      const created = (await res.json()) as SearchTerm;
      setTerms((prev) => [created, ...prev]);
      setNewTerm("");
    } catch (e) {
      console.error(e);
      setTermsError("Unable to create search term.");
    } finally {
      setSavingTermId(null);
    }
  }

  function startEditing(term: SearchTerm) {
    setEditingId(String(term.id));
    setEditingTerm(term.term);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingTerm("");
  }

  async function saveEditing(id: string) {
    const termValue = editingTerm.trim();
    if (!termValue) {
      setTermsError("Search term is required.");
      return;
    }

    setTermsError(null);
    setSavingTermId(id);
    try {
      const res = await fetch(`/api/search-terms/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: termValue }),
      });

      if (!res.ok) {
        setTermsError("Unable to update search term.");
        return;
      }

      const updated = (await res.json()) as SearchTerm;
      setTerms((prev) =>
        prev.map((term) => (String(term.id) === id ? updated : term))
      );
      cancelEditing();
    } catch (e) {
      console.error(e);
      setTermsError("Unable to update search term.");
    } finally {
      setSavingTermId(null);
    }
  }

  async function deleteTerm(id: string) {
    setTermsError(null);
    setDeletingTermId(id);
    try {
      const res = await fetch(`/api/search-terms/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setTermsError("Unable to delete search term.");
        return;
      }

      setTerms((prev) => prev.filter((term) => String(term.id) !== id));
      if (String(selectedTermId) === id) {
        setSelectedTermId("");
      }
    } catch (e) {
      console.error(e);
      setTermsError("Unable to delete search term.");
    } finally {
      setDeletingTermId(null);
    }
  }

  async function loadChart(term: string, granularity: ChartGranularity) {
    setLoadingChart(true);
    setError(null);
    setSelectedRange(null);
    setDocuments([]);
    setBuckets([]);

    try {
      const res = await fetch(
        `/api/documents?term=${encodeURIComponent(
          term
        )}&granularity=${granularity}`
      );
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

  function getBucketRange(date: string, granularity: ChartGranularity) {
    const baseDate = new Date(`${date}T00:00:00`);
    if (granularity === "month") {
      const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
      const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
      return {
        startDate: formatDateKey(start),
        endDate: formatDateKey(end),
        label: formatMonthYear(date),
      };
    }
    if (granularity === "year") {
      const start = new Date(baseDate.getFullYear(), 0, 1);
      const end = new Date(baseDate.getFullYear(), 11, 31);
      return {
        startDate: formatDateKey(start),
        endDate: formatDateKey(end),
        label: formatYear(date),
      };
    }
    return {
      startDate: date,
      endDate: date,
      label: formatDate(date),
    };
  }

  function formatBucketLabel(date: string, granularity: ChartGranularity) {
    if (granularity === "month") return formatMonthYear(date);
    if (granularity === "year") return formatYear(date);
    return formatShortDate(date);
  }

  async function loadDocumentsForBucket(date: string, count: number) {
    if (!selectedTermValue) return;

    const range = getBucketRange(date, chartGranularity);
    setLoadingDocuments(true);
    setError(null);
    setSelectedRange({
      startDate: range.startDate,
      endDate: range.endDate,
      label: range.label,
      count,
    });
    setDocuments([]);

    try {
      const res = await fetch(
        `/api/documents?term=${encodeURIComponent(
          selectedTermValue
        )}&startDate=${range.startDate}&endDate=${
          range.endDate
        }&granularity=${chartGranularity}`
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
  }

  const totalMentions = useMemo(
    () => buckets.reduce((sum, b) => sum + b.count, 0),
    [buckets]
  );

  const monthTrend = useMemo(() => {
    if (!buckets.length) return null;

    const sorted = [...buckets].sort(
      (a, b) =>
        new Date(a.bucket_date).getTime() - new Date(b.bucket_date).getTime()
    );

    const latestDate = new Date(sorted[sorted.length - 1].bucket_date);
    if (Number.isNaN(latestDate.getTime())) return null;

    const end = latestDate.getTime();
    const start = new Date(latestDate);
    start.setDate(start.getDate() - 30);

    const totalCount = sorted.reduce((sum, b) => sum + b.count, 0);

    const addedLast30 = sorted
      .filter((b) => {
        const time = new Date(b.bucket_date).getTime();
        return time > start.getTime() && time <= end;
      })
      .reduce((sum, b) => sum + b.count, 0);

    const baseBefore30 = totalCount - addedLast30;

    const percentChange =
      baseBefore30 <= 0
        ? addedLast30 > 0
          ? null
          : 0
        : Math.round((addedLast30 / baseBefore30) * 100);

    return {
      totalCount,
      addedLast30,
      baseBefore30,
      percentChange,
    } as const;
  }, [buckets]);

  const chartData = useMemo(() => {
    const windowSize =
      chartGranularity === "day" ? 7 : chartGranularity === "month" ? 3 : 2;

    return buckets.map((b, index) => {
      const slice = buckets.slice(
        Math.max(0, index - windowSize + 1),
        index + 1
      );
      const average =
        slice.reduce((sum, entry) => sum + entry.count, 0) / slice.length;

      return {
        ...b,
        label: formatBucketLabel(b.bucket_date, chartGranularity),
        trend: Number.isFinite(average) ? Number(average.toFixed(1)) : 0,
      };
    });
  }, [buckets, chartGranularity]);

  const granularityLabel =
    chartGranularity === "day"
      ? "day"
      : chartGranularity === "month"
      ? "month"
      : "year";

  return (

    
    <main className="min-h-screen bg-background">
      {/* Shadcn-style header */}
    <header className="sticky top-0 z-40 w-full border-b-1 border-[#ffb500] bg-background">

  <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-6 py-3">

    {/* Logo + Title */}
    <div className="flex items-center gap-3">
      <Image
        src="/stryker-logo.png"
        alt="Stryker logo"
        width={128}
        height={128}
        className="shrink-0"
      />

      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-semibold leading-tight">
          Document Intelligence
        </span>
        <span className="text-xs text-muted-foreground">
          Turn document mentions into actionable insights
        </span>
      </div>
    </div>

    {/* Right side actions */}
    <div className="ml-auto flex w-full max-w-[520px] items-center gap-2">
      <Select value={selectedTermId} onValueChange={onSelectTerm}>
        <SelectTrigger className="w-full">
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

      <Button variant="outline" onClick={() => setIsManageTermsOpen(true)}>
        Manage terms
      </Button>
    </div>
  </div>
</header>


      <div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* KPI cards */}
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
              {selectedTerm ? "Current selection." : "Choose a term to begin."}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Trends</CardDescription>
              <CardTitle className="text-2xl">
                {selectedTerm && monthTrend ? (
                  <span className="flex items-center gap-2">
                    <span>
                      {monthTrend.percentChange === null
                        ? "New"
                        : monthTrend.percentChange === 0
                        ? "0%"
                        : `${monthTrend.percentChange > 0 ? "+" : ""}${
                            monthTrend.percentChange
                          }%`}
                    </span>

                    <span className="text-muted-foreground flex items-center">
                      {monthTrend.percentChange === null ||
                      monthTrend.percentChange > 0 ? (
                        <IconTrendingUp
                          size={16}
                          className="animate-pulse opacity-80"
                          aria-label="Trending up"
                        />
                      ) : monthTrend.percentChange < 0 ? (
                        <IconTrendingDown
                          size={16}
                          className="animate-pulse opacity-80"
                          aria-label="Trending down"
                        />
                      ) : (
                        "—"
                      )}
                    </span>
                  </span>
                ) : (
                  "—"
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className="text-xs text-muted-foreground">
              {selectedTerm && monthTrend
                ? `Past 30 days: +${monthTrend.addedLast30} (was ${monthTrend.baseBefore30}; now ${monthTrend.totalCount}).`
                : `Number of ${granularityLabel}s that have at least one match.`}
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader className="space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-base">
                  Mentions by {granularityLabel}
                </CardTitle>
                <CardDescription>
                  {selectedTerm
                    ? `Click a bar to drill into documents for that ${granularityLabel}.`
                    : "Choose a term to see the trend."}
                </CardDescription>
              </div>

              <div className="inline-flex items-center gap-1 rounded-md border bg-muted/30 p-1">
                {([
                  { value: "day", label: "Day" },
                  { value: "month", label: "Month" },
                  { value: "year", label: "Year" },
                ] as const).map((option) => (
                  <Button
                    key={option.value}
                    size="sm"
                    variant={
                      chartGranularity === option.value ? "secondary" : "ghost"
                    }
                    onClick={() => setChartGranularity(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
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
                <div className="text-sm text-muted-foreground">
                  Select a term to load the chart.
                </div>
              ) : chartData.length ? (
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 16, left: 24, bottom: 8 }}
                      barCategoryGap="20%"
                      barGap={2}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                        minTickGap={12}
                        tickMargin={8}
                        padding={{ left: 12, right: 12 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        width={44}
                        tickMargin={6}
                      />
                      <Tooltip
                        cursor={false}
                        wrapperStyle={{ outline: "none", zIndex: 50 }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const row = payload[0].payload as any;
                          const title =
                            chartGranularity === "day"
                              ? formatDate(row.bucket_date)
                              : formatBucketLabel(
                                  row.bucket_date,
                                  chartGranularity
                                );

                          return (
                            <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-sm">
                              <div className="font-medium">{title}</div>
                              <div className="text-muted-foreground">
                                {row.count} mentions
                              </div>
                              <div className="mt-1 text-muted-foreground">
                                Click to view documents
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Bar
                        dataKey="count"
                        radius={[6, 6, 0, 0]}
                        className="cursor-pointer"
                        onClick={(data: any) => {
                          const p = data?.payload as Bucket | undefined;
                          if (p?.bucket_date) {
                            loadDocumentsForBucket(
                              p.bucket_date,
                              (p as any).count
                            ).catch(console.error);
                          }
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No matching documents for this term yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Documents table */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Matching documents</CardTitle>
            <CardDescription>
              {selectedRange
                ? `${selectedRange.count} hits in ${selectedRange.label}`
                : "Select a bar from the chart to view documents."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {loadingDocuments && (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
            {selectedRange && !documents.length && !loadingDocuments && (
              <p className="text-sm text-muted-foreground">
                No documents matched this {granularityLabel}.
              </p>
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

      {/* Manage terms modal */}
      {isManageTermsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl space-y-4 rounded-lg bg-background p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Manage search terms</h2>
                <p className="text-sm text-muted-foreground">
                  Add, edit, or remove the terms used to track document mentions.
                </p>
              </div>
              <Button variant="ghost" onClick={() => setIsManageTermsOpen(false)}>
                Close
              </Button>
            </div>

            {termsError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {termsError}
              </div>
            )}

            <div className="space-y-3 rounded-lg border p-4">
              <div className="text-sm font-medium">Add new term</div>
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <Input
                  placeholder="Search term"
                  value={newTerm}
                  onChange={(event) => setNewTerm(event.target.value)}
                />
                <Button
                  onClick={() => createTerm()}
                  disabled={savingTermId === "new"}
                  className="md:w-[140px]"
                >
                  {savingTermId === "new" ? "Saving..." : "Add term"}
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Term</TableHead>
                    <TableHead className="whitespace-nowrap">Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {termsLoading ? (
                    <TableRow>
                      <TableCell className="text-sm text-muted-foreground">
                        Loading terms...
                      </TableCell>
                    </TableRow>
                  ) : terms.length ? (
                    terms.map((term) => {
                      const isEditing = String(term.id) === editingId;
                      const isSaving = savingTermId === String(term.id);
                      const isDeleting = deletingTermId === String(term.id);

                      return (
                        <TableRow key={term.id}>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                value={editingTerm}
                                onChange={(event) => setEditingTerm(event.target.value)}
                              />
                            ) : (
                              <div className="font-medium">{term.term}</div>
                            )}
                          </TableCell>

                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {formatDate(term.created_date)}
                          </TableCell>

                          <TableCell>
                            <div className="flex justify-end gap-2">
                              {isEditing ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => saveEditing(String(term.id))}
                                    disabled={isSaving}
                                  >
                                    {isSaving ? "Saving..." : "Save"}
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={cancelEditing}>
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => startEditing(term)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => deleteTerm(String(term.id))}
                                    disabled={isDeleting}
                                  >
                                    {isDeleting ? "Deleting..." : "Delete"}
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell className="text-sm text-muted-foreground">
                        No terms yet. Add one to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
