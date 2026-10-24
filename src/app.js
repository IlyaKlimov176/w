import { orders, products, returns, sales, statusOptions } from './data.js';
import {
  el, icon, formatCurrency, formatNumber, formatDate, makeTime, statusBadge, priorityLabel,
  actionButton, pageHeading, renderOverview, renderOrdersPage, renderProductsPage,
  renderReturnsPage, renderAnalyticsPage, renderSkeleton
} from './render.js';

const pageContent = document.querySelector('#page-content');
const sidebar = document.querySelector('#sidebar');
const drawerOverlay = document.querySelector('#drawer-overlay');
const menuToggle = document.querySelector('#menu-toggle');
const modal = document.querySelector('#app-modal');
const modalTitle = document.querySelector('#modal-title');
const modalEyebrow = document.querySelector('#modal-eyebrow');
const modalBody = document.querySelector('#modal-body');
const modalFooter = document.querySelector('#modal-footer');
const modalClose = document.querySelector('#modal-close');
const toastRegion = document.querySelector('#toast-region');
const themeSelect = document.querySelector('#theme-select');
const accentPicker = document.querySelector('#accent-picker');

const collections = { orders, products, returns, analytics: sales };
const pageNames = { overview: 'Обзор', orders: 'Заказы', products: 'Товары', analytics: 'Аналитика', returns: 'Возвраты' };
const filterMeta = {
  orders: { statuses: statusOptions.orders, multiProperty: 'channel', multiOptions: ['Сайт', 'Маркетплейс', 'Мобильное приложение'] },
  products: { statuses: statusOptions.products, multiProperty: 'category', multiOptions: [...new Set(products.map((item) => item.category))].sort() },
  returns: { statuses: statusOptions.returns, multiProperty: 'reason', multiOptions: [...new Set(returns.map((item) => item.reason))].sort() }
};

const initialParams = new URLSearchParams(window.location.search);
const validViews = ['overview', 'orders', 'products', 'analytics', 'returns'];
const initialView = validViews.includes(initialParams.get('view')) ? initialParams.get('view') : 'overview';
const state = {
  view: initialView,
  chartMetric: 'revenue',
  filters: {
    orders: createFilterState('createdAt', initialParams.get('view') === 'orders' ? initialParams.get('page') : '1'),
    products: createFilterState('updatedAt', initialParams.get('view') === 'products' ? initialParams.get('page') : '1'),
    returns: createFilterState('requestedAt', initialParams.get('view') === 'returns' ? initialParams.get('page') : '1'),
    analytics: createFilterState('date', initialParams.get('view') === 'analytics' ? initialParams.get('page') : '1')
  },
  sidebarOpen: false,
  modalPreviousFocus: null,
  toastTimers: new Map()
};

function createFilterState(sortKey, page) {
  return { query: '', status: 'all', multi: [], view: 'table', page: Math.max(1, Number.parseInt(page || '1', 10) || 1), sortKey, sortDir: 'desc' };
}

function todayText() {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());
}

function updateHeader() {
  const title = pageNames[state.view] || 'Обзор';
  const breadcrumb = document.querySelector('#breadcrumb-current');
  const topTitle = document.querySelector('#topbar-title');
  breadcrumb.textContent = title;
  topTitle.textContent = state.view === 'overview' ? 'Панель управления' : title;
  document.title = `${title} — Northstar Commerce`;
  document.querySelectorAll('#primary-nav-list [data-view]').forEach((link) => {
    const active = link.dataset.view === state.view;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.querySelector('#orders-nav-count').textContent = String(orders.length);
  document.querySelector('#products-nav-count').textContent = String(products.length);
  document.querySelector('#returns-nav-count').textContent = String(returns.filter((item) => ['Новый', 'На проверке'].includes(item.status)).length);
  const todayNode = document.querySelector('#today-label');
  const formattedToday = todayText();
  todayNode.textContent = formattedToday;
  todayNode.dateTime = new Date().toISOString().slice(0, 10);
  document.querySelector('.topbar-date')?.setAttribute('aria-label', `Текущая дата: ${formattedToday}`);
}

function syncUrl(push = false) {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('view', state.view);
    const page = state.filters[state.view]?.page || 1;
    url.searchParams.set('page', String(page));
    if (push) window.history.pushState({ view: state.view, page }, '', url);
    else window.history.replaceState({ view: state.view, page }, '', url);
  } catch (error) {
    /* При запуске с file:// адресная строка может быть недоступна для History API. */
  }
}

function renderPage({ preserveFocus = false, updateUrl = true } = {}) {
  const focusInfo = preserveFocus ? getFocusInfo(document.activeElement) : null;
  updateHeader();
  let viewNode;
  if (state.view === 'orders') {
    const list = getFilteredItems('orders');
    viewNode = renderOrdersPage({ items: list, filterState: state.filters.orders, statuses: filterMeta.orders.statuses, multiOptions: filterMeta.orders.multiOptions });
  } else if (state.view === 'products') {
    const list = getFilteredItems('products');
    viewNode = renderProductsPage({ items: list, filterState: state.filters.products, statuses: filterMeta.products.statuses, multiOptions: filterMeta.products.multiOptions });
  } else if (state.view === 'returns') {
    const list = getFilteredItems('returns');
    viewNode = renderReturnsPage({ items: list, filterState: state.filters.returns, statuses: filterMeta.returns.statuses, multiOptions: filterMeta.returns.multiOptions });
  } else if (state.view === 'analytics') {
    viewNode = renderAnalyticsPage({ sales, chartMetric: state.chartMetric });
  } else {
    viewNode = renderOverview({ orders: [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), products, returns: [...returns].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)), sales, chartMetric: state.chartMetric });
  }
  pageContent.replaceChildren(viewNode);
  pageContent.setAttribute('aria-busy', 'false');
  if (updateUrl) syncUrl(false);
  if (focusInfo) restoreFocus(focusInfo);
  if (state.view === 'overview' || state.view === 'analytics') animateCounters(viewNode);
}

