(() => {
    const { CURRENCIES, DEFAULT_RATES, CRYPTO_ID_MAP } = window.APP_CONSTANTS || {};
    const { sanitizeCurrencyRates } = window.APP_UTILS || {};

    if (!CURRENCIES || !DEFAULT_RATES || !CRYPTO_ID_MAP || !sanitizeCurrencyRates) {
        throw new Error('constants.js or utils.js is missing or incomplete for market-api.js');
    }

    const normalizeYahooSymbol = (symbol) => {
        const clean = (symbol || '').trim().toUpperCase();
        if (/^\d{4,6}$/.test(clean)) return `${clean}.TW`;
        return clean;
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

    async function fetchLatestCurrencyRates() {
        const sources = [
            'https://open.er-api.com/v6/latest/HKD',
            `https://api.allorigins.win/raw?url=${encodeURIComponent('https://open.er-api.com/v6/latest/HKD')}`
        ];

        for (const source of sources) {
            try {
                const data = await fetchJSONWithTimeout(source);
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
            if (item.symbol && typeof item.regularMarketPrice === 'number') {
                map[item.symbol.toUpperCase()] = item.regularMarketPrice;
            }
        });
        return map;
    };

    const parseYahooChartResponse = (data) => {
        const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
        return typeof price === 'number' ? price : null;
    };

    async function fetchYahooChartPrice(symbol) {
        const upper = symbol.toUpperCase();
        if (!/^[A-Z0-9.\-]+$/.test(upper)) return null;
        const base = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(upper)}?interval=1d&range=1d`;
        const fallbackBase = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(upper)}?interval=1d&range=1d`;
        const sources = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(base)}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(fallbackBase)}`
        ];

        for (const source of sources) {
            try {
                const data = await fetchJSONWithTimeout(source);
                const price = parseYahooChartResponse(data);
                if (typeof price === 'number') return price;
            } catch (error) {}
        }

        return null;
    }

    async function fetchStooqQuotes(symbols) {
        const map = {};
        await Promise.all(symbols.map(async yahooSymbol => {
            const stooqSymbol = toStooqSymbol(yahooSymbol).toLowerCase();
            const stooqUrl = `https://stooq.com/q/l/?s=${encodeURIComponent(stooqSymbol)}&f=sd2t2ohlcv&h&e=csv`;
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(stooqUrl)}`;

            const tryParse = (csvText) => {
                const lines = (csvText || '').trim().split('\n');
                if (lines.length < 2) return null;
                const columns = lines[1].split(',');
                const close = Number(columns[6]);
                return Number.isFinite(close) && close > 0 ? close : null;
            };

            try {
                const directCsv = await fetchTextWithTimeout(stooqUrl);
                const directPrice = tryParse(directCsv);
                if (directPrice) {
                    map[yahooSymbol.toUpperCase()] = directPrice;
                    return;
                }
            } catch (error) {}

            try {
                const proxyCsv = await fetchTextWithTimeout(proxyUrl);
                const proxyPrice = tryParse(proxyCsv);
                if (proxyPrice) {
                    map[yahooSymbol.toUpperCase()] = proxyPrice;
                }
            } catch (error) {}
        }));
        return map;
    }

    async function fetchYahooQuotes(symbols) {
        if (!symbols.length) return {};
        const base = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(','))}`;
        const fallbackBase = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(','))}`;
        const sources = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(base)}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(fallbackBase)}`
        ];

        let results = {};
        for (const source of sources) {
            try {
                const data = await fetchJSONWithTimeout(source);
                const parsed = parseYahooQuoteResponse(data);
                if (Object.keys(parsed).length) {
                    results = { ...results, ...parsed };
                }
            } catch (error) {}
        }

        const missingSymbols = symbols.filter(symbol => !results[symbol.toUpperCase()]);
        if (missingSymbols.length) {
            const chartQuotes = await Promise.all(missingSymbols.map(async symbol => {
                const price = await fetchYahooChartPrice(symbol);
                return { symbol: symbol.toUpperCase(), price };
            }));
            chartQuotes.forEach(entry => {
                if (typeof entry.price === 'number') results[entry.symbol] = entry.price;
            });
        }

        const stillMissing = symbols.filter(symbol => !results[symbol.toUpperCase()]);
        if (stillMissing.length) {
            const stooqQuotes = await fetchStooqQuotes(stillMissing);
            results = { ...results, ...stooqQuotes };
        }

        return results;
    }

    async function fetchCryptoQuotes(cryptoSymbols) {
        const ids = [...new Set(cryptoSymbols.map(symbol => CRYPTO_ID_MAP[symbol]).filter(Boolean))];
        if (!ids.length) return {};
        const baseUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`;
        const sources = [
            baseUrl,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(baseUrl)}`
        ];

        let data = null;
        for (const source of sources) {
            try {
                data = await fetchJSONWithTimeout(source);
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
        toStooqSymbol,
        fetchTextWithTimeout,
        fetchJSONWithTimeout,
        fetchLatestCurrencyRates,
        parseYahooQuoteResponse,
        parseYahooChartResponse,
        fetchYahooChartPrice,
        fetchStooqQuotes,
        fetchYahooQuotes,
        fetchCryptoQuotes
    };
})();
