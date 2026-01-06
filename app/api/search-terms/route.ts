import { NextResponse } from "next/server";
import pool from "@/lib/db";
import crypto from "crypto";

export async function GET() {
  try {
    const result = await pool.query(
      "SELECT id, term, category, created_date FROM public.search_terms ORDER BY created_date DESC"
    );
    return NextResponse.json(result.rows, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch search terms" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const term = String(body?.term ?? "").trim();
    const category = body?.category ? String(body.category).trim() : null;

    if (!term) {
      return NextResponse.json(
        { error: "term is required" },
        { status: 400 }
      );
    }

    const termHash = crypto.createHash("sha256").update(term).digest("hex");

    const result = await pool.query(
      `INSERT INTO public.search_terms (id, term, category)
       VALUES ($1, $2, $3)
       RETURNING id, term, category, created_date`,
      [termHash, term, category]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to create search term" },
      { status: 500 }
    );
  }
}
