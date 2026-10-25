import { apiTest, ok, fail } from '../_lib.js';

export default async function handler(req, res) {
  try { ok(res, await apiTest(req.query?.id || null)); }
  catch (error) { fail(res, error); }
}
