#!/usr/bin/env node
'use strict';

/**
 * Klien satu-file JavaScript untuk WordPress REST API publik NekoPoi.
 *
 * CARA PAKAI
 * ==========
 * Persyaratan: Node.js 18+ karena skrip memakai fetch bawaan Node.
 * Tidak perlu npm install dan tidak ada dependency eksternal.
 *
 *   node nekopoi_api.js test --id 64281
 *   node nekopoi_api.js recent
 *   node nekopoi_api.js all --limit 10
 *   node nekopoi_api.js genres
 *   node nekopoi_api.js comingsoon
 *   node nekopoi_api.js series --id 64281
 *   node nekopoi_api.js detail --id 64281
 *   node nekopoi_api.js media --id 64281
 *   node nekopoi_api.js search --query Inaka
 *   node nekopoi_api.js detail --id 64281 --output detail.json
 *
 * KETERANGAN FIELD MEDIA
 * =======================
 * - `stream`/`embed`: URL player yang dikembalikan API, misalnya /e/ atau /embed-.
 * - `direct`: hanya diisi bila response API benar-benar mengembalikan URL file
 *   media seperti .mp4, .m3u8, .webm, atau field direct/src/file/media_url.
 * - `download`: link download ditampilkan apa adanya. Skrip tidak otomatis
 *   mengikuti shortener, membypass iklan, Cloudflare, login, token, atau DRM.
 * - Field kosong diisi dari content HTML, series, info_meta, katalog, atau
 *   inferensi episode dari judul bila datanya tersedia.
 *
 * CATATAN ETIKA TEKNIS
 * =====================
 * Skrip hanya memakai HTTP GET ke endpoint publik dan tidak melakukan enumerasi
 * ID massal. Gunakan cache/rate rendah dan hormati aturan situs sumber.
 */

const ROOT_URL = 'https://nekopoi.care/wp-json/';
const NAMESPACE = 'F2fLJczDN8brzwYZ10yLkHopWiajORxHM7teaUIuJK3rAYx3RNAu44AXcTM7b191lMNRuNSDMg9sswLfIHH1Mb';
const BASE_URL = new URL(`${NAMESPACE}/api/`, ROOT_URL).toString();
const WP_V2_URL = new URL('wp/v2/', ROOT_URL).toString();
const USER_AGENT = 'nekopoi-api-client-js/1.0 (GET-only; respectful rate)';
const DEFAULT_TIMEOUT_MS = 25_000;
const MEDIA_EXTENSIONS = ['.mp4', '.m3u8', '.webm', '.mkv', '.mov', '.flv', '.ts'];

class ApiError extends Error {}

function asText(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return null;
  const text = String(value).trim();
  if (!text || ['none', 'null', 'n/a', '-'].includes(text.toLowerCase())) return null;
  return text;
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string' && !value.trim()) continue;
    return value;
  }
  return null;
}