function getFocusInfo(node) {
  if (!(node instanceof HTMLElement)) return null;
  const info = { id: node.id || '', action: node.dataset.action || '', filterKind: node.dataset.filterKind || '', viewKey: node.dataset.viewKey || '', value: node.value || '', selectionStart: null, selectionEnd: null };
  if (typeof node.selectionStart === 'number') {
    info.selectionStart = node.selectionStart;
    info.selectionEnd = node.selectionEnd;
  }
  return info;
}

function restoreFocus(info) {
  let node = info.id ? document.getElementById(info.id) : null;
  if (!node && info.filterKind) {
    const candidates = [...pageContent.querySelectorAll('[data-filter-kind]')];
    node = candidates.find((candidate) => candidate.dataset.filterKind === info.filterKind && candidate.dataset.viewKey === info.viewKey && (candidate.value || '') === info.value) || null;
  }
  if (!node && info.action) node = pageContent.querySelector(`[data-action="${info.action}"]`);
  if (node && typeof node.focus === 'function') {
    node.focus({ preventScroll: true });
    if (info.selectionStart !== null && typeof node.setSelectionRange === 'function') {
      try { node.setSelectionRange(info.selectionStart, info.selectionEnd); } catch (error) { /* no-op */ }
    }
  }
}

function animateCounters(root) {
  root.querySelectorAll('.metric-value').forEach((node) => {
    node.classList.remove('counter-enter');
    requestAnimationFrame(() => node.classList.add('counter-enter'));
  });
}

function searchableText(item, view) {
  if (view === 'orders') return [item.number, item.title, item.customer, item.email, item.description, item.status, item.channel, item.paymentMethod, ...(item.tags || [])].join(' ').toLowerCase();
  if (view === 'products') return [item.name, item.title, item.sku, item.category, item.description, item.status, ...(item.tags || [])].join(' ').toLowerCase();
  if (view === 'returns') return [item.number, item.title, item.customer, item.product, item.orderNumber, item.reason, item.status, item.description, ...(item.tags || [])].join(' ').toLowerCase();
  return [item.title, item.description, item.date].join(' ').toLowerCase();
}

function getFilteredItems(view) {
  const filter = state.filters[view];
  let list = [...(collections[view] || [])];
  const query = filter.query.trim().toLowerCase();
  if (query) list = list.filter((item) => searchableText(item, view).includes(query));
  if (filter.status !== 'all') list = list.filter((item) => item.status === filter.status);
  const facet = filterMeta[view]?.multiProperty;
  if (facet && filter.multi.length) list = list.filter((item) => filter.multi.includes(item[facet]));
  const key = filter.sortKey;
  const direction = filter.sortDir === 'asc' ? 1 : -1;
  if (key) {
    list.sort((a, b) => {
      let left = a[key];
      let right = b[key];
      if (typeof left === 'string' && typeof right === 'string') {
        const leftDate = Date.parse(left);
        const rightDate = Date.parse(right);
        if (!Number.isNaN(leftDate) && !Number.isNaN(rightDate) && /At$|^date$/.test(key)) {
          left = leftDate; right = rightDate;
        } else {
          return left.localeCompare(right, 'ru', { numeric: true }) * direction;
        }
      }
      if (left === right) return 0;
      return (left > right ? 1 : -1) * direction;
    });
  }
  const totalPages = Math.max(1, Math.ceil(list.length / 8));
  filter.page = Math.min(Math.max(1, filter.page), totalPages);
  return list;
}

function navigate(view, { push = true, page = 1 } = {}) {
  if (!validViews.includes(view)) return;
  state.view = view;
  if (state.filters[view]) state.filters[view].page = Math.max(1, page);
  closeActionMenu();
  closeMobileMenu();
  renderPage({ updateUrl: false });
  syncUrl(push);
}

function closeActionMenu() {
  const menu = document.querySelector('#actions-menu');
  const trigger = document.querySelector('#actions-menu-trigger');
  if (menu) menu.hidden = true;
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
}

function toggleActionMenu() {
  const menu = document.querySelector('#actions-menu');
  const trigger = document.querySelector('#actions-menu-trigger');
  if (!menu || !trigger) return;
  menu.hidden = !menu.hidden;
  trigger.setAttribute('aria-expanded', String(!menu.hidden));
  if (!menu.hidden) menu.querySelector('[role="menuitem"]')?.focus();
}

function resetFilters(view) {
  const target = view && state.filters[view] ? view : state.view;
  if (!state.filters[target]) return;
  const defaultSort = target === 'orders' ? 'createdAt' : target === 'products' ? 'updatedAt' : target === 'returns' ? 'requestedAt' : 'date';
  state.filters[target] = createFilterState(defaultSort, '1');
  if (state.view !== target) state.view = target;
  renderPage({ preserveFocus: true });
  notify('Фильтры сброшены', 'Список показывает все доступные записи.');
}

function handleFilterInput(target) {
  const view = target.dataset.viewKey;
  const kind = target.dataset.filterKind;
  if (!view || !state.filters[view]) return;
  const filter = state.filters[view];
  if (kind === 'query') {
    filter.query = target.value;
    filter.page = 1;
    renderPage({ preserveFocus: true });
  }
}

function handleFilterChange(target) {
  const view = target.dataset.viewKey;
  const kind = target.dataset.filterKind;
  if (!view || !state.filters[view]) return;
  const filter = state.filters[view];
  if (kind === 'status') filter.status = target.value;
  else if (kind === 'multi') {
    if (target.checked && !filter.multi.includes(target.value)) filter.multi.push(target.value);
    else filter.multi = filter.multi.filter((value) => value !== target.value);
  } else if (kind === 'view') filter.view = target.value;
  else return;
  filter.page = 1;
  renderPage({ preserveFocus: true });
}

function changeSort(target) {
  const view = target.dataset.viewKey;
  if (!state.filters[view]) return;
  const filter = state.filters[view];
  const nextKey = target.dataset.sortKey;
  if (filter.sortKey === nextKey) filter.sortDir = filter.sortDir === 'asc' ? 'desc' : 'asc';
  else { filter.sortKey = nextKey; filter.sortDir = 'asc'; }
  filter.page = 1;
  renderPage({ preserveFocus: true });
}

