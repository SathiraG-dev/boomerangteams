document.getElementById("year").textContent = new Date().getFullYear();

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
if (hasGsap) gsap.registerPlugin(ScrollTrigger);

/* Flip on the hidden-by-default reveal styles only now that we can actually reveal things —
   if anything below throws, content already on the page stays visible. */
document.documentElement.classList.add("js-ready");

/* ---------- Smooth scroll (Lenis), loaded dynamically so a failed/blocked CDN
   can't take the rest of the script down with it (static imports fail the whole module). ---------- */
let lenis = null;
async function initSmoothScroll() {
  if (prefersReducedMotion || !hasGsap) return;
  try {
    const { default: Lenis } = await import("https://unpkg.com/lenis@1.3.26/dist/lenis.mjs");
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } catch (err) {
    console.warn("Smooth scroll unavailable, falling back to native scroll.", err);
  }
}
initSmoothScroll();

/* Anchor links scroll through Lenis when available, native smooth-scroll otherwise */
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const id = link.getAttribute("href");
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    event.preventDefault();
    if (lenis) {
      lenis.scrollTo(target, { offset: -70 });
    } else {
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});

/* ---------- Sticky nav background + scroll progress bar ---------- */
const nav = document.getElementById("nav");
const progressBar = document.getElementById("scroll-progress");
const onScroll = () => {
  const scrollY = window.scrollY;
  nav.classList.toggle("is-scrolled", scrollY > 12);
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = `${docHeight > 0 ? (scrollY / docHeight) * 100 : 0}%`;
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- Floating CTA pops up like a toast notification a few seconds after load
   (not scroll-triggered), hides near the contact form so it's never competing with the
   actual booking form, and stays dismissed for the rest of the session. ---------- */
const floatCta = document.getElementById("float-cta");
const floatCtaClose = document.getElementById("float-cta-close");
const contactSection = document.getElementById("contact");
let floatCtaDismissed = sessionStorage.getItem("bt-float-cta-dismissed") === "1";
let floatCtaTimerFired = false;

if (floatCta) {
  const updateFloatCta = () => {
    if (floatCtaDismissed || !floatCtaTimerFired) {
      floatCta.classList.remove("is-visible");
      return;
    }
    const contactRect = contactSection ? contactSection.getBoundingClientRect() : null;
    const nearContact = contactRect ? contactRect.top < window.innerHeight * 0.6 : false;
    floatCta.classList.toggle("is-visible", !nearContact);
  };

  window.addEventListener("scroll", updateFloatCta, { passive: true });

  setTimeout(() => {
    floatCtaTimerFired = true;
    updateFloatCta();
  }, 3500);

  floatCtaClose.addEventListener("click", () => {
    floatCtaDismissed = true;
    sessionStorage.setItem("bt-float-cta-dismissed", "1");
    floatCta.classList.remove("is-visible");
  });
}

/* ---------- Mobile nav toggle ---------- */
const navToggle = document.getElementById("nav-toggle");
const navLinks = document.querySelector(".nav-links");
navToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("is-open");
  navToggle.classList.toggle("is-active", open);
});
navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => navLinks.classList.remove("is-open"));
});

/* ---------- Hero parallax + 3D scroll animation (GSAP ScrollTrigger, scrubbed) ---------- */
const heroImg = document.getElementById("hero-img");
if (heroImg && hasGsap && !prefersReducedMotion) {
  gsap.to(heroImg, {
    yPercent: 8,
    ease: "none",
    scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
  });
}

const heroSplitMedia = document.getElementById("hero-split-media");
const heroSplitVision = document.getElementById("hero-split-vision");
if (heroSplitMedia && heroSplitVision && hasGsap && !prefersReducedMotion) {
  const splitScrollTrigger = { trigger: ".hero-split", start: "top bottom", end: "bottom top", scrub: 0.6 };
  gsap.fromTo(
    heroSplitMedia,
    { rotateY: -10, rotateX: 6, z: -60, opacity: 0.85 },
    { rotateY: 4, rotateX: -2, z: 0, opacity: 1, ease: "none", scrollTrigger: splitScrollTrigger }
  );
  gsap.fromTo(
    heroSplitVision,
    { rotateY: 10, rotateX: -6, z: -60, opacity: 0.85 },
    { rotateY: -4, rotateX: 2, z: 0, opacity: 1, ease: "none", scrollTrigger: { ...splitScrollTrigger } }
  );
  gsap.to(".hero-grid-bg", {
    yPercent: 18,
    ease: "none",
    scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
  });
}

