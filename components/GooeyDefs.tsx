/**
 * Global SVG filter defs.
 * - #gooey: metaball/sticky liquid filter for blobs
 * - #liquid: distortion noise (independent from work cards)
 *
 * Render once in layout; reference via CSS `filter: url(#gooey)`.
 */
export function GooeyDefs() {
  return (
    <svg
      aria-hidden
      style={{
        position: "fixed",
        width: 0,
        height: 0,
        pointerEvents: "none",
      }}
    >
      <defs>
        {/* Metaball / gooey — blur then steep alpha curve */}
        <filter id="gooey" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 22 -10"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>

        {/* Liquid morph — noise + displacement on text */}
        <filter id="liquid-text" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008 0.012"
            numOctaves="2"
            seed="7"
          />
          <feDisplacementMap in="SourceGraphic" scale="6" />
        </filter>
      </defs>
    </svg>
  );
}
