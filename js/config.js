/* ==========================================================================
   Monochrome — Configuración
   Edita estos valores sin tocar el resto del código.
   ========================================================================== */
window.MONO_CONFIG = {
  email: "monochromejoseantonio@gmail.com",

  social: {
    instagram: "https://www.instagram.com/monochrome_dsg/",
    tiktok: "https://www.tiktok.com/@monochrome.gd",
    // Segundo icono de la cabecera (en el Figma aparece una "G" en círculo).
    // Pon aquí la URL que corresponda (Gumroad, Behance, etc.).
    secondary: "https://www.tiktok.com/@monochrome.gd",
    secondaryLabel: "TikTok"
  },

  /* ------------------------------------------------------------------------
     Formulario de captación
     provider:
       "web3forms" → gratis, te llegan los leads por email. Crea tu access key
                      en https://web3forms.com (solo pide tu email).
       "formspree" → https://formspree.io  (pega aquí el endpoint del form).
       "custom"    → cualquier endpoint que acepte POST JSON (p.ej. un
                      Google Apps Script que guarde en una hoja de cálculo).
       "mailto"    → sin backend: abre el cliente de correo del visitante con
                      el resumen. Funciona ya, pero convierte peor.
     ------------------------------------------------------------------------ */
  form: {
    provider: "mailto",
    web3formsKey: "",            // p.ej. "a1b2c3d4-...."
    endpoint: "",                // Formspree: "https://formspree.io/f/xxxxxx" · custom: tu URL
    subject: "Nuevo lead desde la web · Monochrome"
  },

  /* ------------------------------------------------------------------------
     Feed de Instagram
     Instagram ya no permite leer el feed sin token desde una web estática.
     La opción más sencilla y gratuita: https://behold.so → conecta tu cuenta
     → "JSON feed" → pega aquí la URL. Si lo dejas vacío se muestran las
     imágenes estáticas del diseño enlazadas a tu perfil.
     ------------------------------------------------------------------------ */
  instagramFeedUrl: "",
  instagramPosts: 8
};
