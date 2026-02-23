(() => {
    const buildCashflowSubmission = ({
        cashflowForm,
        editingCashflowId,
        liquidAssetOptions,
        parseDateKey,
        getDefaultCashflowCategory,
        tByLang
    }) => {
        const t = typeof tByLang === 'function' ? tByLang : ((zh) => zh);
        const title = (cashflowForm.title || '').trim();
        const selectedLiquidAsset = liquidAssetOptions.find(option => option.id === cashflowForm.targetLiquidAssetId) || null;
        const account = selectedLiquidAsset?.account || (cashflowForm.account || '').trim();
        const resolvedCategory = (cashflowForm.category || '').trim();
        const category = resolvedCategory || getDefaultCashflowCategory(cashflowForm.type);
        const note = (cashflowForm.note || '').trim();
        const amount = Number(cashflowForm.amount);
        const startDate = cashflowForm.startDate;
        const endDate = cashflowForm.endDate;
        const scheduleType = cashflowForm.scheduleType || 'RECURRING';
        const frequency = scheduleType === 'ONE_TIME' ? 'ONE_TIME' : cashflowForm.frequency;
        const normalizeDateList = (rawList) => {
            const unique = new Set();
            (Array.isArray(rawList) ? rawList : []).forEach(item => {
                const raw = typeof item === 'string' ? item : '';
                const parsed = parseDateKey(raw);
                if (!parsed) return;
                unique.add(raw);
            });
            return Array.from(unique).sort();
        };

        if (!title) {
            return { ok: false, error: t('請輸入現金流名稱', 'Please enter a cashflow title', 'キャッシュフロー名を入力してください') };
        }
        if (!Number.isFinite(amount) || amount <= 0) {
            return { ok: false, error: t('請輸入有效金額', 'Please enter a valid amount', '有効な金額を入力してください') };
        }

        const oneTimeDates = scheduleType === 'ONE_TIME'
            ? normalizeDateList(cashflowForm.oneTimeDates || [])
            : [];

        if (scheduleType === 'ONE_TIME' && oneTimeDates.length === 0) {
            return { ok: false, error: t('請至少加入一個單次日期', 'Please add at least one one-time date', '単発日を1つ以上追加してください') };
        }

        const resolvedStartDate = scheduleType === 'ONE_TIME' ? oneTimeDates[0] : startDate;
        const parsedStart = parseDateKey(resolvedStartDate);
        if (!parsedStart) {
            return { ok: false, error: t('請輸入有效的開始日期', 'Please enter a valid start date', '有効な開始日を入力してください') };
        }

        const parsedEnd = endDate ? parseDateKey(endDate) : null;
        if (scheduleType === 'RECURRING' && endDate && (!parsedEnd || parsedEnd.getTime() < parsedStart.getTime())) {
            return { ok: false, error: t('結束日期不可早於開始日期', 'End date cannot be earlier than start date', '終了日は開始日より前にできません') };
        }

        let weekday = parsedStart.getDay();
        let monthday = parsedStart.getDate();
        let payday = Number(cashflowForm.payday || parsedStart.getDate());

        if (scheduleType === 'RECURRING' && frequency === 'WEEKLY') {
            weekday = parsedStart.getDay();
        }

        if (scheduleType === 'RECURRING' && frequency === 'MONTHLY') {
            if (!Number.isInteger(payday) || payday < 1 || payday > 31) {
                return { ok: false, error: t('請輸入有效每月記錄日（1-31）', 'Please enter a valid monthly day (1-31)', '有効な毎月記録日（1〜31）を入力してください') };
            }
            monthday = payday;
        }

        const nextEntry = {
            id: editingCashflowId || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            title,
            account,
            category,
            note,
            type: cashflowForm.type,
            amount,
            currency: cashflowForm.currency,
            scheduleType,
            frequency,
            startDate: resolvedStartDate,
            oneTimeDates,
            endDate: scheduleType === 'ONE_TIME' ? '' : (endDate || ''),
            weekday,
            monthday,
            payday: scheduleType === 'RECURRING' && frequency === 'MONTHLY' ? payday : parsedStart.getDate(),
            targetLiquidAssetId: selectedLiquidAsset?.id || ''
        };

        return {
            ok: true,
            amount,
            nextEntry,
            isEditing: Boolean(editingCashflowId),
            selectedLiquidAsset
        };
    };

    const buildCashflowSubmitStatus = ({
        isEditing,
        selectedLiquidAsset,
        nextEntry,
        amount,
        cashflowCurrency,
        toHKD,
        fromHKD,
        formatAmount,
        isEntryOnDate,
        tByLang
    }) => {
        const t = typeof tByLang === 'function' ? tByLang : ((zh) => zh);
        if (selectedLiquidAsset && !isEditing) {
            const amountHKD = toHKD(amount, cashflowCurrency);
            const amountInTargetCurrency = fromHKD(amountHKD, selectedLiquidAsset.currency);
            const direction = nextEntry.type === 'INCOME'
                ? t('入帳', 'deposit', '入金')
                : t('扣款', 'withdraw', '出金');
            const todayDate = new Date();
            const willApplyToday = isEntryOnDate(nextEntry, todayDate);
            const whenText = willApplyToday
                ? t('今天', 'today', '今日')
                : (nextEntry.scheduleType === 'ONE_TIME'
                    ? t('所選日期', 'selected dates', '選択日')
                    : t('符合規則日期', 'matching schedule dates', 'ルール該当日'));
            return t(
                `規則已新增（預覽）：${whenText}將${direction}至「${selectedLiquidAsset.label}」${formatAmount(amountInTargetCurrency)} ${selectedLiquidAsset.currency}`,
                `Rule added (preview): on ${whenText}, it will ${direction} to "${selectedLiquidAsset.label}" ${formatAmount(amountInTargetCurrency)} ${selectedLiquidAsset.currency}`,
                `ルールを追加しました（プレビュー）：${whenText}に「${selectedLiquidAsset.label}」へ${formatAmount(amountInTargetCurrency)} ${selectedLiquidAsset.currency} を${direction}します`
            );
        }

        if (!isEditing) {
            return t(
                '規則已新增（預覽）：目前僅記錄現金流，不會自動入帳/扣款',
                'Rule added (preview): cashflow will be recorded only, no auto posting yet',
                'ルールを追加しました（プレビュー）：現金流のみ記録し、自動入出金は行いません'
            );
        }

        return t('規則已更新', 'Rule updated', 'ルールを更新しました');
    };

    const buildCashflowFormFromEntry = ({
        entry,
        getDefaultCashflowCategory,
        toDateKey,
        parseDateKey
    }) => ({
        oneTimeDates: (() => {
            const unique = new Set();
            const push = (value) => {
                const raw = typeof value === 'string' ? value : '';
                const parsed = parseDateKey(raw);
                if (!parsed) return;
                unique.add(raw);
            };
            (entry?.oneTimeDates || []).forEach(push);
            if ((entry?.scheduleType || (entry?.frequency === 'ONE_TIME' ? 'ONE_TIME' : 'RECURRING')) === 'ONE_TIME') {
                push(entry?.startDate);
            }
            return Array.from(unique).sort();
        })(),
        title: entry?.title || '',
        account: entry?.account || '',
        category: entry?.category || getDefaultCashflowCategory(entry?.type || 'EXPENSE'),
        type: entry?.type || 'EXPENSE',
        scheduleType: entry?.scheduleType || (entry?.frequency === 'ONE_TIME' ? 'ONE_TIME' : 'RECURRING'),
        amount: String(Number(entry?.amount || 0)),
        currency: entry?.currency || 'HKD',
        frequency: entry?.frequency === 'ONE_TIME' ? 'MONTHLY' : (entry?.frequency || 'MONTHLY'),
        startDate: entry?.startDate || toDateKey(new Date()),
        endDate: entry?.endDate || '',
        payday: String(entry?.payday || entry?.monthday || 1),
        targetLiquidAssetId: entry?.targetLiquidAssetId || '',
        note: entry?.note || ''
    });

    window.APP_CASHFLOW_FORM = {
        buildCashflowSubmission,
        buildCashflowSubmitStatus,
        buildCashflowFormFromEntry
    };
})();
