(() => {
    const { CURRENCIES, DEFAULT_RATES, CRYPTO_ID_MAP } = window.APP_CONSTANTS || {};
    const { sanitizeCurrencyRates } = window.APP_UTILS || {};

    if (!CURRENCIES || !DEFAULT_RATES || !CRYPTO_ID_MAP || !sanitizeCurrencyRates) {
        throw new Error('constants.js or utils.js is missing or incomplete for market-api.js');
    }

    const DIRECT_TIMEOUT_MS = 6000;
    const CORS_FRIENDLY_TIMEOUT_MS = 8000;
    const PUBLIC_PROXY_TIMEOUT_MS = 10000;

    const viaCorsDev = (url) => `https://proxy.cors.dev/${url}`;
    const viaAllOrigins = (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

    const buildYahooSparkUrl = (host, symbols) => (
        `https://${host}/v7/finance/spark?symbols=${encodeURIComponent(symbols.join(','))}&range=1d&interval=1d`
    );

    const buildYahooQuoteUrl = (host, symbols) => (
        `https://${host}/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(','))}`
    );

    const buildYahooChartUrl = (host, symbol) => (
        `https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`
    );

    // Unsuffixed numeric codes keep .TW as the first choice so 0050 / 2330 are not
    // retargeted when the same number is also a different Hong Kong listing.
    // HKD/MOP adds .HK as a later candidate, used only when .TW has no price (0700).
    // An explicit suffix such as 0700.HK or 2330.TW is never rewritten.
    const resolveYahooSymbolCandidates = (symbol, currency) => {
        const clean = (symbol || '').trim().toUpperCase();
        if (!clean) return [];
        if (/^\d{4,6}$/.test(clean)) {
            const code = (currency || '').trim().toUpperCase();
            const twSymbol = `${clean}.TW`;
            if (code === 'HKD' || code === 'MOP') return [twSymbol, `${clean}.HK`];
            return [twSymbol];
        }
        return [clean];
    };

    const normalizeYahooSymbol = (symbol, currency) => {
        const candidates = resolveYahooSymbolCandidates(symbol, currency);
        return candidates[0] || '';
    };

    const toStooqSymbol = (symbol) => {
        const upper = (symbol || '').trim().toUpperCase();
        if (/^\d{4,6}\.TW$/.test(upper)) return `${upper.replace('.TW', '')}.TW`;
        if (/^[A-Z]+$/.test(upper)) return `${upper}.US`;
        return upper;
    };

    async function fetchTextWithTimeout(url, timeoutMs = 12000) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.text();
        } finally {
            clearTimeout(timeout);
        }
    }

    async function fetchJSONWithTimeout(url, timeoutMs = 12000) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } finally {
            clearTimeout(timeout);
        }
    }

    const isDefinitiveYahooPayload = (data) => (
        Array.isArray(data?.spark?.result)
        || Array.isArray(data?.quoteResponse?.result)
        || Array.isArray(data?.chart?.result)
    );

    async function fetchLatestCurrencyRates() {
        const sources = [
            { url: 'https://open.er-api.com/v6/latest/HKD', timeoutMs: DIRECT_TIMEOUT_MS },
            { url: viaAllOrigins('https://open.er-api.com/v6/latest/HKD'), timeoutMs: PUBLIC_PROXY_TIMEOUT_MS }
        ];

        for (const source of sources) {
            try {
                const data = await fetchJSONWithTimeout(source.url, source.timeoutMs);
                const rawRates = data?.rates;
                if (!rawRates || typeof rawRates !== 'object') continue;

                const mapped = {};
                CURRENCIES.forEach(currency => {
                    if (currency === 'HKD') {
                        mapped.HKD = 1;
                        return;
                    }
                    const value = Number(rawRates[currency]);
                    if (Number.isFinite(value) && value > 0) mapped[currency] = value;
                });

                const merged = sanitizeCurrencyRates(mapped);
                const hasEnough = CURRENCIES.every(currency => Number.isFinite(merged[currency]) && merged[currency] > 0);
                if (hasEnough) return merged;
            } catch (error) {}
        }

        throw new Error('fx source unavailable');
    }

    const parseYahooQuoteResponse = (data) => {
        const map = {};
        (data?.quoteResponse?.result || []).forEach(item => {
            if (item.symbol && typeof item.regularMarketPrice === 'number' && item.regularMarketPrice > 0) {
                map[item.symbol.toUpperCase()] = item.regularMarketPrice;
            }
        });
        return map;
    };

    const parseYahooSparkResponse = (data) => {
        const map = {};
        (data?.spark?.result || []).forEach(item => {
            const meta = item?.response?.[0]?.meta;
            const symbol = (meta?.symbol || item?.symbol || '').toUpperCase();
            const price = meta?.regularMarketPrice;
            if (symbol && typeof price === 'number' && price > 0) map[symbol] = price;
        });
        return map;
    };

    const parseYahooChartResponse = (data) => {
        const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
        return typeof price === 'number' && price > 0 ? price : null;
    };

    const quotePrice = (map, symbol) => {
        const price = map?.[String(symbol || '').toUpperCase()];
        return typeof price === 'number' && price > 0 ? price : null;
    };

    async function fetchYahooQuoteBatch(symbols) {
        if (!symbols.length) return {};
        const spark1 = buildYahooSparkUrl('query1.finance.yahoo.com', symbols);
        const spark2 = buildYahooSparkUrl('query2.finance.yahoo.com', symbols);
        const quote1 = buildYahooQuoteUrl('query1.finance.yahoo.com', symbols);
        const quote2 = buildYahooQuoteUrl('query2.finance.yahoo.com', symbols);
        const sources = [
            { url: spark1, timeoutMs: DIRECT_TIMEOUT_MS, parse: parseYahooSparkResponse, direct: true },
            { url: spark2, timeoutMs: DIRECT_TIMEOUT_MS, parse: parseYahooSparkResponse, direct: true },
            { url: quote1, timeoutMs: DIRECT_TIMEOUT_MS, parse: parseYahooQuoteResponse, direct: true },
            { url: quote2, timeoutMs: DIRECT_TIMEOUT_MS, parse: parseYahooQuoteResponse, direct: true },
            { url: viaCorsDev(spark1), timeoutMs: CORS_FRIENDLY_TIMEOUT_MS, parse: parseYahooSparkResponse },
            { url: viaAllOrigins(spark1), timeoutMs: PUBLIC_PROXY_TIMEOUT_MS, parse: parseYahooSparkResponse },
            { url: viaAllOrigins(quote1), timeoutMs: PUBLIC_PROXY_TIMEOUT_MS, parse: parseYahooQuoteResponse },
            { url: viaAllOrigins(quote2), timeoutMs: PUBLIC_PROXY_TIMEOUT_MS, parse: parseYahooQuoteResponse }
        ];

        let results = {};
        let directBlocked = false;
        for (const source of sources) {
            if (symbols.every(symbol => quotePrice(results, symbol))) return results;
            if (directBlocked && source.direct) continue;
            try {
                const data = await fetchJSONWithTimeout(source.url, source.timeoutMs);
                const parsed = source.parse(data) || {};
                if (Object.keys(parsed).length) results = { ...results, ...parsed };
                if (symbols.every(symbol => quotePrice(results, symbol))) return results;
                if (isDefinitiveYahooPayload(data)) return results;
            } catch (error) {
                if (source.direct) directBlocked = true;
            }
        }
        return results;
    }

    async function fetchYahooChartPrice(symbol) {
        const upper = String(symbol || '').toUpperCase();
        if (!/^[A-Z0-9.\-]+$/.test(upper)) return null;
        const chart1 = buildYahooChartUrl('query1.finance.yahoo.com', upper);
        const chart2 = buildYahooChartUrl('query2.finance.yahoo.com', upper);
        const sources = [
            { url: chart1, timeoutMs: DIRECT_TIMEOUT_MS, direct: true },
            { url: chart2, timeoutMs: DIRECT_TIMEOUT_MS, direct: true },
            { url: viaCorsDev(chart1), timeoutMs: CORS_FRIENDLY_TIMEOUT_MS },
            { url: viaAllOrigins(chart1), timeoutMs: PUBLIC_PROXY_TIMEOUT_MS },
            { url: viaAllOrigins(chart2), timeoutMs: PUBLIC_PROXY_TIMEOUT_MS }
        ];

        let directBlocked = false;
        for (const source of sources) {
            if (directBlocked && source.direct) continue;
            try {
                const data = await fetchJSONWithTimeout(source.url, source.timeoutMs);
                const price = parseYahooChartResponse(data);
                if (typeof price === 'number') return price;
                if (isDefinitiveYahooPayload(data)) return null;
            } catch (error) {
                if (source.direct) directBlocked = true;
            }
        }

        return null;
    }

    async function fetchStooqQuotes(symbols) {
        const map = {};
        await Promise.all(symbols.map(async yahooSymbol => {
            const stooqSymbol = toStooqSymbol(yahooSymbol).toLowerCase();
            const stooqUrl = `https://stooq.com/q/l/?s=${encodeURIComponent(stooqSymbol)}&f=sd2t2ohlcv&h&e=csv`;
            const proxyUrl = viaAllOrigins(stooqUrl);

            const tryParse = (csvText) => {
                const lines = (csvText || '').trim().split('\n');
                if (lines.length < 2) return null;
                const columns = lines[1].split(',');
                const close = Number(columns[6]);
                return Number.isFinite(close) && close > 0 ? close : null;
            };

            try {
                const directCsv = await fetchTextWithTimeout(stooqUrl, CORS_FRIENDLY_TIMEOUT_MS);
                const directPrice = tryParse(directCsv);
                if (directPrice) {
                    map[yahooSymbol.toUpperCase()] = directPrice;
                    return;
                }
            } catch (error) {}

            try {
                const proxyCsv = await fetchTextWithTimeout(proxyUrl, PUBLIC_PROXY_TIMEOUT_MS);
                const proxyPrice = tryParse(proxyCsv);
                if (proxyPrice) {
                    map[yahooSymbol.toUpperCase()] = proxyPrice;
                }
            } catch (error) {}
        }));
        return map;
    }

    async function fetchYahooQuoteFallback(symbols) {
        const missing = [...new Set((symbols || []).map(symbol => String(symbol || '').toUpperCase()).filter(Boolean))];
        if (!missing.length) return {};
        const results = {};
        const chartQuotes = await Promise.all(missing.map(async symbol => {
            const price = await fetchYahooChartPrice(symbol);
            return { symbol, price };
        }));
        chartQuotes.forEach(entry => {
            if (typeof entry.price === 'number') results[entry.symbol] = entry.price;
        });

        const stillMissing = missing.filter(symbol => typeof results[symbol] !== 'number');
        if (stillMissing.length) {
            const stooqQuotes = await fetchStooqQuotes(stillMissing);
            Object.keys(stooqQuotes).forEach(symbol => {
                results[symbol] = stooqQuotes[symbol];
            });
        }
        return results;
    }

    async function fetchYahooQuotes(symbols) {
        if (!symbols.length) return {};
        const batch = await fetchYahooQuoteBatch(symbols);
        const missing = symbols.filter(symbol => !quotePrice(batch, symbol));
        if (!missing.length) return batch;
        const fallback = await fetchYahooQuoteFallback(missing);
        return { ...batch, ...fallback };
    }

    async function fetchCryptoQuotes(cryptoSymbols) {
        const ids = [...new Set(cryptoSymbols.map(symbol => CRYPTO_ID_MAP[symbol]).filter(Boolean))];
        if (!ids.length) return {};
        const baseUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`;
        const sources = [
            { url: baseUrl, timeoutMs: DIRECT_TIMEOUT_MS },
            { url: viaAllOrigins(baseUrl), timeoutMs: PUBLIC_PROXY_TIMEOUT_MS }
        ];

        let data = null;
        for (const source of sources) {
            try {
                data = await fetchJSONWithTimeout(source.url, source.timeoutMs);
                if (data && typeof data === 'object') break;
            } catch (error) {}
        }

        if (!data) return {};

        try {
            const bySymbol = {};
            Object.entries(CRYPTO_ID_MAP).forEach(([symbol, id]) => {
                if (data[id]?.usd) bySymbol[symbol] = data[id].usd;
            });
            return bySymbol;
        } catch (error) {
            return {};
        }
    }

    window.APP_MARKET_API = {
        normalizeYahooSymbol,
        resolveYahooSymbolCandidates,
        toStooqSymbol,
        fetchTextWithTimeout,
        fetchJSONWithTimeout,
        fetchLatestCurrencyRates,
        parseYahooQuoteResponse,
        parseYahooSparkResponse,
        parseYahooChartResponse,
        fetchYahooQuoteBatch,
        fetchYahooChartPrice,
        fetchStooqQuotes,
        fetchYahooQuoteFallback,
        fetchYahooQuotes,
        fetchCryptoQuotes
    };
})();
