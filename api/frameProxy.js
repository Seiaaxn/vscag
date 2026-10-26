// Proxy iframe player: ambil halaman embed dari server sumber, buang skrip/iframe iklan,
// lalu injek shim anti-iklan (blokir popup, redirect top, dan window.open).
// Halaman disajikan dari origin kita sendiri -> TANPA sandbox, video tetap bisa diputar.

const BLOCKED_HOST_RE = /(doubleclick|googlesyndication|googleadservices|adservice|adnxs|adsystem|taboola|outbrain|criteo|pubmatic|rubiconproject|openx|smartadserver|popads|popcash|propellerads|adcash|exoclick|juicyads|clickadu|hilltopads|adsterra|monetag|clickaine|tsyndicate|mgid|zeropark|trafficjunky|revcontent|ad-maven|onclickads|onclckds|histats|cloudflareinsights|challenges\.cloudflare|\bad\.|\/ads\/|-ads\.)/i;

// Skrip iklan biasanya: script eksternal dengan path pendek acak (mis. /NPqSrX3.js, /snLcRYToHF5/156629)
const AD_PATH_RE = /^\/\/[^/]+\/[A-Za-z0-9]{5,12}(?:\.(?:js|php)|\/\d+)(?:$|\?)/;

const AD_HOSTS = 'doubleclick|googlesyndication|googleadservices|adservice|adnxs|adsystem|taboola|outbrain|criteo|pubmatic|rubiconproject|openx|smartadserver|popads|popcash|propellerads|adcash|exoclick|juicyads|clickadu|hilltopads|adsterra|monetag|clickaine|tsyndicate|mgid|zeropark|onclickads|onclckds|ad-maven|revcontent';

const SHIM = `<script>
(function(){
  try {
    var AD_RE = new RegExp('${AD_HOSTS}|\\\\/ads\\\\/|\\\\bad\\\\.', 'i');
    window.open = function(){ return null; };
    var realAssign = Location.prototype.assign, realReplace = Location.prototype.replace;
    Location.prototype.assign = function(u){ if (String(u).indexOf(location.origin) !== 0) return; return realAssign.call(this, u); };
    Location.prototype.replace = function(u){ if (String(u).indexOf(location.origin) !== 0) return; return realReplace.call(this, u); };
    try { window.top = window; window.parent = window; } catch (e) {}
    document.addEventListener('click', function(e){
      var a = e.target && e.target.closest && e.target.closest('a[target="_blank"], a[onclick]');
      if (a) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    var isAd = function(el){ return AD_RE.test(el.src || el.href || (el.getAttribute && (el.getAttribute('data-src') || '')) || ''); };
    var sweep = function(root){
      if (!root.querySelectorAll) return;
      root.querySelectorAll('iframe,script,img').forEach(function(c){ if (isAd(c)) c.remove(); });
      if (root.nodeType === 1 && isAd(root)) root.remove();
    };
    new MutationObserver(function(muts){
      muts.forEach(function(m){ m.addedNodes.forEach(function(n){ if (n.nodeType === 1) sweep(n); }); });
    }).observe(document.documentElement, { childList: true, subtree: true });
    document.addEventListener('DOMContentLoaded', function(){ sweep(document); });
  } catch (e) {}
})();
</script>`;

const rewrite = html => html
  // buang <script> yang src-nya domain iklan ATAU pola iklan umum (path pendek acak di domain aneh)
  .replace(/<script[^>]+src=["']([^"']+)["'][^>]*>\s*<\/script>/gi,
    (m, src) => (BLOCKED_HOST_RE.test(src) || AD_PATH_RE.test(src) ? '' : m))
  // buang <iframe> iklan
  .replace(/<iframe[^>]+src=["']([^"']+)["'][^>]*><\/iframe>/gi,
    (m, src) => (BLOCKED_HOST_RE.test(src) ? '' : m))
  // buang tracker pixel <img> (histats, mc.yandex, dsb.)
  .replace(/<img[^>]+src=["']([^"']*(?:histats|mc\.yandex|scorecardresearch|quantserve|statcounter|cnzz)[^"']*)["'][^>]*>/gi, '')
  // buang blok <script> inline yang memuat tracker iklan/statistik
  .replace(/<script[^>]*>[\s\S]{0,3000}?(?:histats|_Hasync|mc\.yandex|clickadu|propeller)[\s\S]{0,4000}?<\/script>/gi, '')
  .replace(/<!--\s*Histats[\s\S]{0,200}-->/gi, '')
  // buang onclick iklan umum
  .replace(/\sonclick=["'][^"']*(?:window\.open|location\.href)[^"']*["']/gi, '');

const HEAD_INJECT = `
<meta name="referrer" content="no-referrer">
<style>html,body{margin:0!important;} iframe[src*="ads"],iframe[src*="doubleclick"],iframe[src*="popads"],iframe[id*="ads"],iframe[class*="ads"]{display:none!important;}</style>
`;

export async function proxyFrame(rawUrl, res) {
  let target;
  try { target = new URL(rawUrl); } catch { return res.status(400).json({ error: '?url= tidak valid', status: 400 }); }
  if (!/^https?:$/.test(target.protocol)) return res.status(400).json({ error: 'Hanya http/https', status: 400 });

  try {
    const r = await fetch(target, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36',
        'Referer': target.origin + '/',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
      },
    });
    let html = await r.text();

    if (!/<!doctype|<html/i.test(html)) {
      // Bukan HTML (mis. link langsung ke video) — redirect saja
      return res.redirect(302, target.href);
    }

    html = rewrite(html);
    const inject = HEAD_INJECT + SHIM;
    if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, m => m + inject);
    else html = inject + html;

    // Base URL supaya path relatif tetap dimuat dari situs sumber
    if (!/<base\s/i.test(html)) {
      html = html.replace(/<head[^>]*>/i, m => `${m}<base href="${target.origin}${target.pathname.replace(/[^/]*$/, '')}">`);
    }

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=300');
    res.send(html);
  } catch {
    res.status(502).json({ error: 'Gagal memuat halaman player dari situs sumber.', status: 502 });
  }
  }
