(() => {
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
        updateCashflowType,
        updateCashflowTargetLiquidAsset,
        CASHFLOW_TYPES,
        CASHFLOW_SCHEDULE_TYPES,
        liquidAssetOptions,
        CURRENCIES,
        isCashflowOneTime,
        isCashflowMonthlyRecurring,
        CASHFLOW_FREQUENCIES,
        availableCashflowCategories
    }) => (
        <form ref={cashflowFormRef} onSubmit={handleCashflowSubmit} className="order-2 rounded-xl theme-soft-surface p-4 space-y-3">
            {editingCashflowId && (
                <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2 text-xs font-black text-indigo-600">
                    正在編輯規則：{cashflowEntries.find(item => item.id === editingCashflowId)?.title || '未命名規則'}
                </div>
            )}
            <datalist id="cashflow-account-options">
                {cashflowAccountOptions.map(account => <option key={account} value={account} />)}
            </datalist>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
                <div className="space-y-1 xl:col-span-2">
                    <label className={FIELD_LABEL_CLASS}>項目名稱</label>
                    <input
                        required
                        type="text"
                        placeholder="例如：每月租金、兼職收入、每日午餐"
                        className={CASHFLOW_INPUT_FOCUS_CLASS}
                        value={cashflowForm.title}
                        onChange={updateCashflowField('title')}
                    />
                </div>
                <div className="space-y-1">
                    <label className={FIELD_LABEL_CLASS}>收支類型</label>
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
                    <label className={FIELD_LABEL_CLASS}>記錄類型</label>
                    <select
                        value={cashflowForm.scheduleType}
                        onChange={updateCashflowField('scheduleType')}
                        className={CASHFLOW_INPUT_CLASS}
                    >
                        {CASHFLOW_SCHEDULE_TYPES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className={FIELD_LABEL_CLASS}>入帳/扣款帳戶（流動資金）</label>
                    <select
                        value={cashflowForm.targetLiquidAssetId}
                        onChange={updateCashflowTargetLiquidAsset}
                        className={CASHFLOW_INPUT_CLASS}
                    >
                        <option value="">只做現金流記錄（不自動入帳）</option>
                        {liquidAssetOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className={FIELD_LABEL_CLASS}>帳戶</label>
                    <input
                        type="text"
                        list="cashflow-account-options"
                        placeholder="可選，僅用於標記"
                        className={`${CASHFLOW_INPUT_FOCUS_CLASS} disabled:bg-slate-100 disabled:text-slate-400`}
                        value={cashflowForm.account}
                        onChange={updateCashflowField('account')}
                        disabled={Boolean(cashflowForm.targetLiquidAssetId)}
                    />
                    {cashflowForm.targetLiquidAssetId && (
                        <div className="text-[10px] text-slate-400 font-bold ml-1">已綁定流動資金帳戶，會在符合規則日期時入帳/扣款（單次或固定）。</div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
                <div className="space-y-1">
                    <label className={FIELD_LABEL_CLASS}>金額</label>
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
                    <label className={FIELD_LABEL_CLASS}>幣種</label>
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
                        <label className={FIELD_LABEL_CLASS}>頻率</label>
                        <select
                            value={cashflowForm.frequency}
                            onChange={updateCashflowField('frequency')}
                            className={CASHFLOW_INPUT_CLASS}
                        >
                            {CASHFLOW_FREQUENCIES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                        </select>
                    </div>
                )}
                <div className="space-y-1">
                    <label className={FIELD_LABEL_CLASS}>{isCashflowOneTime ? '記錄日期' : '開始日期'}</label>
                    <input
                        required
                        type="date"
                        className={CASHFLOW_INPUT_CLASS}
                        value={cashflowForm.startDate}
                        onChange={updateCashflowField('startDate')}
                    />
                </div>
                {isCashflowMonthlyRecurring && (
                    <div className="space-y-1">
                        <label className={FIELD_LABEL_CLASS}>每月記錄日</label>
                        <input
                            type="number"
                            min="1"
                            max="31"
                            step="1"
                            className={CASHFLOW_INPUT_CLASS}
                            value={cashflowForm.payday}
                            onChange={updateCashflowField('payday')}
                        />
                        <div className="text-[10px] text-slate-400 font-bold ml-1">若超過當月天數，系統會自動記錄在月底。</div>
                    </div>
                )}
                {!isCashflowOneTime && (
                    <div className="space-y-1">
                        <label className={FIELD_LABEL_CLASS}>結束日期</label>
                        <input
                            type="date"
                            className={CASHFLOW_INPUT_CLASS}
                            value={cashflowForm.endDate}
                            onChange={updateCashflowField('endDate')}
                        />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
                <div className="space-y-1">
                    <label className={FIELD_LABEL_CLASS}>分類</label>
                    <select
                        value={cashflowForm.category}
                        onChange={updateCashflowField('category')}
                        className={CASHFLOW_INPUT_CLASS}
                    >
                        {availableCashflowCategories.map(item => <option key={item} value={item}>{item}</option>)}
                    </select>
                </div>
                <div className="space-y-1 xl:col-span-2">
                    <label className={FIELD_LABEL_CLASS}>備註</label>
                    <input
                        type="text"
                        placeholder="例如：每月 25 號入帳／扣款"
                        className={CASHFLOW_INPUT_FOCUS_CLASS}
                        value={cashflowForm.note}
                        onChange={updateCashflowField('note')}
                    />
                </div>
                <button
                    type="submit"
                    className="w-full theme-btn-primary text-white px-4 py-3 rounded-xl font-black text-sm transition-all"
                >
                    {editingCashflowId ? '儲存規則修改' : '新增現金流規則'}
                </button>
            </div>
        </form>
    );

    window.APP_CASHFLOW_FORM_VIEW = {
        CashflowRuleForm
    };
})();
