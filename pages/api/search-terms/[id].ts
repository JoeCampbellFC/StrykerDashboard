import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const id = Number(req.query.id);

  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  if (req.method === 'GET') {
    const result = await pool.query(
      'SELECT id, term, category, created_date FROM public.search_terms WHERE id = $1',
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(result.rows[0]);
  }

  if (req.method === 'PUT') {
    const { term, category } = req.body;

    const result = await pool.query(
      `UPDATE public.search_terms
       SET term = $1, category = $2
       WHERE id = $3
       RETURNING id, term, category, created_date`,
      [term, category, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(result.rows[0]);
  }

  if (req.method === 'DELETE') {
    const result = await pool.query(
      'DELETE FROM public.search_terms WHERE id = $1 RETURNING id',
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  res.status(405).end();
}
