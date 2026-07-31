/* ═══════════════════════════════════════════════════
   BILLAL.EDITS — THE DIRECTOR'S CUT
   GSAP 3 + ScrollTrigger + SplitText + Lenis
   ═══════════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger, SplitText, ScrollToPlugin);
gsap.defaults({ ease: "power3.out", duration: 0.8 });

/* mobile browsers fire resize when the address bar collapses — recalculating
   every trigger mid-scroll makes the page jump. Ignore those resizes. */
ScrollTrigger.config({ ignoreMobileResize: true });

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ───────────────────────────── Smooth scroll (Lenis) */
let lenis = null;
if (!reduceMotion) {
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop(); // locked until the loader finishes
}

/* ───────────────────────────── Anchor navigation */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const target = document.querySelector(a.hash);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -20, duration: 1.4 });
    else target.scrollIntoView({ behavior: "auto" });
  });
});

/* ═══════════════════════════════════════════════════
   CINEMATIC SCORE — generated ambient (Web Audio)
   A-minor pad + sub heartbeat; scroll velocity opens
   the filter and swells the volume.
   ═══════════════════════════════════════════════════ */
class CinematicScore {
  constructor() {
    this.ctx = null;
    this.playing = false;
    this.targetFreq = 750;
    this.targetGain = 0;
    this.baseGain = 0.055;
  }
  init() {
    if (this.ctx) return;
    const ctx = (this.ctx = new (window.AudioContext || window.webkitAudioContext)());

    this.master = ctx.createGain();
    this.master.gain.value = 0;

    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 750;
    this.filter.Q.value = 0.8;

    this.filter.connect(this.master);
    this.master.connect(ctx.destination);

    // ── Pad: detuned pairs on an A-minor voicing ──
    const notes = [110, 164.81, 220, 261.63, 329.63]; // A2 E3 A3 C4 E4
    this.oscs = [];
    notes.forEach((f, i) => {
      [-4, 4].forEach((cents) => {
        const o = ctx.createOscillator();
        o.type = i < 2 ? "sawtooth" : "sine";
        o.frequency.value = f;
        o.detune.value = cents + (Math.random() * 2 - 1);
        const g = ctx.createGain();
        g.gain.value = i < 2 ? 0.05 : 0.09;
        o.connect(g);
        g.connect(this.filter);
        o.start();
        this.oscs.push(o);
      });
    });

    // ── Slow LFO breathing the filter ──
    this.lfo = ctx.createOscillator();
    this.lfo.frequency.value = 0.07;
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 160;
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.filter.frequency);
    this.lfo.start();

    // ── Sub heartbeat every ~2.2s ──
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = 55;
    this.subGain = ctx.createGain();
    this.subGain.gain.value = 0;
    sub.connect(this.subGain);
    this.subGain.connect(this.master);
    sub.start();
    this.heart = setInterval(() => {
      if (!this.playing) return;
      const t = ctx.currentTime;
      this.subGain.gain.cancelScheduledValues(t);
      this.subGain.gain.setValueAtTime(0.0001, t);
      this.subGain.gain.exponentialRampToValueAtTime(0.12, t + 0.06);
      this.subGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    }, 2200);

    // ── Smoothing loop: chase targets set by scroll velocity ──
    gsap.ticker.add(() => {
      if (!this.ctx) return;
      const f = this.filter.frequency;
      const g = this.master.gain;
      f.value += (this.targetFreq - f.value) * 0.04;
      g.value += (this.targetGain - g.value) * 0.03;
    });
  }
  toggle() {
    this.init();
    if (this.ctx.state === "suspended") this.ctx.resume();
    this.playing = !this.playing;
    this.targetGain = this.playing ? this.baseGain : 0;
    return this.playing;
  }
  onScrollVelocity(v) {
    if (!this.playing) return;
    const speed = Math.min(Math.abs(v) / 2500, 1); // 0..1
    this.targetFreq = 700 + speed * 1900;
    this.targetGain = this.baseGain + speed * 0.05;
  }
}
const score = new CinematicScore();

