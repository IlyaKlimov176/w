/* Чистые функции рендеринга: принимают данные и возвращают DOM-узлы. */
const SVG_NS = 'http://www.w3.org/2000/svg';

const iconShapes = {
  grid: [['rect', { x: 3.5, y: 3.5, width: 7, height: 7, rx: 1.5 }], ['rect', { x: 13.5, y: 3.5, width: 7, height: 7, rx: 1.5 }], ['rect', { x: 3.5, y: 13.5, width: 7, height: 7, rx: 1.5 }], ['rect', { x: 13.5, y: 13.5, width: 7, height: 7, rx: 1.5 }]],
  'shopping-bag': [['path', { d: 'M5 8.5h14l1 11H4l1-11Z' }], ['path', { d: 'M9 9V6a3 3 0 0 1 6 0v3' }]],
  package: [['path', { d: 'm12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z' }], ['path', { d: 'm4.5 7.8 7.5 4.3 7.5-4.3M12 12v8.5' }]],
  chart: [['path', { d: 'M4 20h16M6.5 16v-5M12 16V5M17.5 16V8' }]],
  refresh: [['path', { d: 'M20 7v5h-5M4 17v-5h5' }], ['path', { d: 'M5.5 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.5-3' }]],
  search: [['circle', { cx: 10.8, cy: 10.8, r: 6.8 }], ['path', { d: 'm16 16 4.5 4.5' }]],
  plus: [['path', { d: 'M12 5v14M5 12h14' }]],
  download: [['path', { d: 'M12 3v12m0 0 4-4m-4 4-4-4' }], ['path', { d: 'M4 17v3h16v-3' }]],
  'chevron-right': [['path', { d: 'm9 18 6-6-6-6' }]],
  'chevron-left': [['path', { d: 'm15 18-6-6 6-6' }]],
  eye: [['path', { d: 'M2.5 12s3.2-6 9.5-6 9.5 6 9.5 6-3.2 6-9.5 6-9.5-6-9.5-6Z' }], ['circle', { cx: 12, cy: 12, r: 2.5 }]],
  calendar: [['rect', { x: 3.5, y: 5, width: 17, height: 15, rx: 2 }], ['path', { d: 'M7.5 3v4M16.5 3v4M4 9.5h16' }]],
  wallet: [['rect', { x: 3, y: 5, width: 18, height: 15, rx: 2.5 }], ['path', { d: 'M3 8h18M16 14h.01' }]],
  boxes: [['path', { d: 'm12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z' }], ['path', { d: 'm4.5 7.8 7.5 4.3 7.5-4.3' }]],
  check: [['path', { d: 'm5 12 4.5 4.5L19 7' }]],
  'arrow-up-right': [['path', { d: 'M7 17 17 7M7 7h10v10' }]],
  'arrow-down-right': [['path', { d: 'M7 7 17 17M7 17h10V7' }]],
  sparkles: [['path', { d: 'm12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z' }], ['path', { d: 'm19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z' }]],
  'external-link': [['path', { d: 'M13 5h6v6M19 5l-9 9' }], ['path', { d: 'M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5' }]],
  file: [['path', { d: 'M6 3.5h8l4 4V20H6V3.5Z' }], ['path', { d: 'M14 3.5V8h4M9 12h6M9 15.5h6' }]],
  mail: [['rect', { x: 3, y: 5, width: 18, height: 14, rx: 2 }], ['path', { d: 'm4 7 8 6 8-6' }]],
  'map-pin': [['path', { d: 'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z' }], ['circle', { cx: 12, cy: 10, r: 2.2 }]],
  user: [['circle', { cx: 12, cy: 8, r: 3.5 }], ['path', { d: 'M4.5 20a7.5 7.5 0 0 1 15 0' }]],
  truck: [['path', { d: 'M3 6h11v11H3zM14 10h4l3 3v4h-7z' }], ['circle', { cx: 7, cy: 18, r: 1.8 }], ['circle', { cx: 18, cy: 18, r: 1.8 }]],
  'credit-card': [['rect', { x: 3, y: 5.5, width: 18, height: 13, rx: 2 }], ['path', { d: 'M3 10h18M7 14.5h3' }]],
  clock: [['circle', { cx: 12, cy: 12, r: 9 }], ['path', { d: 'M12 7v5l3.5 2' }]],
  more: [['circle', { cx: 5, cy: 12, r: 1 }], ['circle', { cx: 12, cy: 12, r: 1 }], ['circle', { cx: 19, cy: 12, r: 1 }]],
  filter: [['path', { d: 'M4 6h16M7 12h10M10 18h4' }]],
  empty: [['path', { d: 'M4 7.5h16v12H4zM3 7.5 6 3h12l3 4.5' }], ['path', { d: 'M9 12h6' }]],
  close: [['path', { d: 'm6 6 12 12M18 6 6 18' }]],
  warning: [['path', { d: 'M12 3 22 20H2L12 3Z' }], ['path', { d: 'M12 9v4m0 3h.01' }]],
  copy: [['rect', { x: 8, y: 8, width: 11, height: 12, rx: 2 }], ['path', { d: 'M16 8V5a1.5 1.5 0 0 0-1.5-1.5h-9A1.5 1.5 0 0 0 4 5v10a1.5 1.5 0 0 0 1.5 1.5H8' }]],
  list: [['path', { d: 'M9 6h11M9 12h11M9 18h11' }], ['path', { d: 'M4 6h.01M4 12h.01M4 18h.01' }]],
  layout: [['rect', { x: 3.5, y: 3.5, width: 7, height: 7, rx: 1.5 }], ['rect', { x: 13.5, y: 3.5, width: 7, height: 7, rx: 1.5 }], ['rect', { x: 3.5, y: 13.5, width: 17, height: 7, rx: 1.5 }]],
  'trending-up': [['path', { d: 'm3 17 6-6 4 4 8-8' }], ['path', { d: 'M15 7h6v6' }]],
  'trending-down': [['path', { d: 'm3 7 6 6 4-4 8 8' }], ['path', { d: 'M15 17h6v-6' }]],
  'shopping-cart': [['circle', { cx: 9, cy: 20, r: 1 }], ['circle', { cx: 18, cy: 20, r: 1 }], ['path', { d: 'M3 4h2l2.5 11.5h11L21 8H6' }]],
  'rotate-ccw': [['path', { d: 'M4 8V4m0 4h4M4.5 8A8 8 0 1 1 4 15' }]],
  'arrow-right': [['path', { d: 'M4 12h16m-6-6 6 6-6 6' }]],
  'chevron-down': [['path', { d: 'm7 10 5 5 5-5' }]],
  'user-plus': [['circle', { cx: 9, cy: 8, r: 3.5 }], ['path', { d: 'M2.5 20a6.5 6.5 0 0 1 13 0M19 8v6m-3-3h6' }]],
  percent: [['path', { d: 'M19 5 5 19' }], ['circle', { cx: 7, cy: 7, r: 2.2 }], ['circle', { cx: 17, cy: 17, r: 2.2 }]],
  tag: [['path', { d: 'M20 13 13 20 3.5 10.5V4H10L20 13Z' }], ['circle', { cx: 7, cy: 7.5, r: 1 }]],
  bell: [['path', { d: 'M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4' }]],
  sun: [['circle', { cx: 12, cy: 12, r: 4 }], ['path', { d: 'M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4' }]],
  moon: [['path', { d: 'M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.6 8.6 0 1 0 10.7 10.7Z' }]]
};

