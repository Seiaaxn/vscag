// Vercel serverless handler: GET /nk-api/frame?url=<embed-url>
// Sama seperti route di server.js — memakai proxyFrame dari api/frameProxy.js.
import { proxyFrame } from '../frameProxy.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=300');
  return proxyFrame(String(req.query?.url || ''), res);
}
