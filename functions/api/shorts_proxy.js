const SEARCH_ENDPOINT = 'https://novel.snssdk.com/api/novel/channel/homepage/search/search/v1/';
const DETAIL_ENDPOINT = 'https://fanqienovel.com/page/';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function extractNumber(html, field) {
  const match = html.match(new RegExp(`"${field}"\\s*:\\s*(\\d+)`));
  return match ? Number(match[1]) : null;
}

async function fetchBookDetail(bookId) {
  try {
    const response = await fetch(`${DETAIL_ENDPOINT}${encodeURIComponent(bookId)}`, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (compatible; FanqieRankTracker/1.0)',
      },
    });
    if (!response.ok) return {};
    const html = await response.text();
    return {
      views: extractNumber(html, 'readCount'),
      wordCount: extractNumber(html, 'wordNumber'),
    };
  } catch {
    return {};
  }
}

export async function onRequestGet({ request }) {
  const requestUrl = new URL(request.url);
  const tag = (requestUrl.searchParams.get('tag') || '').trim();
  if (!tag) {
    return Response.json({ error: '缺少题材标签。' }, { status: 400, headers: CORS_HEADERS });
  }

  const upstreamUrl = new URL(SEARCH_ENDPOINT);
  upstreamUrl.searchParams.set('device_platform', 'android');
  upstreamUrl.searchParams.set('parent_enterfrom', 'novel_channel_search.tab.');
  upstreamUrl.searchParams.set('offset', '0');
  upstreamUrl.searchParams.set('aid', '1967');
  upstreamUrl.searchParams.set('q', tag);

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'com.ss.android.article.news/7.0.3 (Linux; U; Android 12; zh_CN; Pixel 6)',
      },
    });
    const payload = await upstreamResponse.json().catch(() => null);
    if (!upstreamResponse.ok || !payload) {
      return Response.json({ error: '番茄公开接口暂时不可用。' }, { status: 502, headers: CORS_HEADERS });
    }

    const sourceItems = Array.isArray(payload?.data?.ret_data) ? payload.data.ret_data : [];
    const items = await Promise.all(sourceItems.slice(0, 10).map(async (book, index) => {
      const bookId = String(book.book_id || ('search-' + index));
      const title = book.title || '未命名短篇';
      const category = book.category || '';
      const detail = bookId.startsWith('search-') ? {} : await fetchBookDetail(bookId);
      const views = Number.isFinite(detail.views) ? detail.views : null;
      const wordCount = Number.isFinite(detail.wordCount) ? detail.wordCount : null;
      return {
        id: bookId,
        position: index + 1,
        title,
        author: { name: book.author || '未知作者' },
        excerpt: book.abstract || '暂无内容摘要。',
        cover: book.thumb_url || book.audio_thumb_uri || '',
        horizontal_cover: book.thumb_url || book.audio_thumb_uri || '',
        topics: [category, tag].filter(Boolean).slice(0, 3),
        reading_count: book.add_bookshelf_count || '',
        reading_minutes: 0,
        word_count: wordCount,
        metrics: { views, likes: null, comments: null, favorites: null },
        source_url: book.page_url || ('https://fanqienovel.com/page/' + bookId),
      };
    }));

    return Response.json({
      source: '番茄小说公开接口（Cloudflare 自采）',
      tag,
      updated_at: new Date().toISOString(),
      count: items.length,
      items,
    }, {
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': 'public, max-age=60, s-maxage=120',
      },
    });
  } catch {
    return Response.json({ error: '番茄公开接口暂时不可用。' }, { status: 502, headers: CORS_HEADERS });
  }
}
