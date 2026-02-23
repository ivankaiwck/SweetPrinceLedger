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
            '負資產',
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
            { suffix: '迷路奶油球', emoji: '🍬⚠️' },
            { suffix: '馬卡龍新手', emoji: '🌱🍬' },
            { suffix: '糖霜小隊長', emoji: '🍀🧁' },
            { suffix: '草莓塔小管家', emoji: '🍓🛡️' },
            { suffix: '奶霜達人', emoji: '🗺️🍰' },
            { suffix: '甜圈巡遊者', emoji: '🚗🍩' },
            { suffix: '城堡甜點隊長', emoji: '🏡👑' },
            { suffix: '糖塔總管', emoji: '🏰✨' },
            { suffix: '王室甜點顧問', emoji: '💠🍰' },
            { suffix: '糖果伯爵', emoji: '💼🍭' },
            { suffix: '奶霜公爵', emoji: '💎🧁' },
            { suffix: '王都甜點守護者', emoji: '🏰🍰' },
            { suffix: '星糖皇冠領主', emoji: '🌟👑' },
            { suffix: '宇宙糖果王子', emoji: '🌌🍬' }
        ],
        'mint-prince': [
            { suffix: '迷路薄荷豆', emoji: '🌿⚠️' },
            { suffix: '薄荷巧克力新手', emoji: '🌱🍫' },
            { suffix: '可可小隊長', emoji: '🍀🍫' },
            { suffix: '薄荷管家', emoji: '🛡️🌿' },
            { suffix: '薄荷可可達人', emoji: '🗺️🍫' },
            { suffix: '薄荷巡遊者', emoji: '🚗🌿' },
            { suffix: '巧克力城堡王子', emoji: '🏡🍫' },
            { suffix: '薄荷總管', emoji: '🏙️🌿' },
            { suffix: '王室可可顧問', emoji: '💠🍫' },
            { suffix: '薄荷伯爵', emoji: '💼🌿' },
            { suffix: '巧克力公爵', emoji: '💎🍫' },
            { suffix: '王都薄荷守護者', emoji: '🏰🌿' },
            { suffix: '可可皇冠領主', emoji: '👑🍫' },
            { suffix: '宇宙薄荷王子', emoji: '🌌🌿' }
        ],
        'lavender-prince': [
            { suffix: '迷路薰衣草', emoji: '🌷⚠️' },
            { suffix: '薰衣草新手', emoji: '🌱🌷' },
            { suffix: '蜂蜜小隊長', emoji: '🍯✨' },
            { suffix: '薰香管家', emoji: '🛡️🌷' },
            { suffix: '薰衣草達人', emoji: '🗺️🌷' },
            { suffix: '蜂蜜巡遊者', emoji: '🚗🍯' },
            { suffix: '薰香城堡王子', emoji: '🏡🌷' },
            { suffix: '蜂蜜總管', emoji: '🏙️🍯' },
            { suffix: '王室薰香顧問', emoji: '💠🌷' },
            { suffix: '蜂蜜伯爵', emoji: '💼🍯' },
            { suffix: '薰香公爵', emoji: '💎🌷' },
            { suffix: '王都薰香守護者', emoji: '🏰🌷' },
            { suffix: '蜂蜜皇冠領主', emoji: '👑🍯' },
            { suffix: '宇宙薰香王子', emoji: '🌌🌷' }
        ],
        'strawberry-tart-prince': [
            { suffix: '迷路草莓籽', emoji: '🍓⚠️' },
            { suffix: '草莓見習生', emoji: '🌱🍓' },
            { suffix: '糖霜草莓騎士', emoji: '🍓🗡️' },
            { suffix: '草莓塔管家', emoji: '🍰🛡️' },
            { suffix: '草莓園匠師', emoji: '🍓🌿' },
            { suffix: '草莓巡遊者', emoji: '🚗🍓' },
            { suffix: '草莓城堡王子', emoji: '🏡🍓' },
            { suffix: '草莓塔總管', emoji: '🏰🍓' },
            { suffix: '王室草莓顧問', emoji: '💠🍓' },
            { suffix: '草莓伯爵', emoji: '💼🍓' },
            { suffix: '草莓公爵', emoji: '💎🍓' },
            { suffix: '草莓王都守護者', emoji: '🏰✨' },
            { suffix: '草莓皇冠領主', emoji: '👑🍓' },
            { suffix: '星糖草莓王子', emoji: '🌌🍓' }
        ],
        'caramel-pudding-prince': [
            { suffix: '迷路焦糖勺', emoji: '🍮⚠️' },
            { suffix: '布丁見習生', emoji: '🌱🍮' },
            { suffix: '焦糖小騎士', emoji: '🍮🗡️' },
            { suffix: '布丁管家', emoji: '🍮🛡️' },
            { suffix: '焦糖匠師', emoji: '🗺️🍮' },
            { suffix: '焦糖巡遊者', emoji: '🚗🍮' },
            { suffix: '布丁城堡王子', emoji: '🏡🍮' },
            { suffix: '焦糖總管', emoji: '🏙️🍮' },
            { suffix: '王室布丁顧問', emoji: '💠🍮' },
            { suffix: '焦糖伯爵', emoji: '💼🍮' },
            { suffix: '焦糖公爵', emoji: '💎🍮' },
            { suffix: '王都焦糖守護者', emoji: '🏰🍮' },
            { suffix: '皇冠布丁領主', emoji: '👑🍮' },
            { suffix: '宇宙焦糖王子', emoji: '🌌🍮' }
        ],
        'milk-tea-boba-prince': [
            { suffix: '迷路珍珠', emoji: '🍵⚠️' },
            { suffix: '奶茶見習生', emoji: '🌱🍵' },
            { suffix: '珍珠小騎士', emoji: '🍵🗡️' },
            { suffix: '珍珠管家', emoji: '🍵🛡️' },
            { suffix: '奶茶調飲師', emoji: '🗺️🍵' },
            { suffix: '奶茶巡遊者', emoji: '🚗🍵' },
            { suffix: '珍珠城堡王子', emoji: '🏡🍵' },
            { suffix: '珍珠總管', emoji: '🏙️🍵' },
            { suffix: '王室奶茶顧問', emoji: '💠🍵' },
            { suffix: '珍珠伯爵', emoji: '💼🍵' },
            { suffix: '珍珠公爵', emoji: '💎🍵' },
            { suffix: '王都奶茶守護者', emoji: '🏰🍵' },
            { suffix: '皇冠珍珠領主', emoji: '👑🍵' },
            { suffix: '宇宙奶茶王子', emoji: '🌌🍵' }
        ],
        'black-forest-prince': [
            { suffix: '迷路櫻桃', emoji: '🍒⚠️' },
            { suffix: '森林見習生', emoji: '🌱🍒' },
            { suffix: '黑森小騎士', emoji: '🍒🗡️' },
            { suffix: '森林管家', emoji: '🍒🛡️' },
            { suffix: '黑森匠師', emoji: '🗺️🍒' },
            { suffix: '黑森巡遊者', emoji: '🚗🍒' },
            { suffix: '森林城堡王子', emoji: '🏡🍒' },
            { suffix: '森林總管', emoji: '🏙️🍒' },
            { suffix: '王室黑森顧問', emoji: '💠🍒' },
            { suffix: '黑森林伯爵', emoji: '💼🍒' },
            { suffix: '黑森林公爵', emoji: '💎🍒' },
            { suffix: '森林王都守護者', emoji: '🏰🍒' },
            { suffix: '櫻桃皇冠領主', emoji: '👑🍒' },
            { suffix: '宇宙黑森王子', emoji: '🌌🍒' }
        ],
        'coconut-snowball-prince': [
            { suffix: '迷路椰雪', emoji: '🌴⚠️' },
            { suffix: '椰雪見習生', emoji: '🌱🌴' },
            { suffix: '雪球小騎士', emoji: '🌴🗡️' },
            { suffix: '椰雪管家', emoji: '🌴🛡️' },
            { suffix: '椰香匠師', emoji: '🗺️🌴' },
            { suffix: '椰雪巡遊者', emoji: '🚗🌴' },
            { suffix: '雪堡王子', emoji: '🏡🌴' },
            { suffix: '雪堡總管', emoji: '🏙️🌴' },
            { suffix: '王室椰香顧問', emoji: '💠🌴' },
            { suffix: '椰雪伯爵', emoji: '💼🌴' },
            { suffix: '椰雪公爵', emoji: '💎🌴' },
            { suffix: '王都椰雪守護者', emoji: '🏰🌴' },
            { suffix: '椰雪皇冠領主', emoji: '👑🌴' },
            { suffix: '宇宙椰雪王子', emoji: '🌌🌴' }
        ]
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
        const rank = rankRows[safeTierIndex] || rankRows[rankRows.length - 1];
        const label = pageLanguage === 'zh-Hant' ? `${rank} - ${row.suffix}` : rank;
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
                    targetLiquidAssetId: typeof item.targetLiquidAssetId === 'string' ? item.targetLiquidAssetId : ''
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
