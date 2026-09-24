document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- Motion capability flags (reused across the new interactive bits) ---------- */
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

/* ---------- Mobile nav ---------- */
const hamburger = document.getElementById("hamburger");
const mobilePanel = document.getElementById("mobilePanel");

hamburger.addEventListener("click", () => {
  const isOpen = mobilePanel.classList.toggle("open");
  hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
});

mobilePanel.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mobilePanel.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
  });
});

/* ---------- Theme toggle (light / dark) ---------- */
const themeToggle = document.getElementById("themeToggle");
const root = document.documentElement;

function applySavedTheme() {
  const saved = localStorage.getItem("portfolio-theme");
  if (saved === "dark" || saved === "light") {
    root.setAttribute("data-theme", saved);
  }
}
applySavedTheme();

themeToggle.addEventListener("click", () => {
  const current =
    root.getAttribute("data-theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const next = current === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  try {
    localStorage.setItem("portfolio-theme", next);
  } catch (e) {
    /* storage unavailable, ignore */
  }
});

/* ---------- Project detail routing (single page, hash based) ---------- */
const mainView = document.getElementById("mainView");
const detailSections = document.querySelectorAll(".project-detail");

function openProject(id) {
  mainView.style.display = "none";
  detailSections.forEach((sec) => sec.classList.toggle("active", sec.id === id));
  window.scrollTo({ top: 0, behavior: "auto" });
  history.pushState(null, "", "#" + id);
}

function closeProject() {
  mainView.style.display = "";
  detailSections.forEach((sec) => sec.classList.remove("active"));
  history.pushState(null, "", "#projects");
}

document.querySelectorAll("[data-open-project]").forEach((btn) => {
  btn.addEventListener("click", () => openProject(btn.getAttribute("data-open-project")));
});

document.querySelectorAll("[data-close-project]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    closeProject();
    document.getElementById("projects").scrollIntoView({ behavior: "smooth" });
  });
});

window.addEventListener("DOMContentLoaded", () => {
  const hash = window.location.hash.replace("#", "");
  if (hash.startsWith("project-")) {
    openProject(hash);
  }
});

window.addEventListener("popstate", () => {
  const hash = window.location.hash.replace("#", "");
  if (hash.startsWith("project-")) {
    openProject(hash);
  } else {
    closeProject();
  }
});

/* ---------- Skill stack tabs ---------- */
document.querySelectorAll(".skill-tab").forEach((tab) => {
  tab.addEventListener("click", function () {
    const skillName = this.getAttribute("data-skill");

    document.querySelectorAll(".skill-tab").forEach((item) => {
      item.classList.remove("active");
      item.setAttribute("aria-selected", "false");
    });
    document.querySelectorAll(".skill-panel").forEach((panel) => panel.classList.remove("active"));

    this.classList.add("active");
    this.setAttribute("aria-selected", "true");

    const selectedPanel = document.querySelector('.skill-panel[data-panel="' + skillName + '"]');
    if (selectedPanel) selectedPanel.classList.add("active");
  });
});

/* ---------- Lightbox with gallery navigation ---------- */
const lightbox = document.getElementById("lightbox");
const lightboxBody = document.getElementById("lightboxBody");
const lightboxCaption = document.getElementById("lightboxCaption");
const lightboxCounter = document.getElementById("lightboxCounter");
const lightboxClose = document.getElementById("lightboxClose");
const lightboxPrev = document.getElementById("lightboxPrev");
const lightboxNext = document.getElementById("lightboxNext");

let currentGallery = [];
let currentIndex = 0;

function galleryItemsFor(el) {
  // Grouped screenshots inside a .project-gallery share navigation.
  const group = el.closest("[data-gallery]") || el.closest(".project-gallery");
  if (group) {
    return Array.from(group.querySelectorAll("[data-lightbox]"));
  }
  // Standalone thumbnail (e.g. a project card cover image) has no siblings to navigate.
  return [el];
}

function renderLightbox() {
  const el = currentGallery[currentIndex];
  const caption = el.getAttribute("data-caption") || "Screenshot preview";
  const img = el.querySelector("img");

  lightboxBody.innerHTML = "";
  if (img) {
    const clone = img.cloneNode(true);
    lightboxBody.appendChild(clone);
  } else {
    const note = document.createElement("p");
    note.textContent = caption + " — add the real image to assets/images and update the src.";
    lightboxBody.appendChild(note);
  }

  lightboxCaption.textContent = caption;

  const showNav = currentGallery.length > 1;
  lightboxPrev.classList.toggle("show", showNav);
  lightboxNext.classList.toggle("show", showNav);
  lightboxCounter.textContent = showNav ? currentIndex + 1 + " / " + currentGallery.length : "";
}

