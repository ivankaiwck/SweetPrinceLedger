(() => {
    const {
        AppHeaderStatusView
    } = window.APP_HEADER_STATUS_VIEW || {};
    if (!AppHeaderStatusView) {
        throw new Error('app-header-status-view.js is missing or incomplete.');
    }

    const AppHeaderView = ({
        pageText,
        tByLang,
        appName,
        currentHeaderSlogan,
        importInputRef,
        handleImportData,
        setEditingId,
        setIsModalOpen,
        startNewCashflowEntry,
        showSettings,
        setShowSettings,
        authUser,
        handleGoogleLogout,
        handleGoogleLogin,
        isAuthLoading,
        isCloudSyncing,
        handleCloudDownload,
        handleCloudUpload,
        displayCurrency,
        setDisplayCurrency,
        markRecentCurrency,
        orderedCurrencies,
        pageLanguage,
        setPageLanguage,
        PAGE_LANGUAGE_OPTIONS,
        themeId,
        setThemeId,
        themeOptions,
        handleExportData,
        openImportPicker,
        resetToSeed,
        updateMarketAndRates,
        isUpdatingPrice,
        isUpdatingRates,
        handleShareApp,
        isGeneratingPdf,
        priceStatus,
        lastPriceUpdate,
        lastRateUpdate,
        cloudStatus,
        formatDateTime
    }) => (
        <>
            <header className="mb-6">
                <div className="theme-header-card rounded-2xl p-4 md:p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="theme-crown w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm">
                            <i data-lucide="crown" className="w-6 h-6"></i>
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="theme-text-main text-2xl font-black tracking-tight">{appName}</h1>
                            <p className="theme-text-sub text-xs font-bold mt-1">{pageText.subtitle}</p>
                        </div>
                    </div>

                    <div className="theme-subcard mt-3 rounded-xl px-3 py-3 flex items-center gap-3">
                        <div className="theme-crown w-9 h-9 rounded-xl flex items-center justify-center text-lg prince-float">🤴</div>
                        <div className="min-w-0">
                            <div className="theme-text-sub text-xs font-black prince-talk">{currentHeaderSlogan}</div>
                        </div>
                    </div>

                    <input
                        ref={importInputRef}
                        type="file"
                        accept="application/json,.json"
                        className="hidden"
                        onChange={handleImportData}
                    />
                    <div className="mt-4 pt-3 border-t border-white/70 flex flex-wrap items-center gap-2">
                        <button onClick={() => { setEditingId(null); setIsModalOpen(true); }} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-800 transition-all shadow-md flex items-center gap-2">
                            <i data-lucide="plus-circle" className="w-4 h-4"></i> {pageText.addAsset}
                        </button>
                        <button
                            onClick={startNewCashflowEntry}
                            className="theme-btn-accent text-white px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-md flex items-center gap-2"
                        >
                            <i data-lucide="plus-circle" className="w-4 h-4"></i>
                            {tByLang('新增現金流', 'Add Cashflow', 'キャッシュフローを追加')}
                        </button>

                        <div className="relative ml-auto">
                            <button
                                type="button"
                                onClick={() => setShowSettings(prev => !prev)}
                                className="bg-white border border-slate-200 rounded-lg px-3 py-2 font-black text-sm shadow-sm flex items-center gap-2"
                            >
                                <i data-lucide="settings" className="w-4 h-4"></i>
                                {pageText.advanced}
                            </button>
                            {showSettings && (
                                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-100 rounded-xl shadow-lg p-3 space-y-2 z-20">
                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{pageText.cloudAccount}</div>
                                    <div className="text-xs font-bold text-slate-600 bg-slate-50 rounded-lg px-2 py-1">
                                        {authUser ? (authUser.email || '已登入 Google') : '未登入 Google'}
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (authUser) handleGoogleLogout();
                                            else handleGoogleLogin();
                                            setShowSettings(false);
                                        }}
                                        disabled={isAuthLoading || isCloudSyncing}
                                        className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-60"
                                    >
                                        {isAuthLoading ? pageText.loginLoading : authUser ? pageText.logout : pageText.login}
                                    </button>
                                    <button
                                        onClick={() => { handleCloudDownload(); setShowSettings(false); }}
                                        disabled={!authUser || isAuthLoading || isCloudSyncing}
                                        className="theme-btn-accent w-full text-white px-4 py-2 rounded-lg font-bold text-sm transition-all disabled:opacity-60"
                                    >
                                        {isCloudSyncing
                                            ? tByLang('同步中...', 'Syncing...', '同期中...')
                                            : tByLang('下載雲端資料', 'Download Cloud Data', 'クラウドデータをダウンロード')}
                                    </button>
                                    <button
                                        onClick={() => { handleCloudUpload(); setShowSettings(false); }}
                                        disabled={!authUser || isAuthLoading || isCloudSyncing}
                                        className="theme-btn-accent w-full text-white px-4 py-2 rounded-lg font-bold text-sm transition-all disabled:opacity-60"
                                    >
                                        {isCloudSyncing
                                            ? tByLang('同步中...', 'Syncing...', '同期中...')
                                            : tByLang('上載本機資料', 'Upload Local Data', 'ローカルデータをアップロード')}
                                    </button>
                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{pageText.displayCurrency}</div>
                                    <select
                                        value={displayCurrency}
                                        onChange={e => {
                                            const next = e.target.value;
                                            setDisplayCurrency(next);
                                            markRecentCurrency(next);
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 font-bold text-sm shadow-sm outline-none"
                                    >
                                        {orderedCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{pageText.pageLanguage}</div>
                                    <select
                                        value={pageLanguage}
                                        onChange={e => setPageLanguage(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 font-bold text-sm shadow-sm outline-none"
                                    >
                                        {PAGE_LANGUAGE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                                    </select>
                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{pageText.theme}</div>
                                    <select
                                        value={themeId}
                                        onChange={e => setThemeId(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 font-bold text-sm shadow-sm outline-none"
                                    >
                                        {themeOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                                    </select>
                                    <button
                                        onClick={() => { handleExportData(); setShowSettings(false); }}
                                        className="theme-btn-gold w-full text-white px-4 py-2 rounded-lg font-bold text-sm transition-all"
                                    >
                                        {pageText.exportData}
                                    </button>
                                    <button
                                        onClick={() => { openImportPicker(); setShowSettings(false); }}
                                        className="w-full theme-tab-inactive px-4 py-2 rounded-lg font-bold text-sm transition-all"
                                    >
                                        {pageText.importData}
                                    </button>
                                    <button
                                        onClick={() => { resetToSeed(); setShowSettings(false); }}
                                        title={tByLang('可愛重設：清空目前資料並回到範例帳本', 'Cute reset: clear current data and restore sample ledger', 'かわいくリセット：現在のデータを消去してサンプル台帳に戻します')}
                                        className="theme-btn-danger w-full text-white px-4 py-2 rounded-lg font-bold text-sm transition-all"
                                    >
                                        {pageText.resetData}
                                    </button>
                                    <button
                                        onClick={() => { updateMarketAndRates({ updateMarket: true, updateRates: true, showToast: true }); setShowSettings(false); }}
                                        disabled={isUpdatingPrice || isUpdatingRates}
                                        className="theme-btn-accent w-full text-white px-4 py-2 rounded-lg font-bold text-sm transition-all disabled:opacity-60"
                                    >
                                        {(isUpdatingPrice || isUpdatingRates)
                                            ? pageText.updating
                                            : tByLang('更新行情與匯率', 'Update Prices & FX', '相場と為替を更新')}
                                    </button>
                                    <button
                                        onClick={() => { handleShareApp(); setShowSettings(false); }}
                                        disabled={isGeneratingPdf}
                                        className="w-full theme-btn-primary text-white px-4 py-2 rounded-lg font-bold text-sm transition-all disabled:opacity-60"
                                    >
                                        {isGeneratingPdf ? pageText.generatingPdf : pageText.sharePdf}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <AppHeaderStatusView
                priceStatus={priceStatus}
                pageText={pageText}
                lastPriceUpdate={lastPriceUpdate}
                formatDateTime={formatDateTime}
                lastRateUpdate={lastRateUpdate}
                isCloudSyncing={isCloudSyncing}
                cloudStatus={cloudStatus}
            />
        </>
    );

    window.APP_HEADER_VIEW = {
        AppHeaderView
    };
})();
