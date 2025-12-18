"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    <main className="min-h-screen bg-slate-50 pb-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 pt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Search Terms</h1>
            <p className="text-sm text-slate-600">Manage search terms that power document insights.</p>
          </div>
          <Link href="/documents" className="inline-flex">
            <Button size="lg">Document insights</Button>
          </Link>
        </div>

        <Card className="border-slate-200/90 bg-white/90">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Add a search term</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
              <Input
                placeholder="Term (e.g. compliance)"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                required
              />
              <Input
                placeholder="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
              <Button type="submit" disabled={saving} className="md:w-28">
                {saving ? "Saving..." : "Add"}
              </Button>
              <Button type="button" variant="outline" onClick={() => refresh()} disabled={saving} className="md:w-28">
                Refresh
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 bg-white/90">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Saved terms</CardTitle>
          </CardHeader>
          <CardContent>
            {terms.length === 0 ? (
              <p className="text-sm text-slate-600">No terms yet. Add one to begin tracking documents.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {terms.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">{t.term}</p>
                      <p className="text-sm text-slate-600">
                        {t.category} • {new Date(t.created_date).toLocaleString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(t.id)}>
                      Delete
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
