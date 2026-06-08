# javierpato.es — Design System

> Sistema visual del portfolio personal de Javier Pato.
> Referencia estética primaria: [fromanother.love](https://www.fromanother.love).
> Reinterpretación, no copia. Versión 0.1 — 2026-05-22.

---

## 1. Principios

1. **Silencio premium.** El lujo está en lo que se quita, no en lo que se añade. Nunca compitas con tu propio trabajo.
2. **Editorial antes que UI.** La página es una revista, no un dashboard. Jerarquía tipográfica, ritmo de página y márgenes generosos por encima de patrones de producto.
3. **Oscuro por defecto.** El navy es el lienzo. La luz aparece donde hace falta — un glow, un acento, un cursor.
4. **Movimiento que respira.** Toda animación usa curvas suaves (`easeOutQuart`/`easeInOutQuart`). Nada bota, nada corta de golpe. Si dudas, dura más de lo que crees.
5. **Numeración como narrativa.** Las secciones se cuentan: `1 About`, `2 What I do`, `3 Selected work`. Da cadencia y promete recorrido.
6. **El trabajo manda.** Cualquier decoración cede paso a una imagen, un vídeo, un caso. La interfaz se vuelve transparente al entrar en un proyecto.

---

## 2. Color

Tokens raíz — usar siempre la variable, nunca el hex literal.

```css
:root {
  /* base */
  --c-bg:            #051236;   /* navy profundo, fondo global */
  --c-bg-elevated:   #0a1a4a;   /* secciones elevadas, cards */
  --c-ink:           #FFFDE2;   /* crema cálida, texto principal */
  --c-ink-60:        rgba(255, 253, 226, 0.60);  /* texto secundario */
  --c-ink-30:        rgba(255, 253, 226, 0.30);  /* deshabilitado, divisores */
  --c-ink-12:        rgba(255, 253, 226, 0.12);  /* hairlines */

  /* acento */
  --c-accent:        #1740A9;   /* royal blue — links, hover, focus */
  --c-accent-glow:   #4FE3C1;   /* teal-cyan — solo para glow del hero */

  /* estados */
  --c-success:       #9EE493;
  --c-warn:          #F2C265;
  --c-error:         #E87A6A;
}
```

**Reglas de uso:**

- Fondo de página: siempre `--c-bg`. No usar negro puro nunca.
- Texto cuerpo: `--c-ink`. Texto secundario / meta: `--c-ink-60`. Captions: `--c-ink-30`.
- Solo **un** elemento por viewport puede usar `--c-accent-glow` (hero aurora, cursor en proyecto destacado). Es nuestro recurso escaso.
- Selección de texto: `background: var(--c-ink); color: var(--c-bg);`.
- Contraste mínimo AA — `--c-ink-30` solo en texto ≥18px.

---

## 3. Tipografía

Tres familias, cada una con una función única. Mapeo desde fromanother → alternativas tuyas:

| Rol         | Familia primaria              | Fallback open-source   | Uso                                              |
|-------------|-------------------------------|------------------------|--------------------------------------------------|
| `--ff-sans` | **Söhne** *(o GT America)*    | Inter Tight            | UI, body, navegación, captions                   |
| `--ff-display` | **GT Sectra** *(o Editorial New)* | Instrument Serif    | Titulares grandes, manifesto, números de sección |
| `--ff-script` | **Caslon Italic Doric** *(o Migra Italic)* | Young Serif Italic | Una palabra ocasional. Énfasis emocional. |

```css
:root {
  --ff-sans:    "Söhne", "Inter Tight", system-ui, sans-serif;
  --ff-display: "GT Sectra", "Instrument Serif", Georgia, serif;
  --ff-script:  "Caslon Italic Doric", "Instrument Serif", serif;
}
```

### Escala (modular, base 10px → 1rem = 10px)

| Token          | Tamaño         | Line-height | Tracking | Uso                                |
|----------------|----------------|-------------|----------|------------------------------------|
| `--t-mega`     | clamp(8rem, 16vw, 22rem) | 0.85     | -0.04em  | Hero. Una palabra/dos máximo.      |
| `--t-display`  | clamp(4.8rem, 8vw, 8.8rem) | 0.9    | -0.03em  | Titulares de sección               |
| `--t-h1`       | 6.4rem         | 0.95        | -0.024em | Página interior, título proyecto   |
| `--t-h2`       | 4.8rem         | 1.0         | -0.02em  | Sub-bloques                        |
| `--t-h3`       | 3.2rem         | 1.1         | -0.016em | Cards, items destacados            |
| `--t-h4`       | 2.4rem         | 1.2         | -0.01em  | Labels grandes                     |
| `--t-body`     | 1.8rem         | 1.4         | -0.005em | Texto corrido                      |
| `--t-ui`       | 1.6rem         | 1.4         | 0        | Botones, menú                      |
| `--t-caption`  | 1.4rem         | 1.4         | 0        | Meta, créditos, fecha              |
| `--t-micro`    | 1.2rem         | 1.4         | 0.04em   | Tags, números de sección, UPPER    |

### Reglas

- **Display y mega siempre en `--ff-display`** salvo manifesto, que combina display + 1 palabra en script.
- **Tracking negativo proporcional al tamaño.** Cuanto más grande, más cerrado.
- **Números siempre tabular** — `font-variant-numeric: tabular-nums`.
- **Mayúsculas solo en `--t-micro`** y meta. Nunca titulares en uppercase.
- **Espacios anchos en titulares editoriales** — `"We craft  work that  defines  the now"` — usar `word-spacing: 0.4em` para imitar la cadencia.

---

## 4. Espacio y grid

Sistema basado en `1.6rem` (16px) — unidad madre. Todo el espaciado es múltiplo.

```css
:root {
  --space-1: 0.4rem;
  --space-2: 0.8rem;
  --space-3: 1.6rem;
  --space-4: 2.4rem;
  --space-5: 3.2rem;
  --space-6: 4.8rem;
  --space-7: 6.4rem;
  --space-8: 9.6rem;
  --space-9: 14.4rem;   /* aire entre secciones */
  --space-10: 22.4rem;  /* aire de respiración hero/footer */
}
```

### Grid

- **Mobile (<768px):** 4 columnas, gap 1.6rem, padding lateral 1.6rem.
- **Tablet (768–1280):** 6 columnas, gap 2.4rem, padding lateral 3.2rem.
- **Desktop (>1280):** 12 columnas, gap 2.4rem, padding lateral 4.8rem.
- Max width contenido: ninguno por defecto — la página respira hasta los bordes. Solo el body de un caso de estudio se limita a 8 columnas centradas.

---

## 5. Motion

Curvas y duraciones — usar tokens, no improvisar.

```css
:root {
  --ease-out-quart:    cubic-bezier(0.165, 0.84, 0.44, 1);
  --ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1);
  --ease-in-out-cubic: cubic-bezier(0.65, 0, 0.35, 1);

  --dur-fast:    180ms;   /* hover de UI */
  --dur-base:    320ms;   /* transición de estado */
  --dur-slow:    640ms;   /* aparición de bloque */
  --dur-cinema:  1200ms;  /* hero reveal, page transition */
}
```

### Patrones

- **Hover en links:** subrayado que crece de izquierda a derecha en `--dur-base` con `--ease-out-quart`.
- **Aparición al scroll:** `opacity 0→1` + `translateY(2rem→0)` en `--dur-slow`, escalonado 80ms entre items.
- **Page transition:** máscara navy que sube de 0% a 100% en `--dur-cinema`, después baja desde el nuevo lado.
- **Imágenes:** cargan con `scale(1.04)→1` durante `--dur-cinema`. Nunca con fade puro.
- **Cursor custom:** círculo de 8px → 56px en hover sobre proyecto, con `mix-blend-mode: difference` y delay 60ms (lag controlado).
- **Reduce motion:** respetar `prefers-reduced-motion: reduce` — todas las transiciones colapsan a 0ms excepto opacity que mantiene `--dur-fast`.

---

## 6. Hero — el glow

El elemento firma. Es un blob radial gaussiano teal-cyan, sobre el navy, animado en loop suave.

```css
.hero-glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 50% at 50% 55%,
      rgba(79, 227, 193, 0.55) 0%,
      rgba(23, 64, 169, 0.35) 30%,
      transparent 70%);
  filter: blur(80px);
  mix-blend-mode: screen;
  animation: nebula 18s var(--ease-in-out-cubic) infinite;
}
@keyframes nebula {
  0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.85; }
  50%      { transform: scale(1.08) translate(2%, -1%); opacity: 1; }
}
```

Puede implementarse también con Canvas/WebGL (shader) si queremos reactividad al cursor. Esa es la v2.

---

## 7. Componentes

### 7.1 Navbar

- Fijo, full-width, 6.4rem alto.
- Izquierda: `Menu` (toggle overlay). Centro: logotipo (wordmark `javierpato`). Derecha: `Let's chat ↗`.
- Sobre el hero es transparente; al hacer scroll > 100vh aparece backdrop `rgba(5,18,54,0.7)` + `backdrop-filter: blur(20px)`.

### 7.2 Menu overlay

- Cortina full-screen color `--c-bg`, entra con máscara `clip-path: inset(0 0 100% 0) → inset(0)` en `--dur-cinema`.
- Lista vertical de enlaces a tamaño `--t-display`, hover cambia a `--ff-script` la palabra principal.
- Footer del overlay: redes sociales + email, en `--t-ui`.

### 7.3 Sección numerada

```html
<section data-section>
  <span class="section-index">3</span>
  <h2 class="section-title">Selected work</h2>
  <div class="section-body">…</div>
</section>
```

- `section-index`: número en `--ff-display`, `--t-h2`, posicionado sticky en la columna izquierda. Acompaña al scroll.
- `section-title`: `--t-display`, color `--c-ink`.

### 7.4 Project card

- Aspect ratio 4:5 por defecto, 16:9 si es vídeo.
- Imagen full-bleed dentro del card, sin border-radius (mantenemos la línea editorial).
- Overlay al hover: scrim navy 30% + título en `--t-h3` + meta en `--t-caption`.
- Cursor custom muta a `View case ↗`.

### 7.5 Botón / Link primario

- "Pill" rectangular, padding `1.2rem 2.4rem`, borde 1px `--c-ink-30`, texto `--t-ui`.
- Hover: fondo `--c-ink`, texto `--c-bg`, el icono flecha hace `translateX(0.4rem)`.
- Variante texto: subrayado animado, sin caja.

### 7.6 Footer

- Tres columnas en desktop, una en mobile.
- Col 1: wordmark + claim corto.
- Col 2: navegación + redes.
- Col 3: contacto (email, ciudad, "available for…").
- Línea inferior: `© 2026 Javier Pato — Built with care.`

---

## 8. Iconografía

- Set propio en SVG, line 1.5px, redondeado.
- Flecha primaria `↗` (NE) para enlaces externos y CTAs.
- Flecha `→` (E) para "ver todo / siguiente".
- Tamaño base 1.6rem, escala con `currentColor`.

No usar packs masivos (Lucide, Feather) sin tunear stroke al estándar de la web — pierde personalidad si no.

---

## 9. Imagery direction

- **Encuadres editoriales.** Cinematic, 2.35:1 cuando el trabajo lo permita.
- **Color grading consistente.** Todas las imágenes pasan por un look ligero — sombras frías, highlights cálidos. Receta base: lift `+5 cyan`, gain `+3 yellow`.
- **Sin shadows DOM en imágenes** — el aire del navy hace la separación.
- **Vídeo > GIF siempre.** Loop, sin audio, autoplay, `playsinline`. Máximo 6s por loop, `preload="metadata"`.

---

## 10. Voz visual de los detalles

- **Loader inicial:** cortina navy con porcentaje en `--ff-display` que cuenta de 00 → 100. Al llegar, máscara sube y revela el hero.
- **Cookies:** banner pequeño, esquina inferior centrada, mismo tono que el navbar. Una sola línea.
- **404:** una palabra en `--t-mega` ("Lost.") y un enlace en script ("come back home").
- **Selección de idioma:** indicadores `ES / EN` en la nav, no banderas. Cambio sin recarga.

---

## 11. Accesibilidad

- Contraste mínimo AA en todo texto. AAA en body.
- Focus ring visible: `outline: 2px solid var(--c-accent-glow); outline-offset: 4px;`.
- Skip-to-content link en `Tab` desde top.
- `aria-label` en todos los iconos sin texto.
- Vídeos con `<track kind="captions">` si tienen voz.
- Soporte completo a `prefers-reduced-motion` y `prefers-color-scheme` *(modo light es opcional, ver v2)*.

---

## 12. Lo que NO hacemos

- Glassmorphism, neumorfismo, gradientes saturados, sombras dramáticas.
- Cards con border-radius grandes (>4px).
- Skeleton loaders genéricos — preferimos un fade controlado.
- Hover de "magnetic button" — está sobreusado.
- Animar todo "porque sí". Si una animación no cuenta algo, no va.
- Pop-ups que tapen contenido al primer scroll.

---

## 13. Roadmap del sistema

- **v0.1 (este doc)** — tokens, principios, componentes base.
- **v0.2** — Figma library con todos los componentes + auto-layout.
- **v0.3** — Storybook con componentes vivos del stack final.
- **v1.0** — Sistema versionado en NPM `@javierpato/ds`.

---

**Referencias:**
- [fromanother.love](https://www.fromanother.love) — estética primaria.
- [Locomotive Mtl](https://locomotive.ca/en) — motion y scroll.
- [Studio Bruch](https://bruch-studio.com/) — densidad editorial.
- [Pentagram – Mahfouz](https://www.pentagram.com/) — uso del color como acento escaso.
