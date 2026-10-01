const root = document.documentElement;
const themeButton = document.querySelector('.theme-toggle');
const themeLabel = themeButton.querySelector('.theme-label');
const themeSymbol = themeButton.querySelector('.theme-symbol');
const themeColor = document.querySelector('meta[name="theme-color"]');

function setTheme(theme) {
  const dark = theme === 'dark';
  root.dataset.theme = dark ? 'dark' : 'light';
  themeButton.setAttribute('aria-pressed', String(dark));
  themeButton.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
  themeLabel.textContent = dark ? 'Dark' : 'Light';
  themeSymbol.textContent = dark ? '☾' : '☼';
  themeColor.content = dark ? '#171916' : '#f3f1e9';
  try {
    localStorage.setItem('soumyaswet-theme', dark ? 'dark' : 'light');
  } catch {
    // The theme still works when storage is unavailable.
  }
}

let savedTheme = 'light';
try {
  savedTheme = localStorage.getItem('soumyaswet-theme') || 'light';
} catch {
  savedTheme = 'light';
}
setTheme(savedTheme);
themeButton.addEventListener('click', () => {
  setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
});

const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.desktop-nav');
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!expanded));
  menuButton.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  nav.classList.toggle('is-open', !expanded);
});
nav.addEventListener('click', (event) => {
  if (!event.target.closest('a')) return;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
  nav.classList.remove('is-open');
});

const graphemeSegmenter = typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  : null;

function wrapTextNode(textNode) {
  const value = textNode.nodeValue;
  if (!value?.trim() || textNode.parentElement.closest('script,style,svg,.hover-glyph,[aria-hidden="true"]')) return;

  const characters = graphemeSegmenter
    ? [...graphemeSegmenter.segment(value)].map(({ segment }) => segment)
    : Array.from(value);
  const fragment = document.createDocumentFragment();
  characters.forEach((character) => {
    if (/^\s+$/u.test(character)) {
      fragment.append(document.createTextNode(character));
      return;
    }
    const glyph = document.createElement('span');
    glyph.className = 'hover-glyph';
    glyph.textContent = character;
    fragment.append(glyph);
  });
  textNode.replaceWith(fragment);
}

function wrapVisibleText(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    wrapTextNode(node);
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE || node.matches('script,style,svg,[aria-hidden="true"]')) return;
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach(wrapTextNode);
}

wrapVisibleText(document.body);
const glyphObserver = new MutationObserver((records) => {
  records.forEach((record) => record.addedNodes.forEach(wrapVisibleText));
});
glyphObserver.observe(document.body, { childList: true, subtree: true });

const artLightbox = document.querySelector('#art-lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
const lightboxCaption = document.querySelector('#lightbox-caption');
if (artLightbox && lightboxImage && lightboxCaption) {
  document.querySelectorAll('.art-card').forEach((card) => {
    card.addEventListener('click', () => {
      const image = card.querySelector('img');
      lightboxImage.src = new URL(card.dataset.fullSrc, document.baseURI).href;
      lightboxImage.alt = image?.alt || card.dataset.artTitle || 'Selected artwork';
      lightboxCaption.textContent = card.dataset.artTitle || image?.alt || 'Selected artwork';
      artLightbox.showModal();
    });
  });
  artLightbox.querySelector('.lightbox-close').addEventListener('click', () => artLightbox.close());
  artLightbox.addEventListener('click', (event) => {
    if (event.target === artLightbox) artLightbox.close();
  });
}

document.querySelectorAll('.gallery-arrow').forEach((button) => {
  button.addEventListener('click', () => {
    const gallery = document.getElementById(button.dataset.gallery);
    const direction = Number(button.dataset.direction);
    if (!gallery || !direction) return;
    gallery.scrollBy({ left: direction * gallery.clientWidth * 0.78, behavior: 'smooth' });
  });
});

document.querySelectorAll('.project-track').forEach((gallery) => {
  let pointerStart = 0;
  let scrollStart = 0;
  let dragged = false;

  gallery.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    pointerStart = event.clientX;
    scrollStart = gallery.scrollLeft;
    dragged = false;
    gallery.classList.add('is-dragging');
    gallery.setPointerCapture(event.pointerId);
  });
  gallery.addEventListener('pointermove', (event) => {
    if (!gallery.hasPointerCapture(event.pointerId)) return;
    const distance = event.clientX - pointerStart;
    if (Math.abs(distance) > 5) dragged = true;
    gallery.scrollLeft = scrollStart - distance;
  });
  gallery.addEventListener('pointerup', () => gallery.classList.remove('is-dragging'));
  gallery.addEventListener('pointercancel', () => gallery.classList.remove('is-dragging'));
  gallery.addEventListener('click', (event) => {
    if (!dragged) return;
    event.preventDefault();
    event.stopPropagation();
    dragged = false;
  }, true);
});

function getYouTubeId(value) {
  try {
    const url = new URL(value);
    if (url.hostname.endsWith('youtu.be')) return url.pathname.slice(1).split('/')[0];
    if (url.hostname.endsWith('youtube.com') || url.hostname.endsWith('youtube-nocookie.com')) {
      return url.searchParams.get('v') || url.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1] || '';
    }
  } catch {
    return '';
  }
  return '';
}

document.querySelectorAll('.walkthrough-frame[data-youtube-url]').forEach((frame) => {
  const videoUrl = frame.dataset.youtubeUrl.trim();
  const videoId = getYouTubeId(videoUrl);
  const link = frame.querySelector('.youtube-link');
  if (!videoId || !link) return;
  link.href = videoUrl;
  link.hidden = false;
  const startPreview = () => {
    if (frame.querySelector('iframe')) return;
    const iframe = document.createElement('iframe');
    iframe.title = frame.dataset.videoTitle || 'Project deployment walkthrough';
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&mute=1&controls=0&loop=1&playlist=${encodeURIComponent(videoId)}&playsinline=1&rel=0`;
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.prepend(iframe);
    frame.classList.add('is-ready');
  };
  const stopPreview = () => {
    frame.querySelector('iframe')?.remove();
    frame.classList.remove('is-ready');
  };
  frame.addEventListener('pointerenter', startPreview);
  frame.addEventListener('pointerleave', stopPreview);
  frame.addEventListener('focusin', startPreview);
  frame.addEventListener('focusout', stopPreview);
});

const roleText = document.querySelector('#role-text');
const roles = ['Designer', 'Developer', 'Learner'];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (roleText && !reducedMotion) {
  let roleIndex = 0;
  let characterIndex = roles[0].length;
  let deleting = true;
  const typeNextCharacter = () => {
    const role = roles[roleIndex];
    if (deleting) {
      characterIndex -= 1;
      roleText.textContent = role.slice(0, characterIndex);
      if (characterIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        window.setTimeout(typeNextCharacter, 280);
        return;
      }
    } else {
      const nextRole = roles[roleIndex];
      characterIndex += 1;
      roleText.textContent = nextRole.slice(0, characterIndex);
      if (characterIndex === nextRole.length) {
        deleting = true;
        window.setTimeout(typeNextCharacter, 1500);
        return;
      }
    }
    window.setTimeout(typeNextCharacter, deleting ? 52 : 92);
  };
  window.setTimeout(typeNextCharacter, 1700);
}
