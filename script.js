(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ===== CUSTOM CURSOR =====
  const cursor = $('#cursor');
  const cursorFollower = $('#cursorFollower');

  if (cursor && cursorFollower && window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 901px)').matches) {
    let mouseX = 0, mouseY = 0;
    let followerX = 0, followerY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.left = mouseX + 'px';
      cursor.style.top = mouseY + 'px';
    });

    // Smooth follower animation
    const animateFollower = () => {
      followerX += (mouseX - followerX) * 0.15;
      followerY += (mouseY - followerY) * 0.15;
      cursorFollower.style.left = followerX + 'px';
      cursorFollower.style.top = followerY + 'px';
      requestAnimationFrame(animateFollower);
    };
    animateFollower();

    // Hover effect on interactive elements
    const interactiveElements = $$('a, button, [role="button"], .card, .gallery__item');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', () => cursorFollower.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursorFollower.classList.remove('hover'));
    });
  }

  // ===== ANIMATED COUNTERS =====
  const animateCounter = (element, target, duration = 2000) => {
    const start = 0;
    const startTime = performance.now();

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (target - start) * easeOut);
      element.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = target;
      }
    };

    requestAnimationFrame(update);
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counters = $$('[data-count]', entry.target);
        counters.forEach(counter => {
          const target = parseInt(counter.dataset.count, 10);
          animateCounter(counter, target);
        });
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  const heroStats = $('.hero__stats');
  if (heroStats) {
    counterObserver.observe(heroStats);
  }

  // Year in footer
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile menu toggle
  const menuToggle = $('#menuToggle');
  const mobileMenu = $('#mobileMenu');

  const menuClose = $('#menuClose');

  if (menuToggle && mobileMenu) {
    function openMenu() {
      menuToggle.classList.add('active');
      mobileMenu.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
    function closeMenu() {
      menuToggle.classList.remove('active');
      mobileMenu.style.display = 'none';
      document.body.style.overflow = '';
    }

    menuToggle.addEventListener('click', () => {
      const isOpen = mobileMenu.style.display === 'flex';
      isOpen ? closeMenu() : openMenu();
    });

    if (menuClose) {
      menuClose.addEventListener('click', closeMenu);
    }

    // Close menu when clicking a link
    $$('a', mobileMenu).forEach(link => {
      link.addEventListener('click', () => closeMenu());
    });
  }

  // Format cards carousel (track-based, one at a time)
  const formatTrack = document.querySelector('.cards-grid__track');
  const formatGrid = document.querySelector('.cards-grid');
  const formatDots = document.querySelectorAll('.cards-grid__dot');
  if (formatTrack && formatGrid && formatDots.length && window.innerWidth <= 900) {
    const formatCards = formatTrack.querySelectorAll('.card');
    const totalSlides = formatCards.length;
    let fIdx = 0;
    let fAutoplay = null;
    let fPaused = false;
    let fStartX = 0;

    function goToSlide(idx) {
      fIdx = idx;
      formatTrack.style.transform = 'translateX(-' + (idx * 100 / totalSlides) + '%)';
      formatDots.forEach((d, i) => d.classList.toggle('active', i === idx));

      // No viewport height recalc here — prevents page jump during auto-slide
    }

    // Auto-slide
    function startAutoplay() {
      clearInterval(fAutoplay);
      fAutoplay = setInterval(() => {
        if (!fPaused) goToSlide((fIdx + 1) % totalSlides);
      }, 6000);
    }

    // Swipe support
    formatGrid.addEventListener('touchstart', (e) => {
      fStartX = e.touches[0].clientX;
      fPaused = true;
    });
    formatGrid.addEventListener('touchend', (e) => {
      const diff = fStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0 && fIdx < totalSlides - 1) goToSlide(fIdx + 1);
        else if (diff < 0 && fIdx > 0) goToSlide(fIdx - 1);
      }
      setTimeout(() => { fPaused = false; }, 5000);
    });

    // Dot click
    formatDots.forEach((dot, i) => {
      dot.addEventListener('click', () => { goToSlide(i); fPaused = true; setTimeout(() => { fPaused = false; }, 5000); });
    });

    goToSlide(0);
    startAutoplay();
  }

  // Phone overlay
  const overlay = $('#phoneOverlay');
  const closeOverlay = $('#closePhone');
  const openOverlayButtons = $$('[data-open-phone]');

  const openPhoneOverlay = () => {
    if (!overlay) return;
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => overlay.querySelector('a, button')?.focus(), 50);
  };

  const hidePhoneOverlay = () => {
    if (!overlay) return;
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  openOverlayButtons.forEach(btn => btn.addEventListener('click', openPhoneOverlay));
  closeOverlay?.addEventListener('click', hidePhoneOverlay);

  // Close overlay on backdrop click
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.classList.contains('overlay__backdrop')) {
      hidePhoneOverlay();
    }
  });

  // Close overlay on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay?.getAttribute('aria-hidden') === 'false') {
      hidePhoneOverlay();
    }
  });

  // Smooth scroll for anchor links
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      const offset = 80; // navbar height
      const y = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });

  // Toast notification
  const showToast = (message) => {
    // Remove existing toast
    const existing = $('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Show toast
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Hide and remove
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  };

  // Copy phone number
  const copyPhoneBtn = $('#copyPhone');
  if (copyPhoneBtn) {
    copyPhoneBtn.addEventListener('click', async () => {
      const phone = (window.SITE_INFOS && window.SITE_INFOS.telephone_raw) || '+33782575354';
      try {
        await navigator.clipboard.writeText(phone);
        showToast('Numéro copié !');
      } catch {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = phone;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
        showToast('Numéro copié !');
      }
    });
  }

  // Navbar scroll effect
  const navbar = $('.navbar');
  if (navbar) {
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;

      if (currentScroll > 100) {
        navbar.style.background = 'rgba(10, 10, 10, 0.95)';
      } else {
        navbar.style.background = 'rgba(10, 10, 10, 0.85)';
      }

      lastScroll = currentScroll;
    }, { passive: true });
  }

  // Intersection Observer for animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const animateOnScroll = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        animateOnScroll.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Animate cards, timeline items, etc.
  $$('.card, .timeline__item, .artist-card, .testimonial, .gallery__item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    animateOnScroll.observe(el);
  });

  // ===== PARTICLES BACKGROUND =====
  const canvas = $('#particlesCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.color = Math.random() > 0.7 ? '#ff6b00' : '#ffffff';
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Wrap around edges
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    const initParticles = () => {
      particles = [];
      const count = Math.min(80, Math.floor((canvas.width * canvas.height) / 15000));
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    };

    const connectParticles = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.beginPath();
            ctx.strokeStyle = '#ff6b00';
            ctx.globalAlpha = 0.1 * (1 - distance / 120);
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      connectParticles();
      animationId = requestAnimationFrame(animate);
    };

    resize();
    initParticles();
    animate();

    window.addEventListener('resize', () => {
      resize();
      initParticles();
    });

    // Pause animation when tab is not visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
      } else {
        animate();
      }
    });
  }

  // ===== CONFETTI / SPARKLES FOR TIMELINE =====
  const createSparkles = (container) => {
    const colors = ['orange', 'gold', 'white'];
    const sparkleCount = 20;

    for (let i = 0; i < sparkleCount; i++) {
      const sparkle = document.createElement('div');
      const colorClass = colors[Math.floor(Math.random() * colors.length)];
      const isStar = Math.random() > 0.6;

      sparkle.className = `sparkle sparkle--${colorClass}${isStar ? ' sparkle--star' : ''}`;

      // Random position around the center
      const angle = (Math.PI * 2 * i) / sparkleCount + (Math.random() - 0.5);
      const distance = 80 + Math.random() * 120;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      sparkle.style.setProperty('--tx', `${tx}px`);
      sparkle.style.setProperty('--ty', `${ty}px`);
      sparkle.style.left = '50%';
      sparkle.style.top = '50%';
      sparkle.style.animationDelay = `${Math.random() * 0.2}s`;
      sparkle.style.animationDuration = `${0.8 + Math.random() * 0.4}s`;

      container.appendChild(sparkle);

      // Remove after animation
      setTimeout(() => sparkle.remove(), 1500);
    }
  };

  // Observer for timeline items with confetti
  const confettiObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const confettiContainer = entry.target.querySelector('.timeline__confetti');
        if (confettiContainer) {
          // Small delay for visual effect
          setTimeout(() => createSparkles(confettiContainer), 200);
        }
        confettiObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  $$('.timeline__item[data-confetti]').forEach(item => {
    confettiObserver.observe(item);
  });

  // ===== BULB LIGHT ON SCROLL =====
  const bulbIcon = $('#bulbIcon');
  if (bulbIcon) {
    const bulbObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(() => bulbIcon.classList.add('lit'), 400);
          bulbObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    bulbObserver.observe(bulbIcon.closest('.timeline__item') || bulbIcon);
  }

  // ===== TIMELINE CARD EXPAND (DISABLED) =====
  // Expand functionality removed — cards are display-only

  // ===== TIMELINE LINE SCROLL ANIMATION =====
  // Animation de la ligne orange qui se dessine au scroll
  const timelineLine = $('.timeline__line');
  const timeline = $('.timeline');

  const updateTimelineProgress = () => {
    if (!timeline || !timelineLine) return;

    const rect = timeline.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Calcule la progression basée sur la position de la timeline dans le viewport
    const timelineTop = rect.top;
    const timelineHeight = rect.height;

    // Commence quand le haut de la timeline atteint le milieu de l'écran
    const startPoint = windowHeight * 0.5;
    // Se termine quand le bas de la timeline atteint le milieu de l'écran
    const endPoint = -timelineHeight + windowHeight * 0.5;

    // Calcule le pourcentage de progression
    let progress = 0;
    if (timelineTop <= startPoint) {
      progress = (startPoint - timelineTop) / (startPoint - endPoint);
      progress = Math.max(0, Math.min(1, progress));
    }

    // Applique la progression à la ligne
    timelineLine.style.setProperty('--timeline-progress', `${progress * 100}%`);
  };

  // ===== PARALLAX EFFECT ON SCROLL =====
  let ticking = false;
  const kebabParallax = $('#kebabParallax');

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.pageYOffset;

        // Update timeline progress
        updateTimelineProgress();

        // Parallax for hero gradient
        const heroGradient = $('.hero__gradient');
        if (heroGradient) {
          heroGradient.style.transform = `translateY(${scrollY * 0.3}px)`;
        }

        // Parallax for kebab broche - moves slower than scroll for depth effect
        if (kebabParallax) {
          const isMobile = window.innerWidth <= 900;
          const translateY = scrollY * 0.15;
          const rotate = scrollY * 0.02;
          const scale = 1 + (scrollY * 0.0002);

          if (isMobile) {
            // Mobile/tablet: broche centred over hero__image with translateX(50%)
            kebabParallax.style.transform = `translateX(50%) translateY(calc(-50% + ${translateY}px)) rotate(${rotate}deg) scale(${Math.min(scale, 1.15)})`;
          } else {
            // Desktop: original parallax with lateral drift
            const translateX = scrollY * 0.05;
            kebabParallax.style.transform = `translateY(calc(-50% + ${translateY}px)) translateX(${translateX}px) rotate(${rotate}deg) scale(${Math.min(scale, 1.15)})`;
          }
        }

        // Subtle parallax for vinyl
        const vinyl = $('.vinyl-container');
        if (vinyl) {
          const artistSection = $('#artistes');
          if (artistSection) {
            const rect = artistSection.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
              vinyl.style.transform = `translateY(calc(-50% + ${(rect.top - window.innerHeight / 2) * 0.1}px))`;
            }
          }
        }

        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Initial call for timeline progress
  updateTimelineProgress();

  // ===== MAGNETIC HOVER EFFECT FOR BUTTONS =====
  $$('.btn--primary, .navbar__cta').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });

  // ===== MENU CARD FLIP 3D EFFECT (REMOVED) =====
  // Carte 3D supprimée — affichage statique recto/verso

  // ===== RECIPES CAROUSEL =====
  const recipesTrack = document.querySelector('.recipes-carousel__track');
  const recipeSlides = document.querySelectorAll('.recipe-slide');
  const recipePrev = document.querySelector('.recipes-carousel__btn--prev');
  const recipeNext = document.querySelector('.recipes-carousel__btn--next');
  const recipeDotsCtn = document.querySelector('.recipes-carousel__dots');

  if (recipesTrack && recipeSlides.length) {
    let currentRecipe = 0;
    const totalRecipes = recipeSlides.length;

    // Create dots
    recipeSlides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.classList.add('recipes-carousel__dot');
      if (i === 0) dot.classList.add('active');
      dot.setAttribute('aria-label', `Recette ${i + 1}`);
      dot.addEventListener('click', () => goToRecipe(i));
      recipeDotsCtn.appendChild(dot);
    });

    function goToRecipe(index) {
      currentRecipe = index;
      recipeSlides.forEach(slide => {
        slide.style.transform = `translateX(-${currentRecipe * 100}%)`;
      });
      recipeDotsCtn.querySelectorAll('.recipes-carousel__dot').forEach((d, i) => {
        d.classList.toggle('active', i === currentRecipe);
      });

      // No viewport height recalc here — prevents page jump during auto-slide
    }

    recipePrev.addEventListener('click', () => {
      goToRecipe(currentRecipe <= 0 ? totalRecipes - 1 : currentRecipe - 1);
    });
    recipeNext.addEventListener('click', () => {
      goToRecipe(currentRecipe >= totalRecipes - 1 ? 0 : currentRecipe + 1);
    });

    // Touch/swipe support
    let touchStartX = 0;
    recipesTrack.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    recipesTrack.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? recipeNext.click() : recipePrev.click();
      }
    }, { passive: true });

    // Auto-play
    let recipeInterval = setInterval(() => recipeNext.click(), 8000);
    recipesTrack.addEventListener('mouseenter', () => clearInterval(recipeInterval));
    recipesTrack.addEventListener('mouseleave', () => {
      recipeInterval = setInterval(() => recipeNext.click(), 8000);
    });
  }

  // ===== COOKIE CONSENT (CNIL) =====
  const cookieBanner = $('#cookieBanner');
  const cookieAccept = $('#cookieAccept');
  const cookieRefuse = $('#cookieRefuse');

  const fbFallback = $('#fbWidgetFallback');
  const fbIframe = $('#fbPageIframe');

  const showFbFallback = () => {
    if (fbFallback) fbFallback.style.display = 'block';
    if (fbIframe) fbIframe.style.display = 'none';
  };

  const showFbIframe = () => {
    if (fbFallback) fbFallback.style.display = 'none';
    if (fbIframe) fbIframe.style.display = '';
  };

  // Set Facebook iframe src — FB plugin max width is 500px
  if (fbIframe) {
    const widget = document.getElementById('fbWidgetContainer');
    const w = widget ? Math.min(500, Math.floor(widget.clientWidth)) : 500;
    const h = window.innerWidth > 600 ? 600 : 450;
    const fbPage = (window.SITE_INFOS && window.SITE_INFOS.facebook) || 'https://www.facebook.com/profile.php?id=100091706444599';
    fbIframe.src = 'https://www.facebook.com/plugins/page.php?href=' + encodeURIComponent(fbPage) + '&tabs=timeline&width=' + w + '&height=' + h + '&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&locale=fr_FR';
    fbIframe.setAttribute('width', w);
    fbIframe.setAttribute('height', h);
  }

  // Detect iframe load failure (blocked by adblocker, cookies, etc.)
  if (fbIframe) {
    fbIframe.addEventListener('error', showFbFallback);
    // Also detect blank iframe after timeout
    setTimeout(() => {
      try {
        if (fbIframe.offsetHeight < 50) showFbFallback();
      } catch (e) {
        showFbFallback();
      }
    }, 5000);
  }

  const setCookieConsent = (accepted) => {
    localStorage.setItem('cookie_consent', accepted ? 'accepted' : 'refused');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    if (cookieBanner) cookieBanner.classList.add('hidden');
    if (accepted) {
      showFbIframe();
    } else {
      showFbFallback();
    }
  };

  if (cookieBanner) {
    const consent = localStorage.getItem('cookie_consent');
    if (consent === 'accepted') {
      cookieBanner.classList.add('hidden');
      showFbIframe();
    } else if (consent === 'refused') {
      cookieBanner.classList.add('hidden');
      showFbFallback();
    }
    // Sinon le bandeau reste visible

    if (cookieAccept) cookieAccept.addEventListener('click', () => setCookieConsent(true));
    if (cookieRefuse) cookieRefuse.addEventListener('click', () => setCookieConsent(false));
  }

  // ===== STEPS CAROUSEL (3 étapes) =====
  const stepsTrack = $('#stepsTrack');
  const stepsDots = $('#stepsDots');

  if (stepsTrack && stepsDots) {
    let currentStep = 0;
    const totalSteps = 3;
    const dots = $$('.steps-carousel__dot', stepsDots);
    const stepsViewport = stepsTrack.parentElement;

    function goToStep(index) {
      if (index < 0 || index >= totalSteps) return;
      currentStep = index;
      stepsTrack.style.transform = `translateX(-${currentStep * (100 / totalSteps)}%)`;

      // Adjust viewport height to active slide
      const slides = $$('.steps-carousel__slide', stepsTrack);
      if (slides[currentStep]) {
        setTimeout(() => {
          stepsViewport.style.height = slides[currentStep].scrollHeight + 'px';
        }, 50);
      }

      // Update dots
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentStep);
      });
    }

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const step = parseInt(dot.dataset.step, 10);
        goToStep(step);
      });
    });

    // Swipe support
    let stepsTouchStartX = 0;
    let stepsTouchEndX = 0;

    stepsViewport.addEventListener('touchstart', (e) => {
      stepsTouchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    stepsViewport.addEventListener('touchend', (e) => {
      stepsTouchEndX = e.changedTouches[0].screenX;
      const diff = stepsTouchStartX - stepsTouchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) goToStep(currentStep + 1);
        else goToStep(currentStep - 1);
      }
    }, { passive: true });

    // Init
    goToStep(0);
    window.addEventListener('resize', () => goToStep(currentStep));
  }

  // ===== HOURS CAROUSEL =====
  const hoursCarousel = $('#hoursCarousel');
  if (hoursCarousel) {
    const hoursTabs = $$('.hours-carousel__tab', hoursCarousel);
    const hoursTrack = hoursCarousel.querySelector('.hours-carousel__track');
    let currentSeason = 0;

    function goToSeason(index) {
      currentSeason = index;
      hoursTrack.style.transform = `translateX(-${index * 50}%)`;
      hoursTabs.forEach((tab, i) => tab.classList.toggle('active', i === index));
    }

    hoursTabs.forEach((tab, i) => {
      tab.addEventListener('click', () => goToSeason(i));
    });

    // Auto-switch every 6s
    let hoursInterval = setInterval(() => {
      goToSeason(currentSeason === 0 ? 1 : 0);
    }, 6000);

    hoursCarousel.addEventListener('mouseenter', () => clearInterval(hoursInterval));
    hoursCarousel.addEventListener('mouseleave', () => {
      hoursInterval = setInterval(() => {
        goToSeason(currentSeason === 0 ? 1 : 0);
      }, 6000);
    });

    // Swipe support
    let hoursStartX = 0;
    hoursCarousel.addEventListener('touchstart', (e) => {
      hoursStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    hoursCarousel.addEventListener('touchend', (e) => {
      const diff = hoursStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50) {
        goToSeason(diff > 0 ? 1 : 0);
      }
    }, { passive: true });
  }

  // ===== TESTIMONIALS CAROUSEL (mobile) =====
  const testimonialsEl = $('.testimonials');
  const prevArrow = $('.testimonials-arrow--prev');
  const nextArrow = $('.testimonials-arrow--next');
  if (testimonialsEl && prevArrow && nextArrow) {
    let currentSlide = 0;
    const getCards = () => $$('.testimonial', testimonialsEl);
    const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

    function scrollToSlide(index) {
      const cards = getCards();
      if (!cards.length) return;
      currentSlide = ((index % cards.length) + cards.length) % cards.length;
      const offset = currentSlide * testimonialsEl.clientWidth;
      testimonialsEl.scrollTo({ left: offset, behavior: 'smooth' });
    }

    prevArrow.addEventListener('click', () => scrollToSlide(currentSlide - 1));
    nextArrow.addEventListener('click', () => scrollToSlide(currentSlide + 1));

    let autoSlide = setInterval(() => {
      if (isMobile()) scrollToSlide(currentSlide + 1);
    }, 4000);

    testimonialsEl.addEventListener('touchstart', () => {
      clearInterval(autoSlide);
      autoSlide = setInterval(() => {
        if (isMobile()) scrollToSlide(currentSlide + 1);
      }, 4000);
    }, { passive: true });
  }

  // ===== MARQUEE CLONE =====
  $$('.gallery-marquee__track').forEach(track => {
    const origItems = Array.from(track.children);

    function initMarquee() {
      // Pause animation while we set up
      track.style.animation = 'none';

      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      const oneSetWidth = origItems.reduce((sum, el) => sum + el.offsetWidth + gap, 0);

      // If images haven't loaded yet (width=0), retry after a short delay
      if (oneSetWidth < 100) {
        setTimeout(initMarquee, 500);
        return;
      }

      // Clone enough sets to always fill viewport + one full set for seamless loop
      const needed = Math.ceil(window.innerWidth / oneSetWidth) + 2;
      for (let n = 0; n < needed; n++) {
        origItems.forEach(item => track.appendChild(item.cloneNode(true)));
      }

      track.style.setProperty('--marquee-half', oneSetWidth + 'px');

      // Restart animation
      track.style.animation = '';
    }

    // Wait for all images to load before measuring
    const imgs = Array.from(track.querySelectorAll('img'));
    const pending = imgs.filter(img => !img.complete);
    if (pending.length === 0) {
      initMarquee();
    } else {
      let loaded = 0;
      pending.forEach(img => {
        img.addEventListener('load', () => { if (++loaded >= pending.length) initMarquee(); }, { once: true });
        img.addEventListener('error', () => { if (++loaded >= pending.length) initMarquee(); }, { once: true });
      });
    }
  });

  // ===== LIGHTBOX =====
  const lightbox = $('#lightbox');
  if (lightbox) {
    const lbImg = lightbox.querySelector('.lightbox__img');
    const lbCounter = lightbox.querySelector('.lightbox__counter');
    const lbClose = lightbox.querySelector('.lightbox__close');
    const lbPrev = lightbox.querySelector('.lightbox__prev');
    const lbNext = lightbox.querySelector('.lightbox__next');
    const lbBackdrop = lightbox.querySelector('.lightbox__backdrop');

    // Collect all zoomable images from main (exclude decorative/aria-hidden, logos, icons)
    const allImages = $$('main img').filter(img => {
      if (img.getAttribute('aria-hidden') === 'true') return false;
      if (img.closest('.menu-step-icon') || img.closest('.testimonial__stars')) return false;
      if (img.width < 40 || img.height < 40) return false;
      return true;
    });

    // Deduplicate by src (gallery marquee duplicates)
    const seen = new Set();
    const images = [];
    allImages.forEach(img => {
      const src = img.src;
      if (!seen.has(src)) {
        seen.add(src);
        images.push(img);
      }
    });

    let currentIndex = 0;

    // Mark all zoomable images
    images.forEach((img, i) => {
      img.classList.add('zoomable');
      img.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openLightbox(i);
      });
    });

    function openLightbox(index) {
      currentIndex = index;
      updateLightbox();
      lightbox.classList.add('active');
      document.body.classList.add('lightbox-open');
    }

    function closeLightbox() {
      lightbox.classList.remove('active');
      document.body.classList.remove('lightbox-open');
    }

    function updateLightbox() {
      const img = images[currentIndex];
      lbImg.src = img.src;
      lbImg.alt = img.alt || '';
      lbCounter.textContent = (currentIndex + 1) + ' / ' + images.length;
    }

    function prevImage() {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      updateLightbox();
    }

    function nextImage() {
      currentIndex = (currentIndex + 1) % images.length;
      updateLightbox();
    }

    lbClose.addEventListener('click', closeLightbox);
    lbBackdrop.addEventListener('click', closeLightbox);
    lbPrev.addEventListener('click', prevImage);
    lbNext.addEventListener('click', nextImage);

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    });
  }

})();
