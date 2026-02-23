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
        cashflowTriggerInfoById,
        formatAmount,
        fromHKD,
        toHKD,
        displayCurrency,
        startEditCashflowEntry,
        handleDeleteCashflowEntry
    }) => (
        <div className="order-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="text-xs text-slate-400 font-black uppercase tracking-widest">現金流規則清單</div>
                <div className="text-[10px] text-slate-400 font-black">共 {cashflowEntries.length} 筆 · 符合條件 {filteredCashflowEntries.length} 筆</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
                <input
                    type="text"
                    placeholder="搜尋名稱 / 分類 / 帳戶 / 備註"
                    className="w-full p-2.5 theme-input rounded-lg text-xs font-bold outline-none"
                    value={cashflowRuleKeyword}
                    onChange={e => setCashflowRuleKeyword(e.target.value)}
                />
                <select
                    value={cashflowRuleFilter}
                    onChange={e => setCashflowRuleFilter(e.target.value)}
                    className="w-full p-2.5 theme-input rounded-lg text-xs font-bold outline-none"
                >
                    <option value="ALL">全部規則</option>
                    <option value="AUTO">僅固定（自動）</option>
                    <option value="ONE_TIME">僅單次</option>
                    <option value="INCOME">僅收入</option>
                    <option value="EXPENSE">僅支出</option>
                </select>
                <select
                    value={cashflowRuleSortMode}
                    onChange={e => setCashflowRuleSortMode(e.target.value)}
                    className="w-full p-2.5 theme-input rounded-lg text-xs font-bold outline-none"
                >
                    <option value="START_DESC">按建立/開始日（新到舊）</option>
                    <option value="NEXT_TRIGGER_ASC">按下次觸發日（近期優先）</option>
                </select>
                <div className="flex items-center gap-2">
                    {editingCashflowId ? (
                        <button
                            type="button"
                            onClick={cancelCashflowEdit}
                            className="w-full px-3 py-2.5 rounded-lg theme-tab-inactive text-xs font-black"
                        >
                            取消編輯
                        </button>
                    ) : (
                        <div className="w-full px-3 py-2.5 rounded-lg theme-soft-surface text-xs font-black text-center theme-text-sub">點選規則可編輯</div>
                    )}
                </div>
            </div>

            {!filteredCashflowEntries.length ? (
                <p className="text-sm text-slate-400 font-bold">尚未新增現金流規則</p>
            ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                    {filteredCashflowEntries.slice(0, cashflowRulesVisibleCount).map(item => (
                        <div key={item.id} className={`rounded-xl p-3 ${editingCashflowId === item.id ? 'theme-soft-surface' : 'theme-surface'}`}>
                            <div className="md:hidden space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-black ${item.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>{CASHFLOW_TYPES[item.type].label}</span>
                                            <span className="text-sm font-black text-slate-800 truncate">{item.title}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-bold mt-1 truncate">
                                            {item.category} · {(item.frequency === 'ONE_TIME' ? '單次' : (CASHFLOW_FREQUENCIES.find(entry => entry.value === item.frequency)?.label || item.frequency))}
                                            {item.frequency === 'MONTHLY' ? `（${item.payday || item.monthday || '--'}號）` : ''}
                                        </div>
                                    </div>
                                    <div className={`text-sm font-black shrink-0 ${item.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {item.type === 'INCOME' ? '+' : '-'}{formatAmount(fromHKD(toHKD(item.amount, item.currency), displayCurrency))}
                                    </div>
                                </div>

                                <div className="text-[10px] text-slate-400 font-black flex flex-wrap gap-x-3 gap-y-1">
                                    <span>下次：{cashflowTriggerInfoById[item.id]?.nextDateKey || '--'}</span>
                                    {item.account ? <span>帳戶：{item.account}</span> : null}
                                </div>

                                {item.targetLiquidAssetId && (
                                    <div className="text-[10px] text-indigo-500 font-black truncate">
                                        目標：{liquidAssetLabelById[item.targetLiquidAssetId] || '已綁定帳戶'}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2 pt-0.5">
                                    <button
                                        type="button"
                                        onClick={() => startEditCashflowEntry(item)}
                                        className="px-2.5 py-1.5 rounded-lg theme-tab-inactive text-xs font-black"
                                    >
                                        編輯
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteCashflowEntry(item.id)}
                                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-xs font-black hover:bg-rose-100"
                                    >
                                        刪除
                                    </button>
                                </div>
                            </div>

                            <div className="hidden md:flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-black ${item.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>{CASHFLOW_TYPES[item.type].label}</span>
                                        <span className="text-sm font-black text-slate-800 truncate">{item.title}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-bold mt-1">
                                        {item.account ? `帳戶：${item.account} · ` : ''}
                                        {item.category} · {(item.scheduleType === 'ONE_TIME' ? '單次性' : '固定')} · {(item.frequency === 'ONE_TIME' ? '單次' : (CASHFLOW_FREQUENCIES.find(entry => entry.value === item.frequency)?.label || item.frequency))}
                                        {item.frequency === 'MONTHLY' ? `（每月 ${item.payday || item.monthday || '--'} 號）` : ''} · {item.startDate}{item.endDate ? ` ~ ${item.endDate}` : ''}
                                    </div>
                                    {item.targetLiquidAssetId && (
                                        <div className="text-[10px] text-indigo-500 font-black mt-0.5">
                                            {item.scheduleType === 'ONE_TIME' ? '本次入帳/扣款目標帳戶：' : '自動入帳/扣款目標帳戶：'}{liquidAssetLabelById[item.targetLiquidAssetId] || '已綁定帳戶'}
                                        </div>
                                    )}
                                    {item.note && <div className="text-[10px] text-slate-400 font-bold mt-0.5">{item.note}</div>}
                                    <div className="text-[10px] text-slate-400 font-black mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                        <span>最後觸發：{cashflowTriggerInfoById[item.id]?.lastDateKey || '--'}</span>
                                        <span>下次觸發：{cashflowTriggerInfoById[item.id]?.nextDateKey || '--'}</span>
                                    </div>
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
                                        編輯
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteCashflowEntry(item.id)}
                                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-xs font-black hover:bg-rose-100"
                                    >
                                        刪除
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredCashflowEntries.length > cashflowRulesVisibleCount && (
                        <button
                            type="button"
                            onClick={() => setCashflowRulesVisibleCount(prev => prev + 20)}
                            className="w-full mt-1 px-3 py-2 rounded-lg theme-tab-inactive text-xs font-black"
                        >
                            顯示更多（剩餘 {filteredCashflowEntries.length - cashflowRulesVisibleCount} 筆）
                        </button>
                    )}
                </div>
            )}
        </div>
    );

    window.APP_CASHFLOW_RULES_VIEW = {
        CashflowRulesView
    };
})();