export function el(tag, className = '', text = null) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== null && text !== undefined) node.textContent = String(text);
  return node;
}

export function icon(name, className = '') {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  if (className) svg.setAttribute('class', className);
  (iconShapes[name] || iconShapes.grid).forEach(([tag, attrs]) => {
    const child = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => child.setAttribute(key, String(value)));
    svg.append(child);
  });
  return svg;
}

export function formatCurrency(value, compact = false) {
  const amount = Number(value) || 0;
  if (compact && Math.abs(amount) >= 1000) {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(amount);
  }
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
}

export function formatNumber(value) {
  return new Intl.NumberFormat('ru-RU').format(Number(value) || 0);
}

export function formatDate(value, options = {}) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const formatOptions = options.time
    ? { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: options.year ? 'numeric' : undefined };
  return new Intl.DateTimeFormat('ru-RU', formatOptions).format(date).replace(' г.', '');
}

export function makeTime(value, withTime = false) {
  const node = el('time', withTime ? 'detail-time' : '');
  node.dateTime = value || '';
  node.textContent = formatDate(value, { time: withTime });
  return node;
}

export function statusBadge(status) {
  const badge = el('span', `status-badge ${statusTone(status)}`, status || 'Без статуса');
  return badge;
}

export function statusTone(status) {
  const normalized = String(status || '').toLowerCase();
  if (['доставлен', 'оплачен', 'активен', 'выплачен', 'одобрен', 'подтверждена'].includes(normalized)) return 'status-badge--success';
  if (['новый', 'в обработке', 'на проверке', 'заканчивается'].includes(normalized)) return 'status-badge--warning';
  if (['отменён', 'отклонён', 'нет в наличии'].includes(normalized)) return 'status-badge--danger';
  if (['отправлен', 'черновик'].includes(normalized)) return 'status-badge--info';
  return 'status-badge--neutral';
}

export function priorityLabel(priority) {
  const tone = priority === 'Высокий' ? 'priority--high' : priority === 'Средний' ? 'priority--medium' : 'priority--low';
  return el('span', `priority ${tone}`, priority || 'Обычный');
}

export function actionButton(action, label, className = 'secondary-button', iconName = null, attrs = {}) {
  const button = el('button', className);
  button.type = 'button';
  button.dataset.action = action;
  // Keep a stable accessible name even when CSS hides the visual label on mobile.
  if (label && !Object.prototype.hasOwnProperty.call(attrs, 'aria-label')) button.setAttribute('aria-label', label);
  if (iconName) button.append(icon(iconName));
  if (label) button.append(el('span', attrs.textClass || 'button-text', label));
  Object.entries(attrs).filter(([key]) => key !== 'textClass').forEach(([key, value]) => button.setAttribute(key, String(value)));
  return button;
}

export function pageHeading(eyebrow, title, description, actions = []) {
  const header = el('header', 'page-heading');
  const copy = el('section', 'page-heading-copy');
  copy.append(el('p', 'eyebrow', eyebrow), el('h2', '', title), el('p', '', description));
  header.append(copy);
  if (actions.length) {
    const actionGroup = el('section', 'heading-actions');
    actions.forEach((action) => actionGroup.append(action));
    header.append(actionGroup);
  }
  return header;
}

function countStatus(items, status) {
  return items.filter((item) => item.status === status).length;
}

function statCard({ label, value, iconName, tone = '', trend = '', trendText = '', foot = '' }) {
  const article = el('article', 'metric-card');
  const top = el('header', 'metric-topline');
  top.append(el('span', 'metric-label', label));
  const iconBox = el('span', `metric-icon ${tone}`);
  iconBox.append(icon(iconName));
  top.append(iconBox);
  article.append(top);
  const valueLine = el('p', 'metric-value', value);
  article.append(valueLine);
  const bottom = el('footer', 'metric-bottom');
  if (trend) {
    const direction = trend.startsWith('-') ? 'down' : 'up';
    const trendEl = el('span', `trend trend--${direction}`);
    trendEl.append(icon(direction === 'up' ? 'trending-up' : 'trending-down'), el('span', '', trend));
    bottom.append(trendEl);
  }
  if (trendText) bottom.append(el('span', '', trendText));
  if (foot) bottom.append(el('span', '', foot));
  article.append(bottom);
  return article;
}

