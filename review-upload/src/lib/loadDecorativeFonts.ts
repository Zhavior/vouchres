/** Decorative Google Fonts — lazy-loaded for landing/cinematic pages only. */
let loaded = false;

const DECORATIVE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,700;1,400;1,700&family=Montserrat:wght@900&display=swap';

export function loadDecorativeFonts(): void {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = DECORATIVE_FONTS_URL;
  document.head.appendChild(link);
}
