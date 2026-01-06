"use client";

import { useEffect, useMemo, useState } from "react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DocumentsTable } from "@/components/dashboard/documents-table";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { ManageTermsModal } from "@/components/dashboard/manage-terms-modal";
import { TrendChartCard } from "@/components/dashboard/trend-chart-card";
import {
  ChartDataPoint,
  ChartGranularity,
  DocumentRow,
  SelectedRange,
  Bucket,
  MonthTrend,
} from "@/types/documents";
import { SearchTerm } from "@/types/searchTerm";

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

  const [selectedRange, setSelectedRange] = useState<SelectedRange>(null);

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
          !data.some((term: SearchTerm) => String(term.id) === String(selectedTermId))
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

  const monthTrend = useMemo<MonthTrend | null>(() => {
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

  const chartData = useMemo<ChartDataPoint[]>(() => {
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
      <DashboardHeader
        terms={terms}
        selectedTermId={selectedTermId}
        onSelectTerm={onSelectTerm}
        onOpenManageTerms={() => setIsManageTermsOpen(true)}
      />

      <div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <KpiCards
          totalMentions={totalMentions}
          selectedTerm={selectedTerm}
          monthTrend={monthTrend}
          granularityLabel={granularityLabel}
        />

        <TrendChartCard
          chartData={chartData}
          chartGranularity={chartGranularity}
          loadingChart={loadingChart}
          buckets={buckets}
          onGranularityChange={setChartGranularity}
          onSelectBucket={(date, count) =>
            loadDocumentsForBucket(date, count).catch(console.error)
          }
          monthTrend={monthTrend}
        />

        <DocumentsTable
          selectedRange={selectedRange}
          documents={documents}
          loadingDocuments={loadingDocuments}
          granularityLabel={granularityLabel}
          formatDate={formatDate}
        />
      </div>

      <ManageTermsModal
        isOpen={isManageTermsOpen}
        terms={terms}
        termsLoading={termsLoading}
        termsError={termsError}
        newTerm={newTerm}
        editingId={editingId}
        editingTerm={editingTerm}
        savingTermId={savingTermId}
        deletingTermId={deletingTermId}
        onNewTermChange={setNewTerm}
        onEditingTermChange={setEditingTerm}
        onCreateTerm={createTerm}
        onStartEditing={startEditing}
        onCancelEditing={cancelEditing}
        onSaveEditing={saveEditing}
        onDeleteTerm={deleteTerm}
        onClose={() => setIsManageTermsOpen(false)}
        formatDate={formatDate}
      />
    </main>
  );
}