function createChartSvg(data, metric = 'revenue', className = 'sales-chart') {
  const selected = data.slice(-7);
  const metricConfig = {
    revenue: { title: 'Выручка за последние 7 дней', key: 'revenue', formatter: formatCurrency, axisFormatter: (value) => `${Math.round(value / 1000)}k` },
    orders: { title: 'Количество заказов за последние 7 дней', key: 'orders', formatter: formatNumber, axisFormatter: (value) => String(Math.round(value)) },
    averageOrder: { title: 'Средний чек за последние 7 дней', key: 'averageOrder', formatter: formatCurrency, axisFormatter: (value) => `${Math.round(value / 100) / 10}k` }
  };
  const config = metricConfig[metric] || metricConfig.revenue;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 700 224');
  svg.setAttribute('class', className);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-labelledby', `chart-title-${metric}`);
  const title = document.createElementNS(SVG_NS, 'title');
  title.setAttribute('id', `chart-title-${metric}`);
  title.textContent = config.title;
  svg.append(title);

  const left = 48;
  const right = 690;
  const top = 18;
  const bottom = 178;
  const values = selected.map((item) => Number(item[config.key]) || 0);
  const max = Math.max(...values, 1) * 1.15;
  for (let grid = 0; grid <= 4; grid += 1) {
    const y = bottom - ((bottom - top) * grid / 4);
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(left));
    line.setAttribute('x2', String(right));
    line.setAttribute('y1', String(y));
    line.setAttribute('y2', String(y));
    line.setAttribute('class', 'chart-grid-line');
    svg.append(line);
    const axisLabel = document.createElementNS(SVG_NS, 'text');
    axisLabel.setAttribute('x', '39');
    axisLabel.setAttribute('y', String(y + 4));
    axisLabel.setAttribute('text-anchor', 'end');
    axisLabel.textContent = config.axisFormatter(max * grid / 4);
    svg.append(axisLabel);
  }
  const slot = (right - left) / selected.length;
  selected.forEach((item, index) => {
    const val = values[index];
    const h = Math.max(3, (val / max) * (bottom - top));
    const width = Math.min(48, slot * .53);
    const x = left + slot * index + (slot - width) / 2;
    const y = bottom - h;
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(x));
    rect.setAttribute('y', String(y));
    rect.setAttribute('width', String(width));
    rect.setAttribute('height', String(h));
    rect.setAttribute('rx', '5');
    rect.setAttribute('class', `chart-bar${index === selected.length - 1 ? ' is-highlight' : ''}`);
    rect.style.animationDelay = `${index * 35}ms`;
    const rectTitle = document.createElementNS(SVG_NS, 'title');
    rectTitle.textContent = `${formatDate(item.date)} · ${config.formatter(val)}`;
    rect.append(rectTitle);
    svg.append(rect);
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', String(x + width / 2));
    label.setAttribute('y', '204');
    label.setAttribute('text-anchor', 'middle');
    label.textContent = new Intl.DateTimeFormat('ru-RU', { day: '2-digit' }).format(new Date(item.date));
    svg.append(label);
  });
  return svg;
}

