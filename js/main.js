/* ---------- 3D background with morphing organic sphere & connection particles ---------- */
const canvas = document.getElementById('bg-canvas');
let renderer, scene, camera, particles, morphMesh, mouseX = 0, mouseY = 0;
const particleCount = 1000;
let particlePositions, particleVelocities;

function init3D() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x040814, 0.08); // matches --bg
  
  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Organic Morphing 3D Mesh
  const morphGeometry = new THREE.IcosahedronGeometry(1.5, 4);
  // Store original positions for math wiggles
  const originalPositions = morphGeometry.attributes.position.clone();
  morphGeometry.userData = { originalPositions };

  const morphMaterial = new THREE.MeshBasicMaterial({
    color: 0x6366f1, // matches var(--line-active) / violet
    wireframe: true,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending
  });
  morphMesh = new THREE.Mesh(morphGeometry, morphMaterial);
  morphMesh.position.set(2.2, 0.2, -1);
  scene.add(morphMesh);

  // Floating particles
  const particleGeometry = new THREE.BufferGeometry();
  particlePositions = new Float32Array(particleCount * 3);
  particleVelocities = new Float32Array(particleCount * 3);
  const particleColors = new Float32Array(particleCount * 3);
  
  const color1 = new THREE.Color(0x3fd5e6); // cyan
  const color2 = new THREE.Color(0x8b5cf6); // violet

  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 15;
    particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 15;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 10;

    particleVelocities[i * 3] = (Math.random() - 0.5) * 0.005;
    particleVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.005;
    particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.005;

    const mixedColor = color1.clone().lerp(color2, Math.random());
    particleColors[i * 3] = mixedColor.r;
    particleColors[i * 3 + 1] = mixedColor.g;
    particleColors[i * 3 + 2] = mixedColor.b;
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

  const particleMaterial = new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending
  });

  particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  
  const time = Date.now() * 0.0006;

  // Slowly rotate structures
  if (particles) {
    particles.rotation.y = time * 0.15;
    particles.rotation.x = time * 0.08;
    
    // Slow drift of particle positions
    const pos = particles.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] += particleVelocities[i * 3];
      pos[i * 3 + 1] += particleVelocities[i * 3 + 1];
      pos[i * 3 + 2] += particleVelocities[i * 3 + 2];

      // Re-boundary limits
      if (Math.abs(pos[i * 3]) > 7.5) particleVelocities[i * 3] *= -1;
      if (Math.abs(pos[i * 3 + 1]) > 7.5) particleVelocities[i * 3 + 1] *= -1;
      if (Math.abs(pos[i * 3 + 2]) > 5) particleVelocities[i * 3 + 2] *= -1;
    }
    particles.geometry.attributes.position.needsUpdate = true;
  }

  // Morph organic mesh using sine displacement over time
  if (morphMesh) {
    morphMesh.rotation.y = time * 0.25;
    morphMesh.rotation.x = time * 0.15;
    
    const geom = morphMesh.geometry;
    const posAttr = geom.attributes.position;
    const orig = geom.userData.originalPositions;
    
    for (let i = 0; i < posAttr.count; i++) {
      const ox = orig.getX(i);
      const oy = orig.getY(i);
      const oz = orig.getZ(i);
      
      // Calculate coordinates-based offset
      const angle = Math.atan2(oy, ox);
      const wave = Math.sin(angle * 4 + time * 3.5) * Math.cos(oz * 3 + time * 2) * 0.16;
      
      // Add dynamic noise distortion
      const multiplier = 1 + wave;
      posAttr.setXYZ(i, ox * multiplier, oy * multiplier, oz * multiplier);
    }
    posAttr.needsUpdate = true;
  }

  // Responsive camera mouse tracking
  camera.position.x += (mouseX * 0.8 - camera.position.x) * 0.05;
  camera.position.y += (-mouseY * 0.8 - camera.position.y) * 0.05;
  camera.lookAt(scene.position);

  renderer.render(scene, camera);
}

window.addEventListener('mousemove', e => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

window.addEventListener('resize', () => {
  if (!camera) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Init 3D with catch safeguard
try {
  init3D();
} catch (e) {
  console.warn('3D initialization failed, falling back to static CSS glows.', e);
  canvas.style.display = 'none';
}

/* ---------- Spotlight mouse tracking for premium cards ---------- */
document.querySelectorAll('.bento-card, .svc-card, .svc-mini, .proj, .stat-card, .pricing-banner').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mx', `${x}px`);
    card.style.setProperty('--my', `${y}px`);
  });
});

/* ---------- Nav Scroll Active State ---------- */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