function goToPage(view, requestedPage) {
  if (!state.filters[view]) return;
  const count = getFilteredItems(view).length;
  const totalPages = Math.max(1, Math.ceil(count / 8));
  state.filters[view].page = Math.min(Math.max(1, Number(requestedPage) || 1), totalPages);
  state.view = view;
  renderPage({ preserveFocus: true, updateUrl: false });
  syncUrl(true);
}

function openDetail(entity, id) {
  const collection = collections[entity];
  const item = collection?.find((record) => record.id === id);
  if (!item) return;
  state.modalPreviousFocus = document.activeElement;
  modalEyebrow.textContent = entity === 'orders' ? 'ЗАКАЗ' : entity === 'products' ? 'КАРТОЧКА ТОВАРА' : entity === 'returns' ? 'ВОЗВРАТ' : 'АНАЛИТИКА';
  modalTitle.textContent = item.title || item.name || item.number || 'Подробности';
  modalBody.replaceChildren();
  modalFooter.replaceChildren();
  modalBody.append(renderDetailContent(entity, item));
  modalFooter.append(actionButton('close-modal', 'Закрыть', 'secondary-button', null));
  if (entity === 'orders') {
    const action = actionButton('advance-order', nextOrderStatus(item.status), 'primary-button', 'check');
    action.dataset.id = item.id;
    action.disabled = ['Доставлен', 'Отменён'].includes(item.status);
    modalFooter.append(action);
  } else if (entity === 'returns') {
    const action = actionButton('advance-return', nextReturnStatus(item.status), 'primary-button', 'check');
    action.dataset.id = item.id;
    action.disabled = ['Выплачен', 'Отклонён'].includes(item.status);
    modalFooter.append(action);
  } else if (entity === 'products') {
    const action = actionButton('restock', 'Пополнить остаток (+10)', 'primary-button', 'package');
    action.dataset.id = item.id;
    modalFooter.append(action);
  }
  showModal();
}

function addDetailField(grid, label, value) {
  const article = el('article', 'detail-item');
  const list = el('dl');
  const term = el('dt', '', label);
  const definition = el('dd');
  if (value instanceof Node) definition.append(value);
  else definition.textContent = value === null || value === undefined ? '—' : String(value);
  list.append(term, definition);
  article.append(list);
  grid.append(article);
}

function detailMeta(items) {
  const grid = el('section', 'detail-grid');
  items.forEach(([label, value]) => addDetailField(grid, label, value));
  return grid;
}

function detailSectionTitle(text) { return el('h3', 'modal-section-title', text); }

function renderDetailContent(entity, item) {
  const wrapper = el('article', 'detail-content');
  const description = el('p', 'detail-description', item.description || 'Дополнительная информация отсутствует.');
  wrapper.append(description);
  if (entity === 'orders') {
    wrapper.append(detailMeta([
      ['Статус', item.status], ['Приоритет', item.priority], ['Покупатель', item.customer], ['Email', item.email],
      ['Сумма заказа', formatCurrency(item.total)], ['Канал', item.channel], ['Оплата', item.paymentMethod], ['Ответственный', item.assignedTo],
      ['Создан', makeTime(item.createdAt, true)], ['Обновлён', makeTime(item.updatedAt, true)]
    ]));
    const shipping = el('section');
    shipping.append(detailSectionTitle('Доставка'));
    const address = el('address', 'detail-description', `${item.shipping.method}, ${item.shipping.city}. Ожидаемая дата: ${item.shipping.eta}.`);
    shipping.append(address);
    wrapper.append(shipping);
    const productsList = el('section');
    productsList.append(detailSectionTitle('Состав заказа'));
    const list = el('ul', 'detail-list');
    item.items.forEach((orderItem) => {
      const li = el('li');
      li.append(el('span', '', `${orderItem.name} × ${orderItem.quantity}`), el('strong', '', formatCurrency(orderItem.price * orderItem.quantity)));
      list.append(li);
    });
    productsList.append(list);
    wrapper.append(productsList);
  } else if (entity === 'products') {
    const margin = item.price ? Math.round((item.price - item.cost) / item.price * 100) : 0;
    wrapper.append(detailMeta([
      ['SKU', item.sku], ['Категория', item.category], ['Цена', formatCurrency(item.price)], ['Себестоимость', formatCurrency(item.cost)],
      ['Маржа', `${margin}%`], ['Остаток', `${item.stock} шт.`], ['Статус', item.status], ['Продано за 30 дней', `${item.metrics.sold30d} шт.`],
      ['Рейтинг', item.metrics.rating ? `${item.metrics.rating} / 5` : 'Пока нет оценок'], ['Отзывы', item.metrics.reviewCount], ['Создан', makeTime(item.createdAt, true)], ['Обновлён', makeTime(item.updatedAt, true)]
    ]));
    const variants = el('section');
    variants.append(detailSectionTitle('Варианты и остатки'));
    const list = el('ul', 'detail-list');
    item.variants.forEach((variant) => {
      const li = el('li'); li.append(el('span', '', variant.name), el('strong', '', `${variant.stock} шт.`)); list.append(li);
    });
    variants.append(list);
    wrapper.append(variants);
  } else if (entity === 'returns') {
    wrapper.append(detailMeta([
      ['Статус', item.status], ['Заказ', item.orderNumber], ['Покупатель', item.customer], ['Товар', item.product],
      ['Причина', item.reason], ['Сумма', formatCurrency(item.amount)], ['Приоритет', item.priority], ['Решение', item.resolution],
      ['Способ возврата', item.refundMethod], ['Запрошен', makeTime(item.requestedAt, true)]
    ]));
    const timelineSection = el('section');
    timelineSection.append(detailSectionTitle('История заявки'));
    const timeline = el('ol', 'timeline');
    item.timeline.forEach((event) => {
      const li = el('li', 'timeline-item');
      li.append(el('span'));
      const detail = el('section');
      detail.append(el('strong', '', event.text), makeTime(event.date, true));
      li.append(detail);
      timeline.append(li);
    });
    timelineSection.append(timeline);
    wrapper.append(timelineSection);
  }
  return wrapper;
}

