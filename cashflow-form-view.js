(() => {
    const { useState } = React;

    const OneTimeCalendarSelector = ({
        cashflowForm,
        FIELD_LABEL_CLASS,
        CASHFLOW_INPUT_CLASS,
        toggleCashflowOneTimeDate,
        updateCashflowOneTimeMonth,
        applyCashflowOneTimeMonthPreset,
        clearCashflowOneTimeDates,
        parseDateKey,
        toDateKey,
        pageLanguage
    }) => {
        const { FULL_PAGE_TEXT_MAP } = window.APP_I18N || {};
        const dictionary = (FULL_PAGE_TEXT_MAP || {})[pageLanguage] || {};
        const translate = (text) => (pageLanguage === 'zh-Hant' ? text : (dictionary[text] || text));
        const tByLang = (zh, en, ja) => (pageLanguage === 'en-US' ? en : (pageLanguage === 'ja-JP' ? ja : zh));
        const [customWeekdays, setCustomWeekdays] = useState([1, 2, 3, 4, 5]);
        const selectedDateSet = new Set(Array.isArray(cashflowForm.oneTimeDates) ? cashflowForm.oneTimeDates : []);
        const anchorDate = parseDateKey(cashflowForm.startDate) || new Date();
        const year = anchorDate.getFullYear();
        const month = anchorDate.getMonth();
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        const firstWeekday = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const dayCells = [];
        for (let i = 0; i < firstWeekday; i += 1) dayCells.push(null);
        for (let day = 1; day <= daysInMonth; day += 1) {
            dayCells.push(toDateKey(new Date(year, month, day)));
        }
        while (dayCells.length % 7 !== 0) dayCells.push(null);

        const weekdayOptions = pageLanguage === 'en-US'
            ? [
                { value: 1, label: 'Mon' },
                { value: 2, label: 'Tue' },
                { value: 3, label: 'Wed' },
                { value: 4, label: 'Thu' },
                { value: 5, label: 'Fri' },
                { value: 6, label: 'Sat' },
                { value: 0, label: 'Sun' }
            ]
            : pageLanguage === 'ja-JP'
                ? [
                    { value: 1, label: '月' },
                    { value: 2, label: '火' },
                    { value: 3, label: '水' },
                    { value: 4, label: '木' },
                    { value: 5, label: '金' },
                    { value: 6, label: '土' },
                    { value: 0, label: '日' }
                ]
                : [
                    { value: 1, label: '一' },
                    { value: 2, label: '二' },
                    { value: 3, label: '三' },
                    { value: 4, label: '四' },
                    { value: 5, label: '五' },
                    { value: 6, label: '六' },
                    { value: 0, label: '日' }
                ];
        const weekdayHeaders = pageLanguage === 'en-US'
            ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            : pageLanguage === 'ja-JP'
                ? ['日', '月', '火', '水', '木', '金', '土']
                : ['日', '一', '二', '三', '四', '五', '六'];

        const toggleCustomWeekday = (weekday) => {
            setCustomWeekdays(prev => {
                const hasValue = prev.includes(weekday);
                if (hasValue) {
                    const next = prev.filter(item => item !== weekday);
                    return next.length > 0 ? next : prev;
                }
                return [...prev, weekday].sort((a, b) => a - b);
            });
        };

        return (
            <div className="space-y-1 col-span-2 xl:col-span-2">
                <label className={FIELD_LABEL_CLASS}>{tByLang('單次日期（可多選）', 'One-time dates (multi-select)', '単発日（複数選択可）')}</label>
                <div className="flex items-center justify-between gap-2">
                    <input
                        type="month"
                        className={CASHFLOW_INPUT_CLASS}
                        value={monthKey}
                        onChange={event => updateCashflowOneTimeMonth(event.target.value)}
                    />
                    <button type="button" onClick={clearCashflowOneTimeDates} className="px-2 py-1 rounded-md text-[10px] font-black text-rose-500 bg-rose-50 hover:bg-rose-100 whitespace-nowrap">{tByLang('清除日期', 'Clear Dates', '日付をクリア')}</button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                    <button type="button" onClick={() => applyCashflowOneTimeMonthPreset('WEEKDAYS', monthKey)} className="px-2.5 py-1 rounded-md theme-tab-inactive text-[10px] font-black">{tByLang('本月週一至週五', 'Weekdays this month', '今月の平日')}</button>
                    <button type="button" onClick={() => applyCashflowOneTimeMonthPreset('WEEKENDS', monthKey)} className="px-2.5 py-1 rounded-md theme-tab-inactive text-[10px] font-black">{tByLang('本月週末', 'Weekends this month', '今月の週末')}</button>
                    <button type="button" onClick={() => applyCashflowOneTimeMonthPreset('ALL_DAYS', monthKey)} className="px-2.5 py-1 rounded-md theme-tab-inactive text-[10px] font-black">{tByLang('本月每日', 'Every day this month', '今月の全日')}</button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-slate-400 font-black mr-1">{tByLang('自訂星期：', 'Custom weekdays:', '曜日を指定：')}</span>
                    {weekdayOptions.map(option => {
                        const active = customWeekdays.includes(option.value);
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => toggleCustomWeekday(option.value)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all ${active ? 'theme-tab-active' : 'theme-tab-inactive'}`}
                            >
                                {pageLanguage === 'zh-Hant' ? `週${option.label}` : option.label}
                            </button>
                        );
                    })}
                    <button
                        type="button"
                        onClick={() => applyCashflowOneTimeMonthPreset('CUSTOM_WEEKDAYS', monthKey, customWeekdays)}
                        className="px-2.5 py-1 rounded-md theme-tab-inactive text-[10px] font-black"
                    >
                        {tByLang('套用自訂星期', 'Apply Custom Weekdays', '指定曜日を適用')}
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-1 mt-1">
                    {weekdayHeaders.map(label => (
                        <div key={label} className="text-[10px] text-slate-400 font-black text-center">{label}</div>
                    ))}
                    {dayCells.map((dateKey, index) => {
                        if (!dateKey) {
                            return <div key={`empty-${index}`} className="h-8" />;
                        }
                        const day = Number(dateKey.slice(-2));
                        const selected = selectedDateSet.has(dateKey);
                        return (
                            <button
                                key={dateKey}
                                type="button"
                                onClick={() => toggleCashflowOneTimeDate(dateKey)}
                                className={`h-8 rounded-md text-xs font-black transition-all ${selected ? 'theme-tab-active' : 'theme-tab-inactive'}`}
                                title={dateKey}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
                {selectedDateSet.size > 0 && (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {Array.from(selectedDateSet).sort().slice(0, 8).map(dateKey => (
                            <span key={dateKey} className="px-2 py-1 rounded-md theme-soft-surface text-[10px] font-black theme-text-sub">{dateKey}</span>
                        ))}
                        {selectedDateSet.size > 8 && <span className="text-[10px] text-slate-400 font-black">{tByLang(`等 ${selectedDateSet.size} 日`, `and ${selectedDateSet.size} days`, `ほか ${selectedDateSet.size} 日`)}</span>}
                    </div>
                )}
                <div className="text-[10px] text-slate-400 font-bold ml-1">{tByLang('直接點擊日期可選取/取消，規則會在所選日期各自入帳/扣款。', 'Click dates to select/unselect. The rule posts on each selected date.', '日付をクリックして選択/解除できます。選択した日付ごとに入出金されます。')}</div>
            </div>
        );
    };

    const CashflowRuleForm = ({
        cashflowFormRef,
        handleCashflowSubmit,
        editingCashflowId,
        cashflowEntries,
        cashflowAccountOptions,
        FIELD_LABEL_CLASS,
        CASHFLOW_INPUT_CLASS,
        CASHFLOW_INPUT_FOCUS_CLASS,
        cashflowForm,
        updateCashflowField,
        toggleCashflowOneTimeDate,
        updateCashflowOneTimeMonth,
        applyCashflowOneTimeMonthPreset,
        clearCashflowOneTimeDates,
        updateCashflowType,
        updateCashflowTargetLiquidAsset,
        CASHFLOW_TYPES,
        CASHFLOW_SCHEDULE_TYPES,
        liquidAssetOptions,
        CURRENCIES,
        isCashflowOneTime,
        isCashflowMonthlyRecurring,
        CASHFLOW_FREQUENCIES,
        availableCashflowCategories,
        parseDateKey,
        toDateKey,
        pageLanguage
    }) => {
        const { FULL_PAGE_TEXT_MAP } = window.APP_I18N || {};
        const dictionary = (FULL_PAGE_TEXT_MAP || {})[pageLanguage] || {};
        const translate = (text) => (pageLanguage === 'zh-Hant' ? text : (dictionary[text] || text));
        const tByLang = (zh, en, ja) => (pageLanguage === 'en-US' ? en : (pageLanguage === 'ja-JP' ? ja : zh));
        return (
        <form ref={cashflowFormRef} onSubmit={handleCashflowSubmit} className="order-2 rounded-xl theme-soft-surface p-4 space-y-3">
            {editingCashflowId && (
                <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2 text-xs font-black text-indigo-600">
                    {tByLang('正在編輯規則：', 'Editing rule: ', '編集中のルール：')}{cashflowEntries.find(item => item.id === editingCashflowId)?.title || tByLang('未命名規則', 'Untitled Rule', '無題ルール')}
                </div>
            )}
            <datalist id="cashflow-account-options">
                {cashflowAccountOptions.map(account => <option key={account} value={account} />)}
            </datalist>
            <div className="md:hidden space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 col-span-2">
                        <label className={FIELD_LABEL_CLASS}>{translate('項目名稱')}</label>
                        <input
                            required
                            type="text"
                            placeholder={translate('例如：每月租金、兼職收入、每日午餐')}
                            className={CASHFLOW_INPUT_FOCUS_CLASS}
                            value={cashflowForm.title}
                            onChange={updateCashflowField('title')}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className={FIELD_LABEL_CLASS}>{translate('收支類型')}</label>
                        <select value={cashflowForm.type} onChange={updateCashflowType} className={CASHFLOW_INPUT_CLASS}>
                            {Object.entries(CASHFLOW_TYPES).map(([key, item]) => (
                                <option key={key} value={key}>{item.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className={FIELD_LABEL_CLASS}>{translate('記錄類型')}</label>
                        <select value={cashflowForm.scheduleType} onChange={updateCashflowField('scheduleType')} className={CASHFLOW_INPUT_CLASS}>
                            {CASHFLOW_SCHEDULE_TYPES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className={FIELD_LABEL_CLASS}>{translate('金額')}</label>
                        <input required type="number" min="0" step="any" className={CASHFLOW_INPUT_CLASS} value={cashflowForm.amount} onChange={updateCashflowField('amount')} />
                    </div>
                    <div className="space-y-1">
                        <label className={FIELD_LABEL_CLASS}>{translate('幣種')}</label>
                        <select value={cashflowForm.currency} onChange={updateCashflowField('currency')} className={CASHFLOW_INPUT_CLASS}>
                            {CURRENCIES.map(currency => <option key={currency} value={currency}>{currency}</option>)}
                        </select>
                    </div>
                    {!isCashflowOneTime && (
                        <div className="space-y-1">
                            <label className={FIELD_LABEL_CLASS}>{translate('頻率')}</label>
                            <select value={cashflowForm.frequency} onChange={updateCashflowField('frequency')} className={CASHFLOW_INPUT_CLASS}>
                                {CASHFLOW_FREQUENCIES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                            </select>
                        </div>
                    )}
                    {isCashflowOneTime ? (
                        <OneTimeCalendarSelector
                            cashflowForm={cashflowForm}
                            FIELD_LABEL_CLASS={FIELD_LABEL_CLASS}
                            CASHFLOW_INPUT_CLASS={CASHFLOW_INPUT_CLASS}
                            toggleCashflowOneTimeDate={toggleCashflowOneTimeDate}
                            updateCashflowOneTimeMonth={updateCashflowOneTimeMonth}
                            applyCashflowOneTimeMonthPreset={applyCashflowOneTimeMonthPreset}
                            clearCashflowOneTimeDates={clearCashflowOneTimeDates}
                            parseDateKey={parseDateKey}
                            toDateKey={toDateKey}
                            pageLanguage={pageLanguage}
                        />
                    ) : (
                        <div className="space-y-1">
                            <label className={FIELD_LABEL_CLASS}>{translate('開始日期')}</label>
                            <input required type="date" className={CASHFLOW_INPUT_CLASS} value={cashflowForm.startDate} onChange={updateCashflowField('startDate')} />
                        </div>
                    )}
                    {isCashflowMonthlyRecurring && (
                        <div className="space-y-1">
                            <label className={FIELD_LABEL_CLASS}>{translate('每月記錄日')}</label>
                            <input type="number" min="1" max="31" step="1" className={CASHFLOW_INPUT_CLASS} value={cashflowForm.payday} onChange={updateCashflowField('payday')} />
                            <div className="text-[10px] text-slate-400 font-bold ml-1">{tByLang('若超過當月天數，系統會自動記錄在月底。', 'If it exceeds the month length, it will record on the last day.', '月の日数を超える場合は月末に記録します。')}</div>
                        </div>
                    )}
                    {!isCashflowOneTime && (
                        <div className={`space-y-1 ${isCashflowMonthlyRecurring ? '' : 'col-span-2'}`}>
                            <label className={FIELD_LABEL_CLASS}>{translate('結束日期')}</label>
                            <input type="date" className={CASHFLOW_INPUT_CLASS} value={cashflowForm.endDate} onChange={updateCashflowField('endDate')} />
                            <div className="text-[10px] text-slate-400 font-bold ml-1">{tByLang('可留空：留空代表長期規則（沒有結束日期）。', 'Optional: leave empty for ongoing rules (no end date).', '任意：空欄の場合は長期ルール（終了日なし）となります。')}</div>
                        </div>
                    )}
                </div>

                <details className="rounded-xl theme-surface p-3">
                    <summary className="list-none cursor-pointer text-xs font-black theme-text-sub flex items-center justify-between">
                        {tByLang('進階欄位（可選）', 'Advanced Fields (Optional)', '詳細項目（任意）')}
                    </summary>
                    <div className="mt-3 space-y-3">
                        <div className="space-y-1">
                            <label className={FIELD_LABEL_CLASS}>{translate('入帳/扣款帳戶（流動資金）')}</label>
                            <select value={cashflowForm.targetLiquidAssetId} onChange={updateCashflowTargetLiquidAsset} className={CASHFLOW_INPUT_CLASS}>
                                <option value="">{tByLang('只做現金流記錄（不自動入帳）', 'Record cashflow only (no auto posting)', '現金流のみ記録（自動入出金なし）')}</option>
                                {liquidAssetOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className={FIELD_LABEL_CLASS}>{translate('帳戶')}</label>
                            <input
                                type="text"
                                list="cashflow-account-options"
                                placeholder={tByLang('可選，僅用於標記', 'Optional, for labeling only', '任意（ラベル用途のみ）')}
                                className={`${CASHFLOW_INPUT_FOCUS_CLASS} disabled:bg-slate-100 disabled:text-slate-400`}
                                value={cashflowForm.account}
                                onChange={updateCashflowField('account')}
                                disabled={Boolean(cashflowForm.targetLiquidAssetId)}
                            />
                            {cashflowForm.targetLiquidAssetId && (
                                <div className="text-[10px] text-slate-400 font-bold ml-1">{tByLang('已綁定流動資金帳戶，會在符合規則日期時入帳/扣款。', 'Linked to a liquid account; it will post on schedule dates.', '流動資金口座に連携済み。該当日に入出金されます。')}</div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <label className={FIELD_LABEL_CLASS}>{translate('分類')}</label>
                            <select value={cashflowForm.category} onChange={updateCashflowField('category')} className={CASHFLOW_INPUT_CLASS}>
                                {availableCashflowCategories.map(item => <option key={item} value={item}>{item}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className={FIELD_LABEL_CLASS}>{translate('備註')}</label>
                            <input
                                type="text"
                                placeholder={tByLang('例如：每月 25 號入帳／扣款', 'e.g. post on the 25th each month', '例：毎月25日に入出金')}
                                className={CASHFLOW_INPUT_FOCUS_CLASS}
                                value={cashflowForm.note}
                                onChange={updateCashflowField('note')}
                            />
                        </div>
                    </div>
                </details>

                <button type="submit" className="w-full theme-btn-primary text-white px-4 py-3 rounded-xl font-black text-sm transition-all">
                    {editingCashflowId ? tByLang('儲存規則修改', 'Save Changes', '変更を保存') : tByLang('新增現金流', 'Add Cashflow', 'キャッシュフローを追加')}
                </button>
            </div>

            <div className="hidden md:block space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
                    <div className="space-y-1 xl:col-span-2">
                        <label className={FIELD_LABEL_CLASS}>{translate('項目名稱')}</label>
                        <input
                            required
                            type="text"
                            placeholder={translate('例如：每月租金、兼職收入、每日午餐')}
                            className={CASHFLOW_INPUT_FOCUS_CLASS}
                            value={cashflowForm.title}
                            onChange={updateCashflowField('title')}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className={FIELD_LABEL_CLASS}>{translate('收支類型')}</label>
                        <select
                            value={cashflowForm.type}
                            onChange={updateCashflowType}
                            className={CASHFLOW_INPUT_CLASS}
                        >
                            {Object.entries(CASHFLOW_TYPES).map(([key, item]) => (
                                <option key={key} value={key}>{item.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className={FIELD_LABEL_CLASS}>{translate('記錄類型')}</label>
                        <select
                            value={cashflowForm.scheduleType}
                            onChange={updateCashflowField('scheduleType')}
                            className={CASHFLOW_INPUT_CLASS}
                        >
                            {CASHFLOW_SCHEDULE_TYPES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className={FIELD_LABEL_CLASS}>{translate('入帳/扣款帳戶（流動資金）')}</label>
                        <select
                            value={cashflowForm.targetLiquidAssetId}
                            onChange={updateCashflowTargetLiquidAsset}
                            className={CASHFLOW_INPUT_CLASS}
                        >
                            <option value="">{tByLang('只做現金流記錄（不自動入帳）', 'Record cashflow only (no auto posting)', '現金流のみ記録（自動入出金なし）')}</option>
                            {liquidAssetOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className={FIELD_LABEL_CLASS}>{translate('帳戶')}</label>
                        <input
                            type="text"
                            list="cashflow-account-options"
                            placeholder={tByLang('可選，僅用於標記', 'Optional, for labeling only', '任意（ラベル用途のみ）')}
                            className={`${CASHFLOW_INPUT_FOCUS_CLASS} disabled:bg-slate-100 disabled:text-slate-400`}
                            value={cashflowForm.account}
                            onChange={updateCashflowField('account')}
                            disabled={Boolean(cashflowForm.targetLiquidAssetId)}
                        />
                        {cashflowForm.targetLiquidAssetId && (
                            <div className="text-[10px] text-slate-400 font-bold ml-1">{tByLang('已綁定流動資金帳戶，會在符合規則日期時入帳/扣款（單次或固定）。', 'Linked to a liquid account; it will post on schedule dates (one-time or recurring).', '流動資金口座に連携済み。該当日に入出金されます（単発/定期）。')}</div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
                    <div className="space-y-1">
                        <label className={FIELD_LABEL_CLASS}>{translate('金額')}</label>
                        <input
                            required
                            type="number"
                            min="0"
                            step="any"
                            className={CASHFLOW_INPUT_CLASS}
                            value={cashflowForm.amount}
                            onChange={updateCashflowField('amount')}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className={FIELD_LABEL_CLASS}>{translate('幣種')}</label>
                        <select
                            value={cashflowForm.currency}
                            onChange={updateCashflowField('currency')}
                            className={CASHFLOW_INPUT_CLASS}
                        >
                            {CURRENCIES.map(currency => <option key={currency} value={currency}>{currency}</option>)}
                        </select>
                    </div>
                    {!isCashflowOneTime && (
                        <div className="space-y-1">
                            <label className={FIELD_LABEL_CLASS}>{translate('頻率')}</label>
                            <select
                                value={cashflowForm.frequency}
                                onChange={updateCashflowField('frequency')}
                                className={CASHFLOW_INPUT_CLASS}
                            >
                                {CASHFLOW_FREQUENCIES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                            </select>
                        </div>
                    )}
                    {isCashflowOneTime ? (
                        <OneTimeCalendarSelector
                            cashflowForm={cashflowForm}
                            FIELD_LABEL_CLASS={FIELD_LABEL_CLASS}
                            CASHFLOW_INPUT_CLASS={CASHFLOW_INPUT_CLASS}
                            toggleCashflowOneTimeDate={toggleCashflowOneTimeDate}
                            updateCashflowOneTimeMonth={updateCashflowOneTimeMonth}
                            applyCashflowOneTimeMonthPreset={applyCashflowOneTimeMonthPreset}
                            clearCashflowOneTimeDates={clearCashflowOneTimeDates}
                            parseDateKey={parseDateKey}
                            toDateKey={toDateKey}
                            pageLanguage={pageLanguage}
                        />
                    ) : (
                        <div className="space-y-1">
                            <label className={FIELD_LABEL_CLASS}>{translate('開始日期')}</label>
                            <input
                                required
                                type="date"
                                className={CASHFLOW_INPUT_CLASS}
                                value={cashflowForm.startDate}
                                onChange={updateCashflowField('startDate')}
                            />
                        </div>
                    )}
                    {isCashflowMonthlyRecurring && (
                        <div className="space-y-1">
                            <label className={FIELD_LABEL_CLASS}>{translate('每月記錄日')}</label>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                step="1"
                                className={CASHFLOW_INPUT_CLASS}
                                value={cashflowForm.payday}
                                onChange={updateCashflowField('payday')}
                            />
                            <div className="text-[10px] text-slate-400 font-bold ml-1">{tByLang('若超過當月天數，系統會自動記錄在月底。', 'If it exceeds the month length, it will record on the last day.', '月の日数を超える場合は月末に記録します。')}</div>
                        </div>
                    )}
                    {!isCashflowOneTime && (
                        <div className="space-y-1">
                            <label className={FIELD_LABEL_CLASS}>{translate('結束日期')}</label>
                            <input
                                type="date"
                                className={CASHFLOW_INPUT_CLASS}
                                value={cashflowForm.endDate}
                                onChange={updateCashflowField('endDate')}
                            />
                            <div className="text-[10px] text-slate-400 font-bold ml-1">{tByLang('可留空：留空代表長期規則（沒有結束日期）。', 'Optional: leave empty for ongoing rules (no end date).', '任意：空欄の場合は長期ルール（終了日なし）となります。')}</div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
                    <div className="space-y-1">
                        <label className={FIELD_LABEL_CLASS}>{translate('分類')}</label>
                        <select
                            value={cashflowForm.category}
                            onChange={updateCashflowField('category')}
                            className={CASHFLOW_INPUT_CLASS}
                        >
                            {availableCashflowCategories.map(item => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1 xl:col-span-2">
                        <label className={FIELD_LABEL_CLASS}>{translate('備註')}</label>
                        <input
                            type="text"
                            placeholder={tByLang('例如：每月 25 號入帳／扣款', 'e.g. post on the 25th each month', '例：毎月25日に入出金')}
                            className={CASHFLOW_INPUT_FOCUS_CLASS}
                            value={cashflowForm.note}
                            onChange={updateCashflowField('note')}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full theme-btn-primary text-white px-4 py-3 rounded-xl font-black text-sm transition-all"
                    >
                        {editingCashflowId ? tByLang('儲存規則修改', 'Save Changes', '変更を保存') : tByLang('新增現金流', 'Add Cashflow', 'キャッシュフローを追加')}
                    </button>
                </div>
            </div>
        </form>
        );
    };

    window.APP_CASHFLOW_FORM_VIEW = {
        CashflowRuleForm
    };
})();
