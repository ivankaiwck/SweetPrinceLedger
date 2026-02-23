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

    const WEALTH_TITLE_BY_THEME = {
        'macaron-prince': [
            { max: 0, emoji: '🍭⚠️', label: '負資產 - 迷路小王子學徒' },
            { max: 100000, emoji: '🌱🍬', label: '糖果新兵 - 甜甜見習王子' },
            { max: 300000, emoji: '🍀🗡️', label: '初階騎士 - 薄荷劍士王子' },
            { max: 600000, emoji: '🌸🛡️', label: '櫻花守護者 - 玫瑰小騎士' },
            { max: 1000000, emoji: '🧭🍯', label: '蜂蜜工匠 - 王國甜點師王子' },
            { max: 2000000, emoji: '🚗💎', label: '銀糖騎士 - 馬卡龍巡遊王子' },
            { max: 5000000, emoji: '🏡👑', label: '金糖領主 - 城堡小王子' },
            { max: 8000000, emoji: '🏰✨', label: '星糖侯爵 - 魔法城堡管家' },
            { max: 12000000, emoji: '💠🍰', label: '奶油策士 - 王室甜點顧問' },
            { max: 20000000, emoji: '💼🌟', label: '伯爵甜心官 - 財富糖果大臣' },
            { max: 50000000, emoji: '💎🍭', label: '公爵閃耀官 - 皇冠糖果公爵' },
            { max: 100000000, emoji: '🏰👑', label: '王城守護王子 - 甜蜜王都守護者' },
            { max: 500000000, emoji: '🌟👑', label: '皇冠領主 - 星糖皇冠王子' },
            { max: Infinity, emoji: '🌌🍬', label: '星海甜君主 - 宇宙級糖果王子' }
        ],
        'mint-prince': [
            { max: 0, emoji: '🌿⚠️', label: '負資產 - 迷途薄荷學徒' },
            { max: 100000, emoji: '🍃🪙', label: '清風新兵 - 薄荷見習王子' },
            { max: 300000, emoji: '🌱🗡️', label: '晨露騎士 - 薄荷劍衛王子' },
            { max: 600000, emoji: '🫧🛡️', label: '薄霧守護者 - 清泉小騎士' },
            { max: 1000000, emoji: '🧭🍵', label: '茶香工匠 - 王國草本匠師' },
            { max: 2000000, emoji: '🚗❄️', label: '銀霜騎士 - 薄荷巡遊王子' },
            { max: 5000000, emoji: '🏡🌿', label: '翠玉領主 - 薄荷庭園王子' },
            { max: 8000000, emoji: '🏙️✨', label: '清輝侯爵 - 翡翠城管家' },
            { max: 12000000, emoji: '💠🍀', label: '薄荷策士 - 王室綠晶顧問' },
            { max: 20000000, emoji: '💼🌬️', label: '伯爵清風官 - 財富綠林大臣' },
            { max: 50000000, emoji: '💎🌱', label: '公爵晶葉官 - 翡翠皇冠公爵' },
            { max: 100000000, emoji: '🏰👑', label: '王城薄荷守護者 - 冰晶王都衛士' },
            { max: 500000000, emoji: '🌟👑', label: '皇冠森領主 - 星霧薄荷王子' },
            { max: Infinity, emoji: '🌌🍃', label: '星海森君主 - 宇宙級薄荷王子' }
        ],
        'lavender-prince': [
            { max: 0, emoji: '🪻⚠️', label: '負資產 - 迷途薰衣草學徒' },
            { max: 100000, emoji: '🌱🔮', label: '紫光新兵 - 薰衣草見習王子' },
            { max: 300000, emoji: '🍀🗡️', label: '月影騎士 - 紫晶劍士王子' },
            { max: 600000, emoji: '🌸🛡️', label: '暮霞守護者 - 紫玫小騎士' },
            { max: 1000000, emoji: '🧭🫖', label: '月露工匠 - 王國花香匠師' },
            { max: 2000000, emoji: '🚗💜', label: '銀月騎士 - 薰紫巡遊王子' },
            { max: 5000000, emoji: '🏡👑', label: '紫晶領主 - 月光城堡王子' },
            { max: 8000000, emoji: '🏰✨', label: '星霧侯爵 - 紫月城堡管家' },
            { max: 12000000, emoji: '💠🍰', label: '薰香策士 - 王室紫晶顧問' },
            { max: 20000000, emoji: '💼🌟', label: '伯爵月華官 - 財富星夜大臣' },
            { max: 50000000, emoji: '💎🪻', label: '公爵輝紫官 - 皇冠星紫公爵' },
            { max: 100000000, emoji: '🏰👑', label: '王城薰紫守護者 - 月都王城衛士' },
            { max: 500000000, emoji: '🌟👑', label: '皇冠星辰領主 - 紫曜皇冠王子' },
            { max: Infinity, emoji: '🌌🪻', label: '星海薰君主 - 宇宙級紫曜王子' }
        ]
    };

    const resolveThemeIdForWealthTitle = (themeId) => {
        if (typeof themeId === 'string' && WEALTH_TITLE_BY_THEME[themeId]) return themeId;
        const domTheme = typeof document !== 'undefined' ? document.documentElement?.getAttribute('data-theme') : '';
        if (domTheme && WEALTH_TITLE_BY_THEME[domTheme]) return domTheme;
        return 'macaron-prince';
    };

    const getWealthTitle = (value, themeId) => {
        const numericValue = Number(value) || 0;
        const resolvedTheme = resolveThemeIdForWealthTitle(themeId);
        const tiers = WEALTH_TITLE_BY_THEME[resolvedTheme] || WEALTH_TITLE_BY_THEME['macaron-prince'];
        return tiers.find(tier => numericValue < tier.max) || tiers[tiers.length - 1];
    };

    const getNetWorthTier = (netWorthHKD, themeId) => getWealthTitle(netWorthHKD, themeId);

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

                return {
                    id: typeof item.id === 'string' && item.id ? item.id : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                    title: typeof item.title === 'string' && item.title.trim() ? item.title.trim() : '未命名現金流',
                    account: typeof item.account === 'string' ? item.account.trim() : '',
                    category: normalizedCategory,
                    note: typeof item.note === 'string' ? item.note.trim() : '',
                    type,
                    amount,
                    currency,
                    startDate,
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
            return toDateKey(date) === entry.startDate;
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