function nextOrderStatus(status) {
  const mapping = { 'Новый': 'Подтвердить заказ', 'Оплачен': 'Передать в обработку', 'В обработке': 'Отметить отправку', 'Отправлен': 'Отметить доставку' };
  return mapping[status] || 'Статус завершён';
}

function advanceOrder(id) {
  const item = orders.find((order) => order.id === id);
  if (!item) return;
  const mapping = { 'Новый': 'Оплачен', 'Оплачен': 'В обработке', 'В обработке': 'Отправлен', 'Отправлен': 'Доставлен' };
  const next = mapping[item.status];
  if (!next) return;
  item.status = next;
  item.updatedAt = new Date().toISOString();
  closeModal();
  renderPage();
  notify('Статус заказа обновлён', `${item.number}: ${next}.`);
}

function nextReturnStatus(status) {
  const mapping = { 'Новый': 'Начать проверку', 'На проверке': 'Одобрить возврат', 'Одобрен': 'Отметить выплату' };
  return mapping[status] || 'Заявка завершена';
}

function advanceReturn(id) {
  const item = returns.find((record) => record.id === id);
  if (!item) return;
  const mapping = { 'Новый': 'На проверке', 'На проверке': 'Одобрен', 'Одобрен': 'Выплачен' };
  const next = mapping[item.status];
  if (!next) return;
  item.status = next;
  item.updatedAt = new Date().toISOString();
  item.resolution = next === 'Выплачен' ? 'Средства возвращены' : next === 'Одобрен' ? 'Возврат подтверждён' : 'Проверка начата';
  item.timeline.push({ date: item.updatedAt, text: next === 'Выплачен' ? 'Средства возвращены' : next === 'Одобрен' ? 'Возврат одобрен' : 'Заявка передана на проверку' });
  closeModal();
  renderPage();
  notify('Статус возврата обновлён', `${item.number}: ${next}.`);
}

function showModal() {
  document.body.classList.add('modal-open');
  if (!modal.open) modal.showModal();
  const focusable = getFocusable(modal);
  (modalClose || focusable[0])?.focus();
}

function closeModal() {
  if (modal.open) modal.close();
  document.body.classList.remove('modal-open');
  if (state.modalPreviousFocus && document.contains(state.modalPreviousFocus)) state.modalPreviousFocus.focus({ preventScroll: true });
  state.modalPreviousFocus = null;
}

