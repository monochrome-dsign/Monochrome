/* ==========================================================================
   Monochrome — Interacciones del sitio
   ========================================================================== */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.remove("no-js");
  var CFG = window.MONO_CONFIG || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Navegación ---------- */
  var header = $(".site-header");
  var toggle = $(".nav-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = !header.classList.contains("nav-open");
      header.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", open);
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.classList.contains("nav-open")) { toggle.click(); toggle.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (header.classList.contains("nav-open") && !header.contains(e.target)) toggle.click();
    });
    $$(".nav-links a").forEach(function (a) { a.addEventListener("click", function () { if (header.classList.contains("nav-open")) toggle.click(); }); });
  }
  // Enlaces sociales desde config
  $$("[data-social]").forEach(function (a) {
    var key = a.getAttribute("data-social");
    if (CFG.social && CFG.social[key]) a.href = CFG.social[key];
    if (key === "secondary" && CFG.social && CFG.social.secondaryLabel) a.setAttribute("aria-label", CFG.social.secondaryLabel);
  });
  $$("[data-email]").forEach(function (a) { if (CFG.email) { a.href = "mailto:" + CFG.email; if (!a.children.length) a.textContent = CFG.email; } });
  $$("[data-year]").forEach(function (n) { n.textContent = new Date().getFullYear(); });


  /* ---------- Progreso de lectura, CTA flotante y volver arriba ---------- */
  var bar = $(".scroll-progress span"), floatEl = $("[data-floating]");
  var hideZones = $$(".contact, .cta-band, .site-footer"), zoneVisible = 0;
  if (floatEl && "IntersectionObserver" in window && hideZones.length) {
    var seen = new Set();
    var zio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); });
      zoneVisible = seen.size; onScroll();
    }, { threshold: 0.05 });
    hideZones.forEach(function (z) { zio.observe(z); });
  }
  var ticking = false;
  function onScroll() {
    var y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
    if (floatEl) {
      floatEl.classList.toggle("is-visible", y > 640 && !zoneVisible);
      floatEl.classList.toggle("is-deep", y > 1600);
    }
    ticking = false;
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
  $$("[data-to-top]").forEach(function (b) {
    b.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); var br = $(".brand"); if (br) br.focus({ preventScroll: true }); });
  });

  /* ---------- Navegación: sección activa y scroll suave a secciones de la página ---------- */
  var path = location.pathname.replace(/\.html$/, "").replace(/\/index$/, "/").replace(/(.)\/$/, "$1") || "/";
  $$(".nav-links a, .nav-cta").forEach(function (a) {
    var href = a.getAttribute("href") || "", target = null;
    if (href === "/contacto" && path !== "/contacto") target = document.getElementById("contacto");
    else if (href.indexOf("/#") === 0 && path === "/") target = document.getElementById(href.split("#")[1]);
    if (!target) return;
    a.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", "#" + target.id);
    });
    if ("IntersectionObserver" in window && a.closest(".nav-links")) {
      new IntersectionObserver(function (es) { a.classList.toggle("is-active", es[0].isIntersecting); }, { rootMargin: "-45% 0px -45% 0px" }).observe(target);
    }
  });

  /* ---------- Precarga de páginas internas al pasar el ratón ---------- */
  var prefetched = {};
  function prefetch(e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href");
    if (!/^\/[\w-]*(?:[?#]|$)/.test(href)) return;
    var page = href.split(/[?#]/)[0];
    if (prefetched[page] || page === path) return;
    prefetched[page] = true;
    var l = document.createElement("link"); l.rel = "prefetch"; l.href = page; document.head.appendChild(l);
  }
  document.addEventListener("pointerenter", prefetch, true);
  document.addEventListener("touchstart", prefetch, { passive: true, capture: true });

  /* ---------- Copiar email ---------- */
  var toastEl = null, toastT;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add("is-visible");
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("is-visible"); }, 2400);
  }
  $$("[data-copy-email]").forEach(function (b) {
    if (!navigator.clipboard) { b.hidden = true; return; }
    b.addEventListener("click", function () {
      navigator.clipboard.writeText(CFG.email || "").then(function () { toast("Email copiado ✓"); }, function () { toast("No se pudo copiar: selecciónalo a mano"); });
    });
  });

  /* ---------- Revelado al hacer scroll ---------- */
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var t = en.target; t.classList.add("is-visible"); io.unobserve(t);
        /* Al terminar la entrada, se quitan las clases para que cada tarjeta recupere su propia transición de hover/pulsación */
        setTimeout(function () { t.classList.remove("reveal", "reveal-stagger", "is-visible"); }, 1500);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    $$(".reveal, .reveal-stagger").forEach(function (n) { io.observe(n); });
  } else {
    $$(".reveal, .reveal-stagger").forEach(function (n) { n.classList.add("is-visible"); });
  }

  /* ---------- Marquees infinitos (logos y frase) ---------- */
  $$("[data-marquee]").forEach(function (m) {
    var track = $(".marquee__track", m);
    if (!track) return;
    // Clonar hasta cubrir el ancho y duplicar la pista para un bucle sin saltos
    var guard = 0;
    while (track.scrollWidth < m.clientWidth * 1.1 && guard++ < 8) {
      [].slice.call(track.children).forEach(function (c) { track.appendChild(c.cloneNode(true)); });
    }
    var clone = track.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    $$("a, button", clone).forEach(function (n) { n.tabIndex = -1; });
    m.appendChild(clone);
    var pxPerSec = +(m.getAttribute("data-speed") || 60);
    var dur = track.scrollWidth / pxPerSec;
    m.style.setProperty("--speed", dur + "s");
  });

  /* ---------- Slider automático horizontal infinito (hero) ---------- */
  $$("[data-autoslider]").forEach(function (root) {
    var track = $(".autoslider__track", root);
    var items = $$(".autoslider__item", track);
    if (!items.length) return;
    if (reduceMotion) { root.classList.add("autoslider--static"); return; }

    var GAP = 19, W, span, offset = 0, vel = 0, speed = 0.5, hover = false, dragging = false;
    var lastX = 0, lastT = 0, moved = 0, raf = null, visible = true, pid = null;

    function measure() { W = items[0].offsetWidth; span = items.length * (W + GAP); }
    measure();
    window.addEventListener("resize", measure);

    function frame() {
      if (!dragging) { vel += ((hover ? 0 : speed) - vel) * 0.06; offset += vel; }
      for (var i = 0; i < items.length; i++) {
        var x = ((i * (W + GAP) - offset) % span + span) % span; // 0..span
        if (x > span - W - GAP) x -= span;                        // reciclar por la izquierda
        items[i].style.transform = "translate3d(" + x.toFixed(2) + "px,0,0)";
      }
      raf = visible ? requestAnimationFrame(frame) : null;
    }
    raf = requestAnimationFrame(frame);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(frame);
      }).observe(root);
    }
    document.addEventListener("visibilitychange", function () { visible = !document.hidden; if (visible && !raf) raf = requestAnimationFrame(frame); });

    root.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") hover = true; });
    root.addEventListener("pointerleave", function () { hover = false; });
    root.addEventListener("pointerdown", function (e) {
      // La captura del puntero se activa solo al arrastrar: si se activa al pulsar, el clic
      // acaba en el contenedor y el enlace del proyecto no se abre.
      dragging = true; moved = 0; lastX = e.clientX; lastT = performance.now(); pid = e.pointerId;
    });
    root.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX, now = performance.now();
      offset -= dx; moved += Math.abs(dx);
      if (moved > 6 && !root.classList.contains("is-dragging")) {
        root.classList.add("is-dragging");
        try { root.setPointerCapture(pid); } catch (err) {}
      }
      vel = -dx / Math.max(1, (now - lastT) / 16.7);
      lastX = e.clientX; lastT = now;
    });
    function end() { dragging = false; root.classList.remove("is-dragging"); }
    root.addEventListener("pointerup", end);
    root.addEventListener("pointercancel", end);
    root.addEventListener("click", function (e) { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    root.addEventListener("wheel", function (e) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); offset += e.deltaX; }
    }, { passive: false });
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { offset += W + GAP; e.preventDefault(); }
      if (e.key === "ArrowLeft") { offset -= W + GAP; e.preventDefault(); }
    });
  });

  /* ---------- Arrastrar para desplazar (carruseles nativos) ---------- */
  function dragScroll(el) {
    var down = false, sx = 0, sl = 0, moved = 0;
    el.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse") return;
      down = true; moved = 0; sx = e.clientX; sl = el.scrollLeft;
    });
    window.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - sx; moved = Math.abs(dx);
      if (moved > 4) el.classList.add("is-dragging");
      el.scrollLeft = sl - dx;
    });
    window.addEventListener("pointerup", function () {
      if (!down) return; down = false;
      setTimeout(function () { el.classList.remove("is-dragging"); }, 0);
    });
    el.addEventListener("click", function (e) { if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
    el.addEventListener("dragstart", function (e) { e.preventDefault(); });
  }
  $$("[data-drag-scroll]").forEach(dragScroll);

  $$("[data-carousel]").forEach(function (wrap) {
    var list = $(wrap.getAttribute("data-carousel"));
    if (!list) return;
    var prev = $("[data-prev]", wrap), next = $("[data-next]", wrap);
    function step() { var c = list.firstElementChild; return c ? c.offsetWidth + 12 : 300; }
    function update() {
      prev.disabled = list.scrollLeft < 4;
      next.disabled = list.scrollLeft + list.clientWidth >= list.scrollWidth - 4;
    }
    prev.addEventListener("click", function () { list.scrollBy({ left: -step() * 2, behavior: "smooth" }); });
    next.addEventListener("click", function () { list.scrollBy({ left: step() * 2, behavior: "smooth" }); });
    list.addEventListener("scroll", function () { requestAnimationFrame(update); }, { passive: true });
    window.addEventListener("resize", update);
    update();
  });

  /* ---------- Plugin de Instagram (feed) ---------- */
  var feed = $("[data-ig-feed]");
  if (feed && CFG.instagramFeedUrl) {
    fetch(CFG.instagramFeedUrl).then(function (r) { return r.json(); }).then(function (data) {
      var posts = Array.isArray(data) ? data : (data.posts || data.data || []);
      posts = posts.filter(function (p) { return (p.mediaType || p.media_type || "IMAGE") !== "VIDEO" || p.thumbnailUrl || p.thumbnail_url; })
        .slice(0, CFG.instagramPosts || 8);
      if (!posts.length) return;
      feed.innerHTML = posts.map(function (p) {
        var src = (p.sizes && p.sizes.medium && p.sizes.medium.mediaUrl) || p.thumbnailUrl || p.thumbnail_url || p.mediaUrl || p.media_url;
        var alt = (p.prunedCaption || p.caption || "Publicación de Instagram de Monochrome").replace(/"/g, "&quot;").slice(0, 120);
        return '<a class="ig-post" href="' + (p.permalink || CFG.social.instagram) + '" target="_blank" rel="noopener"><img src="' + src + '" alt="' + alt + '" loading="lazy" width="450" height="450"></a>';
      }).join("");
    }).catch(function () { /* se mantienen las imágenes estáticas */ });
  }

  /* ---------- Pestañas (Servicios) ---------- */
  $$("[data-tabs]").forEach(function (tabsRoot) {
    var local = tabsRoot.hasAttribute("data-tabs-local");
    var tabs = $$('[role="tab"]', tabsRoot).filter(function (t) { return t.closest("[data-tabs]") === tabsRoot && !t.closest("[data-timeline]"); });
    function activate(tab, push) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on);
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
      var ht = tab.hasAttribute("data-hero-title") && $("[data-hero-title]:not([role=tab])"), hs = $("[data-hero-sub]:not([role=tab])"), hp = $("[data-hero-primary]");
      if (ht && tab.getAttribute("data-hero-title")) ht.textContent = tab.getAttribute("data-hero-title");
      if (hs && tab.getAttribute("data-hero-sub")) hs.textContent = tab.getAttribute("data-hero-sub");
      if (hp && tab.hasAttribute("data-hero-title")) {
        var isId = tab.getAttribute("data-hash") === "identidad";
        hp.textContent = isId ? "Ver packs y precios" : "Ver qué incluye";
        hp.setAttribute("href", isId ? "#packs" : "#" + tab.getAttribute("aria-controls"));
      }
      if (push && !local) history.replaceState(null, "", "#" + tab.getAttribute("data-hash"));
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () {
        activate(t, true);
        if (local) { t.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" }); return; }
        var top = tabsRoot.getBoundingClientRect().top;
        if (top < 0 || top > 200) window.scrollTo({ top: window.scrollY + tabsRoot.parentElement.getBoundingClientRect().top - 80, behavior: "smooth" });
      });
      t.addEventListener("keydown", function (e) {
        var k = e.key, j = null;
        if (k === "ArrowRight") j = (i + 1) % tabs.length;
        if (k === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
        if (k === "Home") j = 0;
        if (k === "End") j = tabs.length - 1;
        if (j !== null) { e.preventDefault(); tabs[j].focus(); activate(tabs[j], true); }
      });
    });
    if (local) return;
    var hash = location.hash.replace("#", "");
    var initial = tabs.filter(function (t) { return t.getAttribute("data-hash") === hash; })[0];
    if (initial) activate(initial, false);
  });


  /* ---------- Sobre mí: fechas, contadores, fotos y timeline ---------- */
  function monthsBetween(a, b) {
    var pa = a.split("-"), pb = b === "now" ? [new Date().getFullYear(), new Date().getMonth() + 1] : b.split("-");
    return (+pb[0] - +pa[0]) * 12 + (+pb[1] - +pa[1]);
  }
  function durationLabel(m) {
    m = Math.max(1, m);
    var y = Math.floor(m / 12), r = m % 12, out = [];
    if (y) out.push(y + (y === 1 ? " año" : " años"));
    if (r) out.push(r + (r === 1 ? " mes" : " meses"));
    return out.join(" y ");
  }
  $$("[data-duration]").forEach(function (n) {
    var p = n.getAttribute("data-duration").split("|");
    n.textContent = durationLabel(monthsBetween(p[0], p[1]) + (p[1] === "now" ? 0 : 1));
  });
  $$("[data-years-since]").forEach(function (n) {
    n.textContent = Math.floor(monthsBetween(n.getAttribute("data-years-since"), "now") / 12);
  });

  var counters = $$("[data-count]");
  function runCount(n) {
    var end = parseInt(n.textContent, 10) || 0;
    if (reduceMotion || end < 2) return;
    var t0 = null, dur = 1400;
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      n.textContent = Math.round(end * e);
      if (k < 1) requestAnimationFrame(step); else n.textContent = end;
    }
    n.textContent = "0";
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window && counters.length) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (n) { cio.observe(n); });
  }

  $$("[data-photo-stack]").forEach(function (st) {
    function swap() { st.classList.toggle("is-swapped"); }
    $(".photo-stack__btn", st).addEventListener("click", swap);
    $$(".photo-stack__item", st).forEach(function (f) { f.addEventListener("click", swap); });
  });

  $$("[data-timeline]").forEach(function (tl) {
    var track = $(".tl-track", tl);
    var segs = $$(".tl-seg", tl);
    var startStr = segs[0].getAttribute("data-start");
    var total = monthsBetween(startStr, "now");
    // posiciones proporcionales a la duración real de cada etapa
    segs.forEach(function (sg) {
      var l = monthsBetween(startStr, sg.getAttribute("data-start")) / total * 100;
      var w = monthsBetween(sg.getAttribute("data-start"), sg.getAttribute("data-end")) / total * 100;
      sg.style.setProperty("--l", l + "%");
      sg.style.setProperty("--w", "calc(" + Math.min(w, 100 - l) + "% - 8px)");
    });
    var ticks = $(".tl-ticks", tl), y0 = +startStr.slice(0, 4), yNow = new Date().getFullYear();
    if (ticks) {
      for (var y = y0 + 1; y <= yNow; y++) {
        var pos = monthsBetween(startStr, y + "-01") / total * 100;
        if (pos > 2 && pos < 97) { var sp = document.createElement("span"); sp.style.left = pos + "%"; sp.textContent = y; ticks.appendChild(sp); }
      }
    }
    track.classList.add("is-proportional");

    var current = segs.findIndex(function (sg) { return sg.getAttribute("aria-selected") === "true"; });
    function select(i, focus) {
      var dir = i < current ? "back" : "fwd";
      current = (i + segs.length) % segs.length;
      segs.forEach(function (sg, j) {
        var on = j === current;
        sg.setAttribute("aria-selected", on); sg.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(sg.getAttribute("aria-controls"));
        panel.hidden = !on; if (on) panel.setAttribute("data-dir", dir);
      });
      if (focus) segs[current].focus();
      if (getComputedStyle(track).display === "flex") segs[current].scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }
    segs.forEach(function (sg, i) {
      sg.addEventListener("click", function () { select(i); });
      sg.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") { e.preventDefault(); select(current + 1, true); }
        if (e.key === "ArrowLeft") { e.preventDefault(); select(current - 1, true); }
      });
    });
    $("[data-tl-prev]", tl).addEventListener("click", function () { select(current - 1); });
    $("[data-tl-next]", tl).addEventListener("click", function () { select(current + 1); });
  });

  /* ---------- Modal del formulario (Servicios: "Quiero este pack") ---------- */
  var modal = $("#lead-modal");
  if (modal && typeof modal.showModal === "function") {
    var lastFocus = null;
    $$("[data-open-lead]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        lastFocus = btn;
        var host = $("[data-lead-form]", modal);
        if (window.MonoLeadForm) window.MonoLeadForm.init(modal);
        var inst = host && host._leadForm;
        var pack = btn.getAttribute("data-pack"), service = btn.getAttribute("data-service");
        if (inst) {
          if (pack) { inst.setPack(pack); inst.check("tipo", "Identidad visual"); }
          if (service) inst.applyPreset(null, service);
          inst.save();
        }
        modal.showModal();
        document.body.classList.add("modal-open");
        var t = $(".lf-step.is-active .lf-step__title", modal);
        if (t) t.focus();
      });
    });
    function close() { modal.close(); }
    $$("[data-close-modal]", modal).forEach(function (b) { b.addEventListener("click", close); });
    modal.addEventListener("click", function (e) { if (e.target === modal) close(); });
    modal.addEventListener("close", function () { document.body.classList.remove("modal-open"); if (lastFocus) lastFocus.focus(); });
  }


  /* ---------- Páginas de proyecto: ampliar imágenes ---------- */
  var zoomBtns = $$("[data-zoom]");
  if (zoomBtns.length && typeof HTMLDialogElement !== "undefined") {
    var zd = document.createElement("dialog"); zd.className = "zoom"; zd.setAttribute("aria-label", "Imagen ampliada");
    zd.innerHTML = '<button class="zoom__close" type="button" aria-label="Cerrar"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button><img alt="">';
    document.body.appendChild(zd);
    var zimg = $("img", zd), zi = 0, zopener = null;
    function zshow(i) { zi = (i + zoomBtns.length) % zoomBtns.length; var im = $("img", zoomBtns[zi]); zimg.src = im.currentSrc || im.src; zimg.alt = im.alt; zimg.width = im.naturalWidth || im.width; zimg.height = im.naturalHeight || im.height; zd.scrollTop = 0; }
    zoomBtns.forEach(function (b, i) { b.addEventListener("click", function () { zopener = b; zshow(i); zd.showModal(); document.body.classList.add("modal-open"); }); });
    zd.addEventListener("click", function () { zd.close(); });
    zd.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") zshow(zi + 1); if (e.key === "ArrowLeft") zshow(zi - 1); });
    zd.addEventListener("close", function () { document.body.classList.remove("modal-open"); if (zopener) zopener.focus(); });
  }

  /* ---------- Portfolio: filtros + lightbox ---------- */
  var grid = $("[data-work-grid]");
  if (grid) {
    var items = $$(".work-item", document);
    var chips = $$("[data-filter]");
    var count = $("[data-work-count]");
    var empty = $("[data-work-empty]");
    function applyFilter(cat, push) {
      var shown = 0;
      chips.forEach(function (c) { c.setAttribute("aria-pressed", c.getAttribute("data-filter") === cat); });
      items.forEach(function (it) {
        var cats = (it.getAttribute("data-cat") || "").split(" ");
        var on = cat === "todos" || cats.indexOf(cat) > -1;
        if (on && it.hidden) { it.classList.remove("is-entering"); void it.offsetWidth; it.classList.add("is-entering"); }
        it.hidden = !on;
        if (on) shown++;
      });
      // Maquetación adaptativa: filas completas según cuántas tarjetas quedan visibles
      var vis = $$(".work-grid > .work-item", grid).filter(function (it) { return !it.hidden; });
      vis.forEach(function (it) { it.classList.remove("is-wide", "is-full"); });
      var n = vis.length;
      if (n % 3 === 2) { vis[0].classList.add("is-wide"); vis[1].classList.add("is-wide"); }
      else if (n % 3 === 1) { vis[0].classList.add("is-full"); }
      if (count) count.textContent = shown + (shown === 1 ? " proyecto" : " proyectos");
      if (empty) empty.classList.toggle("is-visible", shown === 0);
      if (push) {
        var url = new URL(location.href);
        if (cat === "todos") url.searchParams.delete("cat"); else url.searchParams.set("cat", cat);
        history.replaceState(null, "", url);
      }
    }
    chips.forEach(function (c) {
      var f = c.getAttribute("data-filter");
      var n = items.filter(function (it) { return f === "todos" || (it.getAttribute("data-cat") || "").split(" ").indexOf(f) > -1; }).length;
      var sp = document.createElement("span"); sp.className = "chip__count"; sp.textContent = n; sp.setAttribute("aria-label", n + " proyectos");
      c.appendChild(sp);
    });
    chips.forEach(function (c) { c.addEventListener("click", function () { applyFilter(c.getAttribute("data-filter"), true); }); });
    var startCat = new URLSearchParams(location.search).get("cat");
    applyFilter(startCat && chips.some(function (c) { return c.getAttribute("data-filter") === startCat; }) ? startCat : "todos", false);

    var lb = $("#lightbox");
    if (lb && typeof lb.showModal === "function") {
      var visible = function () { return $$(".work-card[data-lightbox]").filter(function (c) { return !c.closest(".work-item").hidden; }); };
      var currentCard = null, opener = null;
      var fill = function (card) {
        currentCard = card;
        var list = visible(), cnt = $("[data-lb-count]", lb);
        if (cnt) cnt.textContent = (list.indexOf(card) + 1) + " / " + list.length;
        var img = $("img", card);
        $(".lightbox__media img", lb).src = img.currentSrc || img.src;
        $(".lightbox__media img", lb).alt = img.alt;
        $("[data-lb-title]", lb).textContent = card.getAttribute("data-title");
        $("[data-lb-cat]", lb).textContent = card.getAttribute("data-cat-label");
        $("[data-lb-desc]", lb).textContent = card.getAttribute("data-desc") || "";
        var svc = card.getAttribute("data-service");
        $("[data-lb-cta]", lb).href = "/contacto" + (svc ? "?servicio=" + svc : "");
      };
      $$(".work-card[data-lightbox]").forEach(function (card) {
        card.addEventListener("click", function () { opener = card; fill(card); lb.showModal(); document.body.classList.add("modal-open"); });
      });
      var nav = function (d) { var list = visible(); var i = list.indexOf(currentCard); if (i > -1) fill(list[(i + d + list.length) % list.length]); };
      $("[data-lb-prev]", lb).addEventListener("click", function () { nav(-1); });
      $("[data-lb-next]", lb).addEventListener("click", function () { nav(1); });
      $("[data-lb-close]", lb).addEventListener("click", function () { lb.close(); });
      lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
      var tx = null;
      lb.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
      lb.addEventListener("touchend", function (e) {
        if (tx === null) return;
        var dx = e.changedTouches[0].clientX - tx; tx = null;
        if (Math.abs(dx) > 50) nav(dx < 0 ? 1 : -1);
      });
      lb.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") nav(1); if (e.key === "ArrowLeft") nav(-1); });
      lb.addEventListener("close", function () { document.body.classList.remove("modal-open"); if (opener) opener.focus(); });
    }
  }
})();

/* Inicio siempre arriba: al cambiar de página y al pulsar el logo en la home */
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (!location.hash) window.scrollTo(0, 0);
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest("a.brand");
    if (!a || ev.defaultPrevented || ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
    if (a.href.split("#")[0] !== location.href.split("#")[0]) return;
    ev.preventDefault();
    history.replaceState(null, "", a.getAttribute("href"));
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });
})();
