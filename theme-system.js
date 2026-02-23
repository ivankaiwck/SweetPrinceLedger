(() => {
    const THEMES = {
        'macaron-prince': {
            id: 'macaron-prince',
            label: '馬卡龍奶油王子',
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
            label: '薄荷巧克力王子',
            tokens: {
                '--bg-page': '#FAF8FF',
                '--text-main': '#2F4366',
                '--text-sub': '#5F7596',
                '--panel-bg': '#FFFFFF',
                '--panel-soft': '#F6FAFF',
                '--header-bg-start': '#F1F6FF',
                '--header-bg-mid': '#FAF8FF',
                '--header-bg-end': '#F7FBFF',
                '--header-border': 'rgba(173, 201, 235, 0.28)',
                '--primary': '#6E89C8',
                '--primary-hover': '#5E78B6',
                '--accent': '#9EBBEA',
                '--accent-hover': '#8AA9DB',
                '--gold': '#F2D492',
                '--gold-hover': '#E8C39E',
                '--danger': '#E8BFD2',
                '--danger-hover': '#D9AFC3',
                '--card-net-start': '#6E89C8',
                '--card-net-mid': '#F2D492',
                '--card-net-end': '#9EBBEA'
            }
        },
        'lavender-prince': {
            id: 'lavender-prince',
            label: '薰衣草蜂蜜王子',
            tokens: {
                '--bg-page': '#F4FBFF',
                '--text-main': '#355166',
                '--text-sub': '#5F8197',
                '--panel-bg': '#FFFFFF',
                '--panel-soft': '#ECF7FF',
                '--header-bg-start': '#EAF6FF',
                '--header-bg-mid': '#E8FCFF',
                '--header-bg-end': '#F1F8FF',
                '--header-border': '#BFDFF4',
                '--primary': '#5FB5E8',
                '--primary-hover': '#4CA7DC',
                '--accent': '#7FD5C3',
                '--accent-hover': '#6CCCB8',
                '--gold': '#F1C27D',
                '--gold-hover': '#E6B56E',
                '--danger': '#FFAFC0',
                '--danger-hover': '#F89CAF',
                '--card-net-start': '#5FB5E8',
                '--card-net-mid': '#7FD5C3',
                '--card-net-end': '#9DDCFF'
            }
        },
        'strawberry-tart-prince': {
            id: 'strawberry-tart-prince',
            label: '草莓塔王子',
            tokens: {
                '--bg-page': '#FFF6F8',
                '--text-main': '#55333B',
                '--text-sub': '#87616C',
                '--panel-bg': '#FFFFFF',
                '--panel-soft': '#FFF0F4',
                '--header-bg-start': '#FFE6EE',
                '--header-bg-mid': '#FFF6F8',
                '--header-bg-end': '#FFF0F4',
                '--header-border': '#F3B6C7',
                '--primary': '#E85D75',
                '--primary-hover': '#D94B66',
                '--accent': '#B8E3C7',
                '--accent-hover': '#A6D6B7',
                '--gold': '#F1C37A',
                '--gold-hover': '#E6B469',
                '--danger': '#F28AA0',
                '--danger-hover': '#E97A92',
                '--card-net-start': '#E85D75',
                '--card-net-mid': '#F1C37A',
                '--card-net-end': '#B8E3C7'
            }
        },
        'caramel-pudding-prince': {
            id: 'caramel-pudding-prince',
            label: '焦糖布丁王子',
            tokens: {
                '--bg-page': '#FFF7EC',
                '--text-main': '#5A4127',
                '--text-sub': '#8B6A4A',
                '--panel-bg': '#FFFFFF',
                '--panel-soft': '#FFF0DD',
                '--header-bg-start': '#FFE7C9',
                '--header-bg-mid': '#FFF7EC',
                '--header-bg-end': '#FFEDD5',
                '--header-border': '#E6C08B',
                '--primary': '#C98543',
                '--primary-hover': '#B97737',
                '--accent': '#F1C07C',
                '--accent-hover': '#E5B06B',
                '--gold': '#E1B565',
                '--gold-hover': '#D0A24F',
                '--danger': '#E6A077',
                '--danger-hover': '#D98F66',
                '--card-net-start': '#C98543',
                '--card-net-mid': '#E1B565',
                '--card-net-end': '#F1C07C'
            }
        },
        'milk-tea-boba-prince': {
            id: 'milk-tea-boba-prince',
            label: '奶茶珍珠王子',
            tokens: {
                '--bg-page': '#FBF6F0',
                '--text-main': '#4F3F32',
                '--text-sub': '#7A6554',
                '--panel-bg': '#FFFFFF',
                '--panel-soft': '#F6EEE4',
                '--header-bg-start': '#F1E4D6',
                '--header-bg-mid': '#FBF6F0',
                '--header-bg-end': '#F3E7DA',
                '--header-border': '#D6C1AD',
                '--primary': '#B07A56',
                '--primary-hover': '#9D6948',
                '--accent': '#C9A989',
                '--accent-hover': '#BC9B7B',
                '--gold': '#D9B26A',
                '--gold-hover': '#C8A055',
                '--danger': '#C28A7C',
                '--danger-hover': '#B1786A',
                '--card-net-start': '#B07A56',
                '--card-net-mid': '#D9B26A',
                '--card-net-end': '#C9A989'
            }
        },
        'black-forest-prince': {
            id: 'black-forest-prince',
            label: '黑森林蛋糕王子',
            tokens: {
                '--bg-page': '#F7F2F4',
                '--text-main': '#3D2D34',
                '--text-sub': '#6A5560',
                '--panel-bg': '#FFFFFF',
                '--panel-soft': '#F1E7EB',
                '--header-bg-start': '#EADBE1',
                '--header-bg-mid': '#F7F2F4',
                '--header-bg-end': '#E6D3DB',
                '--header-border': '#C9A9B6',
                '--primary': '#6B2F3A',
                '--primary-hover': '#5B2630',
                '--accent': '#9C5A6A',
                '--accent-hover': '#8C4E5D',
                '--gold': '#C9A15A',
                '--gold-hover': '#B89148',
                '--danger': '#8E3A4C',
                '--danger-hover': '#7B2F3F',
                '--card-net-start': '#6B2F3A',
                '--card-net-mid': '#C9A15A',
                '--card-net-end': '#9C5A6A'
            }
        },
        'coconut-snowball-prince': {
            id: 'coconut-snowball-prince',
            label: '椰子雪球王子',
            tokens: {
                '--bg-page': '#F6FBFF',
                '--text-main': '#3A5366',
                '--text-sub': '#6D8798',
                '--panel-bg': '#FFFFFF',
                '--panel-soft': '#EDF6FB',
                '--header-bg-start': '#E6F2F9',
                '--header-bg-mid': '#F6FBFF',
                '--header-bg-end': '#E0EEF7',
                '--header-border': '#BFD7E7',
                '--primary': '#7FB2C7',
                '--primary-hover': '#6FA3BA',
                '--accent': '#BFE4EE',
                '--accent-hover': '#ACD9E6',
                '--gold': '#E3CFA2',
                '--gold-hover': '#D4BD8B',
                '--danger': '#D3AAB8',
                '--danger-hover': '#C598A7',
                '--card-net-start': '#7FB2C7',
                '--card-net-mid': '#E3CFA2',
                '--card-net-end': '#BFE4EE'
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
