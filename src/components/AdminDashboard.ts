/**
 * Admin Dashboard Component — Premium Edition
 * Real-time analytics, key management, canvas charts
 * Features: SSE live updates, custom charts with gradients, responsive layout
 * Make By Benz — Free Fire OB54
 */

interface AdminDashboardOptions {
  onRefresh?: () => void;
}

interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

export class AdminDashboard {
  private _options: AdminDashboardOptions;
  private container: HTMLElement;
  private eventSource: EventSource | null = null;
  private refreshInterval: number | null = null;
  private isVisible = false;
  private lastUpdate: Date | null = null;

  constructor(options: AdminDashboardOptions = {}) {
    this._options = options;
    this.container = this.createElement();
    this.bindEvents();
  }

  private createElement(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'admin-dashboard';
    wrapper.innerHTML = this.getTemplate();
    return wrapper;
  }

  private getTemplate(): string {
    return `
      <!-- Header -->
      <div class="admin-dashboard__header">
        <div class="admin-dashboard__title-row">
          <h1 class="admin-dashboard__title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28">
              <rect x="3" y="3" width="7" height="7" rx="1.5"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5"/>
            </svg>
            Admin Dashboard
          </h1>
          <span class="admin-dashboard__subtitle">⚡ Real-time Analytics &amp; License Key Management</span>
        </div>
        <div class="admin-dashboard__actions">
          <span class="admin-dashboard__status admin-dashboard__status--connecting" id="connection-status">
            <span class="status-indicator"></span>
            <span>Connecting...</span>
          </span>
          <button class="btn btn--secondary btn--sm" id="refresh-btn" title="Refresh data">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <!-- KPI Stats -->
      <div class="admin-dashboard__stats" id="stats-grid">
        <div class="stat-card stat-card--primary">
          <div class="stat-card__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div class="stat-card__content">
            <span class="stat-card__label">Total Events</span>
            <span class="stat-card__value" id="stat-total-events">—</span>
          </div>
        </div>

        <div class="stat-card stat-card--success">
          <div class="stat-card__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div class="stat-card__content">
            <span class="stat-card__label">Keys Valid ✓</span>
            <span class="stat-card__value" id="stat-license-success">—</span>
          </div>
        </div>

        <div class="stat-card stat-card--error">
          <div class="stat-card__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          </div>
          <div class="stat-card__content">
            <span class="stat-card__label">Keys Failed ✗</span>
            <span class="stat-card__value" id="stat-license-failed">—</span>
          </div>
        </div>

        <div class="stat-card stat-card--info">
          <div class="stat-card__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <div class="stat-card__content">
            <span class="stat-card__label">Top Devices</span>
            <span class="stat-card__value" id="stat-top-devices">—</span>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="admin-dashboard__charts">
        <div class="chart-card chart-card--wide">
          <div class="chart-card__header">
            <h3 class="chart-card__title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:6px">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              Events Timeline
            </h3>
            <div class="chart-card__controls">
              <select class="chart-period-select" id="period-select">
                <option value="1">1 Hour</option>
                <option value="6">6 Hours</option>
                <option value="24" selected>24 Hours</option>
                <option value="168">7 Days</option>
              </select>
            </div>
          </div>
          <div class="chart-card__canvas-wrapper">
            <canvas id="chart-events-timeline"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-card__header">
            <h3 class="chart-card__title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:6px">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Event Breakdown
            </h3>
          </div>
          <div class="chart-card__canvas-wrapper">
            <canvas id="chart-events-type"></canvas>
          </div>
        </div>
      </div>

      <!-- Tables Row -->
      <div class="admin-dashboard__tables">
        <div class="table-card">
          <div class="table-card__header">
            <h3 class="table-card__title">
              🏆 Top Devices
            </h3>
          </div>
          <div class="table-card__content">
            <table class="admin-table" id="table-top-devices">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Brand</th>
                  <th>Model</th>
                  <th>Events</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colspan="5" style="text-align:center;padding:24px;color:var(--tx2)">Loading...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="table-card">
          <div class="table-card__header">
            <h3 class="table-card__title">🔑 License Stats</h3>
          </div>
          <div class="table-card__content">
            <div class="license-stats">
              <div class="license-stat license-stat--success">
                <span class="license-stat__label">Successful</span>
                <span class="license-stat__value" id="license-success">—</span>
              </div>
              <div class="license-stat license-stat--error">
                <span class="license-stat__label">Failed</span>
                <span class="license-stat__value" id="license-failed">—</span>
              </div>
              <div class="license-stat license-stat--info">
                <span class="license-stat__label">Success Rate</span>
                <span class="license-stat__value" id="license-rate">—</span>
              </div>
            </div>
            <div class="license-stats__chart">
              <canvas id="chart-license-ratio"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Key Generator Section -->
      <div class="admin-dashboard__section">
        <div class="admin-dashboard__section-header">
          <h2 class="admin-dashboard__section-title">🔐 Key Generator</h2>
        </div>
        <div id="keygen-container"></div>
      </div>

      <!-- Footer -->
      <div id="dashboard-footer" style="
        text-align:center;
        padding: 16px;
        font-size: 0.52rem;
        color: var(--tx2);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        font-weight: 600;
      ">
        <span id="last-updated">Never updated</span> · Free Fire OB54 · Make By Benz
      </div>
    `;
  }

