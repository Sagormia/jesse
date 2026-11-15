/* ==========================================================================
   Jesse Giles Photography — interactions
   - GSAP + ScrollTrigger + SplitText (with graceful fallbacks)
   - Gallery, lightbox, reviews slider, accordion, inquiry form
   ========================================================================== */

(() => {
  'use strict';

  const doc = document;
  const body = doc.body;
  const $ = (sel, scope = doc) => scope.querySelector(sel);
  const $$ = (sel, scope = doc) => Array.from(scope.querySelectorAll(sel));

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = Boolean(window.gsap);
  const hasScrollTrigger = Boolean(window.ScrollTrigger);

  /* Optional: set to a Formspree / Netlify / custom endpoint to POST inquiries.
     Leave empty to compose the inquiry in the visitor's email app. */
  const FORM_ENDPOINT = '';

  if (hasGSAP && hasScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }
  if (hasGSAP && window.SplitText) {
    gsap.registerPlugin(SplitText);
  }

  /* ---------------------------------------------------------------------
     Header: scrolled state, hide on scroll down, active link
     --------------------------------------------------------------------- */
  const header = $('#header');
  let lastScroll = window.scrollY;
  let menuOpen = false;

  const onScrollHeader = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    if (!menuOpen) {
      const goingDown = y > lastScroll && y > 500;
      header.classList.toggle('is-hidden', goingDown);
    }
    lastScroll = y;
  };
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------------------------------------------------------------------
     Mobile menu
     --------------------------------------------------------------------- */
  const navToggle = $('#navToggle');
  const mobileMenu = $('#mobileMenu');
  const menuLinks = $$('[data-menu-link]');
  const menuLabel = $('.nav-toggle__label', navToggle);
  let lastMenuTrigger = null;

  const setMenu = (open, returnFocus = false) => {
    menuOpen = open;
    mobileMenu.classList.toggle('is-open', open);
    mobileMenu.setAttribute('aria-hidden', String(!open));
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (menuLabel) menuLabel.textContent = open ? 'Close' : 'Menu';
    header.classList.toggle('is-menu-open', open);
    body.classList.toggle('is-locked', open);

    if (open) {
      lastMenuTrigger = navToggle;
      header.classList.remove('is-hidden');
      const main = $('#main');
      const footer = $('.footer');
      if (main) main.inert = true;
      if (footer) footer.inert = true;
      if (hasGSAP && !prefersReduced) {
        gsap.fromTo(
          mobileMenu.querySelectorAll('nav a'),
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.65, stagger: 0.055, delay: 0.2, ease: 'power3.out', overwrite: true }
        );
        gsap.fromTo(mobileMenu.querySelector('.mobile-menu__foot'),
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, delay: 0.45, ease: 'power2.out', overwrite: true });
      }
      window.setTimeout(() => {
        const first = mobileMenu.querySelector('nav a');
        if (first && open) first.focus({ preventScroll: true });
      }, 80);
    } else if (returnFocus && lastMenuTrigger) {
      lastMenuTrigger.focus({ preventScroll: true });
    }
    if (!open) {
      const main = $('#main');
      const footer = $('.footer');
      if (main) main.inert = false;
      if (footer) footer.inert = false;
    }
  };

  navToggle.addEventListener('click', () => setMenu(!menuOpen, true));
  menuLinks.forEach((link) => link.addEventListener('click', () => setMenu(false)));

  doc.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) setMenu(false, true);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024 && menuOpen) setMenu(false);
  });

  /* ---------------------------------------------------------------------
     Custom cursor
     --------------------------------------------------------------------- */
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  if (finePointer && hasGSAP && !prefersReduced) {
    const cursor = $('.cursor');
    const dot = $('.cursor__dot');
    const ring = $('.cursor__ring');
    if (cursor && dot && ring) {
      body.classList.add('has-cursor');
      gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
      const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power2.out' });
      const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power2.out' });
      const ringX = gsap.quickTo(ring, 'x', { duration: 0.42, ease: 'power3.out' });
      const ringY = gsap.quickTo(ring, 'y', { duration: 0.42, ease: 'power3.out' });

      window.addEventListener('pointermove', (e) => {
        dotX(e.clientX); dotY(e.clientY);
        ringX(e.clientX); ringY(e.clientY);
      }, { passive: true });

      const hoverables = 'a, button, input, select, textarea, .gallery__open';
      doc.addEventListener('pointerover', (e) => {
        if (e.target.closest(hoverables)) cursor.classList.add('is-hover');
      });
      doc.addEventListener('pointerout', (e) => {
        if (e.target.closest(hoverables)) cursor.classList.remove('is-hover');
      });
    }
  }

  /* ---------------------------------------------------------------------
     Scroll reveals, split headings, counters, step markers
     --------------------------------------------------------------------- */
  const initScrollAnimations = () => {
    if (!hasGSAP || !hasScrollTrigger) return;

    if (window.SplitText) {
      $$('[data-split]').forEach((el) => {
        if (el.dataset.split === 'done') return;
        el.dataset.split = 'done';
        try {
          const split = SplitText.create(el, {
            type: 'lines',
            mask: 'lines',
            linesClass: 'split-line',
            autoSplit: true,
            onSplit(self) {
              return gsap.from(self.lines, {
                yPercent: 115,
                duration: 1.05,
                stagger: 0.075,
                ease: 'expo.out',
                scrollTrigger: { trigger: el, start: 'top 84%', once: true }
              });
            }
          });
          split.lines?.length;
        } catch (err) {
          gsap.from(el, {
            y: 30, opacity: 0, duration: 0.9, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 86%', once: true }
          });
        }
      });
    }

    if (!prefersReduced) {
      $$('[data-reveal]').forEach((el) => {
        if (el.closest('[data-split]') || el.dataset.split === 'done') return;
        gsap.from(el, {
          y: 26,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
      });

      $$('[data-stagger]').forEach((group) => {
        const children = Array.from(group.children);
        if (!children.length) return;
        gsap.from(children, {
          y: 26,
          opacity: 0,
          duration: 0.85,
          stagger: 0.075,
          ease: 'power3.out',
          scrollTrigger: { trigger: group, start: 'top 86%', once: true }
        });
      });

      $$('[data-count]').forEach((el) => {
        const target = parseFloat(el.dataset.count);
        const decimals = parseInt(el.dataset.decimals || '0', 10);
        if (Number.isNaN(target)) return;
        const state = { value: 0 };
        ScrollTrigger.create({
          trigger: el,
          start: 'top 92%',
          once: true,
          onEnter() {
            gsap.to(state, {
              value: target,
              duration: 1.7,
              ease: 'power2.out',
              onUpdate() { el.textContent = state.value.toFixed(decimals); }
            });
          }
        });
      });
    }

    $$('.step').forEach((step) => {
      ScrollTrigger.create({
        trigger: step,
        start: 'top 62%',
        end: 'bottom 62%',
        onToggle(self) { step.classList.toggle('is-active', self.isActive); }
      });
    });

    // Active navigation link
    $$('.nav__link').forEach((link) => {
      const target = doc.querySelector(link.getAttribute('href'));
      if (!target) return;
      ScrollTrigger.create({
        trigger: target,
        start: 'top 45%',
        end: 'bottom 45%',
        onToggle(self) {
          if (self.isActive) {
            $$('.nav__link').forEach((l) => l.classList.remove('is-active'));
            link.classList.add('is-active');
          }
        }
      });
    });

    // Hero parallax
    // const heroImg = $('#heroImg');
    // if (heroImg && !prefersReduced) {
    //   gsap.to(heroImg, {
    //     yPercent: 8,
    //     scale: 1.12,
    //     ease: 'none',
    //     scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    //   });
    // }

    // Pinned horizontal frames (desktop only)
    const framesTrack = $('#framesTrack');
    const framesBar = $('#framesProgress');
    if (framesTrack) {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 901px)', () => {
        const distance = () => Math.max(0, framesTrack.scrollWidth - window.innerWidth);
        const tween = gsap.to(framesTrack, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: '#frames',
            start: 'top top',
            end: () => '+=' + distance(),
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate(self) {
              if (framesBar) gsap.set(framesBar, { scaleX: self.progress });
            }
          }
        });
        return () => {
          tween.kill();
          gsap.set(framesTrack, { clearProps: 'transform' });
        };
      });
    }
  };

  /* ---------------------------------------------------------------------
     Gallery: load more, lightbox
     --------------------------------------------------------------------- */
  const galleryItems = $$('.gallery__item');
  const loadMoreBtn = $('#loadMore');
  const loadMoreCount = $('#loadMoreCount');
  const loadMoreLabel = loadMoreBtn ? $('span', loadMoreBtn) : null;
  const galleryNote = $('.gallery__note');
  let remainingItems = $$('.gallery__item.is-hidden');

  const updateLoadMore = () => {
    if (!loadMoreBtn) return;
    if (!remainingItems.length) {
      loadMoreBtn.style.display = 'none';
      if (galleryNote) galleryNote.textContent = 'That is all fifty frames — the full gallery is above.';
      return;
    }
    if (loadMoreCount) loadMoreCount.textContent = String(remainingItems.length);
    if (loadMoreLabel) {
      loadMoreLabel.textContent = remainingItems.length === galleryItems.length - 12
        ? 'View the full gallery'
        : 'Load more photographs';
    }
  };
  updateLoadMore();

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      const batch = remainingItems.splice(0, 12);
      batch.forEach((item) => item.classList.remove('is-hidden'));

      if (hasGSAP && !prefersReduced) {
        gsap.fromTo(
          batch.map((item) => item.querySelector('.gallery__frame')),
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.05, ease: 'power3.out' }
        );
      }
      updateLoadMore();
      if (hasScrollTrigger) ScrollTrigger.refresh();
    });
  }

  /* Lightbox ------------------------------------------------------------ */
  const lightbox = $('#lightbox');
  const lbImage = $('#lbImage');
  const lbIndex = $('#lbIndex');
  const lbTotal = $('#lbTotal');
  const lbClose = $('#lbClose');
  const lbPrev = $('#lbPrev');
  const lbNext = $('#lbNext');
  let currentIndex = 0;
  let lastFocused = null;

  if (lightbox && lbImage && galleryItems.length) {
    lbTotal.textContent = String(galleryItems.length).padStart(2, '0');

    const itemImage = (item) => $('img', item);

    const preload = (i) => {
      const item = galleryItems[(i + galleryItems.length) % galleryItems.length];
      const img = itemImage(item);
      if (!img) return;
      const pre = new Image();
      pre.src = img.dataset.full || img.currentSrc || img.src;
    };

    const render = (index) => {
      currentIndex = (index + galleryItems.length) % galleryItems.length;
      const item = galleryItems[currentIndex];
      const img = itemImage(item);
      if (!img) return;
      lbImage.src = img.dataset.full || img.currentSrc || img.src;
      lbImage.alt = img.alt;
      lbIndex.textContent = String(currentIndex + 1).padStart(2, '0');
      preload(currentIndex + 1);
      preload(currentIndex - 1);
    };

    const show = (index) => {
      render(index);
      lastFocused = doc.activeElement;
      lightbox.hidden = false;
      body.classList.add('is-locked');
      if (hasGSAP && !prefersReduced) {
        gsap.fromTo(lightbox, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' });
        gsap.fromTo(lbImage, { opacity: 0, scale: 0.985 }, { opacity: 1, scale: 1, duration: 0.55, ease: 'power3.out' });
      }
      window.setTimeout(() => lbClose.focus({ preventScroll: true }), 30);
    };

    const close = () => {
      const finish = () => {
        lightbox.hidden = true;
        lightbox.style.opacity = '';
        body.classList.remove('is-locked');
        if (lastFocused) lastFocused.focus({ preventScroll: true });
      };
      if (hasGSAP && !prefersReduced) {
        gsap.to(lightbox, { opacity: 0, duration: 0.28, ease: 'power2.in', onComplete: finish });
      } else {
        finish();
      }
    };

    const navigate = (dir) => {
      render(currentIndex + dir);
      if (hasGSAP && !prefersReduced) {
        gsap.fromTo(lbImage, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' });
      }
    };

    galleryItems.forEach((item, i) => {
      const btn = $('.gallery__open', item);
      if (btn) btn.addEventListener('click', () => show(i));
    });

    lbClose.addEventListener('click', close);
    lbPrev.addEventListener('click', () => navigate(-1));
    lbNext.addEventListener('click', () => navigate(1));

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox__stage')) close();
    });

    doc.addEventListener('keydown', (e) => {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); navigate(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); navigate(-1); }
      else if (e.key === 'Tab') {
        const focusables = [lbClose, lbPrev, lbNext];
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------------------------------------------------------------------
     Reviews slider
     --------------------------------------------------------------------- */
  const reviewsSlider = $('#reviewsSlider');
  const reviewsTrack = $('#reviewsTrack');
  const revPrev = $('#revPrev');
  const revNext = $('#revNext');
  const revBar = $('#revBar');

  if (reviewsSlider && reviewsTrack) {
    const updateBar = () => {
      const max = reviewsSlider.scrollWidth - reviewsSlider.clientWidth;
      const progress = max > 0 ? reviewsSlider.scrollLeft / max : 0;
      if (revBar) revBar.style.transform = `scaleX(${0.08 + progress * 0.92})`;
    };
    reviewsSlider.addEventListener('scroll', updateBar, { passive: true });
    updateBar();

    const step = (dir) => {
      const card = reviewsTrack.querySelector('.review');
      if (!card) return;
      const gap = parseFloat(getComputedStyle(reviewsTrack).columnGap || getComputedStyle(reviewsTrack).gap) || 16;
      const amount = card.getBoundingClientRect().width + gap;
      reviewsSlider.scrollBy({ left: dir * amount, behavior: prefersReduced ? 'auto' : 'smooth' });
    };
    revPrev?.addEventListener('click', () => step(-1));
    revNext?.addEventListener('click', () => step(1));

    // Mouse drag to scroll (touch already scrolls natively)
    let dragging = false;
    let dragStartX = 0;
    let dragStartScroll = 0;
    let moved = false;

    reviewsSlider.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      dragging = true;
      moved = false;
      dragStartX = e.clientX;
      dragStartScroll = reviewsSlider.scrollLeft;
      reviewsSlider.classList.add('is-dragging');
    });

    window.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const delta = e.clientX - dragStartX;
      if (Math.abs(delta) > 4) moved = true;
      reviewsSlider.scrollLeft = dragStartScroll - delta;
    }, { passive: true });

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      reviewsSlider.classList.remove('is-dragging');
    };
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    reviewsSlider.addEventListener('click', (e) => {
      if (moved) { e.preventDefault(); moved = false; }
    }, true);
  }

  /* ---------------------------------------------------------------------
     FAQ accordion
     --------------------------------------------------------------------- */
  const accordion = $('#accordion');
  if (accordion) {
    const items = $$('.accordion__item', accordion);

    const collapse = (item, animate = true) => {
      const btn = $('.accordion__trigger', item);
      const panel = $('.accordion__panel', item);
      if (!btn || !panel) return;
      btn.setAttribute('aria-expanded', 'false');
      if (hasGSAP && !prefersReduced && animate) {
        gsap.to(panel, {
          height: 0,
          duration: 0.42,
          ease: 'power2.inOut',
          overwrite: true,
          onComplete() { panel.style.overflow = 'hidden'; }
        });
      } else {
        panel.style.height = '0px';
        panel.style.overflow = 'hidden';
      }
    };

    const expand = (item) => {
      const btn = $('.accordion__trigger', item);
      const panel = $('.accordion__panel', item);
      if (!btn || !panel) return;
      btn.setAttribute('aria-expanded', 'true');
      panel.style.overflow = 'hidden';
      if (hasGSAP && !prefersReduced) {
        const target = panel.scrollHeight;
        gsap.fromTo(panel, { height: panel.offsetHeight }, {
          height: target,
          duration: 0.5,
          ease: 'power3.inOut',
          overwrite: true,
          onComplete() {
            panel.style.height = 'auto';
            panel.style.overflow = 'visible';
          }
        });
      } else {
        panel.style.height = 'auto';
        panel.style.overflow = 'visible';
      }
    };

    items.forEach((item) => {
      const btn = $('.accordion__trigger', item);
      const panel = $('.accordion__panel', item);
      if (!btn || !panel) return;
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      if (isOpen) {
        panel.style.height = 'auto';
        panel.style.overflow = 'visible';
      } else {
        panel.style.height = '0px';
        panel.style.overflow = 'hidden';
      }

      btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') === 'true';
        if (open) {
          collapse(item);
        } else {
          items.forEach((other) => {
            if (other !== item) collapse(other);
          });
          expand(item);
        }
      });
    });
  }

  /* ---------------------------------------------------------------------
     Inquiry form
     --------------------------------------------------------------------- */
  const form = $('#inquiryForm');
  if (form) {
    const status = $('#formStatus');

    const setStatus = (message, error = false) => {
      if (!status) return;
      status.textContent = message;
      status.classList.toggle('is-error', error);
    };

    const markInvalid = (input, invalid) => {
      const field = input.closest('.field');
      if (field) field.classList.toggle('is-invalid', invalid);
      input.setAttribute('aria-invalid', String(invalid));
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const required = ['firstName', 'lastName', 'email', 'message'];
      let firstInvalid = null;

      required.forEach((name) => {
        const input = form.elements[name];
        if (!input) return;
        const value = input.value.trim();
        const invalid = !value || (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
        markInvalid(input, invalid);
        if (invalid && !firstInvalid) firstInvalid = input;
      });

      if (firstInvalid) {
        setStatus('Please add your name, email and a few words about your day.', true);
        firstInvalid.focus({ preventScroll: true });
        return;
      }

      const data = new FormData(form);
      const get = (key) => String(data.get(key) || '').trim();

      if (FORM_ENDPOINT) {
        setStatus('Sending your inquiry…');
        try {
          const response = await fetch(FORM_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(Object.fromEntries(data.entries()))
          });
          if (!response.ok) throw new Error('Request failed');
          form.reset();
          setStatus('Thank you — your inquiry is on its way. Jesse will be in touch soon.');
        } catch (err) {
          setStatus('Something went wrong. Please email jessegiles1@gmail.com directly.', true);
        }
        return;
      }

      const type = get('type') || 'Wedding';
      const date = get('date');
      const subject = `Jesse Giles Photography — ${type} inquiry${date ? ' · ' + date : ''}`;
      const lines = [
        `Name: ${get('firstName')} ${get('lastName')}`,
        `Email: ${get('email')}`,
        `Phone: ${get('phone') || '—'}`,
        `Event date: ${date || 'Still deciding'}`,
        `Celebrating: ${type}`,
        `Venue or location: ${get('venue') || '—'}`,
        '',
        'A little about it:',
        get('message'),
        '',
        '— Sent from jessegilesphotography.net'
      ];
      const mailto = `mailto:jessegiles1@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;

      window.location.href = mailto;
      setStatus('Opening your email app with your inquiry filled in. If nothing happens, email jessegiles1@gmail.com directly.');
    });

    $$('input, textarea, select', form).forEach((input) => {
      input.addEventListener('input', () => {
        if (input.getAttribute('aria-invalid') === 'true') markInvalid(input, false);
      });
    });
  }

  /* ---------------------------------------------------------------------
     Fonts + boot
     --------------------------------------------------------------------- */
  const boot = () => {
    initScrollAnimations();
    if (hasScrollTrigger) ScrollTrigger.refresh();
  };

  const scheduleBoot = () => {
    if (prefersReduced) { boot(); return; }
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(boot, { timeout: 1200 });
    } else {
      window.setTimeout(boot, 180);
    }
  };

  // Non-critical animation setup waits until the page is interactive.
  if (document.readyState === 'complete') {
    scheduleBoot();
  } else {
    window.addEventListener('load', scheduleBoot, { once: true });
  }

  // Refresh scroll measurements once lazy media settles.
  window.addEventListener('load', () => {
    if (hasScrollTrigger) ScrollTrigger.refresh();
  });

  // Small helper class for browsers that support it
  doc.documentElement.classList.add('js-ready');
})();
