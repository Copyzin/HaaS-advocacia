/* =========================================================================
   HAAS Advocacia — Main JS
   Vanilla JS + GSAP 3 / ScrollTrigger via CDN.

   Funcionalidades:
   - Cinematic Intro Sequence (vídeo 3D autoplay → freeze → header desce → hero fade)
   - Gate sessionStorage (não repete intro na mesma sessão)
   - Fallback prefers-reduced-motion (pula intro inteira)
   - Header scroll behavior (translúcido → sólido após 80px)
   - Mobile FAB WhatsApp + sticky CTA bar (aparece após ~55% da hero)
   - Reveal on scroll (com ou sem GSAP ScrollTrigger)
   - Mobile menu drawer
   ========================================================================= */

(() => {
  'use strict';

  const STORAGE_KEY = 'haas_intro_seen';
  // REDUCED_MOTION é avaliado live: usuário pode trocar a preferência do SO
  // no meio da sessão (ex.: Settings → Accessibility no Android/iOS) e o site
  // precisa reagir sem reload. Mantido como `let` para permitir update do listener.
  let REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  try {
    const _rmqMql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const _rmqOnChange = (e) => { REDUCED_MOTION = e.matches; };
    if (_rmqMql.addEventListener) _rmqMql.addEventListener('change', _rmqOnChange);
    else if (_rmqMql.addListener) _rmqMql.addListener(_rmqOnChange); // Safari 13- fallback
  } catch (err) {}

  // F5 / Ctrl+R / Ctrl+Shift+R sempre tocam a intro de novo.
  // Navegação interna (link clicado, back/forward) respeita o gate.
  function isPageReload() {
    // Método 1: Navigation Timing Level 2 (Chrome/Firefox/Edge modernos)
    try {
      const nav = performance.getEntriesByType('navigation')[0];
      if (nav && nav.type) return nav.type === 'reload';
    } catch (e) {}
    // Método 2: API legada (Safari < 15, browsers antigos)
    try {
      if (performance.navigation) return performance.navigation.type === 1;
    } catch (e) {}
    // Método 3: heurística via referrer — F5 e visita direta têm referrer vazio;
    // navegação interna tem referrer preenchido.
    // Se ambas as APIs falharam, melhor tocar a intro do que suprimi-la.
    return !document.referrer;
  }

  /* -----------------------------------------------------------------------
     UTIL
     ----------------------------------------------------------------------- */

  const $ = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];

  const hasGSAP = () => typeof window.gsap !== 'undefined';
  const hasScrollTrigger = () => hasGSAP() && typeof window.ScrollTrigger !== 'undefined';

  /* -----------------------------------------------------------------------
     SCROLL THROTTLE — um único listener rAF compartilhado para handlers de
     scroll (header solid, mobile FAB/sticky). Evita rodar callbacks 60+/s
     em mobile, prevenindo jank e overhead de bateria.
     ----------------------------------------------------------------------- */
  let _scrollRaf = 0;
  const _scrollCallbacks = new Set();
  function onScrollThrottled(cb) {
    _scrollCallbacks.add(cb);
    cb();
  }
  window.addEventListener('scroll', () => {
    if (_scrollRaf) return;
    _scrollRaf = requestAnimationFrame(() => {
      _scrollRaf = 0;
      _scrollCallbacks.forEach((cb) => cb());
    });
  }, { passive: true });

  /* -----------------------------------------------------------------------
     CINEMATIC INTRO SEQUENCE
     ----------------------------------------------------------------------- */

  function runIntroSequence() {
    const stage = $('.intro-stage');
    const video = $('.intro-video');
    const skip = $('.intro-skip');
    const header = $('.site-header');
    const heroContent = $('.hero__content');
    const body = document.body;

    // No F5, navegadores tentam restaurar a posição anterior — bloqueamos isso
    // pra garantir que, ao final da intro, o usuário SEMPRE acorda no hero.
    try { history.scrollRestoration = 'manual'; } catch (err) {}

    let alreadySeen = false;
    try { alreadySeen = sessionStorage.getItem(STORAGE_KEY) === '1'; } catch (err) {}
    const reloaded = isPageReload();
    // Hash que aponta pra uma seção real da página atual (ex: #sobre, #servicos).
    // Comportamento desejado:
    // - F5 ignora o hash → SEMPRE acorda no hero (regra de marca confirmada).
    // - Navegação direta com hash (link "Sobre" de outra página, bookmark,
    //   compartilhamento de URL) respeita o destino — usuário pediu pra ver
    //   #sobre, levamos ele lá, e ainda assim deixamos o bg do hero pronto pra
    //   quando ele rolar pra cima.
    const hashId = (window.location.hash || '').slice(1);
    const hashTarget = hashId ? document.getElementById(hashId) : null;
    const honorHash = !!hashTarget && !reloaded;

    if (!honorHash) {
      forceScrollToHero();
    }

    if (!stage || !video) {
      revealFinalState(header, heroContent);
      return;
    }

    // Caminho rápido:
    // - honorHash: pula intro pra respeitar a âncora de destino.
    // - prefers-reduced-motion: pula tudo sempre.
    // - alreadySeen && !reloaded: navegação interna na mesma sessão.
    if (honorHash || REDUCED_MOTION || (alreadySeen && !reloaded)) {
      stage.style.display = 'none';
      body.classList.remove('is-intro-locked');
      revealFinalState(header, heroContent);
      if (!honorHash) {
        // Garante que o usuário comece no hero quando NÃO há intenção explícita
        // de pousar numa seção. Se honorHash, deixa o browser fazer o anchor scroll.
        forceScrollToHero();
      } else {
        // Marca como visto pra próximas navegações na mesma sessão respeitarem
        // o fast path normalmente.
        try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (err) {}
      }
      return;
    }

    body.classList.add('is-intro-locked');

    // ---------------------------------------------------------------------
    // Reveal coreografado.
    //
    // O VÍDEO já contém a transição até o fundo: seu último frame É o
    // background-oficial.png (fundo estático do hero). Por isso NÃO há mais
    // crossfade de poster — apenas dissolvemos o overlay do vídeo para revelar
    // o hero por baixo (mesma imagem → handoff imperceptível).
    //
    // As animações do hero (header + texto) começam REVEAL_LEAD segundos ANTES
    // do vídeo terminar e ficam visíveis conforme o overlay dissolve — o texto
    // "chega" sincronizado com o fim do vídeo, sem competir com ele.
    // ---------------------------------------------------------------------
    const REVEAL_LEAD = 1.1;   // segundos antes do fim do vídeo
    let revealed = false;
    let revealTimer = 0;

    const startReveal = () => {
      if (revealed) return;
      revealed = true;
      clearTimeout(revealTimer);
      try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (err) {}
      forceScrollToHero();

      requestAnimationFrame(() => {
        // Esconde skip button com fade próprio
        if (skip) {
          skip.style.transition = 'opacity 300ms ease-out';
          skip.style.opacity = '0';
          skip.style.pointerEvents = 'none';
        }

        // Dissolve do overlay do vídeo (1200ms via CSS) revelando o hero.
        stage.classList.add('is-done');

        // Entrada do hero JUNTO com o dissolve — começa ~1.1s antes do fim do
        // vídeo e assenta logo após ele terminar.
        animateEntrance(header, heroContent);

        // Remove o stage ao fim do dissolve. video.pause() é redundante após o
        // 'ended' natural, mas garante parada limpa quando o usuário dá skip.
        setTimeout(() => {
          try { video.pause(); } catch (err) {}
          stage.style.display = 'none';
          body.classList.remove('is-intro-locked');
          forceScrollToHero();
        }, 1300);
      });
    };

    // Agenda o reveal para REVEAL_LEAD antes do fim, recomputando a partir do
    // tempo real de reprodução. Recomputar a cada 'playing' torna o agendamento
    // robusto a buffering (cada retomada recalcula com o currentTime atual).
    const scheduleReveal = () => {
      if (revealed || !video.duration || !isFinite(video.duration)) return;
      const remaining = video.duration - video.currentTime - REVEAL_LEAD;
      clearTimeout(revealTimer);
      if (remaining <= 0) { startReveal(); return; }
      revealTimer = setTimeout(startReveal, remaining * 1000);
    };

    // Indicador de loading enquanto vídeo carrega
    const onCanPlay = () => {
      stage.classList.add('is-playing');
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        // Autoplay bloqueado → revela direto (sem intro).
        playPromise.catch(() => startReveal());
      }
    };

    if (video.readyState >= 3) {
      onCanPlay();
    } else {
      video.addEventListener('canplaythrough', onCanPlay, { once: true });
    }

    // Gatilhos do reveal
    video.addEventListener('loadedmetadata', scheduleReveal);
    video.addEventListener('playing', scheduleReveal);
    video.addEventListener('waiting', () => clearTimeout(revealTimer));
    video.addEventListener('timeupdate', () => {               // backstop do agendamento
      if (!revealed && video.duration && isFinite(video.duration) &&
          video.currentTime >= video.duration - REVEAL_LEAD) {
        startReveal();
      }
    });
    video.addEventListener('ended', startReveal, { once: true });  // backstop final

    if (skip) {
      skip.addEventListener('click', startReveal);
      skip.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startReveal();
        }
      });
    }

    // Safety: se o vídeo NUNCA começa a tocar (404, codec, autoplay bloqueado
    // sem disparar play().catch), revela em 20s. Limpo no primeiro `playing`.
    const safety = setTimeout(() => { if (!revealed) startReveal(); }, 20000);
    video.addEventListener('playing', () => clearTimeout(safety), { once: true });
  }

  function revealFinalState(header, heroContent) {
    if (header) header.classList.add('is-visible');
    if (heroContent) {
      heroContent.classList.add('is-visible');
      // Sinaliza ao CSS pra disparar o blur cinematográfico do .hero__bg em mobile.
      // Coloca no .hero raiz (não no content) pra que a regra cubra o background sibling.
      const heroRoot = heroContent.closest('.hero');
      if (heroRoot) heroRoot.classList.add('is-revealed');
    }
  }

  // Força o scroll pro topo (hero section) sem disparar smooth scroll.
  // Usada no início da intro (anti scroll-restoration do F5) e ao final
  // (garantia de que o destino é sempre o hero).
  function forceScrollToHero() {
    try {
      if ('scrollTo' in window) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } else {
        window.scrollTo(0, 0);
      }
    } catch (err) {
      window.scrollTo(0, 0);
    }
  }

  function animateEntrance(header, heroContent) {
    if (!hasGSAP()) {
      // Fallback CSS — classes is-visible disparam transições do styles.css
      setTimeout(() => revealFinalState(header, heroContent), 100);
      return;
    }

    const tl = window.gsap.timeline();
    const EASE = 'power2.out';

    if (header) {
      const logo = header.querySelector('.site-header__logo');
      const nav = header.querySelector('.site-nav');
      const cta = header.querySelector('.site-header__cta');
      const toggle = header.querySelector('.nav-toggle');

      header.classList.add('is-visible');

      tl.fromTo(
        header,
        { y: -80, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: EASE, clearProps: 'transform,opacity' },
        0
      );

      const headerChildren = [logo, nav, cta, toggle].filter(Boolean);
      if (headerChildren.length) {
        tl.fromTo(
          headerChildren,
          { y: -20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: EASE, clearProps: 'transform,opacity' },
          0.1
        );
      }
    }

    if (heroContent) {
      heroContent.classList.add('is-visible');
      // Espelha a classe no .hero raiz pro CSS disparar o blur do background
      // simultaneamente ao fade-up do conteúdo (DESIGN.md: "tela respira").
      const heroRoot = heroContent.closest('.hero');
      if (heroRoot) heroRoot.classList.add('is-revealed');
      tl.fromTo(
        heroContent.children,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.12, ease: EASE, clearProps: 'transform,opacity' },
        0.4
      );
    }
  }

  /* -----------------------------------------------------------------------
     HEADER scroll behavior
     ----------------------------------------------------------------------- */

  function initHeaderScroll() {
    const header = $('.site-header');
    if (!header) return;

    const onScroll = () => {
      if (window.scrollY > 80) {
        header.classList.add('is-solid');
      } else {
        header.classList.remove('is-solid');
      }
    };

    onScrollThrottled(onScroll);
  }

  /* -----------------------------------------------------------------------
     MOBILE FAB + STICKY CTA — aparece após ~55% da hero
     ----------------------------------------------------------------------- */

  function initMobileCTAs() {
    const fab = $('.fab-whatsapp');
    const sticky = $('.sticky-cta');
    if (!fab && !sticky) return;

    const hero = $('.hero');
    const threshold = hero ? hero.offsetHeight * 0.55 : 400;

    const onScroll = () => {
      const show = window.scrollY > threshold;
      [fab, sticky].forEach((el) => {
        if (!el) return;
        if (show) el.classList.add('is-visible');
        else el.classList.remove('is-visible');
      });
    };

    onScrollThrottled(onScroll);
    window.addEventListener('resize', onScroll, { passive: true });
  }

  /* -----------------------------------------------------------------------
     REVEAL ON SCROLL
     ----------------------------------------------------------------------- */

  function initReveal() {
    const reveals = $$('.reveal');
    if (!reveals.length) return;

    if (REDUCED_MOTION) {
      reveals.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    if (hasScrollTrigger()) {
      reveals.forEach((el) => {
        window.gsap.fromTo(
          el,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power2.out',
            clearProps: 'transform,opacity',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
            onComplete: () => el.classList.add('is-visible'),
          }
        );
      });
      return;
    }

    // Fallback IntersectionObserver
    if (typeof IntersectionObserver === 'undefined') {
      reveals.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -15% 0px' }
    );

    reveals.forEach((el) => io.observe(el));
  }

  /* -----------------------------------------------------------------------
     MOBILE MENU DRAWER
     ----------------------------------------------------------------------- */

  function initMobileMenu() {
    const toggle = $('.nav-toggle');
    const drawer = $('.nav-drawer');
    const close = $('.nav-drawer__close');
    if (!toggle || !drawer) return;

    const open = () => {
      drawer.classList.add('is-open');
      // .is-open no toggle dispara hamburger → X (definido em styles.css).
      toggle.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };
    const shut = () => {
      drawer.classList.remove('is-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    toggle.addEventListener('click', open);
    if (close) close.addEventListener('click', shut);
    $$('.nav-drawer a').forEach((link) => link.addEventListener('click', shut));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) shut();
    });

    initDrawerSwipe(drawer, shut);
    initDrawerSwipeOpen(drawer, open);
  }

  /* -----------------------------------------------------------------------
     SWIPE-TO-CLOSE — usuário arrasta o drawer da esquerda pra direita pra
     fechar. O painel segue o dedo em tempo real; ao soltar, ou fecha (se passou
     do threshold) ou volta na posição via transição CSS.
     ----------------------------------------------------------------------- */

  function initDrawerSwipe(drawer, shut) {
    let startX = 0, startY = 0, currentX = 0;
    let isDragging = false;
    let isHorizontalSwipe = false;
    const COMMIT_PX = 8;            // distância mínima pra "comitar" o swipe
    const CLOSE_RATIO = 0.28;       // 28% da largura do drawer = fecha

    const onTouchStart = (e) => {
      if (!drawer.classList.contains('is-open')) return;
      // Ignora se já tem múltiplos toques (pinch / zoom).
      if (e.touches.length > 1) return;
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      currentX = startX;
      isDragging = true;
      isHorizontalSwipe = false;
    };

    const onTouchMove = (e) => {
      if (!isDragging) return;
      const t = e.touches[0];
      currentX = t.clientX;
      const dx = currentX - startX;
      const dy = t.clientY - startY;

      // No primeiro movimento significativo, decide se é swipe horizontal-direita
      // ou scroll vertical. Se for vertical (ou esquerda), aborta o drag e
      // deixa o navegador rolar normalmente.
      if (!isHorizontalSwipe) {
        if (Math.abs(dx) < COMMIT_PX && Math.abs(dy) < COMMIT_PX) return;
        if (Math.abs(dx) > Math.abs(dy) && dx > 0) {
          isHorizontalSwipe = true;
          // Desativa a transição CSS pra o transform inline acompanhar o dedo
          // sem lag de 400ms.
          drawer.style.transition = 'none';
        } else {
          isDragging = false;
          return;
        }
      }

      // Só responde a movimento pra direita. Esquerda é clampado em 0
      // (drawer não passa da posição aberta).
      const offset = Math.max(0, dx);
      drawer.style.transform = `translateX(${offset}px)`;
    };

    const onTouchEnd = () => {
      if (!isDragging) return;
      const wasHorizontal = isHorizontalSwipe;
      isDragging = false;
      isHorizontalSwipe = false;
      if (!wasHorizontal) return;

      const dx = currentX - startX;
      const threshold = drawer.offsetWidth * CLOSE_RATIO;

      // Restaura a transição CSS ANTES de mexer nas classes/inline — assim
      // a volta pra translateX(0) ou pra translateX(100%) anima suave.
      drawer.style.transition = '';

      if (dx > threshold) {
        shut();
      }
      // Limpa o transform inline em ambos os casos: se fechou, a regra .nav-drawer
      // (sem .is-open) assume translateX(100%); se não fechou, .is-open mantém 0.
      drawer.style.transform = '';
    };

    drawer.addEventListener('touchstart', onTouchStart, { passive: true });
    drawer.addEventListener('touchmove', onTouchMove, { passive: true });
    drawer.addEventListener('touchend', onTouchEnd);
    drawer.addEventListener('touchcancel', onTouchEnd);
  }

  /* -----------------------------------------------------------------------
     SWIPE-TO-OPEN — usuário arrasta da borda direita pra esquerda pra abrir.
     Espelho do swipe-to-close: dedo é seguido em tempo real, e ao soltar
     decide se abre (passou do threshold) ou volta off-screen.
     ----------------------------------------------------------------------- */

  function initDrawerSwipeOpen(drawer, open) {
    let startX = 0, startY = 0, currentX = 0;
    let isDragging = false;
    let isHorizontalSwipe = false;
    const EDGE_PX = 24;             // toque precisa começar nos últimos 24px à direita
    const COMMIT_PX = 8;            // mesmo threshold do close
    const OPEN_RATIO = 0.28;        // 28% da largura do drawer → abre

    const onTouchStart = (e) => {
      // Drawer aberto? swipe-to-close cuida; sai daqui.
      if (drawer.classList.contains('is-open')) return;
      // Só ativa em mobile — drawer não existe em ≥1024px.
      if (window.innerWidth >= 1024) return;
      if (e.touches.length > 1) return;
      const t = e.touches[0];
      // Edge filter: touchstart precisa começar bem perto da borda direita.
      // Caso contrário, qualquer toque na página acionaria o handler — quebrando
      // scroll e cliques normais.
      if (t.clientX < window.innerWidth - EDGE_PX) return;
      startX = t.clientX;
      startY = t.clientY;
      currentX = startX;
      isDragging = true;
      isHorizontalSwipe = false;
    };

    const onTouchMove = (e) => {
      if (!isDragging) return;
      const t = e.touches[0];
      currentX = t.clientX;
      const dx = currentX - startX;     // negativo: dedo indo pra esquerda (queremos)
      const dy = t.clientY - startY;

      if (!isHorizontalSwipe) {
        if (Math.abs(dx) < COMMIT_PX && Math.abs(dy) < COMMIT_PX) return;
        // Horizontal + esquerda → ativa. Vertical ou direita → aborta (deixa scroll).
        if (Math.abs(dx) > Math.abs(dy) && dx < 0) {
          isHorizontalSwipe = true;
          drawer.style.transition = 'none';
        } else {
          isDragging = false;
          return;
        }
      }

      // Drawer entra da direita: começa em translateX(drawerW) e vai indo pra 0
      // conforme o dedo se afasta da borda direita.
      const drawerW = drawer.offsetWidth;
      const offset = Math.min(drawerW, Math.abs(dx));   // clamp em 0 (drawer cheio)
      drawer.style.transform = `translateX(${drawerW - offset}px)`;
    };

    const onTouchEnd = () => {
      if (!isDragging) return;
      const wasHorizontal = isHorizontalSwipe;
      isDragging = false;
      isHorizontalSwipe = false;
      if (!wasHorizontal) return;

      const dx = currentX - startX;
      const threshold = drawer.offsetWidth * OPEN_RATIO;

      drawer.style.transition = '';

      if (Math.abs(dx) > threshold) {
        open();   // .is-open assume translateX(0); CSS anima da posição inline pra 0.
      }
      // Limpa o transform inline em ambos os casos. Se abriu, .is-open controla;
      // se não, drawer volta pra translateX(100%) via regra base.
      drawer.style.transform = '';
    };

    document.body.addEventListener('touchstart', onTouchStart, { passive: true });
    document.body.addEventListener('touchmove', onTouchMove, { passive: true });
    document.body.addEventListener('touchend', onTouchEnd);
    document.body.addEventListener('touchcancel', onTouchEnd);
  }

  /* -----------------------------------------------------------------------
     PRECISE SECTION SCROLL — header-aware anchor interception

     Só intercepta cliques em <a> que apontam para um id existente NA PÁGINA
     ATUAL. Tudo o que é rota (servicos.html, blog/, index.html), link externo
     com target="_blank" (WhatsApp), download, rel="external" ou clique com
     modificador (Ctrl/Meta/Shift/Alt/middle-click) continua com comportamento
     padrão do navegador — abre em nova aba, troca de rota, etc.

     Para os links de seção (#sobre, #contato), calcula o destino usando a
     altura LIVE do .site-header via getBoundingClientRect(), garantindo
     alinhamento pixel-perfect em qualquer breakpoint, mesmo que o header
     mude de altura entre mobile/desktop.
     ----------------------------------------------------------------------- */

  function initPreciseSectionScroll() {
    const header = $('.site-header');
    const root = document.documentElement;

    // Mantém o custom property --site-header-h sincronizado com a altura
    // real do header. Cobre o caso fallback (CSS scroll-padding-top),
    // usado quando o scroll é iniciado pelo browser e não pelo nosso handler.
    const syncHeaderHeight = () => {
      if (!header) return;
      const h = Math.round(header.getBoundingClientRect().height);
      if (h > 0) root.style.setProperty('--site-header-h', h + 'px');
    };
    syncHeaderHeight();
    window.addEventListener('resize', syncHeaderHeight);
    window.addEventListener('orientationchange', syncHeaderHeight);
    // Webfonts podem alterar alturas após o paint inicial
    if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === 'function') {
      document.fonts.ready.then(syncHeaderHeight).catch(() => {});
    }

    // Posição de LAYOUT (não-transformada) do topo do elemento em coordenadas
    // absolutas do documento. Usa offsetTop chain em vez de getBoundingClientRect,
    // porque o GSAP aplica transform:translateY(24px) nos elementos `.reveal`
    // antes do ScrollTrigger disparar. getBoundingClientRect retornaria a
    // posição VISUAL (com o transform), que difere da posição de layout final
    // depois que o reveal anima pra y:0. offsetTop ignora transforms — sempre
    // dá a posição real de layout, garantindo alinhamento pixel-perfect.
    const layoutTop = (el) => {
      let y = 0;
      let cur = el;
      while (cur) {
        y += cur.offsetTop;
        cur = cur.offsetParent;
      }
      return y;
    };

    // Extrai o id de destino se (e somente se) o link aponta para o mesmo
    // documento. Retorna null para qualquer link de rota / externo.
    const sameDocHash = (anchor) => {
      const href = anchor.getAttribute('href') || '';
      if (!href) return null;
      if (href.startsWith('#')) return href.slice(1) || null;
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return null;
        if (url.pathname !== window.location.pathname) return null;
        return url.hash ? url.hash.slice(1) : null;
      } catch (err) {
        return null;
      }
    };

    document.addEventListener('click', (event) => {
      const anchor = event.target.closest && event.target.closest('a[href]');
      if (!anchor) return;

      // Modificadores e middle-click → deixar o browser abrir em nova aba/janela
      if (event.defaultPrevented) return;
      if (event.button === 1) return;
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

      // Rotas externas / nova aba / download → não interceptar
      if (anchor.target && anchor.target !== '' && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;
      const rel = anchor.getAttribute('rel') || '';
      if (/\bexternal\b/i.test(rel)) return;

      // Só intercepta hashes do mesmo documento
      const id = sameDocHash(anchor);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;

      event.preventDefault();

      // Atualiza hash na URL pra back/forward funcionarem corretamente
      if (window.location.hash !== '#' + id) {
        try { history.pushState(null, '', '#' + id); } catch (err) {}
      }

      // Se o destino é um elemento `.reveal` (GSAP+ScrollTrigger), força-o
      // ao estado final ANTES do scroll. Sem isso, o ScrollTrigger pode
      // disparar no meio do scroll suave, deixando o destino visivelmente
      // deslocado (transform: translateY(24)) por uma fração de segundo —
      // a math está correta, mas o usuário vê o assentamento.
      if (target.classList.contains('reveal') && window.gsap) {
        try {
          window.gsap.killTweensOf(target);
          window.gsap.set(target, { clearProps: 'transform,opacity', overwrite: 'auto' });
          if (window.ScrollTrigger) {
            window.ScrollTrigger.getAll().forEach((st) => {
              if (st.trigger === target) st.kill();
            });
          }
        } catch (err) {}
        target.classList.add('is-visible');
      }

      // Altura REAL do header neste exato momento — cobre breakpoint,
      // estado .is-solid, e qualquer reflow que tenha ocorrido entre o
      // load inicial e o clique.
      const headerH = header ? Math.round(header.getBoundingClientRect().height) : 0;
      const targetTop = layoutTop(target);
      // Offset opcional por target via atributo data-scroll-offset (em px).
      // Útil quando o alinhamento padrão "topo da seção sob o header" não
      // entrega o enquadramento ideal — ex.: #contato pede +90px para
      // exibir Ver Rotas com mais folga no fold. Cada seção declara seu
      // próprio offset; nada de hardcode aqui.
      const rawOffset = parseInt(target.getAttribute('data-scroll-offset') || '0', 10);
      const extraOffset = isFinite(rawOffset) ? rawOffset : 0;
      const scrollTop = Math.max(0, Math.round(targetTop - headerH + extraOffset));

      window.scrollTo({
        top: scrollTop,
        left: 0,
        behavior: REDUCED_MOTION ? 'auto' : 'smooth'
      });
    });

    /* ---------------------------------------------------------------------
       NAVEGAÇÃO COM HASH DE OUTRA PÁGINA (ex: /blog/index.html → #sobre)

       Quando a página carrega com hash na URL (ex: /index.html#sobre vindo
       de outra rota), o browser faz o anchor scroll NATIVO usando o CSS
       `scroll-padding-top: var(--site-header-h, 96px)` — e IGNORA o
       `data-scroll-offset` declarado no target. Resultado: usuário pousa
       no lugar errado e precisaria clicar de novo no link "Sobre".

       Aqui re-aplicamos o mesmo cálculo preciso do click handler, agora
       contra o hash já presente em window.location.hash. Defere com rAF
       para rodar APÓS o anchor scroll do browser, sobrescrevendo-o.

       Skip em reload (F5): a regra de marca é "F5 sempre acorda no hero",
       então deixamos o runIntroSequence assumir.
       --------------------------------------------------------------------- */
    const initialId = (window.location.hash || '').slice(1);
    if (initialId && !isPageReload()) {
      const initialTarget = document.getElementById(initialId);
      if (initialTarget) {
        const applyInitialHashScroll = () => {
          // Mesma força-reveal-finalizar do click handler — evita pousar no
          // estado intermediário do GSAP fromTo (translateY:24, opacity:0).
          if (initialTarget.classList.contains('reveal') && window.gsap) {
            try {
              window.gsap.killTweensOf(initialTarget);
              window.gsap.set(initialTarget, { clearProps: 'transform,opacity', overwrite: 'auto' });
              if (window.ScrollTrigger) {
                window.ScrollTrigger.getAll().forEach((st) => {
                  if (st.trigger === initialTarget) st.kill();
                });
              }
            } catch (err) {}
            initialTarget.classList.add('is-visible');
          }

          const headerH = header ? Math.round(header.getBoundingClientRect().height) : 0;
          const targetTop = layoutTop(initialTarget);
          const rawOffset = parseInt(initialTarget.getAttribute('data-scroll-offset') || '0', 10);
          const extraOffset = isFinite(rawOffset) ? rawOffset : 0;
          const scrollTop = Math.max(0, Math.round(targetTop - headerH + extraOffset));

          // Atribuição direta = instantânea, ignora scroll-behavior:smooth
          // do CSS. É estado inicial, não interação, então sem animação.
          document.documentElement.scrollTop = scrollTop;
          document.body.scrollTop = scrollTop;
        };
        // Aplica em momentos diferentes para cobrir as várias etapas em que
        // algo pode escrollar a página após o load:
        //   1) rAF chain — cobre browsers com anchor scroll síncrono.
        //   2) load event — anchor scroll nativo do browser tipicamente
        //      acontece aqui; rodamos logo após e sobrescrevemos.
        //   3) setTimeout 1400ms — cobre o cleanup do intro stage (1300ms
        //      no slow path) ou qualquer scroll-trigger atrasado.
        // Cada apply é idempotente — se já estamos no destino, não faz nada
        // observável.
        requestAnimationFrame(() => requestAnimationFrame(applyInitialHashScroll));
        if (document.readyState === 'complete') {
          setTimeout(applyInitialHashScroll, 50);
        } else {
          window.addEventListener('load', () => setTimeout(applyInitialHashScroll, 50), { once: true });
        }
        setTimeout(applyInitialHashScroll, 1400);
      }
    }
  }

  /* -----------------------------------------------------------------------
     HERO SUBTITLE EXPAND / COLLAPSE (mobile only)
     ----------------------------------------------------------------------- */

  function initSubtitleToggle() {
    const toggle = $('.hero__subtitle-toggle');
    const subtitle = document.getElementById('hero-subtitle-text');
    if (!toggle || !subtitle) return;

    const mq = window.matchMedia('(max-width: 1023px)');

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      const next = !expanded;
      toggle.setAttribute('aria-expanded', String(next));
      subtitle.classList.toggle('is-expanded', next);
      toggle.querySelector('.hero__subtitle-toggle__label').textContent =
        next ? 'Mostrar menos' : 'Mostrar mais';
    });

    // If the window grows to desktop, reset collapsed state so text isn't clipped
    const onBreakpoint = () => {
      if (!mq.matches) {
        subtitle.classList.remove('is-expanded');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.querySelector('.hero__subtitle-toggle__label').textContent = 'Mostrar mais';
      }
    };
    try {
      mq.addEventListener('change', onBreakpoint);
    } catch (_) {
      mq.addListener(onBreakpoint); // Safari 13- fallback
    }
  }

  /* -----------------------------------------------------------------------
     NAV DROPDOWNS (desktop) — Serviços e Blog ganham um submenu com as rotas.
     Hover tolerante: o painel é FILHO do grupo (mouse sobre ele não fecha);
     o fechamento tem delay (re-entrada rápida cancela o timer); e um "bridge"
     transparente (padding-top do painel) elimina o dead-zone entre o link e o
     painel. Progressive enhancement: sem JS, os tabs ainda linkam para
     /servicos/ e /blog/. Só aparece no desktop (.site-nav é display:none < 1024px).
     ----------------------------------------------------------------------- */
  function initNavDropdowns() {
    const nav = $('.site-nav');
    if (!nav) return;

    const MENUS = {
      '/servicos/': {
        eyebrow: 'Áreas de Atuação',
        items: [
          { label: 'Previdenciário', sub: 'Dra. Aline', href: '/servicos/previdenciario' },
          { label: 'Trabalhista', sub: 'Dra. Heloísa', href: '/servicos/trabalhista' },
          { label: 'Família', sub: 'Dra. Aline e Dra. Heloísa', href: '/servicos/familia' },
          { label: 'Direito do Consumidor', sub: 'Dra. Aline e Dra. Heloísa', href: '/servicos/consumidor' },
        ],
      },
      '/blog/': {
        eyebrow: 'Últimos artigos',
        items: [
          { label: 'Aposentadoria após a Reforma', sub: 'Previdenciário', href: '/blog/aposentadoria-tempo-contribuicao-pos-reforma' },
          { label: 'Rescisão Indireta', sub: 'Trabalhista', href: '/blog/rescisao-indireta-quando-trabalhador-pode-pedir' },
          { label: 'Divórcio Consensual', sub: 'Família', href: '/blog/divorcio-consensual-como-funciona' },
        ],
      },
    };

    const OPEN_DELAY = 120;  // ms — exige um leve "dwell"; um flick de passagem não abre
    const CLOSE_DELAY = 220; // ms — tolerância ao sair; re-entrada cancela

    // Estado compartilhado: garante que só UM dropdown fique aberto por vez.
    const controllers = [];
    const closeOthers = (except) => controllers.forEach((c) => { if (c !== except) c.closeNow(); });

    $$('a', nav).forEach((trigger) => {
      const menu = MENUS[trigger.getAttribute('href')];
      if (!menu) return;

      // Agrupa trigger + painel sem quebrar o flex da nav.
      const group = document.createElement('span');
      group.className = 'nav-group';
      trigger.parentNode.insertBefore(group, trigger);
      group.appendChild(trigger);
      trigger.classList.add('nav-group__trigger');
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('aria-expanded', 'false');

      const itemsHTML = menu.items.map((it) =>
        '<a class="nav-dropdown__item" href="' + it.href + '" role="menuitem">' +
          '<span class="nav-dropdown__label">' + it.label + '</span>' +
          '<span class="nav-dropdown__sub">' + it.sub + '</span>' +
        '</a>'
      ).join('');

      const panel = document.createElement('div');
      panel.className = 'nav-dropdown';
      panel.setAttribute('role', 'menu');
      panel.innerHTML =
        '<div class="nav-dropdown__inner">' +
          '<p class="nav-dropdown__eyebrow">' + menu.eyebrow + '</p>' +
          itemsHTML +
        '</div>';
      group.appendChild(panel);

      let openT = null, closeT = null;
      const isOpen = () => group.classList.contains('is-open');
      const showNow = () => {
        clearTimeout(openT); clearTimeout(closeT);
        closeOthers(ctrl);            // exclusão mútua: fecha o outro IMEDIATAMENTE
        group.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      };
      const closeNow = () => {
        clearTimeout(openT); clearTimeout(closeT);
        group.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      };
      const ctrl = { closeNow };
      controllers.push(ctrl);

      group.addEventListener('mouseenter', () => {
        clearTimeout(closeT);         // cancela fechamento próprio (re-entrada rápida)
        if (isOpen()) return;
        // Intenção de abertura: só abre após o dwell. Um flick de passagem
        // (sair antes do OPEN_DELAY) cancela e NÃO abre — o dropdown que já
        // estava aberto mantém a prioridade. Uma pausa abre este e fecha o outro.
        clearTimeout(openT);
        openT = setTimeout(showNow, OPEN_DELAY);
      });
      group.addEventListener('mouseleave', () => {
        clearTimeout(openT);          // cancela abertura pendente (flick)
        if (isOpen()) { clearTimeout(closeT); closeT = setTimeout(closeNow, CLOSE_DELAY); }
      });
      // Teclado: foco abre na hora (sem dwell); Esc fecha.
      group.addEventListener('focusin', () => { clearTimeout(closeT); showNow(); });
      group.addEventListener('focusout', (e) => {
        if (!group.contains(e.relatedTarget)) { clearTimeout(closeT); closeT = setTimeout(closeNow, CLOSE_DELAY); }
      });
      group.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { closeNow(); trigger.focus(); }
      });
    });
  }

  /* -----------------------------------------------------------------------
     WHATSAPP CHAT WIDGET (desktop: hover no FAB + teaser apos 10s)
     ----------------------------------------------------------------------- */

  function initWaChat() {
    var waWidget = document.getElementById('waWidget');
    var waFab = document.getElementById('whatsappFab');
    if (!waWidget) return;

    var waThread = document.getElementById('waThread');
    var waQuick = document.getElementById('waQuick');
    var waScroll = document.getElementById('waScroll');
    var waMsgs = [waWidget.dataset.msg1, waWidget.dataset.msg2, waWidget.dataset.msg3].filter(Boolean);
    var waWelcome = waMsgs.length ? waMsgs[Math.floor(Math.random() * waMsgs.length)] : 'Ola! Como posso ajudar?';
    var waReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var waFaqs = [];
    if (waWidget.dataset.faqs) {
      try {
        JSON.parse(waWidget.dataset.faqs).forEach(function (f) {
          if (f && f.q && f.a) waFaqs.push({ q: String(f.q), a: String(f.a), used: false });
        });
      } catch (e) {}
    }
    /* leitura ao vivo do #faqList se data-faqs estiver vazio */
    if (waFaqs.length === 0) {
      Array.prototype.forEach.call(document.querySelectorAll('#faqList .faq-item'), function (it) {
        var q = it.querySelector('summary span');
        var a = it.querySelector('.faq-a p');
        if (q && a) waFaqs.push({ q: q.textContent.trim(), a: a.textContent.trim(), used: false });
      });
    }

    function waScrollBottom() { if (waScroll) waScroll.scrollTop = waScroll.scrollHeight; }
    function waScrollToEl(el) {
      if (!waScroll || !el) return;
      var top = el.getBoundingClientRect().top - waScroll.getBoundingClientRect().top + waScroll.scrollTop;
      waScroll.scrollTop = Math.max(0, top - 8);
    }
    function waBubble(side, text) {
      var b = document.createElement('div');
      b.className = 'wa-bubble wa-bubble--' + side;
      b.textContent = text;
      if (waThread) waThread.appendChild(b);
      waScrollBottom();
      return b;
    }
    function waTypingBubble() {
      var b = document.createElement('div');
      b.className = 'wa-bubble wa-bubble--in wa-bubble--typing';
      b.innerHTML = '<span class="wa-dots"><span></span><span></span><span></span></span>';
      if (waThread) waThread.appendChild(b);
      waScrollBottom();
      return b;
    }
    function waSay(text, cb) {
      if (waReduced) { waBubble('in', text); if (cb) cb(); return; }
      var t = waTypingBubble();
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); waBubble('in', text); if (cb) cb(); }, 750);
    }
    function waRenderChips() {
      if (!waQuick) return;
      waQuick.innerHTML = '';
      var remaining = 0;
      waFaqs.forEach(function (f) {
        if (f.used) return;
        remaining++;
        var c = document.createElement('button');
        c.type = 'button';
        c.className = 'wa-chip';
        c.textContent = f.q;
        c.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          waPinned = true;
          f.used = true;
          var qb = waBubble('out', f.q);
          waQuick.innerHTML = '';
          waSay(f.a, function () { waRenderChips(); waScrollToEl(qb); });
        });
        waQuick.appendChild(c);
      });
      if (remaining === 0) {
        var p = document.createElement('p');
        p.className = 'wa-quick-end';
        p.textContent = waWidget.dataset.end || 'Fale com a gente no WhatsApp.';
        waQuick.appendChild(p);
      }
      waScrollBottom();
    }

    var waBuilt = false;
    function waBuildChat() { if (waBuilt) return; waBuilt = true; waSay(waWelcome, waRenderChips); }

    var waTeaser = document.getElementById('waTeaser');
    var waTeaserOpen = document.getElementById('waTeaserOpen');
    var waTeaserClose = document.getElementById('waTeaserClose');
    var waCanHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var waOverFab = false, waOverPanel = false, waCloseT = null, waDismissed = false, waPinned = false, waReady = false, waTimerStarted = false;
    var WA_TEASER_DELAY = parseInt(waWidget.dataset.teaserDelay, 10) || 10000;

    function waFabVisible() { return !waFab || waFab.classList.contains('is-visible'); }
    function waChatOpen() { return waWidget.classList.contains('is-open'); }
    function waSyncTeaser() {
      if (!waTeaser) return;
      if (waReady && !waDismissed && waFabVisible() && !waChatOpen()) waTeaser.classList.add('is-shown');
      else waTeaser.classList.remove('is-shown');
    }
    function waHideTeaser() { if (waTeaser) waTeaser.classList.remove('is-shown'); }
    function waStartTimer() {
      if (waTimerStarted || waDismissed || !waFabVisible()) return;
      waTimerStarted = true;
      setTimeout(function () { waReady = true; waSyncTeaser(); }, WA_TEASER_DELAY);
    }
    function waOpen() {
      if (waDismissed || !waFabVisible()) return;
      waReady = true;
      waHideTeaser();
      waWidget.classList.add('is-open');
      waBuildChat();
    }
    function waBackToTeaser() {
      waWidget.classList.remove('is-open');
      waPinned = false;
      waSyncTeaser();
    }
    function waDismiss() {
      waDismissed = true; waPinned = false;
      waWidget.classList.remove('is-open');
      waHideTeaser();
    }
    function waScheduleClose() {
      clearTimeout(waCloseT);
      waCloseT = setTimeout(function () {
        if (!waOverFab && !waOverPanel && !waPinned) waBackToTeaser();
      }, 260);
    }

    var waCloseBtn = document.getElementById('waClose');
    if (waCloseBtn) waCloseBtn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); waDismiss(); });
    if (waTeaserOpen) waTeaserOpen.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); waPinned = true; waOpen(); });
    if (waTeaserClose) waTeaserClose.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); waDismiss(); });

    if (waCanHover) {
      if (waFab) {
        waFab.addEventListener('pointerenter', function () { waOverFab = true; clearTimeout(waCloseT); waOpen(); });
        waFab.addEventListener('pointerleave', function () { waOverFab = false; waScheduleClose(); });
      }
      waWidget.addEventListener('pointerenter', function () { waOverPanel = true; clearTimeout(waCloseT); });
      waWidget.addEventListener('pointerleave', function () { waOverPanel = false; waScheduleClose(); });
      document.addEventListener('click', function (e) {
        if (!waChatOpen()) return;
        if (waWidget.contains(e.target) || (waFab && waFab.contains(e.target)) || (waTeaser && waTeaser.contains(e.target))) return;
        waBackToTeaser();
      });
    }

    window.addEventListener('scroll', function () { waStartTimer(); waSyncTeaser(); }, { passive: true });
    waStartTimer();
    waSyncTeaser();
  }

  /* -----------------------------------------------------------------------
     INIT
     ----------------------------------------------------------------------- */

  function init() {
    if (hasScrollTrigger()) {
      window.gsap.registerPlugin(window.ScrollTrigger);
    }

    runIntroSequence();
    initHeaderScroll();
    initMobileCTAs();
    initReveal();
    initMobileMenu();
    initNavDropdowns();
    initSubtitleToggle();
    initPreciseSectionScroll();
    initWaChat();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
