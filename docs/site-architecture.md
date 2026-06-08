# javierpato.es — Site Architecture

> Mapa de páginas, rutas, contenido base y comportamiento.
> Versión 0.1 — 2026-05-22.

---

## 1. Mapa del sitio

```
/                       Home
/work                   Listado de proyectos
/work/[slug]            Detalle de proyecto (caso de estudio)
/about                  Sobre mí + recorrido
/lab                    Experimentos / side-projects / escritos
/contact                Contacto + agenda
/404                    Página no encontrada
/legal/privacy          Política de privacidad
/legal/cookies          Política de cookies
```

Idiomas: `/es/*` (default) y `/en/*`. URL canónica con prefijo de idioma. El switch nunca pierde la página actual.

---

## 2. Home — `/`

Es la página más editorial del sitio. Cada sección es una "página" de revista.

### 2.1 Hero (full viewport)

- **Glow nebulosa** de fondo (ver `design.md §6`).
- **Indicadores micro** arriba a la izquierda: `ES · 2026 · MADRID` (o ciudad que corresponda).
- **Titular** en `--t-mega`, una frase corta y rotunda:

> Soy *Javier Pato*. Diseño marcas, experiencias y todo lo que pase por una pantalla.

(La palabra "Javier Pato" en `--ff-script`. El resto en `--ff-display`.)

- **Scroll cue** sutil abajo: una línea vertical de 4rem que late muy despacio.

### 2.2 Sección 1 — About

- Tag `1 About`.
- Bloque de texto **manifesto** (ver `brand.md §2`).
- Texto en `--t-display`, ancho máximo 8 columnas, color `--c-ink-60` excepto la palabra resaltada que va a `--c-ink` + `--ff-script`.

### 2.3 Sección 2 — What I do

- Tag `2 What I do`.
- Tres columnas (desktop) / acordeón (mobile). Cada una con número + título + lista de capacidades.

| Bloque             | Capacidades                                                       |
|--------------------|-------------------------------------------------------------------|
| **01 Direction**   | Dirección creativa · Dirección de arte · Concept · Visual systems |
| **02 Brand**       | Identidad · Naming · Diseño editorial · Guidelines                |
| **03 Digital**     | Web design · Producto · Motion · Prototipado                      |

Hover sobre cada capacidad: muta a `--ff-script` y aparece micro-descripción debajo.

### 2.4 Sección 3 — Selected work

- Tag `3 Selected work`.
- Slider horizontal con scroll-snap. 6 proyectos máximo en home.
- Cada card: imagen 4:5, título proyecto, año, cliente. Hover trae overlay y CTA `View case ↗`.
- Al final del slider: link `View all projects →` a `/work`.

### 2.5 Sección 4 — Recognition / Trust

- Tag `4 They trust me` (o `Recognition` si hay premios).
- Logos de clientes en grid 4×N, escala de grises, hover restaura color.
- Si hay premios destacados: carrusel circular tipo "moneda girando" (referencia: bloque Awards de fromanother).

### 2.6 Sección 5 — Lab / Now

- Tag `5 Lab` o `5 Now`.
- Bloque "Estado actual" — qué estoy leyendo / escuchando / explorando esta temporada. Se actualiza manualmente.
- Refuerza la idea de marca personal (no agencia).

### 2.7 CTA + Footer

- Sección a pantalla completa con frase tipo `Let's make something.` en `--t-mega`.
- Bajo la frase: email gigante clicable `hola@javierpato.es`.
- Footer canónico (ver §9).

---

## 3. Work — `/work`

- Header pequeño con tag `Selected projects · 2018 — 2026`.
- Filtros opcionales (mínimo: `All · Branding · Digital · Direction`).
- Grid de proyectos asimétrico (alternar 1col / 2col según tipo de obra) — referencias claras de revista impresa.
- Cada item: imagen + título + cliente + año.
- Infinite scroll o paginación de 12 en 12 (decidir cuando haya >24 proyectos).

---

## 4. Project detail — `/work/[slug]`

Estructura fija por proyecto:

1. **Hero del caso** — imagen/vídeo full bleed + título + meta (cliente, año, rol).
2. **Brief** — un párrafo corto. `--t-h3`.
3. **Process** — bloques alternados de texto+imagen. 3–5 piezas.
4. **Outcome / piezas finales** — galería visual.
5. **Credits** — tabla discreta: rol → persona/estudio.
6. **Next project** — preview a pantalla completa del siguiente proyecto.

Page transition entre proyectos: máscara navy que sube/baja (ver `design.md §5`).

---

## 5. About — `/about`

- Hero: foto en B/N + nombre.
- Bio larga (3–4 párrafos en primera persona).
- Timeline: estudios, estudios donde he trabajado, hitos.
- "Tools I use" — stack honesto (Figma, After Effects, código, etc.).
- Premios y reconocimientos.
- Charlas, publicaciones, entrevistas (si las hay).
- CTA a `/contact`.

---

## 6. Lab — `/lab`

Sección para escritos, experimentos, prototipos no-cliente, fotografía personal.
Es opcional para v1.0 pero la reservo desde día uno para crecer la marca personal.

Estructura tipo cuaderno:
- Listado cronológico.
- Cada entrada con un tipo (`Note · Tool · Photo · Code`).
- Lectura larga con tipografía editorial — la página interior es casi un blog post bien diseñado.

---

## 7. Contact — `/contact`

