# Auditoría SEO · monochrome.website

Estado inicial: 26 de noviembre de 2026, sobre el commit `8cd1b23` y siguientes, ya desplegado en producción.

## Contexto usado

| Dato | Valor |
| --- | --- |
| Dominio | https://monochrome.website |
| Negocio | Monochrome, estudio de diseño gráfico de Jose Antonio Pérez Moreno: identidad visual y branding, ilustración, packaging, diseño UI y 3D |
| Mercado | España, en español (`es-ES`); sede en Sevilla y proyectos en remoto en toda España |
| Keywords principales | diseñador gráfico en Sevilla, branding / identidad visual, diseño de logotipo, packaging, ilustración, rebranding |
| Datos para el schema | Jose Antonio Pérez Moreno (Monochrome), Sevilla (España), monochromejoseantonio@gmail.com, Instagram @monochrome_dsg, YouTube @Monochrome.creative. No hay teléfono ni dirección pública, así que no se publican. |

Las keywords y el mercado los he deducido del contenido de la web. Si quieres priorizar otras, se cambian en un solo archivo (`seo.py`, ver más abajo).

## Stack

- **Tipo de web:** estática generada por scripts de Python. Las páginas fuente (`pages/*.html`, con cabecera de metadatos) se ensamblan con `build.py`: head, cabecera, pie y bloques comunes. `gen_proyectos.py` genera el portfolio y el slider, y `casos_sync.py` integra los casos editoriales de `casos/<slug>/`.
- **Renderizado:** SSG. Todo el contenido está en el HTML del servidor. El JavaScript solo añade animaciones, el formulario y el feed de Instagram, y el contenido no depende de él. No hay CMS.
- **Hosting:** Cloudflare Workers con assets estáticos. `worker/index.js` responde a `/api/instagram` y el resto se sirve como archivo estático.
- **Tracking:** no hay GTM, Analytics ni píxeles. Nada que romper.
- **Cookies:** ninguna. Solo `localStorage` para guardar el borrador del formulario, que es técnico y no necesita consentimiento.

## Lighthouse móvil · antes

| Página | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Inicio | 95 | 96 | 100 | 100 | 2,6 s | 0 | 80 ms |
| Portfolio | 97 | 93 | 100 | 100 | 2,3 s | 0 | 30 ms |
| Servicios | 100 | 96 | 100 | 100 | 1,8 s | 0 | 10 ms |
| Contacto | 100 | 95 | 100 | 100 | 1,5 s | 0 | 0 ms |
| Traders (caso) | 97 | 93 | 100 | 100 | 2,1 s | 0 | 30 ms |

La base es buena: HTML estático, imágenes WebP con `width`/`height` y CLS a 0. El 100 de SEO de Lighthouse solo cubre lo básico. Los problemas reales están en las URL canónicas, los datos estructurados y los metadatos.

## Problemas encontrados

Las rutas son las del repositorio publicado. Las líneas son las del HTML generado.

### Crítico

1. **Los canonical apuntan a URLs que redirigen.** Cloudflare sirve las páginas sin `.html` y redirige `/portfolio.html` → `/portfolio` con un **307** (temporal). Pero el canonical, el sitemap y todos los enlaces internos usan `.html`. Google recibe señales contradictorias: el canonical dice una URL y el servidor lo manda temporalmente a otra.
   - `*.html:10` (`<link rel="canonical" href="…/portfolio.html">`), `sitemap.xml`, menú y pie (`build.py`, `NAV` y `FOOTER`).
2. **No hay una única versión canónica del dominio.** `http://` no fuerza `https://` desde el Worker. `/index.html` → `/` va con 307 en lugar de 301. Las redirecciones de proyectos retirados (`_redirects`) apuntan a `portfolio.html`, que a su vez redirige otra vez, así que hay cadena de redirecciones.
3. **Sin datos estructurados en 17 de 18 páginas.** Solo `index.html:22` tiene un `ProfessionalService` mínimo. Faltan `Organization`/`WebSite`, `BreadcrumbList` (los casos tienen migas visibles, pero sin schema), `CreativeWork` en los casos, `Service`/`Offer` con precios en servicios y `FAQPage` en los dos bloques de preguntas.

### Alto

