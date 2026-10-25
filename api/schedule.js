import { withCache, apiComingSoon, ok, fail } from './_lib.js';

export default async function handler(_req, res) {
  try {
    ok(res, await withCache('comingsoon', apiComingSoon, 30 * 60 * 1000));
  } catch (error) {
    fail(res, error);
  }
}
