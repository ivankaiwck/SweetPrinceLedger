(() => {
    async function exportAssetReportPdf({
        assets,
        displayCurrency,
        totals,
        assetMix,
        groupedAssets,
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
            if (typeof onProgress === 'function') onProgress('正在準備 PDF...');
            const jsPDF = await ensureJsPdfReady();
            const html2canvas = await ensureHtml2CanvasReady();

            if (typeof onProgress === 'function') onProgress('正在轉換內容為 PDF...');

            reportRoot = document.createElement('div');
            reportRoot.style.position = 'fixed';
            reportRoot.style.left = '0';
            reportRoot.style.top = '0';
            reportRoot.style.width = '1024px';
            reportRoot.style.background = '#ffffff';
            reportRoot.style.color = '#0f172a';
            reportRoot.style.padding = '24px';
            reportRoot.style.fontFamily = "'Noto Sans TC', sans-serif";
            reportRoot.style.opacity = '1';
            reportRoot.style.pointerEvents = 'none';
            reportRoot.style.zIndex = '99999';

            const title = document.createElement('h1');
            title.textContent = '個人資產分享報表';
            title.style.fontSize = '24px';
            title.style.fontWeight = '800';
            title.style.margin = '0 0 8px 0';
            reportRoot.appendChild(title);

            const meta = document.createElement('div');
            meta.textContent = `產生時間：${new Date().toLocaleString()} ｜ 顯示幣種：${displayCurrency}`;
            meta.style.fontSize = '12px';
            meta.style.color = '#475569';
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
                `總資產：${formatAmount(totals.assets)} ${displayCurrency}`,
                `總負債：${formatAmount(totals.liabilities)} ${displayCurrency}`,
                `淨資產：${formatAmount(totals.netWorth)} ${displayCurrency}`,
                `負債比：${totals.debtRatio.toFixed(2)}%`,
                `資產筆數：${assets.length} 筆`
            ].map(line => `<div>${line}</div>`).join('');
            summaryWrap.appendChild(summary);

            const chartCard = document.createElement('div');
            chartCard.style.width = '300px';
            chartCard.style.padding = '10px';
            chartCard.style.border = '1px solid #e2e8f0';
            chartCard.style.borderRadius = '10px';
            chartCard.style.background = '#f8fafc';

            const chartTitle = document.createElement('div');
            chartTitle.textContent = '資產配比';
            chartTitle.style.fontSize = '12px';
            chartTitle.style.fontWeight = '700';
            chartTitle.style.marginBottom = '8px';
            chartCard.appendChild(chartTitle);

            const chartWrap = document.createElement('div');
            chartWrap.style.display = 'flex';
            chartWrap.style.alignItems = 'center';
            chartWrap.style.gap = '10px';

            const donut = document.createElement('div');
            donut.style.width = '96px';
            donut.style.height = '96px';
            donut.style.borderRadius = '999px';
            donut.style.flexShrink = '0';
            donut.style.position = 'relative';
            donut.style.background = assetMix.gradient;
            const donutHole = document.createElement('div');
            donutHole.style.position = 'absolute';
            donutHole.style.inset = '22px';
            donutHole.style.borderRadius = '999px';
            donutHole.style.background = '#ffffff';
            donut.appendChild(donutHole);
            chartWrap.appendChild(donut);

            const legend = document.createElement('div');
            legend.style.flex = '1';
            legend.style.display = 'grid';
            legend.style.gap = '4px';
            assetMix.rows
                .filter(row => row.ratio > 0)
                .slice(0, 6)
                .forEach(row => {
                    const item = document.createElement('div');
                    item.style.display = 'flex';
                    item.style.alignItems = 'center';
                    item.style.justifyContent = 'space-between';
                    item.style.fontSize = '10px';

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
                    label.textContent = row.label;
                    left.appendChild(dot);
                    left.appendChild(label);

                    const value = document.createElement('span');
                    value.textContent = `${row.ratio.toFixed(1)}%`;

                    item.appendChild(left);
                    item.appendChild(value);
                    legend.appendChild(item);
                });

            chartWrap.appendChild(legend);
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

            const createTable = (headers) => {
                const tableEl = document.createElement('table');
                tableEl.style.width = '100%';
                tableEl.style.borderCollapse = 'collapse';
                tableEl.style.fontSize = '11px';

                const headerRow = document.createElement('tr');
                headers.forEach(text => {
                    const th = document.createElement('th');
                    th.textContent = text;
                    th.style.border = '1px solid #cbd5e1';
                    th.style.background = '#f1f5f9';
                    th.style.padding = '6px 8px';
                    th.style.textAlign = ['#', '筆數', '項目數', '總市值', '市值'].includes(text) ? 'right' : 'left';
                    headerRow.appendChild(th);
                });
                tableEl.appendChild(headerRow);
                return tableEl;
            };

            reportRoot.appendChild(createSectionTitle('按帳戶匯總'));
            const accountSummaryTable = createTable(['類別', '帳戶', '筆數', '總市值']);
            groupedAssets.forEach(group => {
                group.accounts.forEach(account => {
                    const row = document.createElement('tr');
                    const valueDisplay = fromHKD(account.accountTotalHKD, displayCurrency);
                    const cells = [
                        categories[group.categoryKey]?.label || group.categoryKey,
                        account.accountName,
                        String(account.items.length),
                        `${formatAmount(valueDisplay)} ${displayCurrency}`
                    ];
                    cells.forEach((value, idx) => {
                        const td = document.createElement('td');
                        td.textContent = value;
                        td.style.border = '1px solid #cbd5e1';
                        td.style.padding = '6px 8px';
                        td.style.textAlign = idx >= 2 ? 'right' : 'left';
                        row.appendChild(td);
                    });
                    accountSummaryTable.appendChild(row);
                });
            });
            reportRoot.appendChild(accountSummaryTable);

            reportRoot.appendChild(createSectionTitle('資產明細'));

            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.style.fontSize = '11px';

            const headRow = document.createElement('tr');
            ['#', '類別', '細項', '帳戶', '名稱', '幣種', '市值'].forEach(text => {
                const th = document.createElement('th');
                th.textContent = text;
                th.style.border = '1px solid #cbd5e1';
                th.style.background = '#f1f5f9';
                th.style.padding = '6px 8px';
                th.style.textAlign = ['#', '市值'].includes(text) ? 'right' : 'left';
                headRow.appendChild(th);
            });
            table.appendChild(headRow);

            assets.forEach((item, index) => {
                const row = document.createElement('tr');
                const marketValueOrig = Number(item.quantity || 0) * Number(item.currentPrice || 0);
                const marketValueDisplay = fromHKD(toHKD(marketValueOrig, item.currency), displayCurrency);
                const cells = [
                    String(index + 1),
                    categories[item.category]?.label || item.category,
                    item.subtype || '',
                    item.account || '',
                    item.name || '',
                    item.currency || '',
                    `${formatAmount(marketValueDisplay)} ${displayCurrency}`
                ];
                cells.forEach((value, i) => {
                    const td = document.createElement('td');
                    td.textContent = value;
                    td.style.border = '1px solid #cbd5e1';
                    td.style.padding = '6px 8px';
                    td.style.textAlign = (i === 0 || i === 6) ? 'right' : 'left';
                    row.appendChild(td);
                });
                table.appendChild(row);
            });

            reportRoot.appendChild(table);
            document.body.appendChild(reportRoot);

            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            const canvas = await html2canvas(reportRoot, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
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