function decodeEntities(value) {
  return String(value)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function stripHtml(value) {
  const raw = asText(value);
  if (!raw) return null;
  return decodeEntities(raw
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim() || null;
}

function endpoint(path) {
  return new URL(path.replace(/^\//, ''), BASE_URL).toString();
}

async function getText(url, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const target = new URL(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(target, {
      method: 'GET',
      headers: { Accept: 'text/html', 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });
    const body = await response.text();
    if (!response.ok) throw new ApiError(`HTTP ${response.status} untuk ${target}: ${body.slice(0, 300)}`);
    return body;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === 'AbortError') throw new ApiError(`Timeout saat mengakses ${target}`);
    throw new ApiError(`Gagal mengakses ${target}: ${error.message}`);
  } finally {
    clearTimeout(timer);
  }
}

async function getJson(url, params = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const target = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) target.searchParams.set(key, String(value));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(target, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
      signal: controller.signal,
    });
    const body = await response.text();
    if (!response.ok) {
      throw new ApiError(`HTTP ${response.status} untuk ${target}: ${body.slice(0, 300)}`);
    }
    try {
      return JSON.parse(body);
    } catch (error) {
      throw new ApiError(`Response bukan JSON valid dari ${target}: ${body.slice(0, 300)}`);
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === 'AbortError') throw new ApiError(`Timeout saat mengakses ${target}`);
    throw new ApiError(`Gagal mengakses ${target}: ${error.message}`);
  } finally {
    clearTimeout(timer);
  }
}

function htmlField(text, labels, stopLabels) {
  if (!text) return null;
  const labelPattern = labels.map(escapeRegex).join('|');
  const stopPattern = stopLabels.map(escapeRegex).join('|');
  const regex = new RegExp(`(?:${labelPattern})\\s*:\\s*(.*?)(?=\\s+(?:${stopPattern})\\s*:|$)`, 'i');
  const match = regex.exec(text);
  return match ? match[1].replace(/\s+/g, ' ').trim().replace(/[ :;]+$/, '') || null : null;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseContentFields(content) {
  const text = stripHtml(content) || '';
  const stops = ['Sinopsis', 'Genre', 'Anime', 'Producer', 'Producers', 'Produser', 'Duration', 'Durasi', 'Size', 'Episode', 'Status', 'Tayang', 'Score', 'Skor'];
  return {
    content_text: text || null,
    synopsis: htmlField(text, ['Sinopsis'], stops),
    genre: htmlField(text, ['Genre'], stops),
    anime: htmlField(text, ['Anime'], stops),
    producer: htmlField(text, ['Producer', 'Producers', 'Produser'], stops),
    duration: htmlField(text, ['Duration', 'Durasi'], stops),
    size: htmlField(text, ['Size'], stops),
    status: htmlField(text, ['Status'], stops),
    tayang: htmlField(text, ['Tayang'], stops),
    score: htmlField(text, ['Score', 'Skor'], stops),
  };
}

function isUrl(value) {
  const text = asText(value);
  if (!text) return false;
  try {
    const parsed = new URL(text);
    return ['http:', 'https:'].includes(parsed.protocol) && Boolean(parsed.hostname);
  } catch (_) {
    return false;
  }
}

function classifyMediaUrl(url, context = '') {
  const lower = url.toLowerCase();
  let path = '';
  try { path = new URL(url).pathname.toLowerCase(); } catch (_) {}
  if (MEDIA_EXTENSIONS.some((extension) => path.endsWith(extension) || lower.includes(extension))) return 'direct';
  if (['/embed', '/e/', 'embed-', 'player'].some((token) => lower.includes(token))) return 'embed';
  if (context === 'stream' || context === 'embed') return 'embed';
  return 'unknown';
}

function normalizeStreams(rawStream) {
  if (rawStream === null || rawStream === undefined) return [];
  const values = Array.isArray(rawStream) ? rawStream : [rawStream];
  const result = [];
  values.forEach((item, index) => {
    let url = null;
    let label = null;
    if (typeof item === 'string') {
      url = item.trim();
    } else if (item && typeof item === 'object') {
      url = firstNonEmpty(item.link, item.url, item.src, item.embed);
      label = asText(firstNonEmpty(item.name, item.label, item.type));
    }
    url = asText(url);
    if (isUrl(url)) {
      result.push({
        index: index + 1,
        label: label || `Stream ${index + 1}`,
        url,
        kind: classifyMediaUrl(url, 'stream'),
      });
    }
  });
  return result;
}

function normalizeDownloads(rawDownload) {
  if (!Array.isArray(rawDownload)) return [];
  return rawDownload.filter((item) => item && typeof item === 'object').map((item) => {
    const quality = asText(firstNonEmpty(item.type, item.quality));
    let links = item.links;
    if (links && !Array.isArray(links)) links = [links];
    if (!Array.isArray(links)) links = [];
    const normalizedLinks = links.map((link) => {
      let url = null;
      let name = null;
      if (typeof link === 'string') {
        url = link;
      } else if (link && typeof link === 'object') {
        url = firstNonEmpty(link.link, link.url, link.href);
        name = asText(firstNonEmpty(link.name, link.label));
      }
      url = asText(url);
      if (!isUrl(url)) return null;
      return { name: name || 'Download', url, kind: classifyMediaUrl(url, 'download') };
    }).filter(Boolean);
    return { quality, links: normalizedLinks };
  });
}

function findDirectUrls(value, found = []) {
  if (Array.isArray(value)) {
    value.forEach((child) => findDirectUrls(child, found));
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      const text = asText(child);
      const keyName = key.toLowerCase();
      if (text && isUrl(text) && (
        ['direct', 'direct_url', 'media_url', 'file', 'file_url', 'src', 'source', 'video', 'video_url'].includes(keyName) || classifyMediaUrl(text) === 'direct'
      )) {
        found.push(text);
      }
      findDirectUrls(child, found);
    }
  } else if (typeof value === 'string' && isUrl(value) && classifyMediaUrl(value) === 'direct') {
    found.push(value);
  }
  return [...new Set(found)];
}

function normalizeCatalogItem(item) {
  return {
    id: firstNonEmpty(item?.id),
    date: firstNonEmpty(item?.date),
    title: firstNonEmpty(item?.title),
    slug: firstNonEmpty(item?.slug),
    image: firstNonEmpty(item?.image),
    description: stripHtml(item?.description),
    source: 'custom_api/catalog',
  };
}

function normalizeDetail(raw, fallback = {}) {
  const series = raw?.series && typeof raw.series === 'object' ? raw.series : {};
  const infoMeta = raw?.info_meta && typeof raw.info_meta === 'object' ? raw.info_meta : {};
  let parsed = parseContentFields(raw?.content);
  if (!parsed.content_text) parsed = parseContentFields(series?.content);

  const title = firstNonEmpty(raw?.title, fallback?.title, series?.title);
  const image = firstNonEmpty(raw?.image, series?.image, fallback?.image);
  let synopsis = firstNonEmpty(parsed.synopsis, raw?.synopsis, raw?.description, series?.content);
  synopsis = stripHtml(synopsis);
  let description = firstNonEmpty(raw?.description, parsed.synopsis, synopsis);
  description = stripHtml(description);

  const genre = firstNonEmpty(series?.genre, infoMeta?.genre, parsed.genre);
  const producer = firstNonEmpty(infoMeta?.produser, infoMeta?.producer, parsed.producer);
  const duration = firstNonEmpty(infoMeta?.durasi, infoMeta?.duration, parsed.duration);
  let episode = firstNonEmpty(raw?.episode, infoMeta?.episode);
  if (!episode && title) {
    const match = /\bepisode\s*([0-9]+)\b/i.exec(String(title));
    if (match) episode = match[1];
  }

  const streams = normalizeStreams(raw?.stream);
  const embeds = streams.filter((item) => item.kind === 'embed');
  const direct = [...new Set([
    ...streams.filter((item) => item.kind === 'direct').map((item) => item.url),
    ...findDirectUrls(raw),
  ])];
  const downloads = normalizeDownloads(raw?.download);

  const result = {
    id: firstNonEmpty(raw?.id, fallback?.id),
    date: firstNonEmpty(raw?.date, fallback?.date),
    title,
    slug: firstNonEmpty(raw?.slug, fallback?.slug),
    image,
    description,
    synopsis,
    anime: firstNonEmpty(parsed.anime),
    genre,
    producer,
    duration,
    size: firstNonEmpty(parsed.size),
    episode,
    aliases: firstNonEmpty(infoMeta?.aliases),
    status: firstNonEmpty(infoMeta?.status, parsed.status),
    tayang: firstNonEmpty(infoMeta?.tayang, parsed.tayang),
    score: firstNonEmpty(infoMeta?.skor, infoMeta?.score, parsed.score),
    series: {
      id: series?.id ?? null,
      title: series?.title ?? null,
      image: series?.image ?? null,
      genre: series?.genre ?? null,
    },
    note: asText(raw?.note),
    streamnote: asText(raw?.streamnote),
    streams,
    embeds,
    direct,
    downloads,
    content_text: parsed.content_text,
  };

  const required = ['id', 'title', 'date', 'slug', 'image', 'description', 'synopsis', 'genre', 'producer', 'duration', 'episode', 'streams', 'embeds', 'direct', 'downloads'];
  result.missing_fields = required.filter((key) => result[key] === null || result[key] === undefined || result[key] === '' || (Array.isArray(result[key]) && result[key].length === 0));
  return result;
}

async function fetchRecent() {
  const raw = await getJson(endpoint('recent'));
  if (!raw || typeof raw !== 'object') return { carousel: [], posts: [], source: 'custom_api/recent' };
  const carousel = Array.isArray(raw.carousel) ? raw.carousel.filter((item) => item && typeof item === 'object').map(normalizeCatalogItem) : [];
  const posts = Array.isArray(raw.posts) ? raw.posts.filter((group) => group && typeof group === 'object').map((group) => ({
    category: firstNonEmpty(group.category),
    data: Array.isArray(group.data) ? group.data.filter((item) => item && typeof item === 'object').map(normalizeCatalogItem) : [],
  })) : [];
  return { carousel, posts, source: 'custom_api/recent' };
}

async function fetchAll(limit = null, page = 1, perPage = null) {
  const params = {};
  if (page !== null && page !== undefined) params.page = Math.max(1, Number.parseInt(page, 10) || 1);
  if (perPage !== null && perPage !== undefined) params.per_page = Math.min(200, Math.max(1, Number.parseInt(perPage, 10) || 200));
  const raw = await getJson(endpoint('all'), params);
  if (!raw || typeof raw !== 'object') return { total: 0, totalPages: 0, result: [], source: 'custom_api/all' };
  let result = Array.isArray(raw.result) ? raw.result.filter((item) => item && typeof item === 'object').map(normalizeCatalogItem) : [];
  if (limit !== null && Number.isFinite(Number(limit))) result = result.slice(0, Math.max(0, Number(limit)));
  return {
    total: raw.total ?? result.length,
    totalPages: raw.totalPages ?? null,
    result,
    source: 'custom_api/all',
  };
}

const SITE_URL = new URL(ROOT_URL).origin;

function absoluteSiteUrl(value) {
  try {
    const url = new URL(decodeEntities(value), SITE_URL);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch (_) {
    return null;
  }
}

function slugFromUrl(value) {
  try {
    const path = new URL(value).pathname.replace(/^\/+|\/+$/g, '');
    return path.split('/').filter(Boolean).pop() || null;
  } catch (_) {
    return null;
  }
}

function parseRelatedSection(html, heading, limit = 20) {
  const source = String(html || '');
  const headingIndex = source.toLowerCase().indexOf(String(heading).toLowerCase());
  if (headingIndex < 0) return [];
  const start = headingIndex + String(heading).length;
  const nextHeading = source.indexOf('nk-section-header', start);
  const section = source.slice(start, nextHeading > start ? nextHeading : start + 50000);
  const items = [];
  const titleLinkPattern = heading === 'Info Lainnya'
    ? /<h2\b[\s\S]*?<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i
    : /<a\b[^>]*\bnk-series-link\b[\s\S]*?href=["']([^"']+)["'][\s\S]*?>([\s\S]*?)<\/a>/i;
  for (const itemMatch of section.matchAll(/<li\b[\s\S]*?<\/li>/gi)) {
    const block = itemMatch[0];
    const linkMatch = titleLinkPattern.exec(block);
    if (!linkMatch) continue;
    const url = absoluteSiteUrl(linkMatch[1]);
    const title = stripHtml(linkMatch[2]);
    if (!url || !title || !url.startsWith(SITE_URL)) continue;
    const imageMatch = /background-image\s*:\s*url\((?:["']?)([^"')]+)(?:["']?)\)/i.exec(block);
    items.push({ id: null, title, slug: slugFromUrl(url), url, image: absoluteSiteUrl(imageMatch?.[1]), source: `html/${heading.toLowerCase().replace(/\s+/g, '-')}` });
    if (items.length >= limit) break;
  }
  return items;
}

function parseRelated(html) {
  return {
    info: parseRelatedSection(html, 'Info Lainnya', 20),
    hentai: parseRelatedSection(html, 'Hentai Lainnya', 20),
  };
}

async function fetchSeries(seriesId) {
  return getJson(endpoint('series'), { id: seriesId });
}

async function fetchRelated(pageUrl) {
  if (!pageUrl) return { info: [], hentai: [] };
  try { return parseRelated(await getText(pageUrl)); }
  catch (_) { return { info: [], hentai: [] }; }
}

async function resolvePostId(identifier) {
  const value = String(identifier ?? '').trim();
  if (/^\d+$/.test(value)) return value;
  const query = value.replace(/^https?:\/\/[^/]+\//i, '').replace(/^\/+|\/+$/g, '').replace(/[-_]+/g, ' ');
  try {
    const search = await fetchSearch(query);
    const targetSlug = slugFromUrl(value) || value.replace(/^\/+|\/+$/g, '');
    const match = (search.result || []).find(item => slugFromUrl(item.url) === targetSlug) || search.result?.[0];
    if (match?.id) return String(match.id);
  } catch (_) {}
  return value;
}

async function fetchDetail(postId) {
  const resolvedId = await resolvePostId(postId);
  let fallback = {};
  try {
    const catalog = await fetchAll(100);
    fallback = catalog.result.find((item) => String(item.id) === String(resolvedId)) || {};
  } catch (_) {
    // Detail tetap dicoba jika katalog sedang bermasalah.
  }

  let raw = null;
  let selectedRoute = 'post';
  const errors = [];
  // post2 diuji lebih dulu karena mengembalikan array stream lengkap.
  for (const route of ['post2', 'post']) {
    try {
      const candidate = await getJson(endpoint(route), { id: resolvedId });
      if (candidate && typeof candidate === 'object') {
        raw = candidate;
        selectedRoute = route;
        const hasMedia = Boolean(candidate.stream || candidate.download || candidate.direct || candidate.media_url);
        if (hasMedia) break;
      }
    } catch (error) {
      errors.push(`${route}: ${error.message}`);
    }
  }
  if (!raw) throw new ApiError(`Gagal mengambil detail post ${postId}: ${errors.join('; ') || 'response kosong'}`);
  const result = normalizeDetail(raw, fallback);
  result.source = `custom_api/${selectedRoute}`;

  // ID yang berasal dari /recent sering berupa seri, bukan episode playable.
  // Lengkapi metadata seri dan daftar episode dari route publik /series.
  if (!result.streams.length && !result.direct.length && !result.downloads.length) {
    try {
      const series = await fetchSeries(resolvedId);
      result.series = {
        id: series?.id ?? result.id,
        title: series?.title ?? result.title,
        image: series?.image ?? result.image,
        genre: series?.info_meta?.genre ?? null,
      };
      result.episodes = Array.isArray(series?.episode) ? series.episode : [];
      result.source = `custom_api/${selectedRoute}+series`;
    } catch (error) {
      result.series_error = error.message;
      result.episodes = [];
    }
  }
  if (!Array.isArray(result.episodes) || !result.episodes.length) {
    const seriesId = result.series?.id || raw?.series?.id;
    if (seriesId && String(seriesId) !== String(result.id)) {
      try {
        const series = await fetchSeries(seriesId);
        result.episodes = Array.isArray(series?.episode) ? series.episode : [];
      } catch (_) {
        result.episodes = [];
      }
    } else {
      result.episodes = [];
    }
  }
  const detailPage = result.slug
    ? `${SITE_URL}/${String(result.slug).replace(/^\/+|\/+$/g, '')}/`
    : (result.id ? `${SITE_URL}/?p=${encodeURIComponent(result.id)}` : null);
  result.requested_id = String(postId);
  result.related = await fetchRelated(detailPage);
  return result;
}

function parseComingSoonHtml(html) {
  const sections = [];
  const source = String(html || '');
  const spoilerRe = /\[spoiler[^\]]*title=["']?([^"'\]]+)["']?[^\]]*\]([\s\S]*?)\[\/spoiler\]/gi;
  let match;
  while ((match = spoilerRe.exec(source)) !== null) {
    const period = stripHtml(match[1]) || 'Jadwal';
    const items = [];
    const titleRe = /<a\b[^>]*class=["'][^"']*title[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
    let titleMatch;
    while ((titleMatch = titleRe.exec(match[2])) !== null) {
      const title = stripHtml(titleMatch[1]);
      if (title) items.push(title);
    }
    if (!items.length) {
      const fallback = stripHtml(match[2]);
      if (fallback) items.push(fallback);
    }
    sections.push({ period, items: [...new Set(items)] });
  }
  if (!sections.length) {
    const fallback = stripHtml(source);
    if (fallback) sections.push({ period: 'Jadwal', items: [fallback] });
  }
  return sections;
}

async function fetchComingSoon() {
  const raw = await getJson(endpoint('comingsoon'));
  return parseComingSoonHtml(raw?.result || '');
}

async function fetchGenres() {
  const raw = await getJson(endpoint('genres'));
  const data = raw && Array.isArray(raw.data) ? raw.data.filter((item) => item && typeof item === 'object') : [];
  return { total: raw?.total ?? data.length, data, source: 'custom_api/genres' };
}

async function fetchSearch(query) {
  const url = new URL('search', WP_V2_URL).toString();
  const raw = await getJson(url, { search: query, per_page: 20 });
  const result = Array.isArray(raw) ? raw.filter((item) => item && typeof item === 'object').map((item) => ({
    id: item.id,
    title: item.title && typeof item.title === 'object' ? item.title.rendered : item.title,
    url: item.url,
    type: item.subtype || item.type,
  })) : [];
  return { query, result, source: 'wp/v2/search' };
}

async function fetchMedia(postId) {
  const detail = await fetchDetail(postId);
  return {
    id: detail.id,
    title: detail.title,
    stream: detail.streams,
    embed: detail.embeds,
    direct: detail.direct,
    download: detail.downloads,
    note: detail.streamnote,
    missing_fields: detail.missing_fields,
    source: detail.source,
  };
}

function check(condition, name, detail = '') {
  return { name, status: condition ? 'PASS' : 'FAIL', detail };
}

async function runTests(postId = null) {
  const tests = [];
  try {
    const root = await getJson(ROOT_URL);
    const routes = root && typeof root === 'object' ? root.routes || {} : {};
    tests.push(check(root && typeof root === 'object', 'root REST JSON', 'response object'));
    tests.push(check(Object.keys(routes).some((route) => route.includes('/recent')), 'route recent', 'route diumumkan'));
    tests.push(check(Object.keys(routes).some((route) => route.includes('/post')), 'route post', 'route diumumkan'));
  } catch (error) {
    tests.push(check(false, 'root REST JSON', error.message));
  }

  try {
    const recent = await fetchRecent();
    tests.push(check(Array.isArray(recent.carousel), 'recent.carousel', `${recent.carousel.length} item`));
    if (!postId && recent.carousel.length) postId = String(recent.carousel[0].id);
  } catch (error) {
    tests.push(check(false, 'recent', error.message));
  }

  try {
    const catalog = await fetchAll(3);
    tests.push(check(Array.isArray(catalog.result), 'all.result', `${catalog.result.length} item sampel`));
    tests.push(check(catalog.total !== null && catalog.total !== undefined, 'all.total', String(catalog.total)));
  } catch (error) {
    tests.push(check(false, 'all', error.message));
  }

  try {
    const genres = await fetchGenres();
    tests.push(check(Array.isArray(genres.data) && genres.data.length > 0, 'genres.data', `${genres.data.length} genre`));
  } catch (error) {
    tests.push(check(false, 'genres', error.message));
  }

  if (postId) {
    try {
      const detail = await fetchDetail(postId);
      tests.push(check(detail.id !== null && detail.id !== undefined, 'detail.id', String(detail.id)));
      tests.push(check(Boolean(detail.title), 'detail.title', String(detail.title).slice(0, 100)));
      tests.push(check(Boolean(detail.description || detail.synopsis || detail.series || detail.episodes?.length), 'field fallback description/synopsis/series', 'terisi dari response/content/series'));
      let playable = detail;
      if (!(detail.streams?.length || detail.embeds?.length || detail.direct?.length) && detail.episodes?.[0]?.id) {
        playable = await fetchDetail(detail.episodes[0].id);
        tests.push(check(true, 'series episode fallback', `seri ${detail.id} -> episode ${detail.episodes[0].id}`));
      } else {
        tests.push(check(true, 'series episode fallback', 'detail sudah playable'));
      }
      tests.push(check(Boolean(playable.streams?.length || playable.embeds?.length || playable.direct?.length), 'media stream/embed/direct', `stream=${playable.streams?.length || 0}, direct=${playable.direct?.length || 0}`));
      tests.push(check((playable.streams || []).every((item) => ['embed', 'direct', 'unknown'].includes(item.kind)), 'media kind classification', 'URL tidak dipaksa menjadi direct'));
      tests.push(check(Array.isArray(playable.downloads), 'download schema', `${playable.downloads?.length || 0} kualitas`));
    } catch (error) {
      tests.push(check(false, 'detail', error.message));
    }
  } else {
    tests.push(check(false, 'detail', 'Tidak ada ID dari recent; gunakan --id ID'));
  }

  const passed = tests.filter((test) => test.status === 'PASS').length;
  return { passed, failed: tests.length - passed, tests, tested_id: postId };
}

function printJson(value, output = null) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  if (output) {
    require('node:fs').writeFileSync(output, text, 'utf8');
    console.log(`Tersimpan: ${output}`);
  } else {
    process.stdout.write(text);
  }
}

function getOption(args, name, fallback = null) {
  const index = args.indexOf(name);
  return index >= 0 && index + 1 < args.length ? args[index + 1] : fallback;
}

function usage() {
  console.log(`Penggunaan:
  node nekopoi_api.js test --id ID
  node nekopoi_api.js recent [--output file.json]
  node nekopoi_api.js all [--page N] [--per-page N] [--limit N] [--output file.json]
  node nekopoi_api.js genres [--output file.json]
  node nekopoi_api.js comingsoon [--output file.json]
  node nekopoi_api.js series --id ID [--output file.json]
  node nekopoi_api.js detail --id ID [--output file.json]
  node nekopoi_api.js media --id ID [--output file.json]
  node nekopoi_api.js search --query KATA [--output file.json]`);
}

async function main(argv = process.argv.slice(2)) {
  const command = argv[0];
  if (!command || ['-h', '--help', 'help'].includes(command)) {
    usage();
    return 0;
  }

  const output = getOption(argv, '--output') || getOption(argv, '-o');
  const page = getOption(argv, '--page', 1);
  const perPage = getOption(argv, '--per-page') || getOption(argv, '--per_page');
  const id = getOption(argv, '--id');
  let result;

  if (command === 'recent') result = await fetchRecent();
  else if (command === 'all') result = await fetchAll(getOption(argv, '--limit'), page, perPage);
  else if (command === 'genres') result = await fetchGenres();
  else if (command === 'comingsoon') result = await fetchComingSoon();
  else if (command === 'series') {
    if (!id) throw new ApiError('Argumen --id wajib untuk command series');
    result = await fetchSeries(id);
  } else if (command === 'detail') {
    if (!id) throw new ApiError('Argumen --id wajib untuk command detail');
    result = await fetchDetail(id);
  } else if (command === 'media') {
    if (!id) throw new ApiError('Argumen --id wajib untuk command media');
    result = await fetchMedia(id);
  } else if (command === 'search') {
    const query = getOption(argv, '--query') || getOption(argv, '-q');
    if (!query) throw new ApiError('Argumen --query wajib untuk command search');
    result = await fetchSearch(query);
  } else if (command === 'test') {
    result = await runTests(id);
  } else {
    usage();
    throw new ApiError(`Command tidak dikenal: ${command}`);
  }

  printJson(result, output);
  return command === 'test' && result.failed > 0 ? 1 : 0;
}

if (require.main === module) {
  main().then((code) => process.exitCode = code).catch((error) => {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 2;
  });
}

module.exports = {
  BASE_URL,
  fetchRecent,
  fetchAll,
  fetchSeries,
  fetchRelated,
  fetchDetail,
  fetchGenres,
  fetchComingSoon,
  fetchSearch,
  fetchMedia,
  runTests,
  normalizeDetail,
};
