(() => {
    async function refreshCurrencyRatesWithStamp({ fetchLatestCurrencyRates }) {
        const nextRates = await fetchLatestCurrencyRates();
        const stamp = new Date();
        return {
            nextRates,
            stamp
        };
    }

    window.APP_FX_SYNC = {
        refreshCurrencyRatesWithStamp
    };
})();