4. **Titles demasiado largos o sin la keyword al principio.** Inicio tiene 77 caracteres (`index.html:6`), Servicios 84 (`servicios.html:6`) y Traders 74 (`proyecto-traders.html:6`). Contacto y Legal no contienen ninguna keyword.
5. **Meta descriptions demasiado largas.** 11 páginas pasan de 160 caracteres (de 195 a 276 en los casos: `proyecto-dayo.html:7` tiene 276) y 404/Legal se quedan muy cortas (31 y 50). Se escriben a mano en cada página; no hay un sistema común ni control de longitud.
6. **Una sola imagen OG para todo el sitio** (`assets/img/og-image.jpg`). Al compartir cualquier caso en WhatsApp o LinkedIn sale la misma imagen genérica. Además faltan `og:image:width`/`height`/`alt`, `twitter:title`/`description`/`image`, y en los casos el `og:type` debería ser `article`.
7. **Google Fonts cargadas desde Google en 10 casos** (`proyecto-*.html`, en `extrahead`). Son 21 familias, con conexión a otro dominio y CSS que bloquea el renderizado. Además envía la IP de cada visitante a Google sin consentimiento, lo que es un problema de RGPD (ya hay sentencias en Europa por esto).
8. **Sin cabeceras de seguridad ni caché de estáticos.** No hay HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` ni CSP. Las imágenes, CSS y fuentes van con `cache-control: max-age=0`, así que cada visita las vuelve a validar.

### Medio

9. **`robots.txt` mínimo.** No declara explícitamente los crawlers de IA (GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, Google-Extended, Applebot-Extended).
10. **No hay `llms.txt`.** Los motores de IA no tienen un resumen del sitio con precios, servicios y contacto en texto plano.
11. **La 404 es correcta pero se queda corta.** Devuelve un 404 real, pero no lleva `noindex` y solo ofrece un enlace. Debería enlazar a portfolio, servicios y contacto.
12. **Faltan favicons y manifest:** no hay `favicon.ico` (muchos lectores de feeds y Bing lo piden en `/favicon.ico`) ni `site.webmanifest`.
13. **Imágenes:**
    - En `index.html` hay 33 imágenes sin `loading="lazy"` (logos del carrusel y el slider duplicado).
    - En `portfolio.html:126` la imagen del LCP (la primera tarjeta) va en lazy y sin `fetchpriority`.
    - Hay 14 imágenes sin `width`/`height` en `proyecto-petroprix.html:345` y 1 en `portfolio.html:126`.
14. **Accesibilidad (Lighthouse):**
    - Enlaces del pie con área táctil pequeña (`site-footer__col a`).
    - Contador de los chips de filtro con contraste insuficiente (`portfolio.html`, `.chip__count`).
    - `role="listitem"` en `<img>` del carrusel de logos (`index.html`).
    - `aria-label` de las tarjetas del slider que no empieza por el texto visible.
    - Salto H2 → H3 en el formulario de contacto (`contacto.html`, `.lf-step__title`).
15. **El pie no enlaza un "Aviso legal" explícito.** La página `legal.html` tiene privacidad y cookies, pero le faltan los datos de la LSSI como sección propia. También tiene un aviso visible de "Plantilla orientativa" y un texto entre corchetes "[Web3Forms / Formspree]".

### Bajo

16. **Páginas con poco contenido** (menos de 250 palabras): `proyecto-flowkah.html` (192), `proyecto-susi.html` (204) y `contacto.html` (195; es normal en una página de contacto). No reescribo el contenido sin tu OK.
17. **Posible canibalización:**
    - **LYV y Leyendas & Videojuegos** (`proyecto-lyv.html` y `proyecto-leyendas-y-videojuegos.html`) son dos casos de la misma marca, con titles parecidos. Ahora mismo no compiten porque buscan cosas distintas (juegos de mesa frente a identidad para creador), pero conviene que cada uno enlace al otro y que sus titles los diferencien.
    - **El mismo bloque de preguntas frecuentes** aparece en `index.html` y en `servicios.html`. El `FAQPage` solo se marcará en Servicios.
18. **CSS y JS sin minificar.** El ahorro es pequeño (hay unos 30 KB de CSS sin usar en cada página, porque comparten un único `styles.css`). Cloudflare ya los comprime con Brotli.
19. **Las redirecciones de los proyectos agrupados o retirados son páginas HTML con `meta refresh`** (`proyecto-danxer.html`, etc.) además de `_redirects`. Sobra uno de los dos mecanismos.

## Plan de implementación

| Fase | Contenido |
| --- | --- |
| 1 · Indexabilidad | URLs limpias sin `.html` como canónicas, con 301 desde `.html`, `index.html`, `www` y `http`; redirecciones sin cadenas; `robots.txt` con crawlers de IA; `sitemap.xml` con `lastmod` real por archivo; 404 útil con `noindex`; `llms.txt` |
| 2 · Metadatos y schema | `seo.py` como fuente única de title, description, OG y schema por página, con control de longitud en la compilación; imagen OG de 1200×630 por caso; favicon.ico y manifest; JSON-LD de Organization, WebSite, BreadcrumbList, CreativeWork, Service/Offer y FAQPage |
| 3 · Rendimiento | Google Fonts autoalojadas (solo latin y latin-ext); caché inmutable para estáticos; lazy-load fuera de pantalla; prioridad alta en el LCP; dimensiones en todas las imágenes |
| 4 · Semántica, accesibilidad, seguridad y legal | Cabeceras de seguridad y CSP; correcciones de accesibilidad de Lighthouse; aviso legal completo y enlazado en el pie; consola sin errores |

---

## Resultado

Se completa al terminar las fases.
