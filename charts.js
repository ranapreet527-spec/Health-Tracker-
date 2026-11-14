// Health Telemetry Charting Engine - Unslopped & High Craft
// Flat hairlines, mono tick labels, quiet graphite ramps, high DPI

const HealthCharts = {
    setupCanvas(canvas) {
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const width = rect.width || canvas.width || 400;
        const height = rect.height || canvas.height || 220;

        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        return { ctx, width, height, dpr };
    },

    isDarkMode() {
        return document.documentElement.getAttribute('data-theme') !== 'light';
    },

    getTheme() {
        const dark = this.isDarkMode();
        return {
            textColor: dark ? '#85858b' : '#737373',
            gridColor: dark ? 'rgba(237, 237, 237, 0.05)' : 'rgba(23, 23, 23, 0.05)',
            barDefault: dark ? '#2e2e32' : '#e4e4e7',
            barAccent: dark ? '#14b8a6' : '#0f766e',
            targetLine: dark ? 'rgba(237, 237, 237, 0.25)' : 'rgba(23, 23, 23, 0.25)',
            tooltipBg: dark ? '#232325' : '#f4f4f5',
            tooltipBorder: dark ? 'rgba(237, 237, 237, 0.12)' : 'rgba(23, 23, 23, 0.12)',
            tooltipText: dark ? '#ededed' : '#171717',
            monoFont: '10px ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace'
        };
    },

    // 1. BAR CHART
    renderBarChart(canvasId, labels, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const setup = this.setupCanvas(canvas);
        if (!setup) return;
        const { ctx, width, height } = setup;
        const theme = this.getTheme();

        const padding = { top: 20, right: 16, bottom: 28, left: 40 };
        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;

        const maxVal = Math.max(...data, options.minMax || 100);
        const yMax = Math.ceil((maxVal * 1.15) / 10) * 10 || 100;

        ctx.clearRect(0, 0, width, height);

        // Grid lines
        const gridSteps = 4;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.font = theme.monoFont;
        ctx.fillStyle = theme.textColor;

        for (let i = 0; i <= gridSteps; i++) {
            const val = Math.round((yMax / gridSteps) * i);
            const y = padding.top + chartH - (chartH * (i / gridSteps));

            ctx.strokeStyle = theme.gridColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();

            const yLabel = val >= 1000 ? `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : val;
            ctx.fillText(yLabel, padding.left - 6, y);
        }

        // Target Line (Quiet hairline dash)
        if (options.goal) {
            const goalY = padding.top + chartH - (chartH * (Math.min(options.goal, yMax) / yMax));
            ctx.strokeStyle = theme.targetLine;
            ctx.setLineDash([3, 3]);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding.left, goalY);
            ctx.lineTo(width - padding.right, goalY);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Bars
        const barCount = data.length;
        if (barCount === 0) return;
        const colWidth = chartW / barCount;
        const barWidth = Math.min(colWidth * 0.45, 20);

        data.forEach((val, i) => {
            const barH = (val / yMax) * chartH;
            const x = padding.left + (i * colWidth) + (colWidth - barWidth) / 2;
            const y = padding.top + chartH - barH;

            // Highlight target achieved or current day
            const isGoal = options.goal && val >= options.goal;
            ctx.fillStyle = isGoal ? theme.barAccent : theme.barDefault;

            ctx.fillRect(x, y, barWidth, barH);

            // X-axis label
            ctx.fillStyle = theme.textColor;
            ctx.textAlign = 'center';
            ctx.font = theme.monoFont;
            ctx.fillText(labels[i] || '', x + barWidth / 2, height - padding.bottom + 14);
        });

        canvas._chartMeta = {
            type: 'bar',
            padding,
            colWidth,
            barWidth,
            labels,
            data,
            unit: options.unit || ''
        };
        this.attachTooltip(canvas);
    },

    // 2. LINE CHART
    renderLineChart(canvasId, labels, datasets, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const setup = this.setupCanvas(canvas);
        if (!setup) return;
        const { ctx, width, height } = setup;
        const theme = this.getTheme();

        const padding = { top: 20, right: 16, bottom: 28, left: 40 };
        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;

        let allValues = [];
        datasets.forEach(ds => { allValues = allValues.concat(ds.data); });
        let minVal = Math.min(...allValues);
        let maxVal = Math.max(...allValues);
        if (minVal === maxVal) {
            minVal = minVal > 5 ? minVal - 5 : 0;
            maxVal += 5;
        }

        const yMin = options.yMin !== undefined ? options.yMin : Math.max(0, Math.floor(minVal * 0.95));
        const yMax = options.yMax !== undefined ? options.yMax : Math.ceil(maxVal * 1.05);

        ctx.clearRect(0, 0, width, height);

        // Normal band
        if (options.normalBand) {
            const { min: bMin, max: bMax } = options.normalBand;
            const yTop = padding.top + chartH - (chartH * ((Math.min(bMax, yMax) - yMin) / (yMax - yMin)));
            const yBottom = padding.top + chartH - (chartH * ((Math.max(bMin, yMin) - yMin) / (yMax - yMin)));
            ctx.fillStyle = this.isDarkMode() ? 'rgba(237, 237, 237, 0.02)' : 'rgba(23, 23, 23, 0.03)';
            ctx.fillRect(padding.left, yTop, chartW, yBottom - yTop);
        }

        // Grid lines
        const gridSteps = 4;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.font = theme.monoFont;
        ctx.fillStyle = theme.textColor;

        for (let i = 0; i <= gridSteps; i++) {
            const val = yMin + ((yMax - yMin) / gridSteps) * i;
            const y = padding.top + chartH - (chartH * (i / gridSteps));

            ctx.strokeStyle = theme.gridColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();

            ctx.fillText(Number.isInteger(val) ? val : val.toFixed(1), padding.left - 6, y);
        }

        const pointCount = labels.length;
        const stepX = pointCount > 1 ? chartW / (pointCount - 1) : chartW / 2;

        datasets.forEach(ds => {
            const points = ds.data.map((val, i) => {
                const x = padding.left + (i * stepX);
                const y = padding.top + chartH - (chartH * ((val - yMin) / (yMax - yMin || 1)));
                return { x, y, val };
            });

            if (points.length === 0) return;

            // Area fill (very subtle)
            if (ds.fill !== false) {
                ctx.fillStyle = this.isDarkMode() ? 'rgba(20, 184, 166, 0.05)' : 'rgba(15, 118, 110, 0.05)';
                ctx.beginPath();
                ctx.moveTo(points[0].x, padding.top + chartH);
                ctx.lineTo(points[0].x, points[0].y);
                for (let i = 0; i < points.length - 1; i++) {
                    const cx = (points[i].x + points[i + 1].x) / 2;
                    ctx.bezierCurveTo(cx, points[i].y, cx, points[i + 1].y, points[i + 1].x, points[i + 1].y);
                }
                ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
                ctx.closePath();
                ctx.fill();
            }

            // Hairline Stroke
            ctx.strokeStyle = ds.color || theme.barAccent;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 0; i < points.length - 1; i++) {
                const cx = (points[i].x + points[i + 1].x) / 2;
                ctx.bezierCurveTo(cx, points[i].y, cx, points[i + 1].y, points[i + 1].x, points[i + 1].y);
            }
            ctx.stroke();

            // Quiet dots
            points.forEach(pt => {
                ctx.fillStyle = ds.color || theme.barAccent;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
                ctx.fill();
            });
        });

        // X-axis labels
        ctx.fillStyle = theme.textColor;
        ctx.textAlign = 'center';
        ctx.font = theme.monoFont;
        labels.forEach((lbl, i) => {
            const x = padding.left + (i * stepX);
            ctx.fillText(lbl, x, height - padding.bottom + 14);
        });

        canvas._chartMeta = {
            type: 'line',
            padding,
            stepX,
            labels,
            datasets,
            unit: options.unit || ''
        };
        this.attachTooltip(canvas);
    },

    // 3. CIRCULAR PROGRESS RING
    renderDonutProgress(canvasId, percentage, color, label, subtext) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const setup = this.setupCanvas(canvas);
        if (!setup) return;
        const { ctx, width, height } = setup;
        const theme = this.getTheme();

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) - 8;
        const strokeW = 4; // Slim and restrained

        ctx.clearRect(0, 0, width, height);

        // Track
        ctx.strokeStyle = this.isDarkMode() ? '#232325' : '#f0f0f2';
        ctx.lineWidth = strokeW;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Progress
        const pctClamped = Math.max(0, Math.min(100, percentage));
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (Math.PI * 2 * (pctClamped / 100));

        if (pctClamped > 0) {
            ctx.strokeStyle = color || theme.barAccent;
            ctx.lineWidth = strokeW;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
            ctx.stroke();
        }

        // Center typography
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = theme.tooltipText;
        ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(label !== undefined ? label : `${Math.round(pctClamped)}`, centerX, centerY - (subtext ? 5 : 0));

        if (subtext) {
            ctx.fillStyle = theme.textColor;
            ctx.font = theme.monoFont;
            ctx.fillText(subtext, centerX, centerY + 14);
        }
    },

    // Tooltip
    attachTooltip(canvas) {
        if (canvas._hasTooltipHandler) return;
        canvas._hasTooltipHandler = true;

        let tooltipEl = document.getElementById('chart-tooltip-bubble');
        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'chart-tooltip-bubble';
            tooltipEl.style.position = 'fixed';
            tooltipEl.style.pointerEvents = 'none';
            tooltipEl.style.zIndex = '9999';
            tooltipEl.style.padding = '4px 8px';
            tooltipEl.style.borderRadius = '6px';
            tooltipEl.style.fontSize = '11px';
            tooltipEl.style.fontFamily = 'ui-monospace, SFMono-Regular, monospace';
            tooltipEl.style.opacity = '0';
            tooltipEl.style.transition = 'opacity 0.1s ease';
            document.body.appendChild(tooltipEl);
        }

        const handleMove = (e) => {
            const meta = canvas._chartMeta;
            if (!meta) return;

            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const theme = this.getTheme();

            tooltipEl.style.background = theme.tooltipBg;
            tooltipEl.style.color = theme.tooltipText;
            tooltipEl.style.border = `1px solid ${theme.tooltipBorder}`;

            if (meta.type === 'bar') {
                const idx = Math.floor((mouseX - meta.padding.left) / meta.colWidth);
                if (idx >= 0 && idx < meta.data.length) {
                    const val = meta.data[idx];
                    const label = meta.labels[idx];
                    tooltipEl.innerHTML = `${label}: <strong>${val.toLocaleString()} ${meta.unit}</strong>`;
                    tooltipEl.style.left = `${e.clientX + 10}px`;
                    tooltipEl.style.top = `${e.clientY - 24}px`;
                    tooltipEl.style.opacity = '1';
                    return;
                }
            } else if (meta.type === 'line') {
                const idx = Math.round((mouseX - meta.padding.left) / meta.stepX);
                if (idx >= 0 && idx < meta.labels.length) {
                    const label = meta.labels[idx];
                    let text = `<span>${label}</span>`;
                    meta.datasets.forEach(ds => {
                        const val = ds.data[idx];
                        if (val !== undefined) {
                            text += ` · ${ds.label || ''}: <strong>${val} ${meta.unit}</strong>`;
                        }
                    });
                    tooltipEl.innerHTML = text;
                    tooltipEl.style.left = `${e.clientX + 10}px`;
                    tooltipEl.style.top = `${e.clientY - 24}px`;
                    tooltipEl.style.opacity = '1';
                    return;
                }
            }

            tooltipEl.style.opacity = '0';
        };

        const handleLeave = () => {
            tooltipEl.style.opacity = '0';
        };

        canvas.addEventListener('mousemove', handleMove);
        canvas.addEventListener('mouseleave', handleLeave);
    }
};

window.HealthCharts = HealthCharts;
