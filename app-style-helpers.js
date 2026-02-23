(() => {
    const resolveThemeFamily = (rawThemeId) => {
        const familyMap = {
            'strawberry-tart-prince': 'macaron-prince',
            'caramel-pudding-prince': 'macaron-prince',
            'milk-tea-boba-prince': 'macaron-prince',
            'black-forest-prince': 'mint-prince',
            'coconut-snowball-prince': 'lavender-prince'
        };
        return familyMap[rawThemeId] || rawThemeId;
    };

    const buildNetworthCardStyle = (currentThemeId, tierIndex) => {
        const safeTier = Math.max(0, Math.min(13, Number(tierIndex) || 0));
        const resolvedThemeId = resolveThemeFamily(currentThemeId);
        const paletteByTheme = {
            'macaron-prince': ['--primary', '--accent', '--gold', '--danger'],
            'mint-prince': ['--primary', '--accent', '--gold', '--card-net-end'],
            'lavender-prince': ['--accent', '--card-net-end', '--gold', '--primary']
        };
        const selectedPalette = paletteByTheme[resolvedThemeId] || paletteByTheme['macaron-prince'];
        const startVar = selectedPalette[safeTier % selectedPalette.length];
        const midVar = selectedPalette[(safeTier + 1) % selectedPalette.length];
        const endVar = selectedPalette[(safeTier + 2) % selectedPalette.length];

        const angle = 92 + safeTier * 5;
        const startStrength = Math.min(86, 58 + safeTier * 2);
        const midStrength = Math.min(84, 54 + safeTier * 2);
        const endStrength = Math.min(82, 50 + safeTier * 2);

        const baseGradient = `linear-gradient(${angle}deg, color-mix(in srgb, var(${startVar}) ${startStrength}%, var(--panel-bg, #FFFFFF) ${100 - startStrength}%), color-mix(in srgb, var(${midVar}) ${midStrength}%, var(--panel-bg, #FFFFFF) ${100 - midStrength}%), color-mix(in srgb, var(${endVar}) ${endStrength}%, var(--panel-bg, #FFFFFF) ${100 - endStrength}%))`;

        const starOverlay = resolvedThemeId === 'mint-prince'
            ? `radial-gradient(circle at ${14 + safeTier * 2}% ${22 + safeTier}% , color-mix(in srgb, var(--gold, #F2D492) 76%, #ffffff 24%) 0 1.4px, transparent 2.4px), radial-gradient(circle at ${82 - safeTier}% ${24 + safeTier * 2}% , color-mix(in srgb, var(--gold, #F2D492) 68%, #ffffff 32%) 0 1.2px, transparent 2.1px)`
            : '';

        const borderStrength = Math.min(72, 40 + safeTier * 2);
        const glowStrength = safeTier >= 12 ? 30 : (safeTier >= 9 ? 22 : (safeTier >= 5 ? 14 : 8));
        const shadowStrength = safeTier >= 12 ? 0.35 : (safeTier >= 9 ? 0.28 : 0.2);

        return {
            background: starOverlay ? `${starOverlay}, ${baseGradient}` : baseGradient,
            border: `1px solid color-mix(in srgb, var(--gold, #E8C39E) ${borderStrength}%, var(--header-border, #FFD1DC) ${100 - borderStrength}%)`,
            boxShadow: `0 0 0 1px color-mix(in srgb, var(--gold, #E8C39E) ${glowStrength}%, transparent ${100 - glowStrength}%), 0 12px 26px color-mix(in srgb, var(--card-net-mid, #C8B6FF) ${Math.round(shadowStrength * 100)}%, transparent ${100 - Math.round(shadowStrength * 100)}%)`
        };
    };

    const buildSummaryCardStyle = (currentThemeId, tierIndex, variant = 'asset') => {
        const safeTier = Math.max(0, Math.min(13, Number(tierIndex) || 0));
        const resolvedThemeId = resolveThemeFamily(currentThemeId);
        const assetPaletteByTheme = {
            'macaron-prince': ['--primary', '--accent', '--gold'],
            'mint-prince': ['--primary', '--accent', '--card-net-end'],
            'lavender-prince': ['--accent', '--card-net-end', '--primary']
        };
        const liabilityPaletteByTheme = {
            'macaron-prince': ['--danger', '--primary', '--gold'],
            'mint-prince': ['--danger', '--primary', '--accent'],
            'lavender-prince': ['--danger', '--accent', '--card-net-end']
        };

        const paletteSource = variant === 'liability' ? liabilityPaletteByTheme : assetPaletteByTheme;
        const selectedPalette = paletteSource[resolvedThemeId] || paletteSource['macaron-prince'];
        const startVar = selectedPalette[safeTier % selectedPalette.length];
        const endVar = selectedPalette[(safeTier + 1) % selectedPalette.length];

        const tintStrength = Math.min(34, 14 + safeTier);
        const borderStrength = Math.min(62, 38 + safeTier);
        const shadowStrength = variant === 'liability'
            ? (safeTier >= 8 ? 18 : 12)
            : (safeTier >= 10 ? 16 : 10);

        return {
            background: `linear-gradient(135deg, color-mix(in srgb, var(${startVar}) ${tintStrength}%, var(--panel-bg, #FFFFFF) ${100 - tintStrength}%), color-mix(in srgb, var(${endVar}) ${Math.max(12, tintStrength - 6)}%, var(--panel-bg, #FFFFFF) ${100 - Math.max(12, tintStrength - 6)}%))`,
            border: `1px solid color-mix(in srgb, var(${startVar}) ${borderStrength}%, var(--header-border, #FFD1DC) ${100 - borderStrength}%)`,
            boxShadow: `0 1px 0 color-mix(in srgb, var(${endVar}) ${Math.max(10, borderStrength - 12)}%, transparent ${100 - Math.max(10, borderStrength - 12)}%), 0 8px 18px color-mix(in srgb, var(${startVar}) ${shadowStrength}%, transparent ${100 - shadowStrength})`
        };
    };

    const buildMixSelectedStyle = (currentThemeId, tierIndex) => {
        const safeTier = Math.max(0, Math.min(13, Number(tierIndex) || 0));
        const resolvedThemeId = resolveThemeFamily(currentThemeId);
        const paletteByTheme = {
            'macaron-prince': ['--primary', '--accent', '--gold'],
            'mint-prince': ['--primary', '--accent', '--gold'],
            'lavender-prince': ['--accent', '--card-net-end', '--gold']
        };
        const selectedPalette = paletteByTheme[resolvedThemeId] || paletteByTheme['macaron-prince'];
        const baseVar = selectedPalette[safeTier % selectedPalette.length];
        const borderVar = selectedPalette[(safeTier + 1) % selectedPalette.length];
        const tintStrength = Math.min(28, 14 + safeTier);
        const borderStrength = Math.min(66, 42 + safeTier);
        return {
            background: `color-mix(in srgb, var(${baseVar}) ${tintStrength}%, var(--panel-bg, #FFFFFF) ${100 - tintStrength}%)`,
            borderColor: `color-mix(in srgb, var(${borderVar}) ${borderStrength}%, var(--header-border, #FFD1DC) ${100 - borderStrength}%)`,
            boxShadow: `inset 0 0 0 1px color-mix(in srgb, var(${baseVar}) ${Math.max(20, borderStrength - 16)}%, transparent ${100 - Math.max(20, borderStrength - 16)}%)`
        };
    };

    const normalizeHexColor = (hex, fallback = '#8B5CF6') => {
        const raw = String(hex || '').trim().replace('#', '');
        if (raw.length === 3) {
            return `#${raw.split('').map(ch => ch + ch).join('')}`;
        }
        if (raw.length !== 6) return fallback;
        return `#${raw}`;
    };

    const hexToRgbObject = (hex) => {
        const normalized = normalizeHexColor(hex).replace('#', '');
        const r = Number.parseInt(normalized.slice(0, 2), 16);
        const g = Number.parseInt(normalized.slice(2, 4), 16);
        const b = Number.parseInt(normalized.slice(4, 6), 16);
        return {
            r: Number.isFinite(r) ? r : 139,
            g: Number.isFinite(g) ? g : 92,
            b: Number.isFinite(b) ? b : 246
        };
    };

    const toRgba = (hex, alpha) => {
        const { r, g, b } = hexToRgbObject(hex);
        const safeAlpha = Math.max(0, Math.min(1, Number(alpha) || 0));
        return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
    };

    const buildCategoryChipStyle = (baseColor, isActive) => {
        const normalized = normalizeHexColor(baseColor);
        if (isActive) {
            return {
                '--chip-base': normalized,
                '--chip-bg': normalized,
                '--chip-text': '#ffffff',
                '--chip-border': normalized,
                '--chip-shadow': `0 4px 10px ${toRgba(normalized, 0.24)}`
            };
        }
        return {
            '--chip-base': normalized,
            '--chip-bg': toRgba(normalized, 0.14),
            '--chip-text': toRgba(normalized, 0.96),
            '--chip-border': toRgba(normalized, 0.42),
            '--chip-shadow': 'none'
        };
    };

    const getCategoryMixHexByTheme = (themeId) => {
        const paletteByTheme = {
            'macaron-prince': {
                LIQUID: '#4FC7D4',
                INVEST: '#6D88FF',
                INSURANCE: '#9A7CFF',
                FIXED: '#E8B25C',
                RECEIVABLE: '#54C3A0',
                LIABILITY: '#FF5D7A'
            },
            'mint-prince': {
                LIQUID: '#55C6E6',
                INVEST: '#4A73D8',
                INSURANCE: '#7A6EFA',
                FIXED: '#E1B04B',
                RECEIVABLE: '#4FB58D',
                LIABILITY: '#D95B83'
            },
            'lavender-prince': {
                LIQUID: '#45C6D8',
                INVEST: '#4B9BE4',
                INSURANCE: '#6F7CFF',
                FIXED: '#E7AF4E',
                RECEIVABLE: '#50C1A7',
                LIABILITY: '#F76B92'
            },
            'strawberry-tart-prince': {
                LIQUID: '#5EC8B0',
                INVEST: '#5D8CFF',
                INSURANCE: '#9C78FF',
                FIXED: '#E8AB4D',
                RECEIVABLE: '#58BF93',
                LIABILITY: '#E84E74'
            },
            'caramel-pudding-prince': {
                LIQUID: '#55AFCB',
                INVEST: '#4F77C8',
                INSURANCE: '#876BD4',
                FIXED: '#D79B33',
                RECEIVABLE: '#4EA681',
                LIABILITY: '#CC6746'
            },
            'milk-tea-boba-prince': {
                LIQUID: '#5EAAC5',
                INVEST: '#5D74C0',
                INSURANCE: '#8573CC',
                FIXED: '#C99845',
                RECEIVABLE: '#5AA07A',
                LIABILITY: '#B86556'
            },
            'black-forest-prince': {
                LIQUID: '#4A8EAA',
                INVEST: '#4F62AF',
                INSURANCE: '#7867CE',
                FIXED: '#BE8C3A',
                RECEIVABLE: '#4A8E70',
                LIABILITY: '#85253A'
            },
            'coconut-snowball-prince': {
                LIQUID: '#87CFE2',
                INVEST: '#5D9EC1',
                INSURANCE: '#7B86E8',
                FIXED: '#D3B373',
                RECEIVABLE: '#6ABF9F',
                LIABILITY: '#B67A92'
            }
        };

        const fallbackPalette = paletteByTheme['macaron-prince'];
        const resolvedThemeId = paletteByTheme[themeId] ? themeId : resolveThemeFamily(themeId);
        const selectedPalette = paletteByTheme[resolvedThemeId] || fallbackPalette;

        return {
            LIQUID: selectedPalette.LIQUID,
            INVEST: selectedPalette.INVEST,
            INSURANCE: selectedPalette.INSURANCE,
            FIXED: selectedPalette.FIXED,
            RECEIVABLE: selectedPalette.RECEIVABLE,
            LIABILITY: selectedPalette.LIABILITY
        };
    };

    const getDetailMixPaletteByTheme = (themeId) => {
        const paletteByTheme = {
            'macaron-prince': ['#FF7FA9', '#4FC7D4', '#8F7BFF', '#E8B25C', '#57A0FF', '#FF5D7A', '#6CCF8A', '#C68BFF'],
            'mint-prince': ['#4C78DA', '#56C8E8', '#7C70FF', '#E2B24E', '#52B58F', '#D85A8E', '#5FA3F5', '#9F86FF'],
            'lavender-prince': ['#45A9E7', '#46C9B8', '#6E7DFF', '#E7AF4E', '#50C0FF', '#FF668B', '#63B8A7', '#9A87FF'],
            'strawberry-tart-prince': ['#E7486D', '#63C89D', '#9A77FF', '#E8AB4D', '#5A9DFF', '#E74F77', '#4DB9C1', '#BE7CFF'],
            'caramel-pudding-prince': ['#C56F2D', '#DB9E43', '#8E74DE', '#D79B33', '#4D8EE5', '#CD6A49', '#4EA68C', '#A483E8'],
            'milk-tea-boba-prince': ['#A5663B', '#B58A5A', '#8B79D4', '#C99845', '#5C98D8', '#B86556', '#5EAA95', '#9F87DB'],
            'black-forest-prince': ['#6B2434', '#A44962', '#7867CE', '#BE8C3A', '#4F8BCF', '#85253A', '#54997F', '#967BD8'],
            'coconut-snowball-prince': ['#5D9EC1', '#88CEE1', '#7B86E8', '#D3B373', '#4FAFD8', '#B77B93', '#71C2A9', '#9AA4EE']
        };

        const fallbackPalette = paletteByTheme['macaron-prince'];
        const resolvedThemeId = paletteByTheme[themeId] ? themeId : resolveThemeFamily(themeId);
        const selectedPalette = paletteByTheme[resolvedThemeId] || fallbackPalette;

        const getLuminance = (hex) => {
            const normalized = String(hex || '').replace('#', '');
            if (normalized.length !== 6) return 255;
            const red = parseInt(normalized.slice(0, 2), 16);
            const green = parseInt(normalized.slice(2, 4), 16);
            const blue = parseInt(normalized.slice(4, 6), 16);
            if (!Number.isFinite(red) || !Number.isFinite(green) || !Number.isFinite(blue)) return 255;
            return red * 0.299 + green * 0.587 + blue * 0.114;
        };

        return [...selectedPalette]
            .map((color, index) => ({ color, index, luminance: getLuminance(color) }))
            .sort((a, b) => {
                if (a.luminance === b.luminance) return a.index - b.index;
                return a.luminance - b.luminance;
            })
            .map(item => item.color);
    };

    window.APP_STYLE_HELPERS = {
        resolveThemeFamily,
        buildNetworthCardStyle,
        buildSummaryCardStyle,
        buildMixSelectedStyle,
        normalizeHexColor,
        hexToRgbObject,
        toRgba,
        buildCategoryChipStyle,
        getCategoryMixHexByTheme,
        getDetailMixPaletteByTheme
    };
})();
