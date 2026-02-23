(() => {
    const AssetModalView = ({
        isModalOpen,
        editingId,
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

        return (
            <div className="fixed inset-0 z-50 flex items-stretch md:items-center justify-center p-0 md:p-4 modal-overlay">
                <div className="theme-modal-shell w-full h-full md:h-auto md:max-w-xl md:rounded-3xl shadow-2xl overflow-hidden">
                    <div className="theme-modal-header px-5 md:px-8 py-4 md:py-6 flex justify-between items-center sticky top-0 z-10">
                        <h3 className="theme-modal-title font-black text-xl">{editingId ? '編輯資產' : '新增資產'}</h3>
                        <button onClick={onClose} className="theme-modal-close"><i data-lucide="x"></i></button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-5 md:p-8 space-y-4 h-[calc(100vh-96px)] md:h-auto md:max-h-[75vh] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            <div className={`space-y-1 ${(isLiquidForm && !editingId) ? 'col-span-2' : ''}`}>
                                <label className={FIELD_LABEL_CLASS}>帳戶 / 機構</label>
                                <input required type="text" placeholder="例如：富途、中銀、大豐" className={MODAL_INPUT_FOCUS_CLASS} value={formData.account} onChange={updateFormField('account')} />
                                {isLiquidForm && !editingId && <div className="text-[10px] text-slate-400 font-bold">名稱將依幣種與細項自動產生</div>}
                            </div>
                            {(!isLiquidForm || editingId) && (
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>資產名稱{isLiquidForm && editingId ? ' (選填)' : ''}</label>
                                    <input
                                        required={!isLiquidForm}
                                        type="text"
                                        placeholder={isLiquidForm && editingId ? '留空則自動以幣種/細項命名' : '例如：AAPL、儲蓄帳戶'}
                                        className={MODAL_INPUT_FOCUS_CLASS}
                                        value={formData.name}
                                        onChange={updateFormField('name')}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            <div className="space-y-1">
                                <label className={FIELD_LABEL_CLASS}>類別</label>
                                <select
                                    className={MODAL_INPUT_CLASS}
                                    value={formData.category}
                                    onChange={onCategoryChange}
                                >
                                    {Object.entries(CATEGORIES).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className={FIELD_LABEL_CLASS}>細項</label>
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
                                <div className="md:col-span-2 theme-form-group-title"><span className="theme-form-group-icon">🧮</span>資產數值</div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>{isLiquidForm ? '金額' : '數量'}</label>
                                    <input required type="number" step="any" className={MODAL_INPUT_CLASS} value={formData.quantity} onChange={updateFormField('quantity')} />
                                </div>
                                {!isLiquidForm && (
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>成本單價</label>
                                        <input required type="number" step="any" className={MODAL_INPUT_CLASS} value={formData.costBasis} onChange={updateFormField('costBasis')} />
                                    </div>
                                )}
                            </div>
                        )}

                        {isFixedDepositForm && (
                            <div className={`${MODAL_GROUP_CLASS} space-y-4`}>
                                <div className="theme-form-group-title"><span className="theme-form-group-icon">🏦</span>定期存款設定</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>本金</label>
                                        <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.fixedDepositPrincipal} onChange={updateFormField('fixedDepositPrincipal')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>年利率 (%)</label>
                                        <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.fixedDepositAnnualRate} onChange={updateFormField('fixedDepositAnnualRate')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>存期 (月)</label>
                                        <input required type="number" step="1" min="1" className={MODAL_INPUT_CLASS} value={formData.fixedDepositMonths} onChange={updateFormField('fixedDepositMonths')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>起存日 (選填)</label>
                                        <input type="date" className={MODAL_INPUT_CLASS} value={formData.fixedDepositStartDate} onChange={updateFormField('fixedDepositStartDate')} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>預估利息</label>
                                        <div className={MODAL_OUTPUT_CLASS}>{fixedDepositMetrics ? `${formatAmount(fixedDepositMetrics.interestAmount)} ${formData.currency}` : '--'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>到期本利和</label>
                                        <div className={MODAL_OUTPUT_CLASS}>{fixedDepositMetrics ? `${formatAmount(fixedDepositMetrics.maturityAmount)} ${formData.currency}` : '--'}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isMortgageForm && (
                            <div className={`${MODAL_GROUP_CLASS} space-y-4`}>
                                <div className="theme-form-group-title"><span className="theme-form-group-icon">🏠</span>房貸設定</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>樓價</label>
                                        <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.propertyPrice} onChange={updateFormField('propertyPrice')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>按揭成數 (%)</label>
                                        <input required type="number" step="any" min="0" max="100" className={MODAL_INPUT_CLASS} value={formData.ltvRatio} onChange={updateFormField('ltvRatio')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>年息 (%)</label>
                                        <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.annualInterestRate} onChange={updateFormField('annualInterestRate')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>還款年限 (年)</label>
                                        <input required type="number" step="1" min="1" className={MODAL_INPUT_CLASS} value={formData.mortgageYears} onChange={updateFormField('mortgageYears')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>已還款期數 (1個月=1期)</label>
                                        <input required type="number" step="1" min="0" className={MODAL_INPUT_CLASS} value={formData.paidPeriods} onChange={updateFormField('paidPeriods')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>總期數</label>
                                        <div className={MODAL_OUTPUT_CLASS}>{mortgageMetrics ? `${mortgageMetrics.totalPeriods} 期` : '--'}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>首期</label>
                                        <div className={MODAL_OUTPUT_CLASS}>{mortgageMetrics ? `${formatAmount(mortgageMetrics.downPayment)} ${formData.currency}` : '--'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>貸款</label>
                                        <div className={MODAL_OUTPUT_CLASS}>{mortgageMetrics ? `${formatAmount(mortgageMetrics.loanAmount)} ${formData.currency}` : '--'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>利息</label>
                                        <div className={MODAL_OUTPUT_CLASS}>{mortgageMetrics ? `${formatAmount(mortgageMetrics.totalInterest)} ${formData.currency}` : '--'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>每月還款</label>
                                        <div className={MODAL_OUTPUT_CLASS}>{mortgageMetrics ? `${formatAmount(mortgageMetrics.monthlyPayment)} ${formData.currency}` : '--'}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isLoanForm && (
                            <div className={`${MODAL_GROUP_CLASS} space-y-4`}>
                                <div className="theme-form-group-title"><span className="theme-form-group-icon">📄</span>貸款設定</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>貸款本金</label>
                                        <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.loanPrincipal} onChange={updateFormField('loanPrincipal')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>年息 (%)</label>
                                        <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.loanAnnualInterestRate} onChange={updateFormField('loanAnnualInterestRate')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>還款年限 (年)</label>
                                        <input required type="number" step="1" min="1" className={MODAL_INPUT_CLASS} value={formData.loanYears} onChange={updateFormField('loanYears')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>已還款期數 (1個月=1期)</label>
                                        <input required type="number" step="1" min="0" className={MODAL_INPUT_CLASS} value={formData.loanPaidPeriods} onChange={updateFormField('loanPaidPeriods')} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>每月還款</label>
                                        <div className={MODAL_OUTPUT_CLASS}>{loanMetrics ? `${formatAmount(loanMetrics.monthlyPayment)} ${formData.currency}` : '--'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>未償本金</label>
                                        <div className={MODAL_OUTPUT_CLASS}>{loanMetrics ? `${formatAmount(loanMetrics.outstandingPrincipal)} ${formData.currency}` : '--'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>總利息</label>
                                        <div className={MODAL_OUTPUT_CLASS}>{loanMetrics ? `${formatAmount(loanMetrics.totalInterest)} ${formData.currency}` : '--'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>總期數</label>
                                        <div className={MODAL_OUTPUT_CLASS}>{loanMetrics ? `${loanMetrics.totalPeriods} 期` : '--'}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isCreditCardForm && (
                            <div className={`${MODAL_GROUP_CLASS} grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4`}>
                                <div className="md:col-span-2 theme-form-group-title"><span className="theme-form-group-icon">💳</span>信用卡設定</div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>本期結欠</label>
                                    <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.creditCardBalance} onChange={updateFormField('creditCardBalance')} />
                                </div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>最低還款</label>
                                    <input type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.creditCardMinPayment} onChange={updateFormField('creditCardMinPayment')} />
                                </div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>到期日</label>
                                    <input type="date" className={MODAL_INPUT_CLASS} value={formData.creditCardDueDate} onChange={updateFormField('creditCardDueDate')} />
                                </div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>年息 (%)</label>
                                    <input type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.creditCardAnnualRate} onChange={updateFormField('creditCardAnnualRate')} />
                                </div>
                            </div>
                        )}

                        {isPayableForm && (
                            <div className={`${MODAL_GROUP_CLASS} grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4`}>
                                <div className="md:col-span-2 theme-form-group-title"><span className="theme-form-group-icon">📌</span>應付款設定</div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>應付款金額</label>
                                    <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.payableAmount} onChange={updateFormField('payableAmount')} />
                                </div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>到期日</label>
                                    <input type="date" className={MODAL_INPUT_CLASS} value={formData.payableDueDate} onChange={updateFormField('payableDueDate')} />
                                </div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>分期期數 (選填)</label>
                                    <input type="number" step="1" min="0" className={MODAL_INPUT_CLASS} value={formData.payableInstallments} onChange={updateFormField('payableInstallments')} />
                                </div>
                            </div>
                        )}

                        {isOtherLiabilityForm && (
                            <div className={`${MODAL_GROUP_CLASS} grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4`}>
                                <div className="md:col-span-2 theme-form-group-title"><span className="theme-form-group-icon">⚖️</span>其他負債設定</div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>未償金額</label>
                                    <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.otherOutstanding} onChange={updateFormField('otherOutstanding')} />
                                </div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>年息 (%)</label>
                                    <input type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.otherAnnualRate} onChange={updateFormField('otherAnnualRate')} />
                                </div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>到期日</label>
                                    <input type="date" className={MODAL_INPUT_CLASS} value={formData.otherDueDate} onChange={updateFormField('otherDueDate')} />
                                </div>
                            </div>
                        )}

                        {isReceivableForm && (
                            <div className={`${MODAL_GROUP_CLASS} grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4`}>
                                <div className="md:col-span-2 theme-form-group-title"><span className="theme-form-group-icon">💰</span>應收款設定</div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>應收金額</label>
                                    <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.receivableAmount} onChange={updateFormField('receivableAmount')} />
                                </div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>到期日</label>
                                    <input type="date" className={MODAL_INPUT_CLASS} value={formData.receivableDueDate} onChange={updateFormField('receivableDueDate')} />
                                </div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>分期期數 (選填)</label>
                                    <input type="number" step="1" min="0" className={MODAL_INPUT_CLASS} value={formData.receivableInstallments} onChange={updateFormField('receivableInstallments')} />
                                </div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>對象 / 公司</label>
                                    <input type="text" placeholder="例如：某公司 / 某人" className={MODAL_INPUT_CLASS} value={formData.receivableParty} onChange={updateFormField('receivableParty')} />
                                </div>
                            </div>
                        )}

                        {isFixedForm && (
                            <div className={`${MODAL_GROUP_CLASS} space-y-4`}>
                                <div className="theme-form-group-title"><span className="theme-form-group-icon">📦</span>固定資產設定</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>購入成本</label>
                                        <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.fixedPurchasePrice} onChange={updateFormField('fixedPurchasePrice')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>目前估值</label>
                                        <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.fixedCurrentValue} onChange={updateFormField('fixedCurrentValue')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>購入日期</label>
                                        <input type="date" className={MODAL_INPUT_CLASS} value={formData.fixedPurchaseDate} onChange={updateFormField('fixedPurchaseDate')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>備註</label>
                                        <input type="text" placeholder="例如：地址、車牌或備註" className={MODAL_INPUT_CLASS} value={formData.fixedNote} onChange={updateFormField('fixedNote')} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {needsPremium && (
                            <div className={`${MODAL_GROUP_CLASS} grid grid-cols-2 gap-4`}>
                                <div className="col-span-2 theme-form-group-title"><span className="theme-form-group-icon">🛡️</span>保費設定</div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>每期保費</label>
                                    <input required type="number" step="any" className={MODAL_INPUT_CLASS} value={formData.premiumAmount} onChange={updateFormField('premiumAmount')} />
                                </div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>繳費週期</label>
                                    <select className={MODAL_INPUT_CLASS} value={formData.premiumFrequency} onChange={updateFormField('premiumFrequency')}>
                                        <option value="monthly">每月</option>
                                        <option value="yearly">每年</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>已繳期數</label>
                                    <input required type="number" step="1" min="0" className={MODAL_INPUT_CLASS} value={formData.premiumPaidCount} onChange={updateFormField('premiumPaidCount')} />
                                </div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>已繳總保費</label>
                                    <div className={MODAL_OUTPUT_CLASS}>{formatAmount(premiumTotal)} {formData.currency}</div>
                                </div>
                            </div>
                        )}

                        <div className={`${MODAL_GROUP_CLASS} grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4`}>
                            <div className="md:col-span-2 theme-form-group-title"><span className="theme-form-group-icon">🌍</span>幣種與代號</div>
                            <div className="space-y-1">
                                <label className={FIELD_LABEL_CLASS}>計價幣種</label>
                                <select className={MODAL_INPUT_CLASS} value={formData.currency} onChange={updateFormField('currency')}>
                                    {CURRENCIES.map(currency => <option key={currency} value={currency}>{currency}</option>)}
                                </select>
                            </div>
                            {(isInvestForm && (isCryptoForm || isStockForm || isFundForm)) && (
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>
                                        {isCryptoForm ? '幣種代號 (必填)' : isFundForm ? '基金代號 (必填)' : '股票代號 (必填)'}
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
                                <label className={FIELD_LABEL_CLASS}>當前現價 (手動修正)</label>
                                <input type="number" step="any" className={MODAL_INPUT_CLASS} value={formData.currentPrice} onChange={updateFormField('currentPrice')} />
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            {editingId && (
                                <button type="button" onClick={() => handleDelete(editingId)} className="flex-1 theme-btn-danger text-white py-4 rounded-xl font-black transition-all shadow-sm">
                                    刪除資產
                                </button>
                            )}
                            <button type="submit" className="flex-[2] theme-btn-primary text-white py-4 rounded-xl font-black transition-all shadow-lg">
                                {editingId ? '確認修改' : '儲存資產'}
                            </button>
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