  private bindEvents(): void {
    const refreshBtn = this.container.querySelector('#refresh-btn') as HTMLButtonElement;
    const periodSelect = this.container.querySelector('#period-select') as HTMLSelectElement;

    refreshBtn?.addEventListener('click', () => {
      refreshBtn.style.transform = 'rotate(360deg)';
      refreshBtn.style.transition = 'transform 0.5s ease';
      setTimeout(() => { refreshBtn.style.transform = ''; }, 500);
      this.refresh();
    });

    periodSelect?.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.fetchAnalytics(parseInt(target.value, 10));
    });

    document.addEventListener('visibilitychange', () => {
      this.isVisible = !document.hidden;
      if (this.isVisible) this.refresh();
    });
  }

  public init(): void {
    this.isVisible = true;
    this.connectSSE();
    this.startAutoRefresh();
    this.refresh();
  }

  private connectSSE(): void {
    if (this.eventSource) this.eventSource.close();

    this.eventSource = new EventSource('/api/admin-metrics/stream');

    this.eventSource.onopen = () => {
      this.updateConnectionStatus('connected', 'Live');
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.updateDashboard(data);
      } catch (err) {
        console.error('[AdminDashboard] SSE parse error:', err);
      }
    };

    this.eventSource.onerror = () => {
      this.updateConnectionStatus('disconnected', 'Reconnecting...');
      setTimeout(() => this.connectSSE(), 5000);
    };
  }

  private startAutoRefresh(): void {
    this.refreshInterval = window.setInterval(() => {
      if (this.isVisible) this.refresh();
    }, 60000);
  }

  public async refresh(): Promise<void> {
    try {
      this.updateConnectionStatus('connecting', 'Loading...');
      const period = (this.container.querySelector('#period-select') as HTMLSelectElement)?.value || '24';
      await this.fetchAnalytics(parseInt(period, 10));
    } catch (err) {
      console.error('[AdminDashboard] Refresh failed:', err);
    }
  }

  private async fetchAnalytics(hours: number): Promise<void> {
    try {
      const response = await fetch(`/api/admin-metrics?hours=${hours}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (result.success) {
        this.updateDashboard(result.data);
      }
    } catch (err) {
      console.error('[AdminDashboard] Fetch analytics failed:', err);
      this.updateConnectionStatus('error', 'Error');
    }
  }

  private updateDashboard(data: any): void {
    this.updateConnectionStatus('connected', 'Live');
    this.lastUpdate = new Date();

    // Update KPI cards
    this.updateStat('total-events', (data.totalEvents || 0).toLocaleString());
    this.updateStat('top-devices', (data.topDevices?.length || 0).toString());

    // License stats
    const success = data.licenseValidations?.success || 0;
    const failed = data.licenseValidations?.failed || 0;
    const total = success + failed;
    const rate = total > 0 ? ((success / total) * 100).toFixed(1) : '0.0';

    this.updateStat('license-success', success.toLocaleString());
    this.updateStat('license-failed', failed.toLocaleString());
    this.updateStat('license-rate', `${rate}%`);

    // Charts
    this.updateTimelineChart(data.eventsByHour || {});
    this.updateTypeChart(data.eventsByType || {});
    this.updateLicenseChart(success, failed);
    this.updateTopDevicesTable(data.topDevices || []);
    this.updateFooter();
  }

  private updateStat(id: string, value: string): void {
    const el =
      this.container.querySelector(`#stat-${id}`) ||
      this.container.querySelector(`#${id}`);
    if (el) {
      el.textContent = value;
      el.classList.remove('stat-card__value--updated');
      void (el as HTMLElement).offsetWidth; // force reflow
      el.classList.add('stat-card__value--updated');
      setTimeout(() => el.classList.remove('stat-card__value--updated'), 500);
    }
  }

  private updateFooter(): void {
    const el = this.container.querySelector('#last-updated');
    if (el && this.lastUpdate) {
      el.textContent = `Updated ${this.lastUpdate.toLocaleTimeString()}`;
    }
  }

  private updateTimelineChart(eventsByHour: Record<string, number>): void {
    const canvas = this.container.querySelector('#chart-events-timeline') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = new Date();
    const labels: string[] = [];
    const data: number[] = [];

    for (let i = 23; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 3600000);
      const key = date.toISOString().slice(0, 13);
      labels.push(i % 4 === 0 ? date.getHours().toString().padStart(2, '0') + 'h' : '');
      data.push(eventsByHour[key] || 0);
    }

    this.drawLineChart(ctx, canvas, {
      labels,
      datasets: [{
        label: 'Events',
        data,
        borderColor: '#00e64d',
        backgroundColor: 'rgba(0, 230, 77, 0.12)',
        fill: true,
        tension: 0.4,
        borderWidth: 2.5
      }]
    }, { min: 0 });
  }

  private updateTypeChart(eventsByType: Record<string, number>): void {
    const canvas = this.container.querySelector('#chart-events-type') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const entries = Object.entries(eventsByType).sort((a, b) => b[1] - a[1]).slice(0, 7);
    const labels = entries.map(([k]) => k);
    const data = entries.map(([, v]) => v);

    const colors = [
      '#ff3333', '#ff8c1a', '#ffd700', '#00e64d',
      '#1a8cff', '#6666ff', '#cc33ff'
    ];

    if (data.length === 0) {
      // Empty state
      this.drawEmptyState(ctx, canvas, 'No events yet');
      return;
    }

    this.drawDoughnutChart(ctx, canvas, {
      labels,
      datasets: [{
        label: 'Events by Type',
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 0
      }]
    }, { cutout: '65%' });

    // Draw legend below
    this.drawLegend(ctx, canvas, labels, colors, data);
  }

  private updateLicenseChart(success: number, failed: number): void {
    const canvas = this.container.querySelector('#chart-license-ratio') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (success + failed === 0) {
      this.drawEmptyState(ctx, canvas, 'No license data');
      return;
    }

    this.drawDoughnutChart(ctx, canvas, {
      labels: ['Success', 'Failed'],
      datasets: [{
        label: 'License',
        data: [success, failed],
        backgroundColor: ['#00e64d', '#ef4444'],
        borderWidth: 0
      }]
    }, { cutout: '72%', centerText: `${((success / (success + failed)) * 100).toFixed(0)}%` });
  }

  private updateTopDevicesTable(devices: Array<{ brand: string; model: string; count: number }>): void {
    const tbody = this.container.querySelector('#table-top-devices tbody');
    if (!tbody) return;

    const medals = ['🥇', '🥈', '🥉'];
    const totalEvents = devices.reduce((sum, d) => sum + d.count, 0);

    if (devices.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--tx2)">No device data available</td></tr>`;
      return;
    }

    tbody.innerHTML = devices.slice(0, 10).map((device, index) => {
      const share = totalEvents > 0 ? ((device.count / totalEvents) * 100).toFixed(1) : '0.0';
      const rankDisplay = index < 3 ? medals[index] : `${index + 1}`;
      const sharePct = parseFloat(share);
      const barColor = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#1a8cff';

      return `
        <tr>
          <td class="rank">${rankDisplay}</td>
          <td><strong>${device.brand}</strong></td>
          <td>${device.model}</td>
          <td style="font-variant-numeric:tabular-nums;font-weight:700">${device.count.toLocaleString()}</td>
          <td>
            <div style="display:flex;align-items:center;gap:6px">
              <div style="flex:1;height:4px;background:rgba(255,255,255,0.06);border-radius:99px;overflow:hidden">
                <div style="width:${sharePct}%;height:100%;background:${barColor};border-radius:99px;transition:width 0.6s ease"></div>
              </div>
              <span style="font-size:0.52rem;font-weight:700;color:var(--tx2);white-space:nowrap">${share}%</span>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  /* ========== Canvas Drawing Helpers ========== */

  private getCanvasSize(canvas: HTMLCanvasElement): { width: number; height: number; dpr: number } {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || canvas.parentElement?.clientWidth || 320;
    const height = rect.height || (canvas.clientHeight || 180);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    return { width, height, dpr };
  }

  private drawEmptyState(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, msg: string): void {
    const { width, height, dpr } = this.getCanvasSize(canvas);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(138,141,151,0.5)';
    ctx.font = '600 11px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(msg, width / 2, height / 2);
  }

  private drawLineChart(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    chartData: { labels: string[]; datasets: Array<{ label: string; data: number[]; borderColor: string; backgroundColor: string; fill: boolean; tension: number; borderWidth: number }> },
    options: { min?: number; max?: number } = {}
  ): void {
    const { width, height, dpr } = this.getCanvasSize(canvas);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const pad = { top: 16, right: 16, bottom: 32, left: 44 };
    const cw = width - pad.left - pad.right;
    const ch = height - pad.top - pad.bottom;

    const data = chartData.datasets[0].data;
    const labels = chartData.labels;
    const maxVal = Math.max(...data, options.max || 1);
    const minVal = Math.min(...data, options.min || 0);
    const range = maxVal - minVal || 1;

    // Grid lines
    const gridCount = 4;
    for (let i = 0; i <= gridCount; i++) {
      const y = pad.top + (ch / gridCount) * i;
      const val = maxVal - (range / gridCount) * i;

      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + cw, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#4f5260';
      ctx.font = '600 9px "Be Vietnam Pro", sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(val).toString(), pad.left - 6, y);
    }

    // X labels
    ctx.fillStyle = '#4f5260';
    ctx.font = '600 9px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    labels.forEach((label, i) => {
      if (!label) return;
      const x = pad.left + (i / (data.length - 1)) * cw;
      ctx.fillText(label, x, height - pad.bottom + 6);
    });

    const ds = chartData.datasets[0];
    const toX = (i: number) => pad.left + (i / (data.length - 1)) * cw;
    const toY = (v: number) => pad.top + ch - ((v - minVal) / range) * ch;

    // Fill gradient
    if (ds.fill) {
      const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
      grad.addColorStop(0, ds.backgroundColor.replace('0.12', '0.25'));
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(toX(0), toY(data[0]));
      for (let i = 1; i < data.length; i++) {
        const cpx = (toX(i - 1) + toX(i)) / 2;
        ctx.bezierCurveTo(cpx, toY(data[i - 1]), cpx, toY(data[i]), toX(i), toY(data[i]));
      }
      ctx.lineTo(toX(data.length - 1), pad.top + ch);
      ctx.lineTo(toX(0), pad.top + ch);
      ctx.closePath();
      ctx.fill();
    }

    // Line with glow
    ctx.save();
    ctx.shadowColor = ds.borderColor;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = ds.borderColor;
    ctx.lineWidth = ds.borderWidth || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(data[0]));
    for (let i = 1; i < data.length; i++) {
      const cpx = (toX(i - 1) + toX(i)) / 2;
      ctx.bezierCurveTo(cpx, toY(data[i - 1]), cpx, toY(data[i]), toX(i), toY(data[i]));
    }
    ctx.stroke();
    ctx.restore();

    // Dots on non-zero peaks
    const peakVal = Math.max(...data);
    data.forEach((v, i) => {
      if (v === peakVal && v > 0) {
        ctx.save();
        ctx.shadowColor = ds.borderColor;
        ctx.shadowBlur = 10;
        ctx.fillStyle = ds.borderColor;
        ctx.beginPath();
        ctx.arc(toX(i), toY(v), 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Peak label
        ctx.fillStyle = ds.borderColor;
        ctx.font = 'bold 9px "Be Vietnam Pro", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(v.toString(), toX(i), toY(v) - 6);
      }
    });
  }

  private drawDoughnutChart(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    chartData: { labels: string[]; datasets: Array<{ label: string; data: number[]; backgroundColor: string | string[]; borderWidth: number }> },
    options: { cutout?: string; centerText?: string } = {}
  ): void {
    const { width, height, dpr } = this.getCanvasSize(canvas);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 16;
    const cutoutRatio = options.cutout ? parseInt(options.cutout) / 100 : 0.6;
    const cutout = radius * cutoutRatio;

    const data = chartData.datasets[0].data;
    const colors = chartData.datasets[0].backgroundColor;
    const total = data.reduce((a, b) => a + b, 0);
    if (total === 0) return;

    let angle = -Math.PI / 2;

    data.forEach((value, i) => {
      const slice = (value / total) * Math.PI * 2;
      const color = Array.isArray(colors) ? colors[i] : colors;
      const midAngle = angle + slice / 2;

      // Slight expansion for hover-like effect on each segment
      const expand = 0;
      const ex = Math.cos(midAngle) * expand;
      const ey = Math.sin(midAngle) * expand;

      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(cx + ex, cy + ey);
      ctx.arc(cx + ex, cy + ey, radius, angle, angle + slice);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();

      angle += slice;
    });

    // Cutout hole
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, cutout, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fill();
    ctx.restore();

    // Inner dark fill
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, cutout, 0, Math.PI * 2);
    ctx.fillStyle = '#0b0d10';
    ctx.fill();
    ctx.restore();

    // Center text
    if (options.centerText) {
      ctx.fillStyle = '#dddce0';
      ctx.font = `bold ${Math.round(radius * 0.28)}px "Be Vietnam Pro", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(options.centerText, cx, cy);
    }
  }

  private drawLegend(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    labels: string[],
    colors: string[],
    data: number[]
  ): void {
    const total = data.reduce((a, b) => a + b, 0);
    const width = canvas.width / (window.devicePixelRatio || 1);
    const startY = canvas.height / (window.devicePixelRatio || 1) - 4;
    const itemW = width / Math.min(labels.length, 4);

    labels.slice(0, 4).forEach((label, i) => {
      const x = i * itemW + 8;
      const pct = total > 0 ? ((data[i] / total) * 100).toFixed(0) : '0';

      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.arc(x + 5, startY, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#8a8d97';
      ctx.font = '500 8px "Be Vietnam Pro", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const shortLabel = label.length > 10 ? label.slice(0, 9) + '…' : label;
      ctx.fillText(`${shortLabel} ${pct}%`, x + 11, startY);
    });
  }

  private updateConnectionStatus(
    status: 'connected' | 'disconnected' | 'connecting' | 'error',
    text: string
  ): void {
    const el = this.container.querySelector('#connection-status');
    if (!el) return;
    el.className = `admin-dashboard__status admin-dashboard__status--${status}`;
    el.innerHTML = `<span class="status-indicator"></span><span>${text}</span>`;
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public destroy(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    this.container.remove();
  }
}