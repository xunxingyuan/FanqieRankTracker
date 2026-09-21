const UPSTREAM = 'https://fanqie-shorts-proxy.wzj-fzr.workers.dev/api/shorts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet({ request }) {
  const requestUrl = new URL(request.url);
  const upstreamUrl = new URL(UPSTREAM);
  const tag = requestUrl.searchParams.get('tag');
  if (tag) upstreamUrl.searchParams.set('tag', tag);

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        Accept: 'application/json',
        Origin: 'https://wen1701.github.io',
        Referer: 'https://wen1701.github.io/',
      },
    });
    const headers = new Headers(upstreamResponse.headers);
    Object.entries(CORS_HEADERS).forEach(([name, value]) => headers.set(name, value));
    headers.set('Cache-Control', 'no-store');
    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers,
    });
  } catch {
    return Response.json(
      { error: '短篇推荐数据源暂时不可用。' },
      { status: 502, headers: CORS_HEADERS },
    );
  }
}
