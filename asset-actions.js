(() => {
    const buildAssetSubmission = ({
        formData,
        editingId,
        isLiquidForm,
        isCryptoForm,
        isStockForm,
        isFundForm,
        isFixedDepositForm,
        fixedDepositMetrics,
        needsPremium,
        isMortgageForm,
        mortgageMetrics,
        isLoanForm,
        loanMetrics,
        isCreditCardForm,
        isPayableForm,
        isOtherLiabilityForm,
        isReceivableForm,
        isFixedForm
    }) => {
        const INSURANCE_LIFE_WEALTH_SUBTYPES = ['定期壽險', '終身壽險', '年金險', '儲蓄險', '投資型壽險', '萬能壽險', '人壽/累積財富', '投資/投資相連'];
        const parseDateKeySafe = (value) => {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
            const [year, month, day] = value.split('-').map(Number);
            const parsed = new Date(year, month - 1, day);
            if (parsed.getFullYear() !== year || parsed.getMonth() !== (month - 1) || parsed.getDate() !== day) return null;
            return parsed;
        };

        const calculateAutoPremiumPaidCount = ({ startDateKey, paymentDay, frequency, endDateKey, fallbackCount }) => {
            const startDate = parseDateKeySafe(startDateKey);
            if (!startDate) return Number(fallbackCount) || 0;

            const endDate = parseDateKeySafe(endDateKey || '');
            const today = new Date();
            const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const upperBound = endDate && endDate.getTime() < todayOnly.getTime() ? endDate : todayOnly;
            if (upperBound.getTime() < startDate.getTime()) return 0;

            const normalizedDayRaw = Number(paymentDay);
            const normalizedDay = Number.isInteger(normalizedDayRaw) && normalizedDayRaw >= 1 && normalizedDayRaw <= 31
                ? normalizedDayRaw
                : startDate.getDate();
            const isYearly = String(frequency || '').toLowerCase() === 'yearly';

            let year = startDate.getFullYear();
            let month = startDate.getMonth();
            let day = Math.min(normalizedDay, new Date(year, month + 1, 0).getDate());
            let cursor = new Date(year, month, day);
            if (cursor.getTime() < startDate.getTime()) {
                if (isYearly) year += 1;
                else month += 1;
                day = Math.min(normalizedDay, new Date(year, month + 1, 0).getDate());
                cursor = new Date(year, month, day);
            }

            let count = 0;
            const maxCycles = isYearly ? 400 : 4800;
            for (let i = 0; i < maxCycles; i += 1) {
                if (cursor.getTime() > upperBound.getTime()) break;
                count += 1;
                year = cursor.getFullYear() + (isYearly ? 1 : 0);
                month = cursor.getMonth() + (isYearly ? 0 : 1);
                day = Math.min(normalizedDay, new Date(year, month + 1, 0).getDate());
                cursor = new Date(year, month, day);
            }
            if (upperBound.getTime() >= startDate.getTime()) return Math.max(1, count);
            return count;
        };

        const toDateKeySafe = (date) => {
            const pad2 = (value) => String(value).padStart(2, '0');
            return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
        };

        const calculatePremiumEndDateKey = ({ startDateKey, paymentDay, frequency, totalTerms }) => {
            const startDate = parseDateKeySafe(startDateKey);
            if (!startDate) return '';
            const terms = Number(totalTerms || 0);
            if (!Number.isInteger(terms) || terms <= 0) return '';

            const normalizedDayRaw = Number(paymentDay);
            const normalizedDay = Number.isInteger(normalizedDayRaw) && normalizedDayRaw >= 1 && normalizedDayRaw <= 31
                ? normalizedDayRaw
                : startDate.getDate();
            const isYearly = String(frequency || '').toLowerCase() === 'yearly';

            let year = startDate.getFullYear();
            let month = startDate.getMonth();
            let day = Math.min(normalizedDay, new Date(year, month + 1, 0).getDate());
            let cursor = new Date(year, month, day);
            if (cursor.getTime() < startDate.getTime()) {
                if (isYearly) year += 1;
                else month += 1;
                day = Math.min(normalizedDay, new Date(year, month + 1, 0).getDate());
                cursor = new Date(year, month, day);
            }

            for (let i = 1; i < terms; i += 1) {
                year = cursor.getFullYear() + (isYearly ? 1 : 0);
                month = cursor.getMonth() + (isYearly ? 0 : 1);
                day = Math.min(normalizedDay, new Date(year, month + 1, 0).getDate());
                cursor = new Date(year, month, day);
            }

            return toDateKeySafe(cursor);
        };

        const normalizeDistributionStartPolicyYear = ({ startDateKey, rawValue }) => {
            const parsedRaw = Number(rawValue || 0);
            if (!Number.isFinite(parsedRaw) || parsedRaw <= 0) return 0;
            const normalizedRaw = Math.floor(parsedRaw);
            if (normalizedRaw >= 1000) {
                const startDate = parseDateKeySafe(startDateKey || '');
                if (!startDate) return 0;
                return Math.max(1, normalizedRaw - startDate.getFullYear() + 1);
            }
            return normalizedRaw;
        };

        const baseCurrency = formData.currency || 'HKD';
        const resolvedName = isLiquidForm
            ? ((editingId && (formData.name || '').trim()) || `${baseCurrency} ${formData.subtype}`)
            : (formData.name || '').trim();
        const needsSymbol = isCryptoForm || isStockForm || isFundForm;
        const resolveInsurancePremiumAmount = ({ sourceData, isLifeWealthInsurance }) => {
            const basePremiumAmount = Number(sourceData.insuranceBasePremiumAmount || 0);
            const supplementaryPremiumAmount = Number(sourceData.insuranceSupplementaryPremiumAmount || 0);
            if (isLifeWealthInsurance && (basePremiumAmount > 0 || supplementaryPremiumAmount > 0)) {
                return basePremiumAmount + supplementaryPremiumAmount;
            }
            return Number(sourceData.premiumAmount || 0);
        };

        let quantity = parseFloat(formData.quantity || 0);
        let costBasis = parseFloat(formData.costBasis || 0);
        let currentPrice = editingId ? parseFloat(formData.currentPrice || formData.costBasis || 0) : costBasis;

        if (isLiquidForm) {
            quantity = parseFloat(formData.quantity || 0);
            costBasis = 1;
            currentPrice = 1;
        }

        let fixedDepositPayload = {};
        if (isFixedDepositForm) {
            if (!fixedDepositMetrics) {
                return { ok: false, error: '請輸入有效的定期存款資料（本金、年利率、期數）' };
            }
            quantity = 1;
            costBasis = fixedDepositMetrics.principal;
            currentPrice = fixedDepositMetrics.maturityAmount;
            fixedDepositPayload = {
                fixedDepositPrincipal: fixedDepositMetrics.principal,
                fixedDepositAnnualRate: fixedDepositMetrics.annualInterestRate,
                fixedDepositMonths: fixedDepositMetrics.months,
                fixedDepositStartDate: formData.fixedDepositStartDate || '',
                fixedDepositInterestAmount: fixedDepositMetrics.interestAmount,
                fixedDepositMaturityAmount: fixedDepositMetrics.maturityAmount
            };
        }

        if (needsPremium) {
            const isLifeWealthInsurance = INSURANCE_LIFE_WEALTH_SUBTYPES.includes(formData.subtype);
            const resolvedPremiumAmount = resolveInsurancePremiumAmount({
                sourceData: formData,
                isLifeWealthInsurance
            });
            const autoPremiumPaidCount = calculateAutoPremiumPaidCount({
                startDateKey: formData.insuranceStartDate,
                paymentDay: formData.insurancePaymentDay,
                frequency: formData.premiumFrequency,
                endDateKey: formData.insuranceEndDate,
                fallbackCount: formData.premiumPaidCount
            });
            const isYearlyPremium = String(formData.premiumFrequency || '').toLowerCase() === 'yearly';
            const premiumTermsPerYear = isYearlyPremium ? 1 : 12;
            const premiumPaymentYearsRaw = Number(formData.insurancePremiumPaymentYears || 0);
            const premiumPaymentYears = Number.isFinite(premiumPaymentYearsRaw) && premiumPaymentYearsRaw > 0
                ? Math.floor(premiumPaymentYearsRaw)
                : 0;
            const premiumTotalTerms = premiumPaymentYears > 0 ? premiumPaymentYears * premiumTermsPerYear : 0;
            const effectivePremiumPaidCount = premiumTotalTerms > 0
                ? Math.min(autoPremiumPaidCount, premiumTotalTerms)
                : autoPremiumPaidCount;
            const totalPremium = resolvedPremiumAmount * effectivePremiumPaidCount;

            quantity = 1;
            costBasis = totalPremium;

            const nextFormData = {
                ...formData,
                premiumAmount: resolvedPremiumAmount > 0 ? resolvedPremiumAmount : '',
                premiumPaidCount: effectivePremiumPaidCount,
                insurancePremiumTotalTerms: premiumTotalTerms > 0 ? premiumTotalTerms : ''
            };

            if (isLifeWealthInsurance) {
                const currentPolicyYear = effectivePremiumPaidCount > 0
                    ? (isYearlyPremium ? effectivePremiumPaidCount : (Math.floor((effectivePremiumPaidCount - 1) / 12) + 1))
                    : 0;
                const distributionStartYear = normalizeDistributionStartPolicyYear({
                    startDateKey: formData.insuranceStartDate,
                    rawValue: formData.insuranceDistributionStartPolicyYear
                });
                const annualDistributionAmount = Number(formData.insuranceAnnualDistributionAmount || 0);
                const distributionPaidYears = distributionStartYear > 0 && currentPolicyYear >= distributionStartYear
                    ? (currentPolicyYear - distributionStartYear + 1)
                    : 0;
                const totalDistributedAmount = annualDistributionAmount > 0
                    ? annualDistributionAmount * distributionPaidYears
                    : 0;

                const distributionMode = formData.insuranceDistributionMode === 'accumulate' ? 'accumulate' : 'cash';
                const accumulationRate = Number(formData.insuranceAccumulationRate || 0);
                const rate = Number.isFinite(accumulationRate) ? (accumulationRate / 100) : 0;
                let accumulationBalance = 0;
                if (distributionMode === 'accumulate' && annualDistributionAmount > 0 && distributionPaidYears > 0) {
                    for (let i = 0; i < distributionPaidYears; i += 1) {
                        const remainYears = distributionPaidYears - 1 - i;
                        accumulationBalance += annualDistributionAmount * Math.pow(1 + rate, Math.max(0, remainYears));
                    }
                }

                const guaranteedCashValue = Number(formData.insuranceGuaranteedCashValue || 0);
                const nonGuaranteedCashValue = Number(formData.insuranceNonGuaranteedCashValue || 0);
                const policyValueInput = Number(formData.insurancePolicyValue || 0);
                const policyValueByParts = guaranteedCashValue + nonGuaranteedCashValue;
                const resolvedPolicyValue = policyValueInput > 0
                    ? policyValueInput
                    : (policyValueByParts > 0 ? policyValueByParts : 0);

                currentPrice = resolvedPolicyValue > 0
                    ? (resolvedPolicyValue + (distributionMode === 'accumulate' ? accumulationBalance : 0))
                    : (totalPremium + (distributionMode === 'accumulate' ? accumulationBalance : 0));

                formData = {
                    ...nextFormData,
                    insuranceDistributionPaidYears: distributionPaidYears,
                    insuranceTotalDistributedAmount: totalDistributedAmount,
                    insuranceAccumulationBalance: distributionMode === 'accumulate' ? accumulationBalance : 0,
                    insurancePolicyValue: resolvedPolicyValue > 0 ? resolvedPolicyValue : '',
                    insurancePremiumPaymentYears: premiumPaymentYears > 0 ? premiumPaymentYears : '',
                    insuranceEndDate: premiumTotalTerms > 0
                        ? calculatePremiumEndDateKey({
                            startDateKey: formData.insuranceStartDate,
                            paymentDay: formData.insurancePaymentDay,
                            frequency: formData.premiumFrequency,
                            totalTerms: premiumTotalTerms
                        })
                        : (formData.insuranceEndDate || '')
                };
            } else {
                currentPrice = totalPremium;
                formData = nextFormData;
            }
        }

        let mortgagePayload = {};
        if (isMortgageForm) {
            if (!mortgageMetrics) {
                return { ok: false, error: '請輸入有效的房貸資料（樓價、按揭成數、年息、還款年限）' };
            }
            quantity = 1;
            costBasis = mortgageMetrics.loanAmount;
            currentPrice = mortgageMetrics.outstandingPrincipal;
            mortgagePayload = {
                propertyPrice: mortgageMetrics.propertyPrice,
                ltvRatio: mortgageMetrics.ltvRatio,
                annualInterestRate: mortgageMetrics.annualInterestRate,
                mortgageYears: mortgageMetrics.mortgageYears,
                paidPeriods: mortgageMetrics.paidPeriods,
                totalPeriods: mortgageMetrics.totalPeriods,
                remainingPeriods: mortgageMetrics.remainingPeriods,
                downPayment: mortgageMetrics.downPayment,
                loanAmount: mortgageMetrics.loanAmount,
                totalInterest: mortgageMetrics.totalInterest,
                monthlyPayment: mortgageMetrics.monthlyPayment,
                outstandingPrincipal: mortgageMetrics.outstandingPrincipal
            };
        }

        let loanPayload = {};
        if (isLoanForm) {
            if (!loanMetrics) {
                return { ok: false, error: '請輸入有效的貸款資料（貸款本金、年息、還款年限）' };
            }
            quantity = 1;
            costBasis = loanMetrics.loanPrincipal;
            currentPrice = loanMetrics.outstandingPrincipal;
            loanPayload = {
                loanPrincipal: loanMetrics.loanPrincipal,
                loanAnnualInterestRate: loanMetrics.annualInterestRate,
                loanYears: loanMetrics.loanYears,
                loanPaidPeriods: loanMetrics.paidPeriods,
                loanTotalPeriods: loanMetrics.totalPeriods,
                loanRemainingPeriods: loanMetrics.remainingPeriods,
                loanTotalInterest: loanMetrics.totalInterest,
                loanMonthlyPayment: loanMetrics.monthlyPayment,
                loanOutstandingPrincipal: loanMetrics.outstandingPrincipal
            };
        }

        let creditCardPayload = {};
        if (isCreditCardForm) {
            const balance = Number(formData.creditCardBalance) || 0;
            if (balance <= 0) {
                return { ok: false, error: '請輸入信用卡本期結欠' };
            }
            quantity = 1;
            costBasis = balance;
            currentPrice = balance;
            creditCardPayload = {
                creditCardBalance: balance,
                creditCardMinPayment: Number(formData.creditCardMinPayment) || 0,
                creditCardDueDate: formData.creditCardDueDate || '',
                creditCardAnnualRate: Number(formData.creditCardAnnualRate) || 0
            };
        }

        let payablePayload = {};
        if (isPayableForm) {
            const amount = Number(formData.payableAmount) || 0;
            if (amount <= 0) {
                return { ok: false, error: '請輸入應付款金額' };
            }
            quantity = 1;
            costBasis = amount;
            currentPrice = amount;
            payablePayload = {
                payableAmount: amount,
                payableDueDate: formData.payableDueDate || '',
                payableInstallments: Number(formData.payableInstallments) || 0
            };
        }

        let otherLiabilityPayload = {};
        if (isOtherLiabilityForm) {
            const outstanding = Number(formData.otherOutstanding) || 0;
            if (outstanding <= 0) {
                return { ok: false, error: '請輸入未償金額' };
            }
            quantity = 1;
            costBasis = outstanding;
            currentPrice = outstanding;
            otherLiabilityPayload = {
                otherOutstanding: outstanding,
                otherAnnualRate: Number(formData.otherAnnualRate) || 0,
                otherDueDate: formData.otherDueDate || ''
            };
        }

        let receivablePayload = {};
        if (isReceivableForm) {
            const amount = Number(formData.receivableAmount) || 0;
            if (amount <= 0) {
                return { ok: false, error: '請輸入應收金額' };
            }
            quantity = 1;
            costBasis = amount;
            currentPrice = amount;
            receivablePayload = {
                receivableAmount: amount,
                receivableDueDate: formData.receivableDueDate || '',
                receivableInstallments: Number(formData.receivableInstallments) || 0,
                receivableParty: (formData.receivableParty || '').trim()
            };
        }

        let fixedPayload = {};
        if (isFixedForm) {
            const purchasePrice = Number(formData.fixedPurchasePrice) || 0;
            const currentValue = Number(formData.fixedCurrentValue) || 0;
            if (purchasePrice <= 0 || currentValue <= 0) {
                return { ok: false, error: '請輸入固定資產的購入成本與目前估值' };
            }
            quantity = 1;
            costBasis = purchasePrice;
            currentPrice = currentValue;
            fixedPayload = {
                fixedPurchasePrice: purchasePrice,
                fixedCurrentValue: currentValue,
                fixedPurchaseDate: formData.fixedPurchaseDate || '',
                fixedNote: (formData.fixedNote || '').trim()
            };
        }

        return {
            ok: true,
            data: {
                ...(() => {
                    const {
                        insurancePartialWithdrawalAmount,
                        insurancePartialWithdrawalDate,
                        insurancePartialWithdrawalAccountId,
                        insurancePartialWithdrawalNote,
                        insurancePartialWithdrawalEditCashflowId,
                        ...persistedFormData
                    } = formData;
                    return persistedFormData;
                })(),
                name: resolvedName,
                symbol: needsSymbol ? (formData.symbol || '').toUpperCase().trim() : '',
                quantity,
                costBasis,
                currentPrice,
                currency: baseCurrency,
                ...fixedDepositPayload,
                ...mortgagePayload,
                ...loanPayload,
                ...creditCardPayload,
                ...payablePayload,
                ...otherLiabilityPayload,
                ...receivablePayload,
                ...fixedPayload
            }
        };
    };

    const buildAssetDeleteResult = ({
        assets,
        id,
        confirmMessage,
        confirmDelete = confirm
    }) => {
        const message = typeof confirmMessage === 'string' && confirmMessage.trim()
            ? confirmMessage
            : '確定要刪除此資產嗎？';
        if (!confirmDelete(message)) {
            return {
                ok: false,
                nextAssets: assets
            };
        }

        return {
            ok: true,
            nextAssets: assets.filter(item => item.id !== id)
        };
    };

    window.APP_ASSET_ACTIONS = {
        buildAssetSubmission,
        buildAssetDeleteResult
    };
})();
