(() => {
    async function exportAssetReportPdf({
        assets,
        displayCurrency,
        pageLanguage,
        totals,
        assetMix,
        groupedAssets,
        cashflowMonthData,
        cashflowYearData,
        cashflowEntries,
        liquidAssetLabelById,
        cashflowAppliedPostings,
        parseOccurrenceDateFromPostingKey,
        themeTokens,
        categories,
        formatAmount,
        toHKD,
        fromHKD,
        ensureJsPdfReady,
        ensureHtml2CanvasReady,
        onProgress
    }) {
        let reportRoot = null;
        try {
            const { FULL_PAGE_TEXT_MAP } = window.APP_I18N || {};
            const dictionary = (FULL_PAGE_TEXT_MAP || {})[pageLanguage] || {};
            const translate = (text) => (pageLanguage === 'zh-Hant' ? text : (dictionary[text] || text));
            const tByLang = (zh, en, ja) => (pageLanguage === 'en-US' ? en : (pageLanguage === 'ja-JP' ? ja : zh));
            const dateTimeLocale = pageLanguage === 'ja-JP' ? 'ja-JP' : (pageLanguage === 'en-US' ? 'en-US' : 'zh-Hant-TW');
            const formatDateTime = (dateValue) => new Date(dateValue).toLocaleString(dateTimeLocale);
            const token = (name, fallback) => (themeTokens && themeTokens[name]) || fallback;
            const pageBg = token('--bg-page', '#ffffff');
            const textMain = token('--text-main', '#0f172a');
            const textSub = token('--text-sub', '#475569');
            const panelBg = token('--panel-bg', '#ffffff');
            const panelSoft = token('--panel-soft', '#f8fafc');
            const headerBorder = token('--header-border', '#cbd5e1');
            const emptyColor = token('--panel-soft', '#FCE7F3');
            const weekdayLabels = pageLanguage === 'en-US'
                ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                : (pageLanguage === 'ja-JP'
                    ? ['日', '月', '火', '水', '木', '金', '土']
                    : ['日', '一', '二', '三', '四', '五', '六']);

            const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
                const angleInRadians = (angleInDegrees - 90) * Math.PI / 180;
                return {
                    x: centerX + (radius * Math.cos(angleInRadians)),
                    y: centerY + (radius * Math.sin(angleInRadians))
                };
            };

            const describeDonutArc = (cx, cy, outerR, innerR, startAngle, endAngle) => {
                const startOuter = polarToCartesian(cx, cy, outerR, endAngle);
                const endOuter = polarToCartesian(cx, cy, outerR, startAngle);
                const startInner = polarToCartesian(cx, cy, innerR, startAngle);
                const endInner = polarToCartesian(cx, cy, innerR, endAngle);
                const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
                return [
                    `M ${startOuter.x} ${startOuter.y}`,
                    `A ${outerR} ${outerR} 0 ${largeArcFlag} 0 ${endOuter.x} ${endOuter.y}`,
                    `L ${startInner.x} ${startInner.y}`,
                    `A ${innerR} ${innerR} 0 ${largeArcFlag} 1 ${endInner.x} ${endInner.y}`,
                    'Z'
                ].join(' ');
            };

            const createDonutSvg = (rows, size, innerRadius) => {
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('width', size);
                svg.setAttribute('height', size);
                svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
                const cx = size / 2;
                const cy = size / 2;
                const outerR = size / 2;
                const innerR = innerRadius;

                const visibleRows = rows.filter(row => row.ratio > 0);
                if (!visibleRows.length) {
                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.setAttribute('cx', cx);
                    circle.setAttribute('cy', cy);
                    circle.setAttribute('r', outerR);
                    circle.setAttribute('fill', emptyColor);
                    svg.appendChild(circle);
                } else if (visibleRows.length === 1) {
                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.setAttribute('cx', cx);
                    circle.setAttribute('cy', cy);
                    circle.setAttribute('r', outerR);
                    circle.setAttribute('fill', visibleRows[0].hex || emptyColor);
                    svg.appendChild(circle);
                } else {
                    let currentAngle = 0;
                    visibleRows.forEach(row => {
                        const sweep = (row.ratio / 100) * 360;
                        const startAngle = currentAngle;
                        const endAngle = currentAngle + sweep;
                        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        path.setAttribute('d', describeDonutArc(cx, cy, outerR, innerR, startAngle, endAngle));
                        path.setAttribute('fill', row.hex);
                        svg.appendChild(path);
                        currentAngle = endAngle;
                    });
                }

                const hole = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                hole.setAttribute('cx', cx);
                hole.setAttribute('cy', cy);
                hole.setAttribute('r', innerR - 0.5);
                hole.setAttribute('fill', panelBg);
                svg.appendChild(hole);

                return svg;
            };

            const hexToRgb = (hex) => {
                const normalized = (hex || '').replace('#', '').trim();
                if (normalized.length === 3) {
                    const r = parseInt(normalized[0] + normalized[0], 16);
                    const g = parseInt(normalized[1] + normalized[1], 16);
                    const b = parseInt(normalized[2] + normalized[2], 16);
                    return Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b) ? null : { r, g, b };
                }
                if (normalized.length !== 6) return null;
                const r = parseInt(normalized.slice(0, 2), 16);
                const g = parseInt(normalized.slice(2, 4), 16);
                const b = parseInt(normalized.slice(4, 6), 16);
                return Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b) ? null : { r, g, b };
            };

            const rgbToHex = (rgb) => {
                if (!rgb) return null;
                const toHex = (value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
                return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
            };

            const rgbToHsl = (rgb) => {
                if (!rgb) return null;
                let r = rgb.r / 255;
                let g = rgb.g / 255;
                let b = rgb.b / 255;
                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                let h = 0;
                let s = 0;
                const l = (max + min) / 2;

                if (max !== min) {
                    const d = max - min;
                    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                    switch (max) {
                        case r:
                            h = (g - b) / d + (g < b ? 6 : 0);
                            break;
                        case g:
                            h = (b - r) / d + 2;
                            break;
                        default:
                            h = (r - g) / d + 4;
                            break;
                    }
                    h *= 60;
                }

                return { h, s, l };
            };

            const hslToRgb = (hsl) => {
                if (!hsl) return null;
                const h = hsl.h / 360;
                const s = hsl.s;
                const l = hsl.l;
                if (s === 0) {
                    const value = Math.round(l * 255);
                    return { r: value, g: value, b: value };
                }
                const hue2rgb = (p, q, t) => {
                    let next = t;
                    if (next < 0) next += 1;
                    if (next > 1) next -= 1;
                    if (next < 1 / 6) return p + (q - p) * 6 * next;
                    if (next < 1 / 2) return q;
                    if (next < 2 / 3) return p + (q - p) * (2 / 3 - next) * 6;
                    return p;
                };
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                const r = hue2rgb(p, q, h + 1 / 3);
                const g = hue2rgb(p, q, h);
                const b = hue2rgb(p, q, h - 1 / 3);
                return { r: r * 255, g: g * 255, b: b * 255 };
            };

            const hexToHsl = (hex) => {
                const rgb = hexToRgb(hex);
                return rgbToHsl(rgb);
            };

            const hslToHex = (hsl) => {
                const rgb = hslToRgb(hsl);
                return rgbToHex(rgb);
            };

            const buildCategoryPalette = (baseHex, count) => {
                if (count <= 1) return [baseHex];
                const baseHsl = hexToHsl(baseHex) || { h: 340, s: 0.65, l: 0.5 };
                const step = 360 / count;
                const minSat = 0.55;
                const minLight = 0.38;
                const maxLight = 0.62;
                const palette = [];
                for (let i = 0; i < count; i += 1) {
                    const h = (baseHsl.h + i * step) % 360;
                    const s = Math.max(minSat, baseHsl.s);
                    const l = Math.max(minLight, Math.min(maxLight, baseHsl.l));
                    palette.push(hslToHex({ h, s, l }) || baseHex);
                }
                return palette;
            };

            const mixWithWhite = (hex, strength = 0.2) => {
                const rgb = hexToRgb(hex);
                if (!rgb) return hex;
                const mix = {
                    r: rgb.r + (255 - rgb.r) * strength,
                    g: rgb.g + (255 - rgb.g) * strength,
                    b: rgb.b + (255 - rgb.b) * strength
                };
                return rgbToHex(mix) || hex;
            };

            if (typeof onProgress === 'function') onProgress(tByLang('正在準備 PDF...', 'Preparing PDF...', 'PDFを準備中...'));
            const jsPDF = await ensureJsPdfReady();
            const html2canvas = await ensureHtml2CanvasReady();

            if (typeof onProgress === 'function') onProgress(tByLang('正在轉換內容為 PDF...', 'Rendering PDF content...', 'PDFを生成中...'));

            const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 8;
            const contentWidth = pageWidth - margin * 2;
            const contentHeight = pageHeight - margin * 2;
            let hasContent = false;

            const renderRootToCanvas = async (root) => {
                document.body.appendChild(root);
                try {
                    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                    return await html2canvas(root, {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: pageBg
                    });
                } finally {
                    if (root.parentNode) root.parentNode.removeChild(root);
                }
            };

            const addCanvasToPdf = (canvas, allowSlice = true) => {
                const imgData = canvas.toDataURL('image/jpeg', 0.98);
                const imageHeight = (canvas.height * contentWidth) / canvas.width;
                if (!allowSlice) {
                    if (hasContent) doc.addPage();
                    doc.addImage(imgData, 'JPEG', margin, margin, contentWidth, imageHeight, undefined, 'FAST');
                    hasContent = true;
                    return;
                }

                let rendered = 0;
                while (rendered < imageHeight) {
                    if (hasContent) doc.addPage();
                    const y = margin - rendered;
                    doc.addImage(imgData, 'JPEG', margin, y, contentWidth, imageHeight, undefined, 'FAST');
                    rendered += contentHeight;
                    hasContent = true;
                }
            };

            const createReportRoot = () => {
                const root = document.createElement('div');
                root.style.position = 'fixed';
                root.style.left = '0';
                root.style.top = '0';
                root.style.width = '1024px';
                root.style.background = pageBg;
                root.style.color = textMain;
                root.style.padding = '24px';
                root.style.fontFamily = "'Noto Sans TC', sans-serif";
                root.style.opacity = '1';
                root.style.pointerEvents = 'none';
                root.style.zIndex = '99999';
                return root;
            };

            reportRoot = createReportRoot();

            const title = document.createElement('h1');
            title.textContent = tByLang('個人資產分享報表', 'Personal Asset Report', '個人資産レポート');
            title.style.fontSize = '24px';
            title.style.fontWeight = '800';
            title.style.margin = '0 0 8px 0';
            title.style.color = token('--primary', '#F472B6');
            reportRoot.appendChild(title);

            const meta = document.createElement('div');
            meta.textContent = tByLang(
                `產生時間：${formatDateTime(new Date())} ｜ 顯示幣種：${displayCurrency}`,
                `Generated: ${formatDateTime(new Date())} | Display Currency: ${displayCurrency}`,
                `作成日時：${formatDateTime(new Date())}｜表示通貨：${displayCurrency}`
            );
            meta.style.fontSize = '12px';
            meta.style.color = textSub;
            meta.style.marginBottom = '16px';
            reportRoot.appendChild(meta);

            const summaryWrap = document.createElement('div');
            summaryWrap.style.display = 'flex';
            summaryWrap.style.gap = '18px';
            summaryWrap.style.alignItems = 'flex-start';
            summaryWrap.style.marginBottom = '14px';

            const summary = document.createElement('div');
            summary.style.flex = '1';
            summary.style.fontSize = '12px';
            summary.style.lineHeight = '1.7';
            summary.innerHTML = [
                tByLang(`總資產：${formatAmount(totals.assets)} ${displayCurrency}`, `Total Assets: ${formatAmount(totals.assets)} ${displayCurrency}`, `総資産：${formatAmount(totals.assets)} ${displayCurrency}`),
                tByLang(`總負債：${formatAmount(totals.liabilities)} ${displayCurrency}`, `Total Liabilities: ${formatAmount(totals.liabilities)} ${displayCurrency}`, `総負債：${formatAmount(totals.liabilities)} ${displayCurrency}`),
                tByLang(`淨資產：${formatAmount(totals.netWorth)} ${displayCurrency}`, `Net Worth: ${formatAmount(totals.netWorth)} ${displayCurrency}`, `純資産：${formatAmount(totals.netWorth)} ${displayCurrency}`),
                tByLang(`積存餘額：${formatAmount(totals.accumulationBalance || 0)} ${displayCurrency}`, `Accumulated Balance: ${formatAmount(totals.accumulationBalance || 0)} ${displayCurrency}`, `積立残高：${formatAmount(totals.accumulationBalance || 0)} ${displayCurrency}`),
                tByLang(`負債比：${totals.debtRatio.toFixed(2)}%`, `Debt Ratio: ${totals.debtRatio.toFixed(2)}%`, `負債比率：${totals.debtRatio.toFixed(2)}%`),
                tByLang(`資產筆數：${assets.length} 筆`, `Asset Items: ${assets.length}`, `資産件数：${assets.length}`)
            ].map(line => `<div>${line}</div>`).join('');
            summaryWrap.appendChild(summary);

            const chartCard = document.createElement('div');
            chartCard.style.width = '50%';
            chartCard.style.flex = '0 0 50%';
            chartCard.style.padding = '10px';
            chartCard.style.border = `1px solid ${headerBorder}`;
            chartCard.style.borderRadius = '10px';
            chartCard.style.background = panelSoft;

            const chartTitle = document.createElement('div');
            chartTitle.textContent = tByLang('資產配比', 'Asset Allocation', '資産配分');
            chartTitle.style.fontSize = '12px';
            chartTitle.style.fontWeight = '700';
            chartTitle.style.marginBottom = '8px';
            chartCard.appendChild(chartTitle);

            const chartWrap = document.createElement('div');
            chartWrap.style.display = 'flex';
            chartWrap.style.alignItems = 'center';
            chartWrap.style.gap = '10px';
            chartWrap.style.justifyContent = 'space-between';

            const donutWrap = document.createElement('div');
            donutWrap.style.flex = '1 1 50%';
            donutWrap.style.display = 'flex';
            donutWrap.style.justifyContent = 'flex-end';
            const donut = createDonutSvg(assetMix.rows, 120, 32);
            donut.style.flexShrink = '0';
            donutWrap.appendChild(donut);

            const legend = document.createElement('div');
            legend.style.flex = '1 1 50%';
            legend.style.display = 'grid';
            legend.style.gap = '4px';
            assetMix.rows.forEach(row => {
                const item = document.createElement('div');
                item.style.display = 'flex';
                item.style.alignItems = 'center';
                item.style.justifyContent = 'space-between';
                item.style.fontSize = '10px';
                item.style.color = textMain;

                const left = document.createElement('div');
                left.style.display = 'flex';
                left.style.alignItems = 'center';
                left.style.gap = '5px';
                const dot = document.createElement('span');
                dot.style.width = '8px';
                dot.style.height = '8px';
                dot.style.borderRadius = '999px';
                dot.style.background = row.hex;
                const label = document.createElement('span');
                label.textContent = translate(row.label);
                left.appendChild(dot);
                left.appendChild(label);

                const value = document.createElement('span');
                value.textContent = `${row.ratio.toFixed(1)}% · ${formatAmount(row.amount)} ${displayCurrency}`;
                value.style.color = textSub;

                item.appendChild(left);
                item.appendChild(value);
                legend.appendChild(item);
            });

            chartWrap.appendChild(legend);
            chartWrap.appendChild(donutWrap);
            chartCard.appendChild(chartWrap);
            summaryWrap.appendChild(chartCard);
            reportRoot.appendChild(summaryWrap);

            const createSectionTitle = (text) => {
                const el = document.createElement('h2');
                el.textContent = text;
                el.style.fontSize = '14px';
                el.style.fontWeight = '700';
                el.style.margin = '16px 0 8px 0';
                return el;
            };

            const createSubTitle = (text) => {
                const el = document.createElement('div');
                el.textContent = text;
                el.style.fontSize = '12px';
                el.style.fontWeight = '700';
                el.style.margin = '10px 0 6px 0';
                return el;
            };

            const createTable = (headers, rightAlignIndices = []) => {
                const tableEl = document.createElement('table');
                tableEl.style.width = '100%';
                tableEl.style.borderCollapse = 'collapse';
                tableEl.style.fontSize = '11px';

                const headerRow = document.createElement('tr');
                headers.forEach((text, idx) => {
                    const th = document.createElement('th');
                    th.textContent = text;
                    th.style.border = `1px solid ${headerBorder}`;
                    th.style.color = textMain;
                    th.style.padding = '6px 8px';
                    th.style.textAlign = rightAlignIndices.includes(idx) ? 'right' : 'left';
                    headerRow.appendChild(th);
                });
                tableEl.appendChild(headerRow);
                return tableEl;
            };

            const parseInsuranceFundAccumulationBalance = (rawValue, currency) => {
                return String(rawValue || '')
                    .split(/\r?\n/)
                    .map(line => line.trim())
                    .filter(Boolean)
                    .reduce((sum, line) => {
                        const parts = line.split(/\||｜/).map(part => part.trim());
                        const rowAccumulationBalance = Number(parts[17] || 0);
                        if (!Number.isFinite(rowAccumulationBalance) || rowAccumulationBalance <= 0) return sum;
                        return sum + fromHKD(toHKD(rowAccumulationBalance, currency || 'HKD'), displayCurrency);
                    }, 0);
            };

            const resolveAssetAccumulationBalance = (asset) => {
                if (!asset) return 0;
                if (asset.category === 'INVEST' && asset.subtype === '基金' && asset.fundDistributionMode === 'accumulate') {
                    const amount = Number(asset.fundDistributionAccumulationBalance || 0);
                    return Number.isFinite(amount) && amount > 0
                        ? fromHKD(toHKD(amount, asset.currency || 'HKD'), displayCurrency)
                        : 0;
                }
                if (asset.category === 'INSURANCE' && ['投資型壽險', '投資/投資相連'].includes(asset.subtype)) {
                    const policyAccumulation = Number(asset.insuranceInvestmentDistributionAccumulationBalance || 0);
                    const policyAccumulationDisplay = Number.isFinite(policyAccumulation) && policyAccumulation > 0
                        ? fromHKD(toHKD(policyAccumulation, asset.currency || 'HKD'), displayCurrency)
                        : 0;
                    const fundRowsAccumulationDisplay = parseInsuranceFundAccumulationBalance(asset.insuranceInvestmentFundItems || '', asset.currency || 'HKD');
                    return policyAccumulationDisplay + fundRowsAccumulationDisplay;
                }
                return 0;
            };

            const summarizeDateList = (dates, max = 3) => {
                const list = Array.isArray(dates) ? dates.filter(Boolean) : [];
                if (list.length <= max) return list.join(', ');
                const head = list.slice(0, max).join(', ');
                return tByLang(
                    `${head} 等 ${list.length} 日`,
                    `${head} (+${list.length - max})`,
                    `${head} ほか${list.length - max}日`
                );
            };

            const getCashflowTypeLabel = (type) => (
                type === 'INCOME'
                    ? tByLang('收入', 'Income', '収入')
                    : tByLang('支出', 'Expense', '支出')
            );

            const getCashflowFrequencyLabel = (frequency) => {
                switch (frequency) {
                    case 'DAILY':
                        return tByLang('每日', 'Daily', '毎日');
                    case 'WEEKLY':
                        return tByLang('每週', 'Weekly', '毎週');
                    case 'YEARLY':
                        return tByLang('每年', 'Yearly', '毎年');
                    default:
                        return tByLang('每月', 'Monthly', '毎月');
                }
            };

            const buildScheduleLabel = (entry) => {
                const start = entry.startDate || '';
                const end = entry.endDate || '';
                const scheduleType = entry.scheduleType || (entry.frequency === 'ONE_TIME' ? 'ONE_TIME' : 'RECURRING');
                const frequency = entry.frequency || 'MONTHLY';
                if (scheduleType === 'ONE_TIME' || frequency === 'ONE_TIME') {
                    const dates = (entry.oneTimeDates && entry.oneTimeDates.length)
                        ? entry.oneTimeDates
                        : (start ? [start] : []);
                    const summary = summarizeDateList(dates);
                    return tByLang(`單次：${summary}`, `One-time: ${summary}`, `単発：${summary}`);
                }

                let detail = '';
                if (frequency === 'WEEKLY') {
                    const weekday = weekdayLabels[entry.weekday] || '';
                    detail = weekday ? tByLang(`（週${weekday}）`, ` (${weekday})`, `（${weekday}）`) : '';
                } else if (frequency === 'MONTHLY') {
                    const payday = Number(entry.payday || entry.monthday || 1);
                    detail = tByLang(`（每月 ${payday} 日）`, ` (day ${payday})`, `（毎月${payday}日）`);
                } else if (frequency === 'YEARLY' && start) {
                    const parsed = new Date(start);
                    if (!Number.isNaN(parsed.getTime())) {
                        const month = parsed.getMonth() + 1;
                        const day = parsed.getDate();
                        detail = tByLang(`（${month}月${day}日）`, ` (${month}/${day})`, `（${month}月${day}日）`);
                    }
                }

                const range = start ? (end ? `${start} ~ ${end}` : `${start} ~`) : '';
                const rangeSuffix = range ? ` ${range}` : '';
                return `${getCashflowFrequencyLabel(frequency)}${detail}${rangeSuffix}`;
            };

            const getYearFromDateString = (dateValue) => {
                const raw = typeof dateValue === 'string' ? dateValue : '';
                const year = Number(raw.slice(0, 4));
                return Number.isFinite(year) ? year : null;
            };

            const buildPostingSummaries = () => {
                const yearMap = {};
                const monthMap = {};
                const parsedYears = [];
                const postingMap = cashflowAppliedPostings || {};
                const postingKeys = Object.keys(postingMap);
                postingKeys.forEach(postingKey => {
                    const posting = postingMap[postingKey];
                    if (!posting) return;
                    const dateKey = typeof parseOccurrenceDateFromPostingKey === 'function'
                        ? parseOccurrenceDateFromPostingKey(postingKey)
                        : String(postingKey || '').split('@')[1];
                    if (!dateKey) return;
                    const year = Number(dateKey.slice(0, 4));
                    const monthIndex = Number(dateKey.slice(5, 7)) - 1;
                    if (!Number.isInteger(year) || monthIndex < 0 || monthIndex > 11) return;
                    parsedYears.push(year);

                    const signedAmount = Number(posting.signedAmount || 0);
                    const currency = posting.targetCurrency || displayCurrency;
                    const amountHKD = toHKD(Math.abs(signedAmount), currency);
                    const isIncome = signedAmount >= 0;

                    if (!yearMap[year]) yearMap[year] = { incomeHKD: 0, expenseHKD: 0 };
                    if (!monthMap[year]) monthMap[year] = Array.from({ length: 12 }, () => ({ incomeHKD: 0, expenseHKD: 0 }));

                    if (isIncome) {
                        yearMap[year].incomeHKD += amountHKD;
                        monthMap[year][monthIndex].incomeHKD += amountHKD;
                    } else {
                        yearMap[year].expenseHKD += amountHKD;
                        monthMap[year][monthIndex].expenseHKD += amountHKD;
                    }
                });

                if (!parsedYears.length) {
                    return { yearSummaries: [], monthMap: {} };
                }

                const years = Object.keys(yearMap).map(Number).sort((a, b) => b - a);
                const yearSummaries = years.map(year => {
                    const incomeHKD = yearMap[year].incomeHKD;
                    const expenseHKD = yearMap[year].expenseHKD;
                    return {
                        year,
                        incomeDisplay: fromHKD(incomeHKD, displayCurrency),
                        expenseDisplay: fromHKD(expenseHKD, displayCurrency),
                        netDisplay: fromHKD(incomeHKD - expenseHKD, displayCurrency)
                    };
                });

                return { yearSummaries, monthMap };
            };

            reportRoot.appendChild(createSectionTitle(tByLang('資產帳戶管理', 'Asset Account Management', '資産口座管理')));

            groupedAssets.forEach(group => {
                const categoryLabel = translate(categories[group.categoryKey]?.label || group.categoryKey);
                const categoryMixRow = assetMix.rows.find(row => row.categoryKey === group.categoryKey) || null;
                const baseColor = categoryMixRow?.hex || token('--primary', '#8B5CF6');
                const softColor = mixWithWhite(baseColor, 0.82);
                const categoryTotalHKD = group.accounts.reduce((sum, account) => sum + Number(account.accountTotalHKD || 0), 0);

                const categoryTitle = createSubTitle(categoryLabel);
                categoryTitle.style.color = baseColor;
                reportRoot.appendChild(categoryTitle);

                const categoryWrap = document.createElement('div');
                categoryWrap.style.display = 'flex';
                categoryWrap.style.alignItems = 'flex-start';
                categoryWrap.style.gap = '12px';
                categoryWrap.style.padding = '8px 10px';
                categoryWrap.style.borderRadius = '10px';
                categoryWrap.style.background = softColor;
                categoryWrap.style.border = `1px solid ${mixWithWhite(baseColor, 0.6)}`;

                const accountList = document.createElement('div');
                accountList.style.flex = '1 1 60%';
                accountList.style.display = 'grid';
                accountList.style.gap = '4px';

                const donutRows = [];
                const accountCount = group.accounts.length || 1;
                const accountPalette = buildCategoryPalette(baseColor, accountCount);
                group.accounts.forEach((account, index) => {
                    const item = document.createElement('div');
                    item.style.display = 'flex';
                    item.style.alignItems = 'center';
                    item.style.justifyContent = 'space-between';
                    item.style.fontSize = '10px';
                    item.style.color = textMain;

                    const left = document.createElement('div');
                    left.style.display = 'flex';
                    left.style.alignItems = 'center';
                    left.style.gap = '5px';
                    const dot = document.createElement('span');
                    dot.style.width = '8px';
                    dot.style.height = '8px';
                    dot.style.borderRadius = '999px';
                    const dotColor = accountPalette[index % accountPalette.length] || baseColor;
                    dot.style.background = dotColor;
                    const label = document.createElement('span');
                    label.textContent = account.accountName;
                    left.appendChild(dot);
                    left.appendChild(label);

                    const value = document.createElement('span');
                    const ratio = categoryTotalHKD > 0 ? (account.accountTotalHKD / categoryTotalHKD) * 100 : 0;
                    const valueDisplay = fromHKD(account.accountTotalHKD, displayCurrency);
                    value.textContent = `${ratio.toFixed(1)}% · ${formatAmount(valueDisplay)} ${displayCurrency}`;
                    value.style.color = textSub;

                    item.appendChild(left);
                    item.appendChild(value);
                    accountList.appendChild(item);

                    donutRows.push({
                        ratio,
                        hex: dotColor
                    });
                });

                const donutWrap = document.createElement('div');
                donutWrap.style.flex = '0 0 140px';
                donutWrap.style.display = 'flex';
                donutWrap.style.alignItems = 'center';
                donutWrap.style.justifyContent = 'flex-end';
                const donut = createDonutSvg(donutRows, 96, 26);
                donut.style.flexShrink = '0';
                donutWrap.appendChild(donut);

                categoryWrap.appendChild(accountList);
                categoryWrap.appendChild(donutWrap);
                reportRoot.appendChild(categoryWrap);
            });

            const summaryCanvas = await renderRootToCanvas(reportRoot);
            addCanvasToPdf(summaryCanvas, true);

            const buildAssetDetailsTable = (assetRows, startIndex) => {
                const table = document.createElement('table');
                table.style.width = '100%';
                table.style.borderCollapse = 'collapse';
                table.style.fontSize = '11px';

                const headRow = document.createElement('tr');
                [
                    tByLang('#', '#', '#'),
                    tByLang('類別', 'Category', 'カテゴリ'),
                    tByLang('細項', 'Subtype', '内訳'),
                    tByLang('帳戶', 'Account', '口座'),
                    tByLang('名稱', 'Name', '名称'),
                    tByLang('幣種', 'Currency', '通貨'),
                    tByLang('市值', 'Market Value', '時価'),
                    tByLang('積存餘額', 'Accumulated Balance', '積立残高')
                ].forEach((text, idx) => {
                    const th = document.createElement('th');
                    th.textContent = text;
                    th.style.border = `1px solid ${headerBorder}`;
                    th.style.color = textMain;
                    th.style.padding = '6px 8px';
                    th.style.textAlign = (idx === 0 || idx === 6 || idx === 7) ? 'right' : 'left';
                    headRow.appendChild(th);
                });
                table.appendChild(headRow);

                assetRows.forEach((item, index) => {
                    const row = document.createElement('tr');
                    const marketValueOrig = Number(item.quantity || 0) * Number(item.currentPrice || 0);
                    const marketValueDisplay = fromHKD(toHKD(marketValueOrig, item.currency), displayCurrency);
                    const accumulationBalanceDisplay = resolveAssetAccumulationBalance(item);
                    const cells = [
                        String(startIndex + index + 1),
                        translate(categories[item.category]?.label || item.category),
                        translate(item.subtype || ''),
                        item.account || '',
                        item.name || '',
                        item.currency || '',
                        `${formatAmount(marketValueDisplay)} ${displayCurrency}`,
                        `${formatAmount(accumulationBalanceDisplay)} ${displayCurrency}`
                    ];
                    cells.forEach((value, i) => {
                        const td = document.createElement('td');
                        td.textContent = value;
                        td.style.border = `1px solid ${headerBorder}`;
                        td.style.color = textMain;
                        td.style.padding = '6px 8px';
                        td.style.textAlign = (i === 0 || i === 6 || i === 7) ? 'right' : 'left';
                        row.appendChild(td);
                    });
                    table.appendChild(row);
                });

                return table;
            };

            const categoryOrder = Object.keys(categories || {});
            const categoryRank = new Map(categoryOrder.map((key, index) => [key, index]));
            const sortedAssets = [...(assets || [])].sort((a, b) => {
                const rankA = categoryRank.get(a.category) ?? 999;
                const rankB = categoryRank.get(b.category) ?? 999;
                if (rankA !== rankB) return rankA - rankB;
                const subtypeA = String(a.subtype || '');
                const subtypeB = String(b.subtype || '');
                const subtypeDiff = subtypeA.localeCompare(subtypeB, 'zh-Hant', { sensitivity: 'base' });
                if (subtypeDiff) return subtypeDiff;
                const accountA = String(a.account || '');
                const accountB = String(b.account || '');
                const accountDiff = accountA.localeCompare(accountB, 'zh-Hant', { sensitivity: 'base' });
                if (accountDiff) return accountDiff;
                return String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hant', { sensitivity: 'base' });
            });

            const assetRowsPerPage = 22;
            const assetChunks = [];
            for (let i = 0; i < sortedAssets.length; i += assetRowsPerPage) {
                assetChunks.push(sortedAssets.slice(i, i + assetRowsPerPage));
            }

            if (!assetChunks.length) {
                reportRoot = createReportRoot();
                reportRoot.appendChild(createSectionTitle(tByLang('資產明細', 'Asset Details', '資産明細')));
                const emptyNote = document.createElement('div');
                emptyNote.style.fontSize = '11px';
                emptyNote.style.color = textSub;
                emptyNote.textContent = tByLang('尚未建立資產明細', 'No asset details yet', '資産明細がまだありません');
                reportRoot.appendChild(emptyNote);
                const emptyCanvas = await renderRootToCanvas(reportRoot);
                addCanvasToPdf(emptyCanvas, false);
            } else {
                for (let index = 0; index < assetChunks.length; index += 1) {
                    const chunk = assetChunks[index];
                    reportRoot = createReportRoot();
                    const titleText = assetChunks.length > 1
                        ? tByLang(
                            `資產明細（第 ${index + 1} / ${assetChunks.length} 頁）`,
                            `Asset Details (${index + 1}/${assetChunks.length})`,
                            `資産明細（${index + 1} / ${assetChunks.length}）`
                        )
                        : tByLang('資產明細', 'Asset Details', '資産明細');
                    reportRoot.appendChild(createSectionTitle(titleText));
                    reportRoot.appendChild(buildAssetDetailsTable(chunk, index * assetRowsPerPage));
                    const detailCanvas = await renderRootToCanvas(reportRoot);
                    addCanvasToPdf(detailCanvas, false);
                }
            }

            reportRoot = createReportRoot();
            reportRoot.appendChild(createSectionTitle(tByLang('現金流記帳與收益月曆', 'Cashflow Records & Earnings Calendar', 'キャッシュフロー記帳と収益カレンダー')));

            const cashflowMeta = document.createElement('div');
            cashflowMeta.style.fontSize = '11px';
            cashflowMeta.style.color = textSub;
            cashflowMeta.style.marginBottom = '8px';
            cashflowMeta.textContent = tByLang(
                `年度：${cashflowYearData.year} ｜ 月份：${cashflowMonthData.year}-${String(cashflowMonthData.month + 1).padStart(2, '0')}`,
                `Year: ${cashflowYearData.year} | Month: ${cashflowMonthData.year}-${String(cashflowMonthData.month + 1).padStart(2, '0')}`,
                `年：${cashflowYearData.year}｜月：${cashflowMonthData.year}-${String(cashflowMonthData.month + 1).padStart(2, '0')}`
            );
            reportRoot.appendChild(cashflowMeta);

            const postingSummaries = buildPostingSummaries();

            reportRoot.appendChild(createSectionTitle(tByLang('年度收入/支出/淨流', 'Yearly Income/Expense/Net', '年間 収入/支出/純フロー')));
            const yearlyTable = createTable(
                [
                    tByLang('年度', 'Year', '年'),
                    tByLang('收入', 'Income', '収入'),
                    tByLang('支出', 'Expense', '支出'),
                    tByLang('淨流', 'Net', '純フロー')
                ],
                [1, 2, 3]
            );
            if (!postingSummaries.yearSummaries.length) {
                const row = document.createElement('tr');
                const td = document.createElement('td');
                td.textContent = tByLang('尚無入帳記錄', 'No posted records yet', '入出金記録はまだありません');
                td.style.border = `1px solid ${headerBorder}`;
                td.style.color = textSub;
                td.style.padding = '6px 8px';
                td.style.textAlign = 'left';
                td.colSpan = 4;
                row.appendChild(td);
                yearlyTable.appendChild(row);
            } else {
                postingSummaries.yearSummaries.forEach(summary => {
                    const row = document.createElement('tr');
                    const cells = [
                        String(summary.year),
                        `${formatAmount(summary.incomeDisplay)} ${displayCurrency}`,
                        `${formatAmount(summary.expenseDisplay)} ${displayCurrency}`,
                        `${formatAmount(summary.netDisplay)} ${displayCurrency}`
                    ];
                    cells.forEach((value, idx) => {
                        const td = document.createElement('td');
                        td.textContent = value;
                        td.style.border = `1px solid ${headerBorder}`;
                        td.style.color = textMain;
                        td.style.padding = '6px 8px';
                        td.style.textAlign = idx === 0 ? 'left' : 'right';
                        row.appendChild(td);
                    });
                    yearlyTable.appendChild(row);
                });
            }
            reportRoot.appendChild(yearlyTable);

            reportRoot.appendChild(createSectionTitle(tByLang('年度每月收入/支出/淨流', 'Monthly Breakdown for Selected Year', '選択年の月別 収入/支出/純フロー')));
            const yearTable = createTable(
                [
                    tByLang('月份', 'Month', '月'),
                    tByLang('收入', 'Income', '収入'),
                    tByLang('支出', 'Expense', '支出'),
                    tByLang('淨流', 'Net', '純フロー')
                ],
                [1, 2, 3]
            );
            const selectedYear = cashflowYearData.year;
            const selectedMonthRows = postingSummaries.monthMap[selectedYear]
                || Array.from({ length: 12 }, () => ({ incomeHKD: 0, expenseHKD: 0 }));
            const filteredMonthRows = selectedMonthRows
                .map((monthItem, monthIndex) => ({ monthIndex, ...monthItem }))
                .filter(item => (item.incomeHKD || 0) !== 0 || (item.expenseHKD || 0) !== 0);

            if (!filteredMonthRows.length) {
                const row = document.createElement('tr');
                const td = document.createElement('td');
                td.textContent = tByLang('所選年度尚無入帳記錄', 'No posted records for selected year', '選択年の入出金記録はありません');
                td.style.border = `1px solid ${headerBorder}`;
                td.style.color = textSub;
                td.style.padding = '6px 8px';
                td.style.textAlign = 'left';
                td.colSpan = 4;
                row.appendChild(td);
                yearTable.appendChild(row);
            } else {
                filteredMonthRows.forEach(monthItem => {
                const row = document.createElement('tr');
                const monthLabel = tByLang(
                    `${monthItem.monthIndex + 1} 月`,
                    `M${monthItem.monthIndex + 1}`,
                    `${monthItem.monthIndex + 1}月`
                );
                const incomeDisplay = fromHKD(monthItem.incomeHKD, displayCurrency);
                const expenseDisplay = fromHKD(monthItem.expenseHKD, displayCurrency);
                const netDisplay = fromHKD(monthItem.incomeHKD - monthItem.expenseHKD, displayCurrency);
                const cells = [
                    monthLabel,
                    `${formatAmount(incomeDisplay)} ${displayCurrency}`,
                    `${formatAmount(expenseDisplay)} ${displayCurrency}`,
                    `${formatAmount(netDisplay)} ${displayCurrency}`
                ];
                cells.forEach((value, idx) => {
                    const td = document.createElement('td');
                    td.textContent = value;
                    td.style.border = `1px solid ${headerBorder}`;
                    td.style.color = textMain;
                    td.style.padding = '6px 8px';
                    td.style.textAlign = idx === 0 ? 'left' : 'right';
                    row.appendChild(td);
                });
                yearTable.appendChild(row);
                });
            }
            reportRoot.appendChild(yearTable);

            reportRoot.appendChild(createSectionTitle(tByLang('現金流規則清單', 'Cashflow Rules', 'キャッシュフロー規則一覧')));
            const ruleTable = createTable(
                [
                    tByLang('名稱', 'Title', '名称'),
                    tByLang('類型', 'Type', '種類'),
                    tByLang('分類', 'Category', '分類'),
                    tByLang('排程', 'Schedule', 'スケジュール'),
                    tByLang('金額', 'Amount', '金額'),
                    tByLang('幣種', 'Currency', '通貨'),
                    tByLang('綁定帳戶', 'Linked Account', '連携口座')
                ],
                [4]
            );

            const sortedRules = [...(cashflowEntries || [])].sort((a, b) => {
                if (a.type !== b.type) return a.type === 'INCOME' ? -1 : 1;
                return (a.title || '').localeCompare((b.title || ''), 'zh-Hant', { sensitivity: 'base' });
            });

            if (sortedRules.length === 0) {
                const row = document.createElement('tr');
                const td = document.createElement('td');
                td.textContent = tByLang('尚未建立現金流規則', 'No cashflow rules yet', 'キャッシュフロー規則はまだありません');
                td.style.border = `1px solid ${headerBorder}`;
                td.style.color = textSub;
                td.style.padding = '6px 8px';
                td.style.textAlign = 'left';
                td.colSpan = 7;
                row.appendChild(td);
                ruleTable.appendChild(row);
            } else {
                sortedRules.forEach(entry => {
                    const row = document.createElement('tr');
                    const accountLabel = entry.targetLiquidAssetId
                        ? (liquidAssetLabelById?.[entry.targetLiquidAssetId] || entry.account || '')
                        : (entry.account || tByLang('未綁定', 'Unlinked', '未連携'));
                    const cells = [
                        entry.title || '',
                        getCashflowTypeLabel(entry.type),
                        translate(entry.category || ''),
                        buildScheduleLabel(entry),
                        formatAmount(entry.amount),
                        entry.currency || '',
                        accountLabel
                    ];
                    cells.forEach((value, idx) => {
                        const td = document.createElement('td');
                        td.textContent = value;
                        td.style.border = `1px solid ${headerBorder}`;
                        td.style.color = textMain;
                        td.style.padding = '6px 8px';
                        td.style.textAlign = idx === 4 ? 'right' : 'left';
                        row.appendChild(td);
                    });
                    ruleTable.appendChild(row);
                });
            }
            reportRoot.appendChild(ruleTable);
            const cashflowCanvas = await renderRootToCanvas(reportRoot);
            addCanvasToPdf(cashflowCanvas, true);

            const fileName = `asset-report-${new Date().toISOString().slice(0, 10)}.pdf`;
            const pdfBlob = doc.output('blob');
            const downloadUrl = URL.createObjectURL(pdfBlob);
            const anchor = document.createElement('a');
            anchor.href = downloadUrl;
            anchor.download = fileName;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(downloadUrl);
        } finally {
            if (reportRoot && reportRoot.parentNode) {
                reportRoot.parentNode.removeChild(reportRoot);
            }
        }
    }

    window.APP_REPORT_EXPORT = {
        exportAssetReportPdf
    };
})();
