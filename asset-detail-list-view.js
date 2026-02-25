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
    const resolveFixedDepositMaturityDateKey = ({ startDateKey, months, days, termMode }) => {
        const startDate = parseDateStringSafe(startDateKey || '');
        if (!startDate) return '';
        const normalizedMode = termMode === 'days' ? 'days' : 'months';
        if (normalizedMode === 'days') {
            const termDays = Math.max(1, Math.floor(Number(days || 0) || 0));
            return toDateKeySafe(new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + termDays));
        }
        const termMonths = Math.max(1, Math.floor(Number(months || 0) || 0));
        const targetMonthDate = new Date(startDate.getFullYear(), startDate.getMonth() + termMonths, 1);
        const daysInTargetMonth = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth() + 1, 0).getDate();
        const targetDay = Math.min(startDate.getDate(), daysInTargetMonth);
        return toDateKeySafe(new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth(), targetDay));
    };
    const resolveMaturityDateByDays = ({ startDateKey, days }) => {
        const startDate = parseDateStringSafe(startDateKey || '');
        if (!startDate) return '';
        const termDays = Math.max(1, Math.floor(Number(days || 0) || 0));
        return toDateKeySafe(new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + termDays));
    };
    const buildFirstBillingDate = (startDate, paymentDay, frequency) => {
        if (!startDate) return null;
        if (frequency === 'single') {
            return new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        }
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
        if (frequency === 'single') {
            const today = new Date();
            const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const startOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            if (endDate && startOnly.getTime() > endDate.getTime()) return '';
            return startOnly.getTime() >= todayOnly.getTime() ? toDateKeySafe(startOnly) : '';
        }
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
        if (frequency === 'single') {
            return startDate.getTime() <= endDate.getTime() ? 1 : 0;
        }
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
    const parseNumberLoose = (value) => {
        const normalized = String(value || '').replace(/,/g, '').trim();
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    };
    const splitFundCodeCurrency = (rawValue, currencyOptions = []) => {
        const raw = String(rawValue || '').trim();
        if (!raw) return { fundCode: '', currency: '' };
        const parts = raw.split(/\s*[·｜|]\s*/).map(part => part.trim()).filter(Boolean);
        if (parts.length >= 2) {
            const currency = parts[parts.length - 1].toUpperCase();
            return {
                fundCode: parts.slice(0, -1).join(' · '),
                currency: currencyOptions.includes(currency) ? currency : currency
            };
        }
        const upperRaw = raw.toUpperCase();
        if (currencyOptions.includes(upperRaw)) return { fundCode: '', currency: upperRaw };
        return { fundCode: raw, currency: '' };
    };
    const resolvePremiumTermsPerYear = (frequency) => (frequency === 'yearly' || frequency === 'single') ? 1 : 12;
    const resolvePremiumCycleLabel = (frequency, tByLang) => {
        if (frequency === 'single') return tByLang('一次性', 'one-time', '単発');
        return frequency === 'yearly' ? tByLang('每年', 'yearly', '毎年') : tByLang('每月', 'monthly', '毎月');
    };
    const buildFundCodeCurrency = (fundCode, currency) => {
        const codeText = String(fundCode || '').trim();
        const currencyText = String(currency || '').trim().toUpperCase();
        if (codeText && currencyText) return `${codeText} · ${currencyText}`;
        return codeText || currencyText;
    };
    const parseInvestmentFundRows = (rawValue) => {
        return String(rawValue || '')
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean)
            .map(line => {
                const parts = line.split(/\||｜/).map(part => part.trim());
                const { fundCode, currency } = splitFundCodeCurrency(parts[2] || '');
                const units = parseNumberLoose(parts[5]);
                const unitPrice = parseNumberLoose(parts[6]);
                const averagePrice = parseNumberLoose(parts[7]);
                const balanceFromInput = parseNumberLoose(parts[4]);
                const balance = balanceFromInput > 0 ? balanceFromInput : (units * unitPrice);
                const pnl = units > 0 ? (units * (unitPrice - averagePrice)) : 0;
                return {
                    allocationPercent: parts[0] || '',
                    investmentOption: parts[1] || '',
                    codeCurrency: parts[2] || '',
                    fundCode,
                    currency,
                    profitLossPercent: parts[3] || '',
                    balanceRaw: parts[4] || '',
                    unitsRaw: parts[5] || '',
                    unitPriceRaw: parts[6] || '',
                    averagePriceRaw: parts[7] || '',
                    distributionAmountRaw: parts[8] || '',
                    distributionFrequency: String(parts[9] || 'monthly').toLowerCase() === 'yearly' ? 'yearly' : 'monthly',
                    distributionStartDate: parts[10] || '',
                    distributionAccountId: parts[11] || '',
                    fundRowId: parts[12] || '',
                    distributionRatePercentRaw: parts[13] || '',
                    distributionEnabled: (() => {
                        if (parts[14] === 'yes') return 'yes';
                        if (parts[14] === 'no') return 'no';
                        const hasDistributionData =
                            (Number(parts[8] || 0) > 0)
                            || (Number(parts[13] || 0) > 0)
                            || Boolean(String(parts[10] || '').trim())
                            || Boolean(String(parts[11] || '').trim())
                            || (Number(parts[17] || 0) > 0);
                        return hasDistributionData ? 'yes' : 'no';
                    })(),
                    distributionMode: ['cash', 'accumulate', 'reinvest'].includes(parts[15]) ? parts[15] : 'cash',
                    distributionAccumulationRatePercentRaw: parts[16] || '',
                    distributionAccumulationBalanceRaw: parts[17] || '',
                    balance,
                    units,
                    unitPrice,
                    averagePrice,
                    pnl
                };
            });
    };
    const PAID_OFF_BADGE_CLASS = 'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';

    const InvestmentFundManagerSection = ({
        item,
        investmentFundRows,
        tByLang,
        formatAmount,
        premiumTotalAmount = 0,
        toHKD,
        fromHKD,
        displayCurrency,
        onInsuranceFundRowFieldChange,
        onInsuranceFundAppendRowWithData,
        onInsuranceFundRemoveRow,
        onInsuranceFundClearRows,
        fundCurrencyOptions,
        liquidAssetLabelById,
        chartPalette,
        accentColor,
        layout = 'mobile'
    }) => {
        const emptyDraft = { investmentOption: '', fundCode: '', currency: 'HKD', units: '', unitPrice: '', averagePrice: '', distributionEnabled: 'no', distributionMode: 'cash', distributionAmount: '', distributionRatePercent: '', distributionAccumulationRatePercent: '', distributionFrequency: 'monthly', distributionStartDate: '', distributionAccountId: '', fundRowId: '' };
        const [modalState, setModalState] = React.useState({ mode: '', rowIndex: -1, draft: emptyDraft });
        const distributionAccountOptions = Object.entries(liquidAssetLabelById || {}).map(([id, label]) => ({ id, label }));

        const palette = Array.isArray(chartPalette) && chartPalette.length > 0
            ? chartPalette
            : ['#6366F1', '#14B8A6', '#F59E0B', '#EC4899', '#8B5CF6', '#22C55E', '#F97316', '#0EA5E9'];
        const safeToHKD = typeof toHKD === 'function' ? toHKD : (value) => Number(value || 0);
        const safeFromHKD = typeof fromHKD === 'function' ? fromHKD : (value) => Number(value || 0);
        const globalCurrency = displayCurrency || item.currency || 'HKD';
        const resolvedAccentColor = accentColor || palette[0] || '#6366F1';
        const chartSegmentsBase = investmentFundRows
            .map((row, index) => {
                const safeBalance = row.balance > 0 ? row.balance : 0;
                const rowCurrency = row.currency || item.currency || 'HKD';
                const convertedBalance = safeFromHKD(safeToHKD(safeBalance, rowCurrency), globalCurrency);
                const safePnlPercent = (() => {
                    const rawPnLPercent = parseNumberLoose(row.profitLossPercent);
                    if (rawPnLPercent !== 0) return rawPnLPercent;
                    if (row.averagePrice > 0 && row.unitPrice > 0) {
                        return ((row.unitPrice - row.averagePrice) / row.averagePrice) * 100;
                    }
                    return 0;
                })();
                return {
                index,
                label: row.investmentOption || tByLang('未命名基金', 'Unnamed Fund', '名称未設定ファンド'),
                    value: convertedBalance,
                    pnlPercent: safePnlPercent,
                    color: palette[index % palette.length],
                    fundCode: row.fundCode || '--',
                    currency: rowCurrency
                };
            });
        const fundBalanceByCurrency = investmentFundRows.reduce((acc, row) => {
            const currency = row.currency || item.currency || 'HKD';
            const balance = Number(row.balance || 0);
            if (!acc[currency]) acc[currency] = 0;
            acc[currency] += balance;
            return acc;
        }, {});
        const fundBalanceByCurrencyText = Object.entries(fundBalanceByCurrency)
            .map(([currency, amount]) => `${formatAmount(amount)} ${currency}`)
            .join(' + ');
        const chartTotal = chartSegmentsBase.reduce((sum, segment) => sum + segment.value, 0);
        const chartSegments = chartSegmentsBase.map(segment => ({
            ...segment,
            allocationPercent: chartTotal > 0 ? (segment.value / chartTotal) * 100 : 0
        }));
        const chartGradient = chartTotal > 0
            ? (() => {
                let offset = 0;
                const ranges = chartSegments.map(segment => {
                    const ratio = segment.value / chartTotal;
                    const start = offset;
                    offset += ratio * 360;
                    return `${segment.color} ${start.toFixed(2)}deg ${offset.toFixed(2)}deg`;
                });
                return `conic-gradient(${ranges.join(', ')})`;
            })()
            : 'conic-gradient(#e2e8f0 0deg 360deg)';

        const totalMarketValue = chartTotal;
        const totalPremiumValue = safeFromHKD(safeToHKD(Number(premiumTotalAmount || 0), item.currency || globalCurrency), globalCurrency);
        const totalPnlAmount = totalMarketValue - totalPremiumValue;
        const totalPnlPercent = totalPremiumValue > 0 ? ((totalPnlAmount / totalPremiumValue) * 100) : 0;
        const totalPnlClass = totalPnlAmount >= 0 ? 'text-emerald-700' : 'text-rose-700';

        const commitRow = (rowIndex, draft) => {
            const isDistributionEnabled = draft.distributionEnabled === 'yes';
            const distributionMode = ['cash', 'accumulate', 'reinvest'].includes(draft.distributionMode) ? draft.distributionMode : 'cash';
            onInsuranceFundRowFieldChange(item.id, rowIndex, 'investmentOption', draft.investmentOption || '');
            onInsuranceFundRowFieldChange(item.id, rowIndex, 'codeCurrency', buildFundCodeCurrency(draft.fundCode, draft.currency));
            onInsuranceFundRowFieldChange(item.id, rowIndex, 'units', draft.units || '');
            onInsuranceFundRowFieldChange(item.id, rowIndex, 'unitPrice', draft.unitPrice || '');
            onInsuranceFundRowFieldChange(item.id, rowIndex, 'averagePrice', draft.averagePrice || '');
            onInsuranceFundRowFieldChange(item.id, rowIndex, 'distributionEnabled', isDistributionEnabled ? 'yes' : 'no');
            onInsuranceFundRowFieldChange(item.id, rowIndex, 'distributionMode', distributionMode);
            onInsuranceFundRowFieldChange(item.id, rowIndex, 'distributionAmount', isDistributionEnabled ? (draft.distributionAmount || '') : '');
            onInsuranceFundRowFieldChange(item.id, rowIndex, 'distributionRatePercent', isDistributionEnabled ? (draft.distributionRatePercent || '') : '');
            onInsuranceFundRowFieldChange(item.id, rowIndex, 'distributionAccumulationRatePercent', (isDistributionEnabled && distributionMode === 'accumulate') ? (draft.distributionAccumulationRatePercent || '') : '');
            onInsuranceFundRowFieldChange(item.id, rowIndex, 'distributionFrequency', draft.distributionFrequency === 'yearly' ? 'yearly' : 'monthly');
            onInsuranceFundRowFieldChange(item.id, rowIndex, 'distributionStartDate', isDistributionEnabled ? (draft.distributionStartDate || '') : '');
            onInsuranceFundRowFieldChange(item.id, rowIndex, 'distributionAccountId', (isDistributionEnabled && distributionMode === 'cash') ? (draft.distributionAccountId || '') : '');
            onInsuranceFundRowFieldChange(item.id, rowIndex, 'fundRowId', draft.fundRowId || '');
        };

        const openAddModal = () => {
            setModalState({
                mode: 'add',
                rowIndex: -1,
                draft: {
                    ...emptyDraft,
                    currency: (fundCurrencyOptions && fundCurrencyOptions[0]) ? fundCurrencyOptions[0] : 'HKD',
                    distributionAccountId: (distributionAccountOptions[0]?.id || '')
                }
            });
        };

        const openEditModal = (row, rowIndex) => {
            setModalState({
                mode: 'edit',
                rowIndex,
                draft: {
                    investmentOption: row.investmentOption || '',
                    fundCode: row.fundCode || '',
                    currency: row.currency || item.currency || 'HKD',
                    units: row.unitsRaw || '',
                    unitPrice: row.unitPriceRaw || '',
                    averagePrice: row.averagePriceRaw || '',
                    distributionEnabled: row.distributionEnabled === 'yes' ? 'yes' : 'no',
                    distributionMode: ['cash', 'accumulate', 'reinvest'].includes(row.distributionMode) ? row.distributionMode : 'cash',
                    distributionAmount: row.distributionAmountRaw || '',
                    distributionRatePercent: row.distributionRatePercentRaw || '',
                    distributionAccumulationRatePercent: row.distributionAccumulationRatePercentRaw || '',
                    distributionFrequency: row.distributionFrequency === 'yearly' ? 'yearly' : 'monthly',
                    distributionStartDate: row.distributionStartDate || '',
                    distributionAccountId: row.distributionAccountId || '',
                    fundRowId: row.fundRowId || ''
                }
            });
        };

        const closeModal = () => {
            setModalState({ mode: '', rowIndex: -1, draft: emptyDraft });
        };

        const saveModal = () => {
            const payload = {
                investmentOption: modalState.draft.investmentOption || '',
                codeCurrency: buildFundCodeCurrency(modalState.draft.fundCode, modalState.draft.currency),
                units: modalState.draft.units || '',
                unitPrice: modalState.draft.unitPrice || '',
                averagePrice: modalState.draft.averagePrice || '',
                distributionEnabled: modalState.draft.distributionEnabled === 'yes' ? 'yes' : 'no',
                distributionMode: ['cash', 'accumulate', 'reinvest'].includes(modalState.draft.distributionMode) ? modalState.draft.distributionMode : 'cash',
                distributionAmount: modalState.draft.distributionEnabled === 'yes' ? (modalState.draft.distributionAmount || '') : '',
                distributionRatePercent: modalState.draft.distributionEnabled === 'yes' ? (modalState.draft.distributionRatePercent || '') : '',
                distributionAccumulationRatePercent: (modalState.draft.distributionEnabled === 'yes' && (modalState.draft.distributionMode || 'cash') === 'accumulate') ? (modalState.draft.distributionAccumulationRatePercent || '') : '',
                distributionFrequency: modalState.draft.distributionFrequency === 'yearly' ? 'yearly' : 'monthly',
                distributionStartDate: modalState.draft.distributionEnabled === 'yes' ? (modalState.draft.distributionStartDate || '') : '',
                distributionAccountId: (modalState.draft.distributionEnabled === 'yes' && (modalState.draft.distributionMode || 'cash') === 'cash') ? (modalState.draft.distributionAccountId || '') : '',
                fundRowId: modalState.draft.fundRowId || ''
            };

            if (modalState.mode === 'add') {
                onInsuranceFundAppendRowWithData(item.id, payload);
            }
            if (modalState.mode === 'edit' && modalState.rowIndex >= 0) {
                commitRow(modalState.rowIndex, modalState.draft);
            }
            closeModal();
        };

        return (
            <div className="mt-2 rounded-xl border theme-surface p-3 space-y-3" style={{ borderColor: `${resolvedAccentColor}55` }}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-black theme-text-main">{tByLang('投資概覽', 'Investment Overview', '投資概要')}</div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-black">
                        <button
                            type="button"
                            onClick={openAddModal}
                            className="rounded-md border bg-white px-2 py-1"
                            style={{ borderColor: `${resolvedAccentColor}66`, color: resolvedAccentColor }}
                        >
                            {tByLang('新增基金', 'Add Fund', 'ファンド追加')}
                        </button>
                        <button type="button" onClick={() => onInsuranceFundClearRows(item.id)} className="rounded-md border border-slate-300 bg-white px-2 py-1 theme-text-sub">{tByLang('清空基金', 'Clear Funds', '全クリア')}</button>
                    </div>
                </div>

                <div className={layout === 'desktop' ? 'grid grid-cols-1 lg:grid-cols-3 gap-3' : 'space-y-3'}>
                    <div className={layout === 'desktop' ? 'rounded-lg border theme-surface p-3 flex items-center gap-3' : 'rounded-lg border theme-surface p-3 space-y-3'} style={{ borderColor: `${resolvedAccentColor}55` }}>
                        <div className={layout === 'desktop' ? 'w-24 h-24 rounded-full border-4 border-white shadow-sm' : 'mx-auto w-20 h-20 rounded-full border-4 border-white shadow-sm'} style={{ background: chartGradient }}></div>
                        {layout === 'desktop' ? (
                            <div className="text-[11px] font-bold theme-text-sub space-y-1">
                                <div>{tByLang('基金數量', 'Fund Count', 'ファンド数')}：{investmentFundRows.length}</div>
                                <div>{tByLang('保費總額', 'Total Premium', '総保険料')}：{formatAmount(totalPremiumValue)} {globalCurrency}</div>
                                <div>{tByLang('保單價值', 'Policy Value', '保単価値')}：{formatAmount(totalMarketValue)} {globalCurrency}</div>
                                {fundBalanceByCurrencyText && (
                                    <div className="text-[10px]">{fundBalanceByCurrencyText}</div>
                                )}
                                <div className={totalPnlClass}>
                                    {tByLang('帳戶盈虧', 'Account P/L', '口座損益')}：{totalPnlAmount >= 0 ? '+' : ''}{formatAmount(totalPnlAmount)} {globalCurrency}
                                    {' · '}
                                    {totalPnlPercent >= 0 ? '+' : ''}{totalPnlPercent.toFixed(2)}%
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 text-[10px] font-black">
                                <div className="rounded-md border border-slate-200 bg-white/80 px-2 py-1.5">
                                    <div className="theme-text-sub">{tByLang('基金數量', 'Fund Count', 'ファンド数')}</div>
                                    <div className="theme-text-main text-[11px]">{investmentFundRows.length}</div>
                                </div>
                                <div className="rounded-md border border-slate-200 bg-white/80 px-2 py-1.5">
                                    <div className="theme-text-sub">{tByLang('保費總額', 'Total Premium', '総保険料')}</div>
                                    <div className="theme-text-main text-[11px]">{formatAmount(totalPremiumValue)} {globalCurrency}</div>
                                </div>
                                <div className="rounded-md border border-slate-200 bg-white/80 px-2 py-1.5">
                                    <div className="theme-text-sub">{tByLang('保單價值', 'Policy Value', '保単価値')}</div>
                                    <div className={`text-[11px] ${totalPnlClass}`}>{formatAmount(totalMarketValue)} {globalCurrency}</div>
                                </div>
                                <div className="rounded-md border border-slate-200 bg-white/80 px-2 py-1.5">
                                    <div className="theme-text-sub">{tByLang('帳戶盈虧', 'Account P/L', '口座損益')}</div>
                                    <div className={`text-[11px] ${totalPnlClass}`}>{totalPnlAmount >= 0 ? '+' : ''}{formatAmount(totalPnlAmount)} {globalCurrency}</div>
                                    <div className={`text-[10px] ${totalPnlClass}`}>{totalPnlPercent >= 0 ? '+' : ''}{totalPnlPercent.toFixed(2)}%</div>
                                </div>
                                {fundBalanceByCurrencyText && (
                                    <div className="col-span-2 theme-text-sub text-[10px]">{fundBalanceByCurrencyText}</div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className={layout === 'desktop' ? 'lg:col-span-2 rounded-lg border theme-surface p-3' : 'rounded-lg border theme-surface p-3'} style={{ borderColor: `${resolvedAccentColor}44` }}>
                        <div className="text-[10px] font-black theme-text-sub mb-2">{tByLang('基金組成', 'Fund Composition', 'ファンド構成')}</div>
                        <div className="space-y-1">
                            {chartSegments.length > 0 ? chartSegments.map(segment => {
                                return (
                                    <div key={`${item.id}-segment-${segment.index}`} className="flex items-center justify-between text-[10px] font-bold theme-text-sub">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: segment.color }}></span>
                                            <span className="truncate">{segment.label}</span>
                                        </div>
                                        <span className={segment.pnlPercent >= 0 ? 'text-emerald-700' : 'text-rose-700'}>{segment.allocationPercent.toFixed(1)}% · {segment.pnlPercent >= 0 ? '+' : ''}{segment.pnlPercent.toFixed(2)}%</span>
                                    </div>
                                );
                            }) : <div className="text-[10px] font-bold theme-text-sub">{tByLang('尚未有基金資料', 'No fund data yet', 'ファンドデータなし')}</div>}
                        </div>
                    </div>
                </div>

                {layout === 'desktop' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full table-fixed text-[11px]">
                            <colgroup>
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '18%' }} />
                                <col style={{ width: '14%' }} />
                                <col style={{ width: '8%' }} />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '10%' }} />
                            </colgroup>
                            <thead>
                                <tr className="theme-text-sub font-black border-b border-slate-200">
                                    <th className="px-2 py-2 text-left">{tByLang('分配 %', 'Allocation %', '配分 %')}</th>
                                    <th className="px-2 py-2 text-left">{tByLang('基金／投資選項', 'Fund / Option', 'ファンド／投資オプション')}</th>
                                    <th className="px-2 py-2 text-left">{tByLang('基金編號', 'Fund Code', 'ファンドコード')}</th>
                                    <th className="px-2 py-2 text-left">{tByLang('貨幣', 'Currency', '通貨')}</th>
                                    <th className="px-2 py-2 text-left">{tByLang('單位數目', 'Units', '口数')}</th>
                                    <th className="px-2 py-2 text-left">{tByLang('單位價格', 'Unit Price', '基準価額')}</th>
                                    <th className="px-2 py-2 text-left">{tByLang('平均價格', 'Average Price', '平均価格')}</th>
                                    <th className="px-2 py-2 text-left">{tByLang('利潤或虧蝕 %', 'P/L %', '損益 %')}</th>
                                    <th className="px-2 py-2 text-left">{tByLang('結餘', 'Balance', '残高')}</th>
                                    <th className="px-2 py-2 text-right">{tByLang('操作', 'Action', '操作')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {investmentFundRows.map((row, rowIndex) => {
                                    const computedAllocation = chartSegments[rowIndex]?.allocationPercent || 0;
                                    const computedPnlPercent = (() => {
                                        const rawPnLPercent = parseNumberLoose(row.profitLossPercent);
                                        if (rawPnLPercent !== 0) return rawPnLPercent;
                                        if (row.averagePrice > 0 && row.unitPrice > 0) {
                                            return ((row.unitPrice - row.averagePrice) / row.averagePrice) * 100;
                                        }
                                        return 0;
                                    })();
                                    return (
                                        <tr key={`${item.id}-manage-fund-${rowIndex}`} className="border-t border-slate-200">
                                            <td className="px-2 py-2"><span className="font-bold" style={{ color: resolvedAccentColor }}>{computedAllocation.toFixed(2)}%</span></td>
                                            <td className="px-2 py-2"><span className="font-bold theme-text-main">{row.investmentOption || '--'}</span></td>
                                            <td className="px-2 py-2"><span className="font-bold theme-text-main">{row.fundCode || '--'}</span></td>
                                            <td className="px-2 py-2"><span className="font-bold theme-text-main">{row.currency || '--'}</span></td>
                                            <td className="px-2 py-2"><span className="font-bold theme-text-main">{formatAmount(row.units)}</span></td>
                                            <td className="px-2 py-2"><span className="font-bold theme-text-main">{formatAmount(row.unitPrice)}</span></td>
                                            <td className="px-2 py-2"><span className="font-bold theme-text-main">{formatAmount(row.averagePrice)}</span></td>
                                            <td className="px-2 py-2"><span className={computedPnlPercent >= 0 ? 'font-bold text-emerald-700' : 'font-bold text-rose-700'}>{computedPnlPercent >= 0 ? '+' : ''}{computedPnlPercent.toFixed(2)}%</span></td>
                                            <td className="px-2 py-2">
                                                <div className="font-bold theme-text-main">{formatAmount(row.balance)} {row.currency || item.currency || 'HKD'}</div>
                                                {row.distributionEnabled === 'yes' && Number(row.distributionAmountRaw || 0) > 0 && (
                                                    <div className="text-[10px] text-indigo-600">
                                                        {tByLang('派息', 'Distribution', '分配')} {formatAmount(row.distributionAmountRaw)} {item.currency} · {row.distributionFrequency === 'yearly' ? tByLang('每年', 'Yearly', '毎年') : tByLang('每月', 'Monthly', '毎月')}
                                                        {' · '}
                                                        {(row.distributionMode || 'cash') === 'cash'
                                                            ? tByLang('入帳', 'Cash Payout', '入金')
                                                            : ((row.distributionMode || 'cash') === 'reinvest'
                                                                ? tByLang('再投資', 'Reinvest', '再投資')
                                                                : tByLang('積存生息', 'Accumulate', '積立'))}
                                                    </div>
                                                )}
                                                {row.distributionEnabled === 'yes' && Number(row.distributionRatePercentRaw || 0) > 0 && (
                                                    <div className="text-[10px] text-indigo-600">
                                                        {tByLang('比率', 'Rate', '比率')} {formatAmount(row.distributionRatePercentRaw)}%
                                                    </div>
                                                )}
                                                {row.distributionEnabled === 'yes' && (row.distributionMode || 'cash') === 'accumulate' && Number(row.distributionAccumulationBalanceRaw || 0) > 0 && (
                                                    <div className="text-[10px] text-indigo-600">
                                                        {tByLang('積存餘額', 'Accumulated Balance', '積立残高')} {formatAmount(row.distributionAccumulationBalanceRaw)} {item.currency || row.currency || 'HKD'}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-2 py-2 text-right">
                                                <div className="inline-flex items-center gap-1 text-[10px] font-black">
                                                    <button type="button" onClick={() => openEditModal(row, rowIndex)} className="rounded border bg-white px-1.5 py-0.5" style={{ borderColor: `${resolvedAccentColor}66`, color: resolvedAccentColor }}>{tByLang('編輯', 'Edit', '編集')}</button>
                                                    <button type="button" onClick={() => onInsuranceFundRemoveRow(item.id, rowIndex)} className="rounded border border-slate-300 bg-white px-1.5 py-0.5 theme-text-sub">✕</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {investmentFundRows.length > 0 ? investmentFundRows.map((row, rowIndex) => {
                            const computedAllocation = chartSegments[rowIndex]?.allocationPercent || 0;
                            const computedPnlPercent = (() => {
                                const rawPnLPercent = parseNumberLoose(row.profitLossPercent);
                                if (rawPnLPercent !== 0) return rawPnLPercent;
                                if (row.averagePrice > 0 && row.unitPrice > 0) {
                                    return ((row.unitPrice - row.averagePrice) / row.averagePrice) * 100;
                                }
                                return 0;
                            })();
                            const computedPnlClass = computedPnlPercent >= 0 ? 'text-emerald-700' : 'text-rose-700';
                            return (
                                <div key={`${item.id}-manage-fund-mobile-${rowIndex}`} className="rounded-lg border border-slate-200 bg-white/80 p-2.5 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="text-[11px] font-black theme-text-main truncate">{row.investmentOption || '--'}</div>
                                            <div className="text-[10px] font-bold theme-text-sub">{row.fundCode || '--'} · {row.currency || '--'}</div>
                                        </div>
                                        <div className="inline-flex items-center gap-1 text-[10px] font-black">
                                            <button type="button" onClick={() => openEditModal(row, rowIndex)} className="rounded border bg-white px-1.5 py-0.5" style={{ borderColor: `${resolvedAccentColor}66`, color: resolvedAccentColor }}>{tByLang('編輯', 'Edit', '編集')}</button>
                                            <button type="button" onClick={() => onInsuranceFundRemoveRow(item.id, rowIndex)} className="rounded border border-slate-300 bg-white px-1.5 py-0.5 theme-text-sub">✕</button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                                        <div>
                                            <div className="theme-text-sub">{tByLang('分配 %', 'Allocation %', '配分 %')}</div>
                                            <div style={{ color: resolvedAccentColor }}>{computedAllocation.toFixed(2)}%</div>
                                        </div>
                                        <div>
                                            <div className="theme-text-sub">{tByLang('利潤或虧蝕 %', 'P/L %', '損益 %')}</div>
                                            <div className={computedPnlClass}>{computedPnlPercent >= 0 ? '+' : ''}{computedPnlPercent.toFixed(2)}%</div>
                                        </div>
                                        <div>
                                            <div className="theme-text-sub">{tByLang('單位數目', 'Units', '口数')}</div>
                                            <div className="theme-text-main">{formatAmount(row.units)}</div>
                                        </div>
                                        <div>
                                            <div className="theme-text-sub">{tByLang('結餘', 'Balance', '残高')}</div>
                                            <div className={computedPnlClass}>{formatAmount(row.balance)} {row.currency || item.currency || 'HKD'}</div>
                                            {row.distributionEnabled === 'yes' && Number(row.distributionAmountRaw || 0) > 0 && (
                                                <div className="text-[10px] text-indigo-600">
                                                    {tByLang('派息', 'Distribution', '分配')} {formatAmount(row.distributionAmountRaw)} {item.currency}
                                                    {' · '}
                                                    {(row.distributionMode || 'cash') === 'cash'
                                                        ? tByLang('入帳', 'Cash Payout', '入金')
                                                        : ((row.distributionMode || 'cash') === 'reinvest'
                                                            ? tByLang('再投資', 'Reinvest', '再投資')
                                                            : tByLang('積存生息', 'Accumulate', '積立'))}
                                                </div>
                                            )}
                                            {row.distributionEnabled === 'yes' && Number(row.distributionRatePercentRaw || 0) > 0 && (
                                                <div className="text-[10px] text-indigo-600">
                                                    {tByLang('比率', 'Rate', '比率')} {formatAmount(row.distributionRatePercentRaw)}%
                                                </div>
                                            )}
                                            {row.distributionEnabled === 'yes' && (row.distributionMode || 'cash') === 'accumulate' && Number(row.distributionAccumulationBalanceRaw || 0) > 0 && (
                                                <div className="text-[10px] text-indigo-600">
                                                    {tByLang('積存餘額', 'Accumulated Balance', '積立残高')} {formatAmount(row.distributionAccumulationBalanceRaw)} {item.currency || row.currency || 'HKD'}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="theme-text-sub">{tByLang('單位價格', 'Unit Price', '基準価額')}</div>
                                            <div className="theme-text-main">{formatAmount(row.unitPrice)}</div>
                                        </div>
                                        <div>
                                            <div className="theme-text-sub">{tByLang('平均價格', 'Average Price', '平均価格')}</div>
                                            <div className="theme-text-main">{formatAmount(row.averagePrice)}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : <div className="text-[10px] font-bold theme-text-sub">{tByLang('尚未有基金資料', 'No fund data yet', 'ファンドデータなし')}</div>}
                    </div>
                )}

                {modalState.mode && (
                    <div className="fixed inset-0 z-[120] bg-black/40 flex items-center justify-center p-4">
                        <div className="w-full max-w-2xl rounded-2xl theme-surface border shadow-xl p-4 space-y-3" style={{ borderColor: `${resolvedAccentColor}66` }}>
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-black theme-text-main">
                                    {modalState.mode === 'add'
                                        ? tByLang('新增基金', 'Add Fund', 'ファンド追加')
                                        : tByLang('編輯基金', 'Edit Fund', 'ファンド編集')}
                                </div>
                                <button type="button" onClick={closeModal} className="text-xs font-black theme-text-sub">✕</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black theme-text-sub">{tByLang('基金／投資選項', 'Fund / Option', 'ファンド／投資オプション')}</label>
                                    <input type="text" value={modalState.draft.investmentOption} onChange={(event) => setModalState(prev => ({ ...prev, draft: { ...prev.draft, investmentOption: event.target.value } }))} className="w-full rounded-lg theme-input px-3 py-2 text-sm font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black theme-text-sub">{tByLang('基金編號', 'Fund Code', 'ファンドコード')}</label>
                                    <input type="text" value={modalState.draft.fundCode} onChange={(event) => setModalState(prev => ({ ...prev, draft: { ...prev.draft, fundCode: event.target.value } }))} className="w-full rounded-lg theme-input px-3 py-2 text-sm font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black theme-text-sub">{tByLang('貨幣', 'Currency', '通貨')}</label>
                                    <select value={modalState.draft.currency} onChange={(event) => setModalState(prev => ({ ...prev, draft: { ...prev.draft, currency: event.target.value } }))} className="w-full rounded-lg theme-input px-3 py-2 text-sm font-bold">
                                        {(fundCurrencyOptions || ['HKD']).map(code => <option key={`${item.id}-${code}`} value={code}>{code}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black theme-text-sub">{tByLang('單位數目', 'Units', '口数')}</label>
                                    <input type="number" step="any" min="0" value={modalState.draft.units} onChange={(event) => setModalState(prev => ({ ...prev, draft: { ...prev.draft, units: event.target.value } }))} className="w-full rounded-lg theme-input px-3 py-2 text-sm font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black theme-text-sub">{tByLang('單位價格', 'Unit Price', '基準価額')}</label>
                                    <input type="number" step="any" min="0" value={modalState.draft.unitPrice} onChange={(event) => setModalState(prev => ({ ...prev, draft: { ...prev.draft, unitPrice: event.target.value } }))} className="w-full rounded-lg theme-input px-3 py-2 text-sm font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black theme-text-sub">{tByLang('平均價格', 'Average Price', '平均価格')}</label>
                                    <input type="number" step="any" min="0" value={modalState.draft.averagePrice} onChange={(event) => setModalState(prev => ({ ...prev, draft: { ...prev.draft, averagePrice: event.target.value } }))} className="w-full rounded-lg theme-input px-3 py-2 text-sm font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black theme-text-sub">{tByLang('基金是否派息', 'Fund Distributes?', 'ファンド分配の有無')}</label>
                                    <select
                                        value={modalState.draft.distributionEnabled || 'no'}
                                        onChange={(event) => setModalState(prev => {
                                            const enabled = event.target.value === 'yes' ? 'yes' : 'no';
                                            const nextDraft = {
                                                ...prev.draft,
                                                distributionEnabled: enabled
                                            };
                                            if (enabled !== 'yes') {
                                                nextDraft.distributionAmount = '';
                                                nextDraft.distributionRatePercent = '';
                                                nextDraft.distributionStartDate = '';
                                                nextDraft.distributionAccountId = '';
                                            }
                                            return { ...prev, draft: nextDraft };
                                        })}
                                        className="w-full rounded-lg theme-input px-3 py-2 text-sm font-bold"
                                    >
                                        <option value="no">{tByLang('不派息', 'No', 'なし')}</option>
                                        <option value="yes">{tByLang('派息', 'Yes', 'あり')}</option>
                                    </select>
                                </div>
                                {modalState.draft.distributionEnabled === 'yes' && (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black theme-text-sub">{tByLang('派息處理方式', 'Distribution Handling', '分配処理方式')}</label>
                                            <select
                                                value={modalState.draft.distributionMode || 'cash'}
                                                onChange={(event) => setModalState(prev => {
                                                    const nextMode = ['cash', 'accumulate', 'reinvest'].includes(event.target.value) ? event.target.value : 'cash';
                                                    const nextDraft = { ...prev.draft, distributionMode: nextMode };
                                                    if (nextMode !== 'cash') {
                                                        nextDraft.distributionAccountId = '';
                                                    }
                                                    if (nextMode !== 'accumulate') {
                                                        nextDraft.distributionAccumulationRatePercent = '';
                                                    }
                                                    return { ...prev, draft: nextDraft };
                                                })}
                                                className="w-full rounded-lg theme-input px-3 py-2 text-sm font-bold"
                                            >
                                                <option value="cash">{tByLang('派息入帳', 'Cash Payout', '入金')}</option>
                                                <option value="accumulate">{tByLang('積存生息', 'Accumulate', '積立')}</option>
                                                <option value="reinvest">{tByLang('再投資', 'Reinvest', '再投資')}</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black theme-text-sub">{tByLang('每期派息', 'Distribution / Cycle', '各周期分配')}</label>
                                            <input type="number" step="any" min="0" value={modalState.draft.distributionAmount} onChange={(event) => setModalState(prev => ({ ...prev, draft: { ...prev.draft, distributionAmount: event.target.value } }))} className="w-full rounded-lg theme-input px-3 py-2 text-sm font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black theme-text-sub">{tByLang('派息比率 (%)', 'Distribution Rate (%)', '分配率 (%)')}</label>
                                            <input type="number" step="any" min="0" value={modalState.draft.distributionRatePercent} onChange={(event) => setModalState(prev => ({ ...prev, draft: { ...prev.draft, distributionRatePercent: event.target.value } }))} className="w-full rounded-lg theme-input px-3 py-2 text-sm font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black theme-text-sub">{tByLang('派息週期', 'Distribution Frequency', '分配周期')}</label>
                                            <select value={modalState.draft.distributionFrequency || 'monthly'} onChange={(event) => setModalState(prev => ({ ...prev, draft: { ...prev.draft, distributionFrequency: event.target.value } }))} className="w-full rounded-lg theme-input px-3 py-2 text-sm font-bold">
                                                <option value="monthly">{tByLang('每月', 'Monthly', '毎月')}</option>
                                                <option value="yearly">{tByLang('每年', 'Yearly', '毎年')}</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black theme-text-sub">{tByLang('派息開始日', 'Distribution Start Date', '分配開始日')}</label>
                                            <input type="date" value={modalState.draft.distributionStartDate || ''} onChange={(event) => setModalState(prev => ({ ...prev, draft: { ...prev.draft, distributionStartDate: event.target.value } }))} className="w-full rounded-lg theme-input px-3 py-2 text-sm font-bold" />
                                        </div>
                                        {(modalState.draft.distributionMode || 'cash') === 'accumulate' && (
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black theme-text-sub">{tByLang('積存年化利率（%）', 'Accumulation APR (%)', '積立年利（%）')}</label>
                                                <input type="number" step="any" min="0" value={modalState.draft.distributionAccumulationRatePercent || ''} onChange={(event) => setModalState(prev => ({ ...prev, draft: { ...prev.draft, distributionAccumulationRatePercent: event.target.value } }))} className="w-full rounded-lg theme-input px-3 py-2 text-sm font-bold" />
                                            </div>
                                        )}
                                        {(modalState.draft.distributionMode || 'cash') === 'cash' && (
                                            <div className="space-y-1 md:col-span-2">
                                                <label className="text-[10px] font-black theme-text-sub">{tByLang('派息入帳帳戶', 'Distribution Payout Account', '分配入金口座')}</label>
                                                <select value={modalState.draft.distributionAccountId || ''} onChange={(event) => setModalState(prev => ({ ...prev, draft: { ...prev.draft, distributionAccountId: event.target.value } }))} className="w-full rounded-lg theme-input px-3 py-2 text-sm font-bold">
                                                    <option value="">{tByLang('請選擇帳戶', 'Select account', '口座を選択')}</option>
                                                    {distributionAccountOptions.map(option => <option key={`${item.id}-dist-account-${option.id}`} value={option.id}>{option.label}</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 text-xs font-black">
                                <button type="button" onClick={closeModal} className="rounded-lg border border-slate-300 bg-white px-3 py-2 theme-text-sub">{tByLang('取消', 'Cancel', 'キャンセル')}</button>
                                <button type="button" onClick={saveModal} className="rounded-lg border px-3 py-2 text-white" style={{ backgroundColor: resolvedAccentColor, borderColor: resolvedAccentColor }}>{tByLang('儲存', 'Save', '保存')}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

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
        CASHFLOW_FREQUENCIES,
        onInsuranceFundRowFieldChange,
        onInsuranceFundAppendRowWithData,
        onInsuranceFundRemoveRow,
        onInsuranceFundMoveRow,
        onInsuranceFundDuplicateRow,
        onInsuranceFundClearRows,
        fundCurrencyOptions,
        chartPalette,
        fundAccentColor,
        liquidAssetLabelById
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
                const insuranceHasSupplementaryBenefit = item.insuranceHasSupplementaryBenefit === 'yes';
                const isInvestmentLinkedLifeSubtype = isLifeInsurance && ['投資型壽險', '投資/投資相連'].includes(item.subtype);
                const investmentFundRows = parseInvestmentFundRows(item.insuranceInvestmentFundItems || '');
                const investmentFundTotals = investmentFundRows.reduce((acc, row) => {
                    acc.balance += row.balance;
                    acc.pnl += row.pnl;
                    acc.balanceHKD += toHKD(row.balance, row.currency || item.currency || 'HKD');
                    const currency = row.currency || item.currency || 'HKD';
                    if (!acc.balanceByCurrency[currency]) acc.balanceByCurrency[currency] = 0;
                    acc.balanceByCurrency[currency] += row.balance;
                    return acc;
                }, { balance: 0, pnl: 0, balanceHKD: 0, balanceByCurrency: {} });
                const fundBalanceByCurrencyText = Object.entries(investmentFundTotals.balanceByCurrency)
                    .map(([currency, amount]) => `${formatAmount(amount)} ${currency}`)
                    .join(' + ');
                const investmentStrategyNote = (item.insuranceInvestmentStrategyNote || '').trim();
                const insuranceCoverageAmount = Number(item.insuranceCoverageAmount || 0);
                const insuranceCoverageDisplay = fromHKD(toHKD(insuranceCoverageAmount, item.currency), displayCurrency);
                const manualPremiumPaidCount = Number(item.premiumPaidCount || 0);
                const autoPremiumPaidCount = Number(insuranceAutoPaidCountByAssetId?.[item.id] || 0);
                const premiumPaymentYearsRaw = Number(item.insurancePremiumPaymentYears || 0);
                const premiumPaymentYears = Number.isFinite(premiumPaymentYearsRaw) && premiumPaymentYearsRaw > 0
                    ? Math.floor(premiumPaymentYearsRaw)
                    : 0;
                const premiumTermsPerYear = resolvePremiumTermsPerYear(item.premiumFrequency);
                const premiumTotalTermsRaw = Number(item.insurancePremiumTotalTerms || 0);
                const premiumTermCap = premiumTotalTermsRaw > 0
                    ? Math.floor(premiumTotalTermsRaw)
                    : (premiumPaymentYears > 0 ? premiumPaymentYears * premiumTermsPerYear : 0);
                const paidCountRaw = Math.max(manualPremiumPaidCount, autoPremiumPaidCount);
                const effectivePremiumPaidCount = premiumTermCap > 0 ? Math.min(paidCountRaw, premiumTermCap) : paidCountRaw;
                const premiumAmount = Number(item.premiumAmount || 0);
                const premiumTotalAmount = premiumAmount * effectivePremiumPaidCount;
                const premiumTotalHKD = toHKD(premiumTotalAmount, item.currency || 'HKD');
                const isPolicyFullyPaid = premiumTermCap > 0 && effectivePremiumPaidCount >= premiumTermCap;
                const currentPolicyYear = effectivePremiumPaidCount > 0
                    ? ((item.premiumFrequency === 'yearly' || item.premiumFrequency === 'single') ? effectivePremiumPaidCount : (Math.floor((effectivePremiumPaidCount - 1) / 12) + 1))
                    : 0;
                const premiumCycleLabel = resolvePremiumCycleLabel(item.premiumFrequency, tByLang);
                const investmentAccountBalanceDisplay = fromHKD(investmentFundTotals.balanceHKD, displayCurrency);
                const investmentAccountPnlDisplay = fromHKD(investmentFundTotals.balanceHKD - premiumTotalHKD, displayCurrency);
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
                                {amountPrefix}{formatAmount(isInvestmentLinkedLifeSubtype ? investmentAccountBalanceDisplay : mktValDisplay)} {displayCurrency}
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
                                                : tByLang(
                                                    item.premiumFrequency === 'single'
                                                        ? ` · 一次性 · 扣款日 ${item.insuranceStartDate || '--'}`
                                                        : ` · ${premiumCycleLabel} · 扣款日 ${insuranceHasPaymentDay ? `${insurancePaymentDay} 號` : '--'} · 下期 ${nextBillingDateKey || '--'}`,
                                                    item.premiumFrequency === 'single'
                                                        ? ` · one-time · Debit Date ${item.insuranceStartDate || '--'}`
                                                        : ` · ${premiumCycleLabel} · Debit Day ${insuranceHasPaymentDay ? `${insurancePaymentDay}` : '--'} · Next ${nextBillingDateKey || '--'}`,
                                                    item.premiumFrequency === 'single'
                                                        ? ` ・単発 ・引落日 ${item.insuranceStartDate || '--'}`
                                                        : ` ・${premiumCycleLabel} ・引落日 ${insuranceHasPaymentDay ? `${insurancePaymentDay}日` : '--'} ・次回 ${nextBillingDateKey || '--'}`
                                                )}
                                        </span>
                                        {isPolicyFullyPaid && (
                                            <span className={`ml-1 ${PAID_OFF_BADGE_CLASS}`}>{tByLang('保費全部繳清', 'Paid Off', '払込完了')}</span>
                                        )}
                                    </>
                                    : isInvestmentLinkedLifeSubtype
                                        ? <span className="text-indigo-700">{tByLang(
                                            `保費總額 ${formatAmount(fromHKD(premiumTotalHKD, displayCurrency))} ${displayCurrency} · 基金加總 ${fundBalanceByCurrencyText || '--'} · 盈虧 ${investmentAccountPnlDisplay >= 0 ? '+' : ''}${formatAmount(investmentAccountPnlDisplay)} ${displayCurrency}`,
                                            `Total Premium ${formatAmount(fromHKD(premiumTotalHKD, displayCurrency))} ${displayCurrency} · Total Funds ${fundBalanceByCurrencyText || '--'} · P/L ${investmentAccountPnlDisplay >= 0 ? '+' : ''}${formatAmount(investmentAccountPnlDisplay)} ${displayCurrency}`,
                                            `総保険料 ${formatAmount(fromHKD(premiumTotalHKD, displayCurrency))} ${displayCurrency} ・ファンド合計 ${fundBalanceByCurrencyText || '--'} ・損益 ${investmentAccountPnlDisplay >= 0 ? '+' : ''}${formatAmount(investmentAccountPnlDisplay)} ${displayCurrency}`
                                        )}</span>
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
                                            ? tByLang(
                                                `保單市值 ${formatAmount(mktValDisplay)} ${displayCurrency} · 數量 ${formatAmount(item.quantity || 0)}`,
                                                `Policy Value ${formatAmount(mktValDisplay)} ${displayCurrency} · Units ${formatAmount(item.quantity || 0)}`,
                                                `保単価値 ${formatAmount(mktValDisplay)} ${displayCurrency} ・数量 ${formatAmount(item.quantity || 0)}`
                                            )
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
                                : <div className="text-xs text-slate-500 font-bold">{tByLang(
                                    `已繳 ${effectivePremiumPaidCount} ${item.insuranceEndDate ? `/ ${(totalBillingPeriods ?? '--').toString()}期` : '期'}`,
                                    `Paid ${effectivePremiumPaidCount} ${item.insuranceEndDate ? `/ ${(totalBillingPeriods ?? '--').toString()} terms` : 'terms'}`,
                                    `支払済 ${effectivePremiumPaidCount} ${item.insuranceEndDate ? `/ ${(totalBillingPeriods ?? '--').toString()}期` : '期'}`
                                )}</div>
                        )}
                        {isHealthInsurance && item.insuranceEndDate && (
                            <div className="text-[11px] text-slate-500 font-bold space-y-1">
                                <div>{tByLang('保單生效日', 'Policy Effective Date', '保険開始日')}: {item.insuranceStartDate || '--'}</div>
                                <div>{tByLang('保單終止日', 'Policy End Date', '保険終了日')}: {item.insuranceEndDate}</div>
                            </div>
                        )}
                        {isInsuranceCategory && (
                            <div className="text-[11px] text-slate-500 font-bold space-y-1">
                                {insuranceProvider && <div className="text-indigo-700">{tByLang('保險公司', 'Insurance Company', '保険会社')}：{insuranceProvider}</div>}
                                {insurancePolicyNumber && <div className="text-violet-700">{tByLang('保單號', 'Policy Number', '証券番号')}：{insurancePolicyNumber}</div>}
                                {insuranceBeneficiary && <div className="text-emerald-700">受益人：{insuranceBeneficiary}</div>}
                                {!isInvestmentLinkedLifeSubtype && insuranceCoverageAmount > 0 && <div className="text-amber-700">保額：{formatAmount(insuranceCoverageAmount)} {item.currency}</div>}
                                {isLifeInsurance && (insuranceBasePremiumAmount > 0 || (insuranceHasSupplementaryBenefit && insuranceSupplementaryPremiumAmount > 0)) && (
                                    <div className="text-amber-700">
                                        {tByLang('保費組合：主約 ', 'Premium Mix: Base ', '保険料内訳：主契約 ')}{formatAmount(insuranceBasePremiumAmount)} {item.currency}
                                        {insuranceHasSupplementaryBenefit && insuranceSupplementaryPremiumAmount > 0
                                            ? tByLang(` + 附加 ${formatAmount(insuranceSupplementaryPremiumAmount)} ${item.currency}`, ` + Supplementary ${formatAmount(insuranceSupplementaryPremiumAmount)} ${item.currency}`, ` + 特約 ${formatAmount(insuranceSupplementaryPremiumAmount)} ${item.currency}`)
                                            : ''}
                                    </div>
                                )}
                                {isLifeInsurance && insuranceHasSupplementaryBenefit && insuranceSupplementaryBenefitName && (
                                    <div className="text-indigo-700">
                                        {tByLang('附加保障：', 'Supplementary Benefit:', '特約：')}
                                        {insuranceSupplementaryBenefitName}
                                        {insuranceSupplementaryBenefitRegion ? ` · ${insuranceSupplementaryBenefitRegion}` : ''}
                                        {insuranceSupplementaryBenefitDeductible ? tByLang(` · 自付費 ${insuranceSupplementaryBenefitDeductible}`, ` · Deductible ${insuranceSupplementaryBenefitDeductible}`, ` ・自己負担 ${insuranceSupplementaryBenefitDeductible}`) : ''}
                                    </div>
                                )}
                                {isInvestmentLinkedLifeSubtype && investmentStrategyNote && (
                                    <div className="text-indigo-700">{tByLang('投資策略：', 'Strategy:', '運用方針：')}{investmentStrategyNote}</div>
                                )}
                                {isInvestmentLinkedLifeSubtype && (
                                    <InvestmentFundManagerSection
                                        item={item}
                                        investmentFundRows={investmentFundRows}
                                        tByLang={tByLang}
                                        formatAmount={formatAmount}
                                        onInsuranceFundRowFieldChange={onInsuranceFundRowFieldChange}
                                        onInsuranceFundAppendRowWithData={onInsuranceFundAppendRowWithData}
                                        onInsuranceFundRemoveRow={onInsuranceFundRemoveRow}
                                        onInsuranceFundMoveRow={onInsuranceFundMoveRow}
                                        onInsuranceFundDuplicateRow={onInsuranceFundDuplicateRow}
                                        onInsuranceFundClearRows={onInsuranceFundClearRows}
                                        toHKD={toHKD}
                                        fromHKD={fromHKD}
                                        displayCurrency={displayCurrency}
                                        fundCurrencyOptions={fundCurrencyOptions}
                                        liquidAssetLabelById={liquidAssetLabelById}
                                        chartPalette={chartPalette}
                                        accentColor={fundAccentColor}
                                        premiumTotalAmount={premiumTotalAmount}
                                    />
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
                            const isBankWealthItem = item.subtype === '銀行理財';
                            const isFundInvestItem = item.subtype === '基金';
                            const isFundDistributionEnabled = item.fundDistributionEnabled === 'yes';
                            const fundDistributionMode = ['cash', 'accumulate', 'reinvest'].includes(item.fundDistributionMode) ? item.fundDistributionMode : 'cash';
                            const fundDistributionAmount = Number(item.fundDistributionAmount || 0);
                            const fundDistributionRatePercent = Number(item.fundDistributionRatePercent || 0);
                            const fundDistributionAccumulationRatePercent = Number(item.fundDistributionAccumulationRatePercent || 0);
                            const fundDistributionAccumulationBalance = Number(item.fundDistributionAccumulationBalance || 0);
                            const fundDistributionFrequency = String(item.fundDistributionFrequency || 'monthly').toLowerCase() === 'yearly' ? 'yearly' : 'monthly';
                            const fundDistributionStartDate = item.fundDistributionStartDate || '';
                            const fundDistributionAccountLabel = liquidAssetLabelById?.[item.fundDistributionAccountId] || '';
                            const fixedDepositMonths = Number(item.fixedDepositMonths || 0);
                            const fixedDepositDays = Number(item.fixedDepositDays || 0);
                            const fixedDepositTermMode = item.fixedDepositTermMode === 'days' ? 'days' : 'months';
                            const fixedDepositRate = Number(item.fixedDepositAnnualRate || 0);
                            const fixedDepositStartDate = item.fixedDepositStartDate || '';
                            const fixedDepositMaturityDate = resolveFixedDepositMaturityDateKey({
                                startDateKey: fixedDepositStartDate,
                                months: fixedDepositMonths,
                                days: fixedDepositDays,
                                termMode: fixedDepositTermMode
                            });
                            const fixedDepositTargetLabel = liquidAssetLabelById?.[item.fixedDepositTargetLiquidAssetId] || '';
                            const bankWealthTermDays = Number(item.bankWealthTermDays || 0);
                            const bankWealthGuaranteedRate = Number(item.bankWealthGuaranteedAnnualRate || 0);
                            const bankWealthMaxRate = Number(item.bankWealthMaxAnnualRate || 0);
                            const bankWealthStartDate = item.bankWealthStartDate || '';
                            const bankWealthMaturityDate = item.bankWealthMaturityDate || resolveMaturityDateByDays({
                                startDateKey: bankWealthStartDate,
                                days: bankWealthTermDays
                            });
                            const bankWealthTargetLabel = liquidAssetLabelById?.[item.bankWealthTargetLiquidAssetId] || '';
                            const bankWealthPayoutMode = item.bankWealthMaturityPayoutMode === 'max'
                                ? 'max'
                                : (item.bankWealthMaturityPayoutMode === 'manual' ? 'manual' : 'guaranteed');
                            const bankWealthPayoutAmount = (() => {
                                if (bankWealthPayoutMode === 'max') return Number(item.bankWealthMaxMaturityAmount || item.currentPrice || 0);
                                if (bankWealthPayoutMode === 'manual') return Number(item.bankWealthMaturityManualAmount || 0);
                                return Number(item.bankWealthGuaranteedMaturityAmount || item.currentPrice || 0);
                            })();

                            return (
                                <div className="space-y-1 text-xs font-bold">
                                    <div className="text-slate-500">市值 {formatAmount(mktValDisplay)} {displayCurrency} · 數量 {formatAmount(item.quantity)} {item.symbol ? `(${item.symbol})` : ''}</div>
                                    <div className="text-slate-500">現價 {formatAmount(item.currentPrice)} · 成本 {formatAmount(item.costBasis)} {item.currency}</div>
                                    {isFixedDepositItem && (
                                        <>
                                            <div className="text-slate-500">定期 {fixedDepositTermMode === 'days' ? `${fixedDepositDays || '--'} 天` : `${fixedDepositMonths || '--'} 個月`} · 年利率 {fixedDepositRate.toFixed(2)}% {fixedDepositStartDate ? `· 起存 ${fixedDepositStartDate}` : ''}</div>
                                            <div className="text-slate-500">
                                                {tByLang('預計到期', 'Expected Maturity', '満期予定')} {fixedDepositMaturityDate || '--'}
                                                {fixedDepositTargetLabel ? ` · ${tByLang('到期入帳', 'Maturity Payout', '満期入金')} ${fixedDepositTargetLabel}` : ''}
                                            </div>
                                        </>
                                    )}
                                    {isBankWealthItem && (
                                        <>
                                            <div className="text-slate-500">
                                                {tByLang('期限', 'Term', '期間')} {bankWealthTermDays || '--'} {tByLang('天', 'days', '日')} ·
                                                {tByLang('保底/最高年化', 'Guaranteed/Max APR', '最低/最高年利')} {bankWealthGuaranteedRate.toFixed(2)}% / {bankWealthMaxRate.toFixed(2)}%
                                                {bankWealthStartDate ? ` · ${tByLang('起息', 'Start', '起算')} ${bankWealthStartDate}` : ''}
                                            </div>
                                            <div className="text-slate-500">
                                                {tByLang('到期', 'Maturity', '満期')} {bankWealthMaturityDate || '--'}
                                                {bankWealthTargetLabel ? ` · ${tByLang('到期入帳', 'Maturity Payout', '満期入金')} ${bankWealthTargetLabel}` : ''}
                                            </div>
                                            <div className="text-slate-500">
                                                {tByLang('入帳模式', 'Payout Mode', '入金モード')} {bankWealthPayoutMode === 'max' ? tByLang('最高', 'Maximum', '最高') : (bankWealthPayoutMode === 'manual' ? tByLang('手動', 'Manual', '手動') : tByLang('保底', 'Guaranteed', '最低'))}
                                                {' · '}
                                                {tByLang('到期入帳額', 'Payout Amount', '入金額')} {formatAmount(bankWealthPayoutAmount)} {item.currency}
                                            </div>
                                        </>
                                    )}
                                    {isFundInvestItem && isFundDistributionEnabled && fundDistributionAmount > 0 && (
                                        <>
                                            <div className="text-slate-500">
                                                {tByLang('基金派息', 'Fund Distribution', 'ファンド分配')} {formatAmount(fundDistributionAmount)} {item.currency}
                                                {' · '}
                                                {fundDistributionFrequency === 'yearly' ? tByLang('每年', 'Yearly', '毎年') : tByLang('每月', 'Monthly', '毎月')}
                                                {' · '}
                                                {fundDistributionMode === 'cash'
                                                    ? tByLang('入帳', 'Cash Payout', '入金')
                                                    : (fundDistributionMode === 'reinvest'
                                                        ? tByLang('再投資', 'Reinvest', '再投資')
                                                        : tByLang('積存生息', 'Accumulate', '積立'))}
                                                {fundDistributionRatePercent > 0 ? ` · ${tByLang('比率', 'Rate', '比率')} ${formatAmount(fundDistributionRatePercent)}%` : ''}
                                            </div>
                                            <div className="text-slate-500">
                                                {tByLang('開始日', 'Start Date', '開始日')} {fundDistributionStartDate || '--'}
                                                {fundDistributionMode === 'cash' && fundDistributionAccountLabel ? ` · ${tByLang('入帳', 'Payout', '入金')} ${fundDistributionAccountLabel}` : ''}
                                                {fundDistributionMode === 'accumulate' && fundDistributionAccumulationRatePercent > 0 ? ` · ${tByLang('年化', 'APR', '年利')} ${formatAmount(fundDistributionAccumulationRatePercent)}%` : ''}
                                            </div>
                                            {fundDistributionMode === 'accumulate' && fundDistributionAccumulationBalance > 0 && (
                                                <div className="text-slate-500">
                                                    {tByLang('積存餘額', 'Accumulated Balance', '積立残高')} {formatAmount(fundDistributionAccumulationBalance)} {item.currency}
                                                </div>
                                            )}
                                        </>
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
        insurancePartialWithdrawalStatsByAssetId,
        onInsuranceFundRowFieldChange,
        onInsuranceFundAppendRowWithData,
        onInsuranceFundRemoveRow,
        onInsuranceFundMoveRow,
        onInsuranceFundDuplicateRow,
        onInsuranceFundClearRows,
        fundCurrencyOptions,
        chartPalette,
        fundAccentColor,
        liquidAssetLabelById
    }) => {
        const isHealthInsuranceGroup = isInsuranceCategory && items.length > 0 && items.every(item => INSURANCE_HEALTH_SUBTYPES.includes(item.subtype));
        const isLifeInsuranceGroup = isInsuranceCategory && items.length > 0 && items.every(item => INSURANCE_LIFE_WEALTH_SUBTYPES.includes(item.subtype));
        const isInvestmentLinkedOnlyGroup = isInsuranceCategory && items.length > 0 && items.every(item => ['投資型壽險', '投資/投資相連'].includes(item.subtype));

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
                        isInvestmentLinkedOnlyGroup ? (
                            <colgroup>
                                <col style={{ width: '21%' }} />
                                <col style={{ width: '15%' }} />
                                <col style={{ width: '15%' }} />
                                <col style={{ width: '17%' }} />
                                <col style={{ width: '16%' }} />
                                <col style={{ width: '17%' }} />
                            </colgroup>
                        ) : (
                            <colgroup>
                                <col style={{ width: '28%' }} />
                                <col style={{ width: '14%' }} />
                                <col style={{ width: '22%' }} />
                                <col style={{ width: '18%' }} />
                                <col style={{ width: '18%' }} />
                            </colgroup>
                        )
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
                            <th className="px-6 py-3 text-right">{isInsuranceCategory ? ((isHealthInsuranceGroup || isLifeInsuranceGroup) ? (isInvestmentLinkedOnlyGroup ? tByLang('保費總額', 'Total Premium', '総保険料') : translate('保額/名義金額')) : translate('保費設定')) : isLiquidCategory ? translate('數量 / 幣別') : isLiabilityCategory ? translate('金額 / 期數') : isReceivableCategory ? translate('應收金額 / 期數') : isFixedCategory ? translate('估值 / 成本') : translate('市值 / 數量')}</th>
                            <th className="px-6 py-3 text-right">{isInsuranceCategory ? ((isHealthInsuranceGroup || isLifeInsuranceGroup) ? translate('保費設定') : translate('已繳期數')) : isLiquidCategory ? translate('餘額') : isLiabilityCategory ? translate('利率 / 到期') : isReceivableCategory ? translate('到期 / 對象') : isFixedCategory ? translate('購入日 / 備註') : translate('現價 / 成本')}</th>
                            {isInsuranceCategory && (isHealthInsuranceGroup || isLifeInsuranceGroup) && <th className="px-6 py-3 text-right">{translate('已繳期數')}</th>}
                            {isInsuranceCategory && isInvestmentLinkedOnlyGroup && <th className="px-6 py-3 text-right">{tByLang('帳戶盈虧', 'Account P/L', '口座損益')}</th>}
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
                            const premiumTermsPerYear = resolvePremiumTermsPerYear(item.premiumFrequency);
                            const premiumTotalTermsRaw = Number(item.insurancePremiumTotalTerms || 0);
                            const premiumTermCap = premiumTotalTermsRaw > 0
                                ? Math.floor(premiumTotalTermsRaw)
                                : (premiumPaymentYears > 0 ? premiumPaymentYears * premiumTermsPerYear : 0);
                            const paidCountRaw = Math.max(manualPremiumPaidCount, autoPremiumPaidCount);
                            const effectivePremiumPaidCount = premiumTermCap > 0 ? Math.min(paidCountRaw, premiumTermCap) : paidCountRaw;
                            const isPolicyFullyPaid = premiumTermCap > 0 && effectivePremiumPaidCount >= premiumTermCap;
                            const hasPremiumPlan = premiumAmount > 0 && effectivePremiumPaidCount >= 0;
                            const premiumTotalOrig = premiumAmount * effectivePremiumPaidCount;
                            const isHealthInsurance = isInsuranceCategory && INSURANCE_HEALTH_SUBTYPES.includes(item.subtype);
                            const isLifeInsurance = isInsuranceCategory && INSURANCE_LIFE_WEALTH_SUBTYPES.includes(item.subtype);
                            const isLinkedInsurance = isInsuranceCategory && ['投資型壽險', '投資/投資相連', '萬能壽險'].includes(item.subtype);
                            const currentPolicyYear = effectivePremiumPaidCount > 0
                                ? ((item.premiumFrequency === 'yearly' || item.premiumFrequency === 'single') ? effectivePremiumPaidCount : (Math.floor((effectivePremiumPaidCount - 1) / 12) + 1))
                                : 0;
                            const premiumCycleLabel = resolvePremiumCycleLabel(item.premiumFrequency, tByLang);
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
                            const hasDistributionBenefit = annualDistributionAmount > 0;
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
                            const insuranceHasSupplementaryBenefit = item.insuranceHasSupplementaryBenefit === 'yes';
                            const isInvestmentLinkedLifeSubtype = isLifeInsurance && ['投資型壽險', '投資/投資相連'].includes(item.subtype);
                            const investmentFundRows = parseInvestmentFundRows(item.insuranceInvestmentFundItems || '');
                            const investmentFundTotals = investmentFundRows.reduce((acc, row) => {
                                acc.balance += row.balance;
                                acc.pnl += row.pnl;
                                acc.balanceHKD += toHKD(row.balance, row.currency || item.currency || 'HKD');
                                const currency = row.currency || item.currency || 'HKD';
                                if (!acc.balanceByCurrency[currency]) acc.balanceByCurrency[currency] = 0;
                                acc.balanceByCurrency[currency] += row.balance;
                                return acc;
                            }, { balance: 0, pnl: 0, balanceHKD: 0, balanceByCurrency: {} });
                            const premiumTotalHKD = toHKD(premiumTotalOrig, item.currency || 'HKD');
                            const premiumTotalDisplay = fromHKD(premiumTotalHKD, displayCurrency);
                            const investmentAccountBalanceDisplay = fromHKD(investmentFundTotals.balanceHKD, displayCurrency);
                            const investmentAccountPnlDisplay = fromHKD(investmentFundTotals.balanceHKD - premiumTotalHKD, displayCurrency);
                            const investmentAccountPnlPercent = premiumTotalHKD > 0
                                ? (((investmentFundTotals.balanceHKD - premiumTotalHKD) / premiumTotalHKD) * 100)
                                : 0;
                            const insuranceAmountPositive = !isInvestmentLinkedLifeSubtype || investmentAccountPnlDisplay >= 0;
                            const insuranceAmountMainClass = insuranceAmountPositive ? 'text-emerald-700' : 'text-rose-700';
                            const insuranceAmountSubClass = insuranceAmountPositive ? 'text-emerald-600' : 'text-rose-600';
                            const fundBalanceByCurrencyText = Object.entries(investmentFundTotals.balanceByCurrency)
                                .map(([currency, amount]) => `${formatAmount(amount)} ${currency}`)
                                .join(' + ');
                            const investmentStrategyNote = (item.insuranceInvestmentStrategyNote || '').trim();
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
                            const isFixedDepositItem = isInvestCategory && item.subtype === '定期存款';
                            const isBankWealthItem = isInvestCategory && item.subtype === '銀行理財';
                            const isFundInvestItem = isInvestCategory && item.subtype === '基金';
                            const fixedDepositMonths = Number(item.fixedDepositMonths || 0);
                            const fixedDepositDays = Number(item.fixedDepositDays || 0);
                            const fixedDepositTermMode = item.fixedDepositTermMode === 'days' ? 'days' : 'months';
                            const fixedDepositRate = Number(item.fixedDepositAnnualRate || 0);
                            const fixedDepositStartDate = item.fixedDepositStartDate || '';
                            const fixedDepositMaturityDate = resolveFixedDepositMaturityDateKey({
                                startDateKey: fixedDepositStartDate,
                                months: fixedDepositMonths,
                                days: fixedDepositDays,
                                termMode: fixedDepositTermMode
                            });
                            const fixedDepositTargetLabel = liquidAssetLabelById?.[item.fixedDepositTargetLiquidAssetId] || '';
                            const bankWealthTermDays = Number(item.bankWealthTermDays || 0);
                            const bankWealthGuaranteedRate = Number(item.bankWealthGuaranteedAnnualRate || 0);
                            const bankWealthMaxRate = Number(item.bankWealthMaxAnnualRate || 0);
                            const bankWealthStartDate = item.bankWealthStartDate || '';
                            const bankWealthMaturityDate = item.bankWealthMaturityDate || resolveMaturityDateByDays({
                                startDateKey: bankWealthStartDate,
                                days: bankWealthTermDays
                            });
                            const bankWealthTargetLabel = liquidAssetLabelById?.[item.bankWealthTargetLiquidAssetId] || '';
                            const bankWealthPayoutMode = item.bankWealthMaturityPayoutMode === 'max'
                                ? 'max'
                                : (item.bankWealthMaturityPayoutMode === 'manual' ? 'manual' : 'guaranteed');
                            const bankWealthPayoutAmount = (() => {
                                if (bankWealthPayoutMode === 'max') return Number(item.bankWealthMaxMaturityAmount || item.currentPrice || 0);
                                if (bankWealthPayoutMode === 'manual') return Number(item.bankWealthMaturityManualAmount || 0);
                                return Number(item.bankWealthGuaranteedMaturityAmount || item.currentPrice || 0);
                            })();
                            const fundDistributionAmount = Number(item.fundDistributionAmount || 0);
                            const fundDistributionRatePercent = Number(item.fundDistributionRatePercent || 0);
                            const fundDistributionFrequency = String(item.fundDistributionFrequency || 'monthly').toLowerCase() === 'yearly' ? 'yearly' : 'monthly';
                            const fundDistributionStartDate = item.fundDistributionStartDate || '';
                            const fundDistributionAccountLabel = liquidAssetLabelById?.[item.fundDistributionAccountId] || '';
                            const isPerfPositive = perf > 0;
                            const isPerfNegative = perf < 0;
                            const perfClass = isPerfPositive
                                ? 'text-emerald-700 bg-emerald-50 ring-emerald-100'
                                : isPerfNegative
                                    ? 'text-rose-700 bg-rose-50 ring-rose-100'
                                    : 'text-slate-600 bg-slate-100 ring-slate-200';
                            const perfIcon = isPerfPositive ? '↗' : isPerfNegative ? '↘' : '•';

                            const insuranceColumnCount = (isHealthInsuranceGroup || isLifeInsuranceGroup)
                                ? (isInvestmentLinkedOnlyGroup ? 6 : 5)
                                : 4;
                            return (
                                <React.Fragment key={item.id}>
                                <tr onClick={() => openEdit(item)} className="hover:bg-indigo-50/30 cursor-pointer transition-colors group">
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
                                        {isFixedDepositItem && (
                                            <div className="text-[10px] text-slate-500 font-medium mt-1 space-y-0.5">
                                                <div>{tByLang('定期', 'Term', '預入期間')} {fixedDepositTermMode === 'days' ? `${fixedDepositDays || '--'} ${tByLang('天', 'days', '日')}` : `${fixedDepositMonths || '--'} ${tByLang('個月', 'months', 'か月')}`} · {tByLang('年利率', 'Rate', '年利率')} {fixedDepositRate.toFixed(2)}% {fixedDepositStartDate ? `· ${tByLang('起存', 'Start', '開始')} ${fixedDepositStartDate}` : ''}</div>
                                                <div>{tByLang('預計到期', 'Expected Maturity', '満期予定')} {fixedDepositMaturityDate || '--'}{fixedDepositTargetLabel ? ` · ${tByLang('到期入帳', 'Maturity Payout', '満期入金')} ${fixedDepositTargetLabel}` : ''}</div>
                                            </div>
                                        )}
                                        {isBankWealthItem && (
                                            <div className="text-[10px] text-slate-500 font-medium mt-1 space-y-0.5">
                                                <div>{tByLang('期限', 'Term', '期間')} {bankWealthTermDays || '--'} {tByLang('天', 'days', '日')} · {tByLang('保底/最高年化', 'Guaranteed/Max APR', '最低/最高年利')} {bankWealthGuaranteedRate.toFixed(2)}% / {bankWealthMaxRate.toFixed(2)}% {bankWealthStartDate ? `· ${tByLang('起息', 'Start', '起算')} ${bankWealthStartDate}` : ''}</div>
                                                <div>{tByLang('到期', 'Maturity', '満期')} {bankWealthMaturityDate || '--'}{bankWealthTargetLabel ? ` · ${tByLang('到期入帳', 'Maturity Payout', '満期入金')} ${bankWealthTargetLabel}` : ''}</div>
                                                <div>{tByLang('入帳模式', 'Payout Mode', '入金モード')} {bankWealthPayoutMode === 'max' ? tByLang('最高', 'Maximum', '最高') : (bankWealthPayoutMode === 'manual' ? tByLang('手動', 'Manual', '手動') : tByLang('保底', 'Guaranteed', '最低'))} · {tByLang('到期入帳額', 'Payout Amount', '入金額')} {formatAmount(bankWealthPayoutAmount)} {item.currency}</div>
                                            </div>
                                        )}
                                        {isFundInvestItem && fundDistributionAmount > 0 && (
                                            <div className="text-[10px] text-slate-500 font-medium mt-1 space-y-0.5">
                                                <div>
                                                    {tByLang('基金派息', 'Fund Distribution', 'ファンド分配')} {formatAmount(fundDistributionAmount)} {item.currency}
                                                    {' · '}
                                                    {fundDistributionFrequency === 'yearly' ? tByLang('每年', 'Yearly', '毎年') : tByLang('每月', 'Monthly', '毎月')}
                                                    {fundDistributionRatePercent > 0 ? ` · ${tByLang('比率', 'Rate', '比率')} ${formatAmount(fundDistributionRatePercent)}%` : ''}
                                                </div>
                                                <div>
                                                    {tByLang('開始日', 'Start Date', '開始日')} {fundDistributionStartDate || '--'}
                                                    {fundDistributionAccountLabel ? ` · ${tByLang('入帳', 'Payout', '入金')} ${fundDistributionAccountLabel}` : ''}
                                                </div>
                                            </div>
                                        )}
                                        {isFixedItem && item.fixedNote && (
                                            <div className="text-[10px] text-slate-500 font-medium mt-1">
                                                {item.fixedNote}
                                            </div>
                                        )}
                                        {isInsuranceCategory && (
                                            <div className="text-[10px] text-slate-500 font-medium mt-1 space-y-0.5">
                                                {insuranceProvider && <div className="text-indigo-700">{tByLang('保險公司', 'Insurance Company', '保険会社')}：{insuranceProvider}</div>}
                                                {insurancePolicyNumber && <div className="text-violet-700">{tByLang('保單號', 'Policy Number', '証券番号')}：{insurancePolicyNumber}</div>}
                                                {insuranceBeneficiary && <div className="text-emerald-700">受益人：{insuranceBeneficiary}</div>}
                                                {isLifeInsurance && (insuranceBasePremiumAmount > 0 || (insuranceHasSupplementaryBenefit && insuranceSupplementaryPremiumAmount > 0)) && (
                                                    <div className="text-amber-700">
                                                        {tByLang('保費組合：主約 ', 'Premium Mix: Base ', '保険料内訳：主契約 ')}{formatAmount(insuranceBasePremiumAmount)} {item.currency}
                                                        {insuranceHasSupplementaryBenefit && insuranceSupplementaryPremiumAmount > 0
                                                            ? tByLang(` + 附加 ${formatAmount(insuranceSupplementaryPremiumAmount)} ${item.currency}`, ` + Supplementary ${formatAmount(insuranceSupplementaryPremiumAmount)} ${item.currency}`, ` + 特約 ${formatAmount(insuranceSupplementaryPremiumAmount)} ${item.currency}`)
                                                            : ''}
                                                    </div>
                                                )}
                                                {isLifeInsurance && insuranceHasSupplementaryBenefit && insuranceSupplementaryBenefitName && (
                                                    <div className="text-indigo-700">
                                                        {tByLang('附加保障：', 'Supplementary Benefit:', '特約：')}
                                                        {insuranceSupplementaryBenefitName}
                                                        {insuranceSupplementaryBenefitRegion ? ` · ${insuranceSupplementaryBenefitRegion}` : ''}
                                                        {insuranceSupplementaryBenefitDeductible ? tByLang(` · 自付費 ${insuranceSupplementaryBenefitDeductible}`, ` · Deductible ${insuranceSupplementaryBenefitDeductible}`, ` ・自己負担 ${insuranceSupplementaryBenefitDeductible}`) : ''}
                                                    </div>
                                                )}
                                                {isInvestmentLinkedLifeSubtype && investmentStrategyNote && <div className="text-indigo-700">{tByLang('投資策略：', 'Strategy:', '運用方針：')}{investmentStrategyNote}</div>}
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
                                                isInvestmentLinkedOnlyGroup && isInvestmentLinkedLifeSubtype ? (
                                                    <>
                                                        <div className={`font-bold ${insuranceAmountMainClass}`}>{formatAmount(premiumTotalDisplay)} <span className={`text-[9px] ${insuranceAmountSubClass}`}>{displayCurrency}</span></div>
                                                        <div className={`text-[10px] ${insuranceAmountSubClass}`}>{formatAmount(premiumTotalOrig)} {item.currency}</div>
                                                        <div className="text-[10px] text-indigo-600">{tByLang('基金', 'Funds', 'ファンド')} {investmentFundRows.length} {tByLang('項', 'items', '件')}</div>
                                                    </>
                                                ) : insuranceCoverageAmount > 0 ? (
                                                    <>
                                                        <div className={`font-bold ${insuranceAmountMainClass}`}>{formatAmount(insuranceCoverageDisplay)} <span className={`text-[9px] ${insuranceAmountSubClass}`}>{displayCurrency}</span></div>
                                                        <div className={`text-[10px] ${insuranceAmountSubClass}`}>{formatAmount(insuranceCoverageAmount)} {item.currency}</div>
                                                    </>
                                                ) : (
                                                    <div className="font-bold text-slate-400">--</div>
                                                )
                                            ) : isHealthInsurance ? (
                                                <div className={`font-bold ${insuranceAmountMainClass}`}>
                                                    {formatAmount(premiumAmount)} {item.currency}
                                                    <div className="text-[10px] text-slate-400">{tByLang(
                                                        item.premiumFrequency === 'single'
                                                            ? `/${tByLang('一次性', 'one-time', '単発')} · ${tByLang('扣款日', 'Debit Date', '引落日')} ${item.insuranceStartDate || '--'}`
                                                            : `/${premiumCycleLabel} · 扣款日 ${insuranceHasPaymentDay ? `${insurancePaymentDay} 號` : '--'}`,
                                                        item.premiumFrequency === 'single'
                                                            ? `/${tByLang('one-time', 'one-time', 'one-time')} · ${tByLang('Debit Date', 'Debit Date', 'Debit Date')} ${item.insuranceStartDate || '--'}`
                                                            : `/${premiumCycleLabel} · Debit Day ${insuranceHasPaymentDay ? `${insurancePaymentDay}` : '--'}`,
                                                        item.premiumFrequency === 'single'
                                                            ? `/${tByLang('単発', '単発', '単発')} ・${tByLang('引落日', '引落日', '引落日')} ${item.insuranceStartDate || '--'}`
                                                            : `/${premiumCycleLabel} ・引落日 ${insuranceHasPaymentDay ? `${insurancePaymentDay}日` : '--'}`
                                                    )}</div>
                                                </div>
                                            ) : isLifeInsurance ? (
                                                hasPremiumPlan ? (
                                                    <div className={`font-bold ${insuranceAmountMainClass}`}>
                                                        {formatAmount(premiumAmount)} {item.currency}
                                                        <div className="text-[10px] text-slate-400">/{premiumCycleLabel}{(item.premiumFrequency !== 'single' && premiumPaymentYears > 0) ? tByLang(` · 繳費 ${premiumPaymentYears} 年`, ` · Pay ${premiumPaymentYears} yrs`, ` ・払込 ${premiumPaymentYears} 年`) : ''}</div>
                                                    </div>
                                                ) : (
                                                    <div className="font-bold text-slate-400">--</div>
                                                )
                                            ) : isLinkedInsurance ? (
                                                <>
                                                    <div className="font-bold text-slate-800">{formatAmount(mktValDisplay)} <span className="text-[9px] text-slate-400">{displayCurrency}</span></div>
                                                    <div className="text-[10px] text-slate-400">{tByLang('數量', 'Units', '数量')} {formatAmount(item.quantity || 0)}</div>
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
                                                    <div className={`font-bold ${insuranceAmountMainClass}`}>{formatAmount(premiumAmount)} {item.currency}</div>
                                                    {!isPolicyFullyPaid ? (
                                                        <>
                                                            <div className="text-[10px] text-slate-400">{tByLang('繳費週期', 'Premium Cycle', '払込周期')}：{premiumCycleLabel}</div>
                                                            <div className="text-[10px] text-slate-400">{tByLang('扣款日', 'Debit Day', '引落日')}：{item.premiumFrequency === 'single' ? (item.insuranceStartDate || '--') : (insuranceHasPaymentDay ? tByLang(`${insurancePaymentDay} 號`, `${insurancePaymentDay}`, `${insurancePaymentDay}日`) : '--')}</div>
                                                            <div className="text-[10px] text-slate-400">{tByLang('下期扣款日', 'Next Debit Date', '次回引落日')}：{item.premiumFrequency === 'single' ? '--' : (nextBillingDateKey || '--')}</div>
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
                                                    <div className="font-medium text-slate-700">{tByLang(`${effectivePremiumPaidCount.toLocaleString()} 期`, `${effectivePremiumPaidCount.toLocaleString()} terms`, `${effectivePremiumPaidCount.toLocaleString()}期`)}</div>
                                                    <div className="text-[10px] text-slate-400">{tByLang('生效', 'Effective', '開始')} {item.insuranceStartDate || '--'}{item.insuranceEndDate ? tByLang(` · 終止 ${item.insuranceEndDate}`, ` · End ${item.insuranceEndDate}`, ` ・終了 ${item.insuranceEndDate}`) : ''}</div>
                                                </>
                                            ) : isLifeInsurance ? (
                                                hasPremiumPlan ? (
                                                    <>
                                                        <div className={`font-medium ${isPolicyFullyPaid ? 'text-emerald-700 font-black' : 'text-slate-700'}`}>
                                                            {isPolicyFullyPaid
                                                                ? tByLang('保費全部繳清', 'Paid Off', '払込完了')
                                                                : tByLang(
                                                                    `${effectivePremiumPaidCount.toLocaleString()}${premiumTermCap > 0 ? ` / ${premiumTermCap}` : ''} 期`,
                                                                    `${effectivePremiumPaidCount.toLocaleString()}${premiumTermCap > 0 ? ` / ${premiumTermCap}` : ''} terms`,
                                                                    `${effectivePremiumPaidCount.toLocaleString()}${premiumTermCap > 0 ? ` / ${premiumTermCap}` : ''}期`
                                                                )}
                                                        </div>
                                                        {hasDistributionBenefit && <div className="text-[10px] text-slate-400">{tByLang(`保單年度 ${currentPolicyYear || '--'} · 已派發 ${distributionPaidYears} 年`, `Policy Year ${currentPolicyYear || '--'} · Distributed ${distributionPaidYears} yrs`, `保険年度 ${currentPolicyYear || '--'} ・配当 ${distributionPaidYears} 年`)}</div>}
                                                        {annualDistributionAmount > 0 && <div className="text-[10px] text-indigo-600">{tByLang(`每年派發 ${formatAmount(annualDistributionAmount)} ${item.currency}`, `Annual Distribution ${formatAmount(annualDistributionAmount)} ${item.currency}`, `年間配当 ${formatAmount(annualDistributionAmount)} ${item.currency}`)}</div>}
                                                    </>
                                                ) : (
                                                    <div className="font-medium text-slate-400">--</div>
                                                )
                                            ) : isLinkedInsurance ? (
                                                <>
                                                    <div className="font-medium text-slate-700">{tByLang(`${effectivePremiumPaidCount.toLocaleString()} 期`, `${effectivePremiumPaidCount.toLocaleString()} terms`, `${effectivePremiumPaidCount.toLocaleString()}期`)}</div>
                                                    <div className="text-[10px] text-slate-400">{tByLang('現價', 'Price', '現価')} {formatAmount(item.currentPrice || 0)} · {tByLang('成本', 'Cost', '原価')} {formatAmount(item.costBasis || 0)} {item.currency}</div>
                                                </>
                                            ) : (
                                                <div className="font-medium text-slate-400">--</div>
                                            )
                                        ) : isLiquidCategory ? (
                                            <>
                                                <div className="font-medium text-slate-700">{formatAmount(mktValDisplay)} <span className="text-[9px]">{displayCurrency}</span></div>
                                                {cashflowAutoRulesByLiquidAssetId[item.id]?.length > 0 && (
                                                    <div className="text-[10px] text-indigo-500 font-black mt-1">
                                                        {tByLang(
                                                            `已綁定 ${cashflowAutoRulesByLiquidAssetId[item.id].length} 筆自動入帳/扣款規則`,
                                                            `Bound ${cashflowAutoRulesByLiquidAssetId[item.id].length} auto posting rules`,
                                                            `${cashflowAutoRulesByLiquidAssetId[item.id].length} 件の自動入出金ルールを連携済み`
                                                        )}
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
                                                    <div className="text-[10px] text-slate-400">{tByLang('保單生效日', 'Policy Effective Date', '保険開始日')}: {item.insuranceStartDate || '--'}</div>
                                                    {item.insuranceEndDate && <div className="text-[10px] text-slate-400">{tByLang('保單終止日', 'Policy End Date', '保険終了日')}: {item.insuranceEndDate}</div>}
                                                    {isLifeInsurance && hasDistributionBenefit && <div className="text-[10px] text-slate-400">{tByLang(`保單年度 ${currentPolicyYear || '--'} · 已派發 ${distributionPaidYears} 年`, `Policy Year ${currentPolicyYear || '--'} · Distributed ${distributionPaidYears} yrs`, `保険年度 ${currentPolicyYear || '--'} ・配当 ${distributionPaidYears} 年`)}</div>}
                                                </>
                                            ) : item.insuranceEndDate ? (
                                                <>
                                                    <div className="font-medium text-slate-700">{tByLang(
                                                        `${effectivePremiumPaidCount.toLocaleString()}${premiumTermCap > 0 ? ` / ${premiumTermCap}` : ` / ${(totalBillingPeriods ?? '--').toString()}`}期`,
                                                        `${effectivePremiumPaidCount.toLocaleString()}${premiumTermCap > 0 ? ` / ${premiumTermCap}` : ` / ${(totalBillingPeriods ?? '--').toString()}`} terms`,
                                                        `${effectivePremiumPaidCount.toLocaleString()}${premiumTermCap > 0 ? ` / ${premiumTermCap}` : ` / ${(totalBillingPeriods ?? '--').toString()}`}期`
                                                    )}</div>
                                                    <div className="text-[10px] text-slate-400">{tByLang('保單生效日', 'Policy Effective Date', '保険開始日')}: {item.insuranceStartDate || '--'}</div>
                                                    <div className="text-[10px] text-slate-400">{tByLang('保單終止日', 'Policy End Date', '保険終了日')}: {item.insuranceEndDate}</div>
                                                    {isLifeInsurance && hasDistributionBenefit && <div className="text-[10px] text-slate-400">{tByLang(`保單年度 ${currentPolicyYear || '--'} · 已派發 ${distributionPaidYears} 年`, `Policy Year ${currentPolicyYear || '--'} · Distributed ${distributionPaidYears} yrs`, `保険年度 ${currentPolicyYear || '--'} ・配当 ${distributionPaidYears} 年`)}</div>}
                                                </>
                                            ) : (
                                                <>
                                                    <div className="font-medium text-slate-700">{tByLang(`${effectivePremiumPaidCount.toLocaleString()} 期`, `${effectivePremiumPaidCount.toLocaleString()} terms`, `${effectivePremiumPaidCount.toLocaleString()}期`)}</div>
                                                    {isLifeInsurance && hasDistributionBenefit && <div className="text-[10px] text-slate-400">{tByLang(`保單年度 ${currentPolicyYear || '--'} · 已派發 ${distributionPaidYears} 年`, `Policy Year ${currentPolicyYear || '--'} · Distributed ${distributionPaidYears} yrs`, `保険年度 ${currentPolicyYear || '--'} ・配当 ${distributionPaidYears} 年`)}</div>}
                                                </>
                                            )}
                                        </td>
                                    )}
                                    {isInsuranceCategory && isInvestmentLinkedOnlyGroup && (
                                        <td className="px-6 py-4 text-right">
                                            {isInvestmentLinkedLifeSubtype ? (
                                                <>
                                                    <div className={`font-bold ${investmentAccountPnlDisplay >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                        {investmentAccountPnlDisplay >= 0 ? '+' : ''}{formatAmount(investmentAccountPnlDisplay)} {displayCurrency}
                                                    </div>
                                                    <div className={`text-[10px] ${investmentAccountPnlPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {investmentAccountPnlPercent >= 0 ? '+' : ''}{investmentAccountPnlPercent.toFixed(2)}%
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="font-bold text-slate-400">--</div>
                                            )}
                                        </td>
                                    )}
                                    {isInsuranceCategory && (
                                        <td className="px-6 py-4 text-right">
                                            {isHealthInsurance || isLifeInsurance ? (
                                                hasPremiumPlan ? (
                                                    isInvestmentLinkedLifeSubtype ? (
                                                        <>
                                                            <div className="font-bold text-emerald-700">{formatAmount(investmentAccountBalanceDisplay)} <span className="text-[9px] text-emerald-500">{displayCurrency}</span></div>
                                                            <div className="text-[10px] text-emerald-600">{fundBalanceByCurrencyText || '--'}</div>
                                                        </>
                                                    ) : (
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
                                                    )
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
                                            <div className={`font-bold ${profitOrig >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {profitOrig >= 0 ? '+' : ''}{formatAmount(profitOrig)} {item.currency}
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                                約 {formatAmount(profitDisplay)} {displayCurrency}
                                            </div>
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
                                {isInvestmentLinkedLifeSubtype && (
                                    <tr className="bg-indigo-50/20">
                                        <td colSpan={insuranceColumnCount} className="px-6 py-3">
                                            <InvestmentFundManagerSection
                                                item={item}
                                                investmentFundRows={investmentFundRows}
                                                tByLang={tByLang}
                                                formatAmount={formatAmount}
                                                onInsuranceFundRowFieldChange={onInsuranceFundRowFieldChange}
                                                onInsuranceFundAppendRowWithData={onInsuranceFundAppendRowWithData}
                                                onInsuranceFundRemoveRow={onInsuranceFundRemoveRow}
                                                onInsuranceFundMoveRow={onInsuranceFundMoveRow}
                                                onInsuranceFundDuplicateRow={onInsuranceFundDuplicateRow}
                                                onInsuranceFundClearRows={onInsuranceFundClearRows}
                                                toHKD={toHKD}
                                                fromHKD={fromHKD}
                                                displayCurrency={displayCurrency}
                                                fundCurrencyOptions={fundCurrencyOptions}
                                                liquidAssetLabelById={liquidAssetLabelById}
                                                chartPalette={chartPalette}
                                                accentColor={fundAccentColor}
                                                premiumTotalAmount={premiumTotalOrig}
                                                layout="desktop"
                                            />
                                        </td>
                                    </tr>
                                )}
                                </React.Fragment>
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
        CASHFLOW_FREQUENCIES,
        onInsuranceFundRowFieldChange,
        onInsuranceFundAppendRowWithData,
        onInsuranceFundRemoveRow,
        onInsuranceFundMoveRow,
        onInsuranceFundDuplicateRow,
        onInsuranceFundClearRows,
        fundCurrencyOptions,
        chartPalette,
        fundAccentColor,
        liquidAssetLabelById
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
                                                    onInsuranceFundRowFieldChange={onInsuranceFundRowFieldChange}
                                                    onInsuranceFundAppendRowWithData={onInsuranceFundAppendRowWithData}
                                                    onInsuranceFundRemoveRow={onInsuranceFundRemoveRow}
                                                    onInsuranceFundMoveRow={onInsuranceFundMoveRow}
                                                    onInsuranceFundDuplicateRow={onInsuranceFundDuplicateRow}
                                                    onInsuranceFundClearRows={onInsuranceFundClearRows}
                                                    fundCurrencyOptions={fundCurrencyOptions}
                                                    chartPalette={chartPalette}
                                                    fundAccentColor={fundAccentColor}
                                                    liquidAssetLabelById={liquidAssetLabelById}
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
                                                    onInsuranceFundRowFieldChange={onInsuranceFundRowFieldChange}
                                                    onInsuranceFundAppendRowWithData={onInsuranceFundAppendRowWithData}
                                                    onInsuranceFundRemoveRow={onInsuranceFundRemoveRow}
                                                    onInsuranceFundMoveRow={onInsuranceFundMoveRow}
                                                    onInsuranceFundDuplicateRow={onInsuranceFundDuplicateRow}
                                                    onInsuranceFundClearRows={onInsuranceFundClearRows}
                                                    fundCurrencyOptions={fundCurrencyOptions}
                                                    chartPalette={chartPalette}
                                                    fundAccentColor={fundAccentColor}
                                                    liquidAssetLabelById={liquidAssetLabelById}
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
