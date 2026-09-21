const SHORT_STORY_ENDPOINT = 'https://api.fanqiesdk.com/api/novel/channel/homepage/new_category/book_list/v1/';
const SHORT_STORY_GENRE_TYPE = '180';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Fanqie organizes the short-story feed by category IDs. These IDs map the
// user-facing topic labels to the official category feed; fallbacks keep broad
// labels populated when a category has no current short-story inventory.
const TAG_CATEGORY_IDS = {
  '婚姻家庭': [125, 261, 3],
  '女生生活': [3, 125, 261],
  '男生生活': [261, 25, 516],
  '爽文': [745, 522, 384, 261],
  '打脸逆袭': [522, 745],
  '现代': [3, 261],
  '虐文': [95, 34, 3],
  '现实情感': [400, 125, 261],
  '救赎': [32, 95, 3],
  '玄幻仙侠': [7, 248, 16],
  '霸总': [748, 29, 3],
  '职场': [127, 750, 3],
  '先虐后甜': [95, 3, 475],
  '追妻火葬场': [470, 475, 95],
  '现言甜宠': [3, 96, 29],
  '励志': [56, 410, 400],
  '系统': [19, 24, 70],
  '校园': [4, 82, 387],
  '豪门世家': [473, 29, 745],
  '男生情感': [261, 48, 25],
  '古代言情': [5, 246, 253],
  '架空': [452, 273, 5],
  '青春虐恋': [4, 475, 95],
  '惊悚': [322, 751, 61],
  '推理': [61, 10, 751],
  '复仇': [522, 268, 95],
  '暗恋': [482, 477, 3],
  '女配': [191, 88, 522],
  '沙雕搞笑': [778, 261, 94],
  '豪门总裁': [29, 748, 473],
  '悬疑灵异': [751, 10, 322],
  '纯爱': [275, 704, 538],
  '宫斗宅斗': [246, 5, 253],
  '婆媳': [125, 400, 261],
  '虐心婚恋': [34, 95, 475],
  '先婚后爱': [471, 3, 29],
  '替身': [470, 3, 475],
  '年代': [79, 400, 273],
  '破镜重圆': [475, 3, 471],
  '真假千金': [745, 522, 88],
  '规则怪谈': [322, 751, 10],
  '追妻': [470, 475, 95],
  '直播': [69, 486, 261],
  '病娇': [380, 92, 95],
  '萌宝': [28, 94, 125],
  '无限流': [70, 322, 8],
  '科幻': [8, 77, 515],
  '追夫火葬场': [470, 475, 95],
  '男频衍生': [718, 538, 39],
  '女性成长': [410, 56, 400],
  '历史古代': [273, 12, 5],
  '犯罪': [305, 61, 751],
  '娱乐圈': [43, 486, 267],
  '科幻末世': [8, 515, 77],
  '游戏动漫': [39, 746, 508],
  '万人迷': [460, 94, 473],
  '末日求生': [515, 68, 8],
  '悬疑': [10, 751, 61],
  '搞笑轻松': [778, 261, 94],
  '姐弟恋': [476, 474, 3],
  '赘婿': [25, 261, 384],
  '女频衍生': [718, 538, 39],
  '同人': [538, 718, 39],
  '养崽文': [28, 94, 125],
  '团宠': [94, 28, 745],
  '都市日常': [261, 2, 127],
  '都市异能': [516, 262, 8],
  '现实生活': [48, 400, 125],
  '民国': [390, 5, 273],
  '影视': [45, 43, 39],
  '奇妙物语': [100, 322, 61],
  '星际': [77, 8, 515],
  '反转': [522, 61, 322],
  '玄幻': [7, 248, 511],
  '校霸': [4, 387, 82],
  '狼人': [100, 322, 61],
  '追夫': [470, 475, 95],
  '升级流': [19, 384, 70],
  '特种兵': [375, 127, 516],
  '明星': [486, 43, 267],
  '神医': [247, 26, 516],
  '虐恋情深': [95, 34, 475],
  '历史武侠': [16, 12, 273],
  '古言虐恋': [5, 95, 246],
  '外卖': [75, 261, 48],
  '古言甜宠': [5, 96, 471],
  '幻想言情': [32, 248, 5],
  '奶爸': [42, 261, 125],
  '历史': [12, 273, 5],
  '都市脑洞': [262, 261, 516],
  '武侠': [16, 7, 273],
  '鉴宝': [17, 61, 261],
  '热血': [384, 7, 261],
  '现言复仇': [268, 522, 3],
  '权谋': [273, 452, 246],
  '基建': [40, 56, 261],
  '十日衍生': [718, 538, 39],
  '仕途': [788, 127, 273],
};

