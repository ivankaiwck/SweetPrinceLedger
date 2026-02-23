(() => {
    const { CURRENCIES, ONE_DAY_MS } = window.APP_CONSTANTS || {};
    const {
        sanitizeCashflowEntries,
        normalizeDateKeyOrFallback
    } = window.APP_UTILS || {};
    const {
        normalizeAssetRecord,
        isValidAssetRecord,
        isValidCashflowRecord
    } = window.APP_DATA_UTILS || {};

    if (!CURRENCIES || !ONE_DAY_MS || !sanitizeCashflowEntries || !normalizeDateKeyOrFallback || !normalizeAssetRecord || !isValidAssetRecord || !isValidCashflowRecord) {
        throw new Error('constants.js, utils.js, or data-utils.js is missing or incomplete for cloud-sync.js');
    }

    const buildCloudSyncPayload = ({
        assets,
        displayCurrency,
        monthlySnapshots,
        cashflowEntries,
        cashflowAppliedOccurrenceKeys,
        cashflowAppliedPostings,
        cashflowLastAutoApplyDate
    }) => ({
        assets,
        displayCurrency,
        monthlySnapshots,
        cashflowEntries,
        cashflowAppliedOccurrenceKeys,
        cashflowAppliedPostings,
        cashflowLastAutoApplyDate
    });

    const loadCloudDocument = async ({ firebaseDB, collectionName, uid }) => {
        const docRef = firebaseDB.collection(collectionName).doc(uid);
        const snapshot = await docRef.get();
        const cloudData = snapshot.exists ? (snapshot.data() || {}) : {};
        return { docRef, cloudData };
    };

    const saveCloudDocument = async ({ docRef, payload, firebase, email }) => {
        await docRef.set({
            ...payload,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            email: email || ''
        }, { merge: true });
    };

    const downloadCloudData = async ({
        firebaseDB,
        collectionName,
        user
    }) => {
        const { docRef, cloudData } = await loadCloudDocument({
            firebaseDB,
            collectionName,
            uid: user.uid
        });
        const hasSnapshot = Boolean(cloudData && Object.keys(cloudData).length > 0);
        const hydrated = normalizeCloudDataForState(cloudData);

        return {
            docRef,
            hasSnapshot,
            hydrated
        };
    };

    const uploadCloudData = async ({
        firebaseDB,
        collectionName,
        user,
        firebase,
        localPayload
    }) => {
        const docRef = firebaseDB.collection(collectionName).doc(user.uid);
        await saveCloudDocument({
            docRef,
            payload: localPayload,
            firebase,
            email: user.email || ''
        });
    };

    const normalizeCloudDataForState = (cloudData) => {
        if (!Array.isArray(cloudData?.assets) || !cloudData.assets.every(isValidAssetRecord)) return null;

        const nextAssets = cloudData.assets.map(normalizeAssetRecord);
        const nextDisplayCurrency = typeof cloudData.displayCurrency === 'string' && CURRENCIES.includes(cloudData.displayCurrency)
            ? cloudData.displayCurrency
            : 'HKD';
        const nextMonthlySnapshots = cloudData.monthlySnapshots && typeof cloudData.monthlySnapshots === 'object' && !Array.isArray(cloudData.monthlySnapshots)
            ? cloudData.monthlySnapshots
            : {};
        const nextCashflowEntries = Array.isArray(cloudData.cashflowEntries) && cloudData.cashflowEntries.every(isValidCashflowRecord)
            ? sanitizeCashflowEntries(cloudData.cashflowEntries)
            : [];
        const nextCashflowAppliedOccurrenceKeys = Array.isArray(cloudData.cashflowAppliedOccurrenceKeys)
            ? cloudData.cashflowAppliedOccurrenceKeys.filter(item => typeof item === 'string')
            : [];
        const nextCashflowAppliedPostings = cloudData.cashflowAppliedPostings && typeof cloudData.cashflowAppliedPostings === 'object' && !Array.isArray(cloudData.cashflowAppliedPostings)
            ? cloudData.cashflowAppliedPostings
            : {};
        const nextCashflowLastAutoApplyDate = normalizeDateKeyOrFallback(
            cloudData.cashflowLastAutoApplyDate,
            new Date(Date.now() - ONE_DAY_MS)
        );

        return {
            assets: nextAssets,
            displayCurrency: nextDisplayCurrency,
            monthlySnapshots: nextMonthlySnapshots,
            cashflowEntries: nextCashflowEntries,
            cashflowAppliedOccurrenceKeys: nextCashflowAppliedOccurrenceKeys,
            cashflowAppliedPostings: nextCashflowAppliedPostings,
            cashflowLastAutoApplyDate: nextCashflowLastAutoApplyDate
        };
    };

    const loginWithGoogle = async ({ isCloudEnabled, firebaseAuth, firebase, onStatus, tByLang, tByLangBy }) => {
        const t = typeof tByLang === 'function' ? tByLang : ((zh) => zh);
        const buildStatusMessage = (zh, en, ja) => {
            if (typeof tByLangBy === 'function') {
                return (lang) => tByLangBy(lang, zh, en, ja);
            }
            return t(zh, en, ja);
        };
        const setStatus = (zh, en, ja) => {
            if (typeof onStatus !== 'function') return;
            onStatus(buildStatusMessage(zh, en, ja));
        };
        if (!isCloudEnabled) {
            setStatus(
                '尚未設定 Firebase，請先在 index.html 填入 Firebase 設定',
                'Firebase is not configured yet. Please fill FIREBASE_CONFIG in index.html first',
                'Firebase が未設定です。先に index.html の FIREBASE_CONFIG を設定してください'
            );
            return;
        }

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            await firebaseAuth.signInWithPopup(provider);
        } catch (error) {
            const code = error?.code || '';
            if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
                try {
                    const provider = new firebase.auth.GoogleAuthProvider();
                    setStatus('Popup 受限，改用導頁登入中...', 'Popup blocked. Switching to redirect sign-in...', 'ポップアップが制限されたため、リダイレクトログインに切り替えています...');
                    await firebaseAuth.signInWithRedirect(provider);
                    return;
                } catch (redirectError) {
                    const redirectCode = redirectError?.code || 'unknown';
                    setStatus(
                        `Google 登入失敗（${redirectCode}）`,
                        `Google sign-in failed (${redirectCode})`,
                        `Google ログインに失敗しました（${redirectCode}）`
                    );
                    return;
                }
            }

            if (code === 'auth/unauthorized-domain') {
                setStatus(
                    '網域未授權：請到 Firebase Auth 加入 localhost、127.0.0.1、ivankaiwck.github.io',
                    'Unauthorized domain: add localhost, 127.0.0.1, and ivankaiwck.github.io in Firebase Auth',
                    '未承認ドメインです：Firebase Auth に localhost、127.0.0.1、ivankaiwck.github.io を追加してください'
                );
                return;
            }

            setStatus(
                `Google 登入失敗（${code || 'unknown'}）`,
                `Google sign-in failed (${code || 'unknown'})`,
                `Google ログインに失敗しました（${code || 'unknown'}）`
            );
        }
    };

    const logoutGoogle = async ({ isCloudEnabled, firebaseAuth, onStatus, tByLang, tByLangBy }) => {
        const t = typeof tByLang === 'function' ? tByLang : ((zh) => zh);
        const buildStatusMessage = (zh, en, ja) => {
            if (typeof tByLangBy === 'function') {
                return (lang) => tByLangBy(lang, zh, en, ja);
            }
            return t(zh, en, ja);
        };
        const setStatus = (zh, en, ja) => {
            if (typeof onStatus !== 'function') return;
            onStatus(buildStatusMessage(zh, en, ja));
        };
        if (!isCloudEnabled) return;
        try {
            await firebaseAuth.signOut();
        } catch (error) {
            setStatus('登出失敗，請稍後再試', 'Sign-out failed. Please try again later', 'ログアウトに失敗しました。しばらくしてから再試行してください');
        }
    };

    window.APP_CLOUD_SYNC = {
        buildCloudSyncPayload,
        loadCloudDocument,
        saveCloudDocument,
        downloadCloudData,
        uploadCloudData,
        normalizeCloudDataForState,
        loginWithGoogle,
        logoutGoogle
    };
})();
