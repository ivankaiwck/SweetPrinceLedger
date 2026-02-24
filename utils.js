(() => {
    const {
        CURRENCIES,
        DEFAULT_RATES,
        CASHFLOW_TYPES,
        CASHFLOW_SCHEDULE_TYPES,
        CASHFLOW_FREQUENCIES,
        CASHFLOW_CATEGORY_BY_TYPE,
        getDefaultCashflowCategory
    } = window.APP_CONSTANTS || {};

    if (!CURRENCIES || !DEFAULT_RATES || !CASHFLOW_TYPES || !CASHFLOW_SCHEDULE_TYPES || !CASHFLOW_FREQUENCIES || !CASHFLOW_CATEGORY_BY_TYPE || !getDefaultCashflowCategory) {
        throw new Error('constants.js is missing or incomplete for utils.js');
    }

    const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    };

    const describeArc = (x, y, radius, startAngle, endAngle) => {
        const start = polarToCartesian(x, y, radius, endAngle);
        const end = polarToCartesian(x, y, radius, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
        return `M ${x} ${y} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
    };

    const seedAssets = [];

    const parseStorage = (key, fallback) => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            return fallback;
        }
    };

    const sanitizeCurrencyRates = (rates) => {
        const next = { ...DEFAULT_RATES };
        if (!rates || typeof rates !== 'object') return next;
        CURRENCIES.forEach(currency => {
            const value = Number(rates[currency]);
            if (Number.isFinite(value) && value > 0) next[currency] = value;
        });
        next.HKD = 1;
        return next;
    };

    const toHKD = (amount, currency, rates = DEFAULT_RATES) => amount / (rates[currency] || 1);
    const fromHKD = (amountHKD, currency, rates = DEFAULT_RATES) => amountHKD * (rates[currency] || 1);
    const formatAmount = (value) => {
        const numeric = Number(value) || 0;
        return numeric.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const WEALTH_THRESHOLDS = [0, 100000, 300000, 780000, 1000000, 2000000, 5000000, 8000000, 10000000, 20000000, 50000000, 100000000, 500000000, Infinity];
    const WEALTH_RANKS_BY_LANGUAGE = {
        'zh-Hant': [
            '負資產', // No change
            '基層 / 下層階層',
            '初入社會 / 剛起步',
            '小康 / 穩定發展',
            '大眾富裕 / 上層工人階級',
            '新晉中產',
            '中產階級',
            '中上階層',
            '富裕階層 / 中上階層',
            '準高淨值人士',
            '高淨值富豪',
            '超高淨值人士',
            '超級富豪階層',
            '頂級富豪 / 世界級'
        ],
        'en-US': [
            'Negative Net Worth',
            'Working / Lower Class',
            'Early Career',
            'Stable Living',
            'Mass Affluent',
            'New Middle Class',
            'Middle Class',
            'Upper-Middle Class',
            'Affluent / Upper-Middle',
            'Pre-HNWI',
            'HNWI',
            'Ultra-HNWI',
            'Super Rich',
            'Top Wealth / Global Tier'
        ],
        'ja-JP': [
            '負資産',
            '基層 / 下層階層',
            '社会人初期',
            '安定成長',
            '大衆富裕層',
            '新興中間層',
            '中間層',
            '中上層',
            '富裕層 / 中上層',
            '準富裕層',
            '富裕層',
            '超富裕層',
            '超富豪層',
            '世界級富豪'
        ]
    };

    const THEME_WEALTH_TITLES = {
        'macaron-prince': [
            { emoji: '❓🍬', suffix: { 'zh-Hant': '迷路奶油球', 'en-US': 'Lost Cream Ball', 'ja-JP': '迷子クリームボール' } },
            { emoji: '🌱🧁', suffix: { 'zh-Hant': '馬卡龍新手', 'en-US': 'Macaron Novice', 'ja-JP': 'マカロン初心者' } },
            { emoji: '🎖️🥯', suffix: { 'zh-Hant': '糖霜小隊長', 'en-US': 'Frosting Squad Leader', 'ja-JP': 'フロスティング小隊長' } },
            { emoji: '💼🍓', suffix: { 'zh-Hant': '草莓塔小管家', 'en-US': 'Strawberry Tart Steward', 'ja-JP': 'ストロベリータルト管家' } },
            { emoji: '🎓🍰', suffix: { 'zh-Hant': '奶霜達人', 'en-US': 'Cream Expert', 'ja-JP': 'クリーム達人' } },
            { emoji: '🧭🍩', suffix: { 'zh-Hant': '甜圈巡遊者', 'en-US': 'Sweet Ring Explorer', 'ja-JP': 'スイートリング探検者' } },
            { emoji: '🏰🍦', suffix: { 'zh-Hant': '城堡甜點隊長', 'en-US': 'Castle Dessert Captain', 'ja-JP': '城デザート隊長' } },
            { emoji: '🗝️🏛️', suffix: { 'zh-Hant': '糖塔總管', 'en-US': 'Sugar Tower Manager', 'ja-JP': 'シュガータワー管理者' } },
            { emoji: '📜🧁', suffix: { 'zh-Hant': '王室甜點顧問', 'en-US': 'Royal Dessert Advisor', 'ja-JP': '王室デザート顧問' } },
            { emoji: '🎩🍬', suffix: { 'zh-Hant': '糖果伯爵', 'en-US': 'Candy Earl', 'ja-JP': 'キャンディ伯爵' } },
            { emoji: '💎🍰', suffix: { 'zh-Hant': '奶霜公爵', 'en-US': 'Cream Duke', 'ja-JP': 'クリーム公爵' } },
            { emoji: '🛡️🏰', suffix: { 'zh-Hant': '王都甜點守護者', 'en-US': 'Capital Dessert Guardian', 'ja-JP': '王都デザート守護者' } },
            { emoji: '👑✨', suffix: { 'zh-Hant': '星糖皇冠領主', 'en-US': 'Star Sugar Crown Lord', 'ja-JP': '星シュガークラウン領主' } },
            { emoji: '🌌🤴', suffix: { 'zh-Hant': '宇宙糖果王子', 'en-US': 'Cosmic Candy Prince', 'ja-JP': '宇宙キャンディ王子' } }
        ],
        'mint-prince': [
            { emoji: '❓🌿', suffix: { 'zh-Hant': '迷路薄荷豆', 'en-US': 'Lost Mint Bean', 'ja-JP': '迷子ミント豆' } },
            { emoji: '🌱🍫', suffix: { 'zh-Hant': '薄荷巧克力新手', 'en-US': 'Mint Chocolate Novice', 'ja-JP': 'ミントチョコ初心者' } },
            { emoji: '🎖️🍪', suffix: { 'zh-Hant': '可可小隊長', 'en-US': 'Cocoa Squad Leader', 'ja-JP': 'ココア小隊長' } },
            { emoji: '💼🌿', suffix: { 'zh-Hant': '薄荷管家', 'en-US': 'Mint Steward', 'ja-JP': 'ミント管家' } },
            { emoji: '🎓🍫', suffix: { 'zh-Hant': '薄荷可可達人', 'en-US': 'Mint Cocoa Expert', 'ja-JP': 'ミントココア達人' } },
            { emoji: '🧭🍃', suffix: { 'zh-Hant': '薄荷巡遊者', 'en-US': 'Mint Explorer', 'ja-JP': 'ミント探検者' } },
            { emoji: '🏰🍫', suffix: { 'zh-Hant': '巧克力城堡王子', 'en-US': 'Chocolate Castle Prince', 'ja-JP': 'チョコレート城王子' } },
            { emoji: '🗝️🌿', suffix: { 'zh-Hant': '薄荷總管', 'en-US': 'Mint Manager', 'ja-JP': 'ミント管理者' } },
            { emoji: '📜🍫', suffix: { 'zh-Hant': '王室可可顧問', 'en-US': 'Royal Cocoa Advisor', 'ja-JP': '王室ココア顧問' } },
            { emoji: '🎩🌿', suffix: { 'zh-Hant': '薄荷伯爵', 'en-US': 'Mint Earl', 'ja-JP': 'ミント伯爵' } },
            { emoji: '💎🍫', suffix: { 'zh-Hant': '巧克力公爵', 'en-US': 'Chocolate Duke', 'ja-JP': 'チョコレート公爵' } },
            { emoji: '🛡️🌿', suffix: { 'zh-Hant': '王都薄荷守護者', 'en-US': 'Capital Mint Guardian', 'ja-JP': '王都ミント守護者' } },
            { emoji: '👑🍫', suffix: { 'zh-Hant': '可可皇冠領主', 'en-US': 'Cocoa Crown Lord', 'ja-JP': 'ココアクラウン領主' } },
            { emoji: '🌌🤴', suffix: { 'zh-Hant': '宇宙薄荷王子', 'en-US': 'Cosmic Mint Prince', 'ja-JP': '宇宙ミント王子' } }
        ],
        'lavender-prince': [
            { emoji: '❓🌷', suffix: { 'zh-Hant': '迷路薰衣草', 'en-US': 'Lost Lavender', 'ja-JP': '迷子ラベンダー' } },
            { emoji: '🌱💜', suffix: { 'zh-Hant': '薰衣草新手', 'en-US': 'Lavender Novice', 'ja-JP': 'ラベンダー初心者' } },
            { emoji: '🎖️🍯', suffix: { 'zh-Hant': '蜂蜜小隊長', 'en-US': 'Honey Squad Leader', 'ja-JP': 'ハニー小隊長' } },
            { emoji: '💼🏺', suffix: { 'zh-Hant': '薰香管家', 'en-US': 'Aroma Steward', 'ja-JP': 'アロマ管家' } },
            { emoji: '🎓🌷', suffix: { 'zh-Hant': '薰衣草達人', 'en-US': 'Lavender Expert', 'ja-JP': 'ラベンダー達人' } },
            { emoji: '🧭🍯', suffix: { 'zh-Hant': '蜂蜜巡遊者', 'en-US': 'Honey Explorer', 'ja-JP': 'ハニー探検者' } },
            { emoji: '🏰🔮', suffix: { 'zh-Hant': '薰香城堡王子', 'en-US': 'Aroma Castle Prince', 'ja-JP': 'アロマ城王子' } },
            { emoji: '🗝️🍯', suffix: { 'zh-Hant': '蜂蜜總管', 'en-US': 'Honey Manager', 'ja-JP': 'ハニー管理者' } },
            { emoji: '📜🏺', suffix: { 'zh-Hant': '王室薰香顧問', 'en-US': 'Royal Aroma Advisor', 'ja-JP': '王室アロマ顧問' } },
            { emoji: '🎩💜', suffix: { 'zh-Hant': '蜂蜜伯爵', 'en-US': 'Honey Earl', 'ja-JP': 'ハニー伯爵' } },
            { emoji: '💎🔮', suffix: { 'zh-Hant': '薰香公爵', 'en-US': 'Aroma Duke', 'ja-JP': 'アロマ公爵' } },
            { emoji: '🛡️🌷', suffix: { 'zh-Hant': '王都薰香守護者', 'en-US': 'Capital Aroma Guardian', 'ja-JP': '王都アロマ守護者' } },
            { emoji: '👑🍯', suffix: { 'zh-Hant': '蜂蜜皇冠領主', 'en-US': 'Honey Crown Lord', 'ja-JP': 'ハニークラウン領主' } },
            { emoji: '🌌🤴', suffix: { 'zh-Hant': '宇宙薰香王子', 'en-US': 'Cosmic Aroma Prince', 'ja-JP': '宇宙アロマ王子' } }
        ],
        'strawberry-tart-prince': [
            { emoji: '❓🍓', suffix: { 'zh-Hant': '迷路草莓籽', 'en-US': 'Lost Strawberry Seed', 'ja-JP': '迷子イチゴ種' } },
            { emoji: '🌱🍰', suffix: { 'zh-Hant': '草莓見習生', 'en-US': 'Strawberry Novice', 'ja-JP': 'イチゴ初心者' } },
            { emoji: '⚔️🍓', suffix: { 'zh-Hant': '糖霜草莓騎士', 'en-US': 'Frosted Strawberry Knight', 'ja-JP': 'フロストイチゴ騎士' } },
            { emoji: '💼🥧', suffix: { 'zh-Hant': '草莓塔管家', 'en-US': 'Strawberry Tart Steward', 'ja-JP': 'ストロベリータルト管家' } },
            { emoji: '⚒️🍓', suffix: { 'zh-Hant': '草莓園匠師', 'en-US': 'Strawberry Garden Master', 'ja-JP': 'イチゴ園匠師' } },
            { emoji: '🧭🍓', suffix: { 'zh-Hant': '草莓巡遊者', 'en-US': 'Strawberry Explorer', 'ja-JP': 'イチゴ探検者' } },
            { emoji: '🏰🍓', suffix: { 'zh-Hant': '草莓城堡王子', 'en-US': 'Strawberry Castle Prince', 'ja-JP': 'イチゴ城王子' } },
            { emoji: '🗝️🥧', suffix: { 'zh-Hant': '草莓塔總管', 'en-US': 'Strawberry Tart Manager', 'ja-JP': 'ストロベリータルト管理者' } },
            { emoji: '📜🍓', suffix: { 'zh-Hant': '王室草莓顧問', 'en-US': 'Royal Strawberry Advisor', 'ja-JP': '王室イチゴ顧問' } },
            { emoji: '🎩🍓', suffix: { 'zh-Hant': '草莓伯爵', 'en-US': 'Strawberry Earl', 'ja-JP': 'イチゴ伯爵' } },
            { emoji: '💎🍓', suffix: { 'zh-Hant': '草莓公爵', 'en-US': 'Strawberry Duke', 'ja-JP': 'イチゴ公爵' } },
            { emoji: '🛡️🏰', suffix: { 'zh-Hant': '草莓王都守護者', 'en-US': 'Capital Strawberry Guardian', 'ja-JP': '王都イチゴ守護者' } },
            { emoji: '👑🍓', suffix: { 'zh-Hant': '草莓皇冠領主', 'en-US': 'Strawberry Crown Lord', 'ja-JP': 'イチゴクラウン領主' } },
            { emoji: '🌌🤴', suffix: { 'zh-Hant': '星糖草莓王子', 'en-US': 'Star Sugar Strawberry Prince', 'ja-JP': '星シュガーイチゴ王子' } }
        ],
        'caramel-pudding-prince': [
            { emoji: '❓🍮', suffix: { 'zh-Hant': '迷路焦糖勺', 'en-US': 'Lost Caramel Spoon', 'ja-JP': '迷子キャラメルスプーン' } },
            { emoji: '🌱🍮', suffix: { 'zh-Hant': '布丁見習生', 'en-US': 'Pudding Novice', 'ja-JP': 'プリン初心者' } },
            { emoji: '⚔️🍮', suffix: { 'zh-Hant': '焦糖小騎士', 'en-US': 'Caramel Little Knight', 'ja-JP': 'キャラメル小騎士' } },
            { emoji: '💼🍮', suffix: { 'zh-Hant': '布丁管家', 'en-US': 'Pudding Steward', 'ja-JP': 'プリン管家' } },
            { emoji: '⚒️🍮', suffix: { 'zh-Hant': '焦糖匠師', 'en-US': 'Caramel Master', 'ja-JP': 'キャラメル匠師' } },
            { emoji: '🧭🍮', suffix: { 'zh-Hant': '焦糖巡遊者', 'en-US': 'Caramel Explorer', 'ja-JP': 'キャラメル探検者' } },
            { emoji: '🏰🍮', suffix: { 'zh-Hant': '布丁城堡王子', 'en-US': 'Pudding Castle Prince', 'ja-JP': 'プリン城王子' } },
            { emoji: '🗝️🍮', suffix: { 'zh-Hant': '焦糖總管', 'en-US': 'Caramel Manager', 'ja-JP': 'キャラメル管理者' } },
            { emoji: '📜🍮', suffix: { 'zh-Hant': '王室布丁顧問', 'en-US': 'Royal Pudding Advisor', 'ja-JP': '王室プリン顧問' } },
            { emoji: '🎩🍮', suffix: { 'zh-Hant': '焦糖伯爵', 'en-US': 'Caramel Earl', 'ja-JP': 'キャラメル伯爵' } },
            { emoji: '💎🍮', suffix: { 'zh-Hant': '焦糖公爵', 'en-US': 'Caramel Duke', 'ja-JP': 'キャラメル公爵' } },
            { emoji: '🛡️🍮', suffix: { 'zh-Hant': '王都焦糖守護者', 'en-US': 'Capital Caramel Guardian', 'ja-JP': '王都キャラメル守護者' } },
            { emoji: '👑🍮', suffix: { 'zh-Hant': '皇冠布丁領主', 'en-US': 'Pudding Crown Lord', 'ja-JP': 'プリンクラウン領主' } },
            { emoji: '🌌🤴', suffix: { 'zh-Hant': '宇宙焦糖王子', 'en-US': 'Cosmic Caramel Prince', 'ja-JP': '宇宙キャラメル王子' } }
        ],
        'milk-tea-boba-prince': [
            { emoji: '❓🧋', suffix: { 'zh-Hant': '迷路珍珠', 'en-US': 'Lost Boba', 'ja-JP': '迷子タピオカ' } },
            { emoji: '🌱🥤', suffix: { 'zh-Hant': '奶茶見習生', 'en-US': 'Milk Tea Novice', 'ja-JP': 'ミルクティー初心者' } },
            { emoji: '⚔️🧋', suffix: { 'zh-Hant': '珍珠小騎士', 'en-US': 'Boba Little Knight', 'ja-JP': 'タピオカ小騎士' } },
            { emoji: '💼🧋', suffix: { 'zh-Hant': '珍珠管家', 'en-US': 'Boba Steward', 'ja-JP': 'タピオカ管家' } },
            { emoji: '🧪🥤', suffix: { 'zh-Hant': '奶茶調飲師', 'en-US': 'Milk Tea Mixer', 'ja-JP': 'ミルクティー調飲師' } },
            { emoji: '🧭🥤', suffix: { 'zh-Hant': '奶茶巡遊者', 'en-US': 'Milk Tea Explorer', 'ja-JP': 'ミルクティー探検者' } },
            { emoji: '🏰🧋', suffix: { 'zh-Hant': '珍珠城堡王子', 'en-US': 'Boba Castle Prince', 'ja-JP': 'タピオカ城王子' } },
            { emoji: '🗝️🧋', suffix: { 'zh-Hant': '珍珠總管', 'en-US': 'Boba Manager', 'ja-JP': 'タピオカ管理者' } },
            { emoji: '📜🥤', suffix: { 'zh-Hant': '王室奶茶顧問', 'en-US': 'Royal Milk Tea Advisor', 'ja-JP': '王室ミルクティー顧問' } },
            { emoji: '🎩🧋', suffix: { 'zh-Hant': '珍珠伯爵', 'en-US': 'Boba Earl', 'ja-JP': 'タピオカ伯爵' } },
            { emoji: '💎🧋', suffix: { 'zh-Hant': '珍珠公爵', 'en-US': 'Boba Duke', 'ja-JP': 'タピオカ公爵' } },
            { emoji: '🛡️🏰', suffix: { 'zh-Hant': '王都奶茶守護者', 'en-US': 'Capital Milk Tea Guardian', 'ja-JP': '王都ミルクティー守護者' } },
            { emoji: '👑🧋', suffix: { 'zh-Hant': '皇冠珍珠領主', 'en-US': 'Boba Crown Lord', 'ja-JP': 'タピオカクラウン領主' } },
            { emoji: '🌌🤴', suffix: { 'zh-Hant': '宇宙奶茶王子', 'en-US': 'Cosmic Milk Tea Prince', 'ja-JP': '宇宙ミルクティー王子' } }
        ],
        'black-forest-prince': [
            { emoji: '❓🍒', suffix: { 'zh-Hant': '迷路櫻桃', 'en-US': 'Lost Cherry', 'ja-JP': '迷子チェリー' } },
            { emoji: '🌱🌲', suffix: { 'zh-Hant': '森林見習生', 'en-US': 'Forest Novice', 'ja-JP': '森初心者' } },
            { emoji: '⚔️🍒', suffix: { 'zh-Hant': '黑森小騎士', 'en-US': 'Black Forest Little Knight', 'ja-JP': '黒森小騎士' } },
            { emoji: '💼🌲', suffix: { 'zh-Hant': '森林管家', 'en-US': 'Forest Steward', 'ja-JP': '森管家' } },
            { emoji: '⚒️🌲', suffix: { 'zh-Hant': '黑森匠師', 'en-US': 'Black Forest Master', 'ja-JP': '黒森匠師' } },
            { emoji: '🧭🌲', suffix: { 'zh-Hant': '黑森巡遊者', 'en-US': 'Black Forest Explorer', 'ja-JP': '黒森探検者' } },
            { emoji: '🏰🌲', suffix: { 'zh-Hant': '森林城堡王子', 'en-US': 'Forest Castle Prince', 'ja-JP': '森城王子' } },
            { emoji: '🗝️🌲', suffix: { 'zh-Hant': '森林總管', 'en-US': 'Forest Manager', 'ja-JP': '森管理者' } },
            { emoji: '📜🌲', suffix: { 'zh-Hant': '王室黑森顧問', 'en-US': 'Royal Black Forest Advisor', 'ja-JP': '王室黒森顧問' } },
            { emoji: '🎩🍒', suffix: { 'zh-Hant': '黑森林伯爵', 'en-US': 'Black Forest Earl', 'ja-JP': '黒森伯爵' } },
            { emoji: '💎🍒', suffix: { 'zh-Hant': '黑森林公爵', 'en-US': 'Black Forest Duke', 'ja-JP': '黒森公爵' } },
            { emoji: '🛡️🌲', suffix: { 'zh-Hant': '森林王都守護者', 'en-US': 'Capital Forest Guardian', 'ja-JP': '王都森守護者' } },
            { emoji: '👑🍒', suffix: { 'zh-Hant': '櫻桃皇冠領主', 'en-US': 'Cherry Crown Lord', 'ja-JP': 'チェリークラウン領主' } },
            { emoji: '🌌🤴', suffix: { 'zh-Hant': '宇宙黑森王子', 'en-US': 'Cosmic Black Forest Prince', 'ja-JP': '宇宙黒森王子' } }
        ],
        'coconut-snowball-prince': [
            { emoji: '❓🥥', suffix: { 'zh-Hant': '迷路椰雪', 'en-US': 'Lost Coconut Snow', 'ja-JP': '迷子ココナッツスノー' } },
            { emoji: '🌱❄️', suffix: { 'zh-Hant': '椰雪見習生', 'en-US': 'Coconut Snow Novice', 'ja-JP': 'ココナッツスノー初心者' } },
            { emoji: '⚔️🌨️', suffix: { 'zh-Hant': '雪球小騎士', 'en-US': 'Snowball Little Knight', 'ja-JP': 'スノーボール小騎士' } },
            { emoji: '💼🥥', suffix: { 'zh-Hant': '椰雪管家', 'en-US': 'Coconut Snow Steward', 'ja-JP': 'ココナッツスノー管家' } },
            { emoji: '⚒️🥥', suffix: { 'zh-Hant': '椰香匠師', 'en-US': 'Coconut Aroma Master', 'ja-JP': 'ココナッツアロマ匠師' } },
            { emoji: '🧭🥥', suffix: { 'zh-Hant': '椰雪巡遊者', 'en-US': 'Coconut Snow Explorer', 'ja-JP': 'ココナッツスノー探検者' } },
            { emoji: '🏰❄️', suffix: { 'zh-Hant': '雪堡王子', 'en-US': 'Snow Castle Prince', 'ja-JP': 'スノー城王子' } },
            { emoji: '🗝️🏰', suffix: { 'zh-Hant': '雪堡總管', 'en-US': 'Snow Castle Manager', 'ja-JP': 'スノー城管理者' } },
            { emoji: '📜🥥', suffix: { 'zh-Hant': '王室椰香顧問', 'en-US': 'Royal Coconut Aroma Advisor', 'ja-JP': '王室ココナッツアロマ顧問' } },
            { emoji: '🎩❄️', suffix: { 'zh-Hant': '椰雪伯爵', 'en-US': 'Coconut Snow Earl', 'ja-JP': 'ココナッツスノー伯爵' } },
            { emoji: '💎❄️', suffix: { 'zh-Hant': '椰雪公爵', 'en-US': 'Coconut Snow Duke', 'ja-JP': 'ココナッツスノー公爵' } },
            { emoji: '🛡️❄️', suffix: { 'zh-Hant': '王都椰雪守護者', 'en-US': 'Capital Coconut Snow Guardian', 'ja-JP': '王都ココナッツスノー守護者' } },
            { emoji: '👑🥥', suffix: { 'zh-Hant': '椰雪皇冠領主', 'en-US': 'Coconut Snow Crown Lord', 'ja-JP': 'ココナッツスノークラウン領主' } },
            { emoji: '🌌🤴', suffix: { 'zh-Hant': '宇宙椰雪王子', 'en-US': 'Cosmic Coconut Snow Prince', 'ja-JP': '宇宙ココナッツスノー王子' } }
        ],
    };

    const WEALTH_THEME_ALIAS = {};

    const resolveThemeIdForWealthTitle = (themeId) => {
        if (typeof themeId === 'string') {
            if (THEME_WEALTH_TITLES[themeId]) return themeId;
            const aliased = WEALTH_THEME_ALIAS[themeId];
            if (aliased && THEME_WEALTH_TITLES[aliased]) return aliased;
        }
        const domTheme = typeof document !== 'undefined' ? document.documentElement?.getAttribute('data-theme') : '';
        if (domTheme) {
            if (THEME_WEALTH_TITLES[domTheme]) return domTheme;
            const aliased = WEALTH_THEME_ALIAS[domTheme];
            if (aliased && THEME_WEALTH_TITLES[aliased]) return aliased;
        }
        return 'macaron-prince';
    };

    const getWealthTitle = (value, themeId, pageLanguage = 'zh-Hant') => {
        const numericValue = Number(value) || 0;
        const resolvedTheme = resolveThemeIdForWealthTitle(themeId);
        const rows = THEME_WEALTH_TITLES[resolvedTheme] || THEME_WEALTH_TITLES['macaron-prince'];
        const rankRows = WEALTH_RANKS_BY_LANGUAGE[pageLanguage] || WEALTH_RANKS_BY_LANGUAGE['zh-Hant'];
        const tierIndex = WEALTH_THRESHOLDS.findIndex(max => numericValue < max);
        const safeTierIndex = tierIndex >= 0 ? tierIndex : (WEALTH_THRESHOLDS.length - 1);
        const row = rows[safeTierIndex] || rows[rows.length - 1];
        let rank = rankRows[safeTierIndex] || rankRows[rankRows.length - 1];
        // 根據語言取 suffix
        const suffix = (row.suffix && row.suffix[pageLanguage]) || row.suffix['zh-Hant'] || '';
        // 移除 rank 內所有 emoji
        rank = rank.replace(/\p{Emoji}/gu, '').replace(row.emoji, '').trim();
        let label = `${rank} - ${suffix}`;
        return {
            max: WEALTH_THRESHOLDS[safeTierIndex],
            tierIndex: safeTierIndex,
            emoji: row.emoji || '',
            label
        };
    };

    const getNetWorthTier = (netWorthHKD, themeId, pageLanguage = 'zh-Hant') => getWealthTitle(netWorthHKD, themeId, pageLanguage);

    const calculateMortgageMetrics = ({ propertyPrice, ltvRatio, annualInterestRate, mortgageYears, paidPeriods }) => {
        const price = Number(propertyPrice) || 0;
        const ltv = Number(ltvRatio) || 0;
        const annualRate = Number(annualInterestRate) || 0;
        const years = Number(mortgageYears) || 0;
        const rawPaidPeriods = Number(paidPeriods) || 0;

        if (price <= 0 || ltv <= 0 || ltv > 100 || years <= 0 || annualRate < 0) return null;

        const loanAmount = price * (ltv / 100);
        const downPayment = price - loanAmount;
        const totalPeriods = Math.max(1, Math.round(years * 12));
        const monthlyRate = annualRate / 100 / 12;

        let monthlyPayment = 0;
        if (monthlyRate === 0) {
            monthlyPayment = loanAmount / totalPeriods;
        } else {
            const factor = Math.pow(1 + monthlyRate, totalPeriods);
            monthlyPayment = loanAmount * monthlyRate * factor / (factor - 1);
        }

        const totalInterest = monthlyPayment * totalPeriods - loanAmount;
        const paidPeriodsClamped = Math.min(Math.max(Math.floor(rawPaidPeriods), 0), totalPeriods);

        let outstandingPrincipal = 0;
        if (monthlyRate === 0) {
            outstandingPrincipal = loanAmount - monthlyPayment * paidPeriodsClamped;
        } else {
            const paidFactor = Math.pow(1 + monthlyRate, paidPeriodsClamped);
            outstandingPrincipal = loanAmount * paidFactor - monthlyPayment * ((paidFactor - 1) / monthlyRate);
        }

        outstandingPrincipal = Math.max(0, outstandingPrincipal);
        const remainingPeriods = Math.max(0, totalPeriods - paidPeriodsClamped);

        return {
            propertyPrice: price,
            ltvRatio: ltv,
            annualInterestRate: annualRate,
            mortgageYears: years,
            paidPeriods: paidPeriodsClamped,
            totalPeriods,
            remainingPeriods,
            downPayment,
            loanAmount,
            totalInterest,
            monthlyPayment,
            outstandingPrincipal
        };
    };

    const calculateInstallmentLoanMetrics = ({ loanPrincipal, annualInterestRate, loanYears, paidPeriods }) => {
        const principal = Number(loanPrincipal) || 0;
        const annualRate = Number(annualInterestRate) || 0;
        const years = Number(loanYears) || 0;
        const rawPaidPeriods = Number(paidPeriods) || 0;

        if (principal <= 0 || years <= 0 || annualRate < 0) return null;

        const totalPeriods = Math.max(1, Math.round(years * 12));
        const monthlyRate = annualRate / 100 / 12;
        let monthlyPayment = 0;

        if (monthlyRate === 0) {
            monthlyPayment = principal / totalPeriods;
        } else {
            const factor = Math.pow(1 + monthlyRate, totalPeriods);
            monthlyPayment = principal * monthlyRate * factor / (factor - 1);
        }

        const totalInterest = monthlyPayment * totalPeriods - principal;
        const paidPeriodsClamped = Math.min(Math.max(Math.floor(rawPaidPeriods), 0), totalPeriods);

        let outstandingPrincipal = 0;
        if (monthlyRate === 0) {
            outstandingPrincipal = principal - monthlyPayment * paidPeriodsClamped;
        } else {
            const paidFactor = Math.pow(1 + monthlyRate, paidPeriodsClamped);
            outstandingPrincipal = principal * paidFactor - monthlyPayment * ((paidFactor - 1) / monthlyRate);
        }

        outstandingPrincipal = Math.max(0, outstandingPrincipal);
        const remainingPeriods = Math.max(0, totalPeriods - paidPeriodsClamped);

        return {
            loanPrincipal: principal,
            annualInterestRate: annualRate,
            loanYears: years,
            paidPeriods: paidPeriodsClamped,
            totalPeriods,
            remainingPeriods,
            totalInterest,
            monthlyPayment,
            outstandingPrincipal
        };
    };

    const calculateFixedDepositMetrics = ({ principal, annualInterestRate, months }) => {
        const principalValue = Number(principal) || 0;
        const annualRate = Number(annualInterestRate) || 0;
        const termMonths = Number(months) || 0;

        if (principalValue <= 0 || termMonths <= 0 || annualRate < 0) return null;

        const maturityAmount = principalValue * (1 + (annualRate / 100) * (termMonths / 12));
        const interestAmount = maturityAmount - principalValue;

        return {
            principal: principalValue,
            annualInterestRate: annualRate,
            months: termMonths,
            maturityAmount,
            interestAmount
        };
    };

    const calculateBankWealthMetrics = ({ principal, guaranteedAnnualRate, maxAnnualRate, termDays }) => {
        const principalValue = Number(principal) || 0;
        const guaranteedRate = Number(guaranteedAnnualRate) || 0;
        const maxRate = Number(maxAnnualRate) || 0;
        const days = Number(termDays) || 0;

        if (principalValue <= 0 || days <= 0 || guaranteedRate < 0 || maxRate < 0 || maxRate < guaranteedRate) return null;

        const guaranteedMaturityAmount = principalValue * (1 + (guaranteedRate / 100) * (days / 365));
        const maxMaturityAmount = principalValue * (1 + (maxRate / 100) * (days / 365));
        const guaranteedInterestAmount = guaranteedMaturityAmount - principalValue;
        const maxInterestAmount = maxMaturityAmount - principalValue;

        return {
            principal: principalValue,
            guaranteedAnnualRate: guaranteedRate,
            maxAnnualRate: maxRate,
            termDays: days,
            guaranteedMaturityAmount,
            maxMaturityAmount,
            guaranteedInterestAmount,
            maxInterestAmount
        };
    };

    const pad2 = (value) => String(value).padStart(2, '0');
    const toDateKey = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
    const toMonthKey = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
    const parseDateKey = (dateKey) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey || '')) return null;
        const [year, month, day] = dateKey.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() !== year || date.getMonth() !== (month - 1) || date.getDate() !== day) return null;
        return date;
    };
    const normalizeDateKeyOrFallback = (rawValue, fallbackDate) => {
        const parsed = parseDateKey(rawValue || '');
        return parsed ? toDateKey(parsed) : toDateKey(fallbackDate);
    };
    const parseOccurrenceDateFromPostingKey = (occurrenceKey) => {
        if (typeof occurrenceKey !== 'string') return '';
        const parts = occurrenceKey.split('@');
        return parts.length >= 3 ? parts[1] : '';
    };

    const sanitizeCashflowEntries = (entries) => {
        if (!Array.isArray(entries)) return [];
        const validTypes = Object.keys(CASHFLOW_TYPES);
        const validFrequencies = CASHFLOW_FREQUENCIES.map(item => item.value);
        const validScheduleTypes = CASHFLOW_SCHEDULE_TYPES.map(item => item.value);

        return entries
            .filter(item => item && typeof item === 'object')
            .map(item => {
                const amount = Number(item.amount);
                const startDate = typeof item.startDate === 'string' ? item.startDate : '';
                const parsedStart = parseDateKey(startDate);
                if (!parsedStart || !Number.isFinite(amount) || amount <= 0) return null;

                const type = validTypes.includes(item.type) ? item.type : 'EXPENSE';
                const inferredScheduleType = item.frequency === 'ONE_TIME' ? 'ONE_TIME' : 'RECURRING';
                const scheduleType = validScheduleTypes.includes(item.scheduleType) ? item.scheduleType : inferredScheduleType;
                const frequency = scheduleType === 'ONE_TIME'
                    ? 'ONE_TIME'
                    : (validFrequencies.includes(item.frequency) && item.frequency !== 'ONE_TIME' ? item.frequency : 'MONTHLY');
                const currency = CURRENCIES.includes(item.currency) ? item.currency : 'HKD';
                const weekday = Number.isInteger(item.weekday) && item.weekday >= 0 && item.weekday <= 6
                    ? item.weekday
                    : parsedStart.getDay();
                const monthday = Number.isInteger(item.monthday) && item.monthday >= 1 && item.monthday <= 31
                    ? item.monthday
                    : parsedStart.getDate();
                const payday = Number.isInteger(item.payday) && item.payday >= 1 && item.payday <= 31
                    ? item.payday
                    : monthday;

                let endDate = typeof item.endDate === 'string' ? item.endDate : '';
                const parsedEnd = parseDateKey(endDate);
                if (!parsedEnd || parsedEnd.getTime() < parsedStart.getTime()) endDate = '';

                const categoryPool = CASHFLOW_CATEGORY_BY_TYPE[type] || CASHFLOW_CATEGORY_BY_TYPE.EXPENSE;
                const rawCategory = typeof item.category === 'string' ? item.category.trim() : '';
                const normalizedCategory = categoryPool.includes(rawCategory)
                    ? rawCategory
                    : getDefaultCashflowCategory(type);

                const oneTimeDates = scheduleType === 'ONE_TIME'
                    ? Array.from(new Set([
                        ...(Array.isArray(item.oneTimeDates) ? item.oneTimeDates : []),
                        startDate
                    ].filter(dateKey => Boolean(parseDateKey(dateKey))))).sort()
                    : [];

                const normalizedStartDate = scheduleType === 'ONE_TIME' && oneTimeDates.length
                    ? oneTimeDates[0]
                    : startDate;

                return {
                    id: typeof item.id === 'string' && item.id ? item.id : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                    title: typeof item.title === 'string' && item.title.trim() ? item.title.trim() : '未命名現金流',
                    account: typeof item.account === 'string' ? item.account.trim() : '',
                    category: normalizedCategory,
                    note: typeof item.note === 'string' ? item.note.trim() : '',
                    type,
                    amount,
                    currency,
                    startDate: normalizedStartDate,
                    oneTimeDates,
                    endDate: scheduleType === 'ONE_TIME' ? '' : endDate,
                    scheduleType,
                    frequency,
                    weekday,
                    monthday,
                    payday,
                    targetLiquidAssetId: typeof item.targetLiquidAssetId === 'string' ? item.targetLiquidAssetId : '',
                    linkedAssetId: typeof item.linkedAssetId === 'string' ? item.linkedAssetId : '',
                    linkedSource: typeof item.linkedSource === 'string' ? item.linkedSource : ''
                };
            })
            .filter(Boolean)
            .sort((a, b) => a.startDate.localeCompare(b.startDate));
    };

    const isEntryOnDate = (entry, date) => {
        const start = parseDateKey(entry.startDate);
        if (!start) return false;
        if (date.getTime() < start.getTime()) return false;

        const scheduleType = entry.scheduleType || (entry.frequency === 'ONE_TIME' ? 'ONE_TIME' : 'RECURRING');
        if (scheduleType === 'ONE_TIME') {
            const oneTimeDates = Array.isArray(entry.oneTimeDates) && entry.oneTimeDates.length
                ? entry.oneTimeDates
                : [entry.startDate];
            return oneTimeDates.includes(toDateKey(date));
        }

        const end = parseDateKey(entry.endDate);
        if (end && date.getTime() > end.getTime()) return false;

        if (entry.frequency === 'DAILY') return true;
        if (entry.frequency === 'WEEKLY') return date.getDay() === (Number(entry.weekday) || start.getDay());
        if (entry.frequency === 'MONTHLY') {
            const configuredDay = Number(entry.monthday) || start.getDate();
            const daysInCurrentMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
            const targetDay = Math.min(configuredDay, daysInCurrentMonth);
            return date.getDate() === targetDay;
        }
        if (entry.frequency === 'YEARLY') return date.getDate() === start.getDate() && date.getMonth() === start.getMonth();
        return false;
    };

    const findNextOccurrenceDateKey = (entry, fromDate = new Date(), maxLookAheadDays = 3650) => {
        const base = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
        for (let offset = 0; offset <= maxLookAheadDays; offset += 1) {
            const candidate = new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset);
            if (isEntryOnDate(entry, candidate)) return toDateKey(candidate);
        }
        return '';
    };

    const findLastOccurrenceDateKey = (entry, fromDate = new Date(), maxLookBackDays = 3650) => {
        const base = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
        for (let offset = 0; offset <= maxLookBackDays; offset += 1) {
            const candidate = new Date(base.getFullYear(), base.getMonth(), base.getDate() - offset);
            if (isEntryOnDate(entry, candidate)) return toDateKey(candidate);
        }
        return '';
    };

    async function ensureJsPdfReady() {
        if (window.jspdf?.jsPDF) return window.jspdf.jsPDF;

        const existing = document.getElementById('jspdf-runtime-loader');
        if (!existing) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.id = 'jspdf-runtime-loader';
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                script.onload = resolve;
                script.onerror = () => reject(new Error('jspdf load failed'));
                document.head.appendChild(script);
            });
        } else {
            await new Promise((resolve, reject) => {
                if (window.jspdf?.jsPDF) {
                    resolve();
                    return;
                }
                existing.addEventListener('load', resolve, { once: true });
                existing.addEventListener('error', () => reject(new Error('jspdf load failed')), { once: true });
            });
        }

        if (!window.jspdf?.jsPDF) throw new Error('jspdf unavailable');
        return window.jspdf.jsPDF;
    }

    async function ensureHtml2CanvasReady() {
        if (window.html2canvas) return window.html2canvas;

        const existing = document.getElementById('html2canvas-runtime-loader');
        if (!existing) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.id = 'html2canvas-runtime-loader';
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                script.onload = resolve;
                script.onerror = () => reject(new Error('html2canvas load failed'));
                document.head.appendChild(script);
            });
        } else {
            await new Promise((resolve, reject) => {
                if (window.html2canvas) {
                    resolve();
                    return;
                }
                existing.addEventListener('load', resolve, { once: true });
                existing.addEventListener('error', () => reject(new Error('html2canvas load failed')), { once: true });
            });
        }

        if (!window.html2canvas) throw new Error('html2canvas unavailable');
        return window.html2canvas;
    }

    window.APP_UTILS = {
        polarToCartesian,
        describeArc,
        seedAssets,
        parseStorage,
        sanitizeCurrencyRates,
        toHKD,
        fromHKD,
        formatAmount,
        getWealthTitle,
        getNetWorthTier,
        calculateMortgageMetrics,
        calculateInstallmentLoanMetrics,
        calculateFixedDepositMetrics,
        calculateBankWealthMetrics,
        pad2,
        toDateKey,
        toMonthKey,
        parseDateKey,
        normalizeDateKeyOrFallback,
        parseOccurrenceDateFromPostingKey,
        sanitizeCashflowEntries,
        isEntryOnDate,
        findNextOccurrenceDateKey,
        findLastOccurrenceDateKey,
        ensureJsPdfReady,
        ensureHtml2CanvasReady
    };
})();
