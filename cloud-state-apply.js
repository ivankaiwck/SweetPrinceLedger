(() => {
    const applyHydratedCloudSnapshot = ({
        hydrated,
        storageKeys,
        setAssets,
        setDisplayCurrency,
        setMonthlySnapshots,
        setCashflowEntries,
        setCashflowAppliedOccurrenceKeys,
        setCashflowAppliedPostings,
        setCashflowLastAutoApplyDate
    }) => {
        setAssets(hydrated.assets);
        setDisplayCurrency(hydrated.displayCurrency);
        setMonthlySnapshots(hydrated.monthlySnapshots);
        setCashflowEntries(hydrated.cashflowEntries);
        setCashflowAppliedOccurrenceKeys(hydrated.cashflowAppliedOccurrenceKeys);
        setCashflowAppliedPostings(hydrated.cashflowAppliedPostings);
        setCashflowLastAutoApplyDate(hydrated.cashflowLastAutoApplyDate);

        localStorage.setItem(storageKeys.assets, JSON.stringify(hydrated.assets));
        localStorage.setItem(storageKeys.displayCurrency, JSON.stringify(hydrated.displayCurrency));
        localStorage.setItem(storageKeys.monthlySnapshots, JSON.stringify(hydrated.monthlySnapshots));
        localStorage.setItem(storageKeys.cashflowEntries, JSON.stringify(hydrated.cashflowEntries));
        localStorage.setItem(storageKeys.cashflowAppliedOccurrenceKeys, JSON.stringify(hydrated.cashflowAppliedOccurrenceKeys));
        localStorage.setItem(storageKeys.cashflowAppliedPostings, JSON.stringify(hydrated.cashflowAppliedPostings));
        localStorage.setItem(storageKeys.cashflowLastAutoApplyDate, JSON.stringify(hydrated.cashflowLastAutoApplyDate));
    };

    window.APP_CLOUD_STATE_APPLY = {
        applyHydratedCloudSnapshot
    };
})();
