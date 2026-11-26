/* ==========================================================================
   Monochrome — Formulario de captación por pasos
   Uso: <div data-lead-form></div>  (opcional: data-pack="estandar")
   Basado en el Google Form "¡Cuéntame tu idea!" reorganizado en 5 pasos.
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.MONO_CONFIG || {};
  var STORAGE_KEY = "mono-lead-draft-v1";

  var PACKS = {
    basico:   { name: "Pack Básico",   price: "499,99 €" },
    estandar: { name: "Pack Estándar", price: "799,99 €" },
    premium:  { name: "Pack Premium",  price: "1.000 €" }
  };

  var STEPS = [
    {
      id: "proyecto", nav: "Proyecto",
      title: "¿Qué tipo de proyecto necesitas?",
      hint: "Puedes elegir varios.",
      fields: [
        { name: "tipo", type: "checkbox", required: true, label: "Tipo de proyecto", hideLegend: true,
          error: "Elige al menos una opción.",
          options: [
            { value: "Identidad visual", emoji: "✏️", note: "Logo, colores, tipografía" },
            { value: "Material publicitario", emoji: "📣", note: "Flyers, pósters, etc." },
            { value: "Redes sociales", emoji: "📱", note: "Plantillas, posts, stories" },
            { value: "Diseño web / UI", emoji: "💻", note: "Webs, apps, interfaces" },
            { value: "Packaging", emoji: "📦", note: "Etiquetas, cajas, envases" },
            { value: "Ilustración", emoji: "🎨", note: "Portadas, encargos, 3D" },
            { value: "Otro", emoji: "✨", note: "Cuéntamelo", other: true }
          ] }
      ]
    },
    {
      id: "idea", nav: "Tu idea",
      title: "Cuéntame tu idea",
      hint: "No hace falta que esté todo claro: para eso está la asesoría gratuita.",
      fields: [
        { name: "descripcion", type: "textarea", required: true, minLength: 15, label: "Descripción del proyecto",
          placeholder: "¿Qué es tu negocio o proyecto y qué te gustaría conseguir con el diseño?",
          error: "Cuéntame un poco más (mínimo 15 caracteres)." },
        { name: "objetivo", type: "text", required: true, label: "¿Cuál es el objetivo de este proyecto?",
          placeholder: "Ej.: lanzar mi marca, renovar mi imagen, vender más…", error: "Indica el objetivo principal." },
        { name: "publico", type: "text", label: "¿Cuál es tu público objetivo?",
          placeholder: "Ej.: jóvenes de 18 a 30 interesados en la música" }
      ]
    },
    {
      id: "detalles", nav: "Detalles",
      title: "Presupuesto y plazos",
      hint: "Me ayuda a proponerte la solución que mejor encaja.",
      fields: [
        { name: "presupuesto", type: "radio", required: true, compact: true, label: "¿Tienes un presupuesto estimado?",
          error: "Elige una opción (puedes marcar «Aún no lo sé»).",
          options: [
            { value: "Menos de 500 €" }, { value: "500 – 800 €" }, { value: "800 – 1.200 €" },
            { value: "Más de 1.200 €" }, { value: "Aún no lo sé" }
          ] },
        { name: "plazo", type: "radio", required: true, compact: true, label: "¿Cuándo necesitas que esté listo?",
          error: "Elige un plazo aproximado.",
          options: [
            { value: "Lo antes posible" }, { value: "En 2–4 semanas" }, { value: "En 1–2 meses" }, { value: "Sin prisa" }
          ] },
        { name: "material", type: "textarea", rows: 3, label: "¿Tienes algún material o activo que podamos usar?",
          placeholder: "Ejemplo: fotos, gráficos anteriores, logo actual, referencias que te gusten…" }
      ]
    },
    {
      id: "proceso", nav: "Proceso",
      title: "¿Cómo prefieres trabajar?",
      fields: [
        { name: "comunicacion", type: "radio", required: true, label: "Comunicación durante el proceso",
          error: "Elige cómo prefieres que te mantenga al día.",
          options: [
            { value: "Actualizaciones semanales", emoji: "🗓️" },
            { value: "Solo en etapas clave", emoji: "🎯" },
            { value: "Comunicación constante", emoji: "💬" },
            { value: "Otro", emoji: "✨", other: true }
          ] },
        { name: "origen", type: "radio", compact: true, label: "¿Cómo te enteraste de mis servicios?",
          options: [
            { value: "Redes sociales" }, { value: "Recomendación" }, { value: "Búsqueda en internet" }, { value: "Otro" }
          ] }
      ]
    },
    {
      id: "contacto", nav: "Contacto",
      title: "¡Último paso! ¿Cómo te contacto?",
      hint: "Te respondo en menos de 48 h laborables.",
      fields: [
        { row: [
          { name: "nombre", type: "text", required: true, label: "¿Cómo te llamo?", autocomplete: "name", placeholder: "Nombre", error: "Dime tu nombre." },
          { name: "email", type: "email", required: true, label: "¿Cuál es tu mail?", autocomplete: "email", placeholder: "tu@email.com", error: "Introduce un email válido." }
        ] },
        { name: "preferencia", type: "radio", required: true, compact: true, label: "¿Cómo prefieres que te contacte?",
          error: "Elige un canal de contacto.",
          options: [ { value: "Mail", emoji: "✉️" }, { value: "Llamada", emoji: "📞" }, { value: "WhatsApp", emoji: "💬" } ] },
        { name: "telefono", type: "tel", label: "¿Y tu teléfono?", autocomplete: "tel", placeholder: "+34 600 000 000",
          optionalLabel: "(necesario para llamada o WhatsApp)",
          requiredIf: function (d) { return d.preferencia === "Llamada" || d.preferencia === "WhatsApp"; },
          pattern: /^[+()\d\s.-]{9,}$/, error: "Introduce un teléfono válido para poder llamarte o escribirte." },
        { name: "comentarios", type: "textarea", rows: 3, label: "Comentarios adicionales", placeholder: "Cualquier cosa que quieras añadir" },
        { type: "summary" },
        { type: "consent" }
      ]
    }
  ];

  /* ---------------- utilidades ---------------- */
  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (attrs[k] === false || attrs[k] == null) return;
      if (k === "class") n.className = attrs[k]; else n.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    });
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function store(get, val) {
    try {
      if (get) return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (val === null) localStorage.removeItem(STORAGE_KEY); else localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
    } catch (e) { return null; }
  }
  var ICON_ARROW = '<svg class="arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10m0 0L9 4m4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_BACK = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M13 8H3m0 0 4-4M3 8l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var instance = 0;

  function LeadForm(root) {
    this.root = root;
    this.uid = "lf" + (++instance);
    this.current = 0;
    this.pack = null;
    this.render();
    this.restore();
    this.applyPreset(root.getAttribute("data-pack"), root.getAttribute("data-service"));
    this.bind();
    this.show(0, true);
  }

  LeadForm.prototype.fieldId = function (name, i) { return this.uid + "-" + name + (i != null ? "-" + i : ""); };

  LeadForm.prototype.render = function () {
    var self = this;
    var form = el("form", { class: "lead-form lf-card", novalidate: true, "aria-label": "Formulario de contacto por pasos" });

    form.appendChild(el("div", { class: "lf-pack-badge", "data-pack-badge": true }));

    var progress = el("div", { class: "lf-progress" });
    progress.innerHTML =
      '<div class="lf-progress__meta"><span>Paso <strong data-step-num>1</strong> de ' + STEPS.length + ' · <span data-step-name></span></span><span data-step-time>~2 min</span></div>' +
      '<div class="lf-progress__bar" role="progressbar" aria-label="Progreso del formulario" aria-valuemin="1" aria-valuemax="' + STEPS.length + '" aria-valuenow="1"><span></span></div>';
    form.appendChild(progress);
    form.appendChild(el("p", { class: "visually-hidden", "aria-live": "polite", "data-live": true }));

    STEPS.forEach(function (step, si) {
      var sec = el("section", { class: "lf-step", "data-step": si, "aria-labelledby": self.fieldId("t" + si) });
      sec.appendChild(el("h3", { class: "lf-step__title", id: self.fieldId("t" + si), tabindex: "-1" }, esc(step.title)));
      if (step.hint) sec.appendChild(el("p", { class: "lf-step__hint" }, esc(step.hint)));
      step.fields.forEach(function (f) {
        if (f.row) {
          var row = el("div", { class: "lf-row" });
          f.row.forEach(function (rf) { row.appendChild(self.renderField(rf)); });
          sec.appendChild(row);
        } else sec.appendChild(self.renderField(f));
      });
      form.appendChild(sec);
    });

    // honeypot anti-spam
    form.appendChild(el("div", { class: "lf-hp", "aria-hidden": "true" },
      '<label>No rellenes este campo <input type="text" name="_gotcha" tabindex="-1" autocomplete="off"></label>'));

    var actions = el("div", { class: "lf-actions" });
    actions.innerHTML =
      '<button type="button" class="lf-back" data-back hidden>' + ICON_BACK + ' Atrás</button>' +
      '<span class="lf-kbd" data-kbd>Pulsa <b>Enter ↵</b></span>' +
      '<button type="submit" class="btn btn--light btn--lg lf-next" data-next><span data-next-label>Siguiente</span> ' + ICON_ARROW + '</button>';
    form.appendChild(actions);
    form.appendChild(el("div", { class: "lf-alert", role: "alert", "data-alert": true }));

    var success = el("div", { class: "lf-success", "data-success": true, role: "status" });
    success.innerHTML =
      '<span class="lf-success__icon">' + ICON_CHECK + '</span>' +
      '<h3 tabindex="-1" data-success-title>¡Gracias, <span data-success-name></span>! Ya tengo tu idea.</h3>' +
      '<p data-success-text>He recibido tu solicitud. Esto es lo que pasa ahora:</p>' +
      '<ol><li>Reviso tu propuesta en menos de 48 h laborables.</li><li>Te contacto por el canal que has elegido.</li><li>Fijamos una llamada de asesoría gratuita.</li></ol>' +
      '<a class="btn btn--outline" href="/portfolio">Mientras tanto, mira el portfolio ' + ICON_ARROW + '</a>';

    this.root.innerHTML = "";
    this.root.appendChild(form);
    form.appendChild(success);
    this.form = form;
    this.steps = [].slice.call(form.querySelectorAll(".lf-step"));
  };

  LeadForm.prototype.renderField = function (f) {
    var self = this, wrap;
    if (f.type === "summary") {
      wrap = el("dl", { class: "lf-summary", "data-summary": true });
      return wrap;
    }
    if (f.type === "consent") {
      wrap = el("div", { class: "lf-field", "data-field": "consent" });
      var id = self.fieldId("consent");
      wrap.innerHTML =
        '<label class="lf-consent" for="' + id + '"><input type="checkbox" id="' + id + '" name="consent" value="Sí" required aria-describedby="' + id + '-err"> ' +
        '<span>He leído y acepto la <a href="/legal#privacidad" target="_blank" rel="noopener">política de privacidad</a>. Usaré tus datos solo para responder a tu solicitud.</span></label>' +
        '<p class="lf-error" id="' + id + '-err">Necesito tu consentimiento para poder responderte.</p>';
      return wrap;
    }

    var errId = self.fieldId(f.name) + "-err";
    var optLbl = f.required ? "" : ' <span class="opt">' + (f.optionalLabel || "(opcional)") + "</span>";

    if (f.type === "checkbox" || f.type === "radio") {
      wrap = el("fieldset", { class: "lf-field", "data-field": f.name, "aria-describedby": errId });
      wrap.appendChild(el("legend", { class: f.hideLegend ? "visually-hidden" : null }, esc(f.label) + optLbl));
      var grid = el("div", { class: "lf-options" + (f.compact ? " lf-options--compact" : "") });
      f.options.forEach(function (o, i) {
        var id = self.fieldId(f.name, i);
        var d = el("div", { class: "lf-option" });
        d.innerHTML =
          '<input type="' + f.type + '" id="' + id + '" name="' + f.name + '" value="' + esc(o.value) + '"' + (o.other ? ' data-other="' + f.name + '"' : "") + '>' +
          '<label for="' + id + '"><span class="lf-check" aria-hidden="true"></span>' +
          (o.emoji ? '<span class="lf-emoji" aria-hidden="true">' + o.emoji + "</span>" : "") +
          "<span>" + esc(o.value) + (o.note ? "<small>" + esc(o.note) + "</small>" : "") + "</span></label>";
        grid.appendChild(d);
      });
      wrap.appendChild(grid);
      if (f.options.some(function (o) { return o.other; })) {
        var oid = self.fieldId(f.name + "_otro");
        var other = el("div", { class: "lf-other", "data-other-box": f.name });
        other.innerHTML = '<label class="visually-hidden" for="' + oid + '">Especifica</label><input class="lf-input" id="' + oid + '" name="' + f.name + '_otro" type="text" placeholder="Especifica…">';
        wrap.appendChild(other);
      }
    } else {
      wrap = el("div", { class: "lf-field", "data-field": f.name });
      var id2 = self.fieldId(f.name);
      wrap.appendChild(el("label", { class: "lf-label", for: id2 }, esc(f.label) + optLbl));
      var input = f.type === "textarea"
        ? el("textarea", { class: "lf-input", rows: f.rows || 5 })
        : el("input", { class: "lf-input", type: f.type, inputmode: f.type === "tel" ? "tel" : null });
      input.id = id2; input.name = f.name;
      if (f.placeholder) input.placeholder = f.placeholder;
      if (f.autocomplete) input.autocomplete = f.autocomplete;
      if (f.required) input.setAttribute("aria-required", "true");
      input.setAttribute("aria-describedby", errId);
      wrap.appendChild(input);
    }
    wrap.appendChild(el("p", { class: "lf-error", id: errId }, esc(f.error || "Este campo es obligatorio.")));
    return wrap;
  };

  /* ---------------- datos ---------------- */
  LeadForm.prototype.data = function () {
    var fd = new FormData(this.form), out = {};
    fd.forEach(function (v, k) {
      if (out[k] !== undefined) out[k] = [].concat(out[k], v); else out[k] = v;
    });
    if (out.tipo && !Array.isArray(out.tipo)) out.tipo = [out.tipo];
    if (this.pack) out.pack = PACKS[this.pack].name + " (" + PACKS[this.pack].price + ")";
    return out;
  };

  LeadForm.prototype.save = function () {
    if (this.done) return;
    var d = this.data(); delete d._gotcha; delete d.consent;
    d._step = this.current; d._pack = this.pack;
    store(false, d);
  };

  LeadForm.prototype.restore = function () {
    var d = store(true);
    if (!d) return;
    var form = this.form;
    Object.keys(d).forEach(function (k) {
      if (k.charAt(0) === "_") return;
      var vals = [].concat(d[k]);
      [].forEach.call(form.querySelectorAll('[name="' + k + '"]'), function (inp) {
        if (inp.type === "checkbox" || inp.type === "radio") inp.checked = vals.indexOf(inp.value) > -1;
        else inp.value = vals[0];
      });
    });
    if (d._pack && PACKS[d._pack]) this.setPack(d._pack);
    this.syncOthers();
    this.restoredStep = Math.min(d._step || 0, STEPS.length - 1);
  };

  LeadForm.prototype.applyPreset = function (pack, service) {
    var params = new URLSearchParams(location.search);
    pack = pack || params.get("pack");
    service = service || params.get("servicio");
    if (pack && PACKS[pack]) { this.setPack(pack); this.check("tipo", "Identidad visual"); }
    var map = { identidad: "Identidad visual", packaging: "Packaging", ilustracion: "Ilustración", ui: "Diseño web / UI", "3d": "Ilustración", web: "Diseño web / UI", redes: "Redes sociales", publicidad: "Material publicitario" };
    if (service && map[service]) this.check("tipo", map[service]);
  };

  LeadForm.prototype.check = function (name, value) {
    var inp = this.form.querySelector('[name="' + name + '"][value="' + value + '"]');
    if (inp) inp.checked = true;
  };

  LeadForm.prototype.setPack = function (pack) {
    var badge = this.form.querySelector("[data-pack-badge]");
    this.pack = pack || null;
    if (!pack) { badge.classList.remove("is-visible"); badge.innerHTML = ""; return; }
    badge.innerHTML = '<span aria-hidden="true">📦</span><span>Has elegido el <strong>' + PACKS[pack].name + "</strong> · " + PACKS[pack].price + '</span><button type="button" data-clear-pack>Quitar</button>';
    badge.classList.add("is-visible");
  };

  LeadForm.prototype.syncOthers = function () {
    var form = this.form;
    [].forEach.call(form.querySelectorAll("[data-other-box]"), function (box) {
      var name = box.getAttribute("data-other-box");
      var trigger = form.querySelector('[data-other="' + name + '"]');
      box.classList.toggle("is-visible", !!(trigger && trigger.checked));
    });
  };

  /* ---------------- validación ---------------- */
  LeadForm.prototype.validateStep = function (si) {
    var self = this, d = this.data(), ok = true, firstBad = null;
    var fields = [];
    STEPS[si].fields.forEach(function (f) { if (f.row) fields = fields.concat(f.row); else fields.push(f); });
    fields.forEach(function (f) {
      var name = f.type === "consent" ? "consent" : f.name;
      if (!name || f.type === "summary") return;
      var wrap = self.form.querySelector('[data-field="' + name + '"]');
      var err = wrap && wrap.querySelector(".lf-error");
      var v = d[name], bad = false;
      var required = f.type === "consent" || f.required || (f.requiredIf && f.requiredIf(d));
      var empty = v == null || (Array.isArray(v) ? v.length === 0 : String(v).trim() === "");
      if (required && empty) bad = true;
      if (!empty && f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim())) bad = true;
      if (!empty && f.minLength && String(v).trim().length < f.minLength) bad = true;
      if (!empty && f.pattern && !f.pattern.test(String(v).trim())) bad = true;
      var input = wrap && wrap.querySelector(".lf-input, input");
      if (input && input.classList.contains("lf-input")) input.setAttribute("aria-invalid", bad ? "true" : "false");
      if (err) err.classList.toggle("is-visible", bad);
      if (bad) { ok = false; if (!firstBad) firstBad = wrap.querySelector("input, textarea"); }
    });
    if (firstBad) firstBad.focus({ preventScroll: false });
    return ok;
  };

  /* ---------------- navegación entre pasos ---------------- */
  LeadForm.prototype.show = function (i, initial) {
    if (initial && this.restoredStep) i = this.restoredStep;
    var dir = i < this.current ? "back" : "fwd";
    this.current = i;
    this.steps.forEach(function (s, si) {
      s.classList.toggle("is-active", si === i);
      s.setAttribute("data-dir", dir);
      s.toggleAttribute("inert", si !== i);
    });
    var last = i === STEPS.length - 1;
    var f = this.form;
    f.querySelector("[data-step-num]").textContent = i + 1;
    f.querySelector("[data-step-name]").textContent = STEPS[i].nav;
    var mins = Math.max(1, Math.round((STEPS.length - i) * 0.4));
    f.querySelector("[data-step-time]").textContent = last ? "Casi listo" : "~" + mins + " min";
    f.querySelector(".lf-progress__bar span").style.width = ((i + 1) / STEPS.length * 100) + "%";
    f.querySelector(".lf-progress__bar").setAttribute("aria-valuenow", i + 1);
    f.querySelector("[data-back]").hidden = i === 0;
    f.querySelector("[data-next-label]").textContent = last ? "Enviar mi idea" : "Siguiente";
    f.querySelector("[data-live]").textContent = "Paso " + (i + 1) + " de " + STEPS.length + ": " + STEPS[i].title;
    if (last) this.renderSummary();
    if (!initial) {
      var title = this.steps[i].querySelector(".lf-step__title");
      title.focus({ preventScroll: true });
      var top = this.form.getBoundingClientRect().top;
      if (top < 80 || top > window.innerHeight * 0.6) {
        var scroller = this.form.closest("dialog") || null;
        if (scroller) scroller.scrollTo({ top: 0, behavior: "smooth" });
        else window.scrollTo({ top: window.scrollY + top - 110, behavior: "smooth" });
      }
    }
  };

  LeadForm.prototype.renderSummary = function () {
    var d = this.data(), box = this.form.querySelector("[data-summary]");
    var rows = [
      ["Proyecto", [].concat(d.tipo || []).map(function (t) { return t === "Otro" && d.tipo_otro ? d.tipo_otro : t; }).join(", ")],
      ["Objetivo", d.objetivo], ["Presupuesto", d.presupuesto], ["Plazo", d.plazo]
    ];
    if (d.pack) rows.unshift(["Pack", d.pack]);
    box.innerHTML = rows.filter(function (r) { return r[1]; }).map(function (r) {
      return "<div><dt>" + r[0] + "</dt><dd>" + esc(r[1]) + "</dd></div>";
    }).join("") + '<button type="button" data-goto="0">Editar respuestas</button>';
  };

  LeadForm.prototype.next = function () {
    if (!this.validateStep(this.current)) return;
    if (this.current < STEPS.length - 1) { this.show(this.current + 1); this.save(); this.track("lead_step", { step: this.current + 1 }); }
    else this.submit();
  };

  /* ---------------- envío ---------------- */
  LeadForm.prototype.payload = function () {
    var d = this.data();
    var labelled = {
      "Pack": d.pack || "—",
      "Tipo de proyecto": [].concat(d.tipo || []).join(", ") + (d.tipo_otro ? " (" + d.tipo_otro + ")" : ""),
      "Descripción": d.descripcion || "",
      "Objetivo": d.objetivo || "",
      "Público objetivo": d.publico || "—",
      "Presupuesto": d.presupuesto || "",
      "Plazo": d.plazo || "",
      "Material disponible": d.material || "—",
      "Comunicación": (d.comunicacion || "") + (d.comunicacion_otro ? " (" + d.comunicacion_otro + ")" : ""),
      "Cómo me conoció": d.origen || "—",
      "Nombre": d.nombre || "",
      "Email": d.email || "",
      "Teléfono": d.telefono || "—",
      "Prefiere contacto por": d.preferencia || "",
      "Comentarios": d.comentarios || "—",
      "Página": location.pathname
    };
    return { raw: d, labelled: labelled };
  };

  LeadForm.prototype.submit = function () {
    var self = this, p = this.payload(), conf = CFG.form || {};
    if (p.raw._gotcha) { this.success(p.raw); return; } // bot
    var btn = this.form.querySelector("[data-next]");
    var alertBox = this.form.querySelector("[data-alert]");
    alertBox.classList.remove("is-visible");
    btn.disabled = true;
    btn.querySelector("[data-next-label]").textContent = "Enviando…";

    var provider = conf.provider || "mailto";
    var req = null;
    if (provider === "web3forms" && conf.web3formsKey) {
      req = fetch("https://api.web3forms.com/submit", {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.assign({ access_key: conf.web3formsKey, subject: conf.subject, from_name: "Web Monochrome", replyto: p.raw.email }, p.labelled))
      });
    } else if ((provider === "formspree" || provider === "custom") && conf.endpoint) {
      req = fetch(conf.endpoint, {
        method: "POST", headers: { "Content-Type": provider === "custom" ? "text/plain;charset=utf-8" : "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.assign({ _subject: conf.subject, _replyto: p.raw.email }, p.labelled))
      });
    }

    if (!req) { this.mailto(p); return; }

    req.then(function (r) {
      if (provider === "custom" && r.type === "opaque") return {};
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json().catch(function () { return {}; });
    }).then(function (j) {
      if (j && j.success === false) throw new Error(j.message || "Error");
      self.success(p.raw);
    }).catch(function () {
      btn.disabled = false;
      btn.querySelector("[data-next-label]").textContent = "Reintentar envío";
      alertBox.innerHTML = 'No se ha podido enviar ahora mismo. Vuelve a intentarlo o <a href="' + self.mailtoHref(p) + '">envíamelo por email</a>.';
      alertBox.classList.add("is-visible");
    });
  };

  LeadForm.prototype.mailtoHref = function (p) {
    var body = Object.keys(p.labelled).map(function (k) { return k + ": " + p.labelled[k]; }).join("\n");
    return "mailto:" + (CFG.email || "") + "?subject=" + encodeURIComponent((CFG.form && CFG.form.subject) || "Nuevo proyecto") + "&body=" + encodeURIComponent(body);
  };

  LeadForm.prototype.mailto = function (p) {
    window.location.href = this.mailtoHref(p);
    this.success(p.raw, true);
  };

  LeadForm.prototype.success = function (d, viaMail) {
    this.done = true;
    clearTimeout(this._t);
    store(false, null);
    var f = this.form;
    this.steps.forEach(function (s) { s.classList.remove("is-active"); });
    [".lf-progress", ".lf-actions", "[data-pack-badge]"].forEach(function (s) { var n = f.querySelector(s); if (n) n.style.display = "none"; });
    var ok = f.querySelector("[data-success]");
    ok.querySelector("[data-success-name]").textContent = (d.nombre || "").split(" ")[0] || "crack";
    if (viaMail) ok.querySelector("[data-success-text]").textContent = "Se ha abierto tu programa de correo con el resumen: solo tienes que darle a enviar. Después:";
    ok.classList.add("is-visible");
    ok.querySelector("[data-success-title]").focus();
    this.track("generate_lead", { pack: d.pack || "", tipo: [].concat(d.tipo || []).join(",") });
    document.dispatchEvent(new CustomEvent("lead:submitted", { detail: d }));
  };

  LeadForm.prototype.track = function (event, params) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({ event: event }, params || {}));
      if (typeof window.gtag === "function") window.gtag("event", event, params || {});
    } catch (e) { /* noop */ }
  };

  /* ---------------- eventos ---------------- */
  LeadForm.prototype.bind = function () {
    var self = this, f = this.form;
    f.addEventListener("submit", function (e) { e.preventDefault(); self.next(); });
    f.querySelector("[data-back]").addEventListener("click", function () { if (self.current > 0) self.show(self.current - 1); });
    f.addEventListener("click", function (e) {
      var go = e.target.closest("[data-goto]");
      if (go) { self.show(+go.getAttribute("data-goto")); return; }
      if (e.target.closest("[data-clear-pack]")) { self.setPack(null); self.save(); }
    });
    f.addEventListener("change", function (e) {
      self.syncOthers();
      var wrap = e.target.closest("[data-field]");
      if (wrap) { var err = wrap.querySelector(".lf-error.is-visible"); if (err) err.classList.remove("is-visible"); }
      // en radios de una sola elección, avanzar el foco a la siguiente pregunta
      self.save();
    });
    f.addEventListener("input", function (e) {
      if (e.target.getAttribute("aria-invalid") === "true") {
        e.target.setAttribute("aria-invalid", "false");
        var err = e.target.closest("[data-field]").querySelector(".lf-error");
        if (err) err.classList.remove("is-visible");
      }
      clearTimeout(self._t); self._t = setTimeout(function () { self.save(); }, 400);
    });
    f.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && e.target.tagName === "TEXTAREA" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); self.next(); }
      if (e.key === "Enter" && e.target.type && (e.target.type === "checkbox" || e.target.type === "radio")) { e.preventDefault(); self.next(); }
    });
  };

  /* ---------------- init ---------------- */
  function init(scope) {
    [].forEach.call((scope || document).querySelectorAll("[data-lead-form]:not([data-ready])"), function (n) {
      n.setAttribute("data-ready", "");
      n._leadForm = new LeadForm(n);
    });
  }
  window.MonoLeadForm = { init: init, PACKS: PACKS };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { init(); });
  else init();
})();