/* ---------- Scroll reveal, staggered per group ---------- */
const revealEls = Array.from(document.querySelectorAll(".reveal"));

if (!hasGsap) {
  /* Fallback: plain IntersectionObserver + CSS transition (see .js-ready .reveal.is-visible) */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => revealObserver.observe(el));
} else {
  const groupSelectors = ".services-grid, .benefits-grid, .work-grid, .insights-grid, .footer-links";
  const groups = document.querySelectorAll(groupSelectors);
  const grouped = new Set();

  groups.forEach((group) => {
    const items = Array.from(group.children).filter((child) => child.classList.contains("reveal"));
    if (!items.length) return;
    items.forEach((item) => grouped.add(item));

    ScrollTrigger.create({
      trigger: group,
      start: "top 82%",
      once: true,
      onEnter: () => {
        gsap.to(items, {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.1,
        });
      },
    });
  });

  revealEls
    .filter((el) => !grouped.has(el))
    .forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        once: true,
        onEnter: () => {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.8,
            ease: "power3.out",
          });
        },
      });
    });
}

/* ---------- Word-by-word scroll-scrubbed manifesto reveal ---------- */
const manifesto = document.querySelector(".philosophy-text");
if (manifesto && hasGsap && !prefersReducedMotion) {
  const walker = document.createTreeWalker(manifesto, NodeFilter.SHOW_TEXT, null);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) textNodes.push(node);

  textNodes.forEach((textNode) => {
    const parts = textNode.textContent.split(/(\s+)/);
    const frag = document.createDocumentFragment();
    parts.forEach((chunk) => {
      if (chunk.trim() === "") {
        frag.appendChild(document.createTextNode(chunk));
      } else {
        const span = document.createElement("span");
        span.className = "word";
        span.textContent = chunk;
        frag.appendChild(span);
      }
    });
    textNode.parentNode.replaceChild(frag, textNode);
  });

  const words = manifesto.querySelectorAll(".word");
  gsap.set(words, { opacity: 0.15 });
  gsap.to(words, {
    opacity: 1,
    stagger: 0.03,
    ease: "none",
    scrollTrigger: {
      trigger: manifesto,
      start: "top 75%",
      end: "bottom 45%",
      scrub: true,
    },
  });
}

/* ---------- Rolling-text hover (nav links + buttons) ---------- */
function initRollText(selector) {
  document.querySelectorAll(selector).forEach((el) => {
    const text = el.textContent.trim();
    if (!text) return;
    el.textContent = "";
    const rollLink = document.createElement("span");
    rollLink.className = "roll-link";
    const rollInner = document.createElement("span");
    rollInner.className = "roll-inner";
    for (let i = 0; i < 2; i++) {
      const line = document.createElement("span");
      line.className = "roll-line";
      line.textContent = text;
      rollInner.appendChild(line);
    }
    rollLink.appendChild(rollInner);
    el.appendChild(rollLink);
  });
}
initRollText(".nav-links a");
initRollText(".nav-cta .btn");
initRollText(".hero-actions .btn");

/* ---------- Tilt-on-hover for cards (pointer devices only) ---------- */
if (window.matchMedia("(pointer: fine)").matches && !prefersReducedMotion) {
  const tiltEls = document.querySelectorAll(".benefit-card, .work-card, .service-card, .case-card");
  tiltEls.forEach((el) => {
    el.addEventListener("mouseenter", () => {
      el.style.transition = "transform 0.1s ease-out";
    });
    el.addEventListener("mousemove", (event) => {
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(800px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg) translateY(-4px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transition = "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)";
      el.style.transform = "";
    });
  });
}

/* ---------- FAQ accordion ---------- */
document.querySelectorAll(".faq-item").forEach((item) => {
  const question = item.querySelector(".faq-question");
  const answer = item.querySelector(".faq-answer");

  question.addEventListener("click", () => {
    const isOpen = item.classList.contains("is-open");

    document.querySelectorAll(".faq-item.is-open").forEach((openItem) => {
      if (openItem !== item) {
        openItem.classList.remove("is-open");
        openItem.querySelector(".faq-answer").style.maxHeight = null;
      }
    });

    item.classList.toggle("is-open", !isOpen);
    answer.style.maxHeight = !isOpen ? `${answer.scrollHeight}px` : null;
  });
});

/* ---------- Contact form (client-side only demo) ---------- */
const contactForm = document.getElementById("contact-form");
const formMessage = document.getElementById("form-message");

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.getElementById("name").value.trim();
  if (!name) return;

  formMessage.textContent = `Thanks, ${name} — we'll be in touch shortly to book your call.`;
  contactForm.reset();
});
