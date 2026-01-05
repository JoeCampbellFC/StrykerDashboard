import { NextResponse } from "next/server";
import pool from "@/lib/db";

function parseId(idParam: string) {
  const id = Number(idParam);
  return Number.isFinite(id) ? id : null;
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const result = await pool.query(
    "SELECT id, term, created_date FROM public.search_terms WHERE id = $1",
    [id]
  );

  if (!result.rows.length)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result.rows[0], { status: 200 });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await request.json();
  const term = String(body?.term ?? "").trim();

  if (!term) {
    return NextResponse.json({ error: "term is required" }, { status: 400 });
  }

  const result = await pool.query(
    `UPDATE public.search_terms
     SET term = $1
     WHERE id = $2
     RETURNING id, term, created_date`,
    [term, id]
  );

  if (!result.rows.length)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result.rows[0], { status: 200 });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const result = await pool.query(
    "DELETE FROM public.search_terms WHERE id = $1 RETURNING id",
    [id]
  );

  if (!result.rows.length)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
