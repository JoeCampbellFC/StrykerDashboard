import { useEffect, useState, FormEvent } from 'react';

type SearchTerm = {
  id: number;
  term: string;
  category: string;
  created_date: string;
};

export default function Home() {
  const [terms, setTerms] = useState<SearchTerm[]>([]);
  const [term, setTerm] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetch('/api/search-terms')
      .then(res => res.json())
      .then(setTerms);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const res = await fetch('/api/search-terms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ term, category })
    });

    if (res.ok) {
      const newTerm = await res.json();
      setTerms(prev => [newTerm, ...prev]);
      setTerm('');
      setCategory('');
    }
  }

  async function deleteTerm(id: number) {
    const res = await fetch(`/api/search-terms/${id}`, { method: 'DELETE' });
    if (res.status === 204) {
      setTerms(prev => prev.filter(t => t.id !== id));
    }
  }

  return (
    <main style={{ padding: 32 }}>
      <h1>Search Terms</h1>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Search term"
          value={term}
          onChange={e => setTerm(e.target.value)}
          required
        />
        <input
          placeholder="Category"
          value={category}
          onChange={e => setCategory(e.target.value)}
          required
        />
        <button type="submit">Add</button>
      </form>

      <ul>
        {terms.map(t => (
          <li key={t.id}>
            <strong>{t.term}</strong> ({t.category}) –{' '}
            {new Date(t.created_date).toLocaleString()}
            <button onClick={() => deleteTerm(t.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