- Frase grande: *Cuéntame qué tienes entre manos.*
- Tres bloques cortos:
  - **Para proyectos:** email directo.
  - **Para charlas / colaboraciones:** mismo email + nota corta.
  - **Para todo lo demás:** redes sociales.
- Sin formulario en v1.0. Solo email. (Si en el futuro hay mucho volumen, valoramos Cal.com embed.)
- Tiempo de respuesta esperado, en pequeño: *"Suelo responder en 48h."*

---

## 8. 404

- Una palabra en `--t-mega`: *Perdido.*
- Una frase en `--ff-script`: *vuelve a casa.*
- Link al home.
- Glow nebulosa idéntica al hero, pero más débil.

---

## 9. Footer (global)

```
Columna 1                Columna 2              Columna 3
─────────                ─────────              ─────────
javierpato               Work                   hola@javierpato.es
Diseño que sabe          About                  Madrid · GMT+1
quedarse callado.        Lab                    Disponible Q3 2026
                         Contact                Instagram · LinkedIn

─────────────────────────────────────────────────────────
© 2026 Javier Pato · Built with care · ES / EN
```

---

## 10. Navegación global

### Top bar

- Izquierda: `Menu` (abre overlay).
- Centro: wordmark clicable (vuelve a home).
- Derecha: `Let's chat ↗` (ancla a `/contact`).
- Comportamiento ver `design.md §7.1`.

### Menu overlay

```
Work                     →
About                    →
Lab                      →
Contact                  →
─────────────────────
Instagram   LinkedIn   Are.na
hola@javierpato.es
ES  ·  EN
```

---

## 11. Stack — propuesta

> Decisión a confirmar contigo. Esta es mi recomendación.

| Capa            | Recomendación                  | Por qué                                                                 |
|-----------------|--------------------------------|-------------------------------------------------------------------------|
| Framework       | **Next.js 15** (App Router)    | El más sólido para portfolios con casos pesados, transitions, RSC.      |
| Lenguaje        | TypeScript                     | Sin discusión.                                                          |
| Styling         | **CSS Modules + Tokens**       | Encaja con el design system. Tailwind opcional para utilidades sueltas. |
| CMS             | **Sanity**                     | Ya disponible vía MCP, flexible, schema en código.                      |
| Motion          | **GSAP** + Lenis (smooth scroll) | Industria estándar para este tipo de webs editoriales.                |
| Imagen          | next/image + Sanity image pipeline | Optimización gratis, formatos modernos.                              |
| Vídeo           | Mux *(o self-hosted MP4)*      | Mux para reels en proyectos pesados, MP4 para loops cortos.             |
| Hosting         | **Vercel**                     | DX, edge, preview deployments.                                          |
| Analytics       | Plausible *(o Vercel Analytics)* | Sin cookies, ligero.                                                  |
| Forms (futuro)  | Resend + un endpoint serverless | Cuando haya formulario, salida directa a tu email.                      |
| i18n            | next-intl                      | Soporta App Router bien.                                                |

**Alternativa más ligera:** Astro + Sanity. Más rápido en build, menos JS, peor para transiciones complejas. Si la prioridad es performance/SEO por encima de "wow" de motion, Astro gana.

---

## 12. SEO / metadata baseline

- Cada página define: `title`, `description`, `og:image`, `twitter:card`, `canonical`.
- `og:image` por proyecto = imagen hero del caso.
- Sitemap dinámico desde Sanity.
- Schema.org `Person` en el root + `CreativeWork` en cada proyecto.
- Open Graph imágenes generadas dinámicamente con la nebulosa de fondo + título — coherencia visual cuando alguien comparte un link.

---

## 13. Performance targets

| Métrica       | Objetivo  |
|---------------|-----------|
| LCP           | < 2.0s    |
| INP           | < 200ms   |
| CLS           | < 0.05    |
| Total JS (home) | < 180kb |
| Lighthouse    | 95+ en todas las categorías |

---

## 14. Roadmap de implementación

**Sprint 1 — Fundaciones (semana 1)**
- Setup Next.js + TS + tokens del design system en CSS.
- Componentes base: Layout, Nav, Footer, Container, Type primitives.
- Conexión Sanity + schemas mínimos (Project, Page, Settings).
- Deploy a Vercel + dominio.

**Sprint 2 — Home (semana 2)**
- Hero con glow.
- Secciones 1–5 con su contenido base.
- Smooth scroll + reveal animations.

**Sprint 3 — Work + detalle (semana 3)**
- Listado y plantilla de caso de estudio.
- Page transitions.
- Llenado con primeros 6 proyectos reales.

**Sprint 4 — About, Lab, Contact, 404 (semana 4)**
- Páginas restantes.
- i18n ES/EN.
- SEO + sitemap + OG dinámicos.

**Sprint 5 — Pulido (semana 5)**
- A11y audit.
- Performance pass.
- QA cross-device.
- Lanzamiento.

---

## 15. Pendientes / decisiones para mí (Javier)

- [ ] Confirmar stack (recomendación: Next.js + Sanity).
- [ ] Confirmar ciudad / disponibilidad para mostrar.
- [ ] Seleccionar 6 proyectos para home + 12–24 para `/work`.
- [ ] Decidir si `/lab` entra en v1.0 o lo dejamos para v1.1.
- [ ] Comprar / licenciar tipografías (Söhne + GT Sectra) o ir 100% open-source (Inter Tight + Instrument Serif).
- [ ] Email final (`hola@javierpato.es` requiere configurar MX).
