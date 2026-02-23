(() => {
    const AssetModalView = ({
        isModalOpen,
        editingId,
        pageLanguage,
        onClose,
        handleSubmit,
        FIELD_LABEL_CLASS,
        MODAL_INPUT_CLASS,
        MODAL_INPUT_FOCUS_CLASS,
        MODAL_OUTPUT_CLASS,
        MODAL_GROUP_CLASS,
        isLiquidForm,
        isInvestForm,
        isCryptoForm,
        isStockForm,
        isFundForm,
        isFixedDepositForm,
        isMortgageForm,
        isLoanForm,
        isCreditCardForm,
        isPayableForm,
        isOtherLiabilityForm,
        isLiabilityForm,
        isReceivableForm,
        isFixedForm,
        needsPremium,
        formData,
        updateFormField,
        updateFormFieldUpper,
        CATEGORIES,
        onCategoryChange,
        onSubtypeChange,
        fixedDepositMetrics,
        mortgageMetrics,
        loanMetrics,
        formatAmount,
        premiumTotal,
        CURRENCIES,
        handleDelete
    }) => {
        if (!isModalOpen) return null;

        const { FULL_PAGE_TEXT_MAP } = window.APP_I18N || {};
        const dictionary = (FULL_PAGE_TEXT_MAP || {})[pageLanguage] || {};
        const translate = (text) => (pageLanguage === 'zh-Hant' ? text : (dictionary[text] || text));
        const tByLang = (zh, en, ja) => (pageLanguage === 'en-US' ? en : (pageLanguage === 'ja-JP' ? ja : zh));
        const formatPeriods = (value) => tByLang(`${value} 期`, `${value} terms`, `${value}期`);
        const { DatePicker } = window.APP_DATE_PICKER || {};
        if (!DatePicker) {
            throw new Error('date-picker-view.js is missing or incomplete.');
        }

        return (
            <div className="fixed inset-0 z-50 flex items-stretch md:items-center justify-center p-0 md:p-4 modal-overlay">
                <div className="theme-modal-shell w-full h-full md:h-auto md:w-[96vw] md:max-w-6xl md:max-h-[90vh] md:rounded-3xl shadow-2xl overflow-hidden">
                    <div className="theme-modal-header px-5 md:px-8 py-4 md:py-6 flex justify-between items-center sticky top-0 z-10">
                        <h3 className="theme-modal-title font-black text-xl">{editingId ? translate('編輯資產') : translate('新增資產')}</h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="theme-modal-close flex items-center justify-center w-9 h-9 text-lg font-black"
                            aria-label={tByLang('關閉', 'Close', '閉じる')}
                        >
                            <span className="leading-none">×</span>
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-5 md:p-8 space-y-4 h-[calc(100vh-96px)] md:h-auto md:max-h-[calc(90vh-96px)] overflow-y-auto custom-scrollbar">
                        <div className="rounded-2xl theme-soft-surface p-4 md:p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            <div className={`space-y-1 ${(isLiquidForm && !editingId) ? 'col-span-2' : ''}`}>
                                <label className={FIELD_LABEL_CLASS}>{translate('帳戶 / 機構')}</label>
                                <input required type="text" placeholder={translate('例如：富途、中銀、大豐')} className={MODAL_INPUT_FOCUS_CLASS} value={formData.account} onChange={updateFormField('account')} />
                                {isLiquidForm && !editingId && <div className="text-[10px] text-slate-400 font-bold">{translate('名稱將依幣種與細項自動產生')}</div>}
                            </div>
                            {(!isLiquidForm || editingId) && (
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>{isLiquidForm && editingId ? translate('資產名稱 (選填)') : translate('資產名稱')}</label>
                                    <input
                                        required={!isLiquidForm}
                                        type="text"
                                        placeholder={translate(isLiquidForm && editingId ? '留空則自動以幣種/細項命名' : '例如：AAPL、儲蓄帳戶')}
                                        className={MODAL_INPUT_FOCUS_CLASS}
                                        value={formData.name}
                                        onChange={updateFormField('name')}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            <div className="space-y-1">
                                <label className={FIELD_LABEL_CLASS}>{translate('類別')}</label>
                                <select
                                    className={MODAL_INPUT_CLASS}
                                    value={formData.category}
                                    onChange={onCategoryChange}
                                >
                                    {Object.entries(CATEGORIES).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className={FIELD_LABEL_CLASS}>{translate('細項')}</label>
                                <select
                                    className={MODAL_INPUT_CLASS}
                                    value={formData.subtype}
                                    onChange={onSubtypeChange}
                                >
                                    {CATEGORIES[formData.category].subtypes.map(subtype => <option key={subtype} value={subtype}>{subtype}</option>)}
                                </select>
                            </div>
                        </div>

                        {!needsPremium && !isMortgageForm && !isLiabilityForm && !isReceivableForm && !isFixedForm && !isFixedDepositForm && (
                            <div className={`${MODAL_GROUP_CLASS} grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4`}>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>{isLiquidForm ? translate('金額') : translate('數量')}</label>
                                    <input required type="number" step="any" className={MODAL_INPUT_CLASS} value={formData.quantity} onChange={updateFormField('quantity')} />
                                </div>
                                {!isLiquidForm && (
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('成本單價')}</label>
                                        <input required type="number" step="any" className={MODAL_INPUT_CLASS} value={formData.costBasis} onChange={updateFormField('costBasis')} />
                                    </div>
                                )}
                            </div>
                        )}


                        {isFixedDepositForm && (
                            <div className={`${MODAL_GROUP_CLASS} space-y-4`}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('本金')}</label>
                                        <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.fixedDepositPrincipal} onChange={updateFormField('fixedDepositPrincipal')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('年利率 (%)')}</label>
                                        <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.fixedDepositAnnualRate} onChange={updateFormField('fixedDepositAnnualRate')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('存期 (月)')}</label>
                                        <input required type="number" step="1" min="1" className={MODAL_INPUT_CLASS} value={formData.fixedDepositMonths} onChange={updateFormField('fixedDepositMonths')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('起存日 (選填)')}</label>
                                        <DatePicker
                                            value={formData.fixedDepositStartDate}
                                            onChange={updateFormField('fixedDepositStartDate')}
                                            className={MODAL_INPUT_CLASS}
                                            pageLanguage={pageLanguage}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('預估利息')}</label>
                                        <div className={MODAL_OUTPUT_CLASS}>{fixedDepositMetrics ? `${formatAmount(fixedDepositMetrics.interestAmount)} ${formData.currency}` : '--'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('到期本利和')}</label>
                                        <div className={MODAL_OUTPUT_CLASS}>{fixedDepositMetrics ? `${formatAmount(fixedDepositMetrics.maturityAmount)} ${formData.currency}` : '--'}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isMortgageForm && (
                            <div className={`${MODAL_GROUP_CLASS} space-y-4`}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('樓價')}</label>
                                        <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.propertyPrice} onChange={updateFormField('propertyPrice')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('按揭成數 (%)')}</label>
                                        <input required type="number" step="any" min="0" max="100" className={MODAL_INPUT_CLASS} value={formData.ltvRatio} onChange={updateFormField('ltvRatio')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('年息 (%)')}</label>
                                        <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.annualInterestRate} onChange={updateFormField('annualInterestRate')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('還款年限 (年)')}</label>
                                        <input required type="number" step="1" min="1" className={MODAL_INPUT_CLASS} value={formData.mortgageYears} onChange={updateFormField('mortgageYears')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('已還款期數 (1個月=1期)')}</label>
                                        <input required type="number" step="1" min="0" className={MODAL_INPUT_CLASS} value={formData.paidPeriods} onChange={updateFormField('paidPeriods')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('總期數')}</label>
                                        <div className={MODAL_OUTPUT_CLASS}>{mortgageMetrics ? formatPeriods(mortgageMetrics.totalPeriods) : '--'}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('首期')}</label>
                                        <div className={MODAL_OUTPUT_CLASS}>{mortgageMetrics ? `${formatAmount(mortgageMetrics.downPayment)} ${formData.currency}` : '--'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('貸款')}</label>
                                        <div className={MODAL_OUTPUT_CLASS}>{mortgageMetrics ? `${formatAmount(mortgageMetrics.loanAmount)} ${formData.currency}` : '--'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('利息')}</label>
                                        <div className={MODAL_OUTPUT_CLASS}>{mortgageMetrics ? `${formatAmount(mortgageMetrics.totalInterest)} ${formData.currency}` : '--'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('每月還款')}</label>
                                        <div className={MODAL_OUTPUT_CLASS}>{mortgageMetrics ? `${formatAmount(mortgageMetrics.monthlyPayment)} ${formData.currency}` : '--'}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isLoanForm && (
                            <div className={`${MODAL_GROUP_CLASS} space-y-4`}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('貸款本金')}</label>
                                        <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.loanPrincipal} onChange={updateFormField('loanPrincipal')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('年息 (%)')}</label>
                                        <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.loanAnnualInterestRate} onChange={updateFormField('loanAnnualInterestRate')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('還款年限 (年)')}</label>
                                        <input required type="number" step="1" min="1" className={MODAL_INPUT_CLASS} value={formData.loanYears} onChange={updateFormField('loanYears')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('已還款期數 (1個月=1期)')}</label>
                                        <input required type="number" step="1" min="0" className={MODAL_INPUT_CLASS} value={formData.loanPaidPeriods} onChange={updateFormField('loanPaidPeriods')} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('每月還款')}</label>
                                        <div className={MODAL_OUTPUT_CLASS}>{loanMetrics ? `${formatAmount(loanMetrics.monthlyPayment)} ${formData.currency}` : '--'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('未償本金')}</label>
                                        <div className={MODAL_OUTPUT_CLASS}>{loanMetrics ? `${formatAmount(loanMetrics.outstandingPrincipal)} ${formData.currency}` : '--'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('總利息')}</label>
                                        <div className={MODAL_OUTPUT_CLASS}>{loanMetrics ? `${formatAmount(loanMetrics.totalInterest)} ${formData.currency}` : '--'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('總期數')}</label>
                                        <div className={MODAL_OUTPUT_CLASS}>{loanMetrics ? formatPeriods(loanMetrics.totalPeriods) : '--'}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isCreditCardForm && (
                            <div className={`${MODAL_GROUP_CLASS} grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4`}>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>{translate('本期結欠')}</label>
                                    <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.creditCardBalance} onChange={updateFormField('creditCardBalance')} />
                                </div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>{translate('最低還款')}</label>
                                    <input type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.creditCardMinPayment} onChange={updateFormField('creditCardMinPayment')} />
                                </div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>{translate('到期日')}</label>
                                    <DatePicker
                                        value={formData.creditCardDueDate}
                                        onChange={updateFormField('creditCardDueDate')}
                                        className={MODAL_INPUT_CLASS}
                                        pageLanguage={pageLanguage}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>{translate('年息 (%)')}</label>
                                    <input type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.creditCardAnnualRate} onChange={updateFormField('creditCardAnnualRate')} />
                                </div>
                            </div>
                        )}

                        {isPayableForm && (
                            <div className={`${MODAL_GROUP_CLASS} grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4`}>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>{translate('應付款金額')}</label>
                                    <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.payableAmount} onChange={updateFormField('payableAmount')} />
                                </div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>{translate('到期日')}</label>
                                    <DatePicker
                                        value={formData.payableDueDate}
                                        onChange={updateFormField('payableDueDate')}
                                        className={MODAL_INPUT_CLASS}
                                        pageLanguage={pageLanguage}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>{translate('分期期數 (選填)')}</label>
                                    <input type="number" step="1" min="0" className={MODAL_INPUT_CLASS} value={formData.payableInstallments} onChange={updateFormField('payableInstallments')} />
                                </div>
                            </div>
                        )}

                        {isOtherLiabilityForm && (
                            <div className={`${MODAL_GROUP_CLASS} grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4`}>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>{translate('未償金額')}</label>
                                    <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.otherOutstanding} onChange={updateFormField('otherOutstanding')} />
                                </div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>{translate('年息 (%)')}</label>
                                    <input type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.otherAnnualRate} onChange={updateFormField('otherAnnualRate')} />
                                </div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>{translate('到期日')}</label>
                                    <DatePicker
                                        value={formData.otherDueDate}
                                        onChange={updateFormField('otherDueDate')}
                                        className={MODAL_INPUT_CLASS}
                                        pageLanguage={pageLanguage}
                                    />
                                </div>
                            </div>
                        )}

                        {isReceivableForm && (
                            <div className={`${MODAL_GROUP_CLASS} grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4`}>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>{translate('應收金額')}</label>
                                    <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.receivableAmount} onChange={updateFormField('receivableAmount')} />
                                </div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>{translate('到期日')}</label>
                                    <DatePicker
                                        value={formData.receivableDueDate}
                                        onChange={updateFormField('receivableDueDate')}
                                        className={MODAL_INPUT_CLASS}
                                        pageLanguage={pageLanguage}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>{translate('分期期數 (選填)')}</label>
                                    <input type="number" step="1" min="0" className={MODAL_INPUT_CLASS} value={formData.receivableInstallments} onChange={updateFormField('receivableInstallments')} />
                                </div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>{translate('對象 / 公司')}</label>
                                    <input type="text" placeholder={translate('例如：某公司 / 某人')} className={MODAL_INPUT_CLASS} value={formData.receivableParty} onChange={updateFormField('receivableParty')} />
                                </div>
                            </div>
                        )}

                        {isFixedForm && (
                            <div className={`${MODAL_GROUP_CLASS} space-y-4`}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('購入成本')}</label>
                                        <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.fixedPurchasePrice} onChange={updateFormField('fixedPurchasePrice')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('目前估值')}</label>
                                        <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.fixedCurrentValue} onChange={updateFormField('fixedCurrentValue')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('購入日期')}</label>
                                        <DatePicker
                                            value={formData.fixedPurchaseDate}
                                            onChange={updateFormField('fixedPurchaseDate')}
                                            className={MODAL_INPUT_CLASS}
                                            pageLanguage={pageLanguage}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('備註')}</label>
                                        <input type="text" placeholder={translate('例如：地址、車牌或備註')} className={MODAL_INPUT_CLASS} value={formData.fixedNote} onChange={updateFormField('fixedNote')} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {needsPremium && (
                            <div className={`${MODAL_GROUP_CLASS} grid grid-cols-2 gap-4`}>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>{translate('每期保費')}</label>
                                    <input required type="number" step="any" className={MODAL_INPUT_CLASS} value={formData.premiumAmount} onChange={updateFormField('premiumAmount')} />
                                </div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>{translate('繳費週期')}</label>
                                    <select className={MODAL_INPUT_CLASS} value={formData.premiumFrequency} onChange={updateFormField('premiumFrequency')}>
                                        <option value="monthly">{translate('每月')}</option>
                                        <option value="yearly">{translate('每年')}</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>{translate('已繳期數')}</label>
                                    <input required type="number" step="1" min="0" className={MODAL_INPUT_CLASS} value={formData.premiumPaidCount} onChange={updateFormField('premiumPaidCount')} />
                                </div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>{translate('已繳總保費')}</label>
                                    <div className={MODAL_OUTPUT_CLASS}>{formatAmount(premiumTotal)} {formData.currency}</div>
                                </div>
                            </div>
                        )}

                        <div className={`${MODAL_GROUP_CLASS} grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4`}>
                            <div className="space-y-1">
                                <label className={FIELD_LABEL_CLASS}>{translate('計價幣種')}</label>
                                <select className={MODAL_INPUT_CLASS} value={formData.currency} onChange={updateFormField('currency')}>
                                    {CURRENCIES.map(currency => <option key={currency} value={currency}>{currency}</option>)}
                                </select>
                            </div>
                            {(isInvestForm && (isCryptoForm || isStockForm || isFundForm)) && (
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>
                                        {isCryptoForm ? translate('幣種代號 (必填)') : isFundForm ? translate('基金代號 (必填)') : translate('股票代號 (必填)')}
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder={isCryptoForm ? 'BTC, ETH' : isFundForm ? 'VOO, 0050' : '2330, AAPL'}
                                        className={MODAL_INPUT_CLASS}
                                        value={formData.symbol}
                                        onChange={updateFormFieldUpper('symbol')}
                                    />
                                </div>
                            )}
                        </div>


                        {editingId && !isLiquidForm && !needsPremium && !isMortgageForm && !isLiabilityForm && !isReceivableForm && !isFixedForm && !isFixedDepositForm && (
                            <div className="space-y-1">
                                <label className={FIELD_LABEL_CLASS}>{translate('當前現價 (手動修正)')}</label>
                                <input type="number" step="any" className={MODAL_INPUT_CLASS} value={formData.currentPrice} onChange={updateFormField('currentPrice')} />
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            {editingId && (
                                <button type="button" onClick={() => handleDelete(editingId)} className="flex-1 theme-btn-danger text-white py-4 rounded-xl font-black transition-all shadow-sm">
                                    {translate('刪除資產')}
                                </button>
                            )}
                            <button type="submit" className="flex-[2] theme-btn-primary text-white py-4 rounded-xl font-black transition-all shadow-lg">
                                {editingId ? translate('確認修改') : translate('儲存資產')}
                            </button>
                        </div>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    window.APP_ASSET_MODAL_VIEW = {
        AssetModalView
    };
})();
