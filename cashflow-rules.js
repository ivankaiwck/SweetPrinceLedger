(() => {
    const collectCashflowDeleteContext = ({ ruleId, cashflowEntries, cashflowAppliedPostings }) => {
        const targetRule = cashflowEntries.find(item => item.id === ruleId) || null;
        const targetPostingKeys = Object.keys(cashflowAppliedPostings).filter(key => cashflowAppliedPostings[key]?.entryId === ruleId);

        const rollbackByAsset = {};
        targetPostingKeys.forEach(postingKey => {
            const posting = cashflowAppliedPostings[postingKey];
            if (!posting) return;
            const assetId = posting.targetLiquidAssetId || 'UNKNOWN';
            const currency = posting.targetCurrency || '';
            const mapKey = `${assetId}::${currency}`;
            if (!rollbackByAsset[mapKey]) {
                rollbackByAsset[mapKey] = { assetId, currency, amount: 0 };
            }
            rollbackByAsset[mapKey].amount += Number(posting.signedAmount || 0);
        });

        return {
            targetRule,
            targetPostingKeys,
            rollbackByAsset: Object.values(rollbackByAsset)
        };
    };

    const rollbackCashflowPostingsOnLiquidAssets = ({ assets, cashflowAppliedPostings, targetPostingKeys }) => {
        const liquidAssetIndexMap = {};
        assets.forEach((asset, index) => {
            if (asset.category === 'LIQUID') liquidAssetIndexMap[asset.id] = index;
        });

        const nextAssets = [...assets];
        let revertedCount = 0;

        targetPostingKeys.forEach(postingKey => {
            const posting = cashflowAppliedPostings[postingKey];
            if (!posting) return;
            const targetIndex = liquidAssetIndexMap[posting.targetLiquidAssetId];
            if (!Number.isInteger(targetIndex)) return;
            const targetAsset = nextAssets[targetIndex];
            if (!targetAsset || targetAsset.category !== 'LIQUID') return;

            const rollbackQuantity = Number(targetAsset.quantity || 0) - Number(posting.signedAmount || 0);
            nextAssets[targetIndex] = {
                ...targetAsset,
                quantity: Number(rollbackQuantity.toFixed(6))
            };
            revertedCount += 1;
        });

        return { nextAssets, revertedCount };
    };

    window.APP_CASHFLOW_RULES = {
        collectCashflowDeleteContext,
        rollbackCashflowPostingsOnLiquidAssets
    };
})();
