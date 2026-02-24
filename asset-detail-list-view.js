(() => {
    const INSURANCE_HEALTH_SUBTYPES = ['醫療險', '重大疾病險', '癌症險', '意外險', '失能/長照險', '健康'];
    const INSURANCE_LIFE_WEALTH_SUBTYPES = ['定期壽險', '終身壽險', '年金險', '儲蓄險', '投資型壽險', '萬能壽險', '人壽/累積財富', '投資/投資相連'];
    const pad2 = (value) => String(value).padStart(2, '0');
    const toDateKeySafe = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
    const parseDateStringSafe = (value) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
        const [year, month, day] = value.split('-').map(Number);
        const parsed = new Date(year, month - 1, day);
        if (parsed.getFullYear() !== year || parsed.getMonth() !== (month - 1) || parsed.getDate() !== day) return null;
        return parsed;
    };
    const buildFirstBillingDate = (startDate, paymentDay, frequency) => {
        if (!startDate) return null;
        const freq = frequency === 'yearly' ? 'yearly' : 'monthly';
        const normalizedDay = Number.isInteger(paymentDay) && paymentDay >= 1 && paymentDay <= 31
            ? paymentDay
            : startDate.getDate();
        let year = startDate.getFullYear();
        let month = startDate.getMonth();
        const dayInMonth = Math.min(normalizedDay, new Date(year, month + 1, 0).getDate());
        let candidate = new Date(year, month, dayInMonth);
        if (candidate.getTime() < startDate.getTime()) {
            if (freq === 'yearly') year += 1;
            else month += 1;
            const daysInNext = Math.min(normalizedDay, new Date(year, month + 1, 0).getDate());
            candidate = new Date(year, month, daysInNext);
        }
        return candidate;
    };
    const getNextBillingDateKey = ({ startDateKey, paymentDay, frequency, endDateKey }) => {
        const startDate = parseDateStringSafe(startDateKey);
        if (!startDate) return '';
        const endDate = parseDateStringSafe(endDateKey || '');
        let cursor = buildFirstBillingDate(startDate, paymentDay, frequency);
        if (!cursor) return '';
        const today = new Date();
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const maxCycles = frequency === 'yearly' ? 200 : 2400;
        for (let i = 0; i < maxCycles; i += 1) {
            if (endDate && cursor.getTime() > endDate.getTime()) return '';
            if (cursor.getTime() >= todayOnly.getTime()) return toDateKeySafe(cursor);
            const nextYear = cursor.getFullYear() + (frequency === 'yearly' ? 1 : 0);
            const nextMonth = cursor.getMonth() + (frequency === 'yearly' ? 0 : 1);
            const normalizedDay = Number.isInteger(paymentDay) && paymentDay >= 1 && paymentDay <= 31 ? paymentDay : cursor.getDate();
            const dayInMonth = Math.min(normalizedDay, new Date(nextYear, nextMonth + 1, 0).getDate());
            cursor = new Date(nextYear, nextMonth, dayInMonth);
        }
        return '';
    };
    const getTotalBillingPeriods = ({ startDateKey, paymentDay, frequency, endDateKey }) => {
        const startDate = parseDateStringSafe(startDateKey);
        const endDate = parseDateStringSafe(endDateKey || '');
        if (!startDate || !endDate) return null;
        let cursor = buildFirstBillingDate(startDate, paymentDay, frequency);
        if (!cursor || cursor.getTime() > endDate.getTime()) return 0;
        let count = 0;
        const maxCycles = frequency === 'yearly' ? 400 : 4800;
        for (let i = 0; i < maxCycles; i += 1) {
            if (cursor.getTime() > endDate.getTime()) break;
            count += 1;
            const nextYear = cursor.getFullYear() + (frequency === 'yearly' ? 1 : 0);
            const nextMonth = cursor.getMonth() + (frequency === 'yearly' ? 0 : 1);
            const normalizedDay = Number.isInteger(paymentDay) && paymentDay >= 1 && paymentDay <= 31 ? paymentDay : cursor.getDate();
            const dayInMonth = Math.min(normalizedDay, new Date(nextYear, nextMonth + 1, 0).getDate());
            cursor = new Date(nextYear, nextMonth, dayInMonth);
        }
        return count;
    };
    const normalizeDistributionStartPolicyYear = ({ startDateKey, rawValue }) => {
        const parsedRaw = Number(rawValue || 0);
        if (!Number.isFinite(parsedRaw) || parsedRaw <= 0) return 0;
        const normalizedRaw = Math.floor(parsedRaw);
        if (normalizedRaw >= 1000) {
            const startDate = parseDateStringSafe(startDateKey || '');
            if (!startDate) return 0;
            return Math.max(1, normalizedRaw - startDate.getFullYear() + 1);
        }
        return normalizedRaw;
    };
    const PAID_OFF_BADGE_CLASS = 'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';

    const AssetDetailMobileCards = ({
        items,
        isLiabilityCategory,
        isInsuranceCategory,
        isMortgageLiability,
        isLoanLiability,
        isCreditCardLiability,
        isPayableLiability,
        isOtherLiability,
        isReceivableCategory,
        isFixedCategory,
        isLiquidCategory,
        isInvestCategory,
        CATEGORIES,
        translate,
        tByLang,
        formatAmount,
        displayCurrency,
        toHKD,
        fromHKD,
        openEdit,
        cashflowAutoRulesByLiquidAssetId,
        insuranceAutoPaidCountByAssetId,
        insurancePartialWithdrawalStatsByAssetId,
        CASHFLOW_FREQUENCIES
    }) => (
        <div className="md:hidden px-4 pt-4 pb-4 space-y-3">
            {items.map(item => {
                const mktValOrig = item.quantity * item.currentPrice;
                const mktValDisplay = fromHKD(toHKD(mktValOrig, item.currency), displayCurrency);
                const isMortgage = isMortgageLiability(item);
                const isLoan = isLoanLiability(item);
                const isCreditCard = isCreditCardLiability(item);
                const isPayable = isPayableLiability(item);
                const isOther = isOtherLiability(item);
                const isReceivableItem = isReceivableCategory;
                const isFixedItem = isFixedCategory;
                const amountPrefix = isLiabilityCategory ? '-' : '';
                const highlightClass = isLiabilityCategory ? 'text-rose-500' : 'text-emerald-600';
                const isHealthInsurance = isInsuranceCategory && INSURANCE_HEALTH_SUBTYPES.includes(item.subtype);
                const isLifeInsurance = isInsuranceCategory && INSURANCE_LIFE_WEALTH_SUBTYPES.includes(item.subtype);
                const isLinkedInsurance = isInsuranceCategory && ['投資型壽險', '投資/投資相連', '萬能壽險'].includes(item.subtype);
                const insurancePaymentDay = Number(item.insurancePaymentDay || 0);
                const insuranceHasPaymentDay = Number.isInteger(insurancePaymentDay) && insurancePaymentDay >= 1 && insurancePaymentDay <= 31;
                const insuranceProvider = (item.insuranceProvider || '').trim();
                const insurancePolicyNumber = (item.insurancePolicyNumber || '').trim();
                const insuranceBeneficiary = (item.insuranceBeneficiary || '').trim();
                const insuranceNote = (item.insuranceNote || '').trim();
                const insuranceSupplementaryBenefitName = (item.insuranceSupplementaryBenefitName || '').trim();
                const insuranceSupplementaryBenefitRegion = (item.insuranceSupplementaryBenefitRegion || '').trim();
                const insuranceSupplementaryBenefitDeductible = (item.insuranceSupplementaryBenefitDeductible || '').trim();
                const insuranceBasePremiumAmount = Number(item.insuranceBasePremiumAmount || 0);
                const insuranceSupplementaryPremiumAmount = Number(item.insuranceSupplementaryPremiumAmount || 0);
                const insuranceCoverageAmount = Number(item.insuranceCoverageAmount || 0);
                const insuranceCoverageDisplay = fromHKD(toHKD(insuranceCoverageAmount, item.currency), displayCurrency);
                const manualPremiumPaidCount = Number(item.premiumPaidCount || 0);
                const autoPremiumPaidCount = Number(insuranceAutoPaidCountByAssetId?.[item.id] || 0);
                const premiumPaymentYearsRaw = Number(item.insurancePremiumPaymentYears || 0);
                const premiumPaymentYears = Number.isFinite(premiumPaymentYearsRaw) && premiumPaymentYearsRaw > 0
                    ? Math.floor(premiumPaymentYearsRaw)
                    : 0;
                const premiumTermsPerYear = item.premiumFrequency === 'yearly' ? 1 : 12;
                const premiumTermCap = premiumPaymentYears > 0 ? premiumPaymentYears * premiumTermsPerYear : 0;
                const paidCountRaw = Math.max(manualPremiumPaidCount, autoPremiumPaidCount);
                const effectivePremiumPaidCount = premiumTermCap > 0 ? Math.min(paidCountRaw, premiumTermCap) : paidCountRaw;
                const isPolicyFullyPaid = premiumTermCap > 0 && effectivePremiumPaidCount >= premiumTermCap;
                const currentPolicyYear = effectivePremiumPaidCount > 0
                    ? (item.premiumFrequency === 'yearly' ? effectivePremiumPaidCount : (Math.floor((effectivePremiumPaidCount - 1) / 12) + 1))
                    : 0;
                const distributionStartYear = normalizeDistributionStartPolicyYear({
                    startDateKey: item.insuranceStartDate,
                    rawValue: item.insuranceDistributionStartPolicyYear
                });
                const annualDistributionAmount = Number(item.insuranceAnnualDistributionAmount || 0);
                const distributionPaidYearsFromCalc = distributionStartYear > 0 && currentPolicyYear >= distributionStartYear
                    ? (currentPolicyYear - distributionStartYear + 1)
                    : 0;
                const distributionPaidYears = Number(item.insuranceDistributionPaidYears || distributionPaidYearsFromCalc || 0);
                const totalDistributedAmount = Number(item.insuranceTotalDistributedAmount || (annualDistributionAmount * distributionPaidYears) || 0);
                const distributionMode = item.insuranceDistributionMode === 'accumulate' ? 'accumulate' : 'cash';
                const accumulationBalance = Number(item.insuranceAccumulationBalance || 0);
                const partialWithdrawalStats = insurancePartialWithdrawalStatsByAssetId?.[item.id] || { count: 0, totalAmount: 0, latestDate: '' };
                const totalBillingPeriods = getTotalBillingPeriods({
                    startDateKey: item.insuranceStartDate || '',
                    paymentDay: insurancePaymentDay,
                    frequency: item.premiumFrequency,
                    endDateKey: item.insuranceEndDate || ''
                });
                const nextBillingDateKey = getNextBillingDateKey({
                    startDateKey: item.insuranceStartDate || '',
                    paymentDay: insurancePaymentDay,
                    frequency: item.premiumFrequency,
                    endDateKey: item.insuranceEndDate || ''
                });

                return (
                    <div key={item.id} onClick={() => openEdit(item)} className="rounded-xl border border-slate-100 bg-white shadow-sm p-4 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="font-black text-slate-800">{translate(item.name || '')}</div>
                                <div className="text-[10px] text-slate-400 font-bold">{translate(CATEGORIES[item.category].label)} / {translate(item.subtype)}</div>
                            </div>
                            <div className={`text-base font-black ${highlightClass}`}>
                                {amountPrefix}{formatAmount(mktValDisplay)} {displayCurrency}
                            </div>
                        </div>
                        {isInsuranceCategory && (
                            <div className="text-xs text-slate-500 font-bold">
                                {isHealthInsurance
                                    ? <>
                                        <span className="text-amber-700">保費 {formatAmount(item.premiumAmount || 0)} {item.currency}</span>
                                        <span>
                                            {isPolicyFullyPaid
                                                ? ''
                                                : ` · ${item.premiumFrequency === 'yearly' ? '每年' : '每月'} · 扣款日 ${insuranceHasPaymentDay ? `${insurancePaymentDay} 號` : '--'} · 下期 ${nextBillingDateKey || '--'}`}
                                        </span>
                                        {isPolicyFullyPaid && (
                                            <span className={`ml-1 ${PAID_OFF_BADGE_CLASS}`}>{tByLang('保費全部繳清', 'Paid Off', '払込完了')}</span>
                                        )}
                                    </>
                                    : isLifeInsurance
                                        ? <span className="text-indigo-700">{tByLang(
                                            isPolicyFullyPaid
                                                ? `保費 ${formatAmount(item.premiumAmount || 0)} ${item.currency} · 已派發 ${distributionPaidYears} 年`
                                                : `保費 ${formatAmount(item.premiumAmount || 0)} ${item.currency} · 已繳 ${effectivePremiumPaidCount}${premiumTermCap > 0 ? `/${premiumTermCap}` : ''} 期 · 已派發 ${distributionPaidYears} 年`,
                                            isPolicyFullyPaid
                                                ? `Premium ${formatAmount(item.premiumAmount || 0)} ${item.currency} · Distributed ${distributionPaidYears} years`
                                                : `Premium ${formatAmount(item.premiumAmount || 0)} ${item.currency} · Paid ${effectivePremiumPaidCount}${premiumTermCap > 0 ? `/${premiumTermCap}` : ''} terms · Distributed ${distributionPaidYears} years`,
                                            isPolicyFullyPaid
                                                ? `保険料 ${formatAmount(item.premiumAmount || 0)} ${item.currency} ・配当 ${distributionPaidYears} 年`
                                                : `保険料 ${formatAmount(item.premiumAmount || 0)} ${item.currency} ・支払済 ${effectivePremiumPaidCount}${premiumTermCap > 0 ? `/${premiumTermCap}` : ''} 期 ・配当 ${distributionPaidYears} 年`
                                        )}</span>
                                        : isLinkedInsurance
                                            ? `保單市值 ${formatAmount(mktValDisplay)} ${displayCurrency} · 數量 ${formatAmount(item.quantity || 0)}`
                                            : <span className="text-amber-700">保費 {formatAmount(item.premiumAmount || 0)} {item.currency}</span>}
                                {isLifeInsurance && isPolicyFullyPaid && (
                                    <span className={`ml-1 ${PAID_OFF_BADGE_CLASS}`}>{tByLang('保費全部繳清', 'Paid Off', '払込完了')}</span>
                                )}
                            </div>
                        )}
                        {isHealthInsurance && insuranceCoverageAmount > 0 && (
                            <div className="text-xs text-slate-500 font-bold">
                                <span className="text-amber-700">名義金額 {formatAmount(insuranceCoverageDisplay)} {displayCurrency}</span>
                                <span className="text-[10px] text-amber-600">（{formatAmount(insuranceCoverageAmount)} {item.currency}）</span>
                            </div>
                        )}
                        {isHealthInsurance && (
                            isPolicyFullyPaid
                                ? <div className="text-xs"><span className={PAID_OFF_BADGE_CLASS}>{tByLang('保費全部繳清', 'Policy fully paid', 'この保険は払込完了')}</span></div>
                                : <div className="text-xs text-slate-500 font-bold">已繳 {effectivePremiumPaidCount} {item.insuranceEndDate ? `/ ${(totalBillingPeriods ?? '--').toString()}期` : '期'}</div>
                        )}
                        {isHealthInsurance && item.insuranceEndDate && (
                            <div className="text-[11px] text-slate-500 font-bold space-y-1">
                                <div>保單生效日: {item.insuranceStartDate || '--'}</div>
                                <div>保單終止日: {item.insuranceEndDate}</div>
                            </div>
                        )}
                        {isInsuranceCategory && (
                            <div className="text-[11px] text-slate-500 font-bold space-y-1">
                                {insuranceProvider && <div className="text-indigo-700">保險公司：{insuranceProvider}</div>}
                                {insurancePolicyNumber && <div className="text-violet-700">保單號：{insurancePolicyNumber}</div>}
                                {insuranceBeneficiary && <div className="text-emerald-700">受益人：{insuranceBeneficiary}</div>}
                                {insuranceCoverageAmount > 0 && <div className="text-amber-700">保額：{formatAmount(insuranceCoverageAmount)} {item.currency}</div>}
                                {isLifeInsurance && (insuranceBasePremiumAmount > 0 || insuranceSupplementaryPremiumAmount > 0) && (
                                    <div className="text-amber-700">
                                        {tByLang('保費組合：主約 ', 'Premium Mix: Base ', '保険料内訳：主契約 ')}{formatAmount(insuranceBasePremiumAmount)} {item.currency}
                                        {insuranceSupplementaryPremiumAmount > 0
                                            ? tByLang(` + 附加 ${formatAmount(insuranceSupplementaryPremiumAmount)} ${item.currency}`, ` + Supplementary ${formatAmount(insuranceSupplementaryPremiumAmount)} ${item.currency}`, ` + 特約 ${formatAmount(insuranceSupplementaryPremiumAmount)} ${item.currency}`)
                                            : ''}
                                    </div>
                                )}
                                {isLifeInsurance && insuranceSupplementaryBenefitName && (
                                    <div className="text-indigo-700">
                                        {tByLang('附加保障：', 'Supplementary Benefit:', '特約：')}
                                        {insuranceSupplementaryBenefitName}
                                        {insuranceSupplementaryBenefitRegion ? ` · ${insuranceSupplementaryBenefitRegion}` : ''}
                                        {insuranceSupplementaryBenefitDeductible ? tByLang(` · 自付費 ${insuranceSupplementaryBenefitDeductible}`, ` · Deductible ${insuranceSupplementaryBenefitDeductible}`, ` ・自己負担 ${insuranceSupplementaryBenefitDeductible}`) : ''}
                                    </div>
                                )}
                                {isLifeInsurance && annualDistributionAmount > 0 && (
                                    <div className="text-indigo-700">
                                        {tByLang('派發：', 'Distribution:', '配当：')} {formatAmount(annualDistributionAmount)} {item.currency}/{tByLang('年', 'yr', '年')} ·
                                        {distributionMode === 'accumulate' ? tByLang(' 積存生息', ' Accumulate', ' 積立利息') : tByLang(' 直接入帳', ' Cash Out', ' 直接入金')}
                                        {distributionMode === 'accumulate' ? ` · ${tByLang('積存', 'Accumulated', '積立')} ${formatAmount(accumulationBalance)} ${item.currency}` : ''}
                                    </div>
                                )}
                                {isLifeInsurance && totalDistributedAmount > 0 && <div className="text-emerald-700">{tByLang('累計派發：', 'Total Distributed:', '累計配当：')}{formatAmount(totalDistributedAmount)} {item.currency}</div>}
                                {isLifeInsurance && partialWithdrawalStats.count > 0 && (
                                    <div className="text-rose-700">
                                        {tByLang('部分提領：', 'Partial Withdrawals:', '一部引き出し：')}
                                        {formatAmount(partialWithdrawalStats.totalAmount)} {item.currency}
                                        {tByLang(`（${partialWithdrawalStats.count} 次）`, ` (${partialWithdrawalStats.count})`, `（${partialWithdrawalStats.count}回）`)}
                                        {partialWithdrawalStats.latestDate ? tByLang(` · 最近 ${partialWithdrawalStats.latestDate}`, ` · Latest ${partialWithdrawalStats.latestDate}`, ` ・最新 ${partialWithdrawalStats.latestDate}`) : ''}
                                    </div>
                                )}
                                {insuranceNote && <div>備註：{insuranceNote}</div>}
                            </div>
                        )}
                        {isMortgage && (
                            <div className="text-xs text-slate-500 font-bold">
                                每月還款 {formatAmount(item.monthlyPayment || 0)} {item.currency} · 已還 {Number(item.paidPeriods || 0)} 期
                            </div>
                        )}
                        {isLoan && (
                            <div className="text-xs text-slate-500 font-bold">
                                每月還款 {formatAmount(item.loanMonthlyPayment || 0)} {item.currency} · 已還 {Number(item.loanPaidPeriods || 0)} 期
                            </div>
                        )}
                        {isCreditCard && (
                            <div className="text-xs text-slate-500 font-bold">
                                最低還款 {formatAmount(item.creditCardMinPayment || 0)} {item.currency} · 到期 {item.creditCardDueDate || '未設定'}
                            </div>
                        )}
                        {isPayable && (
                            <div className="text-xs text-slate-500 font-bold">
                                {tByLang('到期', 'Due', '期限')} {item.payableDueDate || tByLang('未設定', 'Not set', '未設定')} · {Number(item.payableInstallments || 0)
                                    ? tByLang(`分期 ${item.payableInstallments} 期`, `${item.payableInstallments} installments`, `${item.payableInstallments}回分割`)
                                    : tByLang('一次性', 'One-time', '単発')}
                            </div>
                        )}
                        {isOther && (
                            <div className="text-xs text-slate-500 font-bold">
                                年息 {Number(item.otherAnnualRate || 0).toFixed(2)}% · 到期 {item.otherDueDate || '未設定'}
                            </div>
                        )}
                        {isReceivableItem && (
                            <div className="text-xs text-slate-500 font-bold">
                                {tByLang('到期', 'Due', '期限')} {item.receivableDueDate || tByLang('未設定', 'Not set', '未設定')} · {item.receivableParty
                                    ? tByLang(`對象 ${item.receivableParty}`, `Counterparty ${item.receivableParty}`, `相手 ${item.receivableParty}`)
                                    : tByLang('未填對象', 'No counterparty', '相手先未入力')}
                            </div>
                        )}
                        {isFixedItem && (
                            <div className="text-xs text-slate-500 font-bold">
                                {tByLang('購入', 'Purchased', '購入')} {item.fixedPurchaseDate || tByLang('未設定', 'Not set', '未設定')} · {item.fixedNote ? item.fixedNote : tByLang('未填備註', 'No note', '備考未入力')}
                            </div>
                        )}
                        {isLiquidCategory && (
                            <div className="space-y-1">
                                <div className="text-xs text-slate-500 font-bold flex items-center gap-2">
                                    <span>餘額 {formatAmount(item.quantity)}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">{item.currency}</span>
                                </div>
                                {cashflowAutoRulesByLiquidAssetId[item.id]?.length > 0 && (
                                    <div className="text-[10px] text-indigo-500 font-black">
                                        自動規則：{cashflowAutoRulesByLiquidAssetId[item.id].slice(0, 2).map(rule => {
                                            const modeLabel = rule.frequency === 'MONTHLY'
                                                ? tByLang(`每月${rule.payday || rule.monthday || '--'}號`, `Monthly ${rule.payday || rule.monthday || '--'}`, `毎月${rule.payday || rule.monthday || '--'}日`)
                                                : (rule.frequency === 'ONE_TIME' ? tByLang('單次', 'One-time', '単発') : (CASHFLOW_FREQUENCIES.find(entry => entry.value === rule.frequency)?.label || rule.frequency));
                                            return `${rule.title}（${modeLabel}）`;
                                        }).join('、')}
                                        {cashflowAutoRulesByLiquidAssetId[item.id].length > 2
                                            ? tByLang(` 等 ${cashflowAutoRulesByLiquidAssetId[item.id].length} 筆`, ` and ${cashflowAutoRulesByLiquidAssetId[item.id].length} more`, ` ほか ${cashflowAutoRulesByLiquidAssetId[item.id].length} 件`)
                                            : ''}
                                    </div>
                                )}
                            </div>
                        )}
                        {isInvestCategory && (() => {
                            const costValOrig = item.quantity * item.costBasis;
                            const profitOrig = mktValOrig - costValOrig;
                            const profitDisplay = fromHKD(toHKD(profitOrig, item.currency), displayCurrency);
                            const perf = costValOrig > 0 ? (profitOrig / costValOrig) * 100 : 0;
                            const isFixedDepositItem = item.subtype === '定期存款';
                            const fixedDepositMonths = Number(item.fixedDepositMonths || 0);
                            const fixedDepositRate = Number(item.fixedDepositAnnualRate || 0);
                            const fixedDepositStartDate = item.fixedDepositStartDate || '';

                            return (
                                <div className="space-y-1 text-xs font-bold">
                                    <div className="text-slate-500">市值 {formatAmount(mktValDisplay)} {displayCurrency} · 數量 {formatAmount(item.quantity)} {item.symbol ? `(${item.symbol})` : ''}</div>
                                    <div className="text-slate-500">現價 {formatAmount(item.currentPrice)} · 成本 {formatAmount(item.costBasis)} {item.currency}</div>
                                    {isFixedDepositItem && (
                                        <div className="text-slate-500">定期 {fixedDepositMonths || '--'} 個月 · 年利率 {fixedDepositRate.toFixed(2)}% {fixedDepositStartDate ? `· 起存 ${fixedDepositStartDate}` : ''}</div>
                                    )}
                                    <div className={`${profitOrig >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        <div className="font-black text-sm">持倉盈虧 {profitOrig >= 0 ? '+' : ''}{formatAmount(profitDisplay)} {displayCurrency}</div>
                                        <div className="font-bold text-xs">績效 {perf >= 0 ? '+' : ''}{perf.toFixed(2)}%</div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                );
            })}
        </div>
    );

    const AssetDetailDesktopTable = ({
        items,
        isInvestCategory,
        isInsuranceCategory,
        isLiquidCategory,
        isLiabilityCategory,
        isReceivableCategory,
        isFixedCategory,
        CATEGORIES,
        translate,
        tByLang,
        toHKD,
        fromHKD,
        formatAmount,
        displayCurrency,
        openEdit,
        cashflowAutoRulesByLiquidAssetId,
        insuranceAutoPaidCountByAssetId,
        insurancePartialWithdrawalStatsByAssetId
    }) => {
        const isHealthInsuranceGroup = isInsuranceCategory && items.length > 0 && items.every(item => INSURANCE_HEALTH_SUBTYPES.includes(item.subtype));
        const isLifeInsuranceGroup = isInsuranceCategory && items.length > 0 && items.every(item => INSURANCE_LIFE_WEALTH_SUBTYPES.includes(item.subtype));

        return (
        <div className="hidden md:block overflow-x-auto -mx-4 sm:mx-0">
            <div className="px-4 sm:px-0">
                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 md:hidden">左右滑動查看完整欄位</div>
                <table className={`w-full text-left ${isInvestCategory ? 'min-w-[780px]' : (isInsuranceCategory ? ((isHealthInsuranceGroup || isLifeInsuranceGroup) ? 'min-w-[980px]' : 'min-w-[700px]') : 'min-w-[620px]')}`}>
                    {isLiquidCategory && (
                        <colgroup>
                            <col style={{ width: '60%' }} />
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '20%' }} />
                        </colgroup>
                    )}
                    {isInsuranceCategory && !isHealthInsuranceGroup && !isLifeInsuranceGroup && (
                        <colgroup>
                            <col style={{ width: '40%' }} />
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '20%' }} />
                        </colgroup>
                    )}
                    {isInsuranceCategory && (isHealthInsuranceGroup || isLifeInsuranceGroup) && (
                        <colgroup>
                            <col style={{ width: '28%' }} />
                            <col style={{ width: '14%' }} />
                            <col style={{ width: '22%' }} />
                            <col style={{ width: '18%' }} />
                            <col style={{ width: '18%' }} />
                        </colgroup>
                    )}
                    {isInvestCategory && (
                        <colgroup>
                            <col style={{ width: '30%' }} />
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '15%' }} />
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '15%' }} />
                        </colgroup>
                    )}
                    <thead className="text-[10px] font-black text-slate-400 uppercase tracking-tighter bg-slate-50/30">
                        <tr>
                            <th className="px-6 py-3">{translate('名稱 / 細項')}</th>
                            <th className="px-6 py-3 text-right">{isInsuranceCategory ? ((isHealthInsuranceGroup || isLifeInsuranceGroup) ? translate('保額/名義金額') : translate('保費設定')) : isLiquidCategory ? translate('數量 / 幣別') : isLiabilityCategory ? translate('金額 / 期數') : isReceivableCategory ? translate('應收金額 / 期數') : isFixedCategory ? translate('估值 / 成本') : translate('市值 / 數量')}</th>
                            <th className="px-6 py-3 text-right">{isInsuranceCategory ? ((isHealthInsuranceGroup || isLifeInsuranceGroup) ? translate('保費設定') : translate('已繳期數')) : isLiquidCategory ? translate('餘額') : isLiabilityCategory ? translate('利率 / 到期') : isReceivableCategory ? translate('到期 / 對象') : isFixedCategory ? translate('購入日 / 備註') : translate('現價 / 成本')}</th>
                            {isInsuranceCategory && (isHealthInsuranceGroup || isLifeInsuranceGroup) && <th className="px-6 py-3 text-right">{translate('已繳期數')}</th>}
                            {isInsuranceCategory && <th className="px-6 py-3 text-right">{translate('保單價值')}</th>}
                            {isInvestCategory && <th className="px-6 py-3 text-right">{translate('持倉盈虧')}</th>}
                            {isInvestCategory && <th className="px-6 py-3 text-right">{translate('績效')}</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {items.map(item => {
                            const mktValOrig = item.quantity * item.currentPrice;
                            const costValOrig = item.quantity * item.costBasis;
                            const profitOrig = mktValOrig - costValOrig;
                            const mktValDisplay = fromHKD(toHKD(mktValOrig, item.currency), displayCurrency);
                            const profitDisplay = fromHKD(toHKD(profitOrig, item.currency), displayCurrency);
                            const perf = costValOrig > 0 ? (profitOrig / costValOrig) * 100 : 0;
                            const premiumAmount = Number(item.premiumAmount || 0);
                            const manualPremiumPaidCount = Number(item.premiumPaidCount || 0);
                            const autoPremiumPaidCount = Number(insuranceAutoPaidCountByAssetId?.[item.id] || 0);
                            const premiumPaymentYearsRaw = Number(item.insurancePremiumPaymentYears || 0);
                            const premiumPaymentYears = Number.isFinite(premiumPaymentYearsRaw) && premiumPaymentYearsRaw > 0
                                ? Math.floor(premiumPaymentYearsRaw)
                                : 0;
                            const premiumTermsPerYear = item.premiumFrequency === 'yearly' ? 1 : 12;
                            const premiumTermCap = premiumPaymentYears > 0 ? premiumPaymentYears * premiumTermsPerYear : 0;
                            const paidCountRaw = Math.max(manualPremiumPaidCount, autoPremiumPaidCount);
                            const effectivePremiumPaidCount = premiumTermCap > 0 ? Math.min(paidCountRaw, premiumTermCap) : paidCountRaw;
                            const isPolicyFullyPaid = premiumTermCap > 0 && effectivePremiumPaidCount >= premiumTermCap;
                            const hasPremiumPlan = premiumAmount > 0 && effectivePremiumPaidCount >= 0;
                            const premiumTotalOrig = premiumAmount * effectivePremiumPaidCount;
                            const premiumTotalDisplay = fromHKD(toHKD(premiumTotalOrig, item.currency), displayCurrency);
                            const isHealthInsurance = isInsuranceCategory && INSURANCE_HEALTH_SUBTYPES.includes(item.subtype);
                            const isLifeInsurance = isInsuranceCategory && INSURANCE_LIFE_WEALTH_SUBTYPES.includes(item.subtype);
                            const isLinkedInsurance = isInsuranceCategory && ['投資型壽險', '投資/投資相連', '萬能壽險'].includes(item.subtype);
                            const currentPolicyYear = effectivePremiumPaidCount > 0
                                ? (item.premiumFrequency === 'yearly' ? effectivePremiumPaidCount : (Math.floor((effectivePremiumPaidCount - 1) / 12) + 1))
                                : 0;
                            const distributionStartYear = normalizeDistributionStartPolicyYear({
                                startDateKey: item.insuranceStartDate,
                                rawValue: item.insuranceDistributionStartPolicyYear
                            });
                            const annualDistributionAmount = Number(item.insuranceAnnualDistributionAmount || 0);
                            const distributionPaidYearsFromCalc = distributionStartYear > 0 && currentPolicyYear >= distributionStartYear
                                ? (currentPolicyYear - distributionStartYear + 1)
                                : 0;
                            const distributionPaidYears = Number(item.insuranceDistributionPaidYears || distributionPaidYearsFromCalc || 0);
                            const totalDistributedAmount = Number(item.insuranceTotalDistributedAmount || (annualDistributionAmount * distributionPaidYears) || 0);
                            const accumulationBalance = Number(item.insuranceAccumulationBalance || 0);
                            const distributionMode = item.insuranceDistributionMode === 'accumulate' ? 'accumulate' : 'cash';
                            const partialWithdrawalStats = insurancePartialWithdrawalStatsByAssetId?.[item.id] || { count: 0, totalAmount: 0, latestDate: '' };
                            const insurancePaymentDay = Number(item.insurancePaymentDay || 0);
                            const insuranceHasPaymentDay = Number.isInteger(insurancePaymentDay) && insurancePaymentDay >= 1 && insurancePaymentDay <= 31;
                            const insuranceProvider = (item.insuranceProvider || '').trim();
                            const insurancePolicyNumber = (item.insurancePolicyNumber || '').trim();
                            const insuranceBeneficiary = (item.insuranceBeneficiary || '').trim();
                            const insuranceNote = (item.insuranceNote || '').trim();
                            const insuranceSupplementaryBenefitName = (item.insuranceSupplementaryBenefitName || '').trim();
                            const insuranceSupplementaryBenefitRegion = (item.insuranceSupplementaryBenefitRegion || '').trim();
                            const insuranceSupplementaryBenefitDeductible = (item.insuranceSupplementaryBenefitDeductible || '').trim();
                            const insuranceBasePremiumAmount = Number(item.insuranceBasePremiumAmount || 0);
                            const insuranceSupplementaryPremiumAmount = Number(item.insuranceSupplementaryPremiumAmount || 0);
                            const insuranceCoverageAmount = Number(item.insuranceCoverageAmount || 0);
                            const insuranceCoverageDisplay = fromHKD(toHKD(insuranceCoverageAmount, item.currency), displayCurrency);
                            const nextBillingDateKey = getNextBillingDateKey({
                                startDateKey: item.insuranceStartDate || '',
                                paymentDay: insurancePaymentDay,
                                frequency: item.premiumFrequency,
                                endDateKey: item.insuranceEndDate || ''
                            });
                            const totalBillingPeriods = getTotalBillingPeriods({
                                startDateKey: item.insuranceStartDate || '',
                                paymentDay: insurancePaymentDay,
                                frequency: item.premiumFrequency,
                                endDateKey: item.insuranceEndDate || ''
                            });
                            const isMortgageLiability = isLiabilityCategory && item.subtype === '房貸';
                            const isLoanLiability = isLiabilityCategory && item.subtype === '貸款';
                            const isCreditCardLiability = isLiabilityCategory && item.subtype === '信用卡';
                            const isPayableLiability = isLiabilityCategory && item.subtype === '應付款';
                            const isOtherLiability = isLiabilityCategory && item.subtype === '其他負債';
                            const isReceivableItem = isReceivableCategory;
                            const isFixedItem = isFixedCategory;
                            const mortgageDownPaymentDisplay = fromHKD(toHKD(Number(item.downPayment || 0), item.currency), displayCurrency);
                            const mortgageLoanDisplay = fromHKD(toHKD(Number(item.loanAmount || costValOrig), item.currency), displayCurrency);
                            const mortgageInterestDisplay = fromHKD(toHKD(Number(item.totalInterest || 0), item.currency), displayCurrency);
                            const mortgageMonthlyDisplay = fromHKD(toHKD(Number(item.monthlyPayment || 0), item.currency), displayCurrency);
                            const mortgageOutstandingDisplay = fromHKD(toHKD(Number(item.outstandingPrincipal || mktValOrig), item.currency), displayCurrency);
                            const mortgageAnnualRate = Number(item.annualInterestRate || 0);
                            const mortgagePaidPeriods = Number(item.paidPeriods || 0);
                            const mortgageTotalPeriods = Number(item.totalPeriods || 0);
                            const mortgageRemainingPeriods = Number(item.remainingPeriods || Math.max(0, mortgageTotalPeriods - mortgagePaidPeriods));
                            const loanMonthlyDisplay = fromHKD(toHKD(Number(item.loanMonthlyPayment || 0), item.currency), displayCurrency);
                            const loanOutstandingDisplay = fromHKD(toHKD(Number(item.loanOutstandingPrincipal || 0), item.currency), displayCurrency);
                            const loanTotalInterestDisplay = fromHKD(toHKD(Number(item.loanTotalInterest || 0), item.currency), displayCurrency);
                            const loanAnnualRate = Number(item.loanAnnualInterestRate || 0);
                            const loanPaidPeriods = Number(item.loanPaidPeriods || 0);
                            const loanTotalPeriods = Number(item.loanTotalPeriods || 0);
                            const loanRemainingPeriods = Number(item.loanRemainingPeriods || Math.max(0, loanTotalPeriods - loanPaidPeriods));
                            const creditCardBalanceDisplay = fromHKD(toHKD(Number(item.creditCardBalance || 0), item.currency), displayCurrency);
                            const creditCardMinPaymentDisplay = fromHKD(toHKD(Number(item.creditCardMinPayment || 0), item.currency), displayCurrency);
                            const creditCardAnnualRate = Number(item.creditCardAnnualRate || 0);
                            const payableAmountDisplay = fromHKD(toHKD(Number(item.payableAmount || 0), item.currency), displayCurrency);
                            const payableInstallments = Number(item.payableInstallments || 0);
                            const otherOutstandingDisplay = fromHKD(toHKD(Number(item.otherOutstanding || 0), item.currency), displayCurrency);
                            const otherAnnualRate = Number(item.otherAnnualRate || 0);
                            const receivableAmountDisplay = fromHKD(toHKD(Number(item.receivableAmount || mktValOrig), item.currency), displayCurrency);
                            const receivableInstallments = Number(item.receivableInstallments || 0);
                            const fixedPurchaseDisplay = fromHKD(toHKD(Number(item.fixedPurchasePrice || costValOrig), item.currency), displayCurrency);
                            const fixedCurrentDisplay = fromHKD(toHKD(Number(item.fixedCurrentValue || mktValOrig), item.currency), displayCurrency);
                            const isPerfPositive = perf > 0;
                            const isPerfNegative = perf < 0;
                            const perfClass = isPerfPositive
                                ? 'text-emerald-700 bg-emerald-50 ring-emerald-100'
                                : isPerfNegative
                                    ? 'text-rose-700 bg-rose-50 ring-rose-100'
                                    : 'text-slate-600 bg-slate-100 ring-slate-200';
                            const perfIcon = isPerfPositive ? '↗' : isPerfNegative ? '↘' : '•';

                            return (
                                <tr key={item.id} onClick={() => openEdit(item)} className="hover:bg-indigo-50/30 cursor-pointer transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800">{translate(item.name || '')}</div>
                                        <div className="text-[10px] text-slate-400 font-medium">{translate(CATEGORIES[item.category].label)} / {translate(item.subtype)}</div>
                                        {isMortgageLiability && (
                                            <div className="text-[10px] text-slate-500 font-medium mt-1">
                                                首期 {formatAmount(mortgageDownPaymentDisplay)} {displayCurrency} · 貸款 {formatAmount(mortgageLoanDisplay)} {displayCurrency} · 利息 {formatAmount(mortgageInterestDisplay)} {displayCurrency}
                                            </div>
                                        )}
                                        {isLoanLiability && (
                                            <div className="text-[10px] text-slate-500 font-medium mt-1">
                                                未償本金 {formatAmount(loanOutstandingDisplay)} {displayCurrency} · 利息 {formatAmount(loanTotalInterestDisplay)} {displayCurrency}
                                            </div>
                                        )}
                                        {isReceivableItem && (
                                            <div className="text-[10px] text-slate-500 font-medium mt-1">
                                                {item.receivableParty ? `對象 ${item.receivableParty}` : '未填對象'}
                                            </div>
                                        )}
                                        {isFixedItem && item.fixedNote && (
                                            <div className="text-[10px] text-slate-500 font-medium mt-1">
                                                {item.fixedNote}
                                            </div>
                                        )}
                                        {isInsuranceCategory && (
                                            <div className="text-[10px] text-slate-500 font-medium mt-1 space-y-0.5">
                                                {insuranceProvider && <div className="text-indigo-700">保險公司：{insuranceProvider}</div>}
                                                {insurancePolicyNumber && <div className="text-violet-700">保單號：{insurancePolicyNumber}</div>}
                                                {insuranceBeneficiary && <div className="text-emerald-700">受益人：{insuranceBeneficiary}</div>}
                                                {isLifeInsurance && (insuranceBasePremiumAmount > 0 || insuranceSupplementaryPremiumAmount > 0) && (
                                                    <div className="text-amber-700">
                                                        {tByLang('保費組合：主約 ', 'Premium Mix: Base ', '保険料内訳：主契約 ')}{formatAmount(insuranceBasePremiumAmount)} {item.currency}
                                                        {insuranceSupplementaryPremiumAmount > 0
                                                            ? tByLang(` + 附加 ${formatAmount(insuranceSupplementaryPremiumAmount)} ${item.currency}`, ` + Supplementary ${formatAmount(insuranceSupplementaryPremiumAmount)} ${item.currency}`, ` + 特約 ${formatAmount(insuranceSupplementaryPremiumAmount)} ${item.currency}`)
                                                            : ''}
                                                    </div>
                                                )}
                                                {isLifeInsurance && insuranceSupplementaryBenefitName && (
                                                    <div className="text-indigo-700">
                                                        {tByLang('附加保障：', 'Supplementary Benefit:', '特約：')}
                                                        {insuranceSupplementaryBenefitName}
                                                        {insuranceSupplementaryBenefitRegion ? ` · ${insuranceSupplementaryBenefitRegion}` : ''}
                                                        {insuranceSupplementaryBenefitDeductible ? tByLang(` · 自付費 ${insuranceSupplementaryBenefitDeductible}`, ` · Deductible ${insuranceSupplementaryBenefitDeductible}`, ` ・自己負担 ${insuranceSupplementaryBenefitDeductible}`) : ''}
                                                    </div>
                                                )}
                                                {isLifeInsurance && partialWithdrawalStats.count > 0 && (
                                                    <div className="text-rose-700">
                                                        {tByLang(
                                                            `部分提領：${formatAmount(partialWithdrawalStats.totalAmount)} ${item.currency}（${partialWithdrawalStats.count} 次）${partialWithdrawalStats.latestDate ? ` · 最近 ${partialWithdrawalStats.latestDate}` : ''}`,
                                                            `Partial Withdrawals: ${formatAmount(partialWithdrawalStats.totalAmount)} ${item.currency} (${partialWithdrawalStats.count})${partialWithdrawalStats.latestDate ? ` · Latest ${partialWithdrawalStats.latestDate}` : ''}`,
                                                            `一部引き出し：${formatAmount(partialWithdrawalStats.totalAmount)} ${item.currency}（${partialWithdrawalStats.count}回）${partialWithdrawalStats.latestDate ? ` ・最新 ${partialWithdrawalStats.latestDate}` : ''}`
                                                        )}
                                                    </div>
                                                )}
                                                {insuranceNote && <div>備註：{insuranceNote}</div>}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {isInsuranceCategory ? (
                                            (isHealthInsurance && isHealthInsuranceGroup) || (isLifeInsurance && isLifeInsuranceGroup) ? (
                                                insuranceCoverageAmount > 0 ? (
                                                    <>
                                                        <div className="font-bold text-amber-700">{formatAmount(insuranceCoverageDisplay)} <span className="text-[9px] text-amber-500">{displayCurrency}</span></div>
                                                        <div className="text-[10px] text-amber-600">{formatAmount(insuranceCoverageAmount)} {item.currency}</div>
                                                    </>
                                                ) : (
                                                    <div className="font-bold text-slate-400">--</div>
                                                )
                                            ) : isHealthInsurance ? (
                                                <div className="font-bold text-amber-700">
                                                    {formatAmount(premiumAmount)} {item.currency}
                                                    <div className="text-[10px] text-slate-400">/{item.premiumFrequency === 'yearly' ? '每年' : '每月'} · 扣款日 {insuranceHasPaymentDay ? `${insurancePaymentDay} 號` : '--'}</div>
                                                </div>
                                            ) : isLifeInsurance ? (
                                                hasPremiumPlan ? (
                                                    <div className="font-bold text-amber-700">
                                                        {formatAmount(premiumAmount)} {item.currency}
                                                        <div className="text-[10px] text-slate-400">/{item.premiumFrequency === 'yearly' ? tByLang('每年', 'yearly', '毎年') : tByLang('每月', 'monthly', '毎月')}{premiumPaymentYears > 0 ? tByLang(` · 繳費 ${premiumPaymentYears} 年`, ` · Pay ${premiumPaymentYears} yrs`, ` ・払込 ${premiumPaymentYears} 年`) : ''}</div>
                                                    </div>
                                                ) : (
                                                    <div className="font-bold text-slate-400">--</div>
                                                )
                                            ) : isLinkedInsurance ? (
                                                <>
                                                    <div className="font-bold text-slate-800">{formatAmount(mktValDisplay)} <span className="text-[9px] text-slate-400">{displayCurrency}</span></div>
                                                    <div className="text-[10px] text-slate-400">數量 {formatAmount(item.quantity || 0)}</div>
                                                </>
                                            ) : (
                                                <div className="font-bold text-slate-400">--</div>
                                            )
                                        ) : isLiquidCategory ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="font-bold text-slate-800 tabular-nums text-right">{formatAmount(item.quantity)}</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 w-12 text-center">{item.currency}</span>
                                            </div>
                                        ) : isMortgageLiability ? (
                                            <>
                                                <div className="font-bold text-slate-800">{formatAmount(mortgageMonthlyDisplay)} <span className="text-[9px] text-slate-400">{displayCurrency}</span></div>
                                                <div className="text-[10px] text-slate-400">{formatAmount(Number(item.monthlyPayment || 0))} {item.currency} · 共 {mortgageTotalPeriods} 期</div>
                                            </>
                                        ) : isLoanLiability ? (
                                            <>
                                                <div className="font-bold text-slate-800">{formatAmount(loanMonthlyDisplay)} <span className="text-[9px] text-slate-400">{displayCurrency}</span></div>
                                                <div className="text-[10px] text-slate-400">{formatAmount(Number(item.loanMonthlyPayment || 0))} {item.currency} · 共 {loanTotalPeriods} 期</div>
                                            </>
                                        ) : isCreditCardLiability ? (
                                            <>
                                                <div className="font-bold text-slate-800">{formatAmount(creditCardBalanceDisplay)} <span className="text-[9px] text-slate-400">{displayCurrency}</span></div>
                                                <div className="text-[10px] text-slate-400">最低還款 {formatAmount(creditCardMinPaymentDisplay)} {displayCurrency}</div>
                                            </>
                                        ) : isPayableLiability ? (
                                            <>
                                                <div className="font-bold text-slate-800">{formatAmount(payableAmountDisplay)} <span className="text-[9px] text-slate-400">{displayCurrency}</span></div>
                                                <div className="text-[10px] text-slate-400">{payableInstallments ? tByLang(`分期 ${payableInstallments} 期`, `${payableInstallments} installments`, `${payableInstallments}回分割`) : tByLang('一次性', 'One-time', '単発')}</div>
                                            </>
                                        ) : isOtherLiability ? (
                                            <>
                                                <div className="font-bold text-slate-800">{formatAmount(otherOutstandingDisplay)} <span className="text-[9px] text-slate-400">{displayCurrency}</span></div>
                                                <div className="text-[10px] text-slate-400">{item.otherDueDate ? tByLang(`到期 ${item.otherDueDate}`, `Due ${item.otherDueDate}`, `期限 ${item.otherDueDate}`) : tByLang('未設定到期日', 'No due date set', '期限未設定')}</div>
                                            </>
                                        ) : isReceivableItem ? (
                                            <>
                                                <div className="font-bold text-slate-800">{formatAmount(receivableAmountDisplay)} <span className="text-[9px] text-slate-400">{displayCurrency}</span></div>
                                                <div className="text-[10px] text-slate-400">{receivableInstallments ? tByLang(`分期 ${receivableInstallments} 期`, `${receivableInstallments} installments`, `${receivableInstallments}回分割`) : tByLang('一次性', 'One-time', '単発')}</div>
                                            </>
                                        ) : isFixedItem ? (
                                            <>
                                                <div className="font-bold text-slate-800">{formatAmount(fixedCurrentDisplay)} <span className="text-[9px] text-slate-400">{displayCurrency}</span></div>
                                                <div className="text-[10px] text-slate-400">成本 {formatAmount(fixedPurchaseDisplay)} {displayCurrency}</div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="font-bold text-slate-800">{formatAmount(mktValDisplay)} <span className="text-[9px] text-slate-400">{displayCurrency}</span></div>
                                                <div className="text-[10px] text-slate-400">{item.quantity.toLocaleString()} {item.symbol ? `(${item.symbol})` : ''}</div>
                                            </>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {isInsuranceCategory ? (
                                            (isHealthInsurance && isHealthInsuranceGroup) || (isLifeInsurance && isLifeInsuranceGroup) ? (
                                                <>
                                                    <div className="font-bold text-amber-700">{formatAmount(premiumAmount)} {item.currency}</div>
                                                    {!isPolicyFullyPaid ? (
                                                        <>
                                                            <div className="text-[10px] text-slate-400">繳費週期：{item.premiumFrequency === 'yearly' ? '每年' : '每月'}</div>
                                                            <div className="text-[10px] text-slate-400">扣款日：{insuranceHasPaymentDay ? `${insurancePaymentDay} 號` : '--'}</div>
                                                            <div className="text-[10px] text-slate-400">下期扣款日：{nextBillingDateKey || '--'}</div>
                                                        </>
                                                    ) : (
                                                        <div className="text-[10px]"><span className={PAID_OFF_BADGE_CLASS}>{tByLang('保費全部繳清', 'Policy fully paid', 'この保険は払込完了')}</span></div>
                                                    )}
                                                    {isLifeInsurance && annualDistributionAmount > 0 && (
                                                        <div className="text-[10px] text-indigo-600">{tByLang(`每年派發 ${formatAmount(annualDistributionAmount)} ${item.currency}`, `Annual Distribution ${formatAmount(annualDistributionAmount)} ${item.currency}`, `年間配当 ${formatAmount(annualDistributionAmount)} ${item.currency}`)}</div>
                                                    )}
                                                </>
                                            ) : isHealthInsurance ? (
                                                <>
                                                    <div className="font-medium text-slate-700">{effectivePremiumPaidCount.toLocaleString()} 期</div>
                                                    <div className="text-[10px] text-slate-400">生效 {item.insuranceStartDate || '--'}{item.insuranceEndDate ? ` · 終止 ${item.insuranceEndDate}` : ''}</div>
                                                </>
                                            ) : isLifeInsurance ? (
                                                hasPremiumPlan ? (
                                                    <>
                                                        <div className={`font-medium ${isPolicyFullyPaid ? 'text-emerald-700 font-black' : 'text-slate-700'}`}>
                                                            {isPolicyFullyPaid
                                                                ? tByLang('保費全部繳清', 'Paid Off', '払込完了')
                                                                : `${effectivePremiumPaidCount.toLocaleString()}${premiumTermCap > 0 ? ` / ${premiumTermCap}` : ''} 期`}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400">{tByLang(`保單年度 ${currentPolicyYear || '--'} · 已派發 ${distributionPaidYears} 年`, `Policy Year ${currentPolicyYear || '--'} · Distributed ${distributionPaidYears} yrs`, `保険年度 ${currentPolicyYear || '--'} ・配当 ${distributionPaidYears} 年`)}</div>
                                                        {annualDistributionAmount > 0 && <div className="text-[10px] text-indigo-600">{tByLang(`每年派發 ${formatAmount(annualDistributionAmount)} ${item.currency}`, `Annual Distribution ${formatAmount(annualDistributionAmount)} ${item.currency}`, `年間配当 ${formatAmount(annualDistributionAmount)} ${item.currency}`)}</div>}
                                                    </>
                                                ) : (
                                                    <div className="font-medium text-slate-400">--</div>
                                                )
                                            ) : isLinkedInsurance ? (
                                                <>
                                                    <div className="font-medium text-slate-700">{effectivePremiumPaidCount.toLocaleString()} 期</div>
                                                    <div className="text-[10px] text-slate-400">現價 {formatAmount(item.currentPrice || 0)} · 成本 {formatAmount(item.costBasis || 0)} {item.currency}</div>
                                                </>
                                            ) : (
                                                <div className="font-medium text-slate-400">--</div>
                                            )
                                        ) : isLiquidCategory ? (
                                            <>
                                                <div className="font-medium text-slate-700">{formatAmount(mktValDisplay)} <span className="text-[9px]">{displayCurrency}</span></div>
                                                {cashflowAutoRulesByLiquidAssetId[item.id]?.length > 0 && (
                                                    <div className="text-[10px] text-indigo-500 font-black mt-1">
                                                        已綁定 {cashflowAutoRulesByLiquidAssetId[item.id].length} 筆自動入帳/扣款規則
                                                    </div>
                                                )}
                                            </>
                                        ) : isMortgageLiability ? (
                                            <>
                                                <div className="font-medium text-slate-700">年息 {mortgageAnnualRate.toFixed(2)}%</div>
                                                <div className="text-[10px] text-slate-400">已還 {mortgagePaidPeriods} 期 · 尚餘 {mortgageRemainingPeriods} 期</div>
                                                <div className="text-[10px] text-slate-400">未償本金 {formatAmount(mortgageOutstandingDisplay)} {displayCurrency}</div>
                                            </>
                                        ) : isLoanLiability ? (
                                            <>
                                                <div className="font-medium text-slate-700">年息 {loanAnnualRate.toFixed(2)}%</div>
                                                <div className="text-[10px] text-slate-400">已還 {loanPaidPeriods} 期 · 尚餘 {loanRemainingPeriods} 期</div>
                                                <div className="text-[10px] text-slate-400">未償本金 {formatAmount(loanOutstandingDisplay)} {displayCurrency}</div>
                                            </>
                                        ) : isCreditCardLiability ? (
                                            <>
                                                <div className="font-medium text-slate-700">年息 {creditCardAnnualRate.toFixed(2)}%</div>
                                                <div className="text-[10px] text-slate-400">{tByLang('到期', 'Due', '期限')} {item.creditCardDueDate || tByLang('未設定', 'Not set', '未設定')}</div>
                                            </>
                                        ) : isPayableLiability ? (
                                            <>
                                                <div className="font-medium text-slate-700">{tByLang('到期', 'Due', '期限')} {item.payableDueDate || tByLang('未設定', 'Not set', '未設定')}</div>
                                                {payableInstallments ? (
                                                    <div className="text-[10px] text-slate-400">每期約 {formatAmount(payableAmountDisplay / payableInstallments)} {displayCurrency}</div>
                                                ) : (
                                                    <div className="text-[10px] text-slate-400">{tByLang('一次性支付', 'One-time payment', '一括払い')}</div>
                                                )}
                                            </>
                                        ) : isOtherLiability ? (
                                            <>
                                                <div className="font-medium text-slate-700">年息 {otherAnnualRate.toFixed(2)}%</div>
                                                <div className="text-[10px] text-slate-400">{tByLang('到期', 'Due', '期限')} {item.otherDueDate || tByLang('未設定', 'Not set', '未設定')}</div>
                                            </>
                                        ) : isReceivableItem ? (
                                            <>
                                                <div className="font-medium text-slate-700">{tByLang('到期', 'Due', '期限')} {item.receivableDueDate || tByLang('未設定', 'Not set', '未設定')}</div>
                                                <div className="text-[10px] text-slate-400">{item.receivableParty ? tByLang(`對象 ${item.receivableParty}`, `Counterparty ${item.receivableParty}`, `相手 ${item.receivableParty}`) : tByLang('未填對象', 'No counterparty', '相手先未入力')}</div>
                                            </>
                                        ) : isFixedItem ? (
                                            <>
                                                <div className="font-medium text-slate-700">{tByLang('購入', 'Purchased', '購入')} {item.fixedPurchaseDate || tByLang('未設定', 'Not set', '未設定')}</div>
                                                <div className="text-[10px] text-slate-400">{item.fixedNote ? tByLang(`備註 ${item.fixedNote}`, `Note ${item.fixedNote}`, `備考 ${item.fixedNote}`) : tByLang('未填備註', 'No note', '備考未入力')}</div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="font-medium text-slate-700">{formatAmount(item.currentPrice)}</div>
                                                <div className="text-[10px] text-slate-400">{formatAmount(item.costBasis)} <span className="text-[9px]">{item.currency}</span></div>
                                            </>
                                        )}
                                    </td>
                                    {isInsuranceCategory && (isHealthInsuranceGroup || isLifeInsuranceGroup) && (
                                        <td className="px-6 py-4 text-right">
                                            {isPolicyFullyPaid ? (
                                                <>
                                                    <div className="font-medium"><span className={PAID_OFF_BADGE_CLASS}>{tByLang('保費全部繳清', 'Policy fully paid', 'この保険は払込完了')}</span></div>
                                                    <div className="text-[10px] text-slate-400">保單生效日: {item.insuranceStartDate || '--'}</div>
                                                    {item.insuranceEndDate && <div className="text-[10px] text-slate-400">保單終止日: {item.insuranceEndDate}</div>}
                                                    {isLifeInsurance && <div className="text-[10px] text-slate-400">{tByLang(`保單年度 ${currentPolicyYear || '--'} · 已派發 ${distributionPaidYears} 年`, `Policy Year ${currentPolicyYear || '--'} · Distributed ${distributionPaidYears} yrs`, `保険年度 ${currentPolicyYear || '--'} ・配当 ${distributionPaidYears} 年`)}</div>}
                                                </>
                                            ) : item.insuranceEndDate ? (
                                                <>
                                                    <div className="font-medium text-slate-700">{effectivePremiumPaidCount.toLocaleString()}{premiumTermCap > 0 ? ` / ${premiumTermCap}` : ` / ${(totalBillingPeriods ?? '--').toString()}`}期</div>
                                                    <div className="text-[10px] text-slate-400">保單生效日: {item.insuranceStartDate || '--'}</div>
                                                    <div className="text-[10px] text-slate-400">保單終止日: {item.insuranceEndDate}</div>
                                                    {isLifeInsurance && <div className="text-[10px] text-slate-400">{tByLang(`保單年度 ${currentPolicyYear || '--'} · 已派發 ${distributionPaidYears} 年`, `Policy Year ${currentPolicyYear || '--'} · Distributed ${distributionPaidYears} yrs`, `保険年度 ${currentPolicyYear || '--'} ・配当 ${distributionPaidYears} 年`)}</div>}
                                                </>
                                            ) : (
                                                <>
                                                    <div className="font-medium text-slate-700">{effectivePremiumPaidCount.toLocaleString()} 期</div>
                                                    {isLifeInsurance && <div className="text-[10px] text-slate-400">{tByLang(`保單年度 ${currentPolicyYear || '--'} · 已派發 ${distributionPaidYears} 年`, `Policy Year ${currentPolicyYear || '--'} · Distributed ${distributionPaidYears} yrs`, `保険年度 ${currentPolicyYear || '--'} ・配当 ${distributionPaidYears} 年`)}</div>}
                                                </>
                                            )}
                                        </td>
                                    )}
                                    {isInsuranceCategory && (
                                        <td className="px-6 py-4 text-right">
                                            {isHealthInsurance || isLifeInsurance ? (
                                                hasPremiumPlan ? (
                                                    <>
                                                        <div className="font-bold text-emerald-700">{formatAmount(mktValDisplay)} <span className="text-[9px] text-emerald-500">{displayCurrency}</span></div>
                                                        <div className="text-[10px] text-emerald-600">{formatAmount(mktValOrig)} {item.currency}</div>
                                                        {isLifeInsurance && annualDistributionAmount > 0 && (
                                                            <div className="text-[10px] text-indigo-600">
                                                                {tByLang(`派發 ${formatAmount(annualDistributionAmount)} /年 ·`, `Distribution ${formatAmount(annualDistributionAmount)} /yr ·`, `配当 ${formatAmount(annualDistributionAmount)} /年 ・`)}
                                                                {distributionMode === 'accumulate' ? tByLang(' 積存', ' Accum.', ' 積立') : tByLang(' 入帳', ' Cash', ' 入金')}
                                                                {distributionMode === 'accumulate' ? ` ${formatAmount(accumulationBalance)}` : ''}
                                                            </div>
                                                        )}
                                                        {isLifeInsurance && totalDistributedAmount > 0 && <div className="text-[10px] text-emerald-600">{tByLang(`累計派發 ${formatAmount(totalDistributedAmount)} ${item.currency}`, `Total Distributed ${formatAmount(totalDistributedAmount)} ${item.currency}`, `累計配当 ${formatAmount(totalDistributedAmount)} ${item.currency}`)}</div>}
                                                        {isLifeInsurance && partialWithdrawalStats.count > 0 && (
                                                            <div className="text-[10px] text-rose-600">{tByLang(`部分提領 ${formatAmount(partialWithdrawalStats.totalAmount)} ${item.currency}（${partialWithdrawalStats.count} 次）`, `Partial Withdrawals ${formatAmount(partialWithdrawalStats.totalAmount)} ${item.currency} (${partialWithdrawalStats.count})`, `一部引き出し ${formatAmount(partialWithdrawalStats.totalAmount)} ${item.currency}（${partialWithdrawalStats.count}回）`)}</div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="font-bold text-slate-400">--</div>
                                                )
                                            ) : (
                                                <>
                                                    <div className="font-bold text-slate-800">{formatAmount(mktValDisplay)} <span className="text-[9px] text-slate-400">{displayCurrency}</span></div>
                                                    <div className="text-[10px] text-slate-400">{formatAmount(mktValOrig)} {item.currency}</div>
                                                </>
                                            )}
                                        </td>
                                    )}
                                    {isInvestCategory && (
                                        <td className="px-6 py-4 text-right">
                                            <>
                                                <div className={`font-bold ${profitOrig >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {profitOrig >= 0 ? '+' : ''}{formatAmount(profitOrig)} {item.currency}
                                                </div>
                                                <div className="text-[10px] text-slate-400">
                                                    約 {formatAmount(profitDisplay)} {displayCurrency}
                                                </div>
                                            </>
                                        </td>
                                    )}
                                    {isInvestCategory && (
                                        <td className="px-6 py-4 text-right">
                                            <div className={`inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-1.5 rounded-full ring-1 ${perfClass}`}>
                                                <span className="text-[11px] leading-none">{perfIcon}</span>
                                                <span>{perf >= 0 ? '+' : ''}{perf.toFixed(2)}%</span>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
        );
    };

    const AssetDetailListView = ({
        groupedAssets,
        categoryMixHexByKey,
        translate,
        CATEGORIES,
        toHKD,
        fromHKD,
        displayCurrency,
        expandedAccounts,
        toggleAccountExpand,
        formatAmount,
        openEdit,
        tByLang,
        cashflowAutoRulesByLiquidAssetId,
        insuranceAutoPaidCountByAssetId,
        insurancePartialWithdrawalStatsByAssetId,
        CASHFLOW_FREQUENCIES
    }) => (
        <div className="space-y-10">
            {groupedAssets.map(({ categoryKey: catKey, accounts }) => (
                <div key={catKey} className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: categoryMixHexByKey[catKey] }}></div>
                        <h2 className="text-lg font-black text-slate-800">{translate(CATEGORIES[catKey].label)}</h2>
                    </div>

                    {accounts.map(({ accountName, items }) => {
                        const accountTotalHKD = items.reduce((sum, item) => sum + toHKD(item.quantity * item.currentPrice, item.currency), 0);
                        const accountTotalDisplay = fromHKD(accountTotalHKD, displayCurrency);
                        const isLiabilityCategory = Boolean(CATEGORIES[catKey].isNegative);
                        const isInvestCategory = catKey === 'INVEST';
                        const isLiquidCategory = catKey === 'LIQUID';
                        const isInsuranceCategory = catKey === 'INSURANCE';
                        const isReceivableCategory = catKey === 'RECEIVABLE';
                        const isFixedCategory = catKey === 'FIXED';
                        const accountKey = `${catKey}::${accountName}`;
                        const isExpanded = expandedAccounts[accountKey] ?? true;

                        const isMortgageLiability = item => isLiabilityCategory && item.subtype === '房貸';
                        const isLoanLiability = item => isLiabilityCategory && item.subtype === '貸款';
                        const isCreditCardLiability = item => isLiabilityCategory && item.subtype === '信用卡';
                        const isPayableLiability = item => isLiabilityCategory && item.subtype === '應付款';
                        const isOtherLiability = item => isLiabilityCategory && item.subtype === '其他負債';

                        const insuranceSubtypeOrder = CATEGORIES[catKey]?.subtypes || [];
                        const detailGroups = isInsuranceCategory
                            ? [
                                ...insuranceSubtypeOrder,
                                ...Array.from(new Set(items.map(item => item.subtype).filter(subtype => !insuranceSubtypeOrder.includes(subtype))))
                            ]
                                .map(subtype => ({
                                    groupKey: subtype,
                                    groupLabel: subtype,
                                    groupItems: items.filter(item => item.subtype === subtype)
                                }))
                                .filter(group => group.groupItems.length > 0)
                            : [{ groupKey: 'ALL', groupLabel: '', groupItems: items }];

                        return (
                            <div key={accountName} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => toggleAccountExpand(catKey, accountName)}
                                    className="w-full bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex items-center justify-between gap-3 text-left"
                                >
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">{accountName}</h3>
                                    <div className="text-right flex items-center gap-3">
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{translate('帳戶匯總')}</div>
                                            <div className={`text-sm font-black ${isLiabilityCategory ? 'text-rose-500' : 'text-emerald-600'}`}>
                                                {isLiabilityCategory ? '-' : ''}{formatAmount(Math.abs(accountTotalDisplay))} {displayCurrency}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                                {isExpanded && (
                                    <>
                                        {detailGroups.map(({ groupKey, groupLabel, groupItems }) => (
                                            <div key={groupKey} className={isInsuranceCategory ? 'border-t border-slate-100 first:border-t-0' : ''}>
                                                {isInsuranceCategory && (
                                                    <div className="px-6 pt-4 pb-1 flex items-center justify-between">
                                                        <div className="text-xs font-black text-slate-600 tracking-wide">{translate(groupLabel)}</div>
                                                        <div className="text-[10px] font-black text-slate-400">{groupItems.length} 筆</div>
                                                    </div>
                                                )}
                                                <AssetDetailMobileCards
                                                    items={groupItems}
                                                    isLiabilityCategory={isLiabilityCategory}
                                                    isInsuranceCategory={isInsuranceCategory}
                                                    isMortgageLiability={isMortgageLiability}
                                                    isLoanLiability={isLoanLiability}
                                                    isCreditCardLiability={isCreditCardLiability}
                                                    isPayableLiability={isPayableLiability}
                                                    isOtherLiability={isOtherLiability}
                                                    isReceivableCategory={isReceivableCategory}
                                                    isFixedCategory={isFixedCategory}
                                                    isLiquidCategory={isLiquidCategory}
                                                    isInvestCategory={isInvestCategory}
                                                    CATEGORIES={CATEGORIES}
                                                    translate={translate}
                                                    tByLang={tByLang}
                                                    formatAmount={formatAmount}
                                                    displayCurrency={displayCurrency}
                                                    toHKD={toHKD}
                                                    fromHKD={fromHKD}
                                                    openEdit={openEdit}
                                                    cashflowAutoRulesByLiquidAssetId={cashflowAutoRulesByLiquidAssetId}
                                                    insuranceAutoPaidCountByAssetId={insuranceAutoPaidCountByAssetId}
                                                    insurancePartialWithdrawalStatsByAssetId={insurancePartialWithdrawalStatsByAssetId}
                                                    CASHFLOW_FREQUENCIES={CASHFLOW_FREQUENCIES}
                                                />
                                                <AssetDetailDesktopTable
                                                    items={groupItems}
                                                    isInvestCategory={isInvestCategory}
                                                    isInsuranceCategory={isInsuranceCategory}
                                                    isLiquidCategory={isLiquidCategory}
                                                    isLiabilityCategory={isLiabilityCategory}
                                                    isReceivableCategory={isReceivableCategory}
                                                    isFixedCategory={isFixedCategory}
                                                    CATEGORIES={CATEGORIES}
                                                    translate={translate}
                                                    tByLang={tByLang}
                                                    toHKD={toHKD}
                                                    fromHKD={fromHKD}
                                                    formatAmount={formatAmount}
                                                    displayCurrency={displayCurrency}
                                                    openEdit={openEdit}
                                                    cashflowAutoRulesByLiquidAssetId={cashflowAutoRulesByLiquidAssetId}
                                                    insuranceAutoPaidCountByAssetId={insuranceAutoPaidCountByAssetId}
                                                    insurancePartialWithdrawalStatsByAssetId={insurancePartialWithdrawalStatsByAssetId}
                                                />
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );

    window.APP_ASSET_DETAIL_LIST_VIEW = {
        AssetDetailListView
    };
})();
