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

Implementado en 4 commits, uno por fase, más un ajuste final. Todo está desplegado y comprobado en producción.

| Commit | Fase |
| --- | --- |
| `983352a` | 1 · Indexabilidad |
| `e1b768a` | 2 · Metadatos y datos estructurados |
| `1a35d8d` | 3 · Rendimiento |
| `a39005c` | 4 · Semántica, accesibilidad, seguridad y legal |
| siguiente | CSP para Cloudflare Web Analytics y alto reservado del formulario |

### Qué se corrigió (por número de problema)

1. **Canonical:** las URLs canónicas son limpias (`/portfolio`, `/proyecto-traders`). Coinciden con lo que sirve el servidor, con el sitemap y con todos los enlaces internos.
2. **Una sola versión de cada URL**, con una única 301 directa al destino final:
   - `http` → `https`
   - `www` → sin `www`
   - `.html` y `/index` → URL limpia
   - barra final → sin barra
   - proyectos retirados → portfolio; agrupados → su caso
3. **JSON-LD en las 18 páginas:**
   - Organization + ProfessionalService, WebSite y WebPage en todas.
   - BreadcrumbList en todas las internas.
   - CreativeWork en los casos.
   - CollectionPage + ItemList en portfolio.
   - ContactPage en contacto.
   - Service con las 3 ofertas y sus precios, más FAQPage, en servicios.
4–5. **Titles y descriptions:**
   - Títulos de 46 a 60 caracteres con la keyword primero; descripciones de 140 a 165.
   - Todo sale de un único archivo (`seo.py`) y la compilación avisa si alguno se sale de rango.
6. **Open Graph y Twitter Cards completos.** Cada caso tiene su propia imagen OG de 1200×630.
7. **Fuentes autoalojadas:** las 21 familias de Google Fonts y Fontshare se sirven desde el propio dominio, solo con los alfabetos latin y latin-ext. Ya no hay ninguna petición a Google.
8. **Cabeceras de seguridad** (HSTS, CSP, nosniff, Referrer-Policy, Permissions-Policy, X-Frame-Options, COOP).
   - **Caché:** un año inmutable para CSS/JS versionados con `?v=hash` y para las fuentes; 30 días para las imágenes.
9. **`robots.txt`:** permite explícitamente los crawlers de buscadores e IA y solo excluye `/api/`.
   - **`sitemap.xml`:** 17 URLs, con `lastmod` que solo cambia cuando cambia el contenido de la página.
10. **`/llms.txt`:** qué es Monochrome, para quién trabaja, precios, proceso, contacto y los 12 casos.
11. **404:** `noindex`, estado 404 real (también en `/404`) y enlaces a servicios, portfolio y contacto. Funciona en rutas profundas porque los recursos usan rutas absolutas.
12. **Favicons y manifest:** `favicon.ico`, iconos de 192 y 512 px (y versión maskable), `logo-512.png` para el schema y `site.webmanifest`.
13. **Imágenes:**
    - Carga diferida en todo lo que queda fuera del primer pantallazo.
    - El LCP sin lazy y con `fetchpriority="high"`.
    - `width`/`height` en el 100 % de las imágenes de contenido.
    - `srcset` en las miniaturas y en la portada de servicios.
14. **Accesibilidad:** corregidos los 5 avisos de Lighthouse (área táctil, contraste, roles ARIA, nombre accesible del slider y orden de encabezados). La accesibilidad queda en 100 en 4 de las 5 páginas.
15. **Legal:**
    - Sección de Aviso legal (LSSI) y enlaces Aviso legal / Privacidad / Cookies en el pie.
    - Fuera el aviso de plantilla; Web3Forms y Behold explicados.
    - **Cookies:** no se usan cookies que requieran consentimiento. La única analítica es la de Cloudflare, que no usa cookies, así que no hace falta banner.
19. Eliminadas las páginas puente con `meta refresh` y el archivo `_redirects`; ahora todo lo resuelve el Worker.

