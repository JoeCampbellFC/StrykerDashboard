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
  customer: string;
  file_link: string;
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
  const term = (searchParams.get("term") ?? "").trim();
  const startDate = normalizeDate(searchParams.get("startDate"));
  const endDate = normalizeDate(searchParams.get("endDate"));

  if (!term) {
    return NextResponse.json({ error: "term is required" }, { status: 400 });
  }

  if ((startDate && !endDate) || (!startDate && endDate)) {
    return NextResponse.json(
      { error: "Both startDate and endDate are required when filtering by range" },
      { status: 400 }
    );
  }

  const likeTerm = `%${term}%`;

  try {
    const bucketsResult = await pool.query<Bucket>(
      `
      SELECT
        document_date::date::text AS bucket_date,
        COUNT(*)::int AS count
      FROM public.documents
      WHERE text ILIKE $1
      GROUP BY document_date::date
      ORDER BY document_date::date
      `,
      [likeTerm]
    );

    let documents: DocumentRow[] | null = null;

    if (startDate && endDate) {
      const docsResult = await pool.query<DocumentRow>(
        `
        SELECT
          id,
          title,
          text,
          document_date::date::text AS document_date,
          customer,
          file_link
        FROM public.documents
        WHERE text ILIKE $1
          AND document_date::date >= $2::date
          AND document_date::date <= $3::date
        ORDER BY document_date::date ASC, id ASC
        `,
        [likeTerm, startDate, endDate]
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
