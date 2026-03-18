(() => {
  const NAV_ITEM_SELECTOR = '.nav-item[data-id]';
  const ACTIVE_CLASS = 'active';

  function getNavItems() {
    return Array.from(document.querySelectorAll(NAV_ITEM_SELECTOR));
  }

  function setActiveNav(id) {
    const items = getNavItems();
    for (const n of items) n.classList.remove(ACTIVE_CLASS);
    // Avoid relying on `CSS.escape` (not present in all environments).
    const active = items.find((el) => el.getAttribute('data-id') === id) ?? null;
    if (active) active.classList.add(ACTIVE_CLASS);
  }

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setupNavClicks() {
    const items = getNavItems();
    for (const item of items) {
      item.addEventListener('click', (e) => {
        // Allow command/ctrl click behavior if we ever add hrefs later.
        if (e instanceof MouseEvent && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return;
        e.preventDefault();

        const id = item.getAttribute('data-id');
        if (!id) return;
        scrollToId(id);
        setActiveNav(id);
      });
    }
  }

  function setupGoDocCards() {
    const cards = Array.from(document.querySelectorAll('.go-doc-card[data-scroll-to]'));
    for (const card of cards) {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-scroll-to');
        if (!id) return;
        scrollToId(id);
        setActiveNav(id);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        const id = card.getAttribute('data-scroll-to');
        if (!id) return;
        scrollToId(id);
        setActiveNav(id);
      });
    }
  }

  function setupActiveSectionTracking() {
    const ids = getNavItems()
      .map((el) => el.getAttribute('data-id'))
      .filter((id) => typeof id === 'string' && id.length > 0);

    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el) => el instanceof HTMLElement);

    if (sections.length === 0) return;

    // Prefer IntersectionObserver for stability as content changes.
    if ('IntersectionObserver' in window) {
      let currentId = ids[0] ?? null;
      const byId = new Map(sections.map((s) => [s.id, s]));

      const observer = new IntersectionObserver(
        (entries) => {
          // Pick the highest-ratio visible section closest to top.
          const visible = entries
            .filter((e) => e.isIntersecting && e.target instanceof HTMLElement)
            .sort((a, b) => {
              if (b.intersectionRatio !== a.intersectionRatio) return b.intersectionRatio - a.intersectionRatio;
              return a.boundingClientRect.top - b.boundingClientRect.top;
            });

          if (visible.length === 0) return;
          const top = visible[0]?.target;
          if (!(top instanceof HTMLElement)) return;
          if (top.id && top.id !== currentId && byId.has(top.id)) {
            currentId = top.id;
            setActiveNav(top.id);
          }
        },
        {
          root: null,
          // “Activate” when the heading approaches the top viewport region.
          rootMargin: '-15% 0px -70% 0px',
          threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
        },
      );

      for (const s of sections) observer.observe(s);
      // Initialize state.
      setActiveNav(currentId);
      return;
    }

    // Fallback: rAF-throttled scroll handler.
    let ticking = false;
    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          let cur = ids[0];
          for (const id of ids) {
            const el = document.getElementById(id);
            if (el && el.getBoundingClientRect().top < 130) cur = id;
          }
          if (cur) setActiveNav(cur);
          ticking = false;
        });
      },
      { passive: true },
    );
  }

  function init() {
    setupNavClicks();
    setupGoDocCards();
    setupActiveSectionTracking();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

