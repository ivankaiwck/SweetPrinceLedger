(() => {
    const CURRENCIES = ['HKD', 'USD', 'CNY', 'TWD', 'MOP', 'JPY', 'EUR', 'GBP', 'SGD', 'AUD', 'CAD', 'CHF', 'NZD', 'KRW', 'THB', 'MYR', 'INR', 'AED'];
    const DEFAULT_RATES = {
        HKD: 1,
        USD: 0.128,
        CNY: 0.92,
        TWD: 4.15,
        MOP: 1.03,
        JPY: 19.2,
        EUR: 0.118,
        GBP: 0.101,
        SGD: 0.172,
        AUD: 0.197,
        CAD: 0.174,
        CHF: 0.112,
        NZD: 0.212,
        KRW: 184,
        THB: 4.6,
        MYR: 0.59,
        INR: 10.7,
        AED: 0.47
    };
    const STORAGE_KEYS = {
        assets: 'assetTracker.assets.v2',
        displayCurrency: 'assetTracker.displayCurrency.v2',
        monthlySnapshots: 'assetTracker.monthlySnapshots.v2',
        currencyRates: 'assetTracker.currencyRates.v1',
        currencyRatesUpdatedAt: 'assetTracker.currencyRatesUpdatedAt.v1',
        cashflowEntries: 'assetTracker.cashflowEntries.v1',
        cashflowAppliedOccurrenceKeys: 'assetTracker.cashflowAppliedOccurrenceKeys.v1',
        cashflowLastAutoApplyDate: 'assetTracker.cashflowLastAutoApplyDate.v1',
        cashflowAppliedPostings: 'assetTracker.cashflowAppliedPostings.v1',
        pageLanguage: 'assetTracker.pageLanguage.v1',
        themeId: 'assetTracker.themeId.v1',
        recentCurrencies: 'assetTracker.recentCurrencies.v1'
    };
    const FIREBASE_CONFIG = window.__FIREBASE_CONFIG__ || {
        apiKey: 'AIzaSyBBXQq6K6dBZCL4t8ieyH_QB2TmAW4b8P0',
        authDomain: 'sweetprinceledger-3acb9.firebaseapp.com',
        databaseURL: 'https://sweetprinceledger-3acb9-default-rtdb.asia-southeast1.firebasedatabase.app',
        projectId: 'sweetprinceledger-3acb9',
        storageBucket: 'sweetprinceledger-3acb9.firebasestorage.app',
        messagingSenderId: '197674917932',
        appId: '1:197674917932:web:6aaa35121062d4b3f4b189',
        measurementId: 'G-R0BJT35WPE'
    };
    const CLOUD_COLLECTION = 'assetTrackerUsers';
    const hasFirebaseConfig = ['apiKey', 'authDomain', 'projectId', 'appId'].every(key => Boolean((FIREBASE_CONFIG[key] || '').trim()));
    const firebaseApp = (() => {
        if (!window.firebase || !hasFirebaseConfig) return null;
        try {
            return firebase.apps?.length ? firebase.app() : firebase.initializeApp(FIREBASE_CONFIG);
        } catch (error) {
            return null;
        }
    })();
    const firebaseAuth = firebaseApp ? firebase.auth() : null;
    const firebaseDB = firebaseApp ? firebase.firestore() : null;
    const isCloudEnabled = Boolean(firebaseAuth && firebaseDB);

    const CATEGORIES = {
        LIQUID: { label: '流動資金', color: 'text-emerald-500', bgColor: 'bg-emerald-50', icon: 'wallet', subtypes: ['現金', '電子錢包', '金融卡', '其他'] },
        INVEST: { label: '投資', color: 'text-blue-500', bgColor: 'bg-blue-50', icon: 'trending-up', subtypes: ['基金', '股票', '加密貨幣', '銀行理財', '定期存款', '其他投資'] },
        INSURANCE: { label: '保險', color: 'text-cyan-500', bgColor: 'bg-cyan-50', icon: 'shield', subtypes: ['投資/投資相連', '人壽/累積財富', '健康'] },
        FIXED: { label: '固定資產', color: 'text-amber-500', bgColor: 'bg-amber-50', icon: 'home', subtypes: ['房產', '汽車', '其他固定資產'] },
        RECEIVABLE: { label: '應收款', color: 'text-indigo-500', bgColor: 'bg-indigo-50', icon: 'hand-coins', subtypes: ['個人借款', '公司應收', '退稅/補貼', '保證金', '租金', '其他應收'] },
        LIABILITY: { label: '負債', color: 'text-rose-500', bgColor: 'bg-rose-50', icon: 'credit-card', isNegative: true, subtypes: ['房貸', '信用卡', '貸款', '應付款', '其他負債'] }
    };

    const CRYPTO_ID_MAP = {
        BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin', XRP: 'ripple', ADA: 'cardano', DOGE: 'dogecoin', DOT: 'polkadot', TRX: 'tron', LTC: 'litecoin'
    };

    const CATEGORY_KEYS = Object.keys(CATEGORIES);
    const INVEST_CHART_COLORS = ['#F472B6', '#38BDF8', '#F59E0B', '#A78BFA', '#818CF8', '#F43F5E', '#22D3EE', '#FB7185'];
    const CASHFLOW_TYPES = {
        INCOME: { label: '收入', tone: 'text-emerald-600' },
        EXPENSE: { label: '支出', tone: 'text-rose-600' }
    };
    const CASHFLOW_SCHEDULE_TYPES = [
        { value: 'ONE_TIME', label: '單次性' },
        { value: 'RECURRING', label: '固定' }
    ];
    const CASHFLOW_FREQUENCIES = [
        { value: 'DAILY', label: '每日' },
        { value: 'WEEKLY', label: '每週' },
        { value: 'MONTHLY', label: '每月' },
        { value: 'YEARLY', label: '每年' }
    ];
    const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
    const CASHFLOW_CATEGORY_OPTIONS = [
        '收入-薪金', '收入-獎金', '收入-佣金', '收入-租金', '收入-股息', '收入-利息', '收入-兼職', '收入-生意', '收入-退款/補貼', '收入-其他',
        '費用-餐飲', '費用-交通', '費用-電費', '費用-水費', '費用-煤氣費', '費用-網絡/電話', '費用-房租/管理費', '費用-保險', '費用-醫療', '費用-教育', '費用-娛樂', '費用-購物', '費用-家庭', '費用-稅費', '費用-其他',
        '轉帳-儲蓄'
    ];
    const CASHFLOW_CATEGORY_BY_TYPE = {
        INCOME: CASHFLOW_CATEGORY_OPTIONS.filter(item => item.startsWith('收入-')),
        EXPENSE: CASHFLOW_CATEGORY_OPTIONS.filter(item => item.startsWith('費用-')).concat(['轉帳-儲蓄'])
    };
    const getDefaultCashflowCategory = (type) => {
        const options = CASHFLOW_CATEGORY_BY_TYPE[type] || CASHFLOW_CATEGORY_BY_TYPE.EXPENSE;
        return options[0] || '費用-其他';
    };
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    window.APP_CONSTANTS = {
        CURRENCIES,
        DEFAULT_RATES,
        STORAGE_KEYS,
        FIREBASE_CONFIG,
        CLOUD_COLLECTION,
        hasFirebaseConfig,
        firebaseApp,
        firebaseAuth,
        firebaseDB,
        isCloudEnabled,
        CATEGORIES,
        CRYPTO_ID_MAP,
        CATEGORY_KEYS,
        INVEST_CHART_COLORS,
        CASHFLOW_TYPES,
        CASHFLOW_SCHEDULE_TYPES,
        CASHFLOW_FREQUENCIES,
        WEEKDAY_LABELS,
        CASHFLOW_CATEGORY_OPTIONS,
        CASHFLOW_CATEGORY_BY_TYPE,
        getDefaultCashflowCategory,
        ONE_DAY_MS
    };
})();
