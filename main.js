/* ============================================================
   SG BIOCON — main.js
   Modal · Form · Scroll Reveals · Nav
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     NAV — shadow on scroll
     ---------------------------------------------------------- */
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('nav--scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ----------------------------------------------------------
     MODAL
     ---------------------------------------------------------- */
  const backdrop  = document.getElementById('modal-backdrop');
  const modal     = document.getElementById('quote-modal');
  const closeBtn  = document.getElementById('modal-close');
  const navToggle = document.getElementById('nav-toggle');

  if (!backdrop || !modal) return;

  const getFocusable = () => Array.from(
    modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  ).filter(el => !el.disabled && el.offsetParent !== null);

  function openModal() {
    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (navToggle) navToggle.checked = false;
    requestAnimationFrame(() => {
      const focusable = getFocusable();
      if (focusable.length) focusable[0].focus();
    });
  }

  function closeModal() {
    backdrop.classList.remove('is-open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-modal-trigger]').forEach(el =>
    el.addEventListener('click', openModal)
  );

  if (navToggle) {
    document.querySelectorAll('.nav__burger').forEach(burger => {
      burger.addEventListener('keydown', e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        navToggle.checked = !navToggle.checked;
      });
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) closeModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && backdrop.classList.contains('is-open')) closeModal();
  });

  modal.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const focusable = getFocusable();
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  });

  /* ----------------------------------------------------------
     FORM SUBMISSION
     ---------------------------------------------------------- */
  const form      = document.getElementById('quote-form');
  const submitBtn = document.getElementById('form-submit');
  const successEl = document.getElementById('form-success');
  const errorEl   = document.getElementById('form-error');

  if (form && submitBtn && successEl && errorEl) {
    const origBtnHTML = submitBtn.innerHTML;

    form.addEventListener('submit', async e => {
      e.preventDefault();
      successEl.hidden = true;
      errorEl.hidden   = true;

      const data = {
        name:         form.elements['name'].value.trim(),
        email:        form.elements['email'].value.trim(),
        organization: form.elements['organization'].value.trim(),
        country:      form.elements['country'].value,
        phone:        form.elements['phone'].value.trim(),
        message:      form.elements['message'].value.trim(),
        company_url:  form.elements['company_url'].value,
      };

      // Honeypot check
      if (data.company_url) return;

      // Required fields
      if (!data.name || !data.email || !data.organization || !data.country) {
        showError('Please fill in all required fields.');
        return;
      }

      // Email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        showError('Please enter a valid email address.');
        return;
      }

      // Loading state
      submitBtn.disabled  = true;
      submitBtn.innerHTML = 'Sending...';

      try {
        const res  = await fetch('/api/lead', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(data),
        });
        const json = await res.json().catch(() => ({}));

        if (res.ok && json.ok) {
          form.hidden      = true;
          successEl.hidden = false;
        } else {
          showError(json.error || 'Something went wrong. Please try again.');
        }
      } catch {
        showError('Network error. Please check your connection and try again.');
      } finally {
        submitBtn.disabled  = false;
        submitBtn.innerHTML = origBtnHTML;
      }
    });
  }

  function showError(msg) {
    errorEl.hidden = false;
    if (msg) {
      const safe = msg.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      errorEl.innerHTML =
        safe + ' Or email us at <a href="mailto:sales@sgbiocon.com">sales@sgbiocon.com</a>.';
    }
  }

  /* ----------------------------------------------------------
     SCROLL REVEALS
     ---------------------------------------------------------- */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReduced) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const siblings = Array.from(
          entry.target.parentElement.querySelectorAll('.reveal:not(.revealed)')
        );
        const idx   = siblings.indexOf(entry.target);
        const delay = Math.min(idx * 80, 320);
        setTimeout(() => entry.target.classList.add('revealed'), delay);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('revealed'));
  }

  /* ----------------------------------------------------------
     SMOOTH SCROLL
     ---------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      if (navToggle) navToggle.checked = false;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  /* ----------------------------------------------------------
     SPEC TOGGLES — sync aria-expanded
     ---------------------------------------------------------- */
  document.querySelectorAll('.card-specs-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.classList.contains('open');
      btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
  });

  /* ----------------------------------------------------------
     PRODUCT VARIANT CYCLING
     ---------------------------------------------------------- */
  const variantContent = {
    V5: {
      series: 'General Imaging',
      title: 'Samsung V5',
      models: 'Daily general and women\'s health scanning',
      desc: 'A compact system for everyday exams, designed to deliver clear images, intelligent AI tools, and easier mobility for consistent daily scanning.',
      specs: [
        ['Crystal Architecture', 'advanced imaging engine for clear, confident scans'],
        ['S-Detect for Thyroid', 'streamlined lesion analysis and reporting support'],
        ['HeartAssist', 'AI guidance for faster, more consistent cardiac assessments'],
        ['Mobile workflow', 'practical system design for routine clinic throughput'],
      ],
      cta: 'Request a quote for V5',
    },
    V6: {
      series: 'Women\'s Health / General Imaging',
      title: 'Samsung V6',
      models: 'Efficient everyday imaging',
      desc: 'A balanced performance platform built around Crystal Architecture image quality and automation tools for reliable results and streamlined women\'s health workflows.',
      specs: [
        ['Crystal Architecture', 'image quality platform for reliable 2D and color imaging'],
        ['BiometryAssist', 'semi-automated measurements for faster fetal growth workflow'],
        ['UterineAssist', 'AI-assisted uterus measurements for exam consistency'],
        ['Efficient workflow', 'daily scanning tools designed to reduce repeated steps'],
      ],
      cta: 'Request a quote for V6',
    },
    V7: {
      series: 'General Imaging',
      title: 'Samsung V7',
      models: 'Advanced shared-service imaging',
      desc: 'A versatile platform for general imaging and women\'s health, with Crystal Architecture image clarity and workflow tools for diverse clinical cases.',
      specs: [
        ['Crystal Architecture', 'enhanced image clarity and penetration for confident diagnosis'],
        ['S-Shearwave Imaging', 'non-invasive tissue stiffness assessment for breast and liver'],
        ['AutoIMT', 'automated carotid intima-media thickness screening support'],
        ['EzExam+ / EzCompare', 'workflow tools that reduce repeated setup steps'],
      ],
      cta: 'Request a quote for V7',
    },
    V8: {
      series: 'General Imaging',
      title: 'Samsung V8',
      models: 'Premium general imaging',
      desc: 'A premium ultrasound system combining Crystal Architecture image quality, Intelligent Assist tools, and re-engineered workflow for busy clinical environments.',
      specs: [
        ['Crystal Architecture', 'CrystalBeam, CrystalLive, and S-Vue technologies for clear imaging'],
        ['Intelligent Assist', 'AI-enabled tools designed to streamline complex exams'],
        ['HQ Vision / ShadowHDR', 'detail and shadow reduction tools for demanding anatomy'],
        ['Sonosync / BatteryAssist', 'collaboration and mobility features for smoother workflow'],
      ],
      cta: 'Request a quote for V8',
    },
    HS30: {
      series: 'General Imaging',
      title: 'Samsung HS30',
      models: 'Routine multi-purpose ultrasound',
      desc: 'A practical console ultrasound for routine clinical scanning, with clear 2D imaging tools and broad application support for everyday departments.',
      specs: [
        ['ClearVision', 'noise reduction and edge enhancement for sharper 2D images'],
        ['S-Harmonic', 'pulse inversion harmonic imaging for more uniform image quality'],
        ['Full HD monitor', '21.5-inch LED display for clear image review'],
        ['Broad calculations', 'support for general, OB/GYN, vascular, cardiac, and urology workflows'],
      ],
      cta: 'Request a quote for HS30',
    },
    HS40: {
      series: 'Women\'s Health / General Imaging',
      title: 'Samsung HS40',
      models: '2D / 3D women\'s health imaging',
      desc: 'A capable, user-friendly system for women\'s health and general imaging, combining advanced 2D and 3D imaging with intelligent automation tools.',
      specs: [
        ['S-Harmonic', 'harmonic imaging designed to reduce noise and improve uniformity'],
        ['ClearVision / MultiVision', 'image processing tools that improve spatial and contrast detail'],
        ['2D and 3D imaging', 'women\'s health capabilities for routine OB/GYN examinations'],
        ['User-friendly workflow', 'tools designed to improve examination efficiency'],
      ],
      cta: 'Request a quote for HS40',
    },
    CV5: {
      series: 'Cardiovascular',
      title: 'Samsung CV5',
      models: 'Compact cardiovascular imaging',
      desc: 'A cardiovascular-focused system for cardiac, vascular, and shared-service exams, built for clinics that need reliable imaging and measurements in a smaller footprint.',
      specs: [
        ['Cardiac and vascular exams', 'supports adult cardiac, pediatric cardiac, and peripheral vessel applications'],
        ['Fluid-flow analysis', 'Doppler and analysis workflows for cardiovascular assessment'],
        ['Measurement packages', 'tools for anatomical measurements and diagnostic analysis'],
        ['Clinical flexibility', 'supports broad applications beyond echo when needed'],
      ],
      cta: 'Request a quote for CV5',
    },
    CV7: {
      series: 'Cardiovascular',
      title: 'Samsung CV7',
      models: 'Advanced cardiovascular imaging',
      desc: 'A higher-performance cardiovascular platform for echo labs and vascular work, with a wider imaging and workflow toolkit for demanding cardiac departments.',
      specs: [
        ['Crystal Architecture', 'Samsung imaging platform for confident cardiac visualization'],
        ['Large display workflow', 'cV7/cV8 support larger display configurations for image review'],
        ['Cardiac quantification', 'analysis tools for adult and pediatric cardiac applications'],
        ['Vascular capability', 'peripheral vessel and shared-service application support'],
      ],
      cta: 'Request a quote for CV7',
    },
    CV8: {
      series: 'Cardiovascular',
      title: 'Samsung CV8',
      models: 'Premium cardiovascular imaging',
      desc: 'A premium cardiovascular system for echo labs, cardiology clinics, and tertiary centers that need advanced imaging, quantification, and workflow support.',
      specs: [
        ['Crystal Architecture', 'high-quality cardiac and vascular imaging foundation'],
        ['Auto EF and GLS', 'automated cardiac quantification workflow support'],
        ['LumiFlow', '3D-like visualization of blood-flow dynamics'],
        ['Broad cardiac applications', 'adult, pediatric, trans-esophageal, and peripheral vessel support'],
      ],
      cta: 'Request a quote for CV8',
    },
    HM70: {
      series: 'Point-of-Care Ultrasound',
      title: 'Samsung HM70 EVO',
      models: 'Hand-carried point-of-care imaging',
      desc: 'A high-performance portable ultrasound for anesthesia, nerve blocks, MSK, thyroid, intestinal, and mobile imaging needs where speed and durability matter.',
      specs: [
        ['Mobile Excellence', 'hand-carried form factor for care wherever it is needed'],
        ['High-resolution imaging', 'clear 2D and color imaging adapted from Samsung high-end platforms'],
        ['Streamlined workflow', 'simple interfaces for urgent or mobile clinical situations'],
        ['Durable design', 'built for diverse point-of-care and bedside environments'],
      ],
      cta: 'Get a quote for HM70',
    },
    EVOQ10: {
      series: 'Point-of-Care Ultrasound',
      title: 'Samsung EVO Q10',
      models: 'High-performance portable ultrasound',
      desc: 'A fast portable system for point-of-care environments, built for crystal-clear imaging, speed, cleaning efficiency, and confident decisions at the bedside.',
      specs: [
        ['Crystal clear imaging', 'portable image quality for confident, time-sensitive decisions'],
        ['Optimized efficiency', 'automated tools and fast workflow for busy environments'],
        ['Point-of-care ready', 'designed for high-pressure bedside and mobile imaging'],
        ['NeedleMate+ / S-Flow / MV-Flow', 'advanced tools for procedures, thyroid, kidney, and vascular flow'],
      ],
      cta: 'Get a quote for EVO Q10',
    },
  };

  function setButtonText(button, text) {
    const textNode = Array.from(button.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
    if (textNode) {
      textNode.textContent = `${text} `;
    } else {
      button.insertBefore(document.createTextNode(`${text} `), button.firstChild);
    }
  }

  function applyVariantContent(card, key) {
    const content = variantContent[key];
    if (!card || !content) return;

    const series = card.querySelector('.product-card__series');
    const title = card.querySelector('.product-card__title');
    const models = card.querySelector('.product-card__models');
    const desc = card.querySelector('.product-card__desc');
    const cta = card.querySelector('.product-card__cta');
    const specSpans = card.querySelectorAll('.spec-list__item span');

    if (series) series.textContent = content.series;
    if (title) title.textContent = content.title;
    if (models) models.textContent = content.models;
    if (desc) desc.textContent = content.desc;
    if (cta) setButtonText(cta, content.cta);
    specSpans.forEach((span, index) => {
      const spec = content.specs[index];
      if (!spec) return;
      span.innerHTML = `<strong>${spec[0]}</strong> ${spec[1]}`;
    });
  }

  document.querySelectorAll('.card-variant-img').forEach(img => {
    const zone = img.closest('.product-card__image-zone');
    if (!zone) return;
    const placeholder = zone.querySelector('.product-card__model-frame');

    const showFallback = () => {
      img.style.display = 'none';
      if (placeholder) placeholder.style.display = 'flex';
    };

    const showImage = () => {
      img.style.display = '';
      if (placeholder) placeholder.style.display = 'none';
    };

    img.addEventListener('error', showFallback);
    img.addEventListener('load', showImage);

    if (img.complete) {
      if (img.naturalWidth > 0) {
        showImage();
      } else {
        showFallback();
      }
    }
  });

  document.querySelectorAll('.variant-selector').forEach(selector => {
    const card = selector.closest('.product-card');
    const img  = card ? card.querySelector('.card-variant-img') : null;
    const placeholder = card ? card.querySelector('.product-card__model-frame') : null;

    selector.querySelectorAll('.variant-btn').forEach(btn => {
      if (btn.classList.contains('variant-btn--active')) {
        applyVariantContent(card, btn.textContent.trim());
      }

      btn.addEventListener('click', () => {
        selector.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('variant-btn--active'));
        btn.classList.add('variant-btn--active');
        applyVariantContent(card, btn.textContent.trim());
        if (img) {
          img.style.display = '';
          if (placeholder) placeholder.style.display = 'none';
          img.src = btn.dataset.img;
          img.alt = btn.dataset.alt || '';
        }
      });
    });
  });

})();
