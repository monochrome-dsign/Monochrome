/* Monochrome · Worker
   Sirve la web estática (assets) y añade /api/instagram, que devuelve las
   últimas publicaciones de @monochrome_dsg desde la API de Instagram.

   Fuente 1 (activa): feed JSON de Behold (variable BEHOLD_URL en wrangler.jsonc),
   cacheado 1 h en KV para no gastar las visitas del plan gratuito.
   Fuente 2 (alternativa): el token de Instagram se guarda como secreto IG_TOKEN (Cloudflare →
   Workers → monochrome → Settings → Variables and Secrets). El Worker lo
   renueva solo cada semana (cron) y guarda la versión renovada en KV, así
   que no caduca a los 60 días. */

const FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
const FEED_TTL = 3600;          // 1 h de caché del feed
const LIMIT = 12;

async function getToken(env) {
  return (await env.IG.get("token")) || env.IG_TOKEN || "";
}

async function refreshToken(env) {
  const token = await getToken(env);
  if (!token) return;
  const r = await fetch("https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=" + encodeURIComponent(token));
  if (!r.ok) return;
  const j = await r.json();
  if (j.access_token) await env.IG.put("token", j.access_token);
}

async function instagram(env, ctx) {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "public, max-age=900",
    "access-control-allow-origin": "*"
  };
  const cached = await env.IG.get("feed");
  if (cached) return new Response(cached, { headers });

  let r, behold = false;
  if (env.BEHOLD_URL) {
    behold = true;
    r = await fetch(env.BEHOLD_URL);
  } else {
    const token = await getToken(env);
    if (!token) return new Response('{"posts":[],"error":"no-token"}', { status: 503, headers });
    r = await fetch("https://graph.instagram.com/me/media?fields=" + FIELDS + "&limit=" + LIMIT + "&access_token=" + encodeURIComponent(token));
  }
  if (!r.ok) {
    const stale = await env.IG.get("feed-stale");
    return new Response(stale || '{"posts":[],"error":"instagram"}', { status: stale ? 200 : 502, headers });
  }
  const j = await r.json();
  const raw = behold ? (Array.isArray(j) ? j : (j.posts || [])) : (j.data || []);
  const posts = raw.slice(0, LIMIT).map(p => ({
    id: p.id,
    caption: (p.prunedCaption || p.caption || "").slice(0, 200),
    media_type: p.mediaType || p.media_type,
    media_url: (p.sizes && p.sizes.medium && p.sizes.medium.mediaUrl) || p.mediaUrl || p.media_url,
    thumbnail_url: (p.sizes && p.sizes.medium && p.sizes.medium.mediaUrl) || p.thumbnailUrl || p.thumbnail_url,
    permalink: p.permalink,
    timestamp: p.timestamp
  }));
  const body = JSON.stringify({ posts, updated: new Date().toISOString() });
  if (!posts.length) return new Response(body, { headers: { ...headers, "cache-control": "no-store" } });
  ctx.waitUntil(Promise.all([
    env.IG.put("feed", body, { expirationTtl: FEED_TTL }),
    env.IG.put("feed-stale", body)
  ]));
  return new Response(body, { headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.hostname === "www.monochrome.website") {
      url.hostname = "monochrome.website";
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname === "/api/instagram") return instagram(env, ctx);
    return env.ASSETS.fetch(request);
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(refreshToken(env));
  }
};
