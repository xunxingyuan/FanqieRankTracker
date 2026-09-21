document.addEventListener('DOMContentLoaded', () => {
    const shortTags = [
        '爽文', '打脸逆袭', '现代', '男生生活', '婚姻家庭', '女生生活', '虐文', '现实情感', '救赎',
        '玄幻仙侠', '霸总', '职场', '先虐后甜', '追妻火葬场', '现言甜宠', '励志', '系统', '校园',
        '豪门世家', '男生情感', '古代言情', '架空', '青春虐恋', '惊悚', '推理', '复仇', '暗恋',
        '金手指', '女配', '沙雕搞笑', '豪门总裁', '悬疑灵异', '纯爱', '宫斗宅斗', '婆媳', '虐心婚恋',
        '先婚后爱', '替身', '年代', '破镜重圆', '真假千金', '规则怪谈', '追妻', '直播', '病娇', '萌宝',
        '无限流', '科幻', '追夫火葬场', '男频衍生', '女性成长', '历史古代', '犯罪', '娱乐圈', '科幻末世',
        '游戏动漫', '万人迷', '末日求生', '悬疑', '搞笑轻松', '姐弟恋', '赘婿', '女频衍生', '同人',
        '养崽文', '团宠', '都市日常', '都市异能', '现实生活', '民国', '影视', '奇妙物语', '星际',
        '反转', '玄幻', '校霸', '狼人', '追夫', '升级流', '特种兵', '明星', '神医', '虐恋情深',
        '历史武侠', '古言虐恋', '外卖', '古言甜宠', '幻想言情', '奶爸', '历史', '都市脑洞', '武侠',
        '鉴宝', '热血', '现言复仇', '权谋', '基建', '十日衍生', '仕途',
    ];
    const els = {
        tagCount: document.getElementById('short-tag-count'),
        updateTime: document.getElementById('short-update-time'),
        search: document.getElementById('short-tag-search'),
        tagGrid: document.getElementById('short-tag-grid'),
        feedTitle: document.getElementById('short-feed-title'),
        feedSummary: document.getElementById('short-feed-summary'),
        feed: document.getElementById('short-feed'),
    };
    const apiBase = document.querySelector('meta[name="shorts-api-base"]')?.content.trim() || '';
    const tags = shortTags.map(name => ({ name }));
    let selectedTag = '';
    let activeRequest = null;

    init();

    async function init() {
        els.tagCount.textContent = String(tags.length);
        els.updateTime.textContent = '访问时实时获取';
        selectedTag = getInitialTag();
        renderTags();
        bindEvents();
        if (!apiBase) {
            renderConfigurationError();
            return;
        }
        renderLoading();
        await loadTag(selectedTag);
    }

    function bindEvents() {
        els.search.addEventListener('input', renderTags);
    }

    function getInitialTag() {
        const queryTag = new URLSearchParams(window.location.search).get('tag');
        if (tags.some(item => item.name === queryTag)) return queryTag;
        if (tags.some(item => item.name === '男生生活')) return '男生生活';
        return tags[0] ? tags[0].name : '';
    }

    function renderTags() {
        const keyword = els.search.value.trim().toLowerCase();
        const filtered = tags.filter(item => item.name.toLowerCase().includes(keyword));

        if (!filtered.length) {
            els.tagGrid.innerHTML = '<p class="short-tag-empty">没有匹配的标签，请换一个关键词。</p>';
            return;
        }

        els.tagGrid.innerHTML = filtered.map(item => `
            <button
                class="short-tag-btn${item.name === selectedTag ? ' active' : ''}"
                type="button"
                data-tag="${escapeAttr(item.name)}"
                aria-pressed="${item.name === selectedTag ? 'true' : 'false'}"
            >
                <span>${escapeHtml(item.name)}</span>
            </button>
        `).join('');

        els.tagGrid.querySelectorAll('.short-tag-btn').forEach(button => {
            button.addEventListener('click', () => selectTag(button.dataset.tag));
        });
    }

    function selectTag(tag) {
        if (!tags.some(item => item.name === tag) || tag === selectedTag) return;
        selectedTag = tag;
        const url = new URL(window.location.href);
        url.searchParams.set('tag', tag);
        history.replaceState(null, '', url);
        renderTags();
        if (!apiBase) {
            renderConfigurationError();
            return;
        }
        loadTag(tag);
    }

    async function loadTag(tag) {
        if (!tags.some(item => item.name === tag)) return;

        if (activeRequest) activeRequest.abort();
        activeRequest = new AbortController();
        els.feedTitle.textContent = tag;
        els.feedSummary.textContent = '正在整理短篇推荐内容。';
        renderLoading();

        try {
            const separator = apiBase.includes('?') ? '&' : '?';
            const payload = await fetchJson(
                `${apiBase}${separator}tag=${encodeURIComponent(tag)}`,
                activeRequest.signal,
            );
            if (tag !== selectedTag) return;
            renderFeed(payload);
        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error(error);
            renderFeedError(tag);
        }
    }

    function renderFeed(payload) {
        const items = payload.items || [];
        els.feed.setAttribute('aria-busy', 'false');
        els.feedTitle.textContent = payload.tag || selectedTag;
        const candidateSummary = payload.candidate_count
            ? `从 ${payload.candidate_count} 个候选中筛选`
            : '本次收录';
        els.feedSummary.textContent = items.length
            ? `${candidateSummary} ${items.length} 篇，${payload.ranked_by || '按推荐流顺序展示'}。`
            : '这个题材暂时没有可展示的推荐。';

        if (!items.length) {
            els.feed.innerHTML = `
                <div class="short-state">
                    <strong>暂时没有内容</strong>
                    <p>数据源目前没有返回该题材的短篇，请稍后再看。</p>
                </div>
            `;
            return;
        }

        els.feed.innerHTML = items.map((item, index) => renderCard(item, index)).join('');
        els.feed.querySelectorAll('img').forEach(image => {
            image.addEventListener('error', () => image.remove(), { once: true });
        });
    }

    function renderCard(item, index) {
        const topics = (item.topics || []).slice(0, 3);
        const metrics = item.metrics || {};
        const sourceUrl = safeUrl(item.source_url);
        const cover = index === 0 && item.horizontal_cover
            ? item.horizontal_cover
            : item.cover;
        const readingMeta = [
            item.reading_count,
            item.reading_minutes ? `${item.reading_minutes}分钟读完` : '',
            item.word_count ? `${formatNumber(item.word_count)}字` : '',
        ].filter(Boolean);

        return `
            <article class="short-card${index === 0 ? ' short-card-featured' : ''}">
                <div class="short-cover">
                    <div class="short-cover-fallback">${escapeHtml((item.title || '短篇').slice(0, 6))}</div>
                    ${cover ? `<img src="${escapeAttr(cover)}" alt="《${escapeAttr(item.title)}》封面" loading="${index === 0 ? 'eager' : 'lazy'}" referrerpolicy="no-referrer">` : ''}
                    <span class="short-position">${String(item.position || index + 1).padStart(2, '0')}</span>
                </div>
                <div class="short-card-body">
                    <div class="short-topic-row">
                        ${topics.map(topic => `<span>${escapeHtml(topic)}</span>`).join('')}
                    </div>
                    <h3>${escapeHtml(item.title || '未命名短篇')}</h3>
                    <p class="short-author">${escapeHtml((item.author && item.author.name) || '未知作者')}</p>
                    <p class="short-excerpt">${escapeHtml(item.excerpt || '暂无内容摘要。')}</p>
                    <p class="short-reading-meta">${readingMeta.map(escapeHtml).join('<i>/</i>')}</p>
                    <div class="short-card-footer">
                        <dl class="short-metrics">
                            <div><dt>浏览</dt><dd>${formatMetric(metrics.views)}</dd></div>
                            <div><dt>点赞</dt><dd>${formatMetric(metrics.likes)}</dd></div>
                            <div><dt>评论</dt><dd>${formatMetric(metrics.comments)}</dd></div>
                        </dl>
                        ${sourceUrl ? `<a href="${escapeAttr(sourceUrl)}" target="_blank" rel="noopener noreferrer">打开短篇</a>` : ''}
                    </div>
                </div>
            </article>
        `;
    }

    function renderLoading() {
        els.feed.setAttribute('aria-busy', 'true');
        els.feed.innerHTML = Array.from({ length: 6 }, (_, index) => `
            <div class="short-skeleton${index === 0 ? ' short-skeleton-featured' : ''}" aria-hidden="true">
                <span></span><div><i></i><i></i><i></i><i></i></div>
            </div>
        `).join('');
    }

    function renderFeedError(tag) {
        els.feed.setAttribute('aria-busy', 'false');
        els.feedSummary.textContent = '数据读取失败。';
        els.feed.innerHTML = `
            <div class="short-state short-state-error">
                <strong>没有读到“${escapeHtml(tag)}”的数据</strong>
                <p>可能是数据正在更新，或当前网络暂时不可用。</p>
                <button type="button" id="short-retry-btn">重新加载</button>
            </div>
        `;
        document.getElementById('short-retry-btn').addEventListener('click', () => loadTag(tag));
    }

    function renderConfigurationError() {
        els.feedTitle.textContent = selectedTag || '短篇推荐';
        els.feedSummary.textContent = '实时接口尚未配置。';
        els.feed.setAttribute('aria-busy', 'false');
        els.feed.innerHTML = `
            <div class="short-state short-state-error">
                <strong>请先配置 Cloudflare Worker</strong>
                <p>部署 worker/shorts-proxy 后，把 Worker 的 /api/shorts 地址填入 shorts.html 的 shorts-api-base。</p>
            </div>
        `;
    }

    function fetchJson(url, signal) {
        return fetch(url, { signal, cache: 'no-store' }).then(async response => {
            const payload = await response.json().catch(() => null);
            if (!response.ok) throw new Error(payload?.error || `Failed to load ${url}`);
            return payload;
        });
    }

    function formatNumber(value) {
        const number = Number(value) || 0;
        if (number >= 10000) {
            const formatted = (number / 10000).toFixed(number >= 100000 ? 0 : 1).replace(/\.0$/, '');
            return `${formatted}万`;
        }
        return new Intl.NumberFormat('zh-CN').format(number);
    }

    function formatMetric(value) {
        if (value === null || value === undefined || value === '') return '暂无';
        return formatNumber(value);
    }

    function safeUrl(value) {
        try {
            const url = new URL(value);
            return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
        } catch (_) {
            return '';
        }
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeAttr(value) {
        return escapeHtml(value);
    }
});
