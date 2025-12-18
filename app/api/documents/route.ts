import { NextResponse } from "next/server";
import pool from "@/lib/db";

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

function normalizeDate(value: string | null) {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString().slice(0, 10);
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
      `SELECT DATE(document_date) AS bucket_date, COUNT(*)::int AS count
       FROM public.documents
       WHERE text ILIKE $1
       GROUP BY DATE(document_date)
       ORDER BY DATE(document_date)`,
      [likeTerm]
    );

    let documents: DocumentRow[] | null = null;

    if (startDate && endDate) {
      const docsResult = await pool.query<DocumentRow>(
        `SELECT id, title, text, document_date, customer, file_link
         FROM public.documents
         WHERE text ILIKE $1
           AND document_date >= $2::date
           AND document_date < $3::date + interval '1 day'
         ORDER BY document_date ASC`,
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
