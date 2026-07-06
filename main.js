document.addEventListener("DOMContentLoaded", () => {
  const burger = document.querySelector(".burger");
  const nav = document.querySelector(".main-nav");

  if (burger && nav) {
    burger.addEventListener("click", () => {
      burger.classList.toggle("open");
      nav.classList.toggle("open");
    });

    document.querySelectorAll(".has-dropdown > a").forEach((link) => {
      link.addEventListener("click", (e) => {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          link.parentElement.classList.toggle("dropdown-open");
        }
      });
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (
          window.innerWidth <= 768 &&
          !link.parentElement.classList.contains("has-dropdown")
        ) {
          burger.classList.remove("open");
          nav.classList.remove("open");
        }
      });
    });
  }

  const header = document.querySelector(".site-header");
  if (header) {
    const onScroll = () => {
      header.classList.toggle("scrolled", window.scrollY > 40);
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
  }

  const scrollTopBtn = document.querySelector(".scroll-top");
  if (scrollTopBtn) {
    window.addEventListener("scroll", () => {
      scrollTopBtn.classList.toggle("visible", window.scrollY > 500);
    });
    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    revealEls.forEach((el) => observer.observe(el));
  }

  const cookieNotice = document.querySelector(".cookie-notice");
  if (cookieNotice) {
    const accepted = localStorage.getItem("rh_cookies_accepted");
    if (!accepted) {
      setTimeout(() => cookieNotice.classList.add("show"), 700);
    }
    const acceptBtn = cookieNotice.querySelector(".cookie-accept");
    acceptBtn?.addEventListener("click", () => {
      localStorage.setItem("rh_cookies_accepted", "true");
      cookieNotice.classList.remove("show");
    });
  }
});