function openLightbox(el) {
  currentGallery = galleryItemsFor(el);
  currentIndex = currentGallery.indexOf(el);
  if (currentIndex < 0) currentIndex = 0;
  renderLightbox();
  lightbox.classList.add("open");
}

function closeLightbox() {
  lightbox.classList.remove("open");
  lightboxBody.innerHTML = "";
  currentGallery = [];
}

function stepLightbox(delta) {
  if (!currentGallery.length) return;
  currentIndex = (currentIndex + delta + currentGallery.length) % currentGallery.length;
  renderLightbox();
}

document.querySelectorAll("[data-lightbox]").forEach((el) => {
  el.addEventListener("click", () => openLightbox(el));
});

lightboxClose.addEventListener("click", closeLightbox);
lightboxPrev.addEventListener("click", () => stepLightbox(-1));
lightboxNext.addEventListener("click", () => stepLightbox(1));

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") stepLightbox(-1);
  if (e.key === "ArrowRight") stepLightbox(1);
});

/* ---------- Scrollspy: highlight the current nav link ---------- */
const navLinks = document.querySelectorAll(".nav-links a[data-nav]");
const spySections = Array.from(navLinks)
  .map((link) => document.getElementById(link.getAttribute("data-nav")))
  .filter(Boolean);

function updateActiveNav() {
  // Only run in the main scrolling view (not while a project detail is open).
  if (mainView.style.display === "none") return;

  let current = spySections[0];
  const probe = window.scrollY + 110;

  spySections.forEach((section) => {
    if (section.offsetTop <= probe) current = section;
  });

  navLinks.forEach((link) => {
    link.classList.toggle("active", current && link.getAttribute("data-nav") === current.id);
  });
}

window.addEventListener("scroll", updateActiveNav, { passive: true });
window.addEventListener("DOMContentLoaded", updateActiveNav);

/* ---------- Scroll reveal for cards ---------- */
document.body.classList.add("reveal-ready");

if ("IntersectionObserver" in window) {
  const revealTargets = document.querySelectorAll(
    ".project-card, .skill-group, .edu-card, .certification-card, .section-head, .experience-item"
  );
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  revealTargets.forEach((el, i) => {
    if (!prefersReducedMotion) {
      el.style.transitionDelay = (i % 6) * 70 + "ms";
    }
    revealObserver.observe(el);
  });
} else {
  document.body.classList.remove("reveal-ready");
}

/* ---------- Back to top ---------- */
const backToTop = document.getElementById("backToTop");

window.addEventListener(
  "scroll",
  () => {
    backToTop.classList.toggle("visible", window.scrollY > 500);
  },
  { passive: true }
);

backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* ---------- Copy email to clipboard ---------- */
document.querySelectorAll("[data-copy]").forEach((el) => {
  el.addEventListener("click", (e) => {
    const value = el.getAttribute("data-copy");
    if (!value || value.startsWith("[")) return; // still a placeholder, let mailto handle it
    if (!navigator.clipboard) return;

    e.preventDefault();
    navigator.clipboard.writeText(value).then(() => {
      const toast = el.querySelector(".copy-toast");
      if (!toast) return;
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 1400);
    });
  });
});

/* =========================================================
   MOTION & INTERACTIVITY UPGRADE
   Scroll progress · cursor glow · header shrink ·
   nav/tab sliding indicators · typed hero role ·
   magnetic + ripple buttons · tilt/spotlight cards
   All effects respect prefers-reduced-motion / touch input,
   the same way the original scroll-reveal already did.
   ========================================================= */

/* ---------- Scroll progress bar ---------- */
const scrollProgressBar = document.getElementById("scrollProgress");
function updateScrollProgress() {
  if (!scrollProgressBar) return;
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  scrollProgressBar.style.width = pct + "%";
}
window.addEventListener("scroll", updateScrollProgress, { passive: true });
window.addEventListener("resize", updateScrollProgress);
updateScrollProgress();

/* ---------- Cursor glow (desktop + motion-safe only) ---------- */
const cursorGlowEl = document.getElementById("cursorGlow");
if (cursorGlowEl && !isTouchDevice && !prefersReducedMotion) {
  let glowTargetX = 0, glowTargetY = 0, glowCurX = 0, glowCurY = 0, glowRafId = null;

  window.addEventListener("mousemove", (e) => {
    glowTargetX = e.clientX;
    glowTargetY = e.clientY;
    cursorGlowEl.classList.add("active");
  });

  document.addEventListener("mouseleave", () => cursorGlowEl.classList.remove("active"));

  function animateCursorGlow() {
    glowCurX += (glowTargetX - glowCurX) * 0.14;
    glowCurY += (glowTargetY - glowCurY) * 0.14;
    cursorGlowEl.style.transform = "translate(" + glowCurX + "px, " + glowCurY + "px) translate(-50%, -50%)";
    glowRafId = requestAnimationFrame(animateCursorGlow);
  }
  animateCursorGlow();
}

