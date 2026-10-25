import { withCache, apiRecent, ok, fail } from '../_lib.js';
export default async function handler(req, res) {
  try { ok(res, await withCache('home', apiRecent, 3*60*1000)); }
  catch (e) { fail(res, e); }
}