/* ---------- Burger menu ---------- */
const burger = document.getElementById('burger');
const navlinks = document.getElementById('navlinks');
if (burger && navlinks) {
  burger.addEventListener('click', () => {
    navlinks.classList.toggle('open');
  });
  navlinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navlinks.classList.remove('open');
    });
  });
}

/* ---------- Intersection Scroll Reveal ---------- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ---------- Numbers Incrementer (Smooth Eased Counter) ---------- */
function animateCounter(el) {
  const targetVal = parseFloat(el.dataset.count) || 0;
  const suffix = el.dataset.suffix || '';
  const prefix = el.dataset.prefix || '';
  const duration = 1600; // 1.6 seconds smooth count
  const startTime = performance.now();

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutCubic(progress);
    const currentVal = Math.floor(easedProgress * targetVal);

    el.textContent = prefix + currentVal + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = prefix + targetVal + suffix;
    }
  }

  el.textContent = prefix + '0' + suffix;
  requestAnimationFrame(update);
}

const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      countObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.25, rootMargin: '0px 0px -30px 0px' });

document.querySelectorAll('[data-count]').forEach(el => countObserver.observe(el));

/* ---------- Skill Bars observer ---------- */
const barObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const fillBar = entry.target;
      fillBar.style.width = fillBar.dataset.w + '%';
      barObserver.unobserve(fillBar);
    }
  });
}, { threshold: 0.4 });

document.querySelectorAll('.bar i').forEach(el => barObserver.observe(el));

/* ---------- Card 3D tilt interaction (Services cards) ---------- */
document.querySelectorAll('.svc-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    // apply 3d transforms
    card.style.transform = `perspective(1000px) rotateY(${(x - 0.5) * 14}deg) rotateX(${(0.5 - y) * 14}deg) translateY(-6px)`;
    card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    card.style.setProperty('--my', `${e.clientY - rect.top}px`);
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

/* ---------- Testimonials Carousel Drag-to-Scroll ---------- */
const slider = document.querySelector('.tst-grid');
const sliderContainer = document.querySelector('.tst-slider-container');
if (slider && sliderContainer) {
  let isDown = false;
  let startX;
  let currentTranslate = 0;
  let prevTranslate = 0;

  sliderContainer.addEventListener('mousedown', (e) => {
    isDown = true;
    slider.style.transition = 'none';
    startX = e.pageX;
  });

  window.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    slider.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
    
    // Bounds check to bounce back
    const containerWidth = sliderContainer.offsetWidth;
    const sliderWidth = slider.scrollWidth;
    const maxTranslate = 0;
    const minTranslate = -(sliderWidth - containerWidth + 24); // Account for gap

    if (currentTranslate > maxTranslate) {
      currentTranslate = maxTranslate;
    } else if (currentTranslate < minTranslate) {
      currentTranslate = sliderWidth > containerWidth ? minTranslate : maxTranslate;
    }
    
    slider.style.transform = `translateX(${currentTranslate}px)`;
    prevTranslate = currentTranslate;
  });

  sliderContainer.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX;
    const walk = (x - startX) * 1.4;
    currentTranslate = prevTranslate + walk;
    slider.style.transform = `translateX(${currentTranslate}px)`;
  });

  // Touch Support for mobile
  sliderContainer.addEventListener('touchstart', (e) => {
    isDown = true;
    slider.style.transition = 'none';
    startX = e.touches[0].pageX;
  });

  window.addEventListener('touchend', () => {
    if (!isDown) return;
    isDown = false;
    slider.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
    
    const containerWidth = sliderContainer.offsetWidth;
    const sliderWidth = slider.scrollWidth;
    const maxTranslate = 0;
    const minTranslate = -(sliderWidth - containerWidth + 24);

    if (currentTranslate > maxTranslate) {
      currentTranslate = maxTranslate;
    } else if (currentTranslate < minTranslate) {
      currentTranslate = sliderWidth > containerWidth ? minTranslate : maxTranslate;
    }
    
    slider.style.transform = `translateX(${currentTranslate}px)`;
    prevTranslate = currentTranslate;
  });

  sliderContainer.addEventListener('touchmove', (e) => {
    if (!isDown) return;
    const x = e.touches[0].pageX;
    const walk = (x - startX) * 1.2;
    currentTranslate = prevTranslate + walk;
    slider.style.transform = `translateX(${currentTranslate}px)`;
  });
}

