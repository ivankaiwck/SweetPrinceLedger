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

            if (typeof onProgress === 'function') onProgress(tByLang('正在準備 PDF...', 'Preparing PDF...', 'PDFを準備中...'));
            const jsPDF = await ensureJsPdfReady();
            const html2canvas = await ensureHtml2CanvasReady();

            if (typeof onProgress === 'function') onProgress(tByLang('正在轉換內容為 PDF...', 'Rendering PDF content...', 'PDFを生成中...'));

            reportRoot = document.createElement('div');
            reportRoot.style.position = 'fixed';
            reportRoot.style.left = '0';
            reportRoot.style.top = '0';
            reportRoot.style.width = '1024px';
            reportRoot.style.background = pageBg;
            reportRoot.style.color = textMain;
            reportRoot.style.padding = '24px';
            reportRoot.style.fontFamily = "'Noto Sans TC', sans-serif";
            reportRoot.style.opacity = '1';
            reportRoot.style.pointerEvents = 'none';
            reportRoot.style.zIndex = '99999';

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

            reportRoot.appendChild(createSectionTitle(tByLang('按帳戶匯總', 'By Account Summary', '口座別サマリー')));
            const accountSummaryTable = createTable(
                [
                    tByLang('類別', 'Category', 'カテゴリ'),
                    tByLang('帳戶', 'Account', '口座'),
                    tByLang('筆數', 'Count', '件数'),
                    tByLang('總市值', 'Total Value', '総時価')
                ],
                [2, 3]
            );
            groupedAssets.forEach(group => {
                group.accounts.forEach(account => {
                    const row = document.createElement('tr');
                    const valueDisplay = fromHKD(account.accountTotalHKD, displayCurrency);
                    const cells = [
                        translate(categories[group.categoryKey]?.label || group.categoryKey),
                        account.accountName,
                        String(account.items.length),
                        `${formatAmount(valueDisplay)} ${displayCurrency}`
                    ];
                    cells.forEach((value, idx) => {
                        const td = document.createElement('td');
                        td.textContent = value;
                        td.style.border = `1px solid ${headerBorder}`;
                        td.style.color = textMain;
                        td.style.padding = '6px 8px';
                        td.style.textAlign = idx >= 2 ? 'right' : 'left';
                        row.appendChild(td);
                    });
                    accountSummaryTable.appendChild(row);
                });
            });
            reportRoot.appendChild(accountSummaryTable);

            reportRoot.appendChild(createSectionTitle(tByLang('資產明細', 'Asset Details', '資産明細')));

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
                tByLang('市值', 'Market Value', '時価')
            ].forEach((text, idx) => {
                const th = document.createElement('th');
                th.textContent = text;
                th.style.border = `1px solid ${headerBorder}`;
                th.style.background = panelSoft;
                th.style.color = textMain;
                th.style.padding = '6px 8px';
                th.style.textAlign = (idx === 0 || idx === 6) ? 'right' : 'left';
                headRow.appendChild(th);
            });
            table.appendChild(headRow);

            assets.forEach((item, index) => {
                const row = document.createElement('tr');
                const marketValueOrig = Number(item.quantity || 0) * Number(item.currentPrice || 0);
                const marketValueDisplay = fromHKD(toHKD(marketValueOrig, item.currency), displayCurrency);
                const cells = [
                    String(index + 1),
                    translate(categories[item.category]?.label || item.category),
                    translate(item.subtype || ''),
                    item.account || '',
                    item.name || '',
                    item.currency || '',
                    `${formatAmount(marketValueDisplay)} ${displayCurrency}`
                ];
                cells.forEach((value, i) => {
                    const td = document.createElement('td');
                    td.textContent = value;
                    td.style.border = `1px solid ${headerBorder}`;
                    td.style.color = textMain;
                    td.style.padding = '6px 8px';
                    td.style.textAlign = (i === 0 || i === 6) ? 'right' : 'left';
                    row.appendChild(td);
                });
                table.appendChild(row);
            });

            reportRoot.appendChild(table);

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

            const cashflowSummary = document.createElement('div');
            cashflowSummary.style.display = 'flex';
            cashflowSummary.style.gap = '10px';
            cashflowSummary.style.fontSize = '12px';
            cashflowSummary.style.lineHeight = '1.7';
            cashflowSummary.style.marginBottom = '10px';
            cashflowSummary.innerHTML = [
                tByLang(`本月收入：${formatAmount(cashflowMonthData.monthIncomeDisplay)} ${displayCurrency}`, `Monthly Income: ${formatAmount(cashflowMonthData.monthIncomeDisplay)} ${displayCurrency}`, `今月の収入：${formatAmount(cashflowMonthData.monthIncomeDisplay)} ${displayCurrency}`),
                tByLang(`本月支出：${formatAmount(cashflowMonthData.monthExpenseDisplay)} ${displayCurrency}`, `Monthly Expense: ${formatAmount(cashflowMonthData.monthExpenseDisplay)} ${displayCurrency}`, `今月の支出：${formatAmount(cashflowMonthData.monthExpenseDisplay)} ${displayCurrency}`),
                tByLang(`本月淨流：${formatAmount(cashflowMonthData.monthNetDisplay)} ${displayCurrency}`, `Monthly Net: ${formatAmount(cashflowMonthData.monthNetDisplay)} ${displayCurrency}`, `今月の純フロー：${formatAmount(cashflowMonthData.monthNetDisplay)} ${displayCurrency}`),
                tByLang(`年度收入：${formatAmount(cashflowYearData.yearIncomeDisplay)} ${displayCurrency}`, `Year Income: ${formatAmount(cashflowYearData.yearIncomeDisplay)} ${displayCurrency}`, `年間収入：${formatAmount(cashflowYearData.yearIncomeDisplay)} ${displayCurrency}`),
                tByLang(`年度支出：${formatAmount(cashflowYearData.yearExpenseDisplay)} ${displayCurrency}`, `Year Expense: ${formatAmount(cashflowYearData.yearExpenseDisplay)} ${displayCurrency}`, `年間支出：${formatAmount(cashflowYearData.yearExpenseDisplay)} ${displayCurrency}`),
                tByLang(`年度淨流：${formatAmount(cashflowYearData.yearNetDisplay)} ${displayCurrency}`, `Year Net: ${formatAmount(cashflowYearData.yearNetDisplay)} ${displayCurrency}`, `年間純フロー：${formatAmount(cashflowYearData.yearNetDisplay)} ${displayCurrency}`)
            ].map(line => `<div>${line}</div>`).join('');
            reportRoot.appendChild(cashflowSummary);

            reportRoot.appendChild(createSectionTitle(tByLang('年度每月收入/支出/淨流', 'Yearly Monthly Income/Expense/Net', '年間 月別 収入/支出/純フロー')));
            const yearTable = createTable(
                [
                    tByLang('月份', 'Month', '月'),
                    tByLang('收入', 'Income', '収入'),
                    tByLang('支出', 'Expense', '支出'),
                    tByLang('淨流', 'Net', '純フロー')
                ],
                [1, 2, 3]
            );
            cashflowYearData.months.forEach(monthItem => {
                const row = document.createElement('tr');
                const monthLabel = tByLang(
                    `${monthItem.month + 1} 月`,
                    `M${monthItem.month + 1}`,
                    `${monthItem.month + 1}月`
                );
                const cells = [
                    monthLabel,
                    `${formatAmount(monthItem.incomeDisplay)} ${displayCurrency}`,
                    `${formatAmount(monthItem.expenseDisplay)} ${displayCurrency}`,
                    `${formatAmount(monthItem.netDisplay)} ${displayCurrency}`
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
            reportRoot.appendChild(yearTable);

            reportRoot.appendChild(createSectionTitle(tByLang('當月流水清單', 'Monthly Records', '月間 入出金一覧')));
            const monthNote = document.createElement('div');
            monthNote.style.fontSize = '10px';
            monthNote.style.color = textSub;
            monthNote.style.marginBottom = '6px';
            monthNote.textContent = tByLang('僅顯示本月有流水的日期', 'Only days with records are shown', '当月の記録がある日だけ表示します');
            reportRoot.appendChild(monthNote);

            const monthTable = createTable(
                [
                    tByLang('日期', 'Date', '日付'),
                    tByLang('項目', 'Title', '項目'),
                    tByLang('類型', 'Type', '種類'),
                    tByLang('分類', 'Category', '分類'),
                    tByLang('帳戶', 'Account', '口座'),
                    tByLang('金額', 'Amount', '金額')
                ],
                [5]
            );

            const monthEntries = [];
            cashflowMonthData.dayRows.forEach(day => {
                day.entries.forEach(entry => {
                    monthEntries.push({
                        dateKey: day.dateKey,
                        ...entry
                    });
                });
            });

            if (monthEntries.length === 0) {
                const row = document.createElement('tr');
                const td = document.createElement('td');
                td.textContent = tByLang('本月沒有流水記錄', 'No records for this month', '当月の記録はありません');
                td.style.border = `1px solid ${headerBorder}`;
                td.style.color = textSub;
                td.style.padding = '6px 8px';
                td.style.textAlign = 'left';
                td.colSpan = 6;
                row.appendChild(td);
                monthTable.appendChild(row);
            } else {
                monthEntries.forEach(entry => {
                    const row = document.createElement('tr');
                    const sign = entry.type === 'INCOME' ? '+' : '-';
                    const cells = [
                        entry.dateKey,
                        entry.title || '',
                        getCashflowTypeLabel(entry.type),
                        translate(entry.category || ''),
                        entry.account || '',
                        `${sign}${formatAmount(entry.amountDisplay)} ${displayCurrency}`
                    ];
                    cells.forEach((value, idx) => {
                        const td = document.createElement('td');
                        td.textContent = value;
                        td.style.border = `1px solid ${headerBorder}`;
                        td.style.color = textMain;
                        td.style.padding = '6px 8px';
                        td.style.textAlign = idx === 5 ? 'right' : 'left';
                        row.appendChild(td);
                    });
                    monthTable.appendChild(row);
                });
            }
            reportRoot.appendChild(monthTable);

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
            document.body.appendChild(reportRoot);

            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            const canvas = await html2canvas(reportRoot, {
                scale: 2,
                useCORS: true,
                backgroundColor: pageBg
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.98);
            const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 8;
            const contentWidth = pageWidth - margin * 2;
            const contentHeight = pageHeight - margin * 2;
            const imageHeight = (canvas.height * contentWidth) / canvas.width;

            let rendered = 0;
            while (rendered < imageHeight) {
                if (rendered > 0) doc.addPage();
                const y = margin - rendered;
                doc.addImage(imgData, 'JPEG', margin, y, contentWidth, imageHeight, undefined, 'FAST');
                rendered += contentHeight;
            }

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