const soundBtn = document.getElementById("soundToggle");
soundBtn.addEventListener("click", () => {
  const on = score.toggle();
  soundBtn.classList.toggle("is-on", on);
  soundBtn.setAttribute("aria-pressed", String(on));
});

/* ───────────────────────────── Theme (LIGHTS) toggle */
const themeBtn = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("billal-theme");
if (savedTheme) document.documentElement.dataset.theme = savedTheme;
themeBtn.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("billal-theme", next);
});

/* ───────────────────────────── Custom cursor (desktop) */
if (window.matchMedia("(min-width: 800px) and (pointer: fine)").matches && !reduceMotion) {
  const cursor = document.querySelector(".cursor");
  const label = cursor.querySelector(".cursor__label");
  const xTo = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3.out" });
  const yTo = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3.out" });
  window.addEventListener("pointermove", (e) => { cursor.classList.add("is-live"); xTo(e.clientX); yTo(e.clientY); });
  document.querySelectorAll("[data-cursor]").forEach((el) => {
    el.addEventListener("pointerenter", () => {
      const mode = el.dataset.cursor;
      if (mode === "hover") cursor.classList.add("cursor--hover");
      else {
        label.textContent = mode === "play" ? "PLAY ▶" : "VIEW";
        cursor.classList.add("cursor--label");
      }
    });
    el.addEventListener("pointerleave", () => {
      cursor.classList.remove("cursor--hover", "cursor--label");
    });
  });
}

/* ═══════════════════════════════════════════════════
   PRELOADER → HERO ENTRANCE
   Film-leader countdown, letterbox bars open,
   then the title cascades in.
   ═══════════════════════════════════════════════════ */
const loader = document.getElementById("loader");
const loaderCount = document.getElementById("loaderCount");
const loaderFill = document.getElementById("loaderFill");

function buildHeroEntrance() {
  const titles = document.querySelectorAll(".hero__title");
  gsap.set([".hero__title", ".hero__figure"], { opacity: 1 });

  const backSplit = SplitText.create(".hero__title--back .hero__line", { type: "chars" });
  const frontSplit = SplitText.create(".hero__title--front .hero__line", { type: "chars" });

  const tl = gsap.timeline();
  tl.from(backSplit.chars, {
    yPercent: 120,
    autoAlpha: 0,
    rotationX: -50,
    transformOrigin: "50% 100%",
    duration: 1.1,
    ease: "power4.out",
    stagger: { each: 0.035, from: "start" },
  })
    .from(
      ".hero__figure",
      { yPercent: 16, scale: 0.94, autoAlpha: 0, duration: 1.3, ease: "power3.out" },
      "-=0.75"
    )
    .from(
      frontSplit.chars,
      { yPercent: 120, autoAlpha: 0, duration: 0.9, ease: "power4.out", stagger: 0.02 },
      "-=1.0"
    )
    .to(".reveal-meta", { opacity: 1, duration: 0.9, stagger: 0.08 }, "-=0.5")
    .add(() => {
      [backSplit, frontSplit].forEach((s) => gsap.set(s.chars, { clearProps: "willChange" }));
    });
  return tl;
}

function runLoader() {
  const count = { v: 0 };
  const tl = gsap.timeline();
  tl.to(count, {
    v: 100,
    duration: 1.9,
    ease: "power2.inOut",
    onUpdate: () => {
      loaderCount.textContent = String(Math.round(count.v)).padStart(2, "0");
      gsap.set(loaderFill, { scaleX: count.v / 100 });
    },
  })
    .to(".loader__center", { autoAlpha: 0, y: -30, duration: 0.5 }, "+=0.15")
    .to(".loader__bar--top", { yPercent: -101, duration: 1.1, ease: "power4.inOut" }, "-=0.1")
    .to(".loader__bar--bottom", { yPercent: 101, duration: 1.1, ease: "power4.inOut" }, "<")
    .add(() => {
      loader.remove();
      if (lenis) lenis.start();
    }, "-=0.45")
    .add(buildHeroEntrance(), "-=0.55");
  return tl;
}

