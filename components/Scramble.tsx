"use client";

import { useEffect, useRef, useState } from "react";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@*/";

type Props = {
  text: string;
  /** ms — how long each char takes to settle */
  duration?: number;
  /** delay between chars */
  stagger?: number;
};

/**
 * Renders `text` but every time `text` changes it scrambles the chars
 * (random characters cycling) before settling letter-by-letter.
 */
export function Scramble({ text, duration = 380, stagger = 24 }: Props) {
  const [output, setOutput] = useState(text);
  const prev = useRef(text);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (prev.current === text) return;
    prev.current = text;

    const start = performance.now();
    const chars = text.split("");
    const len = chars.length;
    const total = duration + (len - 1) * stagger;

    const tick = (now: number) => {
      const elapsed = now - start;
      let out = "";
      for (let i = 0; i < len; i++) {
        const charStart = i * stagger;
        const charEnd = charStart + duration;
        if (elapsed < charStart) {
          out += chars[i] === " "
            ? " "
            : ALPHABET[(Math.random() * ALPHABET.length) | 0];
        } else if (elapsed < charEnd) {
          // Still scrambling but losing entropy
          const p = (elapsed - charStart) / duration;
          out += Math.random() > p
            ? ALPHABET[(Math.random() * ALPHABET.length) | 0]
            : chars[i];
        } else {
          out += chars[i];
        }
      }
      setOutput(out);
      if (elapsed < total) {
        raf.current = requestAnimationFrame(tick);
      } else {
        setOutput(text);
      }
    };

    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== undefined) cancelAnimationFrame(raf.current);
    };
  }, [text, duration, stagger]);

  return <>{output}</>;
}
