# Monochrome · Web

Portfolio de Monochrome (Jose Antonio), diseñador gráfico en Sevilla: [monochrome.website](https://monochrome.website).

Web estática (HTML, CSS y JavaScript sin dependencias) publicada en Cloudflare Workers, con un Worker mínimo para el feed de Instagram.

## Páginas

| Archivo | Contenido |
| --- | --- |
| `index.html` | Portada: slider de proyectos, servicios, Instagram, logos y sobre mí |
| `portfolio.html` | Rejilla de proyectos |
| `proyecto-*.html` | Casos de estudio (cada uno con su propia dirección de arte, en `casos/`) |
| `servicios.html`, `contacto.html`, `legal.html`, `404.html` | Resto de páginas |

## Estructura

```
css/styles.css     Estilos comunes
js/config.js       Email, redes, formulario (Web3Forms) y feed de Instagram
js/main.js         Animaciones e interacción
js/lead-form.js    Formulario de contacto
casos/<slug>/      CSS e imágenes de cada caso
assets/            Imágenes, portadas y logos
worker/index.js    Worker: sirve la web y responde en /api/instagram
wrangler.jsonc     Configuración de Cloudflare
_redirects         Redirecciones 301 de proyectos retirados o agrupados
```

## Publicación (Cloudflare)

Cada `git push` a `main` publica la web en monochrome.website en uno o dos minutos (Workers Builds conectado a este repositorio). No hay paso de compilación: se sirve la raíz del repositorio; `.assetsignore` deja fuera `worker/`, `wrangler.jsonc` y este README.

## Feed de Instagram

`/api/instagram` lee las últimas publicaciones de @monochrome_dsg desde el feed JSON de [Behold](https://behold.so) (cuenta con el Google de Monochrome; URL en `BEHOLD_URL`, `wrangler.jsonc`) y las guarda una hora en KV (`monochrome-instagram`), para no pasar de las 1.200 visitas al mes del plan gratuito. Como alternativa, el Worker también sabe leer la API de Instagram directamente con un token en el secreto `IG_TOKEN` (y lo renueva cada semana). Si no hay token o Instagram falla, la portada muestra las cinco imágenes estáticas enlazadas al perfil.

## Formulario

Los mensajes llegan por email mediante [Web3Forms](https://web3forms.com); la clave está en `js/config.js`.