if (reduceMotion) {
  loader.remove();
  gsap.set([".hero__title", ".hero__figure", ".reveal-meta"], { opacity: 1, visibility: "visible" });
} else {
  Promise.all([
    document.fonts.ready,
    new Promise((res) => (document.readyState === "complete" ? res() : window.addEventListener("load", res))),
  ]).then(runLoader);
}

/* ═══════════════════════════════════════════════════
   TEXT REVEALS — split once, after fonts are ready
   (kept out of matchMedia so re-matches can't double-split)
   ═══════════════════════════════════════════════════ */
let contactSplit = null; // chars of the contact headline (for the letter physics)
let contactScrub = null; // its word light-up tween (killed when the letters fall)

let textRevealsBuilt = false;
function buildTextReveals() {
  if (textRevealsBuilt) return;
  textRevealsBuilt = true;

  /* masked line reveals */
  document.querySelectorAll("[data-reveal='lines']").forEach((el) => {
    const split = SplitText.create(el, { type: "lines", mask: "lines" });
    gsap.set(el, { visibility: "visible" });
    if (reduceMotion) return;
    gsap.from(split.lines, {
      yPercent: 110,
      duration: 1,
      ease: "power4.out",
      stagger: 0.12,
      scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" },
    });
  });

  /* manifestos: words light up as you read
     (the contact headline also gets chars — they become physics bodies) */
  document.querySelectorAll(".manifesto, .manifesto-big").forEach((el) => {
    const isContact = el.classList.contains("manifesto-big");
    const split = SplitText.create(el, {
      type: isContact ? "words,chars" : "words",
      wordsClass: "word",
      charsClass: "char",
    });
    if (isContact) contactSplit = split;
    if (reduceMotion) {
      gsap.set(split.words, { opacity: 1 });
      return;
    }
    const scrub = gsap.to(split.words, {
      opacity: 1,
      ease: "none",
      stagger: 0.04,
      scrollTrigger: { trigger: el, start: "top 78%", end: "bottom 45%", scrub: 1 },
    });
    if (isContact) contactScrub = scrub;
  });
}
document.fonts.ready.then(buildTextReveals);

/* ═══════════════════════════════════════════════════
   SCROLL MOTION — everything below the fold
   ═══════════════════════════════════════════════════ */
const mm = gsap.matchMedia();