**Pendiente, de tu parte:**
- 16 y 17, contenido: Flowkah y Susi siguen con poco texto (unas 200 palabras). Para reescribirlos necesito tu OK.
- 18, minificar CSS/JS: lo he descartado. El ahorro es de pocos KB con Brotli y el código del repositorio dejaría de ser legible.

### Lighthouse móvil · después

Mediana de 3 pasadas (2 en Portfolio, porque una falló) sobre producción.

| Página | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Inicio | 92 (antes 95) | 100 (96) | 100 (100) | 100 (100) | 2,5 s (2,6) | 0 (0) | 260 ms (80) |
| Portfolio | 100 (97) | 100 (93) | 100 (100) | 100 (100) | 1,6 s (2,3) | 0 (0) | 51 ms (30) |
| Servicios | 98 (100) | 100 (96) | 100 (100) | 100 (100) | 1,6 s (1,8) | 0 (0) | 158 ms (10) |
| Contacto | 100 (100) | 100 (95) | 100 (100) | 100 (100) | 1,4 s (1,5) | 0 (0) | 22 ms (0) |
| Traders (caso) | 98 (97) | 97 (93) | 100 (100) | 100 (100) | 1,4 s (2,1) | 0 (0) | 141 ms (30) |

**Notas sobre las mediciones:**
- El LCP mejora en todas las páginas y queda por debajo de 2,5 s.
- El CLS es 0 en todas.
- **El TBT tiene mucho ruido:** la máquina de pruebas comparte CPU. La misma página en Inicio dio entre 86 y 92 de rendimiento y entre 90 y 430 ms de TBT en pasadas seguidas, incluso bloqueando el feed de Instagram y la analítica. La medición de "antes" es de una sola pasada. Para el INP real, mira el informe de Core Web Vitals de Search Console cuando haya datos de usuarios.
- **El 97 de accesibilidad en Traders** es un aviso de contraste que salta mientras se anima la entrada de los títulos (`is-armed`). Al terminar la animación el contraste es correcto.

## Lo que tienes que hacer tú (fuera del código)

Hecho (26 nov 2026):
- [x] **Google Search Console y Bing Webmaster Tools:** sitio dado de alta, sitemap enviado e indexación solicitada para las páginas clave.
- [x] **Perfil de Empresa de Google:** "Monochrome Design Studio", diseñador gráfico, negocio de área de servicio en Sevilla y Andalucía. La web y el teléfono coinciden con los de la web. En el schema se añade "Monochrome Design Studio" como nombre alternativo y el teléfono, para que Google vea los mismos datos en los dos sitios.
- [x] **IndexNow:** Crawler Hints activado en Cloudflare.
- [x] **Aviso legal:** domicilio fiscal completo, teléfono y condición de autónomo.

Pendiente:
1. **Perfil de Empresa:** añade Instagram y YouTube en "Perfiles de redes sociales" (ahora están vacíos), sube fotos de proyectos, publica novedades y pide reseñas a tus clientes.
2. **Validación del schema:** pasa 2 o 3 URLs (inicio, servicios y un caso) por [Rich Results Test](https://search.google.com/test/rich-results) y por [validator.schema.org](https://validator.schema.org).
3. **Enlaces externos:** pide a tus clientes con web (Picoteo's, Rosse, Leyendas & Videojuegos…) un enlace "Diseño: Monochrome" a su caso.
4. **Search Console, dentro de 1 o 2 semanas:** revisa Páginas (indexadas o excluidas) y Core Web Vitals cuando haya datos.

## Cómo se mantiene

- **Metadatos y schema:** se editan en `seo.py` (title, description, tipo de página, packs y precios). La compilación avisa si un title o una description se salen de rango.
- **Sitemap, robots.txt y llms.txt:** se regeneran solos en cada compilación.
- **Fuentes de un caso nuevo:** si enlaza a Google Fonts o Fontshare, `fonts_local.py` las descarga y las sirve desde el dominio automáticamente.
- **Redirecciones:** si se retira o se agrupa un proyecto, se añade su URL antigua en `REDIRECTS` (`worker/index.js`).
