"use client";

import { motion } from "framer-motion";
import { Section } from "./Section";
import { DisplaceFilter } from "./DisplaceFilter";
import { Magnetic } from "./Magnetic";
import { ProjectImage } from "./ProjectImage";
import {
  about,
  what,
  work,
  journey,
  trust,
  cta,
  site,
} from "@/data/site";
import styles from "./sections.module.css";

const viewport = { once: false, margin: "-15% 0px -15% 0px" };
const ease: [number, number, number, number] = [0.165, 0.84, 0.44, 1];

/* ============================================================
   1. ABOUT — scroll-triggered word-by-word blur reveal
   ============================================================ */
export function AboutSection() {
  const words = about.sentence.split(" ");
  return (
    <Section index={about.index} label={about.label} id="about" tone="about">
      <div className={styles.aboutInner}>
        <h2 className={styles.aboutSentence} aria-label={about.sentence}>
          {words.map((w, i) => (
            <span key={i}>
              <span className={styles.aboutWordWrap}>
                <motion.span
                  className={styles.aboutWord}
                  initial={{ opacity: 0, filter: "blur(14px)", y: "30%" }}
                  whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.9, delay: i * 0.055, ease }}
                >
                  {w}
                </motion.span>
              </span>
              {i < words.length - 1 && " "}
            </span>
          ))}
        </h2>
        <motion.p
          className={styles.aboutBody}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 0.75, y: 0 }}
          viewport={viewport}
          transition={{ delay: 0.6, duration: 0.8, ease }}
        >
          {about.paragraph}
        </motion.p>
      </div>
    </Section>
  );
}

/* ============================================================
   2. WHAT I DO — row-by-row reveal, item stagger inside row
   ============================================================ */
export function WhatSection() {
  return (
    <Section index={what.index} label={what.label} id="what" tone="what">
      <div className={styles.whatRows}>
        {what.rows.map((row, ri) => (
          <motion.article
            key={row.n}
            className={styles.whatRow}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.8, ease, delay: ri * 0.08 }}
          >
            <span className={styles.whatNum}>{row.n}</span>
            <span className={styles.whatTitle}>{row.title}</span>
            <ul className={styles.whatList}>
              {row.items.map((it, ii) => (
                <motion.li
                  key={it}
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.6, delay: ri * 0.08 + ii * 0.06, ease }}
                >
                  {it}
                </motion.li>
              ))}
            </ul>
          </motion.article>
        ))}
      </div>
    </Section>
  );
}

/* ============================================================
   3. FEATURED WORK — clip reveal per item
   ============================================================ */
export function WorkSection() {
  return (
    <Section index={work.index} label={work.label} id="work" tone="work">
      <DisplaceFilter id="displace-work" scale={22} freqRange={[0.005, 0.011]} />
      <div className={styles.workInner}>
        {work.items.map((p, i) => (
          <motion.a
            key={p.slug}
            href={`/work/${p.slug}`}
            className={styles.workItem}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.9, ease, delay: i * 0.08 }}
          >
            <span className={styles.workNum}>0{i + 1}</span>
            <motion.div
              className={styles.workCard}
              style={{ filter: "url(#displace-work)" }}
              initial={{ scale: 1.1 }}
              whileInView={{ scale: 1 }}
              viewport={viewport}
              transition={{ duration: 1.4, ease, delay: i * 0.08 }}
            >
              <ProjectImage
                src={p.image}
                alt={`${p.title} — ${p.client}`}
                symbol={p.symbol}
                tint={p.tint}
                tag={`${p.title} · ${p.year}`}
                shape="wide"
                priority={i === 0}
              />
            </motion.div>
            <div className={styles.workMeta}>
              <h3 className={styles.workTitle}>{p.title}</h3>
              <span className={styles.workClient}>{p.client} · {p.year}</span>
              <ul className={styles.workRoles}>
                {p.roles.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </div>
          </motion.a>
        ))}
      </div>
      <div className={styles.workCta}>
        <Magnetic radius={160} strength={0.4}>
          <a href="/work" className={styles.viewAll}>VIEW ALL PROJECTS</a>
        </Magnetic>
      </div>
    </Section>
  );
}

/* ============================================================
   4. JOURNEY — blur intro → block parallax stagger
   ============================================================ */
export function JourneySection() {
  return (
    <Section index={journey.index} label={journey.label} id="journey" tone="team">
      <motion.h2
        className={styles.journeyIntro}
        initial={{ opacity: 0, filter: "blur(16px)", y: 30 }}
        whileInView={{ opacity: 0.75, filter: "blur(2px)", y: 0 }}
        viewport={viewport}
        transition={{ duration: 1.2, ease }}
      >
        {journey.intro}
      </motion.h2>

      <div className={styles.journeyBlocks}>
        {journey.blocks.map((b, i) => (
          <motion.article
            key={b.n}
            className={styles.journeyBlock}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.9, ease }}
          >
            <motion.span
              className={styles.journeyNum}
              initial={{ scale: 1.25, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={viewport}
              transition={{ duration: 1.1, ease, delay: 0.1 }}
            >
              {b.n}
            </motion.span>
            <div className={styles.journeyMedia}>
              <ProjectImage
                src={b.image}
                alt={`Etapa ${b.n}`}
                symbol={b.symbol}
                tint={b.tint}
                tag={`STAGE ${b.n}`}
                shape="tall"
              />
            </div>
            <motion.p
              className={styles.journeyBody}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport}
              transition={{ duration: 0.8, ease, delay: 0.25 }}
            >
              {b.body}
            </motion.p>
          </motion.article>
        ))}
      </div>
    </Section>
  );
}

/* ============================================================
   5. TRUST — grid items stagger fade
   ============================================================ */
export function TrustSection() {
  return (
    <Section index={trust.index} label={trust.label} id="trust" tone="trust">
      <motion.p
        className={styles.trustIntro}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={{ duration: 0.8, ease }}
      >
        {trust.intro}
      </motion.p>
      <ul className={styles.trustGrid}>
        {trust.clients.map((c, i) => (
          <motion.li
            key={c}
            className={styles.trustItem}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 0.55, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.6, ease, delay: i * 0.05 }}
          >
            {c}
          </motion.li>
        ))}
      </ul>
    </Section>
  );
}

/* ============================================================
   CTA
   ============================================================ */
export function CtaSection() {
  return (
    <section className={styles.cta} id="contact">
      <motion.h2
        className={styles.ctaTitle}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={{ duration: 1, ease }}
      >
        {cta.pre} <em className={styles.ctaWord}>{cta.word}</em>
      </motion.h2>
      <Magnetic radius={180} strength={0.3}>
        <motion.a
          href={`mailto:${site.email}`}
          className={styles.ctaEmail}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.8, ease, delay: 0.2 }}
        >
          {site.email}
        </motion.a>
      </Magnetic>
    </section>
  );
}
