(() => {
    const {
        toDateKey,
        isEntryOnDate
    } = window.APP_UTILS || {};

    if (!toDateKey || !isEntryOnDate) {
        throw new Error('utils.js is missing or incomplete for cashflow-engine.js');
    }

    const buildCashflowMonthData = ({ cashflowEntries, selectedCashflowDate, displayCurrency, toHKD, fromHKD }) => {
        const year = selectedCashflowDate.getFullYear();
        const month = selectedCashflowDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dayRows = [];

        let monthIncomeHKD = 0;
        let monthExpenseHKD = 0;

        for (let day = 1; day <= daysInMonth; day += 1) {
            const date = new Date(year, month, day);
            const dateKey = toDateKey(date);
            const rows = [];
            let incomeHKD = 0;
            let expenseHKD = 0;

            cashflowEntries.forEach(entry => {
                if (!isEntryOnDate(entry, date)) return;
                const amountHKD = toHKD(entry.amount, entry.currency);
                if (entry.type === 'INCOME') incomeHKD += amountHKD;
                else expenseHKD += amountHKD;

                rows.push({
                    id: `${entry.id}-${dateKey}`,
                    title: entry.title,
                    account: entry.account,
                    type: entry.type,
                    amountDisplay: fromHKD(amountHKD, displayCurrency),
                    currency: displayCurrency,
                    category: entry.category
                });
            });

            monthIncomeHKD += incomeHKD;
            monthExpenseHKD += expenseHKD;

            dayRows.push({
                dateKey,
                day,
                incomeDisplay: fromHKD(incomeHKD, displayCurrency),
                expenseDisplay: fromHKD(expenseHKD, displayCurrency),
                netDisplay: fromHKD(incomeHKD - expenseHKD, displayCurrency),
                entries: rows.sort((a, b) => b.amountDisplay - a.amountDisplay)
            });
        }

        return {
            year,
            month,
            firstDay,
            dayRows,
            monthIncomeDisplay: fromHKD(monthIncomeHKD, displayCurrency),
            monthExpenseDisplay: fromHKD(monthExpenseHKD, displayCurrency),
            monthNetDisplay: fromHKD(monthIncomeHKD - monthExpenseHKD, displayCurrency)
        };
    };

    const buildCashflowYearData = ({ cashflowEntries, selectedCashflowDate, displayCurrency, toHKD, fromHKD }) => {
        const year = selectedCashflowDate.getFullYear();
        const months = [];
        let yearIncomeHKD = 0;
        let yearExpenseHKD = 0;

        for (let month = 0; month < 12; month += 1) {
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            let incomeHKD = 0;
            let expenseHKD = 0;

            for (let day = 1; day <= daysInMonth; day += 1) {
                const date = new Date(year, month, day);
                cashflowEntries.forEach(entry => {
                    if (!isEntryOnDate(entry, date)) return;
                    const amountHKD = toHKD(entry.amount, entry.currency);
                    if (entry.type === 'INCOME') incomeHKD += amountHKD;
                    else expenseHKD += amountHKD;
                });
            }

            yearIncomeHKD += incomeHKD;
            yearExpenseHKD += expenseHKD;

            months.push({
                month,
                label: `${month + 1} 月`,
                incomeDisplay: fromHKD(incomeHKD, displayCurrency),
                expenseDisplay: fromHKD(expenseHKD, displayCurrency),
                netDisplay: fromHKD(incomeHKD - expenseHKD, displayCurrency)
            });
        }

        return {
            year,
            months,
            yearIncomeDisplay: fromHKD(yearIncomeHKD, displayCurrency),
            yearExpenseDisplay: fromHKD(yearExpenseHKD, displayCurrency),
            yearNetDisplay: fromHKD(yearIncomeHKD - yearExpenseHKD, displayCurrency)
        };
    };

    window.APP_CASHFLOW_ENGINE = {
        buildCashflowMonthData,
        buildCashflowYearData
    };
})();