mm.add(
  {
    isDesktop: "(min-width: 800px)",
    isMobile: "(max-width: 799px)",
    reduce: "(prefers-reduced-motion: reduce)",
  },
  (ctx) => {
    const { isDesktop, reduce } = ctx.conditions;

    if (reduce) return; // text visibility handled in buildTextReveals()

    /* ── Hero parallax exit: layers drift apart ── */
    const heroDrift = gsap.timeline({
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 },
    });
    heroDrift
      .to(".hero__title--back, .hero__title--front", { yPercent: -18, ease: "none" }, 0)
      .to(".hero__figure", { yPercent: 9, scale: 1.06, ease: "none" }, 0)
      .to(".hero__meta", { autoAlpha: 0, ease: "none" }, 0);

    /* ── Marquee: constant crawl + scroll-velocity boost ── */
    const marqueeTween = gsap.to("#marqueeInner", { xPercent: -50, ease: "none", duration: 22, repeat: -1 });
    ScrollTrigger.create({
      trigger: document.body,
      start: 0,
      end: "max",
      onUpdate: (self) => {
        const v = self.getVelocity();
        marqueeTween.timeScale(gsap.utils.clamp(-4, 4, 1 + v / 900));
        gsap.to(marqueeTween, { timeScale: 1, duration: 0.8, overwrite: "auto" });
        score.onScrollVelocity(v);
      },
    });

    /* ── Stat count-ups ── */
    document.querySelectorAll(".count").forEach((el) => {
      const target = parseInt(el.dataset.count, 10);
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 1.6,
        ease: "power2.out",
        onUpdate: () => (el.textContent = Math.round(obj.v)),
        scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" },
      });
    });

    /* ── Parallax images (story portrait, phones) ── */
    gsap.utils.toArray("[data-speed]").forEach((el) => {
      gsap.to(el, {
        yPercent: () => -14 * parseFloat(el.dataset.speed),
        ease: "none",
        scrollTrigger: {
          trigger: el.closest("section") || el,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    });

    /* ── Work: horizontal film strip (desktop) / stacked reveals (mobile) ── */
    if (isDesktop) {
      const track = document.getElementById("workTrack");
      const getScroll = () => track.scrollWidth - window.innerWidth;
      gsap.to(track, {
        x: () => -getScroll(),
        ease: "none",
        scrollTrigger: {
          trigger: ".work",
          pin: true,
          scrub: 1,
          start: "top top",
          end: () => "+=" + getScroll(),
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
    } else {
      gsap.set(".film-card, .work__more", { autoAlpha: 0, y: 50 });
      ScrollTrigger.batch(".film-card, .work__more", {
        start: "top 88%",
        onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, stagger: 0.12, overwrite: true }),
        onLeaveBack: (batch) => gsap.set(batch, { autoAlpha: 0, y: 50, overwrite: true }),
      });
    }

    /* ── What If?: pinned episode-takeover scrub ──
       Title sequence → each episode owns the screen →
       TO BE CONTINUED. Static bursts sell the cuts. */
    {
      const wiFrames = gsap.utils.toArray(".wi-frame--ep");

      if (isDesktop && wiFrames.length) {
        const wiStatic = document.querySelector(".whatif__static");
        const wiCounter = document.getElementById("wiCounter");
        const wiProgress = document.getElementById("wiProgress");
        const labels = ["S01 · TITLES", ...wiFrames.map((f) => f.dataset.label), "TO BE CONTINUED"];
        const segStarts = [];

        gsap.set(wiFrames, { autoAlpha: 0 });
        gsap.set(".wi-frame--end", { autoAlpha: 0 });

        let tl;
        tl = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          scrollTrigger: {
            trigger: ".whatif",
            pin: true,
            scrub: 1,
            start: "top top",
            end: () => "+=" + (wiFrames.length + 2) * 90 + "%",
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (!tl) return;
              gsap.set(wiProgress, { scaleX: self.progress });
              const time = tl.duration() * self.progress;
              let idx = 0;
              for (let i = 0; i < segStarts.length; i++) if (time >= segStarts[i] - 0.01) idx = i;
              if (wiCounter.textContent !== labels[idx]) wiCounter.textContent = labels[idx];
            },
          },
        });

        /* a VHS static burst at a given beat */
        const cut = (at) => {
          tl.fromTo(wiStatic, { opacity: 0 }, { opacity: 0.55, duration: 0.07, ease: "none" }, at)
            .to(wiStatic, { opacity: 0, duration: 0.14, ease: "none" }, at + 0.07);
        };

        /* — title sequence: bars close, kicker, logo slam — */
        segStarts.push(0);
        tl.from(".whatif__bar--top", { yPercent: -100, duration: 0.5 }, 0)
          .from(".whatif__bar--bottom", { yPercent: 100, duration: 0.5 }, 0)
          .from(".wi-title__kicker", { autoAlpha: 0, y: 24, duration: 0.35 }, 0.15)
          .fromTo(".wi-title__logo", { autoAlpha: 0, scale: 1.65 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: "power3.out" }, 0.4);
        cut(0.95);
        tl.from(".wi-title__sub", { autoAlpha: 0, y: 16, duration: 0.35 }, 1.0)
          .to(".wi-frame--title", { autoAlpha: 0, scale: 1.45, duration: 0.45, ease: "power2.in" }, 1.9);

        /* — each episode takes over on a glitch cut — */
        let t = 2.15;
        wiFrames.forEach((f, i) => {
          segStarts.push(t);
          cut(t);
          tl.fromTo(
            f,
            { autoAlpha: 0, scale: 1.1, xPercent: i % 2 ? 2 : -2 },
            { autoAlpha: 1, scale: 1, xPercent: 0, duration: 0.5, ease: "power3.out" },
            t
          )
            .from(f.querySelector(".wi-frame__side"), { y: 54, autoAlpha: 0, duration: 0.4 }, t + 0.12)
            .from(f.querySelector(".wi-frame__poster"), { y: 34, duration: 0.5 }, t + 0.05);
          t += 1.7;
          tl.to(f, { autoAlpha: 0, scale: 0.96, duration: 0.35, ease: "power2.in" }, t);
          t += 0.25;
        });

        /* — TO BE CONTINUED, bars open, roll on — */
        segStarts.push(t);
        cut(t);
        tl.fromTo(".wi-frame--end", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45 }, t)
          .from(".wi-end__big", { y: 70, duration: 0.5, ease: "power3.out" }, t + 0.05)
          .from(".wi-end__sub, .wi-end__cta", { autoAlpha: 0, y: 20, duration: 0.4, stagger: 0.08 }, t + 0.35)
          .to(".whatif__bar--top", { yPercent: -100, duration: 0.5 }, t + 1.05)
          .to(".whatif__bar--bottom", { yPercent: 100, duration: 0.5 }, t + 1.05);
      } else if (wiFrames.length) {
        /* mobile: stacked frames reveal on scroll */
        gsap.set(wiFrames, { autoAlpha: 0, y: 50 });
        ScrollTrigger.batch(wiFrames, {
          start: "top 88%",
          onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, stagger: 0.1, overwrite: true }),
          onLeaveBack: (batch) => gsap.set(batch, { autoAlpha: 0, y: 50, overwrite: true }),
        });
        gsap.from(".wi-frame--end", {
          autoAlpha: 0,
          y: 40,
          scrollTrigger: { trigger: ".wi-frame--end", start: "top 90%", toggleActions: "play none none reverse" },
        });
      }
    }

    /* ── Phones tilt in ── */
    gsap.from(".phone", {
      y: 90,
      autoAlpha: 0,
      rotation: 0,
      duration: 1.2,
      stagger: 0.15,
      scrollTrigger: { trigger: ".family__phones", start: "top 80%", toggleActions: "play none none reverse" },
    });

    /* ── Footer word rises ── */
    gsap.from(".footer__word", {
      yPercent: 60,
      ease: "none",
      scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: 1 },
    });
  }
);

