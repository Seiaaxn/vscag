import { withCache, apiAll, ok, fail } from '../_lib.js';
export default async function handler(req, res) {
  const pageValue = Number.parseInt(req.query?.page || '1', 10);
  const limitValue = Number.parseInt(req.query?.limit || '20', 10);
  const page = Number.isFinite(pageValue) ? Math.min(10000, Math.max(1, pageValue)) : 1;
  const limit = Number.isFinite(limitValue) ? Math.min(100, Math.max(1, limitValue)) : 20;
  try {
    ok(res, await withCache(`all:${page}:${limit}`, () => apiAll(page, limit), 10 * 60 * 1000));
  } catch (error) { fail(res, error); }
}
