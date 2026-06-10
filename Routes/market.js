const express = require('express');
const fetch = require('node-fetch');

const router = express.Router();
const cache = {};
const CACHE_TTL = 5 * 60 * 1000;
const NAMES = {
    NVDA: 'NVIDIA Corporation',
    AAPL: 'Apple Inc.',
    TSLA: 'Tesla Inc.',
    GOOGL: 'Alphabet Inc.',
    AMZN: 'Amazon.com Inc.',
    MSFT: 'Microsoft Corporation',
    META: 'Meta Platforms Inc.',
    AMD: 'Advanced Micro Devices, Inc.',
    NFLX: 'Netflix, Inc.',
    INTC: 'Intel Corporation',
    PLTR: 'Palantir Technologies Inc.',
    CRM: 'Salesforce, Inc.',
    ORCL: 'Oracle Corporation',
    JPM: 'JPMorgan Chase & Co.',
    V: 'Visa Inc.',
    MA: 'Mastercard Incorporated',
    KO: 'The Coca-Cola Company',
    PEP: 'PepsiCo, Inc.',
    DIS: 'The Walt Disney Company',
    UBER: 'Uber Technologies, Inc.'
};
const STOCK_SYMBOLS = ['NVDA', 'AAPL', 'TSLA', 'GOOGL', 'AMZN', 'MSFT', 'META', 'AMD', 'NFLX', 'INTC', 'PLTR', 'CRM', 'ORCL', 'JPM', 'V', 'MA', 'KO', 'PEP', 'DIS', 'UBER'];
const OVERVIEW_SYMBOLS = ['^GSPC', '^IXIC', '^DJI', 'BTC-USD'];
const OVERVIEW_NAMES = { '^GSPC': 'S&P 500', '^IXIC': 'NASDAQ', '^DJI': 'DOW JONES', 'BTC-USD': 'Bitcoin' };
const FALLBACK_STOCKS = [
    { symbol: 'NVDA', name: NAMES.NVDA, price: 875.4, change: 3.02, url: 'https://finance.yahoo.com/quote/NVDA' },
    { symbol: 'AAPL', name: NAMES.AAPL, price: 189.3, change: 1.24, url: 'https://finance.yahoo.com/quote/AAPL' },
    { symbol: 'TSLA', name: NAMES.TSLA, price: 172.82, change: -1.56, url: 'https://finance.yahoo.com/quote/TSLA' },
    { symbol: 'GOOGL', name: NAMES.GOOGL, price: 171.95, change: -0.43, url: 'https://finance.yahoo.com/quote/GOOGL' },
    { symbol: 'AMZN', name: NAMES.AMZN, price: 184.7, change: 2.11, url: 'https://finance.yahoo.com/quote/AMZN' },
    { symbol: 'MSFT', name: NAMES.MSFT, price: 430.1, change: 0.87, url: 'https://finance.yahoo.com/quote/MSFT' },
    { symbol: 'META', name: NAMES.META, price: 493.2, change: 0.65, url: 'https://finance.yahoo.com/quote/META' },
    { symbol: 'AMD', name: NAMES.AMD, price: 165.4, change: 1.95, url: 'https://finance.yahoo.com/quote/AMD' },
    { symbol: 'NFLX', name: NAMES.NFLX, price: 675.2, change: 1.12, url: 'https://finance.yahoo.com/quote/NFLX' },
    { symbol: 'INTC', name: NAMES.INTC, price: 31.84, change: -0.76, url: 'https://finance.yahoo.com/quote/INTC' },
    { symbol: 'PLTR', name: NAMES.PLTR, price: 23.41, change: 4.21, url: 'https://finance.yahoo.com/quote/PLTR' },
    { symbol: 'CRM', name: NAMES.CRM, price: 272.9, change: 0.58, url: 'https://finance.yahoo.com/quote/CRM' },
    { symbol: 'ORCL', name: NAMES.ORCL, price: 139.6, change: 0.44, url: 'https://finance.yahoo.com/quote/ORCL' },
    { symbol: 'JPM', name: NAMES.JPM, price: 201.2, change: 0.91, url: 'https://finance.yahoo.com/quote/JPM' },
    { symbol: 'V', name: NAMES.V, price: 273.8, change: 0.63, url: 'https://finance.yahoo.com/quote/V' },
    { symbol: 'MA', name: NAMES.MA, price: 458.7, change: 0.74, url: 'https://finance.yahoo.com/quote/MA' },
    { symbol: 'KO', name: NAMES.KO, price: 63.9, change: -0.22, url: 'https://finance.yahoo.com/quote/KO' },
    { symbol: 'PEP', name: NAMES.PEP, price: 171.5, change: 0.37, url: 'https://finance.yahoo.com/quote/PEP' },
    { symbol: 'DIS', name: NAMES.DIS, price: 116.3, change: 1.08, url: 'https://finance.yahoo.com/quote/DIS' },
    { symbol: 'UBER', name: NAMES.UBER, price: 71.4, change: 2.14, url: 'https://finance.yahoo.com/quote/UBER' }
];
const RSS_FEEDS = [
    { url: 'https://feeds.reuters.com/reuters/businessNews', source: 'Reuters' },
    { url: 'https://www.cnbc.com/id/10001147/device/rss/rss.html', source: 'CNBC' },
    { url: 'https://finance.yahoo.com/news/rssindex', source: 'Yahoo Finance' },
    { url: 'https://feeds.marketwatch.com/marketwatch/topstories/', source: 'MarketWatch' }
];
const FALLBACK_OVERVIEW = [
    { name: 'S&P 500', symbol: '^GSPC', price: '5,248.49', change: 0.55, url: 'https://finance.yahoo.com/quote/%5EGSPC' },
    { name: 'NASDAQ', symbol: '^IXIC', price: '16,421.33', change: 0.92, url: 'https://finance.yahoo.com/quote/%5EIXIC' },
    { name: 'DOW JONES', symbol: '^DJI', price: '38,904.04', change: -0.21, url: 'https://finance.yahoo.com/quote/%5EDJI' },
    { name: 'Bitcoin', symbol: 'BTC-USD', price: '62,410.00', change: 4.2, url: 'https://finance.yahoo.com/quote/BTC-USD' }
];
const FALLBACK_NEWS = [
    { title: 'Fed Signals Rate Cut Later This Year', description: 'Federal Reserve officials hint at potential interest rate reductions if inflation continues to ease.', url: 'https://www.reuters.com', publishedAt: '2026-06-10', source: 'Reuters', category: 'Monetary Policy' },
    { title: 'NVIDIA Surges After Record Data Center Revenue', description: 'NVIDIA reports record-breaking quarterly earnings driven by surging demand for AI chips.', url: 'https://www.cnbc.com', publishedAt: '2026-06-10', source: 'CNBC', category: 'Technology' },
    { title: 'Bitcoin Breaks $62,000 as Demand Rises', description: 'Cryptocurrency markets rally as major institutional investors increase Bitcoin holdings.', url: 'https://www.reuters.com', publishedAt: '2026-06-10', source: 'Reuters', category: 'Crypto' },
    { title: 'Oil Prices Dip Amid Rising Global Supply', description: 'Crude oil futures fell as OPEC+ members signal plans to increase production.', url: 'https://www.cnbc.com', publishedAt: '2026-06-10', source: 'CNBC', category: 'Commodities' },
    { title: 'Wall Street Firms Track Margin Pressure', description: 'Financial firms are watching earnings as rates stay elevated and spending slows.', url: 'https://www.reuters.com', publishedAt: '2026-06-10', source: 'Reuters', category: 'Finance' },
    { title: 'Tech Stocks Extend Gains', description: 'Large-cap technology names lead the market higher on strong demand for AI infrastructure.', url: 'https://www.cnbc.com', publishedAt: '2026-06-10', source: 'CNBC', category: 'Technology' }
];

