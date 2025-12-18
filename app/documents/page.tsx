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
    <main
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at 20% 20%, #f0f7ff, #fdf6ff 45%, #f9fbff)",
        padding: "48px 24px 64px",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div>
            <p style={{ color: "#6b7280", margin: 0, fontWeight: 600 }}>Document intelligence</p>
            <h1
              style={{
                fontSize: 32,
                margin: "6px 0 4px",
                color: "#0f172a",
                letterSpacing: -0.5,
              }}
            >
              Track search terms across uploaded documents
            </h1>
            <p style={{ color: "#4b5563", maxWidth: 700 }}>
              Pick a search term to see how often it appears. Click a bar to dive into the
              matching documents for that day.
            </p>
          </div>
          <Link
            href="/"
            style={{
              padding: "10px 16px",
              background: "#0ea5e9",
              color: "white",
              borderRadius: 9999,
              textDecoration: "none",
              boxShadow: "0 8px 24px rgba(14,165,233,0.25)",
              fontWeight: 600,
              transition: "transform 160ms ease, box-shadow 160ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
          >
            Manage terms
          </Link>
        </header>

        <section
          style={{
            background: "#ffffffcc",
            backdropFilter: "blur(6px)",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 20,
            boxShadow: "0 15px 60px rgba(15, 23, 42, 0.08)",
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ margin: 0, color: "#9ca3af", fontWeight: 600 }}>Search term</p>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <select
                  value={selectedTermId ?? ""}
                  onChange={(e) => onSelectTerm(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                    minWidth: 240,
                    fontSize: 15,
                    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
                  }}
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
                  <span style={{ color: "#10b981", fontWeight: 600 }}>
                    Ready to explore
                  </span>
                ) : (
                  <span style={{ color: "#f97316", fontWeight: 600 }}>
                    Pick a term to begin
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, color: "#9ca3af", fontWeight: 600 }}>Last update</p>
              <p style={{ margin: 0, color: "#0f172a", fontWeight: 700 }}>
                {new Date().toLocaleString()}
              </p>
            </div>
          </div>

          {error && (
            <div
              style={{
                border: "1px solid #fecdd3",
                background: "#fff1f2",
                color: "#b91c1c",
                padding: "10px 12px",
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 18, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <p style={{ margin: "4px 0", color: "#6b7280", fontWeight: 700 }}>Mentions by date</p>
              <div
                style={{
                  height: 280,
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 10,
                  padding: "12px 12px 0",
                  background: "linear-gradient(180deg, rgba(14,165,233,0.1), transparent)",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                }}
              >
                {loadingChart ? (
                  <p style={{ margin: "auto", color: "#6b7280" }}>Loading chart…</p>
                ) : buckets.length ? (
                  buckets.map((bucket) => (
                    <button
                      key={bucket.bucket_date}
                      onClick={() => loadDocumentsForDate(bucket.bucket_date, bucket.count)}
                      style={{
                        flex: 1,
                        minWidth: 30,
                        height: `${Math.max((bucket.count / maxCount) * 100, 8)}%`,
                        background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                        border: "none",
                        borderRadius: 10,
                        cursor: "pointer",
                        boxShadow: "0 10px 25px rgba(14,165,233,0.25)",
                        position: "relative",
                        transition: "transform 120ms ease, box-shadow 120ms ease",
                        color: "white",
                      }}
                      title={`${bucket.count} matches on ${formatDate(bucket.bucket_date)}`}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: -24,
                          left: 0,
                          right: 0,
                          textAlign: "center",
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        {bucket.count}
                      </span>
                      <span
                        style={{
                          position: "absolute",
                          bottom: -32,
                          left: 0,
                          right: 0,
                          textAlign: "center",
                          fontSize: 12,
                          color: "#374151",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDate(bucket.bucket_date)}
                      </span>
                    </button>
                  ))
                ) : (
                  <p style={{ margin: "auto", color: "#6b7280", textAlign: "center" }}>
                    {selectedTerm
                      ? "No matching documents for this term yet"
                      : "Choose a term to see mention volume"}
                  </p>
                )}
              </div>
            </div>

            <div
              style={{
                width: 260,
                background: "linear-gradient(180deg, #0ea5e9, #6366f1)",
                color: "white",
                borderRadius: 14,
                padding: 16,
                boxShadow: "0 20px 45px rgba(79,70,229,0.35)",
              }}
            >
              <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>Highlights</p>
              <h2 style={{ margin: "4px 0 10px", fontSize: 24 }}>
                {selectedTerm ? selectedTerm.term : "No term selected"}
              </h2>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>
                {buckets.reduce((sum, b) => sum + b.count, 0)} mentions total
              </p>
              <p style={{ margin: "8px 0 0", opacity: 0.9, fontSize: 14 }}>
                Click any bar to see which documents mention the term on that day.
              </p>
            </div>
          </div>
        </section>

        <section
          style={{
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            boxShadow: "0 10px 40px rgba(15,23,42,0.08)",
            padding: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, color: "#9ca3af", fontWeight: 700 }}>Matching documents</p>
              <h2 style={{ margin: "6px 0", color: "#0f172a" }}>
                {selectedRange
                  ? `${selectedRange.count} hits on ${selectedRange.label}`
                  : "Pick a date bar to inspect documents"}
              </h2>
            </div>
            {loadingDocuments && <span style={{ color: "#6b7280", fontWeight: 600 }}>Loading…</span>}
          </div>

          {selectedRange && !documents.length && !loadingDocuments && (
            <p style={{ color: "#6b7280" }}>No documents matched this date.</p>
          )}

          {documents.length > 0 && (
            <div style={{ overflowX: "auto", marginTop: 12 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
                <thead>
                  <tr style={{ textAlign: "left", background: "#f9fafb" }}>
                    <th style={{ padding: "10px", fontWeight: 800, color: "#111827" }}>Title</th>
                    <th style={{ padding: "10px", fontWeight: 800, color: "#111827" }}>Date</th>
                    <th style={{ padding: "10px", fontWeight: 800, color: "#111827" }}>Customer</th>
                    <th style={{ padding: "10px", fontWeight: 800, color: "#111827" }}>Link</th>
                    <th style={{ padding: "10px", fontWeight: 800, color: "#111827" }}>Snippet</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "10px", fontWeight: 700, color: "#111827" }}>
                        {doc.title}
                      </td>
                      <td style={{ padding: "10px", color: "#374151" }}>
                        {formatDate(doc.document_date)}
                      </td>
                      <td style={{ padding: "10px", color: "#374151" }}>{doc.customer}</td>
                      <td style={{ padding: "10px" }}>
                        <a
                          href={doc.file_link}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#2563eb", fontWeight: 700 }}
                        >
                          Open file
                        </a>
                      </td>
                      <td style={{ padding: "10px", color: "#4b5563" }}>
                        {doc.text.slice(0, 160)}{doc.text.length > 160 ? "…" : ""}
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
