(() => {
    const AssetFilterBarView = ({
        setSelectedCategories,
        CATEGORY_KEYS,
        selectedCategories,
        buildCategoryChipStyle,
        getThemeTokenByTheme,
        tByLang,
        toggleCategory,
        categoryMixHexByKey,
        translate,
        CATEGORIES,
        sortMode,
        setSortMode,
        accumulationFilterMode,
        setAccumulationFilterMode,
        viewMode,
        setViewMode
    }) => (
        <div className="mb-6 space-y-2">
            <div className="flex md:flex-wrap items-center gap-2 overflow-x-auto -mx-2 px-2">
                <button
                    onClick={() => setSelectedCategories(CATEGORY_KEYS)}
                    className="category-filter-chip px-4 py-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap shrink-0"
                    data-active={selectedCategories.length === CATEGORY_KEYS.length ? 'true' : 'false'}
                    style={buildCategoryChipStyle(getThemeTokenByTheme('--primary', '#8B5CF6'), selectedCategories.length === CATEGORY_KEYS.length)}
                >
                    {tByLang('全部項目', 'All Items', 'すべての項目')}
                </button>
                {CATEGORY_KEYS.map(categoryKey => (
                    <button
                        key={categoryKey}
                        onClick={() => toggleCategory(categoryKey)}
                        className="category-filter-chip px-4 py-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap shrink-0"
                        data-active={selectedCategories.includes(categoryKey) ? 'true' : 'false'}
                        style={buildCategoryChipStyle(categoryMixHexByKey[categoryKey], selectedCategories.includes(categoryKey))}
                    >
                        <span>{translate(CATEGORIES[categoryKey].label)}</span>
                    </button>
                ))}
            </div>

            <div className="px-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                    value={sortMode}
                    onChange={e => setSortMode(e.target.value)}
                    className="theme-input rounded-lg px-3 py-1.5 font-bold text-xs shadow-sm outline-none w-full"
                >
                    <option value="AMOUNT_DESC">{tByLang('按金額排序（大到小）', 'Sort by Amount (High to Low)', '金額順（大→小）')}</option>
                    <option value="NAME_ASC">{tByLang('按名稱排序（A-Z）', 'Sort by Name (A-Z)', '名称順（A-Z）')}</option>
                    <option value="ACCUMULATION_DESC">{tByLang('按積存餘額排序（大到小）', 'Sort by Accumulation (High to Low)', '積立残高順（大→小）')}</option>
                </select>
                <select
                    value={accumulationFilterMode}
                    onChange={e => setAccumulationFilterMode(e.target.value)}
                    className="theme-input rounded-lg px-3 py-1.5 font-bold text-xs shadow-sm outline-none w-full"
                >
                    <option value="ALL">{tByLang('全部資產', 'All Assets', '全資産')}</option>
                    <option value="HAS_ACCUMULATION">{tByLang('只顯示有積存餘額', 'Accumulation Only', '積立残高ありのみ')}</option>
                </select>
                <select
                    value={viewMode}
                    onChange={e => setViewMode(e.target.value)}
                    className="theme-input rounded-lg px-3 py-1.5 font-bold text-xs shadow-sm outline-none w-full"
                >
                    <option value="DETAIL">{tByLang('詳細模式', 'Detail Mode', '詳細モード')}</option>
                    <option value="SUMMARY">{tByLang('匯總模式', 'Summary Mode', 'サマリーモード')}</option>
                </select>
            </div>
        </div>
    );

    window.APP_ASSET_FILTER_BAR_VIEW = {
        AssetFilterBarView
    };
})();
