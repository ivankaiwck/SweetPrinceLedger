(() => {
    const THEMES = {
        'macaron-prince': {
            id: 'macaron-prince',
            label: '超甜馬卡龍王子',
            tokens: {
                '--bg-page': '#FFF9F5',
                '--text-main': '#5A4A42',
                '--text-sub': '#8C7A6E',
                '--panel-bg': '#FFFFFF',
                '--panel-soft': '#FEF5F7',
                '--header-bg-start': '#FEF5F7',
                '--header-bg-mid': '#F2FBFD',
                '--header-bg-end': '#FFF7EC',
                '--header-border': '#FFD1DC',
                '--primary': '#FFB6C1',
                '--primary-hover': '#FF9AB5',
                '--accent': '#A7D8DE',
                '--accent-hover': '#8CCFD6',
                '--gold': '#E8C39E',
                '--gold-hover': '#DDB88E',
                '--danger': '#FFB3BA',
                '--danger-hover': '#FFA5AE',
                '--card-net-start': '#FFB6C1',
                '--card-net-mid': '#C8B6FF',
                '--card-net-end': '#A7D8DE'
            }
        },
        'mint-prince': {
            id: 'mint-prince',
            label: '薄荷王子',
            tokens: {
                '--bg-page': '#F7FFFC',
                '--text-main': '#3F4A45',
                '--text-sub': '#6E7C76',
                '--panel-bg': '#FFFFFF',
                '--panel-soft': '#F2FCF8',
                '--header-bg-start': '#F2FCF8',
                '--header-bg-mid': '#EEF8FF',
                '--header-bg-end': '#FFF8F1',
                '--header-border': '#BFE9DC',
                '--primary': '#9EDBC8',
                '--primary-hover': '#89D1BA',
                '--accent': '#8EC5FF',
                '--accent-hover': '#7AB8F8',
                '--gold': '#E8C39E',
                '--gold-hover': '#DDB88E',
                '--danger': '#F6B7C1',
                '--danger-hover': '#EFA8B4',
                '--card-net-start': '#9EDBC8',
                '--card-net-mid': '#B8C9FF',
                '--card-net-end': '#8EC5FF'
            }
        },
        'lavender-prince': {
            id: 'lavender-prince',
            label: '薰衣草王子',
            tokens: {
                '--bg-page': '#FAF8FF',
                '--text-main': '#4E4562',
                '--text-sub': '#7A6E90',
                '--panel-bg': '#FFFFFF',
                '--panel-soft': '#F6F2FF',
                '--header-bg-start': '#F6F2FF',
                '--header-bg-mid': '#FBEFFD',
                '--header-bg-end': '#F2FAFF',
                '--header-border': '#DECDFE',
                '--primary': '#C8B6FF',
                '--primary-hover': '#B8A3FA',
                '--accent': '#A7D8DE',
                '--accent-hover': '#8CCFD6',
                '--gold': '#E8C39E',
                '--gold-hover': '#DDB88E',
                '--danger': '#FFB3CF',
                '--danger-hover': '#F7A1C1',
                '--card-net-start': '#C8B6FF',
                '--card-net-mid': '#FFB6C1',
                '--card-net-end': '#A7D8DE'
            }
        }
    };

    const THEME_OPTIONS = Object.values(THEMES).map(theme => ({ value: theme.id, label: theme.label }));

    const applyTheme = (themeId) => {
        const root = document.documentElement;
        const selected = THEMES[themeId] || THEMES['macaron-prince'];
        Object.entries(selected.tokens).forEach(([name, value]) => {
            root.style.setProperty(name, value);
        });
        root.setAttribute('data-theme', selected.id);
        return selected.id;
    };

    window.APP_THEME_SYSTEM = {
        THEMES,
        THEME_OPTIONS,
        applyTheme
    };
})();
