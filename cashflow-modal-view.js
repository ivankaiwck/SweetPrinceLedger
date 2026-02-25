(() => {
    const CashflowModalView = ({
        isOpen,
        onClose,
        editingCashflowId,
        cashflowFormRef,
        handleCashflowSubmit,
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
        pageLanguage,
        CashflowRuleForm
    }) => {
        if (!isOpen) return null;

        const tByLang = (zh, en, ja) => (pageLanguage === 'en-US' ? en : (pageLanguage === 'ja-JP' ? ja : zh));

        return (
            <div className="fixed inset-0 z-50 flex items-stretch md:items-center justify-center p-0 md:p-4 modal-overlay">
                <div className="theme-modal-shell w-full h-[100dvh] md:h-auto md:w-[96vw] md:max-w-6xl md:max-h-[90vh] md:rounded-3xl shadow-2xl overflow-hidden">
                    <div className="theme-modal-header px-5 md:px-8 py-4 md:py-6 flex justify-between items-center sticky top-0 z-10">
                        <h3 className="theme-modal-title font-black text-xl">
                            {editingCashflowId
                                ? tByLang('編輯現金流', 'Edit Cashflow', 'キャッシュフローを編集')
                                : tByLang('新增現金流', 'Add Cashflow', 'キャッシュフローを追加')}
                        </h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="theme-modal-close flex items-center justify-center w-9 h-9 text-lg font-black"
                            aria-label={tByLang('關閉', 'Close', '閉じる')}
                        >
                            <span className="leading-none">×</span>
                        </button>
                    </div>
                    <div className="p-5 md:p-8 pb-24 md:pb-8 h-[calc(100dvh-96px)] md:h-auto md:max-h-[calc(90vh-96px)] overflow-y-auto overscroll-y-contain custom-scrollbar">
                        <CashflowRuleForm
                            cashflowFormRef={cashflowFormRef}
                            handleCashflowSubmit={handleCashflowSubmit}
                            editingCashflowId={editingCashflowId}
                            cashflowEntries={cashflowEntries}
                            cashflowAccountOptions={cashflowAccountOptions}
                            FIELD_LABEL_CLASS={FIELD_LABEL_CLASS}
                            CASHFLOW_INPUT_CLASS={CASHFLOW_INPUT_CLASS}
                            CASHFLOW_INPUT_FOCUS_CLASS={CASHFLOW_INPUT_FOCUS_CLASS}
                            cashflowForm={cashflowForm}
                            updateCashflowField={updateCashflowField}
                            toggleCashflowOneTimeDate={toggleCashflowOneTimeDate}
                            updateCashflowOneTimeMonth={updateCashflowOneTimeMonth}
                            applyCashflowOneTimeMonthPreset={applyCashflowOneTimeMonthPreset}
                            clearCashflowOneTimeDates={clearCashflowOneTimeDates}
                            updateCashflowType={updateCashflowType}
                            updateCashflowTargetLiquidAsset={updateCashflowTargetLiquidAsset}
                            CASHFLOW_TYPES={CASHFLOW_TYPES}
                            CASHFLOW_SCHEDULE_TYPES={CASHFLOW_SCHEDULE_TYPES}
                            liquidAssetOptions={liquidAssetOptions}
                            CURRENCIES={CURRENCIES}
                            isCashflowOneTime={isCashflowOneTime}
                            isCashflowMonthlyRecurring={isCashflowMonthlyRecurring}
                            CASHFLOW_FREQUENCIES={CASHFLOW_FREQUENCIES}
                            availableCashflowCategories={availableCashflowCategories}
                            parseDateKey={parseDateKey}
                            toDateKey={toDateKey}
                            pageLanguage={pageLanguage}
                        />
                    </div>
                </div>
            </div>
        );
    };

    window.APP_CASHFLOW_MODAL_VIEW = {
        CashflowModalView
    };
})();
