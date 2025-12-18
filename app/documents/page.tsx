"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
          <Link href="/">
            <Button variant="outline">Manage terms</Button>
          </Link>
        </header>

        <Card className="border-slate-200/90 bg-white/90">
          <CardHeader className="flex flex-col gap-1 border-none px-6 pb-2 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Search term
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Select value={selectedTermId ?? ""} onChange={(e) => onSelectTerm(e.target.value)}>
                    <option value="" disabled>
                      Choose a saved search term
                    </option>
                    {terms.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.term} — {t.category}
                      </option>
                    ))}
                  </Select>
                  {selectedTerm ? (
                    <Badge variant="success">Ready to explore</Badge>
                  ) : (
                    <Badge variant="warning">Pick a term to begin</Badge>
                  )}
                </div>
              </div>
              <div className="text-right text-sm text-slate-500">
                <p className="font-semibold uppercase tracking-wide">Last refresh</p>
                <p className="text-slate-800">{new Date().toLocaleString()}</p>
              </div>
            </div>
            {error && (
              <div className="mt-3 w-full rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}
          </CardHeader>

          <CardContent className="grid gap-6 lg:grid-cols-[1fr_280px]">
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
                      className="group relative flex flex-1 items-end justify-center rounded-md bg-gradient-to-t from-slate-900 to-slate-700 text-white shadow transition hover:translate-y-[-2px] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
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

            <Card className="border-slate-800 bg-slate-900 text-white shadow-none">
              <CardHeader className="gap-2 border-none px-5 pt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">Summary</p>
                <CardTitle className="text-2xl text-white">
                  {selectedTerm ? selectedTerm.term : "No term selected"}
                </CardTitle>
                <CardDescription className="text-sm text-slate-200">
                  {selectedTerm?.category ?? "Category TBD"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-5 pb-6">
                <div className="flex items-center justify-between rounded-xl bg-slate-800/70 px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-300">Total mentions</p>
                    <p className="text-3xl font-semibold">
                      {buckets.reduce((sum, b) => sum + b.count, 0)}
                    </p>
                  </div>
                  <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">Click bars to drill down</Badge>
                </div>
                <p className="text-sm text-slate-200">
                  Review the timeline on the left, then select a bar to view the underlying
                  documents for that date.
                </p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 bg-white/90">
          <CardHeader className="border-none pb-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Matching documents
            </p>
            <CardTitle className="text-xl text-slate-900">
              {selectedRange ? `${selectedRange.count} hits on ${selectedRange.label}` : "Pick a date bar to inspect documents"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {loadingDocuments && <p className="text-sm text-slate-500">Loading…</p>}
            {selectedRange && !documents.length && !loadingDocuments && (
              <p className="text-sm text-slate-600">No documents matched this date.</p>
            )}

            {documents.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Link</TableHead>
                      <TableHead>Snippet</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-semibold text-slate-900">{doc.title}</TableCell>
                        <TableCell className="text-slate-700">{formatDate(doc.document_date)}</TableCell>
                        <TableCell className="text-slate-700">{doc.customer}</TableCell>
                        <TableCell>
                          <a
                            href={doc.file_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-500"
                          >
                            Open file
                          </a>
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {doc.text.slice(0, 160)}
                          {doc.text.length > 160 ? "…" : ""}
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