/* ---------- Header shrink-on-scroll ---------- */
const siteHeaderEl = document.querySelector(".site-header");
function updateHeaderScrolledState() {
  if (!siteHeaderEl) return;
  siteHeaderEl.classList.toggle("scrolled", window.scrollY > 30);
}
window.addEventListener("scroll", updateHeaderScrolledState, { passive: true });
updateHeaderScrolledState();

/* ---------- Sliding nav indicator ---------- */
const navIndicatorEl = document.getElementById("navIndicator");
const navIndicatorLinks = document.querySelectorAll(".nav-links a[data-nav]");
function moveNavIndicator(link) {
  if (!navIndicatorEl || !link) return;
  navIndicatorEl.style.left = link.offsetLeft + "px";
  navIndicatorEl.style.width = link.offsetWidth + "px";
}
navIndicatorLinks.forEach((link) => {
  link.addEventListener("mouseenter", () => moveNavIndicator(link));
});
const navLinksWrap = document.querySelector(".nav-links");
if (navLinksWrap) {
  navLinksWrap.addEventListener("mouseleave", () => {
    const active = document.querySelector(".nav-links a.active");
    if (active) moveNavIndicator(active);
  });
}
window.addEventListener("load", () => {
  const active = document.querySelector(".nav-links a.active") || navIndicatorLinks[0];
  moveNavIndicator(active);
});
window.addEventListener("resize", () => {
  const active = document.querySelector(".nav-links a.active") || navIndicatorLinks[0];
  moveNavIndicator(active);
});

/* ---------- Sliding skill-tab indicator ---------- */
const skillTabIndicatorEl = document.getElementById("skillTabIndicator");
function moveSkillTabIndicator(tab) {
  if (!skillTabIndicatorEl || !tab) return;
  skillTabIndicatorEl.style.left = tab.offsetLeft + "px";
  skillTabIndicatorEl.style.width = tab.offsetWidth + "px";
}
const skillTabButtons = document.querySelectorAll(".skill-tab");
skillTabButtons.forEach((tab) => {
  tab.addEventListener("click", () => moveSkillTabIndicator(tab));
});
window.addEventListener("load", () => {
  moveSkillTabIndicator(document.querySelector(".skill-tab.active"));
});
window.addEventListener("resize", () => {
  moveSkillTabIndicator(document.querySelector(".skill-tab.active"));
});

/* ---------- Typed / rotating hero role ---------- */
const heroRoleTextEl = document.getElementById("heroRoleText");
if (heroRoleTextEl && !prefersReducedMotion) {
  const roles = (heroRoleTextEl.getAttribute("data-roles") || "")
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);

  if (roles.length > 1) {
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function typeHeroRole() {
      const current = roles[roleIndex];

      if (!isDeleting) {
        charIndex++;
        heroRoleTextEl.textContent = current.slice(0, charIndex);
        if (charIndex >= current.length) {
          isDeleting = true;
          setTimeout(typeHeroRole, 1500);
          return;
        }
      } else {
        charIndex--;
        heroRoleTextEl.textContent = current.slice(0, Math.max(charIndex, 0));
        if (charIndex <= 0) {
          isDeleting = false;
          roleIndex = (roleIndex + 1) % roles.length;
        }
      }
      setTimeout(typeHeroRole, isDeleting ? 32 : 62);
    }

    heroRoleTextEl.textContent = "";
    charIndex = 0;
    setTimeout(typeHeroRole, 500);
  }
}

/* ---------- Magnetic pull + click ripple on buttons ---------- */
document.querySelectorAll(".btn").forEach((btn) => {
  if (!isTouchDevice && !prefersReducedMotion) {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = "translate(" + x * 0.16 + "px, " + y * 0.28 + "px)";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "";
    });
  }

  btn.addEventListener("click", function (e) {
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    const size = Math.max(rect.width, rect.height) * 1.4;
    ripple.style.width = size + "px";
    ripple.style.height = size + "px";
    ripple.style.left = e.clientX - rect.left - size / 2 + "px";
    ripple.style.top = e.clientY - rect.top - size / 2 + "px";
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  });
});

/* ---------- Tilt + cursor spotlight on project / certification cards ---------- */
document.querySelectorAll(".project-card, .certification-card").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--spot-x", x + "px");
    card.style.setProperty("--spot-y", y + "px");

    if (!isTouchDevice && !prefersReducedMotion) {
      const rotateX = ((y / rect.height) - 0.5) * -4;
      const rotateY = ((x / rect.width) - 0.5) * 4;
      card.style.transform =
        "perspective(900px) rotateX(" + rotateX + "deg) rotateY(" + rotateY + "deg) translateY(-2px)";
    }
  });
  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});
