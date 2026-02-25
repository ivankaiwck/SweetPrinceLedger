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
        isBankWealthForm,
        isMortgageForm,
        isLoanForm,
        isCreditCardForm,
        isPayableForm,
        isOtherLiabilityForm,
        isLiabilityForm,
        isReceivableForm,
        isFixedForm,
        needsPremium,
        isHealthInsuranceForm,
        isLifeWealthInsuranceForm,
        formData,
        updateFormField,
        updateFormFieldUpper,
        CATEGORIES,
        onCategoryChange,
        onSubtypeChange,
        fixedDepositMetrics,
        bankWealthMetrics,
        mortgageMetrics,
        loanMetrics,
        formatAmount,
        premiumTotal,
        CURRENCIES,
        liquidAssetOptions,
        handleDelete,
        insurancePartialWithdrawalRecords,
        loadInsurancePartialWithdrawalRecordForEdit,
        clearInsurancePartialWithdrawalEditTarget,
        deleteInsurancePartialWithdrawalRecord
    }) => {
        if (!isModalOpen) return null;

        const { FULL_PAGE_TEXT_MAP } = window.APP_I18N || {};
        const dictionary = (FULL_PAGE_TEXT_MAP || {})[pageLanguage] || {};
        const translate = (text) => (pageLanguage === 'zh-Hant' ? text : (dictionary[text] || text));
        const tByLang = (zh, en, ja) => (pageLanguage === 'en-US' ? en : (pageLanguage === 'ja-JP' ? ja : zh));
        const formatPeriods = (value) => tByLang(`${value} 期`, `${value} terms`, `${value}期`);
        const parseDateKeySafe = (value) => {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
            const [year, month, day] = String(value).split('-').map(Number);
            const parsed = new Date(year, month - 1, day);
            if (parsed.getFullYear() !== year || parsed.getMonth() !== (month - 1) || parsed.getDate() !== day) return null;
            return parsed;
        };
        const { DatePicker } = window.APP_DATE_PICKER || {};
        if (!DatePicker) {
            throw new Error('date-picker-view.js is missing or incomplete.');
        }
        const partialWithdrawalEditId = (formData.insurancePartialWithdrawalEditCashflowId || '').trim();
        const partialWithdrawalEditRecord = partialWithdrawalEditId
            ? (insurancePartialWithdrawalRecords || []).find(record => String(record.id || '') === partialWithdrawalEditId)
            : null;
        const partialWithdrawalAmountInput = Number(formData.insurancePartialWithdrawalAmount || 0);
        const partialWithdrawalMaxAmount = Math.max(0, Number(formData.insurancePolicyValue || 0) + Number(partialWithdrawalEditRecord?.amount || 0));
        const isPartialWithdrawalOverLimit = partialWithdrawalAmountInput > 0 && partialWithdrawalAmountInput > partialWithdrawalMaxAmount;
        const isInvestmentLinkedLifeSubtype = ['投資型壽險', '投資/投資相連'].includes(formData.subtype);
        const hasSupplementaryBenefit = formData.insuranceHasSupplementaryBenefit === 'yes';
        const isFundDistributionEnabled = formData.fundDistributionEnabled === 'yes';
        const isInsuranceInvestmentDistributionEnabled = formData.insuranceInvestmentDistributionEnabled === 'yes';
        const fundDistributionMode = ['cash', 'accumulate', 'reinvest'].includes(formData.fundDistributionMode) ? formData.fundDistributionMode : 'cash';
        const insuranceInvestmentDistributionMode = ['cash', 'accumulate', 'reinvest'].includes(formData.insuranceInvestmentDistributionMode) ? formData.insuranceInvestmentDistributionMode : 'cash';
        const parseInvestmentFundRows = (rawValue) => {
            const lines = String(rawValue || '')
                .split(/\r?\n/)
                .map(line => line.trim())
                .filter(Boolean);
            return lines.map(line => {
                const parts = line.split(/\||｜/).map(part => part.trim());
                return {
                    allocationPercent: parts[0] || '',
                    investmentOption: parts[1] || '',
                    codeCurrency: parts[2] || '',
                    profitLossPercent: parts[3] || '',
                    balance: parts[4] || '',
                    units: parts[5] || '',
                    unitPrice: parts[6] || '',
                    averagePrice: parts[7] || ''
                };
            });
        };
        const serializeInvestmentFundRows = (rows) => rows
            .map(row => {
                const allocationPercent = (row.allocationPercent || '').trim();
                const investmentOption = (row.investmentOption || '').trim();
                const codeCurrency = (row.codeCurrency || '').trim();
                const profitLossPercent = (row.profitLossPercent || '').trim();
                const balance = (row.balance || '').trim();
                const units = (row.units || '').trim();
                const unitPrice = (row.unitPrice || '').trim();
                const averagePrice = (row.averagePrice || '').trim();
                if (!allocationPercent && !investmentOption && !codeCurrency && !profitLossPercent && !balance && !units && !unitPrice && !averagePrice) return '';
                return [allocationPercent, investmentOption, codeCurrency, profitLossPercent, balance, units, unitPrice, averagePrice].join('｜');
            })
            .filter(Boolean)
            .join('\n');
        const investmentFundRows = (() => {
            const parsed = parseInvestmentFundRows(formData.insuranceInvestmentFundItems || '');
            return parsed.length > 0
                ? parsed
                : [{ allocationPercent: '', investmentOption: '', codeCurrency: '', profitLossPercent: '', balance: '', units: '', unitPrice: '', averagePrice: '' }];
        })();
        const syncInvestmentFundRows = (rows) => {
            const nextValue = serializeInvestmentFundRows(rows);
            updateFormField('insuranceInvestmentFundItems')({ target: { value: nextValue } });
        };
        const updateInvestmentFundRowField = (rowIndex, key, value) => {
            const nextRows = investmentFundRows.map((row, index) => (
                index === rowIndex
                    ? { ...row, [key]: value }
                    : row
            ));
            syncInvestmentFundRows(nextRows);
        };
        const addInvestmentFundRow = () => {
            syncInvestmentFundRows([...investmentFundRows, { allocationPercent: '', investmentOption: '', codeCurrency: '', profitLossPercent: '', balance: '', units: '', unitPrice: '', averagePrice: '' }]);
        };
        const addMultipleInvestmentFundRows = (count = 1) => {
            const safeCount = Math.max(1, Math.min(20, Number(count) || 1));
            const appendedRows = Array.from({ length: safeCount }, () => ({ allocationPercent: '', investmentOption: '', codeCurrency: '', profitLossPercent: '', balance: '', units: '', unitPrice: '', averagePrice: '' }));
            syncInvestmentFundRows([...investmentFundRows, ...appendedRows]);
        };
        const removeInvestmentFundRow = (rowIndex) => {
            const nextRows = investmentFundRows.filter((_, index) => index !== rowIndex);
            syncInvestmentFundRows(nextRows.length > 0 ? nextRows : [{ allocationPercent: '', investmentOption: '', codeCurrency: '', profitLossPercent: '', balance: '', units: '', unitPrice: '', averagePrice: '' }]);
        };
        const duplicateInvestmentFundRow = (rowIndex) => {
            const sourceRow = investmentFundRows[rowIndex];
            if (!sourceRow) return;
            const nextRows = [...investmentFundRows];
            nextRows.splice(rowIndex + 1, 0, { ...sourceRow });
            syncInvestmentFundRows(nextRows);
        };
        const moveInvestmentFundRow = (rowIndex, direction) => {
            const targetIndex = rowIndex + direction;
            if (targetIndex < 0 || targetIndex >= investmentFundRows.length) return;
            const nextRows = [...investmentFundRows];
            const [moved] = nextRows.splice(rowIndex, 1);
            nextRows.splice(targetIndex, 0, moved);
            syncInvestmentFundRows(nextRows);
        };
        const clearInvestmentFundRows = () => {
            syncInvestmentFundRows([{ allocationPercent: '', investmentOption: '', codeCurrency: '', profitLossPercent: '', balance: '', units: '', unitPrice: '', averagePrice: '' }]);
        };
        const parseNumberLoose = (value) => {
            const normalized = String(value || '').replace(/,/g, '').trim();
            const parsed = Number(normalized);
            return Number.isFinite(parsed) ? parsed : 0;
        };
        const investmentFundComputedRows = investmentFundRows.map(row => {
            const units = parseNumberLoose(row.units);
            const unitPrice = parseNumberLoose(row.unitPrice);
            const averagePrice = parseNumberLoose(row.averagePrice);
            const estimatedMarketValue = units * unitPrice;
            const estimatedCostValue = units * averagePrice;
            const estimatedPnL = estimatedMarketValue - estimatedCostValue;
            return {
                ...row,
                estimatedMarketValue,
                estimatedCostValue,
                estimatedPnL
            };
        });
        const investmentFundTotals = investmentFundComputedRows.reduce((acc, row) => {
            acc.market += row.estimatedMarketValue;
            acc.cost += row.estimatedCostValue;
            acc.pnl += row.estimatedPnL;
            return acc;
        }, { market: 0, cost: 0, pnl: 0 });

        const autoPremiumPaidCount = (() => {
            if (!needsPremium) return 0;
            const parseDate = (value) => {
                if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
                const [year, month, day] = value.split('-').map(Number);
                const parsed = new Date(year, month - 1, day);
                if (parsed.getFullYear() !== year || parsed.getMonth() !== (month - 1) || parsed.getDate() !== day) return null;
                return parsed;
            };
            const startDate = parseDate(formData.insuranceStartDate);
            if (!startDate) return Number(formData.premiumPaidCount || 0) || 0;
            const endDate = parseDate(formData.insuranceEndDate || '');
            const today = new Date();
            const upperBound = endDate && endDate.getTime() < today.getTime()
                ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
                : new Date(today.getFullYear(), today.getMonth(), today.getDate());
            if (upperBound.getTime() < startDate.getTime()) return 0;

            const paymentDayRaw = Number(formData.insurancePaymentDay);
            const paymentDay = Number.isInteger(paymentDayRaw) && paymentDayRaw >= 1 && paymentDayRaw <= 31
                ? paymentDayRaw
                : startDate.getDate();
            if (formData.premiumFrequency === 'single') {
                return upperBound.getTime() >= startDate.getTime() ? 1 : 0;
            }
            const isYearly = formData.premiumFrequency === 'yearly';

            let year = startDate.getFullYear();
            let month = startDate.getMonth();
            let day = Math.min(paymentDay, new Date(year, month + 1, 0).getDate());
            let cursor = new Date(year, month, day);
            if (cursor.getTime() < startDate.getTime()) {
                if (isYearly) year += 1;
                else month += 1;
                day = Math.min(paymentDay, new Date(year, month + 1, 0).getDate());
                cursor = new Date(year, month, day);
            }

            let count = 0;
            const maxCycles = isYearly ? 400 : 4800;
            for (let i = 0; i < maxCycles; i += 1) {
                if (cursor.getTime() > upperBound.getTime()) break;
                count += 1;
                year = cursor.getFullYear() + (isYearly ? 1 : 0);
                month = cursor.getMonth() + (isYearly ? 0 : 1);
                day = Math.min(paymentDay, new Date(year, month + 1, 0).getDate());
                cursor = new Date(year, month, day);
            }
            if (upperBound.getTime() >= startDate.getTime()) return Math.max(1, count);
            return count;
        })();

        const isSinglePremiumFrequency = formData.premiumFrequency === 'single';
        const premiumTermsPerYear = (formData.premiumFrequency === 'yearly' || isSinglePremiumFrequency) ? 1 : 12;
        const lifeBasePremiumAmount = Number(formData.insuranceBasePremiumAmount || 0);
        const lifeSupplementaryPremiumAmount = Number(formData.insuranceSupplementaryPremiumAmount || 0);
        const resolvedPremiumPerTerm = isLifeWealthInsuranceForm && (lifeBasePremiumAmount > 0 || lifeSupplementaryPremiumAmount > 0)
            ? (lifeBasePremiumAmount + (hasSupplementaryBenefit ? lifeSupplementaryPremiumAmount : 0))
            : (Number(formData.premiumAmount) || 0);
        const normalizeDistributionStartPolicyYear = ({ startDateKey, rawValue }) => {
            const parsedRaw = Number(rawValue || 0);
            if (!Number.isFinite(parsedRaw) || parsedRaw <= 0) return 0;
            const normalizedRaw = Math.floor(parsedRaw);
            if (normalizedRaw >= 1000) {
                const startDate = (() => {
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDateKey || '')) return null;
                    const [year, month, day] = String(startDateKey).split('-').map(Number);
                    const parsed = new Date(year, month - 1, day);
                    if (parsed.getFullYear() !== year || parsed.getMonth() !== (month - 1) || parsed.getDate() !== day) return null;
                    return parsed;
                })();
                if (!startDate) return 0;
                return Math.max(1, normalizedRaw - startDate.getFullYear() + 1);
            }
            return normalizedRaw;
        };
        const premiumPaymentYearsRaw = Number(formData.insurancePremiumPaymentYears || 0);
        const premiumPaymentYears = Number.isFinite(premiumPaymentYearsRaw) && premiumPaymentYearsRaw > 0
            ? Math.floor(premiumPaymentYearsRaw)
            : 0;
        const premiumTotalTerms = isSinglePremiumFrequency
            ? 1
            : (premiumPaymentYears > 0 ? premiumPaymentYears * premiumTermsPerYear : 0);
        const effectivePremiumPaidCount = premiumTotalTerms > 0
            ? Math.min(autoPremiumPaidCount, premiumTotalTerms)
            : autoPremiumPaidCount;
        const currentPolicyYear = effectivePremiumPaidCount > 0
            ? ((formData.premiumFrequency === 'yearly' || isSinglePremiumFrequency) ? effectivePremiumPaidCount : (Math.floor((effectivePremiumPaidCount - 1) / 12) + 1))
            : 0;
        const distributionStartYear = normalizeDistributionStartPolicyYear({
            startDateKey: formData.insuranceStartDate,
            rawValue: formData.insuranceDistributionStartPolicyYear
        });
        const annualDistributionAmount = isInvestmentLinkedLifeSubtype ? 0 : Number(formData.insuranceAnnualDistributionAmount || 0);
        const distributionPaidYears = distributionStartYear > 0 && currentPolicyYear >= distributionStartYear
            ? (currentPolicyYear - distributionStartYear + 1)
            : 0;
        const totalDistributedAmount = annualDistributionAmount > 0
            ? annualDistributionAmount * distributionPaidYears
            : 0;
        const distributionMode = formData.insuranceDistributionMode === 'accumulate' ? 'accumulate' : 'cash';
        const accumulationRatePercent = Number(formData.insuranceAccumulationRate || 0);
        const accumulationRate = Number.isFinite(accumulationRatePercent) ? (accumulationRatePercent / 100) : 0;
        let accumulationBalancePreview = 0;
        if (distributionMode === 'accumulate' && annualDistributionAmount > 0 && distributionPaidYears > 0) {
            for (let i = 0; i < distributionPaidYears; i += 1) {
                const remainYears = distributionPaidYears - 1 - i;
                accumulationBalancePreview += annualDistributionAmount * Math.pow(1 + accumulationRate, Math.max(0, remainYears));
            }
        }

        const autoLifePolicyEndDate = (() => {
            if (!isLifeWealthInsuranceForm) return '';
            if (!formData.insuranceStartDate || premiumTotalTerms <= 0) return '';

            const parseDate = (value) => {
                if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
                const [year, month, day] = value.split('-').map(Number);
                const parsed = new Date(year, month - 1, day);
                if (parsed.getFullYear() !== year || parsed.getMonth() !== (month - 1) || parsed.getDate() !== day) return null;
                return parsed;
            };
            const toDateKey = (date) => {
                const pad2 = (value) => String(value).padStart(2, '0');
                return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
            };

            const startDate = parseDate(formData.insuranceStartDate);
            if (!startDate) return '';
            if (isSinglePremiumFrequency) return toDateKey(startDate);

            const paymentDayRaw = Number(formData.insurancePaymentDay);
            const paymentDay = Number.isInteger(paymentDayRaw) && paymentDayRaw >= 1 && paymentDayRaw <= 31
                ? paymentDayRaw
                : startDate.getDate();
            const isYearly = formData.premiumFrequency === 'yearly';

            let year = startDate.getFullYear();
            let month = startDate.getMonth();
            let day = Math.min(paymentDay, new Date(year, month + 1, 0).getDate());
            let cursor = new Date(year, month, day);
            if (cursor.getTime() < startDate.getTime()) {
                if (isYearly) year += 1;
                else month += 1;
                day = Math.min(paymentDay, new Date(year, month + 1, 0).getDate());
                cursor = new Date(year, month, day);
            }

            for (let i = 1; i < premiumTotalTerms; i += 1) {
                year = cursor.getFullYear() + (isYearly ? 1 : 0);
                month = cursor.getMonth() + (isYearly ? 0 : 1);
                day = Math.min(paymentDay, new Date(year, month + 1, 0).getDate());
                cursor = new Date(year, month, day);
            }

            return toDateKey(cursor);
        })();
        const isAnnuitySubtype = formData.subtype === '年金險';
        const bankWealthComputedMaturityDate = (() => {
            if (!isBankWealthForm) return '';
            const startDate = parseDateKeySafe(formData.bankWealthStartDate || '');
            const termDays = Math.max(1, Math.floor(Number(formData.bankWealthTermDays || 0) || 0));
            if (!startDate) return '';
            const maturity = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + termDays);
            const pad2 = (value) => String(value).padStart(2, '0');
            return `${maturity.getFullYear()}-${pad2(maturity.getMonth() + 1)}-${pad2(maturity.getDate())}`;
        })();

        return (
            <div className="fixed inset-0 z-50 flex items-stretch md:items-center justify-center p-0 md:p-4 modal-overlay">
                <div className="theme-modal-shell w-full h-[100dvh] md:h-auto md:w-[96vw] md:max-w-6xl md:max-h-[90vh] md:rounded-3xl shadow-2xl overflow-hidden">
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
                    <form onSubmit={handleSubmit} className="p-5 md:p-8 pb-24 md:pb-8 space-y-4 h-[calc(100dvh-96px)] md:h-auto md:max-h-[calc(90vh-96px)] overflow-y-auto overscroll-y-contain custom-scrollbar">
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

                        {!needsPremium && !isMortgageForm && !isLiabilityForm && !isReceivableForm && !isFixedForm && !isFixedDepositForm && !isBankWealthForm && (
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

                        {isFundForm && (
                            <div className={`${MODAL_GROUP_CLASS} grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4`}>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>{tByLang('基金是否派息', 'Fund Distributes?', 'ファンド分配の有無')}</label>
                                    <select
                                        className={MODAL_INPUT_CLASS}
                                        value={formData.fundDistributionEnabled || 'no'}
                                        onChange={(event) => {
                                            const nextValue = event.target.value === 'yes' ? 'yes' : 'no';
                                            updateFormField('fundDistributionEnabled')({ target: { value: nextValue } });
                                            if (nextValue !== 'yes') {
                                                updateFormField('fundDistributionAmount')({ target: { value: '' } });
                                                updateFormField('fundDistributionRatePercent')({ target: { value: '' } });
                                                updateFormField('fundDistributionAccumulationRatePercent')({ target: { value: '' } });
                                                updateFormField('fundDistributionStartDate')({ target: { value: '' } });
                                                updateFormField('fundDistributionAccountId')({ target: { value: '' } });
                                            }
                                        }}
                                    >
                                        <option value="no">{tByLang('不派息', 'No', 'なし')}</option>
                                        <option value="yes">{tByLang('派息', 'Yes', 'あり')}</option>
                                    </select>
                                </div>
                                {isFundDistributionEnabled && (
                                    <>
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{tByLang('派息處理方式', 'Distribution Handling', '分配処理方式')}</label>
                                            <select
                                                className={MODAL_INPUT_CLASS}
                                                value={fundDistributionMode}
                                                onChange={(event) => {
                                                    const nextMode = ['cash', 'accumulate', 'reinvest'].includes(event.target.value) ? event.target.value : 'cash';
                                                    updateFormField('fundDistributionMode')({ target: { value: nextMode } });
                                                    if (nextMode !== 'cash') {
                                                        updateFormField('fundDistributionAccountId')({ target: { value: '' } });
                                                    }
                                                    if (nextMode !== 'accumulate') {
                                                        updateFormField('fundDistributionAccumulationRatePercent')({ target: { value: '' } });
                                                    }
                                                }}
                                            >
                                                <option value="cash">{tByLang('派息入帳', 'Cash Payout', '入金')}</option>
                                                <option value="accumulate">{tByLang('積存生息', 'Accumulate', '積立')}</option>
                                                <option value="reinvest">{tByLang('再投資', 'Reinvest', '再投資')}</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{tByLang('基金派息金額（每期）', 'Fund Distribution Amount (Per Cycle)', 'ファンド分配金額（各周期）')}</label>
                                            <input type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.fundDistributionAmount || ''} onChange={updateFormField('fundDistributionAmount')} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{tByLang('基金派息比率（%）', 'Fund Distribution Rate (%)', 'ファンド分配率（%）')}</label>
                                            <input type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.fundDistributionRatePercent || ''} onChange={updateFormField('fundDistributionRatePercent')} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{tByLang('派息週期', 'Distribution Frequency', '分配周期')}</label>
                                            <select className={MODAL_INPUT_CLASS} value={formData.fundDistributionFrequency || 'monthly'} onChange={updateFormField('fundDistributionFrequency')}>
                                                <option value="monthly">{tByLang('每月', 'Monthly', '毎月')}</option>
                                                <option value="yearly">{tByLang('每年', 'Yearly', '毎年')}</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{tByLang('派息開始日', 'Distribution Start Date', '分配開始日')}</label>
                                            <DatePicker
                                                value={formData.fundDistributionStartDate || ''}
                                                onChange={updateFormField('fundDistributionStartDate')}
                                                className={MODAL_INPUT_CLASS}
                                                pageLanguage={pageLanguage}
                                            />
                                        </div>
                                        {fundDistributionMode === 'accumulate' && (
                                            <div className="space-y-1">
                                                <label className={FIELD_LABEL_CLASS}>{tByLang('積存年化利率（%）', 'Accumulation APR (%)', '積立年利（%）')}</label>
                                                <input type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.fundDistributionAccumulationRatePercent || ''} onChange={updateFormField('fundDistributionAccumulationRatePercent')} />
                                            </div>
                                        )}
                                        {fundDistributionMode === 'cash' && (
                                            <div className="space-y-1">
                                                <label className={FIELD_LABEL_CLASS}>{tByLang('派息入帳帳戶', 'Distribution Payout Account', '分配入金口座')}</label>
                                                <select className={MODAL_INPUT_CLASS} value={formData.fundDistributionAccountId || ''} onChange={updateFormField('fundDistributionAccountId')}>
                                                    <option value="">{tByLang('請選擇流動資產帳戶', 'Select a liquid asset account', '流動資産口座を選択')}</option>
                                                    {(liquidAssetOptions || []).map(option => (
                                                        <option key={option.id} value={option.id}>{option.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </>
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
                                        <label className={FIELD_LABEL_CLASS}>{tByLang('期限模式', 'Term Mode', '期限モード')}</label>
                                        <select className={MODAL_INPUT_CLASS} value={formData.fixedDepositTermMode || 'months'} onChange={updateFormField('fixedDepositTermMode')}>
                                            <option value="months">{tByLang('按月數', 'By Months', '月数で指定')}</option>
                                            <option value="days">{tByLang('按日數', 'By Days', '日数で指定')}</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>
                                            {(formData.fixedDepositTermMode || 'months') === 'days'
                                                ? tByLang('存期 (天)', 'Term (Days)', '期間 (日)')
                                                : tByLang('存期 (月)', 'Term (Months)', '期間 (月)')}
                                        </label>
                                        {(formData.fixedDepositTermMode || 'months') === 'days' ? (
                                            <input required type="number" step="1" min="1" className={MODAL_INPUT_CLASS} value={formData.fixedDepositDays || ''} onChange={updateFormField('fixedDepositDays')} />
                                        ) : (
                                            <input required type="number" step="1" min="1" className={MODAL_INPUT_CLASS} value={formData.fixedDepositMonths || ''} onChange={updateFormField('fixedDepositMonths')} />
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{translate('起存日')}</label>
                                        <DatePicker
                                            value={formData.fixedDepositStartDate}
                                            onChange={updateFormField('fixedDepositStartDate')}
                                            className={MODAL_INPUT_CLASS}
                                            pageLanguage={pageLanguage}
                                        />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className={FIELD_LABEL_CLASS}>{tByLang('到期入帳帳戶', 'Maturity Payout Account', '満期入金口座')}</label>
                                        <select
                                            required
                                            className={MODAL_INPUT_CLASS}
                                            value={formData.fixedDepositTargetLiquidAssetId || ''}
                                            onChange={updateFormField('fixedDepositTargetLiquidAssetId')}
                                        >
                                            <option value="">{tByLang('請選擇流動資產帳戶', 'Select a liquid asset account', '流動資産口座を選択')}</option>
                                            {liquidAssetOptions.map(option => (
                                                <option key={option.id} value={option.id}>{option.label}</option>
                                            ))}
                                        </select>
                                        {liquidAssetOptions.length === 0 && (
                                            <div className="text-[10px] font-bold text-rose-600">
                                                {tByLang('請先新增至少一個流動資產帳戶，才能設定到期自動入帳。', 'Add at least one liquid asset account first to enable auto payout at maturity.', '満期自動入金を有効にするには、先に流動資産口座を追加してください。')}
                                            </div>
                                        )}
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

                        {isBankWealthForm && (
                            <div className={`${MODAL_GROUP_CLASS} space-y-4`}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{tByLang('本金', 'Principal', '元本')}</label>
                                        <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.bankWealthPrincipal} onChange={updateFormField('bankWealthPrincipal')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{tByLang('保底年收益率 (%)', 'Guaranteed Annual Yield (%)', '最低年利回り (%)')}</label>
                                        <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.bankWealthGuaranteedAnnualRate} onChange={updateFormField('bankWealthGuaranteedAnnualRate')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{tByLang('最高年收益率 (%)', 'Maximum Annual Yield (%)', '最高年利回り (%)')}</label>
                                        <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.bankWealthMaxAnnualRate} onChange={updateFormField('bankWealthMaxAnnualRate')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{tByLang('期限 (天)', 'Term (Days)', '期間 (日)')}</label>
                                        <input required type="number" step="1" min="1" className={MODAL_INPUT_CLASS} value={formData.bankWealthTermDays} onChange={updateFormField('bankWealthTermDays')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{tByLang('起息日', 'Interest Start Date', '起算日')}</label>
                                        <DatePicker
                                            value={formData.bankWealthStartDate}
                                            onChange={updateFormField('bankWealthStartDate')}
                                            className={MODAL_INPUT_CLASS}
                                            pageLanguage={pageLanguage}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{tByLang('到期日', 'Maturity Date', '満期日')}</label>
                                        <DatePicker
                                            value={formData.bankWealthMaturityDate || bankWealthComputedMaturityDate}
                                            onChange={updateFormField('bankWealthMaturityDate')}
                                            className={MODAL_INPUT_CLASS}
                                            pageLanguage={pageLanguage}
                                        />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className={FIELD_LABEL_CLASS}>{tByLang('到期入帳帳戶', 'Maturity Payout Account', '満期入金口座')}</label>
                                        <select
                                            required
                                            className={MODAL_INPUT_CLASS}
                                            value={formData.bankWealthTargetLiquidAssetId || ''}
                                            onChange={updateFormField('bankWealthTargetLiquidAssetId')}
                                        >
                                            <option value="">{tByLang('請選擇流動資產帳戶', 'Select a liquid asset account', '流動資産口座を選択')}</option>
                                            {liquidAssetOptions.map(option => (
                                                <option key={option.id} value={option.id}>{option.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{tByLang('到期入帳金額模式', 'Maturity Payout Mode', '満期入金モード')}</label>
                                        <select
                                            className={MODAL_INPUT_CLASS}
                                            value={formData.bankWealthMaturityPayoutMode || 'guaranteed'}
                                            onChange={updateFormField('bankWealthMaturityPayoutMode')}
                                        >
                                            <option value="guaranteed">{tByLang('保底本利和', 'Guaranteed Maturity', '最低満期受取')}</option>
                                            <option value="max">{tByLang('最高本利和', 'Maximum Maturity', '最高満期受取')}</option>
                                            <option value="manual">{tByLang('手動輸入', 'Manual Amount', '手動入力')}</option>
                                        </select>
                                    </div>
                                    {(formData.bankWealthMaturityPayoutMode || 'guaranteed') === 'manual' && (
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{tByLang('手動到期入帳金額', 'Manual Maturity Payout Amount', '手動満期入金額')}</label>
                                            <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.bankWealthMaturityManualAmount || ''} onChange={updateFormField('bankWealthMaturityManualAmount')} />
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{tByLang('保底收益', 'Guaranteed Yield', '最低利回り')}</label>
                                        <div className={MODAL_OUTPUT_CLASS}>{bankWealthMetrics ? `${formatAmount(bankWealthMetrics.guaranteedInterestAmount)} ${formData.currency}` : '--'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{tByLang('最高收益', 'Maximum Yield', '最高利回り')}</label>
                                        <div className={MODAL_OUTPUT_CLASS}>{bankWealthMetrics ? `${formatAmount(bankWealthMetrics.maxInterestAmount)} ${formData.currency}` : '--'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{tByLang('到期本利和（保底）', 'Guaranteed Maturity Amount', '満期受取額（最低）')}</label>
                                        <div className={MODAL_OUTPUT_CLASS}>{bankWealthMetrics ? `${formatAmount(bankWealthMetrics.guaranteedMaturityAmount)} ${formData.currency}` : '--'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{tByLang('到期本利和（最高）', 'Maximum Maturity Amount', '満期受取額（最高）')}</label>
                                        <div className={MODAL_OUTPUT_CLASS}>{bankWealthMetrics ? `${formatAmount(bankWealthMetrics.maxMaturityAmount)} ${formData.currency}` : '--'}</div>
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
                                    <label className={FIELD_LABEL_CLASS}>{isLifeWealthInsuranceForm ? tByLang('主約每期保費', 'Base Premium per Term', '主契約の各期保険料') : translate('每期保費')}</label>
                                    {isLifeWealthInsuranceForm ? (
                                        <input required type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.insuranceBasePremiumAmount || ''} onChange={updateFormField('insuranceBasePremiumAmount')} />
                                    ) : (
                                        <input required type="number" step="any" className={MODAL_INPUT_CLASS} value={formData.premiumAmount} onChange={updateFormField('premiumAmount')} />
                                    )}
                                </div>
                                {isLifeWealthInsuranceForm && !isInvestmentLinkedLifeSubtype && (
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{tByLang('是否有附加保障', 'Has Supplementary Benefit', '特約の有無')}</label>
                                        <select className={MODAL_INPUT_CLASS} value={formData.insuranceHasSupplementaryBenefit || 'no'} onChange={updateFormField('insuranceHasSupplementaryBenefit')}>
                                            <option value="no">{tByLang('沒有', 'No', 'なし')}</option>
                                            <option value="yes">{tByLang('有', 'Yes', 'あり')}</option>
                                        </select>
                                    </div>
                                )}
                                {isLifeWealthInsuranceForm && !isInvestmentLinkedLifeSubtype && hasSupplementaryBenefit && (
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{tByLang('附加保障每期保費（選填）', 'Supplementary Premium per Term (Optional)', '特約の各期保険料（任意）')}</label>
                                        <input type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.insuranceSupplementaryPremiumAmount || ''} onChange={updateFormField('insuranceSupplementaryPremiumAmount')} />
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>{translate('繳費週期')}</label>
                                    <select className={MODAL_INPUT_CLASS} value={formData.premiumFrequency} onChange={updateFormField('premiumFrequency')}>
                                        <option value="monthly">{translate('每月')}</option>
                                        <option value="yearly">{translate('每年')}</option>
                                        {isLifeWealthInsuranceForm && <option value="single">{tByLang('一次性', 'One-time', '単発')}</option>}
                                    </select>
                                </div>
                                {isLifeWealthInsuranceForm && (
                                    <div className="space-y-1">
                                        <label className={FIELD_LABEL_CLASS}>{tByLang('每期總保費（自動）', 'Total Premium per Term (Auto)', '各期保険料合計（自動）')}</label>
                                        <div className={MODAL_OUTPUT_CLASS}>{formatAmount(resolvedPremiumPerTerm)} {formData.currency}</div>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>{tByLang('已繳期數（自動）', 'Paid Terms (Auto)', '支払済期数（自動）')}</label>
                                    <div className={MODAL_OUTPUT_CLASS}>{effectivePremiumPaidCount}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className={FIELD_LABEL_CLASS}>{translate('已繳總保費')}</label>
                                    <div className={MODAL_OUTPUT_CLASS}>{formatAmount(resolvedPremiumPerTerm * effectivePremiumPaidCount)} {formData.currency}</div>
                                </div>

                                {isHealthInsuranceForm && (
                                    <>
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{translate('保險公司 (選填)')}</label>
                                            <input type="text" className={MODAL_INPUT_CLASS} value={formData.insuranceProvider || ''} onChange={updateFormField('insuranceProvider')} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{translate('保單號碼 (選填)')}</label>
                                            <input type="text" className={MODAL_INPUT_CLASS} value={formData.insurancePolicyNumber || ''} onChange={updateFormField('insurancePolicyNumber')} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{translate('保額 (選填)')}</label>
                                            <input type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.insuranceCoverageAmount || ''} onChange={updateFormField('insuranceCoverageAmount')} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{translate('受益人 (選填)')}</label>
                                            <input type="text" className={MODAL_INPUT_CLASS} value={formData.insuranceBeneficiary || ''} onChange={updateFormField('insuranceBeneficiary')} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{translate('扣款帳戶 (必填)')}</label>
                                            <select className={MODAL_INPUT_CLASS} required value={formData.insurancePaymentAccountId || ''} onChange={updateFormField('insurancePaymentAccountId')}>
                                                <option value="">{translate('請選擇流動資金帳戶')}</option>
                                                {(liquidAssetOptions || []).map(option => (
                                                    <option key={option.id} value={option.id}>{option.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {!isSinglePremiumFrequency && (
                                            <div className="space-y-1">
                                                <label className={FIELD_LABEL_CLASS}>{translate('固定扣款日 (必填)')}</label>
                                                <input
                                                    required
                                                    type="number"
                                                    min="1"
                                                    max="31"
                                                    step="1"
                                                    className={MODAL_INPUT_CLASS}
                                                    value={formData.insurancePaymentDay || ''}
                                                    onChange={updateFormField('insurancePaymentDay')}
                                                    placeholder={translate('例如：15')}
                                                />
                                                <div className="text-[10px] text-slate-400 font-bold">
                                                    {translate('若設定為 29-31 號，遇到短月份會自動改為月底扣款')}
                                                </div>
                                            </div>
                                        )}
                                        {isSinglePremiumFrequency && (
                                            <div className="space-y-1">
                                                <label className={FIELD_LABEL_CLASS}>{tByLang('扣款日期（自動）', 'Debit Date (Auto)', '引落日（自動）')}</label>
                                                <div className={MODAL_OUTPUT_CLASS}>{formData.insuranceStartDate || '--'}</div>
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{translate('保單生效日 (必填)')}</label>
                                            <DatePicker
                                                value={formData.insuranceStartDate || ''}
                                                onChange={updateFormField('insuranceStartDate')}
                                                className={MODAL_INPUT_CLASS}
                                                pageLanguage={pageLanguage}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{tByLang('保單終止日（自動）', 'Policy End Date (Auto)', '保険終了日（自動）')}</label>
                                            <div className={MODAL_OUTPUT_CLASS}>{autoLifePolicyEndDate || '--'}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{translate('保單備註 (選填)')}</label>
                                            <input type="text" className={MODAL_INPUT_CLASS} value={formData.insuranceNote || ''} onChange={updateFormField('insuranceNote')} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{translate('等待期天數 (選填)')}</label>
                                            <input type="number" step="1" min="0" className={MODAL_INPUT_CLASS} value={formData.insuranceWaitingPeriodDays || ''} onChange={updateFormField('insuranceWaitingPeriodDays')} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{translate('免賠額 (選填)')}</label>
                                            <input type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.insuranceDeductible || ''} onChange={updateFormField('insuranceDeductible')} />
                                        </div>
                                    </>
                                )}

                                {isLifeWealthInsuranceForm && (
                                    <>
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{translate('保險公司 (選填)')}</label>
                                            <input type="text" className={MODAL_INPUT_CLASS} value={formData.insuranceProvider || ''} onChange={updateFormField('insuranceProvider')} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{translate('保單號碼 (選填)')}</label>
                                            <input type="text" className={MODAL_INPUT_CLASS} value={formData.insurancePolicyNumber || ''} onChange={updateFormField('insurancePolicyNumber')} />
                                        </div>
                                        {!isInvestmentLinkedLifeSubtype && hasSupplementaryBenefit && (
                                            <>
                                                <div className="space-y-1 md:col-span-2">
                                                    <label className={FIELD_LABEL_CLASS}>{tByLang('附加保障名稱（選填）', 'Supplementary Benefit Name (Optional)', '特約名称（任意）')}</label>
                                                    <input type="text" className={MODAL_INPUT_CLASS} value={formData.insuranceSupplementaryBenefitName || ''} onChange={updateFormField('insuranceSupplementaryBenefitName')} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={FIELD_LABEL_CLASS}>{tByLang('附加保障地區（選填）', 'Supplementary Benefit Region (Optional)', '特約エリア（任意）')}</label>
                                                    <input type="text" className={MODAL_INPUT_CLASS} value={formData.insuranceSupplementaryBenefitRegion || ''} onChange={updateFormField('insuranceSupplementaryBenefitRegion')} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={FIELD_LABEL_CLASS}>{tByLang('附加保障自付費（選填）', 'Supplementary Deductible (Optional)', '特約自己負担額（任意）')}</label>
                                                    <input type="text" className={MODAL_INPUT_CLASS} value={formData.insuranceSupplementaryBenefitDeductible || ''} onChange={updateFormField('insuranceSupplementaryBenefitDeductible')} placeholder={tByLang('例如：$3,125', 'e.g. $3,125', '例：$3,125')} />
                                                </div>
                                            </>
                                        )}
                                        {isInvestmentLinkedLifeSubtype && (
                                            <>
                                                <div className="space-y-1 md:col-span-2">
                                                    <label className={FIELD_LABEL_CLASS}>{tByLang('投資策略備註（選填）', 'Investment Strategy Note (Optional)', '運用方針メモ（任意）')}</label>
                                                    <input type="text" className={MODAL_INPUT_CLASS} value={formData.insuranceInvestmentStrategyNote || ''} onChange={updateFormField('insuranceInvestmentStrategyNote')} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={FIELD_LABEL_CLASS}>{tByLang('基金是否派息', 'Fund Distributes?', 'ファンド分配の有無')}</label>
                                                    <select
                                                        className={MODAL_INPUT_CLASS}
                                                        value={formData.insuranceInvestmentDistributionEnabled || 'no'}
                                                        onChange={(event) => {
                                                            const nextValue = event.target.value === 'yes' ? 'yes' : 'no';
                                                            updateFormField('insuranceInvestmentDistributionEnabled')({ target: { value: nextValue } });
                                                            if (nextValue !== 'yes') {
                                                                updateFormField('insuranceInvestmentDistributionAmount')({ target: { value: '' } });
                                                                updateFormField('insuranceInvestmentDistributionRatePercent')({ target: { value: '' } });
                                                                updateFormField('insuranceInvestmentDistributionAccumulationRatePercent')({ target: { value: '' } });
                                                                updateFormField('insuranceInvestmentDistributionStartDate')({ target: { value: '' } });
                                                                updateFormField('insuranceInvestmentDistributionAccountId')({ target: { value: '' } });
                                                            }
                                                        }}
                                                    >
                                                        <option value="no">{tByLang('不派息', 'No', 'なし')}</option>
                                                        <option value="yes">{tByLang('派息', 'Yes', 'あり')}</option>
                                                    </select>
                                                </div>
                                                {isInsuranceInvestmentDistributionEnabled && (
                                                    <>
                                                        <div className="space-y-1">
                                                            <label className={FIELD_LABEL_CLASS}>{tByLang('派息處理方式', 'Distribution Handling', '分配処理方式')}</label>
                                                            <select
                                                                className={MODAL_INPUT_CLASS}
                                                                value={insuranceInvestmentDistributionMode}
                                                                onChange={(event) => {
                                                                    const nextMode = ['cash', 'accumulate', 'reinvest'].includes(event.target.value) ? event.target.value : 'cash';
                                                                    updateFormField('insuranceInvestmentDistributionMode')({ target: { value: nextMode } });
                                                                    if (nextMode !== 'cash') {
                                                                        updateFormField('insuranceInvestmentDistributionAccountId')({ target: { value: '' } });
                                                                    }
                                                                    if (nextMode !== 'accumulate') {
                                                                        updateFormField('insuranceInvestmentDistributionAccumulationRatePercent')({ target: { value: '' } });
                                                                    }
                                                                }}
                                                            >
                                                                <option value="cash">{tByLang('派息入帳', 'Cash Payout', '入金')}</option>
                                                                <option value="accumulate">{tByLang('積存生息', 'Accumulate', '積立')}</option>
                                                                <option value="reinvest">{tByLang('再投資', 'Reinvest', '再投資')}</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className={FIELD_LABEL_CLASS}>{tByLang('基金派息金額（每期）', 'Fund Distribution Amount (Per Cycle)', 'ファンド分配金額（各周期）')}</label>
                                                            <input type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.insuranceInvestmentDistributionAmount || ''} onChange={updateFormField('insuranceInvestmentDistributionAmount')} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className={FIELD_LABEL_CLASS}>{tByLang('基金派息比率（%）', 'Fund Distribution Rate (%)', 'ファンド分配率（%）')}</label>
                                                            <input type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.insuranceInvestmentDistributionRatePercent || ''} onChange={updateFormField('insuranceInvestmentDistributionRatePercent')} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className={FIELD_LABEL_CLASS}>{tByLang('派息週期', 'Distribution Frequency', '分配周期')}</label>
                                                            <select className={MODAL_INPUT_CLASS} value={formData.insuranceInvestmentDistributionFrequency || 'monthly'} onChange={updateFormField('insuranceInvestmentDistributionFrequency')}>
                                                                <option value="monthly">{tByLang('每月', 'Monthly', '毎月')}</option>
                                                                <option value="yearly">{tByLang('每年', 'Yearly', '毎年')}</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className={FIELD_LABEL_CLASS}>{tByLang('派息開始日', 'Distribution Start Date', '分配開始日')}</label>
                                                            <DatePicker
                                                                value={formData.insuranceInvestmentDistributionStartDate || formData.insuranceStartDate || ''}
                                                                onChange={updateFormField('insuranceInvestmentDistributionStartDate')}
                                                                className={MODAL_INPUT_CLASS}
                                                                pageLanguage={pageLanguage}
                                                            />
                                                        </div>
                                                        {insuranceInvestmentDistributionMode === 'accumulate' && (
                                                            <div className="space-y-1">
                                                                <label className={FIELD_LABEL_CLASS}>{tByLang('積存年化利率（%）', 'Accumulation APR (%)', '積立年利（%）')}</label>
                                                                <input type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.insuranceInvestmentDistributionAccumulationRatePercent || ''} onChange={updateFormField('insuranceInvestmentDistributionAccumulationRatePercent')} />
                                                            </div>
                                                        )}
                                                        {insuranceInvestmentDistributionMode === 'cash' && (
                                                            <div className="space-y-1">
                                                                <label className={FIELD_LABEL_CLASS}>{tByLang('派息入帳帳戶', 'Distribution Payout Account', '分配入金口座')}</label>
                                                                <select className={MODAL_INPUT_CLASS} value={formData.insuranceInvestmentDistributionAccountId || ''} onChange={updateFormField('insuranceInvestmentDistributionAccountId')}>
                                                                    <option value="">{tByLang('請選擇流動資產帳戶', 'Select a liquid asset account', '流動資産口座を選択')}</option>
                                                                    {(liquidAssetOptions || []).map(option => (
                                                                        <option key={option.id} value={option.id}>{option.label}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                                <div className="space-y-1 md:col-span-2">
                                                    <label className={FIELD_LABEL_CLASS}>{tByLang('基金子項目管理', 'Fund Item Management', 'ファンド項目管理')}</label>
                                                    <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 px-3 py-2 text-[10px] font-black text-indigo-700">
                                                        {editingId
                                                            ? tByLang('請到「資產詳細列表」該保單下方管理基金欄位與操作。', 'Manage fund columns and actions under this policy in Asset Detail List.', '資産詳細リストの該当保険の下でファンド項目を管理してください。')
                                                            : tByLang('新增保單時先不直接新增基金，儲存後請到「資產詳細列表」管理。', 'Direct fund creation is disabled during create. Save first, then manage in Asset Detail List.', '新規作成時はファンド追加不可です。保存後に資産詳細リストで管理してください。')}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        {!isInvestmentLinkedLifeSubtype && (
                                            <>
                                                <div className="space-y-1">
                                                    <label className={FIELD_LABEL_CLASS}>{translate('保額/名義金額 (選填)')}</label>
                                                    <input type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.insuranceCoverageAmount || ''} onChange={updateFormField('insuranceCoverageAmount')} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={FIELD_LABEL_CLASS}>{translate('保單價值 (選填)')}</label>
                                                    <input type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.insurancePolicyValue || ''} onChange={updateFormField('insurancePolicyValue')} />
                                                    <div className="text-[10px] text-slate-400 font-bold">{tByLang('建議先填總保單價值；若要更精細可在下方進階欄位填保證/非保證', 'Use total policy value first; add guaranteed/non-guaranteed values in Advanced only when needed', 'まず保険価値合計を入力し、必要時のみ詳細欄で保証/非保証を入力')}</div>
                                                </div>
                                            </>
                                        )}
                                        {isInvestmentLinkedLifeSubtype && (
                                            <div className="space-y-1 md:col-span-2">
                                                <label className={FIELD_LABEL_CLASS}>{tByLang('保單價值（自動）', 'Policy Value (Auto)', '保単価値（自動）')}</label>
                                                <div className={MODAL_OUTPUT_CLASS}>{tByLang('由基金子項目市值自動加總', 'Auto-summed from fund item market values', 'ファンド項目の時価を自動合計')}</div>
                                            </div>
                                        )}
                                        {!isSinglePremiumFrequency && (
                                            <div className="space-y-1">
                                                <label className={FIELD_LABEL_CLASS}>{translate('繳費年期 (年，選填)')}</label>
                                                <input type="number" step="1" min="1" className={MODAL_INPUT_CLASS} value={formData.insurancePremiumPaymentYears || ''} onChange={updateFormField('insurancePremiumPaymentYears')} />
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{translate('受益人 (選填)')}</label>
                                            <input type="text" className={MODAL_INPUT_CLASS} value={formData.insuranceBeneficiary || ''} onChange={updateFormField('insuranceBeneficiary')} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{translate('扣款帳戶 (必填)')}</label>
                                            <select className={MODAL_INPUT_CLASS} required value={formData.insurancePaymentAccountId || ''} onChange={updateFormField('insurancePaymentAccountId')}>
                                                <option value="">{translate('請選擇流動資金帳戶')}</option>
                                                {(liquidAssetOptions || []).map(option => (
                                                    <option key={option.id} value={option.id}>{option.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{translate('固定扣款日 (必填)')}</label>
                                            <input
                                                required
                                                type="number"
                                                min="1"
                                                max="31"
                                                step="1"
                                                className={MODAL_INPUT_CLASS}
                                                value={formData.insurancePaymentDay || ''}
                                                onChange={updateFormField('insurancePaymentDay')}
                                                placeholder={translate('例如：15')}
                                            />
                                            <div className="text-[10px] text-slate-400 font-bold">
                                                {translate('若設定為 29-31 號，遇到短月份會自動改為月底扣款')}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{translate('保單生效日 (必填)')}</label>
                                            <DatePicker
                                                value={formData.insuranceStartDate || ''}
                                                onChange={updateFormField('insuranceStartDate')}
                                                className={MODAL_INPUT_CLASS}
                                                pageLanguage={pageLanguage}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{tByLang('保單終止日（自動）', 'Policy End Date (Auto)', '保険終了日（自動）')}</label>
                                            <div className={MODAL_OUTPUT_CLASS}>{autoLifePolicyEndDate || '--'}</div>
                                        </div>
                                        {isAnnuitySubtype && (
                                            <div className="space-y-1">
                                                <label className={FIELD_LABEL_CLASS}>{translate('年金開始日 (選填)')}</label>
                                                <DatePicker
                                                    value={formData.insuranceAnnuityStartDate || ''}
                                                    onChange={updateFormField('insuranceAnnuityStartDate')}
                                                    className={MODAL_INPUT_CLASS}
                                                    pageLanguage={pageLanguage}
                                                />
                                            </div>
                                        )}
                                        {!isInvestmentLinkedLifeSubtype && (
                                            <>
                                                <div className="space-y-1">
                                                    <label className={FIELD_LABEL_CLASS}>{tByLang('派發開始保單年度/年份 (選填)', 'Distribution Start Policy Year / Calendar Year (Optional)', '配当開始の保険年度/西暦（任意）')}</label>
                                                    <input type="number" step="1" min="1" className={MODAL_INPUT_CLASS} value={formData.insuranceDistributionStartPolicyYear || ''} onChange={updateFormField('insuranceDistributionStartPolicyYear')} />
                                                    <div className="text-[10px] text-slate-400 font-bold">
                                                        {tByLang('可填保單年度（例：6）或西元年份（例：2025）', 'You can enter policy year (e.g. 6) or calendar year (e.g. 2025)', '保険年度（例：6）または西暦（例：2025）を入力できます')}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={FIELD_LABEL_CLASS}>{translate('每年派發金額 (選填)')}</label>
                                                    <input type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.insuranceAnnualDistributionAmount || ''} onChange={updateFormField('insuranceAnnualDistributionAmount')} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={FIELD_LABEL_CLASS}>{translate('派發處理方式')}</label>
                                                    <select className={MODAL_INPUT_CLASS} value={distributionMode} onChange={updateFormField('insuranceDistributionMode')}>
                                                        <option value="cash">{translate('直接入帳')}</option>
                                                        <option value="accumulate">{translate('積存生息')}</option>
                                                    </select>
                                                </div>
                                            </>
                                        )}
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{translate('總繳費期數上限（自動）')}</label>
                                            <div className={MODAL_OUTPUT_CLASS}>{premiumTotalTerms > 0 ? premiumTotalTerms : '--'}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{translate('目前保單年度（自動）')}</label>
                                            <div className={MODAL_OUTPUT_CLASS}>{currentPolicyYear || '--'}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{translate('已派發年數（自動）')}</label>
                                            <div className={MODAL_OUTPUT_CLASS}>{distributionPaidYears}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{translate('累計派發金額（自動）')}</label>
                                            <div className={MODAL_OUTPUT_CLASS}>{formatAmount(totalDistributedAmount)} {formData.currency}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{translate('積存餘額（自動）')}</label>
                                            <div className={MODAL_OUTPUT_CLASS}>{formatAmount(accumulationBalancePreview)} {formData.currency}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className={FIELD_LABEL_CLASS}>{translate('保單備註 (選填)')}</label>
                                            <input type="text" className={MODAL_INPUT_CLASS} value={formData.insuranceNote || ''} onChange={updateFormField('insuranceNote')} />
                                        </div>
                                        <details className="col-span-2 rounded-xl border border-slate-200/70 bg-slate-50/50 p-3">
                                            <summary className="cursor-pointer text-[11px] font-black text-slate-600 tracking-wide">{tByLang('進階欄位（非必要）', 'Advanced Fields (Optional)', '詳細項目（任意）')}</summary>
                                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                                <div className="space-y-1">
                                                    <label className={FIELD_LABEL_CLASS}>{translate('預估滿期日 (選填)')}</label>
                                                    <DatePicker
                                                        value={formData.insuranceExpectedMaturityDate || ''}
                                                        onChange={updateFormField('insuranceExpectedMaturityDate')}
                                                        className={MODAL_INPUT_CLASS}
                                                        pageLanguage={pageLanguage}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={FIELD_LABEL_CLASS}>{translate('積存年利率 (%) (選填)')}</label>
                                                    <input type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.insuranceAccumulationRate || ''} onChange={updateFormField('insuranceAccumulationRate')} />
                                                </div>
                                                {!isInvestmentLinkedLifeSubtype && (
                                                    <>
                                                        <div className="space-y-1">
                                                            <label className={FIELD_LABEL_CLASS}>{translate('保證現金價值 (選填)')}</label>
                                                            <input type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.insuranceGuaranteedCashValue || ''} onChange={updateFormField('insuranceGuaranteedCashValue')} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className={FIELD_LABEL_CLASS}>{translate('非保證現金價值 (選填)')}</label>
                                                            <input type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.insuranceNonGuaranteedCashValue || ''} onChange={updateFormField('insuranceNonGuaranteedCashValue')} />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </details>
                                        {editingId && (
                                            <details className="col-span-2 rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-3">
                                                <summary className="cursor-pointer text-[11px] font-black text-emerald-700 tracking-wide">{tByLang('部分提領快捷（單次）', 'Partial Withdrawal Shortcut (One-time)', '一部引き出しショートカット（単発）')}</summary>
                                                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                                    {!!(formData.insurancePartialWithdrawalEditCashflowId || '').trim() && (
                                                        <div className="md:col-span-2 flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-black text-amber-700">
                                                            <span>{tByLang('目前為「修改既有提領紀錄」模式', 'Editing an existing withdrawal record', '既存の引き出し記録を編集中')}</span>
                                                            <button
                                                                type="button"
                                                                onClick={clearInsurancePartialWithdrawalEditTarget}
                                                                className="rounded-md border border-amber-300 bg-white px-2 py-1 text-[10px] font-black text-amber-700"
                                                            >
                                                                {tByLang('改為新增', 'Switch to New', '新規追加に戻す')}
                                                            </button>
                                                        </div>
                                                    )}
                                                    <div className="space-y-1">
                                                        <label className={FIELD_LABEL_CLASS}>{tByLang('提領金額（選填）', 'Withdrawal Amount (Optional)', '引き出し金額（任意）')}</label>
                                                        <input type="number" step="any" min="0" className={MODAL_INPUT_CLASS} value={formData.insurancePartialWithdrawalAmount || ''} onChange={updateFormField('insurancePartialWithdrawalAmount')} />
                                                        <div className={`text-[10px] font-bold ${isPartialWithdrawalOverLimit ? 'text-rose-600' : 'text-emerald-700'}`}>
                                                            {tByLang('可提領上限：', 'Max Withdrawable:', '引き出し上限：')} {formatAmount(partialWithdrawalMaxAmount)} {formData.currency}
                                                            {isPartialWithdrawalOverLimit
                                                                ? tByLang('（已超過上限）', ' (Exceeds limit)', '（上限超過）')
                                                                : ''}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className={FIELD_LABEL_CLASS}>{tByLang('提領日期（選填）', 'Withdrawal Date (Optional)', '引き出し日（任意）')}</label>
                                                        <DatePicker
                                                            value={formData.insurancePartialWithdrawalDate || ''}
                                                            onChange={updateFormField('insurancePartialWithdrawalDate')}
                                                            className={MODAL_INPUT_CLASS}
                                                            pageLanguage={pageLanguage}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className={FIELD_LABEL_CLASS}>{tByLang('入帳帳戶（選填）', 'Target Account (Optional)', '入金口座（任意）')}</label>
                                                        <select className={MODAL_INPUT_CLASS} value={formData.insurancePartialWithdrawalAccountId || ''} onChange={updateFormField('insurancePartialWithdrawalAccountId')}>
                                                            <option value="">{tByLang('留空沿用扣款帳戶', 'Use payment account when empty', '未入力時は引落口座を使用')}</option>
                                                            {(liquidAssetOptions || []).map(option => (
                                                                <option key={option.id} value={option.id}>{option.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className={FIELD_LABEL_CLASS}>{tByLang('提領備註（選填）', 'Withdrawal Note (Optional)', '引き出しメモ（任意）')}</label>
                                                        <input type="text" className={MODAL_INPUT_CLASS} value={formData.insurancePartialWithdrawalNote || ''} onChange={updateFormField('insurancePartialWithdrawalNote')} />
                                                    </div>
                                                    <div className="md:col-span-2 text-[10px] text-emerald-700 font-bold">
                                                        {((formData.insurancePartialWithdrawalEditCashflowId || '').trim())
                                                            ? tByLang('送出後會更新該筆提領現金流，並依差額同步調整保單價值。', 'On submit, the selected withdrawal cashflow will be updated and policy value will be adjusted by the delta.', '送信後、選択した引き出しキャッシュフローを更新し、差額で保険価値を調整します。')
                                                            : tByLang('送出後會自動新增一筆「單次收入」現金流，並同步扣減本保單價值。', 'On submit, a one-time income cashflow will be created and policy value will be reduced automatically.', '送信後、単発収入キャッシュフローを自動作成し、保険価値を自動で減額します。')}
                                                    </div>
                                                    <div className="md:col-span-2 space-y-2">
                                                        <div className="text-[10px] font-black text-emerald-700 tracking-wide">{tByLang('既有提領紀錄', 'Existing Withdrawal Records', '既存の引き出し記録')}</div>
                                                        {(insurancePartialWithdrawalRecords || []).length === 0 ? (
                                                            <div className="text-[11px] text-slate-500 font-bold">{tByLang('目前沒有提領紀錄', 'No withdrawal records yet', '引き出し記録はありません')}</div>
                                                        ) : (
                                                            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                                                {(insurancePartialWithdrawalRecords || []).map(record => {
                                                                    const accountLabel = (liquidAssetOptions || []).find(option => option.id === record.accountId)?.label || tByLang('未指定帳戶', 'Unspecified account', '口座未指定');
                                                                    const isEditingTarget = String(formData.insurancePartialWithdrawalEditCashflowId || '') === String(record.id || '');
                                                                    return (
                                                                        <div key={record.id} className={`rounded-lg border px-3 py-2 ${isEditingTarget ? 'border-amber-300 bg-amber-50' : 'border-emerald-200 bg-white/80'}`}>
                                                                            <div className="text-[11px] font-black text-slate-700">
                                                                                {record.date || '--'} · {formatAmount(Number(record.amount || 0))} {record.currency || formData.currency}
                                                                            </div>
                                                                            <div className="text-[10px] text-slate-500 font-bold break-all">{accountLabel}</div>
                                                                            {!!record.note && <div className="text-[10px] text-slate-500 font-bold break-all">{record.note}</div>}
                                                                            <div className="mt-2 flex gap-2">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => loadInsurancePartialWithdrawalRecordForEdit(record.id)}
                                                                                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[10px] font-black text-slate-700"
                                                                                >
                                                                                    {tByLang('載入修改', 'Load to Edit', '編集に読み込む')}
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => deleteInsurancePartialWithdrawalRecord(record.id)}
                                                                                    className="rounded-md border border-rose-300 bg-white px-2 py-1 text-[10px] font-black text-rose-700"
                                                                                >
                                                                                    {tByLang('刪除', 'Delete', '削除')}
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </details>
                                        )}
                                    </>
                                )}
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


                        {editingId && !isLiquidForm && !needsPremium && !isMortgageForm && !isLiabilityForm && !isReceivableForm && !isFixedForm && !isFixedDepositForm && !isBankWealthForm && (
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
