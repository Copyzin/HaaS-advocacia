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
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // F5 / Ctrl+R / Ctrl+Shift+R sempre tocam a intro de novo.
  // Navegação interna (link clicado, back/forward) respeita o gate.
  function isPageReload() {
    try {
      const nav = performance.getEntriesByType('navigation')[0];
      if (nav && nav.type) return nav.type === 'reload';
      // Fallback antigo (Safari, navegadores legados)
      if (performance.navigation) {
        return performance.navigation.type === 1; // TYPE_RELOAD
      }
    } catch (err) {}
    return false;
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
    const heroBg = $('.hero__bg');
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

    // Se a estrutura da intro não existir, apenas revelar header e hero
    // (e ainda assim sincronizar o bg pra evitar flash preto se o usuário rolar).
    if (!stage || !video) {
      syncHeroToLastFrame(video, heroBg);
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
      syncHeroToLastFrame(video, heroBg);
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

    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;

      // Congela o vídeo da intro no último frame
      try {
        if (video.duration && isFinite(video.duration)) {
          // -0.05s evita que o navegador pule pro frame 0 ao atingir a duração exata
          video.currentTime = Math.max(0, video.duration - 0.05);
        }
        video.pause();
      } catch (err) {}

      // Sincroniza o vídeo de background do hero ao mesmo último frame
      // ANTES de animar o stage out. Isso elimina o "salto" entre os dois vídeos.
      syncHeroToLastFrame(video, heroBg);

      // Aguarda um paint pra garantir que o seek do hero foi renderizado,
      // então inicia a transição. Antes disso, redireciona pro topo (hero)
      // pra cobrir qualquer scroll restorado pelo browser durante o playback.
      forceScrollToHero();

      requestAnimationFrame(() => {
        // Esconde skip com fade próprio
        if (skip) {
          skip.style.transition = 'opacity 300ms ease-out';
          skip.style.opacity = '0';
          skip.style.pointerEvents = 'none';
        }

        // Stage fade-out longo (1200ms via CSS) — funciona como camada de
        // "dim" enquanto desaparece, mascarando o pop-in dos elementos do hero.
        stage.classList.add('is-done');
        setTimeout(() => {
          stage.style.display = 'none';
          body.classList.remove('is-intro-locked');
          // Garantia final: ao destravar o scroll, força o usuário no hero.
          forceScrollToHero();
        }, 1300);

        // Header desce + hero fade-up (GSAP timeline) acontecem POR BAIXO
        // do stage que está fazendo fade-out — o usuário vê a tela escurecer
        // suavemente e os elementos surgirem juntos.
        animateEntrance(header, heroContent);

        // Marca como visto (não-bloqueante)
        try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (err) {}
      });
    };

    // Indicador de loading enquanto vídeo carrega
    const onCanPlay = () => {
      stage.classList.add('is-playing');
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // Autoplay foi bloqueado — pular intro
          finish();
        });
      }
    };

    if (video.readyState >= 3) {
      onCanPlay();
    } else {
      video.addEventListener('canplaythrough', onCanPlay, { once: true });
    }

    // Eventos de término
    video.addEventListener('ended', finish, { once: true });

    if (skip) {
      skip.addEventListener('click', finish);
      skip.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          finish();
        }
      });
    }

    // Safety: se o vídeo NUNCA começa a tocar (404, codec, autoplay bloqueado pelo
    // browser sem capturar via play().catch), pula a intro em 20s.
    // O timeout é limpo no primeiro `playing` — ou seja, uma vez que o vídeo
    // começou a rodar, deixamos ele tocar até o `ended` natural sem cortar.
    const safety = setTimeout(() => { if (!finished) finish(); }, 20000);
    video.addEventListener('playing', () => clearTimeout(safety), { once: true });
  }

  function syncHeroToLastFrame(introVideo, heroBg) {
    if (!heroBg) return;
    const heroVideo = heroBg.querySelector('video');
    if (!heroVideo) return;

    // Define o tempo-alvo: último frame menos 0.05s pra evitar wraparound do loop
    // ou reset pra 0 que alguns navegadores fazem ao atingir duration exata.
    const targetTime = () => {
      const d = (introVideo && isFinite(introVideo.duration)) ? introVideo.duration
              : (isFinite(heroVideo.duration) ? heroVideo.duration : 0);
      return Math.max(0, d - 0.05);
    };

    const seek = () => {
      try {
        heroVideo.pause();
        heroVideo.currentTime = targetTime();
      } catch (err) {}
    };

    // Força preload mesmo quando o hero está fora da viewport (caso comum em
    // navegação direta pra #sobre, #servicos, etc.). Sem isso, alguns browsers
    // postergam o load do vídeo até ele entrar em tela — e o usuário vê o hero
    // preto quando finalmente rola pra cima.
    if (heroVideo.readyState === 0) {
      try { heroVideo.load(); } catch (err) {}
    }

    // Tenta seek o quanto antes; e amarra fallbacks pra GARANTIR que o último
    // frame seja renderizado assim que houver dados suficientes. Cobrimos os 3
    // marcos do ciclo de carregamento (metadata → primeiro frame → can-play)
    // porque diferentes browsers (Safari, Chrome, Firefox) renderizam o frame
    // pós-seek em momentos distintos do pipeline.
    if (heroVideo.readyState >= 1) seek();
    if (heroVideo.readyState < 4) {
      heroVideo.addEventListener('loadedmetadata', seek, { once: true });
      heroVideo.addEventListener('loadeddata', seek, { once: true });
      heroVideo.addEventListener('canplay', seek, { once: true });
    }
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
    initPreciseSectionScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
