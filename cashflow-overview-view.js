(() => {
    const TODAY_DATE_KEY = (() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    })();

    const CashflowOverviewView = ({
        cashflowMonthData,
        cashflowYearData,
        displayCurrency,
        formatAmount,
        cashflowView,
        setCashflowView,
        WEEKDAY_LABELS,
        pageLanguage
    }) => {
        const mobileListRef = React.useRef(null);
        const mobileTodayCardRef = React.useRef(null);
        const [selectedDayDetail, setSelectedDayDetail] = React.useState(null);
        const tByLang = (zh, en, ja) => (pageLanguage === 'en-US' ? en : (pageLanguage === 'ja-JP' ? ja : zh));
        const weekdayLabels = React.useMemo(() => {
            if (pageLanguage === 'en-US') return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            if (pageLanguage === 'ja-JP') return ['日', '月', '火', '水', '木', '金', '土'];
            return Array.isArray(WEEKDAY_LABELS)
                ? WEEKDAY_LABELS.map(label => `週${label}`)
                : ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
        }, [WEEKDAY_LABELS, pageLanguage]);

        React.useEffect(() => {
            if (cashflowView !== 'MONTH') return;
            if (!window.matchMedia('(max-width: 767px)').matches) return;
            const listEl = mobileListRef.current;
            const todayEl = mobileTodayCardRef.current;
            if (!listEl || !todayEl) return;

            const scrollTop = Math.max(0, todayEl.offsetTop - (listEl.clientHeight * 0.22));
            listEl.scrollTo({ top: scrollTop, behavior: 'smooth' });
        }, [cashflowView, cashflowMonthData.dayRows]);

        React.useEffect(() => {
            if (cashflowView !== 'MONTH') {
                setSelectedDayDetail(null);
            }
        }, [cashflowView]);

        return (
        <>
            <div className="order-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="theme-income-card rounded-xl p-4">
                    <div className="text-[10px] theme-text-sub font-black uppercase tracking-widest mb-1">{tByLang('本月收入', 'Monthly Income', '今月の収入')}</div>
                    <div className="text-xl font-black text-emerald-600">{formatAmount(cashflowMonthData.monthIncomeDisplay)} {displayCurrency}</div>
                </div>
                <div className="theme-expense-card rounded-xl p-4">
                    <div className="text-[10px] theme-text-sub font-black uppercase tracking-widest mb-1">{tByLang('本月支出', 'Monthly Expense', '今月の支出')}</div>
                    <div className="text-xl font-black text-rose-600">{formatAmount(cashflowMonthData.monthExpenseDisplay)} {displayCurrency}</div>
                </div>
                <div className="theme-netflow-card rounded-xl p-4">
                    <div className="text-[10px] theme-text-sub font-black uppercase tracking-widest mb-1">{tByLang('本月淨流', 'Monthly Net Flow', '今月の純フロー')}</div>
                    <div className={`text-xl font-black ${cashflowMonthData.monthNetDisplay >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {cashflowMonthData.monthNetDisplay >= 0 ? '+' : ''}{formatAmount(cashflowMonthData.monthNetDisplay)} {displayCurrency}
                    </div>
                </div>
            </div>

            <div className="order-1 flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setCashflowView('MONTH')}
                    className={`px-3 py-2 rounded-lg text-xs font-black ${cashflowView === 'MONTH' ? 'theme-tab-active' : 'theme-tab-inactive'}`}
                >
                    {tByLang('每月月曆', 'Monthly Calendar', '月間カレンダー')}
                </button>
                <button
                    type="button"
                    onClick={() => setCashflowView('YEAR')}
                    className={`px-3 py-2 rounded-lg text-xs font-black ${cashflowView === 'YEAR' ? 'theme-tab-active' : 'theme-tab-inactive'}`}
                >
                    {tByLang('每年總匯', 'Yearly Summary', '年間サマリー')}
                </button>
            </div>

            {cashflowView === 'MONTH' ? (
                <div className="order-1 space-y-3">
                    <div className="md:hidden">
                        <div className="text-[10px] text-slate-400 font-black mb-2">{tByLang('固定顯示約 5-10 日，可上下滑動查看更多', 'Shows about 5-10 days at once. Scroll up/down to view more.', '常時5〜10日分を表示します。上下にスクロールして続きを確認できます。')}</div>
                        <div ref={mobileListRef} className="space-y-2 max-h-[68vh] min-h-[52vh] overflow-y-auto pr-1 custom-scrollbar">
                        {cashflowMonthData.dayRows.map(day => (
                            <div
                                key={day.dateKey}
                                ref={day.dateKey === TODAY_DATE_KEY ? mobileTodayCardRef : null}
                                className={`min-h-[96px] rounded-xl border px-3 py-2.5 flex flex-col gap-1.5 cursor-pointer transition-colors ${day.dateKey === TODAY_DATE_KEY ? 'bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-200 shadow-sm shadow-indigo-100/70 hover:bg-indigo-50' : day.entries.length > 0 ? 'bg-white border-indigo-200 ring-1 ring-indigo-100 hover:bg-slate-50' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                                onClick={() => setSelectedDayDetail(day)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        setSelectedDayDetail(day);
                                    }
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-sm font-black ${day.dateKey === TODAY_DATE_KEY ? 'text-indigo-700' : 'text-slate-700'}`}>{tByLang(`${day.day} 日`, `${day.day}`, `${day.day}日`)}</span>
                                        {day.dateKey === TODAY_DATE_KEY && (
                                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-indigo-100 text-indigo-600">{tByLang('今日', 'Today', '今日')}</span>
                                        )}
                                    </div>
                                    <span className={`text-xs font-black ${day.netDisplay >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {tByLang('淨流', 'Net', '純フロー')} {day.netDisplay >= 0 ? '+' : ''}{formatAmount(day.netDisplay)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] font-black">
                                    <span className="text-emerald-600">{tByLang('收', 'In', '収')} +{formatAmount(day.incomeDisplay)}</span>
                                    <span className="text-rose-600">{tByLang('支', 'Out', '支')} -{formatAmount(day.expenseDisplay)}</span>
                                </div>
                                <div className="space-y-0.5">
                                    {day.entries.length === 0 ? (
                                        <div className="text-[11px] text-slate-300 font-black">{tByLang('無流水', 'No records', '記録なし')}</div>
                                    ) : (
                                        day.entries.slice(0, 3).map(entry => (
                                            <div key={entry.id} className={`text-[11px] truncate font-bold ${entry.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {entry.type === 'INCOME' ? '+' : '-'}{entry.title}
                                            </div>
                                        ))
                                    )}
                                    {day.entries.length > 3 && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedDayDetail(day)}
                                            className="text-[10px] text-indigo-500 font-black hover:text-indigo-600"
                                        >
                                            {tByLang(`查看全部（+${day.entries.length - 3}）`, `View all (+${day.entries.length - 3})`, `すべて表示（+${day.entries.length - 3}）`)}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>

                    <div className="hidden md:block space-y-3">
                        <div className="grid grid-cols-7 gap-2">
                            {weekdayLabels.map(label => (
                                <div key={label} className="text-center text-[10px] text-slate-400 font-black uppercase tracking-widest py-1">{label}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                            {Array.from({ length: cashflowMonthData.firstDay }).map((_, idx) => (
                                <div key={`empty-${idx}`} className="h-24 rounded-xl bg-slate-50/40 border border-slate-100"></div>
                            ))}
                            {cashflowMonthData.dayRows.map(day => (
                                <div
                                    key={day.dateKey}
                                    className={`min-h-24 rounded-xl border p-2 flex flex-col gap-1 cursor-pointer transition-colors ${day.dateKey === TODAY_DATE_KEY ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-200 shadow-sm shadow-indigo-100/70 hover:bg-indigo-50' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                                    onClick={() => setSelectedDayDetail(day)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            setSelectedDayDetail(day);
                                        }
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <span className={`text-xs font-black ${day.dateKey === TODAY_DATE_KEY ? 'text-indigo-700' : 'text-slate-700'}`}>{day.day}</span>
                                            {day.dateKey === TODAY_DATE_KEY && (
                                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-indigo-100 text-indigo-600">{tByLang('今日', 'Today', '今日')}</span>
                                            )}
                                        </div>
                                        <span className={`text-[10px] font-black ${day.netDisplay >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {day.netDisplay >= 0 ? '+' : ''}{formatAmount(day.netDisplay)}
                                        </span>
                                    </div>
                                    {(day.incomeDisplay > 0 || day.expenseDisplay > 0) ? (
                                        <>
                                            <div className="text-[10px] font-black text-emerald-500">{tByLang('收', 'In', '収')} +{formatAmount(day.incomeDisplay)}</div>
                                            <div className="text-[10px] font-black text-rose-500">{tByLang('支', 'Out', '支')} -{formatAmount(day.expenseDisplay)}</div>
                                        </>
                                    ) : (
                                        <div className="text-[10px] text-slate-300 font-black">{tByLang('無流水', 'No records', '記録なし')}</div>
                                    )}
                                    <div className="space-y-0.5">
                                        {day.entries.slice(0, 2).map(entry => (
                                            <div key={entry.id} className={`text-[10px] truncate font-bold ${entry.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {entry.type === 'INCOME' ? '+' : '-'}{entry.title}
                                            </div>
                                        ))}
                                        {day.entries.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedDayDetail(day)}
                                                className="text-[10px] text-indigo-500 font-black hover:text-indigo-600"
                                            >
                                                {tByLang(`查看全部（+${day.entries.length - 2}）`, `View all (+${day.entries.length - 2})`, `すべて表示（+${day.entries.length - 2}）`)}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="order-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="theme-income-card rounded-xl p-4">
                            <div className="text-[10px] theme-text-sub font-black uppercase tracking-widest mb-1">{tByLang(`${cashflowYearData.year} 年收入`, `${cashflowYearData.year} Income`, `${cashflowYearData.year}年 収入`)}</div>
                            <div className="text-xl font-black text-emerald-600">{formatAmount(cashflowYearData.yearIncomeDisplay)} {displayCurrency}</div>
                        </div>
                        <div className="theme-expense-card rounded-xl p-4">
                            <div className="text-[10px] theme-text-sub font-black uppercase tracking-widest mb-1">{tByLang(`${cashflowYearData.year} 年支出`, `${cashflowYearData.year} Expense`, `${cashflowYearData.year}年 支出`)}</div>
                            <div className="text-xl font-black text-rose-600">{formatAmount(cashflowYearData.yearExpenseDisplay)} {displayCurrency}</div>
                        </div>
                        <div className="theme-netflow-card rounded-xl p-4">
                            <div className="text-[10px] theme-text-sub font-black uppercase tracking-widest mb-1">{tByLang(`${cashflowYearData.year} 年淨流`, `${cashflowYearData.year} Net Flow`, `${cashflowYearData.year}年 純フロー`)}</div>
                            <div className={`text-xl font-black ${cashflowYearData.yearNetDisplay >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {cashflowYearData.yearNetDisplay >= 0 ? '+' : ''}{formatAmount(cashflowYearData.yearNetDisplay)} {displayCurrency}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                        {cashflowYearData.months.map((monthItem, monthIndex) => (
                            <div key={`${cashflowYearData.year}-${monthIndex + 1}`} className="rounded-xl theme-surface p-3">
                                <div className="text-sm font-black text-slate-700 mb-2">{tByLang(`${monthIndex + 1} 月`, `M${monthIndex + 1}`, `${monthIndex + 1}月`)}</div>
                                <div className="text-xs font-bold text-emerald-600">{tByLang('收入', 'Income', '収入')} +{formatAmount(monthItem.incomeDisplay)} {displayCurrency}</div>
                                <div className="text-xs font-bold text-rose-600">{tByLang('支出', 'Expense', '支出')} -{formatAmount(monthItem.expenseDisplay)} {displayCurrency}</div>
                                <div className={`text-xs font-black mt-1 ${monthItem.netDisplay >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {tByLang('淨流', 'Net', '純フロー')} {monthItem.netDisplay >= 0 ? '+' : ''}{formatAmount(monthItem.netDisplay)} {displayCurrency}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {selectedDayDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay" onClick={() => setSelectedDayDetail(null)}>
                    <div className="w-full max-w-md rounded-2xl theme-surface shadow-2xl p-4" onClick={event => event.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <div className="text-sm font-black theme-text-main">{tByLang(`${selectedDayDetail.dateKey} 流水明細`, `${selectedDayDetail.dateKey} Flow Details`, `${selectedDayDetail.dateKey} 入出金明細`)}</div>
                                <div className="text-[11px] font-black theme-text-sub mt-0.5">
                                    {tByLang('收', 'In', '収')} +{formatAmount(selectedDayDetail.incomeDisplay)} · {tByLang('支', 'Out', '支')} -{formatAmount(selectedDayDetail.expenseDisplay)} · {tByLang('淨', 'Net', '純')} {selectedDayDetail.netDisplay >= 0 ? '+' : ''}{formatAmount(selectedDayDetail.netDisplay)} {displayCurrency}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedDayDetail(null)}
                                className="px-2 py-1 rounded-lg theme-tab-inactive text-xs font-black"
                            >
                                {tByLang('關閉', 'Close', '閉じる')}
                            </button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-1 space-y-1.5">
                            {selectedDayDetail.entries.length === 0 ? (
                                <div className="text-xs theme-text-sub font-bold text-center py-3">{tByLang('當日無流水', 'No records for this day', '当日の記録はありません')}</div>
                            ) : (
                                selectedDayDetail.entries.map(entry => (
                                    <div key={entry.id} className="rounded-lg border border-slate-100 p-2.5 flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className={`text-xs font-black truncate ${entry.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {entry.type === 'INCOME' ? '+' : '-'} {entry.title}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-bold truncate mt-0.5">
                                                {entry.category}{entry.account ? ` · ${entry.account}` : ''}
                                            </div>
                                        </div>
                                        <div className={`text-xs font-black shrink-0 ${entry.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {entry.type === 'INCOME' ? '+' : '-'}{formatAmount(entry.amountDisplay)} {displayCurrency}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
    };

    window.APP_CASHFLOW_OVERVIEW_VIEW = {
        CashflowOverviewView
    };
})();
