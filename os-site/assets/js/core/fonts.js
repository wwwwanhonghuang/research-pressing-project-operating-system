// Web fonts, loaded without blocking the page. A render-blocking stylesheet would
// hold back every script until the font host answers; where that host is slow or
// unreachable the site would not open at all. Instead the sheet is attached here,
// pages are set after a bounded wait (with local fallbacks if need be), and a
// reader may re-set its pages once if the fonts arrive late.

const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400'
  + '&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500'
  + '&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Noto+Serif+SC:wght@400;600'
  + '&family=Shippori+Mincho:wght@400;500;600;700&display=swap';

let sheet = null;

/** Attach the font stylesheet once; resolves true when it loads, false on failure. */
export function loadFontSheet() {
  if (!sheet) {
    sheet = new Promise(resolve => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = FONT_CSS;
      link.onload = () => resolve(true);
      link.onerror = () => resolve(false);
      document.head.append(link);
    });
  }
  return sheet;
}

/** The sheet, or false if it has not arrived within `ms`. */
export function fontSheetWithin(ms) {
  return Promise.race([loadFontSheet(), new Promise(resolve => setTimeout(() => resolve(false), ms))]);
}