function getCached(key) {
    const entry = cache[key];
    if (entry && Date.now() - entry.time < CACHE_TTL) return entry.data;
    return null;
}

function setCache(key, data) {
    cache[key] = { data, time: Date.now() };
}

function fallbackFrom(key) {
    return JSON.parse(JSON.stringify(key === 'news' ? FALLBACK_NEWS : key === 'overview' ? FALLBACK_OVERVIEW : FALLBACK_STOCKS));
}

function parsePrice(raw) {
    return Number(raw) || 0;
}

function parseChange(raw, regularMarketPrice, regularMarketPreviousClose) {
    if (Number.isFinite(Number(raw))) return Number(raw);
    const price = Number(regularMarketPrice);
    const prev = Number(regularMarketPreviousClose);
    if (!Number.isFinite(price) || !Number.isFinite(prev) || prev === 0) return 0;
    return ((price - prev) / prev) * 100;
}

function tagCategory(title) {
    const t = String(title || '').toLowerCase();
    if (t.includes('bitcoin') || t.includes('crypto') || t.includes('eth')) return 'Crypto';
    if (t.includes('fed') || t.includes('rate') || t.includes('inflation')) return 'Monetary Policy';
    if (t.includes('nvidia') || t.includes('apple') || t.includes('tech') || t.includes('ai')) return 'Technology';
    if (t.includes('oil') || t.includes('gold') || t.includes('commodity')) return 'Commodities';
    return 'Finance';
}

