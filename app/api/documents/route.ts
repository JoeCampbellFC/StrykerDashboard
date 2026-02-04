import { NextResponse } from "next/server";
import pool from "@/lib/db";

type Bucket = {
  bucket_date: string; // YYYY-MM-DD
  count: number;
};

type DocumentRow = {
  id: number;
  title: string;
  text: string;
  document_date: string; // YYYY-MM-DD (date-only now)
  folder_path: string;
  file_link: string;
};

type ExportDocumentRow = {
  id: number;
  title: string;
  document_date: string; // YYYY-MM-DD (date-only now)
  file_link: string;
  [term: string]: string | number;
};

function normalizeDate(value: string | null) {
  if (!value) return null;

  // Accept ONLY date-only inputs to avoid timezone shifts
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // If you want to be lenient, you can parse other formats,
  // but do it in UTC and reconstruct a YYYY-MM-DD explicitly:
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;

  const y = parsed.getUTCFullYear();
  const m = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const d = String(parsed.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const allTerms = [
    ...searchParams
      .getAll("terms")
      .flatMap((value) => value.split(","))
      .map((value) => value.trim())
      .filter(Boolean),
  ];
  const fallbackTerm = (searchParams.get("term") ?? "").trim();

  if (fallbackTerm) {
    allTerms.push(fallbackTerm);
  }

  const terms = Array.from(new Set(allTerms));
  const startDate = normalizeDate(searchParams.get("startDate"));
  const endDate = normalizeDate(searchParams.get("endDate"));
  const granularity = (searchParams.get("granularity") ?? "day").trim();
  const exportDocuments = searchParams.get("export") === "true";

  if (!terms.length) {
    return NextResponse.json({ error: "term is required" }, { status: 400 });
  }

  if (!["day", "month", "year"].includes(granularity)) {
    return NextResponse.json(
      { error: "granularity must be one of: day, month, year" },
      { status: 400 }
    );
  }

  if ((startDate && !endDate) || (!startDate && endDate)) {
    return NextResponse.json(
      { error: "Both startDate and endDate are required when filtering by range" },
      { status: 400 }
    );
  }

  const likeTerms = terms.map((value) => `%${value}%`);
  const intervalByGranularity: Record<string, string> = {
    day: "1 day",
    month: "1 month",
    year: "1 year",
  };
  const seriesInterval = intervalByGranularity[granularity];
  console.log(likeTerms, startDate, endDate, granularity);
  try {
    const bucketsResult = await pool.query<Bucket>(
      `
      WITH matched AS (
        SELECT document_date::date AS document_date
        FROM public.documents
        WHERE (text ILIKE ANY($1::text[]) OR title ILIKE ANY($1::text[]))
      ),
      bounds AS (
        SELECT
          MIN(document_date) AS min_date,
          MAX(document_date) AS max_date
        FROM matched
      ),
      series AS (
        SELECT generate_series(
          date_trunc($2, min_date::timestamp),
          date_trunc($2, max_date::timestamp),
          $3::interval
        ) AS bucket
        FROM bounds
        WHERE min_date IS NOT NULL AND max_date IS NOT NULL
      ),
      counts AS (
        SELECT
          date_trunc($2, document_date::timestamp) AS bucket,
          COUNT(*)::int AS count
        FROM matched
        GROUP BY date_trunc($2, document_date::timestamp)
      )
      SELECT
        to_char(series.bucket::date, 'YYYY-MM-DD') AS bucket_date,
        COALESCE(counts.count, 0) AS count
      FROM series
      LEFT JOIN counts ON counts.bucket = series.bucket
      ORDER BY series.bucket
      `,
      [likeTerms, granularity, seriesInterval]
    );

    let documents: (DocumentRow | ExportDocumentRow)[] | null = null;

    if ((startDate && endDate) || exportDocuments) {
      const termColumns = exportDocuments
        ? terms.map((term, index) => {
            const paramIndex = index + 4;
            const alias = term.replace(/"/g, '""');
            return `
              (
                COALESCE(
                  (length(lower(coalesce(text, ''))) + length(replace(lower(coalesce(text, '')), $${paramIndex}, '')))
                  / nullif(length($${paramIndex}), 0),
                  0
                )
                +
                COALESCE(
                  (length(lower(coalesce(title, ''))) + length(replace(lower(coalesce(title, '')), $${paramIndex}, '')))
                  / nullif(length($${paramIndex}), 0),
                  0
                )
              )::int AS "${alias}"
            `;
          })
        : [];
      const selectColumns = exportDocuments
        ? `
          id,
          title,
          document_date::date::text AS document_date,
          file_link
          ${termColumns.length ? `, ${termColumns.join(",")}` : ""}
        `
        : `
          id,
          title,
          text,
          document_date::date::text AS document_date,
          folder_path,
          file_link
        `;
      const docsResult = await pool.query<DocumentRow | ExportDocumentRow>(
        `
        SELECT
          ${selectColumns}
        FROM public.documents
        WHERE (text ILIKE ANY($1::text[]) OR title ILIKE ANY($1::text[]))
          AND ($2::date IS NULL OR document_date::date >= $2::date)
          AND ($3::date IS NULL OR document_date::date <= $3::date)
        ORDER BY document_date::date ASC, id ASC
        `,
        exportDocuments
          ? [likeTerms, startDate, endDate, ...terms.map((term) => term.toLowerCase())]
          : [likeTerms, startDate, endDate]
      );

      documents = docsResult.rows;
    }

    return NextResponse.json({ buckets: bucketsResult.rows, documents }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch documents from the database" },
      { status: 500 }
    );
  }
}
