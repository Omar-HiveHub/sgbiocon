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
    V4: {
      series: 'General Imaging',
      title: 'Samsung V4',
      models: 'Compact, entry-level scanning',
      desc: 'A compact, affordable console that brings genuine Samsung image quality and AI scan help to smaller and busier clinics.',
      specs: [
        ['Clear, reliable images', 'genuine Samsung picture quality your doctors can trust'],
        ['S-Detect', 'AI help spotting thyroid and breast lesions'],
        ['On-screen scan guidance', 'helps newer staff get good images faster'],
        ['Automatic measurements', 'cuts repetitive steps on routine exams'],
      ],
      cta: 'Request a quote for V4',
    },
    V5: {
      series: 'General Imaging',
      title: 'Samsung V5',
      models: 'Daily general and women\'s health scanning',
      desc: 'A compact everyday system that gives clear images and smart automation, easy to move between rooms for steady daily scanning.',
      specs: [
        ['Clear everyday imaging', 'sharp pictures for confident routine scans'],
        ['S-Detect for thyroid', 'AI help spotting and reporting lesions'],
        ['Heart-scan assistance', 'AI guidance for faster, steadier cardiac checks'],
        ['Easy to move', 'practical design for busy, multi-room clinics'],
      ],
      cta: 'Request a quote for V5',
    },
    V6: {
      series: 'Women\'s Health / General Imaging',
      title: 'Samsung V6',
      models: 'Efficient women\'s health scanning',
      desc: 'A well-balanced system built for clear images and quick, consistent women\'s health exams.',
      specs: [
        ['Reliable 2D and colour imaging', 'dependable picture quality day to day'],
        ['Faster pregnancy measurements', 'semi-automatic fetal growth measurements'],
        ['Consistent uterus measurements', 'AI help for repeatable results'],
        ['Fewer repeated steps', 'workflow that speeds up daily scanning'],
      ],
      cta: 'Request a quote for V6',
    },
    V7: {
      series: 'General Imaging',
      title: 'Samsung V7',
      models: 'Advanced, all-round imaging',
      desc: 'A versatile system for general imaging and women\'s health, with clearer pictures and tools for a wide range of cases.',
      specs: [
        ['Clearer images at depth', 'confident detail even on harder scans'],
        ['Tissue-stiffness checks', 'for breast and liver: catch more, refer fewer'],
        ['Automatic artery screening', 'quick carotid measurements for stroke-risk checks'],
        ['Faster repeat exams', 'tools that cut set-up and comparison time'],
      ],
      cta: 'Request a quote for V7',
    },
    V8: {
      series: 'General Imaging',
      title: 'Samsung V8',
      models: 'Premium general imaging',
      desc: 'Our premium general-imaging system: excellent image quality and smart automation for a busy, high-volume clinic.',
      specs: [
        ['Crystal imaging', 'Samsung\'s top picture quality for clear, confident scans'],
        ['AI scan assistance', 'smart tools that speed up complex exams'],
        ['Great detail on tough cases', 'clear views on larger or difficult patients'],
        ['Smooth, mobile workflow', 'battery and sharing features for easy daily use'],
      ],
      cta: 'Request a quote for V8',
    },
    HS30: {
      series: 'Value Imaging',
      title: 'Samsung HS30',
      models: 'Dependable everyday scanning',
      desc: 'A reliable, no-fuss console for dependable everyday imaging at a price that fits a growing clinic. Built to run day in, day out.',
      specs: [
        ['Sharper 2D images', 'clearer pictures with less grain'],
        ['Clearer images with less noise', 'more even, consistent picture quality'],
        ['Large HD screen', '21.5-inch display for easy image review'],
        ['Covers many exam types', 'general, OB/GYN, vascular, cardiac, and urology'],
      ],
      cta: 'Request a quote for HS30',
    },
    HS40: {
      series: 'Value Imaging',
      title: 'Samsung HS40',
      models: '2D / 3D women\'s health, great value',
      desc: 'A capable, easy-to-use system for women\'s health and general imaging, putting proven 2D and 3D scanning within reach of a growing clinic.',
      specs: [
        ['Clearer images with less grain', 'even on harder-to-scan patients'],
        ['Sharper detail and contrast', 'so findings are easier to see'],
        ['2D and 3D scanning', 'for routine OB/GYN and women\'s health'],
        ['Simple to learn', 'so staff scan confidently and faster'],
      ],
      cta: 'Request a quote for HS40',
    },
    CV5: {
      series: 'Cardiovascular',
      title: 'Samsung CV5',
      models: 'Compact heart and vascular imaging',
      desc: 'A dedicated heart-and-vessel system for clinics that need reliable cardiac imaging and measurements in a smaller footprint.',
      specs: [
        ['Heart and vessel scanning', 'adult, paediatric, and peripheral-vessel exams'],
        ['Blood-flow analysis', 'Doppler tools for clear cardiovascular assessment'],
        ['Built-in measurements', 'tools for quick, accurate readings'],
        ['Flexible for general use', 'handles more than echo when you need it'],
      ],
      cta: 'Request a quote for CV5',
    },
    CV6: {
      series: 'Cardiovascular',
      title: 'Samsung CV6',
      models: 'Mid-tier heart and vascular imaging',
      desc: 'A dedicated heart system for echo and vascular labs that want AI-assisted heart measurements and a cardiology layout, at a mid-range price.',
      specs: [
        ['Clear cardiac imaging', 'genuine Samsung picture quality for the heart'],
        ['HeartAssist', 'AI that finds the right views and returns measurements for adult echo'],
        ['Automatic pump-function readings', 'fast, repeatable ejection-fraction results'],
        ['Heart-strain analysis', 'detailed wall-motion assessment for the whole heart'],
      ],
      cta: 'Request a quote for CV6',
    },
    CV7: {
      series: 'Cardiovascular',
      title: 'Samsung CV7',
      models: 'Advanced heart and vascular imaging',
      desc: 'A higher-performance heart system for echo labs and vascular work, with a wider toolkit for busy cardiac departments.',
      specs: [
        ['Confident cardiac imaging', 'strong picture quality for clear heart views'],
        ['Large display option', 'bigger screens for easier reading'],
        ['Heart measurements', 'analysis tools for adult and paediatric cardiac exams'],
        ['Vascular scanning', 'peripheral-vessel and shared-service exams'],
      ],
      cta: 'Request a quote for CV7',
    },
    CV8: {
      series: 'Cardiovascular',
      title: 'Samsung CV8',
      models: 'Premium heart and vascular imaging',
      desc: 'Our premium heart system for echo labs, cardiology clinics, and referral centres that need top imaging and full measurements.',
      specs: [
        ['Top cardiac and vascular imaging', 'excellent picture quality for the heart and vessels'],
        ['Automatic heart measurements', 'saves your sonographer time on every study'],
        ['Live blood-flow imaging', 'makes heart and vessel flow easy to see'],
        ['Full range of heart exams', 'adult, paediatric, TOE, and peripheral vessels'],
      ],
      cta: 'Request a quote for CV8',
    },
    HM70: {
      series: 'Portable Ultrasound',
      title: 'Samsung HM70 EVO',
      models: 'Carry-anywhere portable imaging',
      desc: 'A tough, high-quality portable scanner for anaesthesia, nerve blocks, MSK, thyroid, and mobile work, wherever speed and durability matter.',
      specs: [
        ['Goes where you need it', 'light enough to carry to bedside, theatre, or outreach'],
        ['High-quality images', 'clear 2D and colour from Samsung\'s larger systems'],
        ['Simple, quick to use', 'easy controls for urgent or mobile scanning'],
        ['Built tough', 'made for demanding bedside and field conditions'],
      ],
      cta: 'Get a quote for HM70',
    },
    EVOQ10: {
      series: 'Portable Ultrasound',
      title: 'Samsung EVO Q10',
      models: 'High-performance portable scanner',
      desc: 'A fast portable system for bedside and mobile care, built for clear images, quick exams, and easy cleaning between patients.',
      specs: [
        ['Crystal-clear portable images', 'confident reads on time-sensitive cases'],
        ['Fast and efficient', 'automated tools and quick workflow for busy days'],
        ['Ready at the bedside', 'built for high-pressure, mobile scanning'],
        ['Procedure and flow tools', 'needle guidance plus fine blood-flow imaging without dye'],
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
