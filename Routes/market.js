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
    UBER: 'Uber Technologies, Inc.',
    BAC: 'Bank of America Corporation',
    WMT: 'Walmart Inc.',
    COST: 'Costco Wholesale Corporation',
    ADBE: 'Adobe Inc.',
    CSCO: 'Cisco Systems, Inc.',
    PYPL: 'PayPal Holdings, Inc.',
    SHOP: 'Shopify Inc.'
};
const STOCK_SYMBOLS = ['NVDA', 'AAPL', 'TSLA', 'GOOGL', 'AMZN', 'MSFT', 'META', 'AMD', 'NFLX', 'INTC', 'PLTR', 'CRM', 'ORCL', 'JPM', 'V', 'MA', 'KO', 'PEP', 'DIS', 'UBER', 'BAC', 'WMT', 'COST', 'ADBE', 'CSCO', 'PYPL', 'SHOP'];
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
    { symbol: 'UBER', name: NAMES.UBER, price: 71.4, change: 2.14, url: 'https://finance.yahoo.com/quote/UBER' },
    { symbol: 'BAC', name: NAMES.BAC, price: 39.8, change: 0.41, url: 'https://finance.yahoo.com/quote/BAC' },
    { symbol: 'WMT', name: NAMES.WMT, price: 67.2, change: 0.52, url: 'https://finance.yahoo.com/quote/WMT' },
    { symbol: 'COST', name: NAMES.COST, price: 815.6, change: 0.34, url: 'https://finance.yahoo.com/quote/COST' },
    { symbol: 'ADBE', name: NAMES.ADBE, price: 475.9, change: -0.31, url: 'https://finance.yahoo.com/quote/ADBE' },
    { symbol: 'CSCO', name: NAMES.CSCO, price: 47.5, change: 0.18, url: 'https://finance.yahoo.com/quote/CSCO' },
    { symbol: 'PYPL', name: NAMES.PYPL, price: 61.8, change: -0.48, url: 'https://finance.yahoo.com/quote/PYPL' },
    { symbol: 'SHOP', name: NAMES.SHOP, price: 66.3, change: 1.26, url: 'https://finance.yahoo.com/quote/SHOP' }
];
const RSS_FEEDS = [
    { url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', source: 'Wall Street Journal' },
    { url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories', source: 'MarketWatch' },
    { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147', source: 'CNBC' },
    { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', source: 'BBC Business' }
];
const FALLBACK_OVERVIEW = [
    { name: 'S&P 500', symbol: '^GSPC', price: '5,248.49', change: 0.55, url: 'https://finance.yahoo.com/quote/%5EGSPC' },
    { name: 'NASDAQ', symbol: '^IXIC', price: '16,421.33', change: 0.92, url: 'https://finance.yahoo.com/quote/%5EIXIC' },
    { name: 'DOW JONES', symbol: '^DJI', price: '38,904.04', change: -0.21, url: 'https://finance.yahoo.com/quote/%5EDJI' },
    { name: 'Bitcoin', symbol: 'BTC-USD', price: '62,410.00', change: 4.2, url: 'https://finance.yahoo.com/quote/BTC-USD' }
];
const FALLBACK_NEWS = [
    { title: 'Markets News and Analysis', description: 'Latest market coverage from Reuters business news.', url: 'https://www.reuters.com/markets/', publishedAt: '2026-06-10', source: 'Reuters', category: 'Finance' },
    { title: 'Stocks and Markets News', description: 'Latest market updates from CNBC Markets.', url: 'https://www.cnbc.com/markets/', publishedAt: '2026-06-10', source: 'CNBC', category: 'Finance' },
    { title: 'Latest Financial Market News', description: 'Market headlines and financial news from Yahoo Finance.', url: 'https://finance.yahoo.com/topic/stock-market-news/', publishedAt: '2026-06-10', source: 'Yahoo Finance', category: 'Finance' },
    { title: 'MarketWatch Top Stories', description: 'Latest financial market stories and analysis from MarketWatch.', url: 'https://www.marketwatch.com/latest-news', publishedAt: '2026-06-10', source: 'MarketWatch', category: 'Finance' }
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
    return String(text || '')
        .replace(/<!\[CDATA\[|\]\]>/g, '')
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

function cleanUrl(url) {
    return stripTags(url).replace(/&amp;/g, '&').trim();
}

function isValidArticleUrl(url) {
    if (!url || url === '#') return false;
    if (!/^https?:\/\//i.test(url)) return false;
    return !/^(https?:\/\/)?(www\.)?(reuters\.com|cnbc\.com|finance\.yahoo\.com|marketwatch\.com)\/?$/i.test(url);
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
        const url = cleanUrl(linkMatch && linkMatch[1]);
        const published = pubMatch && pubMatch[1] ? new Date(pubMatch[1]).toISOString().slice(0, 10) : '';
        if (title && isValidArticleUrl(url)) {
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
    const response = await fetch(url, {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MonetaApp/1.0; +https://moneta.app)' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
    return response.text();
}

function uniqueNews(items) {
    const seen = new Set();
    return items.filter((item) => {
        const key = (item.url || item.title || '').toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function sortNewsNewest(items) {
    return items.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
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
    const articles = [];

    for (const feed of RSS_FEEDS) {
        try {
            const xml = await safeText(feed.url);
            articles.push(...parseRssItems(xml, feed.source));
        } catch (rssErr) {
            console.error('[Market News] RSS source unavailable:', rssErr.message);
        }
    }

    const latest = sortNewsNewest(uniqueNews(articles)).slice(0, 20);
    if (latest.length) {
        setCache('news', latest);
        return res.status(200).json(latest);
    }

    const fallback = (cached || fallbackFrom('news')).filter((item) => item && isValidArticleUrl(item.url));
    return res.status(200).json(fallback);
});

// ── Market Forecast API (Live — yahoo-finance2) ──────────────────────────────

let yahooFinance;
try {
    const YahooFinanceClass = require('yahoo-finance2').default;
    yahooFinance = new YahooFinanceClass();
} catch (e) {
    console.warn('[Market Forecast] yahoo-finance2 not available, will use fallback data.');
}

/**
 * Generates a 7-day AI prediction from historical prices.
 * Algorithm: EWM trend + volatility noise (deterministic sine wave).
 * @param {number[]} prices  Array of closing prices (oldest first)
 * @param {number}   currentPrice  Live price to bridge from
 */
function generateAIPrediction(prices, currentPrice) {
    const all = [...prices, currentPrice];
    const n = all.length;

    // Exponential weighted momentum over last 10 days (decay = 0.85)
    let ewmSum = 0, ewmWeight = 0, decay = 0.85;
    const slice = all.slice(-10);
    for (let i = 0; i < slice.length; i++) {
        const w = Math.pow(decay, slice.length - 1 - i);
        ewmSum += slice[i] * w;
        ewmWeight += w;
    }
    const ewm = ewmSum / ewmWeight;

    // 5-day momentum ratio
    const momentum5 = n >= 5 ? (all[n - 1] - all[n - 5]) / all[n - 5] : 0;
    const dailyTrend = (momentum5 / 5) * 0.35; // dampen 65% — mean reversion

    // Historical volatility: std dev of daily % returns (last 14 days)
    const retSlice = all.slice(-15);
    const rets = [];
    for (let i = 1; i < retSlice.length; i++) {
        rets.push((retSlice[i] - retSlice[i - 1]) / retSlice[i - 1]);
    }
    const avgRet = rets.reduce((a, b) => a + b, 0) / rets.length;
    const variance = rets.reduce((a, b) => a + Math.pow(b - avgRet, 2), 0) / rets.length;
    const vol = Math.sqrt(variance);

    const prediction = [];
    let price = currentPrice;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
        if (i === 0) {
            // Bridge: first prediction point = live price
            prediction.push({ date: today.toISOString().slice(0, 10), price: Math.round(price * 100) / 100 });
            continue;
        }
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        // Deterministic noise — sine wave keyed to price magnitude
        const noise = Math.sin(i * 1.9 + price * 0.0007) * price * vol * 0.55;
        // Pull slightly toward EWM (mean reversion)
        const meanPull = (ewm - price) * 0.04;
        price = Math.max(0.01, price * (1 + dailyTrend) + noise + meanPull);
        prediction.push({
            date: d.toISOString().slice(0, 10),
            price: Math.round(price * 100) / 100
        });
    }
    return prediction;
}

/** Static fallback per symbol for when Yahoo is unavailable */
const MARKET_FALLBACK = {
    '^GSPC': { name: 'S&P 500', currentPrice: 5248.49, pointChange: 28.8, percentChange: 0.55 },
    '^IXIC': { name: 'NASDAQ', currentPrice: 16421.33, pointChange: 149.5, percentChange: 0.92 },
    '^DJI': { name: 'Dow Jones', currentPrice: 38904.04, pointChange: -82.1, percentChange: -0.21 },
    '^RUT': { name: 'Russell 2000', currentPrice: 2041.5, pointChange: 12.3, percentChange: 0.61 },
    '^FTSE': { name: 'FTSE 100', currentPrice: 8285.71, pointChange: 31.4, percentChange: 0.38 },
    '^N225': { name: 'Nikkei 225', currentPrice: 38835.1, pointChange: -215.4, percentChange: -0.55 },
    '^GDAXI': { name: 'DAX', currentPrice: 18772.85, pointChange: 94.2, percentChange: 0.50 },
    'GC=F': { name: 'Gold', currentPrice: 2318.4, pointChange: 8.9, percentChange: 0.38 },
    'CL=F': { name: 'Crude Oil', currentPrice: 78.55, pointChange: -0.82, percentChange: -1.03 },
    'BTC-USD': { name: 'Bitcoin', currentPrice: 67420.0, pointChange: 2180, percentChange: 3.34 },
    'ETH-USD': { name: 'Ethereum', currentPrice: 3512.0, pointChange: 87.4, percentChange: 2.55 }
};

function buildFallbackResponse(symbol, range = '1M') {
    const fb = MARKET_FALLBACK[symbol] || { name: symbol, currentPrice: 100, pointChange: 0, percentChange: 0 };
    const base = fb.currentPrice;
    
    let numPoints = 30;
    let stepType = 'day';
    let stepMinutes = 5;
    
    switch (range) {
        case '1D':
            numPoints = 78;
            stepType = 'minute';
            stepMinutes = 5;
            break;
        case '5D':
            numPoints = 130;
            stepType = 'minute';
            stepMinutes = 15;
            break;
        case '1M':
            numPoints = 30;
            stepType = 'day';
            break;
        case '6M':
            numPoints = 130;
            stepType = 'day';
            break;
        case 'YTD':
            numPoints = 110;
            stepType = 'day';
            break;
        case '1Y':
            numPoints = 252;
            stepType = 'day';
            break;
        case '5Y':
            numPoints = 260;
            stepType = 'week';
            break;
        case 'MAX':
            numPoints = 240;
            stepType = 'month';
            break;
    }

    const today = new Date();
    const historical = [];
    const dailyReturn = (fb.percentChange / 100) / 30;
    const drift = dailyReturn || 0.0002;
    const volatility = 0.008;
    
    let p = base;
    let currentMomentum = 0;
    
    for (let i = 0; i < numPoints; i++) {
        const d = new Date(today);
        if (stepType === 'minute') {
            d.setMinutes(today.getMinutes() - i * stepMinutes);
        } else if (stepType === 'day') {
            d.setDate(today.getDate() - i);
        } else if (stepType === 'week') {
            d.setDate(today.getDate() - i * 7);
        } else if (stepType === 'month') {
            d.setMonth(today.getMonth() - i);
        }

        let dateStr;
        if (range === '1D' || range === '5D') {
            dateStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        } else {
            dateStr = d.toISOString().slice(0, 10);
        }

        historical.unshift({ date: dateStr, price: Math.round(p * 100) / 100 });

        const noise = (Math.random() - 0.5) * volatility;
        currentMomentum = 0.6 * currentMomentum + 0.4 * noise;
        const change = drift + currentMomentum;
        p = Math.max(0.01, p / (1 + change));
    }

    const prediction = generateAIPrediction(historical.map(h => h.price), base);

    return {
        symbol,
        name: fb.name,
        currentPrice: base,
        pointChange: fb.pointChange,
        percentChange: fb.percentChange,
        open: base * 0.998,
        high: base * 1.012,
        low: base * 0.991,
        previousClose: base - fb.pointChange,
        fiftyTwoWeekHigh: base * 1.18,
        fiftyTwoWeekLow: base * 0.78,
        timestamp: new Date().toISOString(),
        historical,
        prediction,
        isFallback: true
    };
}

router.get('/market-data/:symbol', async (req, res) => {
    const symbol = String(req.params.symbol || '').trim();
    if (!symbol) {
        return res.status(400).json({ error: 'Symbol is required' });
    }
    const range = String(req.query.range || '1M').toUpperCase();

    // Try live data first
    if (yahooFinance) {
        try {
            const endDate = new Date();
            let startDate = new Date();
            let interval = '1d';
            let limitPoints = 30;
            let useChart = false;

            switch (range) {
                case '1D':
                    startDate.setDate(startDate.getDate() - 1);
                    interval = '5m';
                    limitPoints = 78;
                    useChart = true;
                    break;
                case '5D':
                    startDate.setDate(startDate.getDate() - 5);
                    interval = '15m';
                    limitPoints = 130;
                    useChart = true;
                    break;
                case '1M':
                    startDate.setDate(startDate.getDate() - 40);
                    interval = '1d';
                    limitPoints = 30;
                    break;
                case '6M':
                    startDate.setMonth(startDate.getMonth() - 6);
                    interval = '1d';
                    limitPoints = 130;
                    break;
                case 'YTD':
                    startDate = new Date(endDate.getFullYear(), 0, 1);
                    interval = '1d';
                    limitPoints = Math.max(30, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24) * 5 / 7));
                    break;
                case '1Y':
                    startDate.setFullYear(startDate.getFullYear() - 1);
                    interval = '1d';
                    limitPoints = 252;
                    break;
                case '5Y':
                    startDate.setFullYear(startDate.getFullYear() - 5);
                    interval = '1wk';
                    limitPoints = 260;
                    break;
                case 'MAX':
                    startDate.setFullYear(startDate.getFullYear() - 20);
                    interval = '1mo';
                    limitPoints = 240;
                    break;
                default:
                    startDate.setDate(startDate.getDate() - 40);
                    interval = '1d';
                    limitPoints = 30;
                    break;
            }

            let histRaw = [];
            let quote = {};

            if (useChart) {
                try {
                    const chartResult = await yahooFinance.chart(symbol, {
                        period1: startDate,
                        period2: endDate,
                        interval: interval
                    }, { validateResult: false });
                    histRaw = chartResult.quotes || [];
                } catch (e) {
                    console.error('[Market Forecast] Yahoo Finance chart endpoint failed, trying historical', e.message);
                    useChart = false;
                }
            }

            if (!useChart) {
                // Fallback range parameters for historical endpoint (which doesn't support intraday)
                if (interval === '5m' || interval === '15m') {
                    interval = '1d';
                }
                const histResult = await yahooFinance.historical(symbol, {
                    period1: startDate,
                    period2: endDate,
                    interval: interval
                }, { validateResult: false });
                histRaw = histResult || [];
            }

            try {
                quote = await yahooFinance.quote(symbol, {}, { validateResult: false });
            } catch (e) {
                console.error('[Market Forecast] Quote fetch failed:', e.message);
                const lastClose = histRaw.length ? (histRaw[histRaw.length - 1].close || histRaw[histRaw.length - 1].adjClose) : 0;
                quote = {
                    symbol,
                    shortName: symbol,
                    regularMarketPrice: lastClose
                };
            }

            const historical = (histRaw || [])
                .map(d => {
                    let dStr;
                    try {
                        const dateObj = d.date instanceof Date ? d.date : new Date(d.date || d.timestamp * 1000);
                        if (range === '1D' || range === '5D') {
                            dStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                        } else {
                            dStr = dateObj.toISOString().slice(0, 10);
                        }
                    } catch (e) {
                        dStr = String(d.date || '');
                    }
                    return {
                        date: dStr,
                        price: Math.round((d.close || d.adjClose || d.open || 0) * 100) / 100
                    };
                })
                .filter(d => d.price > 0 && d.date)
                .slice(-limitPoints);

            if (!historical.length) throw new Error('Empty historical data');

            const currentPrice = quote.regularMarketPrice || historical[historical.length - 1].price;
            const prediction = generateAIPrediction(historical.map(h => h.price), currentPrice);

            return res.json({
                symbol: quote.symbol || symbol,
                name: quote.shortName || quote.longName || symbol,
                currentPrice,
                pointChange: quote.regularMarketChange || 0,
                percentChange: quote.regularMarketChangePercent || 0,
                open: quote.regularMarketOpen || null,
                high: quote.regularMarketDayHigh || null,
                low: quote.regularMarketDayLow || null,
                previousClose: quote.regularMarketPreviousClose || null,
                fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || null,
                fiftyTwoWeekLow: quote.fiftyTwoWeekLow || null,
                timestamp: (function () {
                    const rmt = quote.regularMarketTime;
                    if (!rmt) return new Date().toISOString();
                    if (rmt instanceof Date) return rmt.toISOString();
                    if (typeof rmt === 'number') {
                        return new Date(rmt < 100000000000 ? rmt * 1000 : rmt).toISOString();
                    }
                    try { return new Date(rmt).toISOString(); } catch (e) { return new Date().toISOString(); }
                })(),
                historical,
                prediction,
                isFallback: false
            });
        } catch (err) {
            console.error('[Market Forecast] Yahoo Finance error for', symbol, '—', err.message);
            // Fall through to static fallback below
        }
    }

    // Static fallback (rate-limited or offline)
    return res.json(buildFallbackResponse(symbol, range));
});

module.exports = router;