function getFocusable(container) {
  return [...container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((node) => !node.hidden && node.getAttribute('aria-hidden') !== 'true');
}

function openOrderForm() {
  state.modalPreviousFocus = document.activeElement;
  modalEyebrow.textContent = 'НОВАЯ ЗАПИСЬ';
  modalTitle.textContent = 'Создать заказ';
  modalBody.replaceChildren(buildOrderForm());
  modalFooter.replaceChildren();
  const cancel = actionButton('close-modal', 'Отмена', 'secondary-button');
  const submit = actionButton('submit-order', 'Создать заказ', 'primary-button', 'plus');
  submit.type = 'submit';
  submit.setAttribute('form', 'create-order-form');
  modalFooter.append(cancel, submit);
  showModal();
  modal.querySelector('#order-customer')?.focus();
}

function buildOrderForm() {
  const form = el('form', 'form-grid');
  form.id = 'create-order-form';
  form.dataset.form = 'order-create';
  form.noValidate = true;
  form.append(
    createField({ id: 'order-customer', label: 'Имя покупателя', placeholder: 'Например, Анна Смирнова', required: true, minLength: 2, errorText: 'Укажите имя минимум из 2 символов.' }),
    createField({ id: 'order-email', label: 'Email покупателя', placeholder: 'name@example.com', type: 'email', required: true, errorText: 'Введите корректный email.' }),
    createSelectField({ id: 'order-product', label: 'Товар', options: products.filter((product) => product.status !== 'Черновик').map((product) => ({ value: product.id, label: `${product.name} — ${formatCurrency(product.price)}` })), required: true }),
    createField({ id: 'order-quantity', label: 'Количество', type: 'number', value: '1', required: true, min: 1, max: 99, errorText: 'Количество должно быть от 1 до 99.' }),
    createSelectField({ id: 'order-channel', label: 'Канал продаж', options: ['Сайт', 'Маркетплейс', 'Мобильное приложение'].map((value) => ({ value, label: value })), required: true }),
    createSelectField({ id: 'order-shipping', label: 'Доставка', options: ['Курьер', 'Пункт выдачи', 'Самовывоз'].map((value) => ({ value, label: value })), required: true }),
    createField({ id: 'order-city', label: 'Город доставки', placeholder: 'Например, Берлин', required: true, minLength: 2, errorText: 'Укажите город.' })
  );
  const summary = el('p', 'form-summary form-field--full');
  summary.id = 'order-price-summary';
  summary.textContent = 'Итоговая сумма будет рассчитана автоматически после выбора товара и количества.';
  form.append(summary);
  return form;
}

function createField({ id, label, placeholder = '', type = 'text', value = '', required = false, minLength = null, min = null, max = null, errorText = 'Проверьте это поле.' }) {
  const wrapper = el('section', 'form-field');
  const labelNode = el('label', '', label);
  labelNode.htmlFor = id;
  const input = el('input', 'text-input');
  input.id = id; input.name = id; input.type = type; input.placeholder = placeholder; input.value = value;
  input.dataset.validate = 'true'; input.dataset.errorText = errorText;
  if (required) { input.required = true; input.dataset.required = 'true'; }
  if (minLength !== null) { input.minLength = minLength; input.dataset.minLength = String(minLength); }
  if (min !== null) input.min = String(min);
  if (max !== null) input.max = String(max);
  if (type === 'number') input.inputMode = 'numeric';
  const error = el('span', 'field-error'); error.id = `${id}-error`; error.setAttribute('aria-live', 'polite');
  input.setAttribute('aria-describedby', error.id);
  wrapper.append(labelNode, input, error);
  return wrapper;
}

function createSelectField({ id, label, options, required = false }) {
  const wrapper = el('section', 'form-field');
  const labelNode = el('label', '', label); labelNode.htmlFor = id;
  const selectWrap = el('span', 'select-wrap');
  const select = el('select', 'select-input'); select.id = id; select.name = id;
  if (required) { select.required = true; select.dataset.required = 'true'; }
  options.forEach((item, index) => {
    const value = typeof item === 'string' ? item : item.value;
    const labelText = typeof item === 'string' ? item : item.label;
    const option = el('option', '', labelText); option.value = value;
    if (index === 0) option.selected = true;
    select.append(option);
  });
  if (required) select.dataset.validate = 'true';
  const error = el('span', 'field-error'); error.id = `${id}-error`; error.setAttribute('aria-live', 'polite'); select.setAttribute('aria-describedby', error.id);
  selectWrap.append(select);
  wrapper.append(labelNode, selectWrap, error);
  return wrapper;
}

function openProductForm() {
  state.modalPreviousFocus = document.activeElement;
  modalEyebrow.textContent = 'КАТАЛОГ';
  modalTitle.textContent = 'Добавить товар';
  const form = el('form', 'form-grid');
  form.id = 'create-product-form'; form.dataset.form = 'product-create'; form.noValidate = true;
  form.append(
    createField({ id: 'product-name', label: 'Название товара', placeholder: 'Например, Наушники Studio Pro', required: true, minLength: 3, errorText: 'Название должно содержать не менее 3 символов.' }),
    createField({ id: 'product-sku', label: 'Артикул (SKU)', placeholder: 'SKU-017', required: true, minLength: 3, errorText: 'Укажите артикул минимум из 3 символов.' }),
    createSelectField({ id: 'product-category', label: 'Категория', options: [...new Set(products.map((product) => product.category))].sort().map((value) => ({ value, label: value })), required: true }),
    createField({ id: 'product-price', label: 'Цена (€)', type: 'number', placeholder: '0', required: true, min: 1, errorText: 'Цена должна быть больше нуля.' }),
    createField({ id: 'product-cost', label: 'Себестоимость (€)', type: 'number', placeholder: '0', required: true, min: 0, errorText: 'Укажите себестоимость: 0 или больше.' }),
    createField({ id: 'product-stock', label: 'Начальный остаток', type: 'number', placeholder: '0', value: '0', required: true, min: 0, errorText: 'Остаток не может быть отрицательным.' })
  );
  const note = el('p', 'form-hint form-field--full', 'Новый товар будет добавлен в демонстрационный каталог.'); form.append(note);
  modalBody.replaceChildren(form);
  modalFooter.replaceChildren(actionButton('close-modal', 'Отмена', 'secondary-button'));
  const submit = actionButton('submit-product', 'Добавить товар', 'primary-button', 'plus');
  submit.type = 'submit'; submit.setAttribute('form', 'create-product-form'); modalFooter.append(submit);
  showModal();
  modal.querySelector('#product-name')?.focus();
}

function validateField(input) {
  if (!input || !input.matches('[data-validate="true"]')) return true;
  let message = '';
  const value = input.value.trim();
  if (input.dataset.required === 'true' && !value) message = 'Это поле обязательно.';
  else if (input.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = 'Введите корректный email.';
  else if (input.dataset.minLength && value.length < Number(input.dataset.minLength)) message = input.dataset.errorText || `Минимум ${input.dataset.minLength} символа.`;
  else if (input.type === 'number' && value !== '') {
    const number = Number(value);
    if (input.min !== '' && number < Number(input.min)) message = input.dataset.errorText || `Минимальное значение: ${input.min}.`;
    else if (input.max !== '' && number > Number(input.max)) message = input.dataset.errorText || `Максимальное значение: ${input.max}.`;
  }
  input.setAttribute('aria-invalid', String(Boolean(message)));
  const errorNode = document.getElementById(`${input.id}-error`);
  if (errorNode) errorNode.textContent = message;
  return !message;
}

function validateForm(form) {
  const fields = [...form.querySelectorAll('[data-validate="true"]')];
  const results = fields.map((field) => validateField(field));
  const firstInvalid = fields.find((field) => field.getAttribute('aria-invalid') === 'true');
  if (firstInvalid) firstInvalid.focus();
  return results.every(Boolean);
}

function handleFormSubmit(form) {
  if (form.dataset.form === 'order-create') {
    if (!validateForm(form)) return;
    const customer = form.querySelector('#order-customer').value.trim();
    const email = form.querySelector('#order-email').value.trim();
    const product = products.find((item) => item.id === form.querySelector('#order-product').value) || products[0];
    const quantity = Number(form.querySelector('#order-quantity').value);
    const channel = form.querySelector('#order-channel').value;
    const shippingMethod = form.querySelector('#order-shipping').value;
    const city = form.querySelector('#order-city').value.trim();
    const now = new Date().toISOString();
    const maxNumber = Math.max(...orders.map((order) => Number(order.number.replace(/\D/g, '')) || 1000));
    const number = `#${maxNumber + 1}`;
    const newOrder = {
      id: `ord-${maxNumber + 1}`, number, title: `Заказ ${number}`, description: `Новый заказ · ${product.name}`,
      customer, email, total: product.price * quantity, status: 'Новый', priority: 'Средний', createdAt: now, updatedAt: now,
      paymentMethod: 'Ожидает оплаты', channel,
      items: [{ productId: product.id, name: product.name, quantity, price: product.price }],
      shipping: { method: shippingMethod, city, eta: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10) },
      assignedTo: 'Климов Илья', tags: ['Создан вручную']
    };
    orders.unshift(newOrder);
    state.filters.orders = createFilterState('createdAt', '1');
    closeModal();
    navigate('orders');
    notify('Заказ создан', `${number} добавлен в список заказов.`);
  } else if (form.dataset.form === 'product-create') {
    if (!validateForm(form)) return;
    const name = form.querySelector('#product-name').value.trim();
    const sku = form.querySelector('#product-sku').value.trim().toUpperCase();
    if (products.some((product) => product.sku.toLowerCase() === sku.toLowerCase())) {
      const field = form.querySelector('#product-sku');
      field.setAttribute('aria-invalid', 'true');
      document.querySelector('#product-sku-error').textContent = 'Такой артикул уже существует.';
      field.focus();
      return;
    }
    const now = new Date().toISOString();
    const price = Number(form.querySelector('#product-price').value);
    const cost = Number(form.querySelector('#product-cost').value);
    const stock = Number(form.querySelector('#product-stock').value);
    const newProduct = {
      id: `prd-${String(Date.now()).slice(-6)}`, sku, title: name, name,
      description: 'Новый товар, добавленный через панель управления.', category: form.querySelector('#product-category').value,
      price, cost, stock, status: stock === 0 ? 'Нет в наличии' : stock < 10 ? 'Заканчивается' : 'Активен',
      createdAt: now, updatedAt: now, assignedTo: 'Климов Илья', variants: [{ name: 'Стандарт', stock }], metrics: { sold30d: 0, rating: 0, reviewCount: 0 }, tags: ['Новый товар']
    };
    products.unshift(newProduct);
    state.filters.products = createFilterState('updatedAt', '1');
    closeModal();
    navigate('products');
    notify('Товар добавлен', `${name} появился в каталоге.`);
  }
}

function updateOrderPriceSummary() {
  const form = document.querySelector('#create-order-form');
  if (!form) return;
  const product = products.find((item) => item.id === form.querySelector('#order-product')?.value);
  const quantity = Number(form.querySelector('#order-quantity')?.value || 0);
  const summary = form.querySelector('#order-price-summary');
  if (summary && product) summary.textContent = `Итого: ${formatCurrency(product.price * Math.max(quantity, 0))}. После создания заказ получит статус «Новый».`;
}

function restockProduct(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;
  product.stock += 10;
  product.status = product.stock < 10 ? 'Заканчивается' : 'Активен';
  product.updatedAt = new Date().toISOString();
  const standardVariant = product.variants[0];
  if (standardVariant) standardVariant.stock += 10;
  closeModal();
  renderPage();
  notify('Остаток обновлён', `${product.name}: ${product.stock} шт. на складе.`);
}

function exportCurrentView() {
  let view = state.view;
  if (view === 'overview') view = 'orders';
  let rows = view === 'analytics' ? sales : view === 'orders' || view === 'products' || view === 'returns' ? getFilteredItems(view) : orders;
  if (view === 'orders') rows = getFilteredItems('orders');
  if (view === 'products') rows = getFilteredItems('products');
  if (view === 'returns') rows = getFilteredItems('returns');
  const columns = rows.length ? Object.keys(rows[0]) : [];
  const toCsv = (value) => {
    const normalized = Array.isArray(value) || (value && typeof value === 'object') ? JSON.stringify(value) : String(value ?? '');
    return `"${normalized.replace(/"/g, '""')}"`;
  };
  const csv = [columns.map(toCsv).join(';'), ...rows.map((row) => columns.map((column) => toCsv(row[column])).join(';'))].join('\r\n');
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = el('a');
  link.href = url;
  link.download = `northstar-${view}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  notify('Экспорт подготовлен', `Сформирован CSV-файл: ${rows.length} записей.`);
  closeActionMenu();
}

function notify(title, message, kind = 'success') {
  const toast = el('article', `toast${kind === 'warning' ? ' toast--warning' : kind === 'error' ? ' toast--error' : ''}`);
  const iconBox = el('span', 'toast-icon');
  iconBox.append(icon(kind === 'warning' ? 'warning' : kind === 'error' ? 'close' : 'check'));
  const content = el('section', 'toast-content');
  content.append(el('strong', '', title), el('p', '', message));
  const close = el('button', 'toast-close');
  close.type = 'button'; close.setAttribute('aria-label', 'Закрыть уведомление'); close.dataset.action = 'dismiss-toast'; close.append(icon('close'));
  toast.append(iconBox, content, close);
  toastRegion.append(toast);
  const timer = window.setTimeout(() => {
    toast.classList.add('toast--leaving');
    window.setTimeout(() => toast.remove(), 240);
  }, 4200);
  state.toastTimers.set(toast, timer);
}

function dismissToast(button) {
  const toast = button.closest('.toast');
  if (!toast) return;
  const timer = state.toastTimers.get(toast);
  if (timer) window.clearTimeout(timer);
  toast.classList.add('toast--leaving');
  window.setTimeout(() => toast.remove(), 240);
}

function openHelp() {
  state.modalPreviousFocus = document.activeElement;
  modalEyebrow.textContent = 'ЦЕНТР ПОМОЩИ';
  modalTitle.textContent = 'Как работать с панелью';
  const content = el('section');
  content.append(el('p', 'detail-description', 'Это учебная панель интернет-магазина с демонстрационными данными. Можно просматривать записи, применять фильтры, менять темы, создавать заказы и товары, а также проходить этапы обработки возврата.'));
  const list = el('ul', 'detail-list');
  [
    ['Поиск и фильтры', 'Введите запрос, выберите статус или отметьте несколько каналов / категорий.'],
    ['Сортировка', 'Нажимайте на заголовки колонок в таблице.'],
    ['Доступность', 'Используйте Tab, Enter, Escape и стрелки в табах графика.'],
    ['Внешний вид', 'Переключите тему и акцентный цвет в верхней панели.']
  ].forEach(([title, text]) => {
    const li = el('li'); li.append(el('span', '', title), el('strong', '', text)); list.append(li);
  });
  content.append(list);
  modalBody.replaceChildren(content);
  modalFooter.replaceChildren(actionButton('close-modal', 'Понятно', 'primary-button', 'check'));
  showModal();
}

function handleAction(actionNode) {
  const action = actionNode.dataset.action;
  const id = actionNode.dataset.id;
  if (action === 'toggle-actions') toggleActionMenu();
  else if (action === 'new-order') openOrderForm();
  else if (action === 'new-product') openProductForm();
  else if (action === 'submit-order') document.querySelector('#create-order-form')?.requestSubmit();
  else if (action === 'submit-product') document.querySelector('#create-product-form')?.requestSubmit();
  else if (action === 'export') exportCurrentView();
  else if (action === 'analytics-report') navigate('analytics');
  else if (action === 'open-detail') openDetail(actionNode.dataset.entity, id);
  else if (action === 'close-modal') closeModal();
  else if (action === 'advance-order') advanceOrder(id);
  else if (action === 'advance-return') advanceReturn(id);
  else if (action === 'restock') restockProduct(id);
  else if (action === 'reset-filters') resetFilters(actionNode.dataset.viewKey);
  else if (action === 'paginate') goToPage(actionNode.dataset.viewKey, actionNode.dataset.page);
  else if (action === 'sort') changeSort(actionNode);
  else if (action === 'dismiss-toast') dismissToast(actionNode);
  else if (action === 'show-help') openHelp();
  else if (action === 'notifications') notify('Уведомления', 'Есть 3 новых события: 2 возврата и 1 товар с низким остатком.', 'warning');
  else if (action === 'today') notify('Текущая дата', todayText());
  else if (action === 'profile-menu') notify('Профиль администратора', 'Вы вошли как Климов Илья.');
  else if (action === 'navigate' && actionNode.dataset.view) navigate(actionNode.dataset.view);
}

function openMobileMenu() {
  state.sidebarOpen = true;
  sidebar.classList.add('is-open');
  drawerOverlay.hidden = false;
  requestAnimationFrame(() => drawerOverlay.classList.add('is-visible'));
  menuToggle.setAttribute('aria-expanded', 'true');
  menuToggle.setAttribute('aria-label', 'Закрыть меню');
  document.body.classList.add('drawer-open');
  sidebar.querySelector('.nav-link')?.focus({ preventScroll: true });
}

function closeMobileMenu() {
  if (!state.sidebarOpen) return;
  state.sidebarOpen = false;
  sidebar.classList.remove('is-open');
  drawerOverlay.classList.remove('is-visible');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Открыть меню');
  document.body.classList.remove('drawer-open');
  const focusWasInDrawer = sidebar.contains(document.activeElement) || document.activeElement === drawerOverlay;
  if (focusWasInDrawer && window.matchMedia('(max-width: 767px)').matches) {
    menuToggle.focus({ preventScroll: true });
  }
  window.setTimeout(() => { if (!state.sidebarOpen) drawerOverlay.hidden = true; }, 360);
}

function toggleSidebarCompact() {
  const shell = document.querySelector('.app-shell');
  const isCompact = shell.classList.toggle('sidebar-compact');
  const button = document.querySelector('#sidebar-collapse');
  button.setAttribute('aria-label', isCompact ? 'Развернуть меню' : 'Свернуть меню');
  button.title = isCompact ? 'Развернуть меню' : 'Свернуть меню';
  notify(isCompact ? 'Меню свёрнуто' : 'Меню развёрнуто', 'Ширину боковой панели можно менять в любой момент.');
}

function colorRgb(hex) {
  return [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
}

function relativeLuminance(hex) {
  const channels = colorRgb(hex).map((value) => value / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(first, second) {
  const values = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function mixHex(hex, target, amount) {
  const sourceChannels = colorRgb(hex);
  const targetChannels = colorRgb(target);
  const channels = sourceChannels.map((value, index) => Math.round(value + (targetChannels[index] - value) * amount));
  return `#${channels.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function getReadableAccent(hex) {
  const darkTheme = document.documentElement.dataset.theme === 'dark';
  const surface = darkTheme ? '#181f2f' : '#ffffff';
  const target = darkTheme ? '#ffffff' : '#000000';
  if (contrastRatio(hex, surface) >= 5) return hex;
  for (let step = 1; step <= 100; step += 1) {
    const candidate = mixHex(hex, target, step / 100);
    if (contrastRatio(candidate, surface) >= 5) return candidate;
  }
  return target;
}

function getTextOnAccent(hex) {
  const whiteContrast = contrastRatio('#ffffff', hex);
  const darkInk = '#151b2b';
  const darkContrast = contrastRatio(darkInk, hex);
  return darkContrast > whiteContrast ? darkInk : '#ffffff';
}

function applyDerivedAccentColors(hex) {
  document.documentElement.style.setProperty('--accent-readable', getReadableAccent(hex));
  document.documentElement.style.setProperty('--text-on-accent', getTextOnAccent(hex));
}

function applyTheme(theme, manual = true) {
  if (!['light', 'dark', 'corporate-blue'].includes(theme)) return;
  document.documentElement.dataset.theme = theme;
  themeSelect.value = theme;
  try {
    if (manual) {
      localStorage.setItem('northstar-theme', theme);
      localStorage.setItem('northstar-theme-manual', 'true');
    }
  } catch (error) { /* localStorage может быть отключён настройками браузера. */ }
  let savedAccent = null;
  try { savedAccent = localStorage.getItem('northstar-accent'); } catch (error) { /* no-op */ }
  if (savedAccent && /^#[0-9a-fA-F]{6}$/.test(savedAccent)) {
    applyAccent(savedAccent, false);
  } else {
    document.documentElement.style.removeProperty('--accent');
    document.documentElement.style.removeProperty('--accent-rgb');
    const themeAccent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#6958e8';
    applyDerivedAccentColors(themeAccent);
    accentPicker.value = themeAccent;
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#101522' : theme === 'corporate-blue' ? '#eef4fb' : '#f5f7fb';
}

function applyAccent(hex, persist = true) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  document.documentElement.style.setProperty('--accent', hex);
  document.documentElement.style.setProperty('--accent-rgb', `${red}, ${green}, ${blue}`);
  applyDerivedAccentColors(hex);
  accentPicker.value = hex;
  if (persist) {
    try { localStorage.setItem('northstar-accent', hex); } catch (error) { /* no-op */ }
  }
}

function initThemeControls() {
  themeSelect.value = document.documentElement.dataset.theme || 'light';
  try {
    const savedAccent = localStorage.getItem('northstar-accent');
    if (savedAccent && /^#[0-9a-fA-F]{6}$/.test(savedAccent)) applyAccent(savedAccent, false);
    else accentPicker.value = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#6958e8';
  } catch (error) { /* no-op */ }
  themeSelect.addEventListener('change', () => {
    applyTheme(themeSelect.value, true);
    notify('Тема изменена', `Активна тема: ${themeSelect.options[themeSelect.selectedIndex].textContent}.`);
  });
  accentPicker.addEventListener('input', () => applyAccent(accentPicker.value, true));
  accentPicker.addEventListener('change', () => notify('Акцентный цвет обновлён', `Новый цвет: ${accentPicker.value.toUpperCase()}.`));
  if (window.matchMedia) {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemThemeChange = (event) => {
      let manual = false;
      try { manual = localStorage.getItem('northstar-theme-manual') === 'true'; } catch (error) { /* no-op */ }
      if (!manual) applyTheme(event.matches ? 'dark' : 'light', false);
    };
    if (typeof media.addEventListener === 'function') media.addEventListener('change', onSystemThemeChange);
    else if (typeof media.addListener === 'function') media.addListener(onSystemThemeChange);
  }
}

function handleTabKeyboard(event) {
  const tab = event.target.closest('[role="tab"]');
  if (!tab) return;
  const tabs = [...tab.parentElement.querySelectorAll('[role="tab"]')];
  const currentIndex = tabs.indexOf(tab);
  let nextIndex = currentIndex;
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % tabs.length;
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  else if (event.key === 'Home') nextIndex = 0;
  else if (event.key === 'End') nextIndex = tabs.length - 1;
  else return;
  event.preventDefault();
  const selected = tabs[nextIndex];
  state.chartMetric = selected.dataset.chartTab;
  renderPage({ preserveFocus: false });
  pageContent.querySelector(`[data-chart-tab="${state.chartMetric}"]`)?.focus();
}

function handleMenuKeyboard(event) {
  const item = event.target.closest('[role="menuitem"]');
  const menu = document.querySelector('#actions-menu');
  if (!item || !menu || menu.hidden) return;
  const items = [...menu.querySelectorAll('[role="menuitem"]')];
  const index = items.indexOf(item);
  if (event.key === 'Escape') {
    event.preventDefault(); closeActionMenu(); document.querySelector('#actions-menu-trigger')?.focus();
  } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    const nextIndex = event.key === 'ArrowDown' ? (index + 1) % items.length : (index - 1 + items.length) % items.length;
    items[nextIndex].focus();
  } else if (event.key === 'Home') { event.preventDefault(); items[0]?.focus(); }
  else if (event.key === 'End') { event.preventDefault(); items[items.length - 1]?.focus(); }
}

function handleModalKeydown(event) {
  if (event.key !== 'Tab' || !modal.open) return;
  const focusable = getFocusable(modal);
  if (!focusable.length) { event.preventDefault(); modalClose.focus(); return; }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

/* Делегирование событий на контейнерах, чтобы не добавлять обработчики каждой строке списка. */
document.addEventListener('click', (event) => {
  const chartTab = event.target.closest('[data-chart-tab]');
  if (chartTab) {
    event.preventDefault();
    state.chartMetric = chartTab.dataset.chartTab;
    renderPage({ preserveFocus: false });
    pageContent.querySelector(`[data-chart-tab="${state.chartMetric}"]`)?.focus();
    return;
  }
  const viewTarget = event.target.closest('[data-view]');
  if (viewTarget) {
    const view = viewTarget.dataset.view;
    if (validViews.includes(view)) {
      event.preventDefault();
      navigate(view);
      return;
    }
  }
  const actionTarget = event.target.closest('[data-action]');
  if (actionTarget) {
    if (actionTarget.matches('[role="menuitem"]') || (!actionTarget.closest('.action-menu') && actionTarget.dataset.action !== 'toggle-actions')) {
      closeActionMenu();
    }
    event.preventDefault();
    handleAction(actionTarget);
    return;
  }
  if (!event.target.closest('.action-menu')) closeActionMenu();
});

pageContent.addEventListener('input', (event) => {
  if (event.target.matches('[data-filter-kind="query"]')) handleFilterInput(event.target);
});
pageContent.addEventListener('change', (event) => {
  if (event.target.matches('[data-filter-kind]')) handleFilterChange(event.target);
});
pageContent.addEventListener('submit', (event) => {
  if (event.target.matches('[data-filter-form]')) event.preventDefault();
});
pageContent.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    const row = event.target.closest('tr[data-entity][data-id]');
    if (row && event.target === row) openDetail(row.dataset.entity, row.dataset.id);
  }
  handleTabKeyboard(event);
});