function stripTags(text) {
    return String(text || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function parseRssItems(xml, source) {
    const items = [];
    const itemRegex = /<item[\s\S]*?<\/item>/gi;
    const titleRegex = /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/i;
    const descRegex = /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/i;
    const linkRegex = /<link>([\s\S]*?)<\/link>/i;
    const pubRegex = /<pubDate>([\s\S]*?)<\/pubDate>/i;
    const matches = String(xml || '').match(itemRegex) || [];
    for (const item of matches) {
        const titleMatch = item.match(titleRegex);
        const descMatch = item.match(descRegex);
        const linkMatch = item.match(linkRegex);
        const pubMatch = item.match(pubRegex);
        const title = stripTags(titleMatch && (titleMatch[1] || titleMatch[2]));
        const description = stripTags(descMatch && (descMatch[1] || descMatch[2]));
        const url = (linkMatch && linkMatch[1] ? linkMatch[1].trim() : '') || 'https://finance.yahoo.com';
        const published = pubMatch && pubMatch[1] ? new Date(pubMatch[1]).toISOString().slice(0, 10) : '';
        if (title) {
            items.push({
                title,
                description,
                url,
                publishedAt: published,
                source,
                category: tagCategory(title)
            });
        }
    }
    return items;
}

async function safeJson(url) {
    const response = await fetch(url, { timeout: 10000 });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json();
}

async function safeText(url) {
    const response = await fetch(url, { timeout: 10000 });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.text();
}

function formatOverviewPrice(symbol, value) {
    if (symbol === 'BTC-USD') return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

router.get('/stocks', async (req, res) => {
    const cached = getCached('stocks');
    try {
        const [quoteData] = await Promise.all([
            safeJson(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${STOCK_SYMBOLS.join(',')}`),
            safeJson(`https://query1.finance.yahoo.com/v8/finance/spark?symbols=${STOCK_SYMBOLS.join(',')}&range=1d&interval=5m`)
        ]);
        const result = (quoteData && quoteData.quoteResponse && quoteData.quoteResponse.result ? quoteData.quoteResponse.result : []).map((item) => ({
            symbol: item.symbol,
            name: NAMES[item.symbol] || item.shortName || item.longName || item.symbol,
            price: parsePrice(item.regularMarketPrice),
            change: parseChange(item.regularMarketChangePercent, item.regularMarketPrice, item.regularMarketPreviousClose),
            url: `https://finance.yahoo.com/quote/${encodeURIComponent(item.symbol)}`
        }));
        if (result.length) {
            setCache('stocks', result);
            return res.status(200).json(result);
        }
        throw new Error('Empty stock response');
    } catch (err) {
        return res.status(200).json(cached || fallbackFrom('stocks'));
    }
});

router.get('/overview', async (req, res) => {
    const cached = getCached('overview');
    try {
        const data = await safeJson(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${OVERVIEW_SYMBOLS.join(',')}`);
        const result = (data && data.quoteResponse && data.quoteResponse.result ? data.quoteResponse.result : []).map((item) => ({
            name: OVERVIEW_NAMES[item.symbol] || item.symbol,
            symbol: item.symbol,
            price: formatOverviewPrice(item.symbol, item.regularMarketPrice),
            change: parseChange(item.regularMarketChangePercent, item.regularMarketPrice, item.regularMarketPreviousClose),
            url: `https://finance.yahoo.com/quote/${encodeURIComponent(item.symbol)}`
        }));
        if (result.length) {
            setCache('overview', result);
            return res.status(200).json(result);
        }
        throw new Error('Empty overview response');
    } catch (err) {
        return res.status(200).json(cached || fallbackFrom('overview'));
    }
});

router.get('/news', async (req, res) => {
    const cached = getCached('news');
    try {
        if (process.env.NEWS_API_KEY) {
            const data = await safeJson(`https://newsapi.org/v2/top-headlines?category=business&language=en&pageSize=6&apiKey=${process.env.NEWS_API_KEY}`);
            const result = (data && data.articles ? data.articles : []).map((item) => ({
                title: item.title,
                description: item.description || item.content || '',
                url: item.url,
                publishedAt: item.publishedAt ? String(item.publishedAt).slice(0, 10) : '',
                source: item.source && item.source.name ? item.source.name : 'News',
                category: tagCategory(item.title)
            }));
            if (result.length) {
                setCache('news', result);
                return res.status(200).json(result);
            }
        }
        for (const feed of RSS_FEEDS) {
            try {
                const xml = await safeText(feed.url);
                const parsed = parseRssItems(xml, feed.source);
                if (parsed.length) {
                    const result = parsed.slice(0, 6);
                    setCache('news', result);
                    return res.status(200).json(result);
                }
            } catch (rssErr) {
                continue;
            }
        }
    } catch (err) {
        console.error('Market news fetch failed:', err);
    }
    return res.status(200).json(cached || fallbackFrom('news'));
});

module.exports = router;
