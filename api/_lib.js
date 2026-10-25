import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const referenceApi = require('./nekopoi_api_reference.cjs');

export const ROOT_URL = 'https://nekopoi.care/wp-json/';
export const BASE_URL = referenceApi.BASE_URL;
export const WP_V2_URL = new URL('wp/v2/', ROOT_URL).toString();

const cache = new Map();

export async function withCache(key, fn, ttl = 5 * 60 * 1000) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.timestamp < ttl) return hit.data;
  const data = await fn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

export const asText = value => {
  if (value == null || typeof value === 'object') return null;
  const text = String(value).trim();
  return (!text || ['none', 'null', 'n/a', '-'].includes(text.toLowerCase())) ? null : text;
};

export const firstNonEmpty = (...values) => {
  for (const value of values) {
    if (value == null) continue;
    if (typeof value === 'string' && !value.trim()) continue;
    return value;
  }
  return null;
};

export const stripHtml = value => {
  const text = asText(value);
  if (!text) return null;
  return text.replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>(?=\S)/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim() || null;
};

export const absoluteUrl = (value, base = 'https://nekopoi.care') => {
  if (!value) return null;
  try { return new URL(value, base).href; } catch { return null; }
};

export const endpoint = path => new URL(String(path).replace(/^\//, ''), BASE_URL).toString();

export const isUrl = value => {
  const text = asText(value);
  if (!text) return false;
  try { return ['http:', 'https:'].includes(new URL(text).protocol); } catch { return false; }
};

function mediaKind(value, fallback = 'unknown') {
  const url = String(value || '').toLowerCase();
  if (/\.(?:mp4|m3u8|webm|mkv|mov|flv|ts)(?:[?#]|$)/i.test(url)) return 'direct';
  if (fallback === 'direct') return 'direct';
  if (fallback === 'embed' || /(?:\/embed|\/e\/|embed-|player|iframe)/i.test(url)) return 'embed';
  return fallback;
}

function normalizeStreamItem(item, index, fallbackKind = 'unknown') {
  if (typeof item === 'string') {
    const url = item.trim();
    return isUrl(url) ? { index: index + 1, label: `Stream ${index + 1}`, url, kind: mediaKind(url, fallbackKind) } : null;
  }
  if (!item || typeof item !== 'object') return null;
  const url = firstNonEmpty(item.url, item.link, item.src, item.embed);
  if (!isUrl(url)) return null;
  const kind = mediaKind(url, item.kind || fallbackKind);
  return {
    index: index + 1,
    label: asText(firstNonEmpty(item.label, item.name, item.type)) || `${kind === 'direct' ? 'Direct Video' : 'Stream'} ${index + 1}`,
    url,
    kind,
  };
}

function normalizeGenres(detail) {
  const raw = firstNonEmpty(detail?.genres, detail?.genre, detail?.series?.genre);
  if (Array.isArray(raw)) {
    return raw.map((item, index) => {
      if (item && typeof item === 'object') {
        const name = asText(firstNonEmpty(item.name, item.title, item.slug));
        return name ? { id: item.id ?? item.slug ?? index, name, slug: item.slug || name.toLowerCase().replace(/\s+/g, '-') } : null;
      }
      const name = asText(item);
      return name ? { id: name, name, slug: name.toLowerCase().replace(/\s+/g, '-') } : null;
    }).filter(Boolean);
  }
  return String(raw || '').split(/[,|]/).map(value => value.trim()).filter(Boolean)
    .map(name => ({ id: name, name, slug: name.toLowerCase().replace(/\s+/g, '-') }));
}

function normalizeRelated(raw) {
  const normalizeGroup = values => (Array.isArray(values) ? values : []).map((item, index) => ({
    id: item?.id ?? null,
    title: stripHtml(item?.title) || 'Tanpa judul',
    slug: item?.slug || null,
    url: absoluteUrl(item?.url),
    image: absoluteUrl(item?.image),
    source: item?.source || 'html/related',
    index,
  })).filter(item => item.title && (item.id || item.slug || item.url));
  return {
    info: normalizeGroup(raw?.info),
    hentai: normalizeGroup(raw?.hentai),
  };
}

function normalizeDownloads(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(group => ({
    quality: asText(firstNonEmpty(group?.quality, group?.type)) || 'Download',
    links: (Array.isArray(group?.links) ? group.links : []).map((link, index) => {
      const url = typeof link === 'string' ? link : firstNonEmpty(link?.url, link?.link, link?.href);
      if (!isUrl(url)) return null;
      return {
        name: asText(typeof link === 'string' ? null : firstNonEmpty(link?.name, link?.label)) || `Download ${index + 1}`,
        url,
        kind: mediaKind(url, 'download'),
      };
    }).filter(Boolean),
  })).filter(group => group.links.length > 0);
}

function normalizeMedia(detail) {
  const direct = Array.isArray(detail?.direct) ? detail.direct : [];
  const rawStreams = Array.isArray(detail?.streams) ? detail.streams : [];
  const all = [
    ...direct.map((url, index) => normalizeStreamItem(url, index, 'direct')),
    ...rawStreams.map((item, index) => normalizeStreamItem(item, index, item?.kind || 'embed')),
  ].filter(Boolean);
  const seen = new Set();
  const streams = all.filter(item => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
  return {
    streams,
    embeds: streams.filter(item => item.kind === 'embed'),
    direct: streams.filter(item => item.kind === 'direct'),
  };
}

async function referenceCatalog() {
  return withCache('reference:all', async () => {
    const first = await referenceApi.fetchAll(null, 1, 200);
    const totalPages = Math.min(50, Number(first?.totalPages) || 1);
    const pages = [first];
    for (let page = 2; page <= totalPages; page += 1) {
      try { pages.push(await referenceApi.fetchAll(null, page, 200)); } catch { break; }
    }
    const result = pages.flatMap(page => Array.isArray(page?.result) ? page.result : []);
    const unique = [...new Map(result.map(item => [String(item.id ?? item.slug ?? item.title), item])).values()];
    return { ...first, result: unique, total: Number(first?.total) || unique.length, totalPages };
  }, 10 * 60 * 1000);
}

export async function apiRecent() {
  return withCache('reference:recent', async () => {
    const result = await referenceApi.fetchRecent();
    return {
      carousel: Array.isArray(result?.carousel) ? result.carousel : [],
      posts: Array.isArray(result?.posts) ? result.posts : [],
      source: result?.source || 'custom_api/recent',
    };
  }, 3 * 60 * 1000);
}

export async function apiAll(page = 1, perPage = 20) {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const safePerPage = Math.min(100, Math.max(1, Number.parseInt(perPage, 10) || 20));
  const backendPageSize = 200;
  const absoluteStart = (safePage - 1) * safePerPage;
  const backendPage = Math.floor(absoluteStart / backendPageSize) + 1;
  const backendOffset = absoluteStart % backendPageSize;
  const catalog = await referenceApi.fetchAll(null, backendPage, backendPageSize);
  const items = Array.isArray(catalog?.result) ? catalog.result : [];
  const total = Number(catalog?.total ?? items.length);
  const totalPages = Math.max(1, Math.ceil(total / safePerPage));
  return {
    results: items.slice(backendOffset, backendOffset + safePerPage),
    page: safePage,
    perPage: safePerPage,
    total,
    totalPages,
    hasNext: safePage < totalPages,
    source: catalog?.source || 'custom_api/all',
  };
}

export async function apiOngoing(page = 1, perPage = 20) {
  const recent = await apiRecent();
  const sourceItems = (recent.posts || []).flatMap(group => Array.isArray(group.data) ? group.data : []);
  const fallbackItems = recent.carousel || [];
  const seen = new Set();
  const items = (sourceItems.length ? sourceItems : fallbackItems).filter(item => {
    const key = String(item?.id ?? item?.slug ?? item?.title ?? '');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const safePerPage = Math.min(100, Math.max(1, Number.parseInt(perPage, 10) || 20));
  const totalPages = Math.max(1, Math.ceil(items.length / safePerPage));
  const start = (safePage - 1) * safePerPage;
  return {
    results: items.slice(start, start + safePerPage),
    page: safePage,
    perPage: safePerPage,
    total: items.length,
    totalPages,
    hasNext: safePage < totalPages,
    source: recent.source || 'custom_api/recent',
  };
}

export async function apiDetail(identifier) {
  let detail = await referenceApi.fetchDetail(identifier);
  const originalSeries = detail?.series || null;
  const originalEpisodes = Array.isArray(detail?.episodes) ? detail.episodes : [];
  const initialMedia = normalizeMedia(detail);
  if (!initialMedia.streams.length && originalEpisodes[0]?.id) {
    try {
      const episodeDetail = await referenceApi.fetchDetail(originalEpisodes[0].id);
      detail = {
        ...episodeDetail,
        series: episodeDetail.series || originalSeries,
        episodes: originalEpisodes,
        series_source_id: detail.id,
      };
    } catch (_) {
      // Jika episode pertama gagal, tetap kembalikan metadata seri.
    }
  }
  const media = normalizeMedia(detail);
  const genres = normalizeGenres(detail);
  return {
    id: detail?.id ?? identifier,
    date: detail?.date ?? null,
    title: detail?.title || 'Tanpa judul',
    slug: detail?.slug || null,
    image: detail?.image || detail?.series?.image || null,
    synopsis: detail?.synopsis || detail?.description || null,
    description: detail?.description || detail?.synopsis || null,
    genres,
    genre: genres.map(item => item.name).join(', '),
    producer: detail?.producer || null,
    duration: detail?.duration || null,
    size: detail?.size || null,
    episode: detail?.episode || null,
    status: detail?.status || null,
    tayang: detail?.tayang || null,
    aliases: detail?.aliases || null,
    score: detail?.score || null,
    note: detail?.note || null,
    streamnote: detail?.streamnote || detail?.note || null,
    streams: media.streams,
    embeds: media.embeds,
    direct: media.direct,
    downloads: normalizeDownloads(detail?.downloads),
    missingFields: detail?.missing_fields || [],
    contentText: detail?.content_text || null,
    source: detail?.source || 'custom_api/post2',
    series: detail?.series || originalSeries || null,
    episodes: Array.isArray(detail?.episodes) ? detail.episodes : originalEpisodes,
    seriesSourceId: detail?.series_source_id || null,
    related: normalizeRelated(detail?.related),
    rawMedia: {
      stream: detail?.streams || [],
      embed: detail?.embeds || [],
      direct: detail?.direct || [],
      download: detail?.downloads || [],
    },
  };
}

export async function apiGenres() {
  const result = await referenceApi.fetchGenres();
  const data = Array.isArray(result?.data) ? result.data : [];
  return data.map((item, index) => {
    if (typeof item === 'string') return { id: item, name: item, slug: item.toLowerCase().replace(/\s+/g, '-') };
    return {
      id: item?.id ?? item?.term_id ?? item?.slug ?? index,
      name: asText(firstNonEmpty(item?.name, item?.title, item?.slug)) || `Genre ${index + 1}`,
      slug: item?.slug || null,
      count: item?.count ?? null,
      raw: item,
    };
  });
}

export async function apiSearch(query, limit = 20) {
  const result = await referenceApi.fetchSearch(query);
  const items = Array.isArray(result?.result) ? result.result.slice(0, limit) : [];
  let catalog = [];
  try { catalog = (await referenceCatalog())?.result || []; } catch {}
  const byId = new Map(catalog.map(item => [String(item.id), item]));
  return items.map(item => {
    const match = byId.get(String(item.id));
    return {
      id: item.id,
      title: stripHtml(item.title) || 'Tanpa judul',
      slug: match?.slug || null,
      url: absoluteUrl(item.url),
      image: match?.image || null,
      date: match?.date || null,
      type: item.type || null,
      source: result?.source || 'wp/v2/search',
    };
  });
}

export async function apiGenrePosts(genreId, page = 1, perPage = 20) {
  const genres = await apiGenres();
  const genre = genres.find(item => String(item.id) === String(genreId) || String(item.slug) === String(genreId));
  if (!genre) return { results: [], page: Number(page), perPage: Number(perPage), total: 0, totalPages: 0, hasNext: false, source: 'custom_api/genres' };
  // Script referensi tidak menyediakan endpoint posts-by-genre. Gunakan endpoint search
  // yang sama dari script referensi sebagai fallback, tanpa kembali ke API lama.
  const results = await apiSearch(genre.name, 100);
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const safePerPage = Math.min(100, Math.max(1, Number.parseInt(perPage, 10) || 20));
  const start = (safePage - 1) * safePerPage;
  return {
    results: results.slice(start, start + safePerPage),
    page: safePage,
    perPage: safePerPage,
    total: results.length,
    totalPages: Math.ceil(results.length / safePerPage),
    hasNext: start + safePerPage < results.length,
    source: 'custom_api/genres+search-fallback',
    fallback: true,
  };
}

export async function apiComingSoon() {
  if (typeof referenceApi.fetchComingSoon === 'function') {
    return withCache('reference:comingsoon', () => referenceApi.fetchComingSoon(), 30 * 60 * 1000);
  }
  const recent = await apiRecent();
  const items = [
    ...(recent.carousel || []),
    ...(recent.posts || []).flatMap(group => group.data || []),
  ];
  const groups = new Map();
  for (const item of items) {
    const period = item.date ? String(item.date).slice(0, 10) : 'Terbaru';
    if (!groups.has(period)) groups.set(period, []);
    if (item.title && !groups.get(period).includes(item.title)) groups.get(period).push(item.title);
  }
  return [...groups.entries()].map(([period, titles]) => ({ period, items: titles }));
}

export async function apiTest(id = null) {
  return referenceApi.runTests(id);
}

export const cors = res => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
};

export const ok = (res, data) => { cors(res); res.json({ status: 200, data }); };
const cleanMessage = message => (/<!doctype|<html/i.test(String(message))
  ? 'Situs sumber menolak permintaan (mungkin proteksi Cloudflare atau sedang down).'
  : String(message));
export const fail = (res, error, code = 500) => {
  cors(res);
  res.status(code || error.status || 500).json({ error: cleanMessage(error.message), status: error.status || code || 500 });
};
