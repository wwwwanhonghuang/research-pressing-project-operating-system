// Content languages. The interface is English; documents may be written in any of
// these. Every rendered block carries its language so the browser selects the
// right glyph forms (Japanese vs Simplified Chinese Han) and line-breaking rules.

export const CONTENT_LANGS = [
  { code: 'ja', tag: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'en', tag: 'en', name: 'English', native: 'English' },
  { code: 'zh', tag: 'zh-Hans', name: 'Chinese (Simplified)', native: '简体中文' },
  { code: 'fr', tag: 'fr', name: 'French', native: 'Français' },
];
const CODES = CONTENT_LANGS.map(l => l.code);

export function langTag(code) {
  return CONTENT_LANGS.find(l => l.code === code)?.tag ?? code;
}
export function langName(code) {
  return CONTENT_LANGS.find(l => l.code === code)?.name ?? code;
}
export const isCJK = code => code === 'ja' || code === 'zh';

/**
 * A localizable value: a plain string (written in the document's base language),
 * an object keyed by language, or sibling fields following the repository's
 * `<name>_ja` / `<name>_en` convention.
 */
export function readField(obj, name) {
  if (!obj) return null;
  const map = {};
  for (const code of CODES) if (typeof obj[`${name}_${code}`] === 'string') map[code] = obj[`${name}_${code}`];
  const value = obj[name];
  if (value && typeof value === 'object' && !Array.isArray(value)) Object.assign(map, value);
  if (Object.keys(map).length) return map;
  return typeof value === 'string' ? value : null;
}

/** Resolve a localizable value against the reader's preference. */
export function localize(value, ctx) {
  if (value == null) return null;
  if (typeof value === 'string') return { text: value, lang: ctx.base, fallback: ctx.pref !== ctx.base };
  for (const code of [ctx.pref, ctx.base, ...CODES]) {
    if (code && typeof value[code] === 'string' && value[code]) {
      return { text: value[code], lang: code, fallback: code !== ctx.pref };
    }
  }
  return null;
}

/** Languages actually present in a localizable value. */
export function languagesOf(value, base) {
  if (value == null) return [];
  if (typeof value === 'string') return [base];
  return CODES.filter(c => typeof value[c] === 'string' && value[c]);
}

// Sentence segmentation (for splitting paragraphs across pages).
const segmenters = new Map();
export function sentences(text, code) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    let seg = segmenters.get(code);
    if (!seg) { seg = new Intl.Segmenter(langTag(code), { granularity: 'sentence' }); segmenters.set(code, seg); }
    return Array.from(seg.segment(text), part => part.segment).filter(Boolean);
  }
  const re = isCJK(code) ? /[^。！？!?]+[。！？!?」』）)]*/g : /[^.!?]+[.!?]+["'»)]*\s*/g;
  const parts = text.match(re);
  return parts && parts.join('') === text ? parts : [text];
}

/** French typography: a narrow no-break space before ; : ! ? » and after «. */
export function frenchSpacing(text) {
  return text
    .replace(/«\s*/g, '« ')
    .replace(/\s*»/g, ' »')
    .replace(/(\S)\s*([;!?])/g, (m, a, b) => (/\d/.test(a) && b === ':') ? m : `${a} ${b}`)
    .replace(/([^\s\d])\s*:(?!\/\/)(\s|$)/g, '$1 :$2');
}
