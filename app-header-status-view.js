(() => {
    const AppHeaderStatusView = ({
        priceStatus,
        pageText,
        lastPriceUpdate,
        formatDateTime,
        lastRateUpdate,
        isCloudSyncing,
        cloudStatus
    }) => (
        <div className="mb-8 text-xs theme-text-sub font-bold flex flex-wrap gap-x-4 gap-y-1">
            <span>{priceStatus || pageText.marketAutoUpdate}</span>
            <span>{lastPriceUpdate ? `${pageText.lastUpdated}：${formatDateTime(lastPriceUpdate)}` : pageText.noPriceYet}</span>
            <span>{lastRateUpdate ? `${pageText.rateUpdated}：${formatDateTime(lastRateUpdate)}` : pageText.fxDefault}</span>
            <span>{isCloudSyncing ? pageText.cloudSyncing : cloudStatus}</span>
        </div>
    );

    window.APP_HEADER_STATUS_VIEW = {
        AppHeaderStatusView
    };
})();
