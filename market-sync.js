(() => {
    const buildMarketTargets = ({ assets, normalizeYahooSymbol, resolveYahooSymbolCandidates }) => {
        const stockTargets = assets.filter(item => item.category === 'INVEST' && ['股票', '基金'].includes(item.subtype) && item.symbol);
        const cryptoTargets = assets.filter(item => item.category === 'INVEST' && item.subtype === '加密貨幣' && item.symbol);
        const resolve = typeof resolveYahooSymbolCandidates === 'function'
            ? resolveYahooSymbolCandidates
            : (symbol, currency) => [normalizeYahooSymbol(symbol, currency)].filter(Boolean);

        const stockSymbolCandidates = {};
        stockTargets.forEach(item => {
            const candidates = resolve(item.symbol, item.currency).filter(Boolean);
            stockSymbolCandidates[item.id] = candidates.length
                ? candidates
                : [normalizeYahooSymbol(item.symbol, item.currency)].filter(Boolean);
        });

        const stockSymbolMap = {};
        stockTargets.forEach(item => {
            stockSymbolMap[item.id] = stockSymbolCandidates[item.id][0] || '';
        });

        const isValidYahooSymbol = (symbol) => /^[A-Z0-9.\-]+$/.test(symbol || '');
        const stockSymbols = [...new Set(Object.values(stockSymbolCandidates).flat())].filter(isValidYahooSymbol);
        const cryptoSymbols = [...new Set(cryptoTargets.map(item => item.symbol.trim().toUpperCase()))];

        return {
            stockTargets,
            cryptoTargets,
            stockSymbolMap,
            stockSymbolCandidates,
            stockSymbols,
            cryptoSymbols
        };
    };

    const selectQuotedSymbolMap = ({ stockSymbolCandidates, stockQuotes }) => {
        const map = {};
        Object.entries(stockSymbolCandidates || {}).forEach(([id, candidates]) => {
            const list = Array.isArray(candidates) ? candidates : [];
            const matched = list.find(symbol => {
                const price = stockQuotes?.[String(symbol || '').toUpperCase()];
                return typeof price === 'number' && price > 0;
            });
            map[id] = matched || list[0] || '';
        });
        return map;
    };

    const applyQuotePricesToAssets = ({
        assets,
        stockSymbolMap,
        stockQuotes,
        cryptoQuotesUSD,
        currencyRates,
        defaultUsdRate
    }) => {
        let updatedCount = 0;
        const nextAssets = assets.map(item => {
            let nextPrice = null;

            if (item.category === 'INVEST' && ['股票', '基金'].includes(item.subtype) && item.symbol) {
                const normalized = stockSymbolMap[item.id];
                const quotePrice = stockQuotes[normalized?.toUpperCase()];
                if (typeof quotePrice === 'number' && quotePrice > 0) nextPrice = quotePrice;
            }

            if (item.category === 'INVEST' && item.subtype === '加密貨幣' && item.symbol) {
                const symbol = item.symbol.trim().toUpperCase();
                const usdPrice = cryptoQuotesUSD[symbol];
                if (typeof usdPrice === 'number' && usdPrice > 0) {
                    nextPrice = usdPrice * ((currencyRates[item.currency] || 1) / (currencyRates.USD || defaultUsdRate));
                }
            }

            if (typeof nextPrice === 'number' && Math.abs(nextPrice - item.currentPrice) > 0.000001) {
                updatedCount += 1;
                return { ...item, currentPrice: Number(nextPrice.toFixed(6)) };
            }

            return item;
        });

        return {
            nextAssets,
            updatedCount
        };
    };

    window.APP_MARKET_SYNC = {
        buildMarketTargets,
        selectQuotedSymbolMap,
        applyQuotePricesToAssets
    };
})();