/* ───────────────────────────── Editor timeline scrubber */
const playhead = document.getElementById("playhead");
const timecode = document.getElementById("timecode");
const FPS = 24;
const TOTAL_SECONDS = 128; // fictional runtime of "the film"

ScrollTrigger.create({
  trigger: document.body,
  start: 0,
  end: "max",
  onUpdate: (self) => {
    const p = self.progress;
    const track = document.querySelector(".timeline__track");
    gsap.set(playhead, { x: p * (track.offsetWidth - 2) });
    const totalFrames = Math.round(p * TOTAL_SECONDS * FPS);
    const ff = totalFrames % FPS;
    const ss = Math.floor(totalFrames / FPS) % 60;
    const min = Math.floor(totalFrames / FPS / 60);
    timecode.textContent =
      "00:" + String(min).padStart(2, "0") + ":" + String(ss).padStart(2, "0") + ":" + String(ff).padStart(2, "0");
  },
});

/* ═══════════════════════════════════════════════════
   THE FINAL CUT — letter physics (Matter.js)
   At the last scroll the headline collapses; letters are
   heavy, draggable, throwable. RESET flies them back.
   ═══════════════════════════════════════════════════ */
(() => {
  if (reduceMotion || typeof Matter === "undefined") return;

  const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Query, Sleeping } = Matter;
  const section = document.querySelector(".contact");
  const resetBtn = document.getElementById("physicsReset");
  const hint = document.getElementById("physicsHint");

  let engine = null;
  let mc = null;
  let letters = []; // { el, body, x0, y0, w, h }
  let fallen = false;
  let armed = true;
  let lastTime = 0;

  function localRect(el, sRect) {
    const r = el.getBoundingClientRect();
    return { x: r.left - sRect.left, y: r.top - sRect.top, w: r.width, h: r.height };
  }

  function tick(time) {
    const now = time * 1000;
    const dt = lastTime ? Math.min(now - lastTime, 33) : 16.67;
    lastTime = now;
    Engine.update(engine, dt);
    for (const L of letters) {
      gsap.set(L.el, {
        x: L.body.position.x - L.x0,
        y: L.body.position.y - L.y0,
        rotation: L.body.angle * (180 / Math.PI),
      });
    }
  }

  function drop() {
    if (fallen || !contactSplit || !contactSplit.chars.length) return;
    fallen = true;
    armed = false;

    // the read-scrub is done with — everything full strength before the cut
    if (contactScrub) {
      contactScrub.scrollTrigger && contactScrub.scrollTrigger.kill();
      contactScrub.kill();
      contactScrub = null;
    }
    gsap.set(contactSplit.words, { opacity: 1 });
    section.classList.add("physics-live");

    const sRect = section.getBoundingClientRect();
    const W = sRect.width;
    const H = sRect.height;

    engine = Engine.create({ enableSleeping: true });
    engine.gravity.y = 1.45; // heavy, cinematic

    letters = contactSplit.chars.map((el) => {
      const r = localRect(el, sRect);
      const x0 = r.x + r.w / 2;
      const y0 = r.y + r.h / 2;
      const body = Bodies.rectangle(x0, y0, Math.max(r.w, 10), Math.max(r.h * 0.82, 10), {
        restitution: 0.28,
        friction: 0.55,
        frictionAir: 0.015,
        chamfer: { radius: Math.min(6, r.w / 4) },
        isStatic: true, // released in a cascade below
      });
      Composite.add(engine.world, body);
      return { el, body, x0, y0, w: r.w, h: r.h };
    });

    // stage bounds: floor at the section's end, walls at the edges,
    // ceiling far above so a good throw can leave the frame and return
    const bounds = [
      Bodies.rectangle(W / 2, H + 30, W * 2, 60, { isStatic: true }),
      Bodies.rectangle(-30, H / 2 - 600, 60, H + 1600, { isStatic: true }),
      Bodies.rectangle(W + 30, H / 2 - 600, 60, H + 1600, { isStatic: true }),
      Bodies.rectangle(W / 2, -1200, W * 2, 60, { isStatic: true }),
    ];
    Composite.add(engine.world, bounds);

    // drag / throw — attached to the section, letters stay pointer-transparent
    const mouse = Mouse.create(section);
    mc = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.16, damping: 0.12, render: { visible: false } },
    });
    Composite.add(engine.world, mc);

    // touch: only hijack the gesture when a letter is actually grabbed,
    // so normal page scrolling over the section keeps working
    const me = mouse.element;
    me.removeEventListener("touchstart", mouse.mousedown);
    me.removeEventListener("touchmove", mouse.mousemove);
    me.removeEventListener("touchend", mouse.mouseup);
    let touchDrag = false;
    me.addEventListener("touchstart", (e) => {
      mouse.mousedown(e);
      const hit = Query.point(letters.map((L) => L.body), mouse.position);
      touchDrag = hit.length > 0;
      if (touchDrag) e.preventDefault();
    }, { passive: false });
    me.addEventListener("touchmove", (e) => {
      if (!touchDrag) return;
      e.preventDefault();
      mouse.mousemove(e);
    }, { passive: false });
    me.addEventListener("touchend", (e) => {
      touchDrag = false;
      mouse.mouseup(e);
    });

    // the cut: release in a fast cascade with a small pop of momentum
    letters.forEach((L, i) => {
      gsap.delayedCall(0.02 * i + Math.random() * 0.05, () => {
        Body.setStatic(L.body, false);
        Sleeping.set(L.body, false);
        Body.setVelocity(L.body, { x: gsap.utils.random(-1.6, 1.6), y: gsap.utils.random(-4, -1) });
        Body.setAngularVelocity(L.body, gsap.utils.random(-0.14, 0.14));
      });
    });

    lastTime = 0;
    gsap.ticker.add(tick);
    gsap.to([resetBtn, hint], { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.1, delay: 1.1 });
  }

  function reset() {
    if (!fallen) return;
    gsap.ticker.remove(tick);
    if (engine) {
      Engine.clear(engine);
      engine = null;
      mc = null;
    }
    gsap.to([resetBtn, hint], { autoAlpha: 0, y: 8, duration: 0.35 });
    // every letter flies home
    gsap.to(letters.map((L) => L.el), {
      x: 0,
      y: 0,
      rotation: 0,
      duration: 1.1,
      ease: "power4.inOut",
      stagger: { each: 0.012, from: "random" },
      onComplete: () => {
        section.classList.remove("physics-live");
        letters = [];
        fallen = false; // armed stays false — re-arms when they scroll away
      },
    });
  }

  resetBtn.addEventListener("click", reset);

  const st = ScrollTrigger.create({
    trigger: ".footer",
    start: "top 80%",
    onEnter: () => armed && drop(),
    onEnterBack: () => armed && drop(),
    onLeaveBack: () => {
      if (!fallen) armed = true;
    },
  });

  // page may load (or restore scroll) already past the trigger — the letters
  // only exist after the fonts split, so check again once they're ready
  document.fonts.ready.then(() => {
    gsap.delayedCall(0.2, () => {
      if (armed && st.progress > 0) drop();
    });
  });

  // a resize mid-pile would leave bodies in a stale coordinate space — snap home
  window.addEventListener("resize", () => {
    if (fallen) reset();
  });
})();

