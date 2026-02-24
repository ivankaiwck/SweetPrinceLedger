(() => {
    const CashflowRulesView = ({
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
        formatAmount,
        fromHKD,
        toHKD,
        displayCurrency,
        startEditCashflowEntry,
        handleDeleteCashflowEntry,
        pageLanguage
    }) => {
        const tByLang = (zh, en, ja) => (pageLanguage === 'en-US' ? en : (pageLanguage === 'ja-JP' ? ja : zh));
        return (
        <div className="order-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="text-xs text-slate-400 font-black uppercase tracking-widest">{tByLang('現金流規則清單', 'Cashflow Rules', 'キャッシュフロールール')}</div>
                <div className="text-[10px] text-slate-400 font-black">{tByLang(`共 ${cashflowEntries.length} 筆 · 符合條件 ${filteredCashflowEntries.length} 筆`, `${cashflowEntries.length} total · ${filteredCashflowEntries.length} matched`, `合計 ${cashflowEntries.length} 件 · 条件一致 ${filteredCashflowEntries.length} 件`)}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
                <input
                    type="text"
                    placeholder={tByLang('搜尋名稱 / 分類 / 帳戶 / 備註', 'Search by title / category / account / note', '名称 / 分類 / 口座 / メモを検索')}
                    className="w-full p-2.5 theme-input rounded-lg text-xs font-bold outline-none"
                    value={cashflowRuleKeyword}
                    onChange={e => setCashflowRuleKeyword(e.target.value)}
                />
                <select
                    value={cashflowRuleFilter}
                    onChange={e => setCashflowRuleFilter(e.target.value)}
                    className="w-full p-2.5 theme-input rounded-lg text-xs font-bold outline-none"
                >
                    <option value="ALL">{tByLang('全部規則', 'All Rules', 'すべてのルール')}</option>
                    <option value="AUTO">{tByLang('僅固定（自動）', 'Recurring Only (Auto)', '定期のみ（自動）')}</option>
                    <option value="ONE_TIME">{tByLang('僅單次', 'One-time Only', '単発のみ')}</option>
                    <option value="INCOME">{tByLang('僅收入', 'Income Only', '収入のみ')}</option>
                    <option value="EXPENSE">{tByLang('僅支出', 'Expense Only', '支出のみ')}</option>
                </select>
                <select
                    value={cashflowRuleSortMode}
                    onChange={e => setCashflowRuleSortMode(e.target.value)}
                    className="w-full p-2.5 theme-input rounded-lg text-xs font-bold outline-none"
                >
                    <option value="START_DESC">{tByLang('按建立/開始日（新到舊）', 'By Created/Start Date (Newest first)', '作成/開始日順（新しい順）')}</option>
                    <option value="NEXT_TRIGGER_ASC">{tByLang('按下次觸發日（近期優先）', 'By Next Trigger Date (Soonest first)', '次回実行日順（近日優先）')}</option>
                </select>
                <div className="flex items-center gap-2">
                    {editingCashflowId ? (
                        <button
                            type="button"
                            onClick={cancelCashflowEdit}
                            className="w-full px-3 py-2.5 rounded-lg theme-tab-inactive text-xs font-black"
                        >
                            {tByLang('取消編輯', 'Cancel Edit', '編集をキャンセル')}
                        </button>
                    ) : (
                        <div className="w-full" />
                    )}
                </div>
            </div>

            {!filteredCashflowEntries.length ? (
                <p className="text-sm text-slate-400 font-bold">{tByLang('尚未新增現金流規則', 'No cashflow rules yet', 'キャッシュフロールールはまだありません')}</p>
            ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                    {filteredCashflowEntries.slice(0, cashflowRulesVisibleCount).map(item => (
                        <div key={item.id} className={`rounded-xl p-3 ${editingCashflowId === item.id ? 'theme-soft-surface' : 'theme-surface'}`}>
                            {(() => {
                                const isInsuranceAutoDebit = item.linkedSource === 'INSURANCE_AUTO';
                                const isInsuranceAutoDistribution = item.linkedSource === 'INSURANCE_DISTRIBUTION_AUTO';
                                const insuranceAutoTag = isInsuranceAutoDistribution
                                    ? tByLang('保險派發自動', 'Insurance Distribution Auto', '保険配当・自動')
                                    : (isInsuranceAutoDebit ? tByLang('保險扣款自動', 'Insurance Debit Auto', '保険引落・自動') : '');

                                return (
                            <>
                            <div className="md:hidden space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-black ${item.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>{CASHFLOW_TYPES[item.type].label}</span>
                                            <span className="text-sm font-black text-slate-800 truncate">{item.title}</span>
                                            {insuranceAutoTag && (
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100">{insuranceAutoTag}</span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-bold mt-1 truncate">
                                            {item.category} · {(item.frequency === 'ONE_TIME' ? tByLang('單次', 'One-time', '単発') : (CASHFLOW_FREQUENCIES.find(entry => entry.value === item.frequency)?.label || item.frequency))}
                                            {item.frequency === 'MONTHLY' ? tByLang(`（${item.payday || item.monthday || '--'}號）`, `(${item.payday || item.monthday || '--'})`, `（${item.payday || item.monthday || '--'}日）`) : ''}
                                        </div>
                                    </div>
                                    <div className={`text-sm font-black shrink-0 ${item.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {item.type === 'INCOME' ? '+' : '-'}{formatAmount(fromHKD(toHKD(item.amount, item.currency), displayCurrency))}
                                    </div>
                                </div>

                                <div className="text-[10px] text-slate-400 font-black flex flex-wrap gap-x-3 gap-y-1">
                                    {item.account ? <span>{tByLang('帳戶：', 'Account: ', '口座：')}{item.account}</span> : null}
                                    {item.scheduleType === 'ONE_TIME' && Array.isArray(item.oneTimeDates) && item.oneTimeDates.length > 0
                                        ? <span>{tByLang('日期：', 'Dates: ', '日付：')}{item.oneTimeDates.slice(0, 3).join('、')}{item.oneTimeDates.length > 3 ? tByLang(` 等 ${item.oneTimeDates.length} 日`, ` and ${item.oneTimeDates.length} days`, ` ほか ${item.oneTimeDates.length} 日`) : ''}</span>
                                        : null}
                                </div>

                                {item.targetLiquidAssetId && (
                                    <div className="text-[10px] text-indigo-500 font-black truncate">
                                        {tByLang('目標：', 'Target: ', '対象：')}{liquidAssetLabelById[item.targetLiquidAssetId] || tByLang('已綁定帳戶', 'Linked Account', '連携済み口座')}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2 pt-0.5">
                                    <button
                                        type="button"
                                        onClick={() => startEditCashflowEntry(item)}
                                        className="px-2.5 py-1.5 rounded-lg theme-tab-inactive text-xs font-black"
                                    >
                                        {tByLang('編輯', 'Edit', '編集')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteCashflowEntry(item.id)}
                                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-xs font-black hover:bg-rose-100"
                                    >
                                        {tByLang('刪除', 'Delete', '削除')}
                                    </button>
                                </div>
                            </div>

                            <div className="hidden md:flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-black ${item.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>{CASHFLOW_TYPES[item.type].label}</span>
                                        <span className="text-sm font-black text-slate-800 truncate">{item.title}</span>
                                        {insuranceAutoTag && (
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100">{insuranceAutoTag}</span>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-bold mt-1">
                                        {item.account ? tByLang(`帳戶：${item.account} · `, `Account: ${item.account} · `, `口座：${item.account} · `) : ''}
                                        {item.category} · {(item.scheduleType === 'ONE_TIME' ? tByLang('單次性', 'One-time', '単発') : tByLang('固定', 'Recurring', '定期'))} · {(item.frequency === 'ONE_TIME' ? tByLang('單次', 'One-time', '単発') : (CASHFLOW_FREQUENCIES.find(entry => entry.value === item.frequency)?.label || item.frequency))}
                                        {item.frequency === 'MONTHLY' ? tByLang(`（每月 ${item.payday || item.monthday || '--'} 號）`, `(Monthly ${item.payday || item.monthday || '--'})`, `（毎月 ${item.payday || item.monthday || '--'} 日）`) : ''}
                                        {item.scheduleType === 'ONE_TIME'
                                            ? tByLang(
                                                ` · 日期：${(Array.isArray(item.oneTimeDates) && item.oneTimeDates.length > 0 ? item.oneTimeDates.slice(0, 4).join('、') : item.startDate || '--')}${Array.isArray(item.oneTimeDates) && item.oneTimeDates.length > 4 ? ` 等 ${item.oneTimeDates.length} 日` : ''}`,
                                                ` · Dates: ${(Array.isArray(item.oneTimeDates) && item.oneTimeDates.length > 0 ? item.oneTimeDates.slice(0, 4).join(', ') : item.startDate || '--')}${Array.isArray(item.oneTimeDates) && item.oneTimeDates.length > 4 ? ` and ${item.oneTimeDates.length} days` : ''}`,
                                                ` ・日付：${(Array.isArray(item.oneTimeDates) && item.oneTimeDates.length > 0 ? item.oneTimeDates.slice(0, 4).join('、') : item.startDate || '--')}${Array.isArray(item.oneTimeDates) && item.oneTimeDates.length > 4 ? ` ほか ${item.oneTimeDates.length} 日` : ''}`
                                            )
                                            : ` · ${item.startDate}${item.endDate ? ` ~ ${item.endDate}` : ''}`}
                                    </div>
                                    {item.targetLiquidAssetId && (
                                        <div className="text-[10px] text-indigo-500 font-black mt-0.5">
                                            {(item.scheduleType === 'ONE_TIME'
                                                ? tByLang('本次入帳/扣款目標帳戶：', 'Target account for this posting: ', '今回の入出金先口座：')
                                                : tByLang('自動入帳/扣款目標帳戶：', 'Auto-posting target account: ', '自動入出金の対象口座：'))
                                            + (liquidAssetLabelById[item.targetLiquidAssetId] || tByLang('已綁定帳戶', 'Linked Account', '連携済み口座'))}
                                        </div>
                                    )}
                                    {item.note && <div className="text-[10px] text-slate-400 font-bold mt-0.5">{item.note}</div>}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className={`text-sm font-black ${item.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {item.type === 'INCOME' ? '+' : '-'}{formatAmount(fromHKD(toHKD(item.amount, item.currency), displayCurrency))} {displayCurrency}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => startEditCashflowEntry(item)}
                                        className="px-2.5 py-1.5 rounded-lg theme-tab-inactive text-xs font-black"
                                    >
                                        {tByLang('編輯', 'Edit', '編集')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteCashflowEntry(item.id)}
                                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-xs font-black hover:bg-rose-100"
                                    >
                                        {tByLang('刪除', 'Delete', '削除')}
                                    </button>
                                </div>
                            </div>
                            </>
                                );
                            })()}
                        </div>
                    ))}

                    {filteredCashflowEntries.length > cashflowRulesVisibleCount && (
                        <button
                            type="button"
                            onClick={() => setCashflowRulesVisibleCount(prev => prev + 20)}
                            className="w-full mt-1 px-3 py-2 rounded-lg theme-tab-inactive text-xs font-black"
                        >
                            {tByLang(
                                `顯示更多（剩餘 ${filteredCashflowEntries.length - cashflowRulesVisibleCount} 筆）`,
                                `Show more (${filteredCashflowEntries.length - cashflowRulesVisibleCount} remaining)`,
                                `さらに表示（残り ${filteredCashflowEntries.length - cashflowRulesVisibleCount} 件）`
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
    };

    window.APP_CASHFLOW_RULES_VIEW = {
        CashflowRulesView
    };
})();
