"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type SearchTerm = {
  id: number;
  term: string;
  category: string;
  created_date: string;
};

export default function Home() {
  const [terms, setTerms] = useState<SearchTerm[]>([]);
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const res = await fetch("/api/search-terms", { cache: "no-store" });
    const data = await res.json();
    setTerms(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    refresh().catch(console.error);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/search-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term, category }),
      });

      if (!res.ok) {
        console.error(await res.json());
        return;
      }

      const created = (await res.json()) as SearchTerm;
      setTerms((prev) => [created, ...prev]);
      setTerm("");
      setCategory("");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: number) {
    const res = await fetch(`/api/search-terms/${id}`, { method: "DELETE" });
    if (res.status === 204) setTerms((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <main style={{ padding: 32, maxWidth: 900 }}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Search Terms</h1>
        <Link
          href="/documents"
          className="inline-flex"
        >
          <Button>Document insights</Button>
        </Link>
      </div>

      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          placeholder="term"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          required
        />
        <input
          placeholder="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />
        <button disabled={saving} type="submit">
          {saving ? "Saving..." : "Add"}
        </button>
        <button type="button" onClick={() => refresh()} disabled={saving}>
          Refresh
        </button>
      </form>

      <ul style={{ paddingLeft: 16 }}>
        {terms.map((t) => (
          <li key={t.id} style={{ marginBottom: 8 }}>
            <strong>{t.term}</strong> ({t.category}) — {new Date(t.created_date).toLocaleString()}
            {"  "}
            <button onClick={() => onDelete(t.id)} style={{ marginLeft: 8 }}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