/* ═══════════════════════════════════════════════════
   BILLAL.AI — on-page assistant
   Scripted knowledge base, zero backend: every answer
   ships with the site so there is no API key to leak.
   ═══════════════════════════════════════════════════ */
(() => {
  const root = document.getElementById("chat");
  const fab = document.getElementById("chatFab");
  const panel = document.getElementById("chatPanel");
  const closeBtn = document.getElementById("chatClose");
  const body = document.getElementById("chatBody");
  const chips = document.getElementById("chatChips");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  if (!root || !fab) return;

  const IG = 'https://www.instagram.com/billal.edits?igsh=ZWRjeHh0dWx1c2ps';
  const YT = 'https://yt.openinapp.co/zxlia';
  const igLink = `<a href="${IG}" target="_blank" rel="noopener">@billal.edits</a>`;
  const ytLink = `<a href="${YT}" target="_blank" rel="noopener">YouTube</a>`;

  /* first matching intent wins — order from specific to general */
  const INTENTS = [
    {
      match: /what.?if|series|episode|season/i,
      reply: `<span class="red">WHAT IF?</span> is Billal's original series — still rolling. An intro plus five episodes so far, all on Instagram. Start with the <a href="https://www.instagram.com/reel/Dai9jjNRHtm/?igsh=OG53N2IyeTYzbTFw" target="_blank" rel="noopener">intro</a>, binge EP.01–05 in the SERIES scene on this site, and stay tuned — the next drop is loading.`,
    },
    {
      match: /pric|cost|rate|charge|how much|paid|hire|order|buy|commission/i,
      reply: `Paid edits are open — reels, promos, full concept cuts. Every project is scoped one-on-one, so DM ${igLink} with what you need and you'll get a quote. <span class="red">No fixed menu — every frame is custom.</span>`,
    },
    {
      match: /collab|promot|brand|sponsor|work with|partner|feature/i,
      reply: `Collabs and promotions are very much on the table. Billal works with creators and brands that want edits the algorithm can't ignore. Pitch it in the DMs: ${igLink}.`,
    },
    {
      match: /family|follower|200|community|how many|audience|fans/i,
      reply: `<span class="red">200K strong and rolling.</span> Not followers — family. A verified page of Tamil editors and dreamers, growing every single day.`,
    },
    {
      match: /who|about|billal|story|age|old|himself/i,
      reply: `Billal is a 16-year-old cinematic editor from Chennai — building a 200K-strong family one reel at a time. He doesn't trim clips, he builds moments. This site is scene one of the career.`,
    },
    {
      match: /youtube|yt\b|long.?form|watch/i,
      reply: `The longer cuts live on ${ytLink}. Press play, full screen, sound on.`,
    },
    {
      match: /software|app|tool|premiere|after effects|capcut|alight|learn|teach|tutorial|tip/i,
      reply: `The recipe stays in the kitchen 🎬 — but the real tools are taste, patience, and a thousand scrapped timelines. Want to talk shop? The DMs are open: ${igLink}.`,
    },
    {
      match: /verif|blue tick|badge/i,
      reply: `Yes — the page is <span class="red">verified</span>. Blue tick, earned frame by frame.`,
    },
    {
      match: /chennai|where|location|city|india|tamil/i,
      reply: `Straight out of <span class="red">Chennai, India</span> — and pushing the Tamil editing community onto the world stage, one reel at a time.`,
    },
    {
      match: /contact|dm|reach|message|talk|email|insta|ig\b/i,
      reply: `Fastest cut to Billal: DM ${igLink} on Instagram. Paid edits, promos, collabs — all conversations start there.`,
    },
    {
      match: /^(hi|hey|hello|yo|sup|vanakkam|hola)\b/i,
      reply: `Vanakkam 👋 You've reached the director's assistant. Ask about the edits, the 200K family, pricing, or collabs.`,
    },
    {
      match: /thank|nice|great|cool|love|fire|🔥/i,
      reply: `Appreciated. Every follower is family — tell a friend, and catch the next drop on ${igLink}.`,
    },
  ];
  const FALLBACK = `That one's above my pay grade — I only know the Billal universe. Try pricing, collabs, the family, or just DM the director himself: ${igLink}.`;
  const CHIPS = ["Who is Billal?", "What If series", "Pricing", "Collabs"];

  const addMsg = (html, who) => {
    const el = document.createElement("div");
    el.className = `chat__msg chat__msg--${who}`;
    if (who === "user") el.textContent = html;
    else el.innerHTML = html;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  };

  const respond = (text) => {
    const typing = addMsg('<span class="chat__typing"><i></i><i></i><i></i></span>', "ai");
    const intent = INTENTS.find((it) => it.match.test(text));
    setTimeout(() => {
      typing.innerHTML = intent ? intent.reply : FALLBACK;
      body.scrollTop = body.scrollHeight;
    }, 700 + Math.random() * 500);
  };

  const send = (text) => {
    const clean = text.trim();
    if (!clean) return;
    addMsg(clean, "user");
    respond(clean);
  };

  CHIPS.forEach((label) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chat__chip";
    b.textContent = label;
    b.addEventListener("click", () => send(label));
    chips.appendChild(b);
  });

  let greeted = false;
  const open = () => {
    panel.hidden = false;
    requestAnimationFrame(() => root.classList.add("is-open"));
    fab.setAttribute("aria-expanded", "true");
    input.focus({ preventScroll: true });
    if (!greeted) {
      greeted = true;
      setTimeout(() => addMsg(`Vanakkam 👋 I'm <span class="red">BILLAL.AI</span> — the director's assistant. Ask me about the edits, pricing, collabs, or the 200K family.`, "ai"), 350);
    }
  };
  const close = () => {
    root.classList.remove("is-open");
    fab.setAttribute("aria-expanded", "false");
    setTimeout(() => { panel.hidden = true; }, 380);
  };

  fab.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root.classList.contains("is-open")) close();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    send(input.value);
    input.value = "";
  });
})();

/* ───────────────────────────── Keep layout honest after media loads */
window.addEventListener("load", () => ScrollTrigger.refresh());
