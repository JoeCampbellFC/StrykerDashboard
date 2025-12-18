"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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


type SearchTerm = {
  id: string;
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
    const id = selectedTermId;
    if (!selectedTermId || !Number.isFinite(id)) return undefined;
    return terms.find((t) => t.id === id);
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
    console.log("Loading documents for date:", date);
    console.log("Selected term:", selectedTermId);
    
    const termValue = terms.find((t) => t.id === selectedTermId)?.term;
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
    console.log("Selected term ID:", termId);
    //const id = Number(termId);
    const termValue = terms.find((t) => t.id === termId)?.term;
    if (termValue) loadChart(termValue).catch(console.error);
  }

  const totalMentions = useMemo(
    () => buckets.reduce((sum, b) => sum + b.count, 0),
    [buckets]
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-6 py-10">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
            <p className="text-sm text-muted-foreground">
              Pick a term, then select a date to view matching documents.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link href="/">Manage terms</Link>
          </Button>
        </header>

        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <CardTitle className="text-base">Search term</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={selectedTermId} onValueChange={onSelectTerm}>
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder="Choose a term" />
                    </SelectTrigger>
                    <SelectContent>
                      {terms.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.term}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                 
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{totalMentions}</span>{" "}
                total mentions
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            {selectedTerm && (
              <CardDescription>
                <span className="font-medium text-foreground">{selectedTerm.term}</span>
                {selectedTerm.category ? (
                  <>
                    {" "}
                    <span className="text-muted-foreground">·</span>{" "}
                    <span>{selectedTerm.category}</span>
                  </>
                ) : null}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">Mentions by date</h2>
                {loadingChart && <span className="text-sm text-muted-foreground">Loading…</span>}
              </div>

              {/* Simple shadcn list instead of custom bar chart */}
              <div className="rounded-lg border">
                {loadingChart ? (
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-3/5" />
                  </div>
                ) : buckets.length ? (
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
                ) : (
                  <div className="p-4 text-sm text-muted-foreground">
                    {selectedTerm
                      ? "No matching documents for this term yet."
                      : "Choose a term to see mention volume."}
                  </div>
                )}
              </div>
            </div>


          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Matching documents</CardTitle>
            <CardDescription>
              {selectedRange
                ? `${selectedRange.count} hits on ${selectedRange.label}`
                : "Select a date to view documents."}
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
