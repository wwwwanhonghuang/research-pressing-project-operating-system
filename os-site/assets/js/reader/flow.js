// The sheet: the same blocks as the book, flowed onto one long sheet of paper.
// It is the practical mode for working: searchable with the browser, easy to
// scroll, with an outline for handbooks and a provenance rail for definitions.

import { h, inline } from '../core/dom.js';
import { renderRun, stamp } from '../render/blocks.js';

function txt(tag, value, cls) {
  return value ? h(tag, { class: cls, lang: value.lang }, inline(value.text, value.lang)) : null;
}

export function mountFlow(host, doc, { rail = null, startBid = null } = {}) {
  let bid = 0;
  const sections = [];
  const sheet = h('article', { class: 'sheet paper lit' });
  const body = h('div', { class: 'sheet__body doc doc--flow' });

  if (doc.front) {
    body.append(h('header', { class: 'sheet__head' },
      h('div', { class: 'sheet__eyebrow' }, `Stage ${doc.stage.id} handbook`),
      txt('h1', doc.title, 'sheet__title'),
      txt('p', doc.subtitle, 'sheet__sub'),
      h('div', { class: 'sheet__meta' },
        doc.authority?.approval != null ? stamp(doc.authority) : null,
        h('span', { class: 'sheet__id', translate: 'no' }, `${doc.id} · v${doc.version}`))));
  }

  const all = [...doc.chapters.map(ch => ({ id: ch.id, title: ch.title, blocks: ch.blocks }))];
  if (doc.appendix?.length) all.push({ id: 'APPENDIX', title: doc.appendix[0].title, blocks: doc.appendix });
  for (const ch of all) {
    const sec = h('section', { class: 'sheet__section', id: `sec-${ch.id}` });
    renderRun(ch.blocks.map(b => ({ ...b, bid: bid++ })), sec);
    body.append(sec);
    sections.push({ ...ch, el: sec });
  }
  sheet.append(body);

  let outline = null;
  if (doc.front && sections.length > 1) {
    outline = h('nav', { class: 'outline', 'aria-label': 'Contents' },
      h('div', { class: 'outline__title' }, 'Contents'),
      h('ol', { class: 'outline__list' }, sections.map((sec, i) => h('li', null,
        h('a', { href: `#sec-${sec.id}`, dataset: { sec: sec.id }, on: { click: e => { e.preventDefault(); sec.el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } } },
          h('span', { class: 'outline__n' }, sec.id === 'APPENDIX' ? '§' : String(i + 1)),
          txt('span', sec.title, 'outline__t'))))));
  }

  const layout = h('div', { class: `flow${outline ? ' has-outline' : ''}${rail ? ' has-rail' : ''}` },
    outline ? h('aside', { class: 'flow__side' }, outline) : null,
    h('div', { class: 'flow__main' }, sheet),
    rail ? h('aside', { class: 'flow__rail' }, rail) : null);
  host.append(layout);

  // Highlight the section being read.
  let io = null;
  if (outline && 'IntersectionObserver' in window) {
    const links = new Map([...outline.querySelectorAll('a')].map(a => [a.dataset.sec, a]));
    io = new IntersectionObserver(entries => {
      for (const en of entries) if (en.isIntersecting) {
        for (const a of links.values()) a.removeAttribute('aria-current');
        links.get(en.target.id.replace(/^sec-/, ''))?.setAttribute('aria-current', 'true');
      }
    }, { rootMargin: '-20% 0px -70% 0px' });
    sections.forEach(sec => io.observe(sec.el));
  }

  if (startBid != null) {
    const target = body.querySelector(`[data-bid="${startBid}"]`);
    if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
  }

  return {
    el: layout,
    /** The block nearest the top of the viewport, to keep one's place across modes. */
    currentBid() {
      const els = body.querySelectorAll('[data-bid]');
      let best = null;
      for (const el of els) {
        const top = el.getBoundingClientRect().top;
        if (top > 120) break;
        best = Number(el.dataset.bid);
      }
      return best;
    },
    destroy() { io?.disconnect(); layout.remove(); },
  };
}
