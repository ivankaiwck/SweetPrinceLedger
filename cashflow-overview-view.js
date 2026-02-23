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
        WEEKDAY_LABELS
    }) => (
        <>
            <div className="order-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="theme-income-card rounded-xl p-4">
                    <div className="text-[10px] theme-text-sub font-black uppercase tracking-widest mb-1">本月收入</div>
                    <div className="text-xl font-black theme-text-main">{formatAmount(cashflowMonthData.monthIncomeDisplay)} {displayCurrency}</div>
                </div>
                <div className="theme-expense-card rounded-xl p-4">
                    <div className="text-[10px] theme-text-sub font-black uppercase tracking-widest mb-1">本月支出</div>
                    <div className="text-xl font-black theme-text-main">{formatAmount(cashflowMonthData.monthExpenseDisplay)} {displayCurrency}</div>
                </div>
                <div className="theme-netflow-card rounded-xl p-4">
                    <div className="text-[10px] theme-text-sub font-black uppercase tracking-widest mb-1">本月淨流</div>
                    <div className={`text-xl font-black ${cashflowMonthData.monthNetDisplay >= 0 ? 'theme-text-main' : 'text-rose-500'}`}>
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
                    每月日曆
                </button>
                <button
                    type="button"
                    onClick={() => setCashflowView('YEAR')}
                    className={`px-3 py-2 rounded-lg text-xs font-black ${cashflowView === 'YEAR' ? 'theme-tab-active' : 'theme-tab-inactive'}`}
                >
                    每年彙總
                </button>
            </div>

            {cashflowView === 'MONTH' ? (
                <div className="order-1 space-y-3">
                    <div className="md:hidden space-y-2">
                        {cashflowMonthData.dayRows.map(day => (
                            <div
                                key={day.dateKey}
                                className={`rounded-xl border bg-white px-3 py-2.5 flex flex-col gap-1.5 ${day.entries.length > 0 ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-slate-100'}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-black text-slate-700">{day.day} 日</span>
                                        {day.dateKey === TODAY_DATE_KEY && (
                                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-indigo-100 text-indigo-600">今日</span>
                                        )}
                                    </div>
                                    <span className={`text-xs font-black ${day.netDisplay >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        淨流 {day.netDisplay >= 0 ? '+' : ''}{formatAmount(day.netDisplay)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] font-black">
                                    <span className="text-emerald-600">收 +{formatAmount(day.incomeDisplay)}</span>
                                    <span className="text-rose-600">支 -{formatAmount(day.expenseDisplay)}</span>
                                </div>
                                <div className="space-y-0.5">
                                    {day.entries.length === 0 ? (
                                        <div className="text-[11px] text-slate-300 font-black">無流水</div>
                                    ) : (
                                        day.entries.slice(0, 3).map(entry => (
                                            <div key={entry.id} className={`text-[11px] truncate font-bold ${entry.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {entry.type === 'INCOME' ? '+' : '-'}{entry.title}
                                            </div>
                                        ))
                                    )}
                                    {day.entries.length > 3 && (
                                        <div className="text-[10px] text-slate-400 font-black">+{day.entries.length - 3} 筆</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="hidden md:block space-y-3">
                        <div className="grid grid-cols-7 gap-2">
                            {WEEKDAY_LABELS.map(label => (
                                <div key={label} className="text-center text-[10px] text-slate-400 font-black uppercase tracking-widest py-1">週{label}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                            {Array.from({ length: cashflowMonthData.firstDay }).map((_, idx) => (
                                <div key={`empty-${idx}`} className="h-24 rounded-xl bg-slate-50/40 border border-slate-100"></div>
                            ))}
                            {cashflowMonthData.dayRows.map(day => (
                                <div key={day.dateKey} className="min-h-24 rounded-xl border border-slate-100 bg-white p-2 flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs font-black text-slate-700">{day.day}</span>
                                            {day.dateKey === TODAY_DATE_KEY && (
                                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-indigo-100 text-indigo-600">今日</span>
                                            )}
                                        </div>
                                        <span className={`text-[10px] font-black ${day.netDisplay >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {day.netDisplay >= 0 ? '+' : ''}{formatAmount(day.netDisplay)}
                                        </span>
                                    </div>
                                    {(day.incomeDisplay > 0 || day.expenseDisplay > 0) ? (
                                        <>
                                            <div className="text-[10px] font-black text-emerald-500">收 +{formatAmount(day.incomeDisplay)}</div>
                                            <div className="text-[10px] font-black text-rose-500">支 -{formatAmount(day.expenseDisplay)}</div>
                                        </>
                                    ) : (
                                        <div className="text-[10px] text-slate-300 font-black">無流水</div>
                                    )}
                                    <div className="space-y-0.5">
                                        {day.entries.slice(0, 2).map(entry => (
                                            <div key={entry.id} className={`text-[10px] truncate font-bold ${entry.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {entry.type === 'INCOME' ? '+' : '-'}{entry.title}
                                            </div>
                                        ))}
                                        {day.entries.length > 2 && (
                                            <div className="text-[10px] text-slate-400 font-black">+{day.entries.length - 2} 筆</div>
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
                            <div className="text-[10px] theme-text-sub font-black uppercase tracking-widest mb-1">{cashflowYearData.year} 年收入</div>
                            <div className="text-xl font-black theme-text-main">{formatAmount(cashflowYearData.yearIncomeDisplay)} {displayCurrency}</div>
                        </div>
                        <div className="theme-expense-card rounded-xl p-4">
                            <div className="text-[10px] theme-text-sub font-black uppercase tracking-widest mb-1">{cashflowYearData.year} 年支出</div>
                            <div className="text-xl font-black theme-text-main">{formatAmount(cashflowYearData.yearExpenseDisplay)} {displayCurrency}</div>
                        </div>
                        <div className="theme-netflow-card rounded-xl p-4">
                            <div className="text-[10px] theme-text-sub font-black uppercase tracking-widest mb-1">{cashflowYearData.year} 年淨流</div>
                            <div className={`text-xl font-black ${cashflowYearData.yearNetDisplay >= 0 ? 'theme-text-main' : 'text-rose-500'}`}>
                                {cashflowYearData.yearNetDisplay >= 0 ? '+' : ''}{formatAmount(cashflowYearData.yearNetDisplay)} {displayCurrency}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                        {cashflowYearData.months.map(monthItem => (
                            <div key={monthItem.label} className="rounded-xl theme-surface p-3">
                                <div className="text-sm font-black text-slate-700 mb-2">{monthItem.label}</div>
                                <div className="text-xs font-bold text-emerald-600">收入 +{formatAmount(monthItem.incomeDisplay)} {displayCurrency}</div>
                                <div className="text-xs font-bold text-rose-600">支出 -{formatAmount(monthItem.expenseDisplay)} {displayCurrency}</div>
                                <div className={`text-xs font-black mt-1 ${monthItem.netDisplay >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                                    淨流 {monthItem.netDisplay >= 0 ? '+' : ''}{formatAmount(monthItem.netDisplay)} {displayCurrency}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );

    window.APP_CASHFLOW_OVERVIEW_VIEW = {
        CashflowOverviewView
    };
})();
