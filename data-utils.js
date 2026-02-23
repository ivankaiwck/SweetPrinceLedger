(() => {
    const {
        CATEGORIES,
        CURRENCIES,
        CASHFLOW_TYPES,
        CASHFLOW_SCHEDULE_TYPES,
        CASHFLOW_FREQUENCIES
    } = window.APP_CONSTANTS || {};

    const {
        parseDateKey,
        sanitizeCashflowEntries,
        normalizeDateKeyOrFallback
    } = window.APP_UTILS || {};

    if (!CATEGORIES || !CURRENCIES || !CASHFLOW_TYPES || !CASHFLOW_SCHEDULE_TYPES || !CASHFLOW_FREQUENCIES || !parseDateKey || !sanitizeCashflowEntries || !normalizeDateKeyOrFallback) {
        throw new Error('constants.js or utils.js is missing or incomplete for data-utils.js');
    }

    const normalizeAssetRecord = (item) => ({
        ...item,
        quantity: Number(item.quantity),
        costBasis: Number(item.costBasis),
        currentPrice: Number(item.currentPrice),
        symbol: (item.symbol || '').toString().toUpperCase().trim()
    });

    const isValidAssetRecord = (item) => {
        if (!item || typeof item !== 'object') return false;
        const hasCategory = typeof item.category === 'string' && CATEGORIES[item.category];
        const hasSubtype = typeof item.subtype === 'string';
        const hasCurrency = typeof item.currency === 'string' && CURRENCIES.includes(item.currency);
        const quantity = Number(item.quantity);
        const costBasis = Number(item.costBasis);
        const currentPrice = Number(item.currentPrice);
        return Boolean(
            typeof item.id === 'string' && item.id &&
            typeof item.account === 'string' &&
            typeof item.name === 'string' &&
            hasCategory &&
            hasSubtype &&
            hasCurrency &&
            Number.isFinite(quantity) &&
            Number.isFinite(costBasis) &&
            Number.isFinite(currentPrice)
        );
    };

    const isValidCashflowRecord = (item) => {
        if (!item || typeof item !== 'object') return false;
        const amount = Number(item.amount);
        const startDate = parseDateKey(item.startDate || '');
        const typeValid = Object.keys(CASHFLOW_TYPES).includes(item.type);
        const scheduleType = item.scheduleType || (item.frequency === 'ONE_TIME' ? 'ONE_TIME' : 'RECURRING');
        const scheduleValid = CASHFLOW_SCHEDULE_TYPES.some(entry => entry.value === scheduleType);
        const freqValid = item.frequency === 'ONE_TIME' || CASHFLOW_FREQUENCIES.some(entry => entry.value === item.frequency);
        return Boolean(
            typeof item.id === 'string' && item.id &&
            typeof item.title === 'string' && item.title.trim() &&
            CURRENCIES.includes(item.currency) &&
            typeValid &&
            scheduleValid &&
            freqValid &&
            startDate &&
            Number.isFinite(amount) &&
            amount > 0
        );
    };

    const buildBackupPayload = ({
        assets,
        displayCurrency,
        monthlySnapshots,
        cashflowEntries,
        cashflowAppliedOccurrenceKeys,
        cashflowAppliedPostings,
        cashflowLastAutoApplyDate
    }) => ({
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
            assets,
            displayCurrency,
            monthlySnapshots,
            cashflowEntries,
            cashflowAppliedOccurrenceKeys,
            cashflowAppliedPostings,
            cashflowLastAutoApplyDate
        }
    });

    const downloadJsonFile = (payload, fileName) => {
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
    };

    const parseImportedBackup = (parsed, fallbackDate) => {
        const imported = parsed?.data || parsed;
        const nextAssets = Array.isArray(imported?.assets) ? imported.assets : null;
        const nextDisplayCurrency = typeof imported?.displayCurrency === 'string' ? imported.displayCurrency : null;
        const nextMonthlySnapshots = imported?.monthlySnapshots && typeof imported.monthlySnapshots === 'object'
            ? imported.monthlySnapshots
            : null;
        const nextCashflowEntries = Array.isArray(imported?.cashflowEntries)
            ? sanitizeCashflowEntries(imported.cashflowEntries)
            : [];
        const nextCashflowAppliedOccurrenceKeys = Array.isArray(imported?.cashflowAppliedOccurrenceKeys)
            ? imported.cashflowAppliedOccurrenceKeys.filter(item => typeof item === 'string')
            : [];
        const nextCashflowAppliedPostings = imported?.cashflowAppliedPostings && typeof imported.cashflowAppliedPostings === 'object' && !Array.isArray(imported.cashflowAppliedPostings)
            ? imported.cashflowAppliedPostings
            : {};
        const nextCashflowLastAutoApplyDate = normalizeDateKeyOrFallback(
            imported?.cashflowLastAutoApplyDate,
            fallbackDate
        );

        const safeSnapshots = nextMonthlySnapshots && !Array.isArray(nextMonthlySnapshots) ? nextMonthlySnapshots : {};

        return {
            nextAssets,
            nextDisplayCurrency,
            safeSnapshots,
            nextCashflowEntries,
            nextCashflowAppliedOccurrenceKeys,
            nextCashflowAppliedPostings,
            nextCashflowLastAutoApplyDate
        };
    };

    window.APP_DATA_UTILS = {
        normalizeAssetRecord,
        isValidAssetRecord,
        isValidCashflowRecord,
        buildBackupPayload,
        downloadJsonFile,
        parseImportedBackup
    };
})();