const MALE_TAGS = new Set([
  '男生生活', '男生情感', '男频衍生', '赘婿', '奶爸', '特种兵', '历史武侠',
  '武侠', '神医', '都市异能', '都市脑洞', '基建', '仕途',
]);

const FEMALE_FALLBACKS = [3, 125, 261];
const MALE_FALLBACKS = [261, 25, 516];

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function parseNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function formatReadingCount(value) {
  if (!Number.isFinite(value) || value <= 0) return '';
  if (value >= 10000) {
    return `${(value / 10000).toFixed(value >= 100000 ? 0 : 1).replace(/\.0$/, '')}万人在读`;
  }
  return `${value}人在读`;
}

function getCategoryIds(tag) {
  const gender = MALE_TAGS.has(tag) ? 1 : 0;
  const fallbacks = gender === 1 ? MALE_FALLBACKS : FEMALE_FALLBACKS;
  const categoryIds = [...(TAG_CATEGORY_IDS[tag] || []), ...fallbacks];
  return {
    gender,
    categoryIds: [...new Set(categoryIds)].slice(0, 5),
  };
}

async function fetchShortStoryPage(categoryId, gender) {
  const upstreamUrl = new URL(SHORT_STORY_ENDPOINT);
  const params = {
    aid: '1967',
    offset: '0',
    limit: '50',
    category_id: String(categoryId),
    gender: String(gender),
    genre_type: SHORT_STORY_GENRE_TYPE,
    word_count: '9',
    creation_status: '9',
    device_platform: 'android',
    app_version: '4.6.0',
    version_code: '460',
    version_name: '4.6.0',
    app_name: 'super',
    channel: 'ppx_wy_and_gaox_d_5',
    parent_enterfrom: 'novel_channel_category.tab.',
  };
  Object.entries(params).forEach(([name, value]) => upstreamUrl.searchParams.set(name, value));

  try {
    const response = await fetch(upstreamUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'okhttp-okgo/jeasonlzy',
      },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) return [];
    const items = Array.isArray(payload?.data?.data) ? payload.data.data : [];
    return items.filter(item => !item.genre || String(item.genre) === '8');
  } catch {
    return [];
  }
}

function mapShortStory(book, tag, index) {
  const bookId = String(book.book_id || `short-story-${index}`);
  const wordCount = parseNumber(book.word_number || book.word_count);
  const views = parseNumber(book.read_count);
  const title = book.book_name || book.title || '未命名短故事';
  const cover = book.thumb_url || book.thumb_uri || book.audio_thumb_uri || '';
  const horizontalCover = book.horiz_thumb_url || cover;
  return {
    id: bookId,
    position: index + 1,
    title,
    author: { name: book.author || '未知作者' },
    excerpt: book.abstract || book.sub_abstract || '暂无内容摘要。',
    cover,
    horizontal_cover: horizontalCover,
    topics: [book.category, tag].filter(Boolean).slice(0, 3),
    reading_count: formatReadingCount(views),
    reading_minutes: wordCount ? Math.max(1, Math.ceil(wordCount / 1500)) : 0,
    word_count: wordCount,
    metrics: { views, likes: null, comments: null, favorites: null },
    source_url: `https://fanqienovel.com/page/${bookId}`,
  };
}

export async function onRequestGet({ request }) {
  const requestUrl = new URL(request.url);
  const tag = (requestUrl.searchParams.get('tag') || '').trim();
  if (!tag) {
    return Response.json({ error: '缺少题材标签。' }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    const { categoryIds, gender } = getCategoryIds(tag);
    const pages = await Promise.all(categoryIds.map(categoryId => fetchShortStoryPage(categoryId, gender)));
    const seenBookIds = new Set();
    const candidates = pages.flat().filter(book => {
      const bookId = String(book.book_id || '');
      if (!bookId || seenBookIds.has(bookId)) return false;
      seenBookIds.add(bookId);
      return true;
    });
    const items = candidates.slice(0, 10).map((book, index) => mapShortStory(book, tag, index));

    return Response.json({
      source: '番茄官方短故事接口（Cloudflare 自采）',
      tag,
      updated_at: new Date().toISOString(),
      candidate_count: candidates.length,
      ranked_by: '番茄官方短故事推荐流',
      count: items.length,
      items,
    }, {
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': 'public, max-age=60, s-maxage=120',
      },
    });
  } catch {
    return Response.json({ error: '番茄官方短故事接口暂时不可用。' }, { status: 502, headers: CORS_HEADERS });
  }
}
