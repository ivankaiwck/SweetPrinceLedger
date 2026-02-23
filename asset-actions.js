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
        const baseCurrency = formData.currency || 'HKD';
        const resolvedName = isLiquidForm
            ? ((editingId && (formData.name || '').trim()) || `${baseCurrency} ${formData.subtype}`)
            : (formData.name || '').trim();
        const needsSymbol = isCryptoForm || isStockForm || isFundForm;

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
            const totalPremium = (Number(formData.premiumAmount) || 0) * (Number(formData.premiumPaidCount) || 0);
            quantity = 1;
            costBasis = totalPremium;
            currentPrice = totalPremium;
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
                ...formData,
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
        confirmDelete = confirm
    }) => {
        if (!confirmDelete('確定要刪除此資產嗎？')) {
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
