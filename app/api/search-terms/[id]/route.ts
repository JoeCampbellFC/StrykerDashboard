import { NextResponse } from "next/server";
import pool from "@/lib/db";

function parseId(idParam: string) {
  const id = Number(idParam);
  return Number.isFinite(id) ? id : null;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const result = await pool.query(
    "SELECT id, term, category, created_date FROM public.search_terms WHERE id = $1",
    [id]
  );

  if (!result.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result.rows[0], { status: 200 });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await request.json();
  const term = String(body?.term ?? "").trim();
  const category = String(body?.category ?? "").trim();

  if (!term || !category) {
    return NextResponse.json({ error: "term and category are required" }, { status: 400 });
  }

  const result = await pool.query(
    `UPDATE public.search_terms
     SET term = $1, category = $2
     WHERE id = $3
     RETURNING id, term, category, created_date`,
    [term, category, id]
  );

  if (!result.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result.rows[0], { status: 200 });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const result = await pool.query(
    "DELETE FROM public.search_terms WHERE id = $1 RETURNING id",
    [id]
  );

  if (!result.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
