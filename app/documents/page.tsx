"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SearchTerm = {
  id: number;
  term: string;
  category: string;
  created_date: string;
};

type Bucket = {
  bucket_date: string;
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

export default function DocumentsPage() {
  const [terms, setTerms] = useState<SearchTerm[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);
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

  const selectedTerm = useMemo(
    () => terms.find((t) => t.id === selectedTermId),
    [selectedTermId, terms]
  );

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
    if (!selectedTerm?.term) return;
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
        `/api/documents?term=${encodeURIComponent(selectedTerm.term)}&startDate=${date}&endDate=${date}`
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

  function onSelectTerm(value: string) {
    const id = Number(value);
    if (!Number.isFinite(id)) return;
    setSelectedTermId(id);
    const termValue = terms.find((t) => t.id === id)?.term;
    if (termValue) loadChart(termValue).catch(console.error);
  }

  const maxCount = useMemo(
    () => Math.max(...buckets.map((b) => b.count), 1),
    [buckets]
  );

  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pt-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Document intelligence
            </p>
            <h1 className="text-3xl font-bold text-slate-900">
              Track search terms across uploaded documents
            </h1>
            <p className="max-w-3xl text-base text-slate-600">
              Select a term to see daily mention volume from the documents table. Click a bar to
              review the matching files in that date window.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            Manage terms
          </Link>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Search term
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedTermId ?? ""}
                  onChange={(e) => onSelectTerm(e.target.value)}
                  className="h-11 min-w-[240px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="" disabled>
                    Choose a saved search term
                  </option>
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.term} — {t.category}
                    </option>
                  ))}
                </select>
                {selectedTerm ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Ready to explore
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> Pick a term to begin
                  </span>
                )}
              </div>
            </div>
            <div className="text-right text-sm text-slate-500">
              <p className="font-semibold uppercase tracking-wide">Last refresh</p>
              <p className="text-slate-800">{new Date().toLocaleString()}</p>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700">Mentions by date</h2>
                {loadingChart && <span className="text-sm font-medium text-slate-500">Loading…</span>}
              </div>

              <div className="flex h-72 items-end gap-2 rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white px-4 pb-4 pt-6 shadow-inner">
                {loadingChart ? (
                  <div className="mx-auto text-sm font-medium text-slate-500">Preparing chart…</div>
                ) : buckets.length ? (
                  buckets.map((bucket) => (
                    <button
                      key={bucket.bucket_date}
                      onClick={() => loadDocumentsForDate(bucket.bucket_date, bucket.count)}
                      className="group relative flex flex-1 items-end justify-center rounded-md bg-gradient-to-t from-slate-800 to-slate-600 text-white shadow transition hover:translate-y-[-2px] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                      style={{ height: `${Math.max((bucket.count / maxCount) * 100, 10)}%` }}
                      title={`${bucket.count} matches on ${formatDate(bucket.bucket_date)}`}
                    >
                      <span className="absolute -top-7 text-xs font-semibold text-slate-800">
                        {bucket.count}
                      </span>
                      <span className="absolute -bottom-10 w-full text-center text-[11px] font-medium text-slate-600">
                        {formatDate(bucket.bucket_date)}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="mx-auto text-center text-sm font-medium text-slate-500">
                    {selectedTerm
                      ? "No matching documents for this term yet"
                      : "Choose a term to see mention volume"}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">Summary</p>
              <h3 className="mt-2 text-2xl font-bold">
                {selectedTerm ? selectedTerm.term : "No term selected"}
              </h3>
              <p className="mt-1 text-sm text-slate-200">{selectedTerm?.category ?? "Category TBD"}</p>
              <div className="mt-6 flex items-center justify-between rounded-lg bg-slate-800/60 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-300">Total mentions</p>
                  <p className="text-3xl font-semibold">{buckets.reduce((sum, b) => sum + b.count, 0)}</p>
                </div>
                <div className="rounded-full bg-emerald-100/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                  Click bars to drill down
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-200">
                Review the timeline on the left, then select a bar to view the underlying
                documents for that date.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Matching documents
              </p>
              <h2 className="text-xl font-semibold text-slate-900">
                {selectedRange
                  ? `${selectedRange.count} hits on ${selectedRange.label}`
                  : "Pick a date bar to inspect documents"}
              </h2>
            </div>
            {loadingDocuments && <span className="text-sm font-medium text-slate-500">Loading…</span>}
          </div>

          {selectedRange && !documents.length && !loadingDocuments && (
            <p className="mt-4 text-sm text-slate-600">No documents matched this date.</p>
          )}

          {documents.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Link</th>
                    <th className="px-4 py-3">Snippet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{doc.title}</td>
                      <td className="px-4 py-3 text-slate-700">{formatDate(doc.document_date)}</td>
                      <td className="px-4 py-3 text-slate-700">{doc.customer}</td>
                      <td className="px-4 py-3">
                        <a
                          href={doc.file_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-500"
                        >
                          Open file
                        </a>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {doc.text.slice(0, 160)}
                        {doc.text.length > 160 ? "…" : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
