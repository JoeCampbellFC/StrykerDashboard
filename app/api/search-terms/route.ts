import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      "SELECT id, term, category, created_date FROM public.search_terms ORDER BY created_date DESC"
    );
    return NextResponse.json(result.rows, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch search terms" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const term = String(body?.term ?? "").trim();
    const category = String(body?.category ?? "").trim();

    if (!term || !category) {
      return NextResponse.json({ error: "term and category are required" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO public.search_terms (term, category)
       VALUES ($1, $2)
       RETURNING id, term, category, created_date`,
      [term, category]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create search term" }, { status: 500 });
  }
}
