(() => {
    const OverviewSectionView = ({
        pageText,
        displayCurrency,
        netWorthCardStyle,
        totalAssetsCardStyle,
        totalLiabilitiesCardStyle,
        totals,
        formatAmount,
        netWorthTier,
        overviewPanelCardStyle,
        assetMix,
        selectedMixCategory,
        setSelectedMixCategory,
        selectedMixItemStyle,
        detailMix,
        detailDonutCenterCardStyle,
        isPrivacyMode,
        togglePrivacyMode,
        tByLang
    }) => (
        <section className="theme-surface p-4 sm:p-6 rounded-2xl shadow-sm mb-8">
            <div className="theme-text-main font-black mb-4">{pageText.overviewTitle}</div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                    <div className="theme-networth-card p-5 rounded-2xl text-white shadow-lg" style={netWorthCardStyle}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="theme-networth-caption text-[10px] font-black uppercase tracking-widest">{pageText.netWorth} ({displayCurrency})</div>
                            <button
                                type="button"
                                onClick={togglePrivacyMode}
                                className="inline-flex items-center justify-center rounded-md border border-white/40 bg-white/10 px-2 py-1 text-[10px] font-black hover:bg-white/20"
                                title={isPrivacyMode
                                    ? tByLang('目前為隱藏金額，點擊顯示', 'Amounts are hidden, click to show', '金額は非表示です。クリックして表示')
                                    : tByLang('目前為顯示金額，點擊隱藏', 'Amounts are visible, click to hide', '金額は表示中です。クリックして非表示')}
                            >
                                <span className="leading-none text-xs" aria-hidden="true">{isPrivacyMode ? '🛡️' : '🗡️'}</span>
                            </button>
                        </div>
                        <div className="text-3xl font-black tracking-tighter">{formatAmount(totals.netWorth)}</div>
                        <div className="text-xs font-black theme-networth-caption mt-2">{netWorthTier.emoji} {netWorthTier.label}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                        <div className="theme-summary-card p-4 rounded-xl" style={totalAssetsCardStyle}>
                            <div className="theme-text-sub text-[10px] font-black uppercase tracking-widest mb-1">{pageText.totalAssets}</div>
                            <div className="text-xl font-black theme-text-main">{formatAmount(totals.assets)}</div>
                        </div>
                        <div className="theme-summary-card p-4 rounded-xl">
                            <div className="theme-text-sub text-[10px] font-black uppercase tracking-widest mb-1">{tByLang('積存餘額', 'Accumulated Balance', '積立残高')}</div>
                            <div className="text-xl font-black theme-text-main">{formatAmount(totals.accumulationBalance || 0)}</div>
                        </div>
                        <div className="theme-summary-card p-4 rounded-xl" style={totalLiabilitiesCardStyle}>
                            <div className="theme-text-sub text-[10px] font-black uppercase tracking-widest mb-1">{pageText.totalLiabilities}</div>
                            <div className="text-xl font-black theme-negative">{formatAmount(totals.liabilities)}</div>
                            <div className="text-[10px] font-black theme-text-sub mt-1">{pageText.debtRatio} {totals.debtRatio.toFixed(1)}%</div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 grid grid-cols-1 xl:grid-cols-2 gap-6 items-center">
                    <details className="rounded-xl p-3 theme-summary-card" style={overviewPanelCardStyle} open>
                        <summary className="sm:hidden text-xs font-black theme-text-sub cursor-pointer list-none">{pageText.categoryMix}</summary>
                        <div className="space-y-3 mt-3 sm:mt-0">
                            {assetMix.rows.map(item => (
                                <button
                                    type="button"
                                    key={item.categoryKey}
                                    onClick={() => setSelectedMixCategory(item.categoryKey)}
                                    className="w-full text-left rounded-xl p-2 transition-all theme-mix-item"
                                    style={selectedMixCategory === item.categoryKey ? selectedMixItemStyle : undefined}
                                >
                                    <div className="flex justify-between items-center text-xs font-black theme-text-sub">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.hex }}></span>
                                            <span>{item.label}</span>
                                        </span>
                                        <span>{item.ratio.toFixed(1)}% · {formatAmount(item.amount)} {displayCurrency}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </details>
                    <div className="space-y-4">
                        <div className="flex items-center justify-center">
                            <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-full relative" style={{ background: detailMix.gradient }}>
                                <div className="absolute inset-8 rounded-full flex items-center justify-center theme-summary-card" style={detailDonutCenterCardStyle}>
                                    <div className="text-center">
                                        <div className="text-[10px] theme-text-sub font-black uppercase tracking-widest">{detailMix.categoryLabel}</div>
                                        <div className="text-sm font-black theme-text-main">{pageText.detailMix}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <details className="rounded-xl p-3 theme-summary-card" style={overviewPanelCardStyle} open>
                            <summary className="sm:hidden text-xs font-black theme-text-sub cursor-pointer list-none">{pageText.detailMix}</summary>
                            <div className="space-y-2 mt-3 sm:mt-0">
                                {detailMix.rows.length ? detailMix.rows.map(row => (
                                    <div key={row.label} className="flex items-center justify-between text-xs font-black theme-text-sub">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: row.color }}></span>
                                            <span>{row.label}</span>
                                        </div>
                                        <span>{row.ratio.toFixed(1)}% · {formatAmount(row.amount)} {displayCurrency}</span>
                                    </div>
                                )) : (
                                    <p className="text-sm theme-text-sub font-bold text-center">{pageText.noDetailItems}</p>
                                )}
                            </div>
                        </details>
                    </div>
                </div>
            </div>
        </section>
    );

    window.APP_OVERVIEW_SECTION_VIEW = {
        OverviewSectionView
    };
})();