modal.addEventListener('click', (event) => {
  if (event.target === modal) closeModal();
});
modal.addEventListener('keydown', handleModalKeydown);
modal.addEventListener('cancel', (event) => { event.preventDefault(); closeModal(); });
modal.addEventListener('close', () => document.body.classList.remove('modal-open'));
modal.addEventListener('submit', (event) => {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();
  handleFormSubmit(form);
});
modal.addEventListener('input', (event) => {
  if (event.target.matches('[data-validate="true"]')) validateField(event.target);
  if (event.target.id === 'order-quantity') updateOrderPriceSummary();
});
modal.addEventListener('change', (event) => {
  if (event.target.matches('[data-validate="true"]')) validateField(event.target);
  if (event.target.id === 'order-product' || event.target.id === 'order-quantity') updateOrderPriceSummary();
});
modal.addEventListener('focusout', (event) => {
  if (event.target.matches('[data-validate="true"]')) validateField(event.target);
});
modalClose.addEventListener('click', closeModal);
menuToggle.addEventListener('click', () => state.sidebarOpen ? closeMobileMenu() : openMobileMenu());
drawerOverlay.addEventListener('click', closeMobileMenu);
document.querySelector('#sidebar-collapse').addEventListener('click', toggleSidebarCompact);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeActionMenu();
    closeMobileMenu();
  }
  handleMenuKeyboard(event);
});
window.addEventListener('popstate', () => {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  if (validViews.includes(view)) {
    state.view = view;
    if (state.filters[view]) state.filters[view].page = Math.max(1, Number(params.get('page')) || 1);
    renderPage({ updateUrl: false });
  }
});

initThemeControls();
pageContent.replaceChildren(renderSkeleton());
pageContent.setAttribute('aria-busy', 'true');
window.setTimeout(() => {
  renderPage();
}, 420);