/* ---------- Portfolio category filter logic ---------- */
const filterTabs = document.querySelectorAll('.filter-tab');
const projects = document.querySelectorAll('.proj-grid .proj');
if (filterTabs.length > 0 && projects.length > 0) {
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.filter;
      
      projects.forEach(proj => {
        const projCat = proj.dataset.category || '';
        const isMatched = (cat === 'all' || projCat.split(' ').includes(cat));
        
        if (isMatched) {
          proj.style.display = 'block';
          // trigger redraw to register transition
          void proj.offsetWidth;
          proj.style.opacity = '1';
          proj.style.transform = 'scale(1)';
        } else {
          proj.style.opacity = '0';
          proj.style.transform = 'scale(0.94)';
          setTimeout(() => {
            proj.style.display = 'none';
          }, 400);
        }
      });
    });
  });
}

/* ---------- Mailto fallback dynamic copy ---------- */
document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const href = link.getAttribute('href');
    const email = href.replace('mailto:', '');
    navigator.clipboard.writeText(email).catch(() => {});
    
    const originalText = link.innerHTML;
    link.innerHTML = '✓ Copied Email!';
    link.style.borderColor = 'var(--cyan)';
    setTimeout(() => {
      link.innerHTML = originalText;
      link.style.borderColor = '';
    }, 2000);
    
    window.location.href = href;
  });
});

/* ---------- Contact Enquiry form Web3Forms integration ---------- */
const form = document.getElementById('enquiry-form');
const successDiv = document.getElementById('form-success');
const errorDiv = document.getElementById('form-error');
const submitBtn = document.getElementById('submit-btn');
const chipsContainer = document.getElementById('services-chips');
const selectedServicesInput = document.getElementById('selected-services');

if (typeof CONFIG !== 'undefined') {
  const keyInput = document.querySelector('input[name="access_key"]');
  if (keyInput) {
    keyInput.value = CONFIG.WEB3FORMS_ACCESS_KEY || '';
  }
}

if (chipsContainer && selectedServicesInput) {
  const chips = chipsContainer.querySelectorAll('.service-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      chipsContainer.classList.remove('invalid-shake');
      
      const activeValues = Array.from(chips)
        .filter(c => c.classList.contains('active'))
        .map(c => c.dataset.value);
        
      selectedServicesInput.value = activeValues.join(', ');
    });
  });
}

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (selectedServicesInput && !selectedServicesInput.value) {
      if (chipsContainer) {
        chipsContainer.classList.remove('invalid-shake');
        void chipsContainer.offsetWidth;
        chipsContainer.classList.add('invalid-shake');
      }
      return;
    }
    
    if (errorDiv) errorDiv.style.display = 'none';
    
    if (submitBtn) {
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;
      const btnText = submitBtn.querySelector('span:first-child');
      if (btnText) btnText.textContent = 'Sending Message...';
    }
    
    const formData = new FormData(form);
    
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    })
    .then(response => {
      if (response.ok) return response.json();
      throw new Error('Server submission error');
    })
    .then(data => {
      if (data.success) {
        form.style.opacity = '0';
        form.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          form.style.display = 'none';
          if (successDiv) successDiv.style.display = 'flex';
        }, 350);
      } else {
        throw new Error(data.message || 'Submission rejected');
      }
    })
    .catch(error => {
      console.error('Enquiry Error:', error);
      if (submitBtn) {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        const btnText = submitBtn.querySelector('span:first-child');
        if (btnText) btnText.textContent = 'Send Message';
      }
      if (errorDiv) errorDiv.style.display = 'flex';
    });
  });
}

/* ---------- DevTools and Inspect Element Deterrents ---------- */
// Disable Right-Click Context Menu
window.addEventListener('contextmenu', e => e.preventDefault());

// Disable F12, Ctrl+Shift+I, Cmd+Alt+I (Inspect), Ctrl+Shift+J, etc.
window.addEventListener('keydown', e => {
  if (
    // F12
    e.key === 'F12' ||
    // Ctrl+Shift+I (Windows/Linux) or Cmd+Alt+I (Mac)
    (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) ||
    (e.metaKey && e.altKey && (e.key === 'i' || e.key === 'I')) ||
    // Ctrl+Shift+J (Console Windows/Linux) or Cmd+Alt+J (Mac)
    (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) ||
    (e.metaKey && e.altKey && (e.key === 'j' || e.key === 'J')) ||
    // Ctrl+U (View Source Windows/Linux) or Cmd+Alt+U (Mac)
    (e.ctrlKey && (e.key === 'u' || e.key === 'U')) ||
    (e.metaKey && e.altKey && (e.key === 'u' || e.key === 'U')) ||
    // Ctrl+Shift+C (Inspect Element Windows/Linux) or Cmd+Alt+C (Mac)
    (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) ||
    (e.metaKey && e.altKey && (e.key === 'c' || e.key === 'C'))
  ) {
    e.preventDefault();
  }
});