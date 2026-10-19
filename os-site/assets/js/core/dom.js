// DOM construction. Content is only ever inserted as text nodes, never as HTML,
// so nothing in the data can execute or inject markup (the TeX renderer's `esc()`
// rule, applied to the web).

import { frenchSpacing, langTag } from './i18n.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function applyProps(el, props) {
  if (!props) return;
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.setAttribute('class', v);
    else if (k === 'text') el.textContent = v;
    else if (k === 'on') for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'style' && typeof v === 'object') {
      for (const [sk, sv] of Object.entries(v)) {
        if (sv == null) continue;
        if (sk.startsWith('--')) el.style.setProperty(sk, sv);
        else el.style[sk] = sv;
      }
    } else if (k === 'lang') el.setAttribute('lang', langTag(v));
    else el.setAttribute(k, v === true ? '' : v);
  }
}

function appendKids(el, kids) {
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false || kid === '') continue;
    el.append(kid instanceof Node ? kid : String(kid));
  }
}

export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  applyProps(el, props);
  appendKids(el, kids);
  return el;
}

export function s(tag, props, ...kids) {
  const el = document.createElementNS(SVG_NS, tag);
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.setAttribute('class', v);
    else if (k === 'on') for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
    else el.setAttribute(k, v);
  }
  appendKids(el, kids);
  return el;
}

export function clear(el) {
  while (el.firstChild) el.firstChild.remove();
  return el;
}

/** Replace an element's children, skipping empty values (replaceChildren would print "null"). */
export function fill(el, ...kids) {
  clear(el);
  appendKids(el, kids);
  return el;
}

const INLINE = /(`[^`\n]+`)|(https?:\/\/[^\s（）()「」『』、。，；,]+[^\s（）()「」『』、。，；,.:;])/g;

/** Text with `code` spans and bare URLs, as safe nodes. French spacing applied for fr. */
export function inline(text, lang) {
  const out = [];
  const src = String(text ?? '');
  let last = 0;
  for (const m of src.matchAll(INLINE)) {
    if (m.index > last) out.push(plain(src.slice(last, m.index), lang));
    if (m[1]) out.push(h('code', { class: 'ic', translate: 'no' }, m[1].slice(1, -1)));
    else out.push(h('a', { class: 'url', href: m[2], target: '_blank', rel: 'noopener noreferrer', translate: 'no' }, m[2]));
    last = m.index + m[0].length;
  }
  if (last < src.length) out.push(plain(src.slice(last), lang));
  return out;
}

function plain(text, lang) {
  return document.createTextNode(lang === 'fr' ? frenchSpacing(text) : text);
}

/** A span carrying its own language, for content embedded in the English interface. */
export function langText(value, props = {}) {
  if (!value) return null;
  const { text, lang } = value;
  return h('span', { ...props, lang }, inline(text, lang));
}

export const icons = {
  search: () => s('svg', { viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.4', 'aria-hidden': 'true' },
    s('circle', { cx: '7', cy: '7', r: '4.6' }), s('path', { d: 'M10.4 10.4 14 14', 'stroke-linecap': 'round' })),
  lamp: () => s('svg', { viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.3', 'aria-hidden': 'true' },
    s('path', { d: 'M13.2 9.9A5.6 5.6 0 0 1 6.1 2.8a5.6 5.6 0 1 0 7.1 7.1z', 'stroke-linejoin': 'round' })),
  sun: () => s('svg', { viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.3', 'aria-hidden': 'true' },
    s('circle', { cx: '8', cy: '8', r: '2.9' }),
    s('path', { d: 'M8 1.6v1.6M8 12.8v1.6M1.6 8h1.6M12.8 8h1.6M3.5 3.5l1.1 1.1M11.4 11.4l1.1 1.1M3.5 12.5l1.1-1.1M11.4 4.6l1.1-1.1', 'stroke-linecap': 'round' })),
  arrowLeft: () => s('svg', { viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.4', 'aria-hidden': 'true' },
    s('path', { d: 'M13 8H3.5M7.5 4 3.5 8l4 4', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })),
  arrowRight: () => s('svg', { viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.4', 'aria-hidden': 'true' },
    s('path', { d: 'M3 8h9.5M8.5 4l4 4-4 4', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })),
  book: () => s('svg', { viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.3', 'aria-hidden': 'true' },
    s('path', { d: 'M8 4.2C6.6 3.2 4.6 2.9 2.2 3.1v9.3c2.4-.2 4.4.1 5.8 1.1 1.4-1 3.4-1.3 5.8-1.1V3.1c-2.4-.2-4.4.1-5.8 1.1zM8 4.2v9.3', 'stroke-linejoin': 'round' })),
  sheet: () => s('svg', { viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.3', 'aria-hidden': 'true' },
    s('path', { d: 'M4 1.8h5.6L12.5 4.7v9.5H4z', 'stroke-linejoin': 'round' }), s('path', { d: 'M6 7h4.6M6 9.3h4.6M6 11.6h3', 'stroke-linecap': 'round' })),
  mark: () => s('svg', { viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': 'true' },
    s('path', { d: 'M4.5 2.75h10.2l4.8 4.8v13.7H4.5z', stroke: 'currentColor', 'stroke-width': '1.3', 'stroke-linejoin': 'round' }),
    s('path', { d: 'M14.7 2.75v4.8h4.8', stroke: 'currentColor', 'stroke-width': '1.3', 'stroke-linejoin': 'round' }),
    s('path', { d: 'M14.7 2.75 19.5 7.55h-4.8z', fill: 'currentColor', opacity: '.16' }),
    s('path', { d: 'M8 11.5h8M8 14.5h8M8 17.5h5', stroke: 'currentColor', 'stroke-width': '1.1', 'stroke-linecap': 'round', opacity: '.6' })),
  minus: () => s('svg', { viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.4', 'aria-hidden': 'true' }, s('path', { d: 'M3.5 8h9', 'stroke-linecap': 'round' })),
  plus: () => s('svg', { viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.4', 'aria-hidden': 'true' }, s('path', { d: 'M3.5 8h9M8 3.5v9', 'stroke-linecap': 'round' })),
};
