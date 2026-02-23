(() => {
    const AssetSummaryListView = ({
        groupedAssets,
        toHKD,
        fromHKD,
        displayCurrency,
        CATEGORIES,
        categoryMixHexByKey,
        translate,
        formatAmount
    }) => (
        <div className="space-y-6">
            {groupedAssets.map(({ categoryKey: catKey, accounts }) => {
                const categoryTotalHKD = accounts.reduce((sum, account) => {
                    const accountTotal = account.items.reduce((itemSum, item) => itemSum + toHKD(item.quantity * item.currentPrice, item.currency), 0);
                    return sum + accountTotal;
                }, 0);
                const categoryTotalDisplay = fromHKD(categoryTotalHKD, displayCurrency);
                const isLiabilityCategory = Boolean(CATEGORIES[catKey].isNegative);

                return (
                    <section key={catKey} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: categoryMixHexByKey[catKey] }}></div>
                                <h2 className="text-base font-black text-slate-800">{translate(CATEGORIES[catKey].label)}</h2>
                            </div>
                            <div className={`text-sm font-black ${isLiabilityCategory ? 'text-rose-500' : 'text-emerald-600'}`}>
                                {isLiabilityCategory ? '-' : ''}{formatAmount(Math.abs(categoryTotalDisplay))} {displayCurrency}
                            </div>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {accounts.map(({ accountName, items }) => {
                                const accountTotalHKD = items.reduce((sum, item) => sum + toHKD(item.quantity * item.currentPrice, item.currency), 0);
                                const accountTotalDisplay = fromHKD(accountTotalHKD, displayCurrency);
                                return (
                                    <div key={accountName} className="px-6 py-3 flex items-center justify-between">
                                        <div className="text-sm font-bold text-slate-700">{accountName}</div>
                                        <div className={`text-sm font-black ${isLiabilityCategory ? 'text-rose-500' : 'text-emerald-600'}`}>
                                            {isLiabilityCategory ? '-' : ''}{formatAmount(Math.abs(accountTotalDisplay))} {displayCurrency}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                );
            })}
        </div>
    );

    window.APP_ASSET_SUMMARY_LIST_VIEW = {
        AssetSummaryListView
    };
})();
