/* ===================================
   Junto Comigo — script.js aprimorado
   =================================== */
(function () {
  "use strict";

  // Utilitários seguros
  const qs = (sel, el = document) => el.querySelector(sel);
  const qsa = (sel, el = document) => el.querySelectorAll(sel);
  const on = (el, event, handler, opts) => el && el.addEventListener(event, handler, opts || false);

  // Preferências do usuário
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const storage = {
    get(key) {
      try { return localStorage.getItem(key); } catch { return null; }
    },
    set(key, val) {
      try { localStorage.setItem(key, val); } catch {}
    }
  };

  // Estado da aplicação
  let state = {
    cart: [],
    theme: 'light'
  };

  // Elementos
  const navToggle = qs("#navToggle");
  const navList   = qs(".nav__list");
  const themeToggle = qs("#themeToggle");
  const backToTop = qs("#backToTop");
  const header = qs(".header");
  const form = qs("#contactForm");
  const formStatus = qs("#formStatus");
  const cartToggle = qs("#cartToggle");
  const miniCart = qs("#miniCart");
  const closeCart = qs("#closeCart");
  const loadingScreen = qs("#loadingScreen");
  const modal = qs("#modal");
  const modalOverlay = qs("#modalOverlay");
  const modalClose = qs("#modalClose");
  const modalTriggers = qsa(".modal-trigger");

  // ===== Inicialização =====
  function init() {
    // Carregar estado salvo
    loadSavedState();
    
    // Configurar eventos
    setupEvents();
    
    // Inicializar AOS
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 800,
        once: true,
        offset: 100,
        delay: 100
      });
    }
    
    // Esconder loading screen
    setTimeout(() => {
      if (loadingScreen) {
        loadingScreen.classList.add('loaded');
        setTimeout(() => {
          loadingScreen.style.display = 'none';
        }, 500);
      }
    }, 1000);
  }

  // ===== Carregar estado salvo =====
  function loadSavedState() {
    // Tema
    const savedTheme = storage.get("jc-theme");
    if (savedTheme) {
      state.theme = savedTheme;
      applyTheme(savedTheme);
    }
    
    // Carrinho
    const savedCart = storage.get("jc-cart");
    if (savedCart) {
      try {
        state.cart = JSON.parse(savedCart);
        updateCartUI();
      } catch (e) {
        console.error("Erro ao carregar carrinho:", e);
      }
    }
  }

  // ===== Configurar eventos =====
  function setupEvents() {
    // Navegação Mobile
    if (navToggle && navList) {
      on(navToggle, "click", toggleMobileMenu);
      qsa(".nav__list a").forEach(link => {
        on(link, "click", closeMobileMenu);
      });
    }

    // Header scroll
    on(window, "scroll", handleScroll, { passive: true });

    // Back to top
    if (backToTop) on(backToTop, "click", scrollToTop);

    // Tema
    if (themeToggle) on(themeToggle, "click", toggleTheme);

    // Scroll suave
    qsa('a[href^="#"]').forEach(a => {
      on(a, "click", handleSmoothScroll);
    });

    // Formulário
    if (form) on(form, "submit", handleFormSubmit);

    // Carrinho
    if (cartToggle) on(cartToggle, "click", toggleCart);
    if (closeCart) on(closeCart, "click", closeCartHandler);
    qsa('.card__action').forEach(btn => {
      on(btn, 'click', handleAddToCart);
    });

    // Modal
    if (modalOverlay) on(modalOverlay, "click", closeModal);
    if (modalClose) on(modalClose, "click", closeModal);
    modalTriggers.forEach(trigger => {
      on(trigger, "click", openModal);
    });

    // Fechar modal com ESC
    on(document, "keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }

  // ===== Navegação Mobile =====
  let lastFocused = null;
  function toggleMobileMenu() {
    if (!navList) return;
    
    if (navList.classList.contains("is-open")) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }

  function openMobileMenu() {
    lastFocused = document.activeElement;
    navList.classList.add("is-open");
    document.body.style.overflow = "hidden";
    navToggle.setAttribute("aria-expanded", "true");
    
    // Foco no primeiro link
    const firstLink = qs(".nav__list a");
    firstLink?.focus();
    
    // Escape fecha
    on(document, "keydown", handleEscapeClose, { once: true });
    // Trap de foco
    on(document, "focusin", trapFocus);
  }

  function closeMobileMenu() {
    navList.classList.remove("is-open");
    document.body.style.overflow = "";
    navToggle.setAttribute("aria-expanded", "false");
    if (lastFocused) lastFocused.focus();
    document.removeEventListener("focusin", trapFocus);
  }

  function handleEscapeClose(e) {
    if (e.key === "Escape") closeMobileMenu();
  }

  function trapFocus(e) {
    if (!navList.classList.contains("is-open")) return;
    if (!navList.contains(e.target) && e.target !== navToggle) {
      const first = qs(".nav__list a");
      first?.focus();
    }
  }

  // ===== Header scroll =====
  let lastY = 0;
  function handleScroll() {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (header) header.classList.toggle("is-scrolled", y > 24);
    
    // Mostrar voltar ao topo
    if (backToTop) backToTop.classList.toggle("is-visible", y > 500);
    
    // Header hide on scroll down
    if (y > 100 && y > lastY) {
      header.style.transform = "translateY(-100%)";
    } else {
      header.style.transform = "translateY(0)";
    }
    
    lastY = y;
  }

  // ===== Scroll suave =====
  function handleSmoothScroll(e) {
    const id = this.getAttribute("href");
    const target = id && qs(id);
    
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ 
        behavior: prefersReducedMotion ? "auto" : "smooth", 
        block: "start" 
      });
      
      // Fechar menu mobile se aberto
      if (navList && navList.classList.contains("is-open")) {
        closeMobileMenu();
      }
    }
  }

  // ===== Scroll to top =====
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  }

  // ===== Tema =====
  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle("theme-dark");
    state.theme = isDark ? "dark" : "light";
    storage.set("jc-theme", state.theme);
    themeToggle.setAttribute("aria-pressed", isDark ? "true" : "false");
  }

  function applyTheme(mode) {
    const root = document.documentElement;
    if (mode === "dark") {
      root.classList.add("theme-dark");
    } else {
      root.classList.remove("theme-dark");
    }
    themeToggle.setAttribute("aria-pressed", mode === "dark" ? "true" : "false");
  }

  // ===== Formulário =====
  function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).toLowerCase());
  }

  function setStatus(msg, ok = false) {
    if (!formStatus) return;
    formStatus.textContent = msg;
    formStatus.style.color = ok ? 'var(--jc-green)' : 'var(--jc-orange)';
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    if (!form) return;

    const name = qs("#name", form)?.value.trim();
    const email = qs("#email", form)?.value.trim();
    const phone = qs("#phone", form)?.value.trim();
    const message = qs("#message", form)?.value.trim();

    // Validação
    if (!name || name.length < 2) {
      setStatus("Por favor, informe seu nome completo.");
      qs("#name", form)?.focus();
      return;
    }
    if (!email || !isEmail(email)) {
      setStatus("Informe um e‑mail válido.");
      qs("#email", form)?.focus();
      return;
    }
    if (!message || message.length < 10) {
      setStatus("Descreva sua mensagem com pelo menos 10 caracteres.");
      qs("#message", form)?.focus();
      return;
    }

    // Simulação de envio
    setStatus("Mensagem enviada com sucesso! Retornaremos em breve.", true);
    
    // Reset form
    setTimeout(() => {
      form.reset();
      setStatus("");
    }, 3000);
  }

  // ===== Carrinho =====
  function toggleCart() {
    miniCart.classList.toggle('open');
    cartToggle.setAttribute('aria-expanded', 
      miniCart.classList.contains('open') ? 'true' : 'false');
  }

  function closeCartHandler() {
    miniCart.classList.remove('open');
    cartToggle.setAttribute('aria-expanded', 'false');
  }

  function handleAddToCart() {
    const plan = this.dataset.plan;
    const price = this.dataset.price;
    
    // Adicionar ao carrinho
    state.cart.push({
      id: Date.now(),
      plan,
      price: parseInt(price),
      date: new Date().toISOString()
    });
    
    // Salvar e atualizar UI
    storage.set("jc-cart", JSON.stringify(state.cart));
    updateCartUI();
    
    // Mostrar feedback
    showToast(`"${plan}" adicionado ao carrinho!`);
    
    // Abrir carrinho
    miniCart.classList.add('open');
    cartToggle.setAttribute('aria-expanded', 'true');
  }

  function updateCartUI() {
    const cartCount = qs('.cart-count');
    const cartEmpty = qs('.mini-cart__empty');
    const cartContent = qs('.mini-cart__content');
    
    if (cartCount) {
      cartCount.textContent = state.cart.length;
      cartCount.style.display = state.cart.length ? 'flex' : 'none';
    }
    
    if (state.cart.length === 0) {
      cartEmpty.style.display = 'block';
      cartContent.innerHTML = '';
    } else {
      cartEmpty.style.display = 'none';
      
      // Gerar conteúdo do carrinho
      let html = '<div class="mini-cart__items">';
      state.cart.forEach(item => {
        html += `
          <div class="mini-cart__item">
            <h4>${item.plan}</h4>
            <p>R$ ${item.price}</p>
          </div>
        `;
      });
      html += '</div>';
      
      cartContent.innerHTML = html;
    }
  }

  // ===== Modal =====
  function openModal(e) {
    e.preventDefault();
    const modalType = this.dataset.modal;
    
    // Carregar conteúdo baseado no tipo
    let title, content;
    
    switch(modalType) {
      case 'terms':
        title = 'Termos de Uso';
        content = `
          <h3>1. Aceitação dos Termos</h3>
          <p>Ao utilizar nossos serviços, você concorda com estes termos de uso.</p>
          <h3>2. Serviços Prestados</h3>
          <p>Oferecemos acompanhamento social profissional para eventos e ocasiões especiais.</p>
          <h3>3. Conduta do Usuário</h3>
          <p>É exigido comportamento respeitoso e apropriado em todos os encontros.</p>
        `;
        break;
      case 'privacy':
        title = 'Política de Privacidade';
        content = `
          <h3>1. Coleta de Informações</h3>
          <p>Coletamos apenas informações necessárias para fornecer nossos serviços.</p>
          <h3>2. Uso de Dados</h3>
          <p>Seus dados são utilizados apenas para melhorar sua experiência.</p>
          <h3>3. Segurança</h3>
          <p>Implementamos medidas rigorosas para proteger suas informações.</p>
        `;
        break;
      case 'security':
        title = 'Política de Segurança';
        content = `
          <h3>1. Verificação</h3>
          <p>Todos os profissionais passam por rigoroso processo de verificação.</p>
          <h3>2. Confidencialidade</h3>
          <p>Garantimos total discrição em todos os serviços prestados.</p>
          <h3>3. Suporte</h3>
          <p>Equipe de suporte disponível 24/7 para emergências.</p>
        `;
        break;
      default:
        title = 'Termos e Condições';
        content = '<p>Conteúdo não disponível.</p>';
    }
    
    // Atualizar modal
    qs('#modalTitle').textContent = title;
    qs('#modalBody').innerHTML = content;
    
    // Abrir modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // ===== Utilitários =====
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--jc-orange);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Animação de entrada
    setTimeout(() => {
      toast.style.opacity = '1';
    }, 10);
    
    // Remover após 3 segundos
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }

  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();