(() => {
    const FinanceSectionView = ({
        financeSectionTab,
        setFinanceSectionTab,
        pageText,
        selectedStatsCategory,
        setSelectedStatsCategory,
        setSelectedStatsAccount,
        setSelectedStatsSegmentKey,
        CATEGORY_KEYS,
        translate,
        CATEGORIES,
        statsBreakdownMode,
        setStatsBreakdownMode,
        accountStats,
        tByLang,
        accountChartCenterStyle,
        describeArc,
        selectedMixItemStyle,
        overviewPanelCardStyle,
        formatAmount,
        displayCurrency,
        MonthPicker,
        selectedCashflowMonth,
        setSelectedCashflowMonth,
        toMonthKey,
        pageLanguage,
        moveCashflowMonth,
        CashflowOverviewView,
        cashflowMonthData,
        cashflowYearData,
        cashflowView,
        setCashflowView,
        WEEKDAY_LABELS,
        CashflowRulesView,
        cashflowEntries,
        filteredCashflowEntries,
        cashflowRuleKeyword,
        setCashflowRuleKeyword,
        cashflowRuleFilter,
        setCashflowRuleFilter,
        cashflowRuleSortMode,
        setCashflowRuleSortMode,
        editingCashflowId,
        cancelCashflowEdit,
        setCashflowRulesVisibleCount,
        cashflowRulesVisibleCount,
        CASHFLOW_TYPES,
        CASHFLOW_FREQUENCIES,
        liquidAssetLabelById,
        cashflowTriggerInfoById,
        fromHKD,
        toHKD,
        startNewAssetEntry,
        startNewCashflowEntry,
        startEditCashflowEntry,
        handleDeleteCashflowEntry
    }) => (
        <>
            <div className="mb-4 flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setFinanceSectionTab('ASSET_ACCOUNT')}
                    className={`px-4 py-2 rounded-lg text-sm font-black ${financeSectionTab === 'ASSET_ACCOUNT' ? 'theme-tab-active' : 'theme-tab-inactive'}`}
                >
                    {pageText.tabAssetAccount}
                </button>
                <button
                    type="button"
                    onClick={() => setFinanceSectionTab('CASHFLOW')}
                    className={`px-4 py-2 rounded-lg text-sm font-black ${financeSectionTab === 'CASHFLOW' ? 'theme-tab-active' : 'theme-tab-inactive'}`}
                >
                    {pageText.tabCashflow}
                </button>
            </div>

            {financeSectionTab === 'ASSET_ACCOUNT' && (
                <section className="theme-surface p-4 sm:p-6 rounded-2xl shadow-sm mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className="theme-text-main font-black">{pageText.tabAssetAccount}</div>
                        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
                            <select
                                value={selectedStatsCategory}
                                onChange={e => {
                                    setSelectedStatsCategory(e.target.value);
                                    setSelectedStatsAccount('');
                                    setSelectedStatsSegmentKey('');
                                }}
                                className="theme-input rounded-lg px-3 py-2 font-bold text-sm shadow-sm outline-none w-full sm:w-auto"
                            >
                                {CATEGORY_KEYS.map(categoryKey => <option key={categoryKey} value={categoryKey}>{translate(CATEGORIES[categoryKey].label)}</option>)}
                            </select>
                            <select
                                value={statsBreakdownMode}
                                onChange={e => {
                                    setStatsBreakdownMode(e.target.value);
                                    setSelectedStatsSegmentKey('');
                                }}
                                className="theme-input rounded-lg px-3 py-2 font-bold text-sm shadow-sm outline-none w-full sm:w-auto"
                            >
                                <option value="ACCOUNT">{tByLang('按帳戶佔比', 'By Account Share', '口座別比率')}</option>
                                <option value="ITEM">{tByLang('按帳戶內細項', 'By Account Item Share', '口座内項目別比率')}</option>
                            </select>
                            {statsBreakdownMode === 'ITEM' && (
                                <select
                                    value={accountStats.currentAccount}
                                    onChange={e => {
                                        setSelectedStatsAccount(e.target.value);
                                        setSelectedStatsSegmentKey('');
                                    }}
                                    className="theme-input rounded-lg px-3 py-2 font-bold text-sm shadow-sm outline-none w-full sm:w-auto"
                                >
                                    {accountStats.accountNames.length ? (
                                        accountStats.accountNames.map(account => <option key={account} value={account}>{account}</option>)
                                    ) : (
                                        <option value="">{tByLang('尚無帳戶', 'No accounts yet', '口座がありません')}</option>
                                    )}
                                </select>
                            )}
                            <button
                                type="button"
                                onClick={startNewAssetEntry}
                                className="inline-flex items-center justify-center px-3 py-2.5 rounded-lg text-xs font-black theme-tab-active w-full sm:w-auto whitespace-nowrap"
                            >
                                {tByLang('新增資產', 'Add Asset', '資産を追加')}
                            </button>
                        </div>
                    </div>

                    {!accountStats.accountNames.length ? (
                        <p className="text-sm theme-text-sub font-bold">{tByLang('目前此類別沒有可統計資料', 'No data for this category yet', 'このカテゴリに集計データがありません')}</p>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                            <div className="flex justify-center">
                                <svg viewBox="0 0 260 260" className="w-48 h-48 sm:w-56 sm:h-56">
                                    {accountStats.segments.length === 1 ? (
                                        <circle
                                            cx="130"
                                            cy="130"
                                            r="110"
                                            fill={accountStats.segments[0].color}
                                            stroke={accountChartCenterStyle.ringStroke}
                                            strokeWidth="2"
                                            className="cursor-pointer"
                                            onClick={() => setSelectedStatsSegmentKey(accountStats.segments[0].key)}
                                        />
                                    ) : (
                                        accountStats.segments.map(segment => (
                                            <path
                                                key={segment.key}
                                                d={describeArc(130, 130, 110, segment.startAngle, segment.endAngle)}
                                                fill={segment.color}
                                                stroke={accountChartCenterStyle.ringStroke}
                                                strokeWidth="2"
                                                className="cursor-pointer"
                                                opacity={accountStats.selectedItem?.key === segment.key ? 1 : 0.8}
                                                onClick={() => setSelectedStatsSegmentKey(segment.key)}
                                            />
                                        ))
                                    )}
                                    <circle cx="130" cy="130" r="62" fill={accountChartCenterStyle.holeFill} />
                                    <text x="130" y="116" textAnchor="middle" style={{ fontSize: '10px', fontWeight: 800, fill: accountChartCenterStyle.labelFill }}>
                                        {accountStats.selectedItem ? accountStats.selectedItem.label : (statsBreakdownMode === 'ACCOUNT' ? translate(CATEGORIES[selectedStatsCategory].label) : accountStats.currentAccount)}
                                    </text>
                                    <text x="130" y="136" textAnchor="middle" style={{ fontSize: '13px', fontWeight: 900, fill: accountChartCenterStyle.valueFill }}>
                                        {accountStats.selectedItem ? `${formatAmount(accountStats.selectedItem.valueDisplay)} ${displayCurrency}` : `${formatAmount(accountStats.total)} ${displayCurrency}`}
                                    </text>
                                    <text x="130" y="154" textAnchor="middle" style={{ fontSize: '10px', fontWeight: 800, fill: accountChartCenterStyle.hintFill }}>
                                        {accountStats.selectedItem ? `${accountStats.selectedItem.ratio.toFixed(1)}%` : tByLang('點擊區塊查看佔比', 'Click a segment to view ratio', 'セグメントをクリックして比率を表示')}
                                    </text>
                                </svg>
                            </div>

                            <div className="lg:col-span-2 space-y-3">
                                <div className="space-y-2">
                                    {accountStats.segments.map(segment => (
                                        <button
                                            key={segment.key}
                                            type="button"
                                            onClick={() => setSelectedStatsSegmentKey(segment.key)}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${accountStats.selectedItem?.key === segment.key ? 'theme-mix-item' : 'theme-surface theme-mix-item'}`}
                                            style={accountStats.selectedItem?.key === segment.key ? selectedMixItemStyle : undefined}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: segment.color }}></span>
                                                <span className="text-sm font-bold theme-text-main truncate">{segment.label}</span>
                                                <span className="text-[10px] theme-text-sub font-black">{segment.symbol ? `(${segment.symbol})` : ''}</span>
                                            </div>
                                            <div className="text-xs font-black theme-text-sub whitespace-nowrap text-right">
                                                <div>{formatAmount(segment.valueDisplay)} {displayCurrency}</div>
                                                <div>{segment.ratio.toFixed(1)}%</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {accountStats.selectedItem && (
                                    <details className="rounded-xl p-4 theme-summary-card" style={overviewPanelCardStyle} open>
                                        <summary className="md:hidden text-xs theme-text-sub font-black cursor-pointer list-none">{tByLang('已選擇項目細節', 'Selected Item Details', '選択中の項目詳細')}</summary>
                                        <div className="mt-3 md:mt-0">
                                            <div className="text-xs theme-text-sub font-black mb-2">{tByLang('已選擇項目', 'Selected Item', '選択中の項目')}</div>
                                            <div className="text-base font-black theme-text-main mb-1">{accountStats.selectedItem.label}</div>
                                            <div className="text-xs theme-text-sub font-bold mb-2">
                                                {statsBreakdownMode === 'ACCOUNT'
                                                    ? tByLang(
                                                        `帳戶資產項目：${accountStats.selectedItem.members?.length || 0} 筆`,
                                                        `Account Asset Items: ${accountStats.selectedItem.members?.length || 0}`,
                                                        `口座資産項目：${accountStats.selectedItem.members?.length || 0}件`
                                                    )
                                                    : (accountStats.selectedItem.subtype || translate(CATEGORIES[selectedStatsCategory].label))}
                                                {accountStats.selectedItem.symbol ? ` · ${accountStats.selectedItem.symbol}` : ''}
                                            </div>
                                            <div className="text-sm font-bold theme-text-main">{tByLang('名稱：', 'Name:', '名称：')}{accountStats.selectedItem.label}</div>
                                            <div className="text-sm font-bold theme-text-main">{tByLang('金額：', 'Amount:', '金額：')}{formatAmount(accountStats.selectedItem.valueDisplay)} {displayCurrency}</div>
                                            <div className="text-sm font-bold theme-text-main">{tByLang('百分比：', 'Ratio:', '比率：')}{accountStats.selectedItem.ratio.toFixed(2)}%</div>
                                        </div>
                                    </details>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            )}

            {financeSectionTab === 'CASHFLOW' && (
                <section className="theme-surface p-4 sm:p-6 rounded-2xl shadow-sm mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                        <div>
                            <div className="text-slate-800 font-black">{pageText.tabCashflow}</div>
                            <p className="text-xs text-slate-400 font-bold mt-1">{pageText.cashflowDesc}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => moveCashflowMonth(-1)}
                                className="px-3 py-2 rounded-lg text-xs font-black theme-tab-inactive"
                            >
                                {pageText.prevMonth}
                            </button>
                            <MonthPicker
                                value={selectedCashflowMonth}
                                onChange={e => setSelectedCashflowMonth(e.target.value || toMonthKey(new Date()))}
                                className="px-3 py-2 rounded-lg text-xs font-black theme-input outline-none"
                                pageLanguage={pageLanguage}
                            />
                            <button
                                type="button"
                                onClick={() => moveCashflowMonth(1)}
                                className="px-3 py-2 rounded-lg text-xs font-black theme-tab-inactive"
                            >
                                {pageText.nextMonth}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-5">
                        <CashflowOverviewView
                            cashflowMonthData={cashflowMonthData}
                            cashflowYearData={cashflowYearData}
                            displayCurrency={displayCurrency}
                            formatAmount={formatAmount}
                            cashflowView={cashflowView}
                            setCashflowView={setCashflowView}
                            WEEKDAY_LABELS={WEEKDAY_LABELS}
                            pageLanguage={pageLanguage}
                        />

                        <CashflowRulesView
                            cashflowEntries={cashflowEntries}
                            filteredCashflowEntries={filteredCashflowEntries}
                            cashflowRuleKeyword={cashflowRuleKeyword}
                            setCashflowRuleKeyword={setCashflowRuleKeyword}
                            cashflowRuleFilter={cashflowRuleFilter}
                            setCashflowRuleFilter={setCashflowRuleFilter}
                            cashflowRuleSortMode={cashflowRuleSortMode}
                            setCashflowRuleSortMode={setCashflowRuleSortMode}
                            editingCashflowId={editingCashflowId}
                            cancelCashflowEdit={cancelCashflowEdit}
                            setCashflowRulesVisibleCount={setCashflowRulesVisibleCount}
                            cashflowRulesVisibleCount={cashflowRulesVisibleCount}
                            CASHFLOW_TYPES={CASHFLOW_TYPES}
                            CASHFLOW_FREQUENCIES={CASHFLOW_FREQUENCIES}
                            liquidAssetLabelById={liquidAssetLabelById}
                            cashflowTriggerInfoById={cashflowTriggerInfoById}
                            formatAmount={formatAmount}
                            fromHKD={fromHKD}
                            toHKD={toHKD}
                            displayCurrency={displayCurrency}
                            pageLanguage={pageLanguage}
                            startNewCashflowEntry={startNewCashflowEntry}
                            startEditCashflowEntry={startEditCashflowEntry}
                            handleDeleteCashflowEntry={handleDeleteCashflowEntry}
                        />
                    </div>
                </section>
            )}
        </>
    );

    window.APP_FINANCE_SECTION_VIEW = {
        FinanceSectionView
    };
})();