function chartTabs(activeMetric) {
  const wrapper = el('section', 'chart-tabs');
  wrapper.setAttribute('aria-label', 'Показатель графика');
  const list = el('section', 'tab-list');
  list.setAttribute('role', 'tablist');
  list.setAttribute('aria-label', 'Метрика продаж');
  const tabs = [
    { id: 'revenue', label: 'Выручка' },
    { id: 'orders', label: 'Заказы' },
    { id: 'averageOrder', label: 'Средний чек' }
  ];
  tabs.forEach((tab) => {
    const button = el('button', 'tab-button', tab.label);
    button.type = 'button';
    button.id = `tab-${tab.id}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', String(tab.id === activeMetric));
    button.setAttribute('aria-controls', `chart-panel-${tab.id}`);
    button.tabIndex = tab.id === activeMetric ? 0 : -1;
    button.dataset.chartTab = tab.id;
    list.append(button);
  });
  wrapper.append(list);
  return wrapper;
}

function chartPanel(data, metric = 'revenue', large = false) {
  const panel = el('article', `panel chart-panel${large ? ' analytics-large-chart' : ''}`);
  panel.id = `chart-panel-${metric}`;
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', `tab-${metric}`);
  panel.tabIndex = 0;
  const recent = data.slice(-7);
  const metricConfig = {
    revenue: { title: formatCurrency(recent.reduce((sum, item) => sum + item.revenue, 0)), sub: 'выручка за 7 дней', change: '+8,6% к прошлой неделе' },
    orders: { title: formatNumber(recent.reduce((sum, item) => sum + item.orders, 0)), sub: 'заказов за 7 дней', change: '+6,2% к прошлой неделе' },
    averageOrder: { title: formatCurrency(Math.round(recent.reduce((sum, item) => sum + item.averageOrder, 0) / Math.max(recent.length, 1))), sub: 'средний чек', change: '+2,4% к прошлой неделе' }
  };
  const info = metricConfig[metric] || metricConfig.revenue;
  const header = el('header', 'panel-header');
  const titleGroup = el('section');
  titleGroup.append(el('h3', 'panel-title', large ? 'Динамика продаж' : 'Продажи за неделю'), el('p', 'panel-subtitle', 'Сравнение по последним 7 дням'));
  const controls = el('section', 'chart-header-controls');
  controls.append(el('strong', 'chart-total', info.title), el('span', 'chart-change', info.change));
  header.append(titleGroup, controls);
  panel.append(header, chartTabs(metric));
  const visual = el('figure', 'chart-visual');
  visual.append(createChartSvg(data, metric));
  const caption = el('figcaption', 'sr-only', `${info.title}; ${info.sub}. Значения за последние семь дней.`);
  visual.append(caption);
  panel.append(visual);
  const footer = el('footer', 'chart-footer');
  const legend = el('ul', 'chart-legend');
  const first = el('li');
  first.append(el('span', 'legend-dot'), el('span', '', metric === 'revenue' ? 'Выручка' : metric === 'orders' ? 'Заказы' : 'Средний чек'));
  legend.append(first);
  const second = el('li');
  second.append(el('span', 'legend-dot legend-dot--green'), el('span', '', 'Последний день'));
  legend.append(second);
  footer.append(legend, el('span', '', info.sub));
  panel.append(footer);
  return panel;
}

function progressRow(label, count, total, tone = '') {
  const row = el('li', 'status-row');
  const heading = el('header', 'status-row-heading');
  heading.append(el('span', '', label), el('strong', '', formatNumber(count)));
  const track = el('span', 'progress-track');
  const fill = el('span', `progress-fill ${tone}`);
  fill.style.width = `${total ? (count / total) * 100 : 0}%`;
  fill.setAttribute('aria-hidden', 'true');
  track.append(fill);
  row.append(heading, track);
  return row;
}

function orderNumberCell(order) {
  const button = el('button', 'order-number');
  button.type = 'button';
  button.dataset.action = 'open-detail';
  button.dataset.entity = 'orders';
  button.dataset.id = order.id;
  button.append(el('span', 'order-dot'), el('span', '', order.number));
  return button;
}

function customerCell(item) {
  const wrapper = el('span', 'customer-cell');
  wrapper.append(el('strong', '', item.customer), el('address', '', item.email || 'Клиент магазина'));
  return wrapper;
}

function dateCell(value, includeTime = false) {
  const wrapper = el('span', 'table-date');
  const date = el('time', '');
  date.dateTime = value || '';
  date.textContent = formatDate(value, { year: true });
  wrapper.append(date);
  if (includeTime) wrapper.append(el('small', '', new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))));
  return wrapper;
}

function detailAction(entity, item) {
  const button = el('button', 'row-action');
  button.type = 'button';
  button.dataset.action = 'open-detail';
  button.dataset.entity = entity;
  button.dataset.id = item.id;
  button.setAttribute('aria-label', `Открыть подробности: ${item.title || item.number || item.name}`);
  button.append(icon('chevron-right'));
  return button;
}

function createTable({ caption, headers, rows, entity, sortKey = '', sortDir = 'desc', className = '' }) {
  const wrapper = el('section', 'table-scroll');
  const table = el('table', `data-table ${className}`.trim());
  const captionEl = el('caption', '', caption);
  table.append(captionEl);
  const thead = el('thead');
  const headerRow = el('tr');
  headers.forEach((header, index) => {
    const th = el('th');
    th.scope = 'col';
    if (header.key === sortKey) th.setAttribute('aria-sort', sortDir === 'asc' ? 'ascending' : 'descending');
    if (header.sort !== false && header.key) {
      const button = el('button', 'sort-button');
      button.type = 'button';
      button.dataset.action = 'sort';
      button.dataset.sortKey = header.key;
      button.dataset.viewKey = entity;
      button.append(el('span', '', header.label));
      const arrow = el('span', 'sort-indicator', header.key === sortKey ? (sortDir === 'asc' ? '↑' : '↓') : '↕');
      arrow.setAttribute('aria-hidden', 'true');
      button.append(arrow);
      th.append(button);
    } else {
      th.textContent = header.label;
    }
    headerRow.append(th);
  });
  thead.append(headerRow);
  table.append(thead);
  const tbody = el('tbody');
  rows.forEach((item) => {
    const tr = el('tr');
    tr.dataset.entity = entity;
    tr.dataset.id = item.id;
    headers.forEach((header) => {
      const td = el('td');
      td.dataset.label = header.label;
      if (header.key === 'id') td.classList.add('action-cell');
      const value = header.key ? item[header.key] : null;
      const content = header.render ? header.render(value, item) : el('span', '', value ?? '—');
      if (content instanceof Node) td.append(content);
      else td.textContent = content === null || content === undefined ? '—' : String(content);
      tr.append(td);
    });
    tbody.append(tr);
  });
  table.append(tbody);
  wrapper.append(table);
  return wrapper;
}

function pagination(view, page, count, perPage) {
  const totalPages = Math.max(1, Math.ceil(count / perPage));
  const footer = el('footer', 'panel-table-footer');
  const start = count ? (page - 1) * perPage + 1 : 0;
  const end = Math.min(page * perPage, count);
  footer.append(el('span', '', `Показано ${start}–${end} из ${formatNumber(count)}`));
  const nav = el('nav', 'pagination');
  nav.setAttribute('aria-label', 'Страницы списка');
  const previous = el('button');
  previous.type = 'button';
  previous.dataset.action = 'paginate';
  previous.dataset.viewKey = view;
  previous.dataset.page = String(page - 1);
  previous.disabled = page <= 1;
  previous.setAttribute('aria-label', 'Предыдущая страница');
  previous.append(icon('chevron-left'));
  nav.append(previous);
  for (let number = 1; number <= totalPages; number += 1) {
    const button = el('button', '', number);
    button.type = 'button';
    button.dataset.action = 'paginate';
    button.dataset.viewKey = view;
    button.dataset.page = String(number);
    if (number === page) button.setAttribute('aria-current', 'page');
    nav.append(button);
  }
  const next = el('button');
  next.type = 'button';
  next.dataset.action = 'paginate';
  next.dataset.viewKey = view;
  next.dataset.page = String(page + 1);
  next.disabled = page >= totalPages;
  next.setAttribute('aria-label', 'Следующая страница');
  next.append(icon('chevron-right'));
  nav.append(next);
  footer.append(nav);
  return footer;
}

function emptyState(title, message, buttonLabel = 'Сбросить фильтры') {
  const section = el('section', 'empty-state');
  section.append(el('span', 'empty-illustration'));
  section.querySelector('.empty-illustration').append(icon('empty'));
  section.append(el('h3', '', title), el('p', '', message));
  const button = actionButton('reset-filters', buttonLabel, 'secondary-button', 'refresh');
  button.dataset.viewKey = '';
  section.append(button);
  return section;
}

function filterControls(view, statusOptions, multiLabel, multiOptions, filters) {
  const form = el('form', 'filter-panel');
  form.dataset.filterForm = view;
  const searchField = el('section', 'filter-field');
  const searchId = `${view}-search`;
  const searchLabel = el('label', '', 'Поиск');
  searchLabel.htmlFor = searchId;
  const searchWrap = el('span', 'input-wrap');
  searchWrap.append(icon('search'));
  const search = el('input', 'text-input');
  search.type = 'search';
  search.id = searchId;
  search.placeholder = view === 'orders' ? 'Номер, клиент или email…' : view === 'products' ? 'Название, SKU или категория…' : 'Возврат, клиент или заказ…';
  search.value = filters.query;
  search.autocomplete = 'off';
  search.dataset.filterKind = 'query';
  search.dataset.viewKey = view;
  searchWrap.append(search);
  searchField.append(searchLabel, searchWrap);

  const statusField = el('section', 'filter-field');
  const statusId = `${view}-status`;
  const statusLabel = el('label', '', 'Статус');
  statusLabel.htmlFor = statusId;
  const selectWrap = el('span', 'select-wrap');
  const select = el('select', 'select-input');
  select.id = statusId;
  select.dataset.filterKind = 'status';
  select.dataset.viewKey = view;
  const allOption = el('option', '', 'Все статусы');
  allOption.value = 'all';
  select.append(allOption);
  statusOptions.forEach((status) => {
    const option = el('option', '', status);
    option.value = status;
    select.append(option);
  });
  select.value = filters.status;
  selectWrap.append(select);
  statusField.append(statusLabel, selectWrap);

  const multiField = el('fieldset', 'checkbox-group checkbox-field');
  const legend = el('legend', '', multiLabel);
  multiField.append(legend);
  multiOptions.forEach((option) => {
    const label = el('label', 'custom-check');
    const input = el('input');
    input.type = 'checkbox';
    input.value = option;
    input.checked = filters.multi.includes(option);
    input.dataset.filterKind = 'multi';
    input.dataset.viewKey = view;
    label.append(input, el('span', '', option));
    multiField.append(label);
  });

  const footer = el('section', 'filter-footer');
  const viewField = el('fieldset', 'filter-view');
  viewField.append(el('legend', '', 'Отображение'));
  const tabs = el('section', 'tab-list');
  tabs.setAttribute('role', 'radiogroup');
  tabs.setAttribute('aria-label', 'Вид списка');
  [['table', 'Таблица', 'list'], ['cards', 'Карточки', 'layout']].forEach(([value, labelText, iconName]) => {
    const label = el('label', 'custom-radio');
    const input = el('input');
    input.type = 'radio';
    input.name = `${view}-display-mode`;
    input.value = value;
    input.checked = filters.view === value;
    input.dataset.filterKind = 'view';
    input.dataset.viewKey = view;
    label.append(input, icon(iconName), el('span', '', labelText));
    tabs.append(label);
  });
  viewField.append(tabs);
  const resetButton = actionButton('reset-filters', 'Сбросить', 'tertiary-button', 'refresh');
  resetButton.dataset.viewKey = view;
  footer.append(viewField, resetButton);
  form.append(searchField, statusField, multiField, footer);
  return form;
}

function filterAndViewPanel({ view, title, description, records, filters, statuses, multiLabel, multiOptions, table, cardGrid, countLabel = 'записей' }) {
  const section = el('section', 'list-view');
  section.append(pageHeading('УПРАВЛЕНИЕ МАГАЗИНОМ', title, description, [actionButton('export', 'Экспорт CSV', 'secondary-button', 'download') ]));
  section.append(filterControls(view, statuses, multiLabel, multiOptions, filters));
  const panel = el('article', 'panel table-panel');
  const header = el('header', 'panel-header');
  const titleGroup = el('section', 'table-title-group');
  titleGroup.append(el('h3', 'panel-title', view === 'orders' ? 'Все заказы' : view === 'products' ? 'Каталог товаров' : 'Запросы на возврат'));
  const meta = el('p', 'table-meta');
  meta.append(el('span', 'result-count', String(records.length)), el('span', '', countLabel));
  titleGroup.append(meta);
  header.append(titleGroup);
  const quickButton = actionButton(view === 'orders' ? 'new-order' : view === 'products' ? 'new-product' : 'export', view === 'orders' ? 'Новый заказ' : view === 'products' ? 'Новый товар' : 'Экспорт', 'primary-button', 'plus');
  header.append(quickButton);
  panel.append(header);
  if (!records.length) {
    panel.append(emptyState('Ничего не найдено', 'Измените поиск или фильтры, чтобы увидеть записи.'));
  } else if (filters.view === 'cards') {
    panel.append(cardGrid(records));
    panel.append(pagination(view, filters.page, records.length, 8));
  } else {
    panel.append(table(records));
    panel.append(pagination(view, filters.page, records.length, 8));
  }
  section.append(panel);
  return section;
}

function orderTable(orders, filters) {
  return createTable({
    caption: 'Таблица заказов. Нажмите на заголовок колонки, чтобы сортировать.',
    entity: 'orders', sortKey: filters.sortKey, sortDir: filters.sortDir, className: 'data-table--list', rows: orders,
    headers: [
      { key: 'number', label: 'Заказ', render: (value, item) => orderNumberCell(item) },
      { key: 'customer', label: 'Покупатель', render: (value, item) => customerCell(item) },
      { key: 'createdAt', label: 'Дата', render: (value) => dateCell(value, true) },
      { key: 'total', label: 'Сумма', render: (value) => el('strong', 'money', formatCurrency(value)) },
      { key: 'status', label: 'Статус', render: (value) => statusBadge(value) },
      { key: 'channel', label: 'Канал' },
      { key: 'id', label: 'Детали', sort: false, render: (value, item) => detailAction('orders', item) }
    ]
  });
}

function productTable(products, filters) {
  return createTable({
    caption: 'Таблица каталога товаров. Нажмите на заголовок колонки, чтобы сортировать.',
    entity: 'products', sortKey: filters.sortKey, sortDir: filters.sortDir, className: 'data-table--products', rows: products,
    headers: [
      { key: 'sku', label: 'Товар', render: (value, item) => {
        const wrapper = el('span', 'customer-cell');
        wrapper.append(el('strong', '', item.name), el('small', '', value));
        return wrapper;
      } },
      { key: 'category', label: 'Категория' },
      { key: 'price', label: 'Цена', render: (value) => el('strong', 'money', formatCurrency(value)) },
      { key: 'stock', label: 'Остаток', render: (value, item) => {
        const wrapper = el('span', 'customer-cell');
        wrapper.append(el('strong', '', `${value} шт.`), el('small', '', `Продано за 30 дней: ${item.metrics.sold30d}`));
        return wrapper;
      } },
      { key: 'status', label: 'Статус', render: (value) => statusBadge(value) },
      { key: 'updatedAt', label: 'Обновлён', render: (value) => makeTime(value) },
      { key: 'id', label: 'Детали', sort: false, render: (value, item) => detailAction('products', item) }
    ]
  });
}

function returnTable(returns, filters) {
  return createTable({
    caption: 'Таблица запросов на возврат. Нажмите на заголовок колонки, чтобы сортировать.',
    entity: 'returns', sortKey: filters.sortKey, sortDir: filters.sortDir, className: 'data-table--returns', rows: returns,
    headers: [
      { key: 'number', label: 'Возврат', render: (value, item) => {
        const button = el('button', 'order-number', value);
        button.type = 'button'; button.dataset.action = 'open-detail'; button.dataset.entity = 'returns'; button.dataset.id = item.id;
        return button;
      } },
      { key: 'customer', label: 'Покупатель', render: (value, item) => customerCell(item) },
      { key: 'product', label: 'Товар' },
      { key: 'reason', label: 'Причина' },
      { key: 'amount', label: 'Сумма', render: (value) => el('strong', 'money', formatCurrency(value)) },
      { key: 'status', label: 'Статус', render: (value) => statusBadge(value) },
      { key: 'id', label: 'Детали', sort: false, render: (value, item) => detailAction('returns', item) }
    ]
  });
}

function entityTagList(tags = []) {
  const list = el('ul', 'entity-card__tags');
  list.setAttribute('aria-label', 'Метки записи');
  tags.forEach((tag) => list.append(el('li', 'entity-card__tag', tag)));
  return list;
}

function entityCardGrid(entity, items) {
  const grid = el('section', 'entity-grid');
  grid.setAttribute('aria-label', 'Карточки записей');
  items.forEach((item) => {
    const card = el('article', 'entity-card');
    const header = el('header');
    const iconBox = el('span', 'card-top-icon');
    if (entity === 'products') iconBox.append(icon('package'));
    else if (entity === 'returns') iconBox.append(icon('refresh'));
    else iconBox.append(icon('shopping-bag'));
    header.append(iconBox, statusBadge(item.status));
    card.append(header);
    if (entity === 'orders') {
      card.append(
        el('p', 'eyebrow', item.number),
        el('h3', '', item.customer),
        el('p', 'entity-card__description', item.description),
        el('p', 'entity-price', formatCurrency(item.total))
      );
      const footer = el('footer');
      footer.append(makeTime(item.createdAt), el('span', 'entity-card__responsible', `Ответственный: ${item.assignedTo}`), priorityLabel(item.priority));
      card.append(footer, entityTagList(item.tags));
    } else if (entity === 'products') {
      card.append(
        el('p', 'eyebrow', item.sku),
        el('h3', '', item.name),
        el('p', 'entity-card__description', item.description),
        el('p', 'entity-price', formatCurrency(item.price))
      );
      const stock = el('section', 'stock-line');
      stock.append(el('span', '', 'Остаток'), el('strong', '', `${item.stock} шт.`));
      card.append(stock);
      const track = el('span', 'product-stock-track');
      const fill = el('span', `product-stock-fill${item.stock === 0 ? ' product-stock-fill--none' : item.stock < 10 ? ' product-stock-fill--low' : ''}`);
      fill.style.width = `${Math.min(item.stock, 100)}%`;
      track.append(fill);
      card.append(track);
      const footer = el('footer');
      footer.append(makeTime(item.updatedAt), el('span', 'entity-card__responsible', `Ответственный: ${item.assignedTo}`), el('span', '', item.category), el('span', '', `Продажи: ${item.metrics.sold30d}`));
      card.append(footer, entityTagList(item.tags));
    } else {
      card.append(
        el('p', 'eyebrow', item.number),
        el('h3', '', item.product),
        el('p', 'entity-card__description', item.description),
        el('p', 'entity-price', formatCurrency(item.amount))
      );
      const footer = el('footer');
      footer.append(makeTime(item.requestedAt), el('span', 'entity-card__responsible', `Ответственный: ${item.assignedTo}`), priorityLabel(item.priority));
      card.append(footer, el('p', 'form-hint', `${item.orderNumber} · ${item.reason}`), entityTagList(item.tags));
    }
    const open = el('button', 'entity-card__open');
    open.type = 'button';
    open.dataset.action = 'open-detail';
    open.dataset.entity = entity;
    open.dataset.id = item.id;
    open.append(el('span', '', entity === 'orders' ? 'Открыть заказ' : entity === 'products' ? 'Карточка товара' : 'Детали возврата'), icon('arrow-right'));
    card.append(open);
    grid.append(card);
  });
  return grid;
}

export function renderOrdersPage({ items, filterState, statuses, multiOptions }) {
  return filterAndViewPanel({
    view: 'orders', title: 'Заказы', description: 'Следите за оплатой, сборкой и доставкой в одном месте.', records: items, filters: filterState,
    statuses, multiLabel: 'Канал продаж', multiOptions,
    table: (rows) => orderTable(rows.slice((filterState.page - 1) * 8, filterState.page * 8), filterState),
    cardGrid: (rows) => entityCardGrid('orders', rows.slice((filterState.page - 1) * 8, filterState.page * 8))
  });
}

export function renderProductsPage({ items, filterState, statuses, multiOptions }) {
  return filterAndViewPanel({
    view: 'products', title: 'Товары', description: 'Управляйте каталогом, ценами и доступностью товаров.', records: items, filters: filterState,
    statuses, multiLabel: 'Категории', multiOptions,
    table: (rows) => productTable(rows.slice((filterState.page - 1) * 8, filterState.page * 8), filterState),
    cardGrid: (rows) => entityCardGrid('products', rows.slice((filterState.page - 1) * 8, filterState.page * 8))
  });
}

export function renderReturnsPage({ items, filterState, statuses, multiOptions }) {
  const section = el('section', 'return-page');
  const page = filterAndViewPanel({
    view: 'returns', title: 'Возвраты', description: 'Обрабатывайте заявки, проверяйте причины и контролируйте выплаты.', records: items, filters: filterState,
    statuses, multiLabel: 'Причины', multiOptions,
    table: (rows) => returnTable(rows.slice((filterState.page - 1) * 8, filterState.page * 8), filterState),
    cardGrid: (rows) => entityCardGrid('returns', rows.slice((filterState.page - 1) * 8, filterState.page * 8))
  });
  const note = el('aside', 'return-note');
  note.append(icon('warning'));
  const copy = el('section');
  copy.append(el('strong', '', 'Не забудьте проверить возвраты на этой неделе'), el('p', '', 'Заявки со статусом «Новый» и «На проверке» требуют действий команды. Решение по каждой заявке сохраняется в карточке возврата.'));
  note.append(copy);
  section.append(page, note);
  return section;
}

function recentOrdersPanel(orders) {
  const panel = el('article', 'panel');
  const header = el('header', 'panel-header');
  const group = el('section');
  group.append(el('h3', 'panel-title', 'Последние заказы'), el('p', 'panel-subtitle', 'Недавняя активность магазина'));
  header.append(group);
  const link = actionButton('navigate', 'Все заказы', 'panel-link', 'arrow-right');
  link.dataset.view = 'orders';
  header.append(link);
  panel.append(header);
  const rows = orders.slice(0, 5);
  panel.append(createTable({
    caption: 'Пять последних заказов', entity: 'orders', rows,
    headers: [
      { key: 'number', label: 'Заказ', render: (value, item) => orderNumberCell(item) },
      { key: 'customer', label: 'Покупатель', render: (value, item) => customerCell(item) },
      { key: 'status', label: 'Статус', render: (value) => statusBadge(value) },
      { key: 'total', label: 'Сумма', render: (value) => el('strong', 'money', formatCurrency(value)) }
    ]
  }));
  return panel;
}

function attentionPanel(returns) {
  const panel = el('article', 'panel');
  const header = el('header', 'panel-header');
  const group = el('section');
  group.append(el('h3', 'panel-title', 'Требуют внимания'), el('p', 'panel-subtitle', 'Возвраты на вашей стороне'));
  header.append(group);
  const link = actionButton('navigate', 'Все', 'panel-link', 'arrow-right');
  link.dataset.view = 'returns';
  header.append(link);
  panel.append(header);
  const body = el('section', 'panel-body');
  const list = el('ul', 'status-list');
  const current = returns.filter((item) => ['Новый', 'На проверке'].includes(item.status)).slice(0, 4);
  current.forEach((item) => {
    const row = el('li');
    const button = el('button', 'attention-item');
    button.type = 'button';
    button.dataset.action = 'open-detail';
    button.dataset.entity = 'returns';
    button.dataset.id = item.id;
    const main = el('span', 'attention-main');
    main.append(el('strong', '', item.number), el('small', '', item.product));
    button.append(main, el('span', 'attention-amount', formatCurrency(item.amount)), icon('chevron-right'));
    row.append(button);
    list.append(row);
  });
  if (!current.length) list.append(el('li', 'empty-small', 'Нет возвратов, ожидающих действий.'));
  body.append(list);
  panel.append(body);
  return panel;
}

export function renderOverview({ orders, products, returns, sales, chartMetric = 'revenue' }) {
  const section = el('section', 'overview-view');
  const currentSales = sales[sales.length - 1] || { revenue: 0, orders: 0, averageOrder: 0, comparison: { revenueChange: 0, ordersChange: 0 } };
  const pendingReturns = returns.filter((item) => ['Новый', 'На проверке'].includes(item.status));
  const pendingValue = pendingReturns.reduce((sum, item) => sum + item.amount, 0);
  const headingActions = [];
  const actionWrap = el('section', 'action-menu');
  const exportButton = actionButton('toggle-actions', 'Действия', 'secondary-button', 'chevron-down');
  exportButton.setAttribute('aria-haspopup', 'menu');
  exportButton.setAttribute('aria-expanded', 'false');
  exportButton.id = 'actions-menu-trigger';
  const menu = el('ul', 'dropdown-menu');
  menu.id = 'actions-menu';
  menu.setAttribute('role', 'menu');
  menu.hidden = true;
  [['export', 'Экспортировать CSV', 'download'], ['new-order', 'Создать заказ', 'plus'], ['analytics-report', 'Сводка по продажам', 'chart']].forEach(([action, label, iconName]) => {
    const li = el('li');
    const button = el('button');
    button.type = 'button'; button.dataset.action = action; button.setAttribute('role', 'menuitem');
    button.append(icon(iconName), el('span', '', label));
    li.append(button); menu.append(li);
  });
  actionWrap.append(exportButton, menu);
  const newOrder = actionButton('new-order', 'Новый заказ', 'primary-button', 'plus');
  headingActions.push(actionWrap, newOrder);
  const headingDateText = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).toLocaleUpperCase('ru-RU');
  const heading = pageHeading(headingDateText, 'Добрый день, Климов Илья 👋', 'Вот что происходит в вашем магазине прямо сейчас.', headingActions);
  const eyebrow = heading.querySelector('.eyebrow');
  const headingDate = el('time', 'eyebrow');
  const today = new Date();
  headingDate.dateTime = today.toISOString().slice(0, 10);
  headingDate.textContent = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(today).toLocaleUpperCase('ru-RU');
  eyebrow.replaceWith(headingDate);
  section.append(heading);

  const metrics = el('section', 'metric-grid');
  metrics.setAttribute('aria-label', 'Ключевые показатели');
  metrics.append(
    statCard({ label: 'Выручка сегодня', value: formatCurrency(currentSales.revenue), iconName: 'wallet', trend: `+${String(currentSales.comparison.revenueChange).replace('.', ',')}%`, trendText: 'к предыдущему дню', tone: '' }),
    statCard({ label: 'Заказы сегодня', value: formatNumber(currentSales.orders), iconName: 'shopping-bag', trend: `+${String(currentSales.comparison.ordersChange).replace('.', ',')}%`, trendText: 'к предыдущему дню', tone: 'metric-icon--green' }),
    statCard({ label: 'Средний чек', value: formatCurrency(currentSales.averageOrder), iconName: 'credit-card', trend: '+2,4%', trendText: 'за последние 7 дней', tone: 'metric-icon--blue' }),
    statCard({ label: 'Возвраты в работе', value: formatNumber(pendingReturns.length), iconName: 'rotate-ccw', trendText: formatCurrency(pendingValue), foot: 'сумма заявок', tone: 'metric-icon--amber' })
  );
  section.append(metrics);

  const mainGrid = el('section', 'dashboard-grid');
  mainGrid.append(chartPanel(sales, chartMetric));
  const statusPanel = el('article', 'panel');
  const header = el('header', 'panel-header');
  const group = el('section');
  group.append(el('h3', 'panel-title', 'Статус заказов'), el('p', 'panel-subtitle', 'Распределение всех заказов'));
  header.append(group, actionButton('navigate', 'Подробнее', 'panel-link', 'arrow-right', { 'data-view': 'orders' }));
  statusPanel.append(header);
  const body = el('section', 'panel-body');
  const total = Math.max(orders.length, 1);
  const statuses = [
    ['Доставлен', countStatus(orders, 'Доставлен'), 'progress-fill--green'],
    ['В обработке', countStatus(orders, 'В обработке'), 'progress-fill--amber'],
    ['Отправлен', countStatus(orders, 'Отправлен'), 'progress-fill--blue'],
    ['Оплачен', countStatus(orders, 'Оплачен'), ''],
    ['Новый', countStatus(orders, 'Новый'), 'progress-fill--muted'],
    ['Отменён', countStatus(orders, 'Отменён'), 'progress-fill--muted']
  ];
  const list = el('ul', 'status-list');
  statuses.forEach(([label, count, tone]) => list.append(progressRow(label, count, total, tone)));
  body.append(list);
  const quick = el('section', 'quick-stats');
  const outOfStock = products.filter((product) => product.stock === 0).length;
  const lowStock = products.filter((product) => product.stock > 0 && product.stock < 10).length;
  [[ 'Товаров в каталоге', products.length ], [ 'Низкий остаток', lowStock + outOfStock ]].forEach(([label, value]) => {
    const item = el('article', 'quick-stat'); item.append(el('span', '', label), el('strong', '', value)); quick.append(item);
  });
  body.append(quick);
  statusPanel.append(body);
  mainGrid.append(statusPanel);
  section.append(mainGrid);

  const lower = el('section', 'dashboard-lower');
  lower.append(recentOrdersPanel(orders), attentionPanel(returns));
  section.append(lower);
  return section;
}

export function renderAnalyticsPage({ sales, chartMetric = 'revenue' }) {
  const section = el('section', 'analytics-page');
  const last7 = sales.slice(-7);
  const revenue = last7.reduce((sum, item) => sum + item.revenue, 0);
  const orderCount = last7.reduce((sum, item) => sum + item.orders, 0);
  const returnsValue = last7.reduce((sum, item) => sum + item.returns, 0);
  const aov = Math.round(revenue / Math.max(orderCount, 1));
  section.append(pageHeading('АНАЛИТИКА', 'Аналитика продаж', 'Изучайте динамику выручки, заказов и среднего чека за последние 7 дней.', [actionButton('export', 'Выгрузить отчёт', 'secondary-button', 'download')]));
  const summary = el('section', 'analytics-summary');
  summary.append(
    statCard({ label: 'Выручка за 7 дней', value: formatCurrency(revenue), iconName: 'wallet', trend: '+8,6%', trendText: 'к прошлой неделе' }),
    statCard({ label: 'Всего заказов', value: formatNumber(orderCount), iconName: 'shopping-bag', trend: '+6,2%', trendText: 'к прошлой неделе', tone: 'metric-icon--green' }),
    statCard({ label: 'Средний чек', value: formatCurrency(aov), iconName: 'credit-card', trend: '+2,4%', trendText: 'к прошлой неделе', tone: 'metric-icon--blue' }),
    statCard({ label: 'Сумма возвратов', value: formatCurrency(returnsValue), iconName: 'rotate-ccw', trendText: 'за последние 7 дней', tone: 'metric-icon--amber' })
  );
  section.append(summary);
  const grid = el('section', 'analytics-grid');
  grid.append(chartPanel(sales, chartMetric, true));
  const channels = el('article', 'panel');
  const header = el('header', 'panel-header');
  const copy = el('section');
  copy.append(el('h3', 'panel-title', 'Продажи по каналам'), el('p', 'panel-subtitle', 'Доля в выручке за последние 7 дней'));
  header.append(copy);
  channels.append(header);
  const body = el('section', 'panel-body');
  const totals = new Map();
  last7.forEach((day) => day.breakdown.forEach((entry) => totals.set(entry.channel, (totals.get(entry.channel) || 0) + entry.revenue)));
  const all = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const list = el('ul', 'channel-list');
  all.forEach(([name, amount], index) => {
    const row = el('li', 'channel-row');
    const label = el('span', 'channel-name');
    label.append(el('span', `channel-dot${index === 1 ? ' channel-dot--two' : index === 2 ? ' channel-dot--three' : ''}`), el('span', '', name));
    row.append(label, el('strong', '', formatCurrency(amount)));
    const track = el('span', 'progress-track');
    const fill = el('span', `progress-fill${index === 1 ? ' progress-fill--green' : index === 2 ? ' progress-fill--amber' : ''}`);
    fill.style.width = `${revenue ? (amount / all.reduce((sum, item) => sum + item[1], 0)) * 100 : 0}%`;
    track.append(fill);
    row.append(track);
    list.append(row);
  });
  body.append(list);
  channels.append(body);
  grid.append(channels);
  section.append(grid);
  const insight = el('aside', 'insight-card');
  insight.append(icon('sparkles'));
  const insightCopy = el('section');
  insightCopy.append(el('h3', '', 'Инсайт недели'), el('p', '', 'Выручка растёт вместе с количеством заказов. Проверьте остатки популярных товаров, чтобы не потерять конверсию в период повышенного спроса.'));
  insight.append(insightCopy);
  section.append(insight);
  const salesPanel = el('article', 'panel table-panel');
  const panelHeader = el('header', 'panel-header');
  const heading = el('section');
  heading.append(el('h3', 'panel-title', 'Дневная сводка'), el('p', 'panel-subtitle', 'Детализация по каждому дню'));
  panelHeader.append(heading, actionButton('export', 'Экспорт CSV', 'secondary-button', 'download'));
  salesPanel.append(panelHeader);
  salesPanel.append(createTable({
    caption: 'Дневные показатели продаж', entity: 'analytics', rows: [...last7].reverse(), className: 'data-table--list',
    headers: [
      { key: 'date', label: 'Дата', sort: false, render: (value) => makeTime(value) },
      { key: 'revenue', label: 'Выручка', sort: false, render: (value) => el('strong', 'money', formatCurrency(value)) },
      { key: 'orders', label: 'Заказы', sort: false, render: (value) => el('strong', 'money', formatNumber(value)) },
      { key: 'averageOrder', label: 'Средний чек', sort: false, render: (value) => el('strong', 'money', formatCurrency(value)) },
      { key: 'returns', label: 'Возвраты', sort: false, render: (value) => el('span', '', formatCurrency(value)) }
    ]
  }));
  section.append(salesPanel);
  return section;
}

export function renderSkeleton() {
  const section = el('section', 'loading-state');
  section.setAttribute('aria-label', 'Загрузка данных');
  section.append(el('span', 'skeleton skeleton--eyebrow'), el('span', 'skeleton skeleton--title'));
  const grid = el('section', 'skeleton-grid');
  for (let index = 0; index < 4; index += 1) grid.append(el('span', 'skeleton skeleton--card'));
  section.append(grid, el('span', 'skeleton skeleton--panel'));
  return section;
}
