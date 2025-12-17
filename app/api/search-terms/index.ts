import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        'SELECT id, term, category, created_date FROM public.search_terms ORDER BY created_date DESC'
      );
      res.status(200).json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch search terms' });
    }
  }

  else if (req.method === 'POST') {
    const { term, category } = req.body;

    if (!term || !category) {
      return res.status(400).json({ error: 'term and category are required' });
    }

    try {
      const result = await pool.query(
        `INSERT INTO public.search_terms (term, category)
         VALUES ($1, $2)
         RETURNING id, term, category, created_date`,
        [term, category]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create search term' });
    }
  }

  else {
    res.setHeader('Allow', 'GET, POST');
    res.status(405).end();
  }
}
