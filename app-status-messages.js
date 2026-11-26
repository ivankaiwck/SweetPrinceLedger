(() => {
    const tByLang = (lang, zh, en, ja) => (lang === 'en-US' ? en : (lang === 'ja-JP' ? ja : zh));

    const getPrinceHintMessage = ({
        pageLanguage,
        isGeneratingPdf,
        isUpdatingPrice,
        isUpdatingRates,
        isCloudSyncing,
        isModalOpen,
        isCashflowModalOpen,
        editingCashflowId,
        showSettings,
        financeSectionTab,
        priceStatus,
        currentIdleHint
    }) => {
        if (isGeneratingPdf) {
            return tByLang(
                pageLanguage,
                '📜 王子正在整理你的 PDF 報表，請稍候～',
                '📜 The Prince is preparing your PDF report...',
                '📜 王子がPDFレポートを作成中です…'
            );
        }
        if (isUpdatingPrice) {
            return tByLang(
                pageLanguage,
                '📈 王子正在召喚最新股價與幣價。',
                '📈 Fetching latest market prices.',
                '📈 最新の価格を取得中です。'
            );
        }
        if (isUpdatingRates) {
            return tByLang(
                pageLanguage,
                '💱 王子正在更新匯率魔法。',
                '💱 Updating exchange rates.',
                '💱 為替レートを更新中です。'
            );
        }
        if (isCloudSyncing) {
            return tByLang(
                pageLanguage,
                '☁️ 王子正在把資料同步到雲端。',
                '☁️ Syncing data to cloud now.',
                '☁️ クラウドへ同期中です。'
            );
        }
        if (isModalOpen) {
            return tByLang(
                pageLanguage,
                '📝 在表單填好資料後按「儲存資產」就完成囉！',
                '📝 Fill the form and save the asset.',
                '📝 フォーム入力後に保存してください。'
            );
        }
        if (isCashflowModalOpen) {
            return tByLang(
                pageLanguage,
                '🧾 在彈窗新增或編輯現金流規則。',
                '🧾 Add or edit a cashflow rule in the modal.',
                '🧾 モーダルでキャッシュフロールールを追加/編集します。'
            );
        }
        if (editingCashflowId) {
            return tByLang(
                pageLanguage,
                '🔧 你正在編輯規則，記得確認儲存。',
                '🔧 You are editing a rule. Remember to save.',
                '🔧 ルール編集中です。保存を忘れずに。'
            );
        }
        if (showSettings) {
            return tByLang(
                pageLanguage,
                '⚙️ 設定選單已開啟，可匯入匯出與更新資料。',
                '⚙️ Settings opened. You can import/export and update data.',
                '⚙️ 設定を開きました。インポート/エクスポート可能です。'
            );
        }
        if (financeSectionTab === 'CASHFLOW') {
            return tByLang(
                pageLanguage,
                '📅 在現金流分頁可設定固定規則與自動入帳。',
                '📅 Use cashflow rules for auto posting.',
                '📅 固定ルールで自動記帳できます。'
            );
        }
        if (priceStatus) return `📣 ${priceStatus}`;
        return currentIdleHint;
    };

    const getPdfGeneratingBusyMessage = (pageLanguage) => tByLang(
        pageLanguage,
        'PDF 仍在產生中，請稍候...',
        'PDF is still generating. Please wait...',
        'PDFを生成中です。しばらくお待ちください...'
    );

    const getPdfTimeoutMessage = (pageLanguage) => tByLang(
        pageLanguage,
        'PDF 產生逾時，請再試一次',
        'PDF generation timed out. Please try again',
        'PDF生成がタイムアウトしました。再度お試しください'
    );

    const getCashflowStartNewMessage = (pageLanguage) => tByLang(
        pageLanguage,
        '準備新增現金流',
        'Ready to add cashflow',
        'キャッシュフローを追加します'
    );

    const getCashflowStartEditMessage = (pageLanguage) => tByLang(
        pageLanguage,
        '已載入規則，可修改後儲存',
        'Rule loaded. You can edit and save it',
        'ルールを読み込みました。編集して保存できます'
    );

    const getCashflowAutoAppliedMessage = (pageLanguage, appliedCount) => tByLang(
        pageLanguage,
        `已自動入帳/扣款 ${appliedCount} 筆現金流`,
        `Auto-applied ${appliedCount} cashflow entries`,
        `${appliedCount}件のキャッシュフローを自動適用しました`
    );

    const getCashflowDeleteRollbackMessage = (pageLanguage, revertedCount) => tByLang(
        pageLanguage,
        `規則已刪除，並已沖銷 ${revertedCount} 筆已入帳/扣款紀錄`,
        `Rule deleted and ${revertedCount} posted entries were rolled back`,
        `ルールを削除し、${revertedCount}件の入出金記録を取り消しました`
    );

    const getCashflowDeleteMessage = (pageLanguage) => tByLang(
        pageLanguage,
        '規則已刪除',
        'Rule deleted',
        'ルールを削除しました'
    );

    const getCashflowLinkedAccountLabel = (pageLanguage) => tByLang(
        pageLanguage,
        '已綁定帳戶',
        'Linked Account',
        '連携済み口座'
    );

    const getCashflowDeleteConfirmMessage = (pageLanguage, { ruleTitle, rollbackPreviewLines }) => {
        const title = ruleTitle || tByLang(pageLanguage, '未命名規則', 'Untitled Rule', '無題ルール');
        const lines = Array.isArray(rollbackPreviewLines) ? rollbackPreviewLines : [];
        if (lines.length > 0) {
            return tByLang(
                pageLanguage,
                `確定要刪除規則「${title}」嗎？\n\n將同步沖銷已自動入帳/扣款：\n${lines.join('\n')}\n\n此動作無法復原。`,
                `Delete rule "${title}"?\n\nThe following auto postings will be rolled back:\n${lines.join('\n')}\n\nThis action cannot be undone.`,
                `ルール「${title}」を削除しますか？\n\n以下の自動入出金を取り消します：\n${lines.join('\n')}\n\nこの操作は元に戻せません。`
            );
        }
        return tByLang(
            pageLanguage,
            `確定要刪除規則「${title}」嗎？`,
            `Delete rule "${title}"?`,
            `ルール「${title}」を削除しますか？`
        );
    };

    const getCashflowEditCanceledMessage = (pageLanguage) => tByLang(
        pageLanguage,
        '已取消編輯',
        'Edit canceled',
        '編集をキャンセルしました'
    );

    const getFxUpdatingMessage = (pageLanguage) => tByLang(
        pageLanguage,
        '更新匯率中...',
        'Updating exchange rates...',
        '為替レートを更新中...'
    );

    const getFxUpdatedMessage = (pageLanguage) => tByLang(
        pageLanguage,
        '已更新最新匯率',
        'Exchange rates updated',
        '為替レートを更新しました'
    );

    const getFxUpdateFailedMessage = (pageLanguage) => tByLang(
        pageLanguage,
        '匯率更新失敗，已使用目前匯率',
        'Exchange rate update failed. Using current rates',
        '為替更新に失敗したため、現在のレートを使用します'
    );

    const getMarketNoSymbolsMessage = (pageLanguage) => tByLang(
        pageLanguage,
        '沒有可更新的股票或加密貨幣代號',
        'No stock or crypto symbols available to update',
        '更新可能な株式・暗号資産シンボルがありません'
    );

    const getMarketUpdatingMessage = (pageLanguage) => tByLang(
        pageLanguage,
        '更新行情中...',
        'Updating market prices...',
        '相場を更新中...'
    );

    const getMarketUpdatedCountMessage = (pageLanguage, updatedCount) => tByLang(
        pageLanguage,
        `已更新 ${updatedCount} 筆行情`,
        `Updated ${updatedCount} market entries`,
        `${updatedCount}件の相場を更新しました`
    );

    const getMarketUpToDateMessage = (pageLanguage) => tByLang(
        pageLanguage,
        '行情已是最新或資料源暫不可用',
        'Market data is already up to date or source is temporarily unavailable',
        '相場は最新、またはデータソースが一時利用不可です'
    );

    const getMarketAndFxUpdatingMessage = (pageLanguage) => tByLang(
        pageLanguage,
        '更新行情與匯率中...',
        'Updating prices & exchange rates...',
        '相場と為替を更新中...'
    );

    const getMarketAndFxUpdatedMessage = (pageLanguage) => tByLang(
        pageLanguage,
        '已更新行情與匯率',
        'Prices & FX updated',
        '相場と為替を更新しました'
    );

    const formatSymbolList = (pageLanguage, symbols) => {
        const list = (Array.isArray(symbols) ? symbols : []).filter(Boolean);
        const shown = list.slice(0, 8);
        const extra = list.length - shown.length;
        const separator = pageLanguage === 'en-US' ? ', ' : '、';
        const text = shown.join(separator);
        if (extra > 0) return `${text} +${extra}`;
        return text;
    };

    const joinStatusParts = (pageLanguage, parts) => {
        const separator = pageLanguage === 'en-US' ? '; ' : '；';
        return (parts || []).filter(Boolean).join(separator);
    };

    const getMarketQuoteStatusMessage = (pageLanguage, market) => {
        if (!market) {
            return tByLang(
                pageLanguage,
                '行情更新失敗',
                'Market update failed',
                '相場の更新に失敗しました'
            );
        }
        if (market.noSymbols) return getMarketNoSymbolsMessage(pageLanguage);
        const failed = Array.isArray(market.failedSymbols) ? market.failedSymbols : [];
        const updatedCount = Number(market.updatedCount) || 0;
        const quotedCount = Number(market.quotedCount) || 0;
        const failedText = formatSymbolList(pageLanguage, failed);
        if (failed.length && updatedCount > 0) {
            return tByLang(
                pageLanguage,
                `已更新 ${updatedCount} 筆行情，未取得：${failedText}`,
                `Updated ${updatedCount} entries; unavailable: ${failedText}`,
                `${updatedCount}件を更新、取得不可：${failedText}`
            );
        }
        if (failed.length && quotedCount > 0) {
            return tByLang(
                pageLanguage,
                `${quotedCount} 個代號已是最新，未取得：${failedText}`,
                `${quotedCount} symbols already up to date; unavailable: ${failedText}`,
                `${quotedCount}銘柄は最新、取得不可：${failedText}`
            );
        }
        if (failed.length) {
            return tByLang(
                pageLanguage,
                `行情更新失敗：${failedText}`,
                `Market update failed: ${failedText}`,
                `相場の更新に失敗：${failedText}`
            );
        }
        if (updatedCount > 0) return getMarketUpdatedCountMessage(pageLanguage, updatedCount);
        if (quotedCount > 0) {
            return tByLang(
                pageLanguage,
                `行情已是最新（${quotedCount} 個代號）`,
                `Market prices already up to date (${quotedCount} symbols)`,
                `相場は最新です（${quotedCount}銘柄）`
            );
        }
        return getMarketUpToDateMessage(pageLanguage);
    };

    const getMarketAndFxStatusMessage = (pageLanguage, summary) => {
        const parts = [];
        if (summary?.fxAttempted) {
            parts.push(summary.fxOk ? getFxUpdatedMessage(pageLanguage) : getFxUpdateFailedMessage(pageLanguage));
        }
        if (summary?.marketAttempted) {
            parts.push(getMarketQuoteStatusMessage(pageLanguage, summary.market));
        }
        return joinStatusParts(pageLanguage, parts);
    };

    const getExportSuccessMessage = (pageLanguage) => tByLang(
        pageLanguage,
        '資料已成功匯出',
        'Data exported successfully',
        'データのエクスポートに成功しました'
    );

    const getExportFailedMessage = (pageLanguage) => tByLang(
        pageLanguage,
        '匯出失敗，請稍後再試',
        'Export failed. Please try again later',
        'エクスポートに失敗しました。しばらくしてから再試行してください'
    );

    const getPdfDownloadedMessage = (pageLanguage) => tByLang(
        pageLanguage,
        'PDF 已成功下載',
        'PDF downloaded successfully',
        'PDFのダウンロードが完了しました'
    );

    const getPdfShareFailedMessage = (pageLanguage, errorMessage) => tByLang(
        pageLanguage,
        `分享 PDF 失敗：${errorMessage || '請稍後再試'}`,
        `PDF share failed: ${errorMessage || 'Please try again later'}`,
        `PDF共有に失敗しました：${errorMessage || 'しばらくしてから再試行してください'}`
    );

    const getImportSuccessMessage = (pageLanguage, assetCount) => tByLang(
        pageLanguage,
        `匯入成功：${assetCount} 筆資產資料`,
        `Import successful: ${assetCount} asset records`,
        `インポート成功：${assetCount}件の資産データ`
    );

    const getImportFailedMessage = (pageLanguage) => tByLang(
        pageLanguage,
        '匯入失敗：檔案格式不正確',
        'Import failed: invalid file format',
        'インポート失敗：ファイル形式が正しくありません'
    );

    const getDataResetMessage = (pageLanguage) => tByLang(
        pageLanguage,
        '已重設資料，準備重新開始記帳囉 ✨',
        'Data reset complete. Ready for a fresh start ✨',
        'データをリセットしました。新しく記帳を始めましょう ✨'
    );

    const getResetSeedConfirmMessage = (pageLanguage) => tByLang(
        pageLanguage,
        '要把小王子的帳本重設資料嗎？\n這會清空你目前的資產、現金流與月度快照（本機資料會被覆蓋）。',
        'Reset Sweet Prince Ledger data?\nThis will clear your current assets, cashflow rules, and monthly snapshots (local data will be overwritten).',
        '王子の家計簿データをリセットしますか？\n現在の資産・キャッシュフロー・月次スナップショットが消去されます（ローカルデータは上書きされます）。'
    );

    const showSubmissionErrorAlert = (message) => {
        if (!message) return;
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
            window.alert(message);
        }
    };

    const showConfirmDialog = (message) => {
        if (!message) return false;
        if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
            return window.confirm(message);
        }
        return false;
    };

    const getCloudGoogleAccountLabel = (pageLanguage) => tByLang(
        pageLanguage,
        'Google 帳號',
        'Google Account',
        'Google アカウント'
    );

    const getCloudAuthStatusMessage = (pageLanguage, state) => {
        const accountLabel = state?.email || getCloudGoogleAccountLabel(pageLanguage);
        switch (state?.status) {
            case 'disabled':
                return tByLang(
                    pageLanguage,
                    '未設定 Firebase，資料僅存在此裝置',
                    'Firebase not configured. Data is only stored on this device',
                    'Firebase が未設定のため、データはこの端末にのみ保存されます'
                );
            case 'signed-in-manual':
                return tByLang(
                    pageLanguage,
                    `已登入 Google（${accountLabel}），請手動同步`,
                    `Signed in as ${accountLabel}, sync manually`,
                    `${accountLabel} でログイン済み。手動で同期してください`
                );
            case 'signed-in':
                return tByLang(
                    pageLanguage,
                    `已登入 Google（${accountLabel}）`,
                    `Signed in with Google (${accountLabel})`,
                    `Google にログインしました（${accountLabel}）`
                );
            case 'signed-out':
            default:
                return tByLang(
                    pageLanguage,
                    '尚未登入 Google，資料僅存在此裝置',
                    'Not signed in to Google. Data is only stored on this device',
                    'Google に未ログインのため、データはこの端末にのみ保存されます'
                );
        }
    };

    const getCloudPersistenceFailedMessage = (pageLanguage) => tByLang(
        pageLanguage,
        '無法啟用登入持久化，請允許第三方 Cookie 或關閉隱私阻擋',
        'Unable to enable login persistence. Please allow third-party cookies or disable tracking protection',
        'ログインの永続化を有効にできませんでした。サードパーティCookieを許可するか、追跡防止を無効にしてください'
    );

    const getCloudRedirectSignInFailedMessage = (pageLanguage, code) => tByLang(
        pageLanguage,
        `導頁登入失敗（${code || 'unknown'}）`,
        `Redirect sign-in failed (${code || 'unknown'})`,
        `リダイレクトログインに失敗しました（${code || 'unknown'}）`
    );

    const getCloudRedirectUriMismatchHelpMessage = (pageLanguage) => tByLang(
        pageLanguage,
        'Google 登入設定錯誤（redirect_uri_mismatch）。請到 Google Cloud OAuth Client 加入授權導頁 URI：\nhttps://sweetprinceledger-3acb9.firebaseapp.com/__/auth/handler\n並確認 Firebase Auth 已授權網域 ivankaiwck.github.io。',
        'Google sign-in configuration error (redirect_uri_mismatch). Add this Authorized redirect URI in Google Cloud OAuth Client:\nhttps://sweetprinceledger-3acb9.firebaseapp.com/__/auth/handler\nAlso make sure ivankaiwck.github.io is listed in Firebase Auth authorized domains.',
        'Google ログイン設定エラー（redirect_uri_mismatch）です。Google Cloud の OAuth Client に次のリダイレクトURIを追加してください：\nhttps://sweetprinceledger-3acb9.firebaseapp.com/__/auth/handler\nあわせて Firebase Auth の承認済みドメインに ivankaiwck.github.io があることを確認してください。'
    );

    const getCloudFirebaseNotConfiguredMessage = (pageLanguage) => tByLang(
        pageLanguage,
        '尚未設定 Firebase，請先在 index.html 填入 Firebase 設定',
        'Firebase is not configured yet. Please fill FIREBASE_CONFIG in index.html first',
        'Firebase が未設定です。先に index.html の FIREBASE_CONFIG を設定してください'
    );

    const getCloudSignInRequiredMessage = (pageLanguage) => tByLang(
        pageLanguage,
        '請先登入 Google 後再同步',
        'Please sign in to Google before syncing',
        '同期前に Google にログインしてください'
    );

    const getCloudDownloadingMessage = (pageLanguage) => tByLang(
        pageLanguage,
        '下載雲端中...',
        'Downloading from cloud...',
        'クラウドからダウンロード中...'
    );

    const getCloudDownloadedMessage = (pageLanguage, email) => {
        const accountLabel = email || getCloudGoogleAccountLabel(pageLanguage);
        return tByLang(
            pageLanguage,
            `已下載雲端資料（${accountLabel}）`,
            `Cloud data downloaded (${accountLabel})`,
            `クラウドデータをダウンロードしました（${accountLabel}）`
        );
    };

    const getCloudInvalidDataMessage = (pageLanguage) => tByLang(
        pageLanguage,
        '雲端資料格式不完整，未覆蓋本機',
        'Cloud data is invalid, local data kept',
        'クラウドデータ形式が不正のため、ローカルデータを維持しました'
    );

    const getCloudNoDataMessage = (pageLanguage) => tByLang(
        pageLanguage,
        '雲端目前沒有可下載資料',
        'No cloud data available to download',
        'ダウンロード可能なクラウドデータがありません'
    );

    const getCloudDownloadFailedMessage = (pageLanguage) => tByLang(
        pageLanguage,
        '雲端下載失敗，資料仍保留在本機',
        'Cloud download failed. Local data is kept',
        'クラウドのダウンロードに失敗しました。ローカルデータは保持されています'
    );

    const getCloudUploadingMessage = (pageLanguage) => tByLang(
        pageLanguage,
        '上載雲端中...',
        'Uploading to cloud...',
        'クラウドへアップロード中...'
    );

    const getCloudUploadedMessage = (pageLanguage, email) => {
        const accountLabel = email || getCloudGoogleAccountLabel(pageLanguage);
        return tByLang(
            pageLanguage,
            `已上載本機資料到雲端（${accountLabel}）`,
            `Local data uploaded to cloud (${accountLabel})`,
            `ローカルデータをクラウドへアップロードしました（${accountLabel}）`
        );
    };

    const getCloudUploadFailedMessage = (pageLanguage) => tByLang(
        pageLanguage,
        '雲端上載失敗，資料仍保留在本機',
        'Cloud upload failed. Local data is kept',
        'クラウドへのアップロードに失敗しました。ローカルデータは保持されています'
    );

    window.APP_STATUS_MESSAGES = {
        getPrinceHintMessage,
        getPdfGeneratingBusyMessage,
        getPdfTimeoutMessage,
        getCashflowStartNewMessage,
        getCashflowStartEditMessage,
        getCashflowAutoAppliedMessage,
        getCashflowDeleteRollbackMessage,
        getCashflowDeleteMessage,
        getCashflowLinkedAccountLabel,
        getCashflowDeleteConfirmMessage,
        getCashflowEditCanceledMessage,
        getFxUpdatingMessage,
        getFxUpdatedMessage,
        getFxUpdateFailedMessage,
        getMarketNoSymbolsMessage,
        getMarketUpdatingMessage,
        getMarketUpdatedCountMessage,
        getMarketUpToDateMessage,
        getMarketAndFxUpdatingMessage,
        getMarketAndFxUpdatedMessage,
        getMarketAndFxStatusMessage,
        getExportSuccessMessage,
        getExportFailedMessage,
        getPdfDownloadedMessage,
        getPdfShareFailedMessage,
        getImportSuccessMessage,
        getImportFailedMessage,
        getDataResetMessage,
        getResetSeedConfirmMessage,
        showSubmissionErrorAlert,
        showConfirmDialog,
        getCloudGoogleAccountLabel,
        getCloudAuthStatusMessage,
        getCloudPersistenceFailedMessage,
        getCloudRedirectSignInFailedMessage,
        getCloudRedirectUriMismatchHelpMessage,
        getCloudFirebaseNotConfiguredMessage,
        getCloudSignInRequiredMessage,
        getCloudDownloadingMessage,
        getCloudDownloadedMessage,
        getCloudInvalidDataMessage,
        getCloudNoDataMessage,
        getCloudDownloadFailedMessage,
        getCloudUploadingMessage,
        getCloudUploadedMessage,
        getCloudUploadFailedMessage
    };
})();
