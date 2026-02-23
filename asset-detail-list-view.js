(() => {
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
                                保費 {formatAmount(item.premiumAmount || 0)} {item.currency} · 已繳 {Number(item.premiumPaidCount || 0)} 期
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
        cashflowAutoRulesByLiquidAssetId
    }) => (
        <div className="hidden md:block overflow-x-auto -mx-4 sm:mx-0">
            <div className="px-4 sm:px-0">
                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 md:hidden">左右滑動查看完整欄位</div>
                <table className={`w-full text-left ${isInvestCategory ? 'min-w-[780px]' : isInsuranceCategory ? 'min-w-[700px]' : 'min-w-[620px]'}`}>
                    {isLiquidCategory && (
                        <colgroup>
                            <col style={{ width: '60%' }} />
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '20%' }} />
                        </colgroup>
                    )}
                    {isInsuranceCategory && (
                        <colgroup>
                            <col style={{ width: '40%' }} />
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '20%' }} />
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
                            <th className="px-6 py-3 text-right">{isInsuranceCategory ? translate('保費設定') : isLiquidCategory ? translate('數量 / 幣別') : isLiabilityCategory ? translate('金額 / 期數') : isReceivableCategory ? translate('應收金額 / 期數') : isFixedCategory ? translate('估值 / 成本') : translate('市值 / 數量')}</th>
                            <th className="px-6 py-3 text-right">{isInsuranceCategory ? translate('已繳期數') : isLiquidCategory ? translate('餘額') : isLiabilityCategory ? translate('利率 / 到期') : isReceivableCategory ? translate('到期 / 對象') : isFixedCategory ? translate('購入日 / 備註') : translate('現價 / 成本')}</th>
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
                            const premiumPaidCount = Number(item.premiumPaidCount || 0);
                            const hasPremiumPlan = premiumAmount > 0 && premiumPaidCount >= 0;
                            const premiumTotalOrig = premiumAmount * premiumPaidCount;
                            const premiumTotalDisplay = fromHKD(toHKD(premiumTotalOrig, item.currency), displayCurrency);
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
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {isInsuranceCategory ? (
                                            hasPremiumPlan ? (
                                                <div className="font-bold text-slate-700">
                                                    {formatAmount(premiumAmount)} {item.currency}
                                                    <div className="text-[10px] text-slate-400">/{item.premiumFrequency === 'yearly' ? '每年' : '每月'}</div>
                                                </div>
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
                                            hasPremiumPlan ? (
                                                <div className="font-medium text-slate-700">{premiumPaidCount.toLocaleString()} 期</div>
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
                                    {isInsuranceCategory && (
                                        <td className="px-6 py-4 text-right">
                                            {hasPremiumPlan ? (
                                                <>
                                                    <div className="font-bold text-slate-800">{formatAmount(premiumTotalDisplay)} <span className="text-[9px] text-slate-400">{displayCurrency}</span></div>
                                                    <div className="text-[10px] text-slate-400">{formatAmount(premiumTotalOrig)} {item.currency}</div>
                                                </>
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
                                        <AssetDetailMobileCards
                                            items={items}
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
                                            CASHFLOW_FREQUENCIES={CASHFLOW_FREQUENCIES}
                                        />
                                        <AssetDetailDesktopTable
                                            items={items}
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
                                        />
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
