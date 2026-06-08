export const site = {
  name: "Javier Pato",
  domain: "javierpato.es",
  email: "hola@javierpato.es",
  city: "Madrid",
  year: 2026,
  yearFounded: 2018,
  socials: {
    instagram: "https://instagram.com/javierpato",
    linkedin: "https://linkedin.com/in/javierpato",
    arena: "https://are.na/javier-pato",
  },
  langs: ["ES", "EN", "FR"],
};

/* === HERO ============================================== */
export const hero = {
  // 3 líneas tipo fromanother: "WE ARE AN / ARTIST — LED / CREATIVE [rotator]"
  staticTitle: ["SOY UN", "DISEÑADOR —"],
  staticTail: "DE",
  rotatingWords: ["BRAND", "DIGITAL", "EDITORIAL", "MOTION"],
  meta: "Since 2018",
};

/* === SECTIONS TOC =========================================== */
export const toc = [
  { n: 1, label: "About",        anchor: "about"   },
  { n: 2, label: "What I do",    anchor: "what"    },
  { n: 3, label: "Featured work",anchor: "work"    },
  { n: 4, label: "Journey",      anchor: "journey" },
  { n: 5, label: "They trust me",anchor: "trust"   },
];

/* === 1. ABOUT ============================================== */
export const about = {
  index: 1,
  label: "About",
  // Sentence se renderea con efecto blur-fade-in palabra a palabra
  sentence:
    "Diseño marcas, productos y piezas que definen el ahora y dan forma a lo siguiente.",
  paragraph:
    "Trabajo desde la curiosidad, no desde la fórmula. Exploro donde marca, producto y editorial chocan — y donde el brief siguiente decida llevarme.",
};

/* === 2. WHAT I DO ========================================== */
export const what = {
  index: 2,
  label: "What I do",
  rows: [
    {
      n: "01",
      title: "Direction",
      items: [
        "Dirección creativa",
        "Dirección de arte",
        "Visual concept",
        "Identidad",
      ],
    },
    {
      n: "02",
      title: "Digital",
      items: [
        "Web experience",
        "Producto digital",
        "Motion design",
        "Prototipado",
      ],
    },
    {
      n: "03",
      title: "Editorial",
      items: [
        "Diseño editorial",
        "Sistemas tipográficos",
        "Print & impreso",
        "Guidelines",
      ],
    },
  ],
};

/* === 3. FEATURED WORK ====================================== */
/**
 * Imágenes: usamos Picsum.photos con seed determinístico (siempre devuelve
 * la misma imagen para el mismo slug). Las imágenes vienen de Unsplash bajo
 * la Unsplash License — uso comercial libre. Cuando Javier tenga sus piezas
 * reales, basta sustituir el campo `image` por la URL final.
 */
export const work = {
  index: 3,
  label: "Selected work",
  items: [
    {
      slug: "atlas-rebrand",
      title: "Atlas — Rebrand",
      client: "Atlas Studio",
      year: 2025,
      roles: ["Creative Direction", "Identity", "Visual System"],
      palette: ["#0E1F46", "#3858C2", "#F5C45A", "#FFFDE2"],
      symbol: "A",
      image: "https://picsum.photos/seed/atlas-rebrand-jp/1600/1200",
      tint: "rgba(10, 26, 51, 0.35)",
    },
    {
      slug: "harbor-app",
      title: "Harbor — App",
      client: "Harbor Inc.",
      year: 2024,
      roles: ["Product Design", "Motion", "Design System"],
      palette: ["#062130", "#0E5B6E", "#4FE3C1", "#E7F8F2"],
      symbol: "H",
      image: "https://picsum.photos/seed/harbor-app-jp/1600/1200",
      tint: "rgba(6, 33, 48, 0.4)",
    },
    {
      slug: "casa-norte",
      title: "Casa Norte",
      client: "Restaurante",
      year: 2024,
      roles: ["Identity", "Print", "Wayfinding"],
      palette: ["#2A1818", "#7A2B1F", "#E07A4E", "#F4E2C8"],
      symbol: "C",
      image: "https://picsum.photos/seed/casa-norte-jp/1600/1200",
      tint: "rgba(42, 22, 20, 0.4)",
    },
    {
      slug: "lumen-editorial",
      title: "Lumen — Editorial",
      client: "Self-initiated",
      year: 2023,
      roles: ["Editorial Design", "Type"],
      palette: ["#1B1B1B", "#3C3C3C", "#D7B373", "#F2EDE3"],
      symbol: "L",
      image: "https://picsum.photos/seed/lumen-editorial-jp/1600/1200",
      tint: "rgba(20, 20, 20, 0.35)",
    },
  ],
};

/* === 4. JOURNEY (story blocks) ============================= */
export const journey = {
  index: 4,
  label: "Journey",
  intro: "Built on curiosity, not formula.",
  blocks: [
    {
      n: "01",
      slug: "agencia",
      symbol: "·",
      palette: ["#1B2755", "#2A3970", "#7C9DFF", "#FFFDE2"],
      image: "https://picsum.photos/seed/journey-agencia-jp/900/1200",
      tint: "rgba(27, 39, 85, 0.55)",
      body: "Empecé en agencia aprendiendo a leer briefs, defender ideas y entregar a tiempo. Esa base sigue debajo de todo lo que hago hoy.",
    },
    {
      n: "02",
      slug: "freelance",
      symbol: "//",
      palette: ["#1F1B2E", "#3A2A55", "#C99DFF", "#FFFDE2"],
      image: "https://picsum.photos/seed/journey-freelance-jp/900/1200",
      tint: "rgba(31, 27, 46, 0.55)",
      body: "Saltar a freelance ha sido la mejor decisión. Más cerca del cliente, mejor el producto, cada proyecto manda la dirección — no la fórmula.",
    },
    {
      n: "03",
      slug: "hoy",
      symbol: "✺",
      palette: ["#13242A", "#1F4A50", "#4FE3C1", "#FFFDE2"],
      image: "https://picsum.photos/seed/journey-hoy-jp/900/1200",
      tint: "rgba(19, 36, 42, 0.55)",
      body: "Hoy combino marca, producto y editorial. Lo digital y lo impreso no se contradicen — se alimentan.",
    },
    {
      n: "04",
      slug: "next",
      symbol: "→",
      palette: ["#2A1F13", "#5E422A", "#F2C265", "#FFFDE2"],
      image: "https://picsum.photos/seed/journey-next-jp/900/1200",
      tint: "rgba(42, 31, 19, 0.55)",
      body: "Sigo curioso. Esta temporada exploro sistemas tipográficos generativos y la frontera entre diseño y código.",
    },
  ],
};

/* === 5. THEY TRUST ME ====================================== */
export const trust = {
  index: 5,
  label: "They trust me",
  intro:
    "De marcas independientes a equipos de producto y casas editoriales. Una selección de quienes han confiado en mí.",
  clients: [
    "Atlas Studio",
    "Harbor Inc.",
    "Casa Norte",
    "Lumen Press",
    "Studio Mañana",
    "Off Record",
    "Noche Larga",
    "Norte/Sur",
  ],
};

/* === CTA =================================================== */
export const cta = {
  pre: "Let's make",
  word: "something.",
};
