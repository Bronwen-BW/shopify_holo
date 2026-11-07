/* =====================================================================
 * TCG 主题交互脚本（原生 JS，无依赖，全部对接 Shopify 官方接口）
 * 模块：
 *   1. 昼夜模式切换（导航栏单一图标按钮 + localStorage 持久化）
 *   2. 路由顶部进度条
 *   3. 滚动时导航收缩 + 阴影
 *   4. Shopify 官方商品搜索展开与提交
 *   5. 移动端菜单
 *   6. 滚动揭示动画
 *   7. Hero 轮播（自动推进 + 分段点击 + 鼠标聚光）
 *   8. 通用商品卡 AJAX 加购（POST /cart/add.js + GET /cart.js）
 *   9. 预售倒计时
 *  10. 拍照搜卡入口
 *  11. 商品页数量选择器（支持按钮增减与手动输入）
 *  12. 商品页完整 SKU / 多规格联动（SKU 图文卡片 + 属性组 + 下拉框 + 主图/缩略图/价格/库存/URL 同步）
 *  13. 商品页官方表单 AJAX 加购 + “立即购买 (Buy it now)” 直达 /checkout
 *  14. 多图缩略图切换主图 + 单卡 3D 倾斜 + 收藏按钮
 *  15. 购物车数量调整/删除（/cart/change.js）与订单备注同步（/cart/update.js）
 *  16. 集合/搜索排序自动提交 + 筛选抽屉 + 登录找回密码切换 + 政策页签切换
 * ===================================================================== */
(function () {
  'use strict';

  var rootRoute = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) ? window.Shopify.routes.root : '/';

  function apiUrl(path) {
    var clean = path.replace(/^\//, '');
    return rootRoute.replace(/\/?$/, '/') + clean;
  }

  /* 通用：事件委托绑定 */
  function on(selector, event, handler, root) {
    (root || document).addEventListener(event, function (e) {
      var el = e.target && e.target.closest ? e.target.closest(selector) : null;
      if (el) handler.call(el, e, el);
    });
  }

  /* 通用：下一帧重新触发 CSS 动画 */
  function reflow(el) {
    void el.offsetWidth;
  }

  /* -------------------------------------------------------------------
   * 1. 黑夜 / 白天模式切换（导航栏单一图标按钮）
   * ----------------------------------------------------------------- */
  (function themeModeToggle() {
    var html = document.documentElement;
    var header = document.querySelector('[data-tcg-header]');
    var defaultMode = (header && header.getAttribute('data-default-theme')) || html.getAttribute('data-theme') || 'dark';

    function applyTheme(mode, persist) {
      var normalized = mode === 'light' ? 'light' : 'dark';
      html.setAttribute('data-theme', normalized);
      if (persist) {
        try { localStorage.setItem('tcg-theme', normalized); } catch (e) {}
      }
      document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
        var isLight = normalized === 'light';
        btn.setAttribute('aria-pressed', isLight ? 'true' : 'false');
        btn.setAttribute('title', isLight ? '切换到黑夜模式 (Switch to Dark Mode)' : '切换到白天模式 (Switch to Light Mode)');
        btn.setAttribute('aria-label', isLight ? '切换到黑夜模式' : '切换到白天模式');
      });
    }

    var saved = null;
    try { saved = localStorage.getItem('tcg-theme'); } catch (e) {}
    applyTheme(saved === 'light' || saved === 'dark' ? saved : defaultMode, false);

    on('[data-theme-toggle]', 'click', function () {
      var current = html.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      applyTheme(current === 'light' ? 'dark' : 'light', true);
    });
  })();

  /* -------------------------------------------------------------------
   * 2. 路由顶部进度条（页面加载时短暂演示）
   * ----------------------------------------------------------------- */
  (function routeProgress() {
    var bar = document.querySelector('.route-progress');
    if (!bar) return;
    bar.classList.add('route-progress-active');
    window.addEventListener('load', function () {
      setTimeout(function () {
        bar.classList.remove('route-progress-active');
      }, 900);
    });
  })();

  /* -------------------------------------------------------------------
   * 3. 滚动时导航收缩 + 阴影（仅主页保留漂浮收缩效果，其他页面固定在页面最前面）
   * ----------------------------------------------------------------- */
  (function scrollHeader() {
    var header = document.querySelector('[data-tcg-header]');
    if (!header) return;
    var inner = header.querySelector('._inner_1hxzp_10');
    if (!inner) return;
    var isHome = document.body && document.body.classList.contains('template-index');
    if (!isHome) {
      inner.classList.remove('_scrolled_1hxzp_27', '_compact_1hxzp_41');
      return;
    }
    function onScroll() {
      var scrolled = window.scrollY > 24;
      inner.classList.toggle('_scrolled_1hxzp_27', scrolled);
      inner.classList.toggle('_compact_1hxzp_41', scrolled);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  /* -------------------------------------------------------------------
   * 4. Shopify 商品搜索：展开输入、回车或点击提交到商城搜索页
   * ----------------------------------------------------------------- */
  (function searchToggle() {
    var form = document.querySelector('[data-shopify-search]');
    if (!form) return;
    var trigger = form.querySelector('[data-search-trigger]');
    var input = form.querySelector('input[name="q"]');
    if (!trigger || !input) return;

    trigger.addEventListener('click', function (event) {
      var opened = form.classList.contains('_searchOpen_1hxzp_45');
      if (!opened || !input.value.trim()) {
        event.preventDefault();
        form.classList.add('_searchOpen_1hxzp_45');
        input.focus();
      }
    });

    form.addEventListener('submit', function (event) {
      if (!input.value.trim()) {
        event.preventDefault();
        form.classList.add('_searchOpen_1hxzp_45');
        input.focus();
      }
    });

    input.addEventListener('blur', function () {
      if (!input.value.trim()) {
        form.classList.remove('_searchOpen_1hxzp_45');
      }
    });

    input.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        form.classList.remove('_searchOpen_1hxzp_45');
        input.blur();
      }
    });
  })();

  /* -------------------------------------------------------------------
   * 5. 移动端菜单与自定义导航标签排序同步
   * ----------------------------------------------------------------- */
  (function mobileMenuAndNavSort() {
    // 按 data-sort-order 对桌面端与移动端导航标签进行稳定排序
    function sortNavItems(containerSelector, itemSelector) {
      var list = document.querySelector(containerSelector);
      if (!list) return;
      var items = Array.prototype.slice.call(list.querySelectorAll(itemSelector));
      if (items.length <= 1) return;
      var sorted = items.slice().sort(function (a, b) {
        var sa = parseInt(a.getAttribute('data-sort-order') || '0', 10);
        var sb = parseInt(b.getAttribute('data-sort-order') || '0', 10);
        var da = parseInt(a.getAttribute('data-dom-index') || '0', 10);
        var db = parseInt(b.getAttribute('data-dom-index') || '0', 10);
        if (sa <= 0) sa = da || 999;
        if (sb <= 0) sb = db || 999;
        if (sa !== sb) return sa - sb;
        return da - db;
      });
      var changed = false;
      for (var i = 0; i < items.length; i++) {
        if (items[i] !== sorted[i]) { changed = true; break; }
      }
      if (changed) {
        sorted.forEach(function (el) { list.appendChild(el); });
      }
    }

    sortNavItems('[data-tcg-nav-list]', '[data-nav-item]');
    sortNavItems('[data-tcg-mobile-nav-list]', '[data-mobile-nav-item]');

    var trigger = document.querySelector('[data-menu-trigger]');
    var menu = document.querySelector('[data-mobile-menu]');
    if (!trigger || !menu) return;
    trigger.addEventListener('click', function () {
      var isOpen = menu.hasAttribute('hidden');
      if (isOpen) {
        menu.removeAttribute('hidden');
        trigger.setAttribute('aria-expanded', 'true');
      } else {
        menu.setAttribute('hidden', '');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
  })();

  /* -------------------------------------------------------------------
   * 6. 滚动揭示（data-reveal 进入视口后由隐藏转为可见）
   * ----------------------------------------------------------------- */
  (function revealOnScroll() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.setAttribute('data-reveal', 'in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.setAttribute('data-reveal', 'in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* -------------------------------------------------------------------
   * 7. Hero 轮播：自动 6s 推进 + 分段点击 + 鼠标聚光
   * ----------------------------------------------------------------- */
  (function heroCarousel() {
    var stage = document.querySelector('[data-hero]');
    if (!stage) return;
    var slides = Array.prototype.slice.call(stage.querySelectorAll('[data-slide]'));
    var segments = Array.prototype.slice.call(stage.querySelectorAll('[data-segment]'));
    if (!slides.length) return;
    var DURATION = 6000;
    var current = 0;
    var timer = null;

    function go(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        var active = i === current;
        slide.classList.toggle('_slideActive_n65qd_71', active);
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
        if (active) slide.removeAttribute('inert');
        else slide.setAttribute('inert', '');
      });
      segments.forEach(function (seg, i) {
        var active = i === current;
        seg.classList.toggle('_dotActive_tcg1', active);
        seg.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }

    function restart() {
      clearInterval(timer);
      if (slides.length > 1) {
        timer = setInterval(function () { go(current + 1); }, DURATION);
      }
    }

    segments.forEach(function (seg, i) {
      seg.addEventListener('click', function () {
        go(i);
        restart();
      });
    });

    stage.addEventListener('pointermove', function (e) {
      var rect = stage.getBoundingClientRect();
      stage.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width).toFixed(3));
      stage.style.setProperty('--my', ((e.clientY - rect.top) / rect.height).toFixed(3));
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearInterval(timer);
      else restart();
    });

    restart();
  })();

  /* -------------------------------------------------------------------
   * 8. Shopify 官方 AJAX 加购与支付流程核心（对齐参考模板 product-form.js / utilities.js / cart-icon.js）
   * ----------------------------------------------------------------- */
  var CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>';
  var PLUS_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"></path></svg>';

  /**
   * 对齐参考模板 assets/utilities.js 的 fetchConfig(type, config)
   */
  function fetchConfig(type, config) {
    var t = type || 'json';
    var cfg = config || {};
    var headers = Object.assign(
      { 'Content-Type': 'application/json', Accept: 'application/' + t },
      cfg.headers || {}
    );
    if (t === 'javascript') {
      headers['X-Requested-With'] = 'XMLHttpRequest';
      delete headers['Content-Type'];
    }
    return {
      method: 'POST',
      headers: headers,
      body: cfg.body
    };
  }

  function getThemeRoute(key, fallbackPath) {
    if (window.Theme && window.Theme.routes && window.Theme.routes[key]) {
      return window.Theme.routes[key];
    }
    if (window.Shopify && window.Shopify.routes && window.Shopify.routes[key]) {
      return window.Shopify.routes[key];
    }
    return apiUrl(fallbackPath);
  }

  function getInitialServerCart() {
    var el = document.getElementById('tcg-initial-cart-json');
    if (!el) return null;
    try { return JSON.parse(el.textContent); } catch (e) { return null; }
  }

  /**
   * 对齐参考模板 assets/cart-icon.js：更新购物车气泡数量并同步 sessionStorage('cart-count') 与 cart:update 事件
   */
  function updateCartCount(count, dispatchEventFlag) {
    var numCount = Math.max(0, parseInt(count, 10) || 0);
    var link = document.querySelector('[data-cart-link]');
    if (link) {
      var bubble = link.querySelector('[data-cart-count]');
      if (numCount > 0) {
        link.classList.add('_cartFilled_1hxzp_341');
        if (!bubble) {
          bubble = document.createElement('span');
          bubble.className = '_cartCount_1hxzp_345';
          bubble.setAttribute('data-cart-count', '');
          link.appendChild(bubble);
        }
        bubble.textContent = numCount < 100 ? String(numCount) : '99+';
        bubble.style.animation = 'none';
        reflow(bubble);
        bubble.style.animation = '';
      } else {
        link.classList.remove('_cartFilled_1hxzp_341');
        if (bubble) bubble.remove();
      }
    }
    var addedCount = document.querySelector('[data-added-cart-count]');
    if (addedCount) addedCount.textContent = String(numCount);

    try {
      sessionStorage.setItem('cart-count', JSON.stringify({
        value: String(numCount),
        timestamp: Date.now()
      }));
    } catch (e) {}

    if (dispatchEventFlag !== false && typeof CustomEvent === 'function') {
      try {
        document.dispatchEvent(new CustomEvent('cart:update', {
          bubbles: true,
          detail: { data: { itemCount: numCount } }
        }));
      } catch (e) {}
    }
  }

  // 对齐参考模板 assets/cart-icon.js 的 pageshow / sessionStorage 校验
  (function ensureCartBubbleSync() {
    function syncFromSessionOrInitial() {
      try {
        var raw = sessionStorage.getItem('cart-count');
        if (raw) {
          var parsed = JSON.parse(raw);
          if (parsed && Date.now() - Number(parsed.timestamp) < 10000) {
            var c = parseInt(parsed.value, 10);
            if (!isNaN(c) && c >= 0) {
              updateCartCount(c, false);
              return;
            }
          }
        }
      } catch (e) {}
      var initCart = getInitialServerCart();
      if (initCart && typeof initCart.item_count === 'number') {
        updateCartCount(initCart.item_count, false);
      }
    }
    syncFromSessionOrInitial();
    window.addEventListener('pageshow', function (event) {
      if (event && event.persisted) syncFromSessionOrInitial();
    });
  })();

  function flashSuccess(btn) {
    var isHero = btn.classList.contains('_addCta_n65qd_196');
    var svg = btn.querySelector('svg');
    if (isHero) {
      btn.classList.add('_done_n65qd_247');
    } else {
      btn.classList.add('_addBtnDone_36e53_390');
      if (svg) svg.outerHTML = CHECK_ICON;
    }
    setTimeout(function () {
      btn.classList.remove('_done_n65qd_247', '_addBtnDone_36e53_390');
      if (!isHero) {
        var check = btn.querySelector('svg');
        if (check) check.outerHTML = PLUS_ICON;
      }
    }, 1600);
  }

  /**
   * 对齐参考模板 assets/product-form.js (#processAddToCart & #fetchAndUpdateCartQuantity)：
   * 1. 构建 FormData（含 id、quantity、sections），使用 fetchConfig('javascript', { body: formData }) + Accept: 'text/html' 请求 Theme.routes.cart_add_url (/cart/add.js)
   * 2. 若当前环境不支持 FormData，则自动回退 JSON POST /cart/add.js
   * 3. 加购成功后立即请求 GET /cart.js 获取最新真实购物车数据，更新 data-cart-quantity 与头部购物车气泡，并派发 cart:update 事件
   */
  function addVariantToCart(variantId, quantity, formEl) {
    var qty = Math.max(1, parseInt(quantity, 10) || 1);
    var addUrl = getThemeRoute('cart_add_url', 'cart/add.js');
    var sectionIds = [];
    document.querySelectorAll('[data-tcg-cart-section][data-section-id], cart-items-component[data-section-id]').forEach(function (el) {
      var sid = el.getAttribute('data-section-id');
      if (sid && sectionIds.indexOf(sid) === -1) sectionIds.push(sid);
    });

    var reqPromise;
    if (typeof window.FormData === 'function') {
      var formData;
      try {
        formData = formEl ? new window.FormData(formEl) : new window.FormData();
      } catch (e) {
        formData = new window.FormData();
      }
      if (formData && typeof formData.set === 'function') {
        formData.set('id', String(variantId));
        formData.set('quantity', String(qty));
        if (sectionIds.length > 0 && typeof formData.append === 'function') {
          formData.append('sections', sectionIds.join(','));
        }
        var fetchCfg = fetchConfig('javascript', { body: formData });
        reqPromise = fetch(addUrl, {
          method: fetchCfg.method,
          headers: Object.assign({}, fetchCfg.headers, { Accept: 'text/html' }),
          body: fetchCfg.body
        });
      }
    }

    if (!reqPromise) {
      var payload = { id: Number(variantId) || String(variantId), quantity: qty };
      if (sectionIds.length > 0) payload.sections = sectionIds.join(',');
      reqPromise = fetch(addUrl, fetchConfig('json', { body: JSON.stringify(payload) }));
    }

    return reqPromise
      .then(function (response) {
        return response.json().then(function (data) {
          return { httpOk: response.ok, status: response.status, data: data };
        });
      })
      .then(function (resObj) {
        var data = resObj.data || {};
        if (data.status || !resObj.httpOk) {
          var errMsg = data.message || data.description || 'Unable to add item to cart.';
          if (typeof CustomEvent === 'function') {
            try {
              document.dispatchEvent(new CustomEvent('cart:error', {
                bubbles: true,
                detail: { data: { message: errMsg, errors: data.errors, description: data.description } }
              }));
            } catch (e) {}
          }
          return {
            ok: false,
            status: data.status || resObj.status,
            message: errMsg,
            description: data.description,
            errors: data.errors
          };
        }

        return fetch(apiUrl('cart.js'))
          .then(function (cr) { return cr.json(); })
          .then(function (cart) {
            if (cart && typeof cart.item_count === 'number') {
              updateCartCount(cart.item_count, true);
              var qtyInput = document.querySelector('[data-qty-input]');
              if (qtyInput && Array.isArray(cart.items)) {
                var matched = null;
                for (var i = 0; i < cart.items.length; i++) {
                  if (String(cart.items[i].variant_id) === String(variantId)) {
                    matched = cart.items[i];
                    break;
                  }
                }
                qtyInput.setAttribute('data-cart-quantity', String(matched ? matched.quantity : 0));
              }
            }
            return {
              ok: true,
              source: 'shopify',
              cart: cart,
              response: data
            };
          });
      });
  }

  on('[data-add]', 'click', function (e, btn) {
    e.preventDefault();
    e.stopPropagation();
    if (btn.disabled) return;
    var variantId = btn.getAttribute('data-variant') || btn.getAttribute('data-product-id');
    if (!variantId) return;
    btn.setAttribute('disabled', '');

    addVariantToCart(variantId, 1, null)
      .then(function (res) {
        if (res && res.ok) {
          flashSuccess(btn);
        } else {
          var productUrl = btn.getAttribute('data-product-url');
          if (productUrl) window.location.href = productUrl;
        }
      })
      .catch(function () {
        var productUrl = btn.getAttribute('data-product-url');
        if (productUrl) window.location.href = productUrl;
      })
      .finally(function () {
        btn.removeAttribute('disabled');
      });
  });

  /* -------------------------------------------------------------------
   * 9. 预售倒计时（data-countdown 携带 ISO 日期）
   * ----------------------------------------------------------------- */
  (function countdowns() {
    var nodes = document.querySelectorAll('[data-countdown]');
    if (!nodes.length) return;

    function tick() {
      nodes.forEach(function (node) {
        var strong = node.querySelector('strong');
        if (!strong) return;
        var target = new Date(node.getAttribute('data-countdown')).getTime();
        var diff = target - Date.now();
        if (diff <= 0) {
          strong.textContent = 'Available now';
          return;
        }
        var days = Math.floor(diff / 86400000);
        var hours = Math.floor((diff % 86400000) / 3600000);
        strong.textContent = days + 'd ' + hours + 'h';
      });
    }
    tick();
    setInterval(tick, 60000);
  })();

  /* -------------------------------------------------------------------
   * 10. 拍照搜卡：点击拍照按钮触发隐藏文件选择
   * ----------------------------------------------------------------- */
  (function photoSearch() {
    var trigger = document.querySelector('[data-photo-trigger]');
    var file = document.querySelector('[data-photo-file]');
    if (!trigger || !file) return;
    trigger.addEventListener('click', function () { file.click(); });
    file.addEventListener('change', function () {
      if (file.value) window.location.href = apiUrl('search');
    });
  })();

  /* -------------------------------------------------------------------
   * 11. 商品页数量选择器（按钮 + 输入框双向同步）
   * ----------------------------------------------------------------- */
  (function productQuantity() {
    var qty = document.querySelector('[data-quantity]');
    if (!qty) return;
    var input = qty.querySelector('[data-qty-input]');
    var valueSpan = qty.querySelector('[data-qty-value]');
    var minus = qty.querySelector('[data-qty-minus]');
    var plus = qty.querySelector('[data-qty-plus]');
    var n = 1;

    function getMaxAllowed() {
      var m = input ? parseInt(input.getAttribute('max'), 10) : 999;
      return (!isNaN(m) && m > 0) ? m : 999;
    }

    function render(fireChange) {
      var maxVal = getMaxAllowed();
      if (n < 1 || isNaN(n)) n = 1;
      if (n > maxVal) n = maxVal;
      if (input) {
        input.value = String(n);
        if (fireChange) {
          try { input.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}
        }
      }
      if (valueSpan) valueSpan.textContent = String(n);
      if (minus) minus.disabled = n <= 1;
      if (plus) plus.disabled = n >= maxVal;
    }

    if (minus) {
      minus.addEventListener('click', function () {
        if (n > 1) { n--; render(true); }
      });
    }
    if (plus) {
      plus.addEventListener('click', function () {
        if (n < getMaxAllowed()) { n++; render(true); }
      });
    }
    if (input) {
      input.addEventListener('change', function () {
        n = parseInt(input.value, 10) || 1;
        render(false);
      });
    }
    render(false);
  })();

  /* -------------------------------------------------------------------
   * 12. 商品页完整 SKU / 多规格切换与主图、价格、库存、URL 实时联动
   * ----------------------------------------------------------------- */
  function isVariantEffectiveAvailable(v, cardEl) {
    if (v && typeof v === 'object') {
      if (v.available === true || v.available === 'true') return true;
      if (v.raw_available === true || v.raw_available === 'true') return true;
      var policy = String(v.inventory_policy || '').toLowerCase();
      if (policy === 'continue') return true;
      var mgmt = String(v.inventory_management || '').trim();
      if (!mgmt) return true;
      var qty = Number(v.inventory_quantity);
      if (!isNaN(qty) && qty > 0) return true;
      return false;
    }
    if (cardEl && cardEl.getAttribute) {
      var attrAvail = cardEl.getAttribute('data-variant-available');
      if (attrAvail === 'true') return true;
      var attrPolicy = String(cardEl.getAttribute('data-variant-policy') || '').toLowerCase();
      if (attrPolicy === 'continue') return true;
      var attrTracked = String(cardEl.getAttribute('data-variant-tracked') || '').trim();
      if (!attrTracked) return true;
      var attrQty = Number(cardEl.getAttribute('data-variant-qty') || 0);
      if (!isNaN(attrQty) && attrQty > 0) return true;
      return false;
    }
    return true;
  }

  function normalizeOptionText(val) {
    return String(val == null ? '' : val).trim();
  }

  (function productSkuSystem() {
    var section = document.querySelector('[data-tcg-product-section]');
    if (!section) return;

    var jsonEl = section.querySelector('[data-product-variants-json]');
    var variants = [];
    if (jsonEl) {
      try { variants = JSON.parse(jsonEl.textContent); } catch (e) {}
    }

    var idInput = section.querySelector('[data-variant-id-input]');
    var addBtn = section.querySelector('[data-product-add]');
    var addBtnText = section.querySelector('[data-product-add-text]');
    var directCheckoutWrap = section.querySelector('[data-direct-checkout]');
    var acceleratedCheckoutContainer = section.querySelector('[ref="acceleratedCheckoutButtonContainer"], [data-accelerated-checkout-container]');
    var formErrorEl = section.querySelector('[data-product-form-error]');
    var mainImg = section.querySelector('[data-main-image]');
    var selectEl = section.querySelector('[data-variant-select]');
    var priceEl = section.querySelector('p[data-variant-price], ._price_4xdw3_473[data-variant-price]');
    var compareEl = section.querySelector('[data-variant-compare]');
    var stockBadge = section.querySelector('[data-variant-stock-badge]');
    var stockText = section.querySelector('[data-variant-stock-text]');
    var summaryStock = section.querySelector('[data-variant-summary-stock]');
    var kickerSkuWrap = section.querySelector('[data-kicker-sku-wrap]');
    var qtyInput = section.querySelector('[data-qty-input]');
    var skuHeaderLabel = section.querySelector('[data-sku-header-label]');

    function refreshOptionPillsAvailability(currentOptions) {
      if (!variants.length) return;
      var groups = Array.prototype.slice.call(section.querySelectorAll('.tcg-option-group'));
      groups.forEach(function (grp, groupIdx) {
        grp.querySelectorAll('[data-option-btn]').forEach(function (btn) {
          var candidateVal = normalizeOptionText(btn.getAttribute('data-option-value'));
          // 检查在当前其他维度固定时，该选项值是否存在可用变体；若无，再检查全局是否有任意包含该值的可用变体
          var hasExactAvailable = false;
          var hasAnyAvailable = false;
          for (var i = 0; i < variants.length; i++) {
            var v = variants[i];
            if (!Array.isArray(v.options)) continue;
            if (normalizeOptionText(v.options[groupIdx]) !== candidateVal) continue;
            var vAvail = isVariantEffectiveAvailable(v, null);
            if (vAvail) {
              hasAnyAvailable = true;
              var otherMatch = true;
              for (var k = 0; k < groups.length; k++) {
                if (k === groupIdx) continue;
                var curOpt = normalizeOptionText(currentOptions && currentOptions[k]);
                if (curOpt && normalizeOptionText(v.options[k]) !== curOpt) {
                  otherMatch = false;
                  break;
                }
              }
              if (otherMatch) {
                hasExactAvailable = true;
                break;
              }
            }
          }
          btn.classList.toggle('is-soldout', !hasAnyAvailable);
          btn.classList.toggle('is-combination-soldout', hasAnyAvailable && !hasExactAvailable);
        });
      });
    }

    function selectVariantById(variantId, updateHistory) {
      var idStr = String(variantId);
      var variant = null;
      for (var i = 0; i < variants.length; i++) {
        if (String(variants[i].id) === idStr) {
          variant = variants[i];
          break;
        }
      }

      if (formErrorEl) {
        formErrorEl.textContent = '';
        formErrorEl.setAttribute('hidden', '');
      }

      // 同步表单 hidden input 与按钮属性，并触发原生 change 事件供 Shopify 官方组件感知
      if (idInput) {
        idInput.value = idStr;
        idInput.setAttribute('value', idStr);
        try { idInput.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}
      }
      if (addBtn) {
        addBtn.setAttribute('data-variant', idStr);
        addBtn.setAttribute('data-variant-title', titleText || '');
        addBtn.setAttribute('data-variant-sku', skuCode && skuCode !== '—' ? skuCode : '');
        if (variant && variant.price !== undefined) addBtn.setAttribute('data-variant-price', String(variant.price));
        if (priceFormatted) addBtn.setAttribute('data-variant-price-formatted', priceFormatted);
        if (imgUrl) addBtn.setAttribute('data-product-image', imgUrl);
      }
      if (directCheckoutWrap) {
        directCheckoutWrap.setAttribute('data-variant', idStr);
      }
      if (selectEl && selectEl.value !== idStr) selectEl.value = idStr;

      // 同步 SKU 卡片选中态
      var activeCard = null;
      section.querySelectorAll('[data-sku-card]').forEach(function (card) {
        var matched = card.getAttribute('data-variant-id') === idStr;
        card.classList.toggle('is-active', matched);
        card.setAttribute('aria-checked', matched ? 'true' : 'false');
        if (matched) activeCard = card;
      });

      // 从 variant JSON 或卡片属性提取展示数据
      var skuCode = variant ? (variant.sku || '—') : (activeCard ? activeCard.getAttribute('data-variant-sku') : '—');
      var titleText = variant ? (variant.title === 'Default Title' ? 'Standard' : variant.title) : (activeCard ? activeCard.getAttribute('data-variant-title') : '');
      var priceFormatted = variant ? variant.price_formatted : (activeCard ? activeCard.getAttribute('data-variant-price') : '');
      var compareFormatted = variant ? variant.compare_at_price_formatted : (activeCard ? activeCard.getAttribute('data-variant-compare') : '');
      var isAvailable = isVariantEffectiveAvailable(variant, activeCard);
      var invQty = variant ? Number(variant.inventory_quantity || 0) : (activeCard ? Number(activeCard.getAttribute('data-variant-qty') || 0) : 0);
      var invPolicy = variant ? String(variant.inventory_policy || 'deny').toLowerCase() : (activeCard ? String(activeCard.getAttribute('data-variant-policy') || 'deny').toLowerCase() : 'deny');
      var tracked = variant ? Boolean(String(variant.inventory_management || '').trim()) : (activeCard ? Boolean(String(activeCard.getAttribute('data-variant-tracked') || '').trim()) : false);
      var imgUrl = variant ? variant.featured_image_url : (activeCard ? activeCard.getAttribute('data-variant-image') : '');
      var mediaId = variant && variant.featured_media_id ? String(variant.featured_media_id) : (activeCard ? activeCard.getAttribute('data-variant-media-id') : '');

      // 同步数量选择器上限（防止超过当前变体可用库存导致 Shopify 返回 422 报错）
      if (qtyInput) {
        var maxQty = (tracked && invPolicy !== 'continue' && invQty > 0) ? invQty : 999;
        qtyInput.setAttribute('max', String(maxQty));
        var curQty = parseInt(qtyInput.value, 10) || 1;
        if (curQty > maxQty) {
          qtyInput.value = String(maxQty);
          try { qtyInput.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}
        }
      }

      // 更新所有 SKU 编码与规格名称文本节点（排除按钮和隐藏卡片）
      section.querySelectorAll('strong[data-variant-sku], span[data-variant-sku]').forEach(function (el) {
        el.textContent = skuCode || '—';
      });
      if (kickerSkuWrap) {
        if (skuCode && skuCode !== '—') kickerSkuWrap.removeAttribute('hidden');
        else kickerSkuWrap.setAttribute('hidden', '');
      }
      section.querySelectorAll('strong[data-variant-title], span[data-variant-title]').forEach(function (el) {
        if (titleText) el.textContent = titleText;
      });

      // 更新价格与原价
      if (priceEl && priceFormatted) priceEl.textContent = priceFormatted;
      if (compareEl) {
        if (compareFormatted) {
          compareEl.textContent = compareFormatted;
          compareEl.removeAttribute('hidden');
        } else {
          compareEl.textContent = '';
          compareEl.setAttribute('hidden', '');
        }
      }

      // 更新库存状态徽章与购买按钮
      var isPreorder = addBtn && addBtn.getAttribute('data-preorder') === 'true';
      if (stockBadge && stockText) {
        stockBadge.classList.toggle('_stockLineOut_4xdw3_525', !isAvailable);
        if (isPreorder && isAvailable) {
          stockText.textContent = 'Pre-order';
        } else if (isAvailable) {
          stockText.textContent = tracked && invQty > 0 ? 'In stock (' + invQty + ')' : 'In stock';
        } else {
          stockText.textContent = 'Out of stock';
        }
      }
      if (summaryStock) {
        summaryStock.textContent = isAvailable ? 'Ready to ship' : 'Currently unavailable';
        summaryStock.className = isAvailable ? '_variantIn_4xdw3_615' : '_variantOut_4xdw3_619';
      }
      if (addBtn) {
        addBtn.disabled = !isAvailable;
        if (isAvailable) addBtn.removeAttribute('disabled');
        else addBtn.setAttribute('disabled', '');
        var labelTarget = addBtnText || addBtn;
        labelTarget.textContent = !isAvailable ? 'Sold out' : (isPreorder ? 'Pre-order' : 'Add to cart');
      }
      if (acceleratedCheckoutContainer) {
        if (!isAvailable) {
          acceleratedCheckoutContainer.setAttribute('hidden', 'true');
        } else {
          acceleratedCheckoutContainer.removeAttribute('hidden');
        }
      }
      if (directCheckoutWrap) {
        directCheckoutWrap.disabled = !isAvailable;
        if (isAvailable) directCheckoutWrap.removeAttribute('disabled');
        else directCheckoutWrap.setAttribute('disabled', '');
        directCheckoutWrap.style.pointerEvents = isAvailable ? '' : 'none';
        directCheckoutWrap.style.opacity = isAvailable ? '1' : '0.45';
      }

      // 同步多维属性胶囊高亮
      var currentOptions = [];
      if (variant && Array.isArray(variant.options)) {
        currentOptions = variant.options.slice();
        section.querySelectorAll('.tcg-option-group').forEach(function (grp, idx) {
          var val = normalizeOptionText(variant.options[idx]);
          if (!val) return;
          var selValEl = grp.querySelector('[data-option-selected-val]');
          if (selValEl) selValEl.textContent = val;
          grp.querySelectorAll('[data-option-btn]').forEach(function (btn) {
            btn.classList.toggle('is-selected', normalizeOptionText(btn.getAttribute('data-option-value')) === val);
          });
        });
      }
      refreshOptionPillsAvailability(currentOptions);

      if (skuHeaderLabel && variants.length > 0) {
        var availCount = 0;
        for (var c = 0; c < variants.length; c++) {
          if (isVariantEffectiveAvailable(variants[c], null)) availCount++;
        }
        skuHeaderLabel.textContent = 'Select SKU / Variant (' + (availCount > 0 ? availCount : variants.length) + ' available)';
      }

      // 更新主图与对应缩略图高亮
      if (mainImg && imgUrl) {
        mainImg.src = imgUrl;
      }
      if (mediaId) {
        section.querySelectorAll('[data-thumb]').forEach(function (t) {
          var active = t.getAttribute('data-media-id') === mediaId;
          t.classList.toggle('_thumbActive_4xdw3_239', active);
        });
      }

      // 同步浏览器 URL ?variant= 参数（Shopify 官方商品页约定）
      if (updateHistory !== false && window.history && window.history.replaceState) {
        try {
          var url = new URL(window.location.href);
          url.searchParams.set('variant', idStr);
          window.history.replaceState({}, '', url.toString());
        } catch (e) {}
      }
    }

    // 1) 点击 SKU 卡片
    on('[data-sku-card]', 'click', function (e, card) {
      var vid = card.getAttribute('data-variant-id');
      if (vid) selectVariantById(vid, true);
    }, section);

    // 2) 切换 SKU 下拉菜单
    if (selectEl) {
      selectEl.addEventListener('change', function () {
        selectVariantById(selectEl.value, true);
      });
    }

    // 3) 点击多维属性按钮（优先匹配有库存的组合；若精确组合缺货但所点维度在其他组合有货，也优先精确组合并如实反映该组合状态）
    on('[data-option-btn]', 'click', function (e, btn) {
      var group = btn.closest('.tcg-option-group');
      if (!group) return;
      group.querySelectorAll('[data-option-btn]').forEach(function (b) {
        b.classList.toggle('is-selected', b === btn);
      });
      var selectedOptions = [];
      section.querySelectorAll('.tcg-option-group').forEach(function (grp) {
        var active = grp.querySelector('[data-option-btn].is-selected');
        selectedOptions.push(active ? normalizeOptionText(active.getAttribute('data-option-value')) : '');
      });

      var exactAvailableVariant = null;
      var exactAnyVariant = null;
      for (var i = 0; i < variants.length; i++) {
        var v = variants[i];
        if (!Array.isArray(v.options)) continue;
        var allMatch = selectedOptions.every(function (opt, idx) {
          return !opt || normalizeOptionText(v.options[idx]) === opt;
        });
        if (allMatch) {
          if (!exactAnyVariant) exactAnyVariant = v;
          if (isVariantEffectiveAvailable(v, null)) {
            exactAvailableVariant = v;
            break;
          }
        }
      }

      var matchedVariant = exactAvailableVariant || exactAnyVariant;

      if (!matchedVariant) {
        var clickedPos = parseInt(btn.getAttribute('data-option-position'), 10) - 1;
        var clickedVal = normalizeOptionText(btn.getAttribute('data-option-value'));
        var fallbackAny = null;
        for (var j = 0; j < variants.length; j++) {
          var cand = variants[j];
          if (Array.isArray(cand.options) && normalizeOptionText(cand.options[clickedPos]) === clickedVal) {
            if (!fallbackAny) fallbackAny = cand;
            if (isVariantEffectiveAvailable(cand, null)) {
              matchedVariant = cand;
              break;
            }
          }
        }
        if (!matchedVariant) matchedVariant = fallbackAny;
      }

      if (matchedVariant) {
        selectVariantById(matchedVariant.id, true);
      }
    }, section);

    // 4) 点击缩略图时，同时检查是否有绑定该 media_id 的 SKU（优先选择该图下有货的变体）
    on('[data-thumb]', 'click', function (e, thumb) {
      var full = thumb.getAttribute('data-full');
      var mediaId = thumb.getAttribute('data-media-id');
      if (mainImg && full) mainImg.src = full;
      section.querySelectorAll('[data-thumb]').forEach(function (t) {
        t.classList.remove('_thumbActive_4xdw3_239');
      });
      thumb.classList.add('_thumbActive_4xdw3_239');

      if (mediaId && variants.length > 1) {
        var firstMediaVariant = null;
        var availMediaVariant = null;
        for (var i = 0; i < variants.length; i++) {
          if (String(variants[i].featured_media_id) === String(mediaId)) {
            if (!firstMediaVariant) firstMediaVariant = variants[i];
            if (isVariantEffectiveAvailable(variants[i], null)) {
              availMediaVariant = variants[i];
              break;
            }
          }
        }
        var targetMediaVariant = availMediaVariant || firstMediaVariant;
        if (targetMediaVariant) {
          selectVariantById(targetMediaVariant.id, true);
        }
      }
    }, section);

    // 5) 页面初始化同步：确保 URL ?variant= 或默认首个可用变体与胶囊、hidden input、价格、库存状态 100% 一致
    if (variants.length > 0) {
      var initialId = null;
      try {
        var params = new URLSearchParams(window.location.search);
        var urlVid = params.get('variant');
        if (urlVid) {
          for (var u = 0; u < variants.length; u++) {
            if (String(variants[u].id) === String(urlVid)) {
              initialId = variants[u].id;
              break;
            }
          }
        }
      } catch (e) {}

      if (!initialId && idInput && idInput.value) {
        for (var k = 0; k < variants.length; k++) {
          if (String(variants[k].id) === String(idInput.value)) {
            if (isVariantEffectiveAvailable(variants[k], null)) {
              initialId = variants[k].id;
            }
            break;
          }
        }
      }

      if (!initialId) {
        for (var m = 0; m < variants.length; m++) {
          if (isVariantEffectiveAvailable(variants[m], null)) {
            initialId = variants[m].id;
            break;
          }
        }
      }

      if (!initialId) {
        initialId = (idInput && idInput.value) ? idInput.value : variants[0].id;
      }

      selectVariantById(initialId, false);
    }
  })();

  /* -------------------------------------------------------------------
   * 13. 商品页官方表单 AJAX 加购 + Shopify 官方动态加速支付与直达结账（完全对齐参考模板 product-form.js + accelerated-checkout.liquid）
   * ----------------------------------------------------------------- */
  function getProductQuantity() {
    var qtyInput = document.querySelector('[data-qty-input]');
    if (qtyInput) {
      var v = parseInt(qtyInput.value, 10);
      if (v > 0) return v;
    }
    var qtyVal = document.querySelector('[data-qty-value]');
    if (qtyVal) {
      var n = parseInt(qtyVal.textContent, 10);
      if (n > 0) return n;
    }
    return 1;
  }

  function getOfficialCheckoutUrl(el) {
    if (el && el.getAttribute) {
      var officialAttr = el.getAttribute('data-official-checkout-url') || el.getAttribute('data-checkout-url');
      if (officialAttr) return officialAttr;
    }
    return getThemeRoute('cart_checkout_url', 'checkout');
  }

  on('[data-product-form]', 'submit', function (e, form) {
    // 若用户点击的是原生 name="checkout" 提交按钮，直接允许或引导至 Shopify 官方结账流程
    var submitter = e.submitter || document.activeElement;
    if (submitter && submitter.getAttribute && submitter.getAttribute('name') === 'checkout') {
      e.preventDefault();
      var directBtn = submitter;
      var directVidInput = form.querySelector('[data-variant-id-input]');
      var directVid = (directVidInput && directVidInput.value) || directBtn.getAttribute('data-variant');
      if (!directVid) return;
      var directQty = getProductQuantity();
      var targetCheckoutUrl = getOfficialCheckoutUrl(directBtn);
      directBtn.setAttribute('disabled', '');
      addVariantToCart(directVid, directQty, form)
        .then(function (res) {
          if (res && res.ok) {
            window.location.href = targetCheckoutUrl;
          } else {
            window.location.href = apiUrl('cart/' + directVid + ':' + directQty);
          }
        })
        .catch(function () {
          window.location.href = apiUrl('cart/' + directVid + ':' + directQty);
        })
        .finally(function () {
          directBtn.removeAttribute('disabled');
        });
      return;
    }

    e.preventDefault();
    var btn = form.querySelector('[data-product-add]');
    if (!btn || btn.disabled) return;
    var idInput = form.querySelector('[data-variant-id-input]');
    var variantId = (idInput && idInput.value) || btn.getAttribute('data-variant');
    if (!variantId) return;

    var quantity = getProductQuantity();
    var textEl = btn.querySelector('[data-product-add-text]') || btn;
    var originalText = textEl.textContent || 'Add to cart';
    var formErrorEl = form.querySelector('[data-product-form-error]');
    if (formErrorEl) {
      formErrorEl.textContent = '';
      formErrorEl.setAttribute('hidden', '');
    }

    btn.setAttribute('disabled', '');

    addVariantToCart(variantId, quantity, form)
      .then(function (res) {
        var notice = document.querySelector('[data-added-notice]');
        var noticeText = document.querySelector('[data-added-notice-text]');
        if (res && res.ok) {
          if (noticeText) {
            noticeText.textContent = (window.Theme && window.Theme.translations && window.Theme.translations.added) || 'Added to cart';
          }
          if (notice) {
            notice.removeAttribute('hidden');
            notice.hidden = false;
          }
          btn.classList.add('_primaryButtonDone_4xdw3_728');
          textEl.innerHTML = CHECK_ICON;
          setTimeout(function () {
            btn.classList.remove('_primaryButtonDone_4xdw3_728');
            textEl.textContent = originalText;
          }, 1600);
        } else if (formErrorEl) {
          formErrorEl.textContent = (res && res.message) ? res.message : 'Unable to add item to cart.';
          formErrorEl.removeAttribute('hidden');
        }
      })
      .catch(function () {
        if (formErrorEl) {
          formErrorEl.textContent = 'Network error while adding to cart. Please try again.';
          formErrorEl.removeAttribute('hidden');
        }
      })
      .finally(function () {
        btn.removeAttribute('disabled');
      });
  });

  // 备用直达结账按钮点击（当环境未渲染 {{ form | payment_button }} 时触发）：调用 /cart/add.js 加购后直达 Shopify 官方 /checkout（或 /cart/{variant_id}:{qty} 官方结账直链）
  on('[data-direct-checkout]', 'click', function (e, directWrap) {
    if (directWrap.disabled) return;
    e.preventDefault();
    e.stopPropagation();

    var form = directWrap.closest('form') || document.querySelector('[data-product-form]');
    var idInput = (form && form.querySelector('[data-variant-id-input]')) || document.querySelector('[data-variant-id-input]');
    var addBtn = (form && form.querySelector('[data-product-add]')) || document.querySelector('[data-product-add]');
    var formErrorEl = (form && form.querySelector('[data-product-form-error]')) || document.querySelector('[data-product-form-error]');
    var variantId = (idInput && idInput.value) || (addBtn && addBtn.getAttribute('data-variant')) || directWrap.getAttribute('data-variant');
    if (!variantId || (addBtn && addBtn.disabled)) return;

    if (formErrorEl) {
      formErrorEl.textContent = '';
      formErrorEl.setAttribute('hidden', '');
    }

    var quantity = getProductQuantity();
    var checkoutUrl = getOfficialCheckoutUrl(directWrap);
    directWrap.style.pointerEvents = 'none';
    directWrap.style.opacity = '0.7';

    addVariantToCart(variantId, quantity, form)
      .then(function (res) {
        if (res && res.ok) {
          window.location.href = checkoutUrl;
        } else if (formErrorEl && res && res.message) {
          formErrorEl.textContent = res.message;
          formErrorEl.removeAttribute('hidden');
        } else {
          window.location.href = apiUrl('cart/' + variantId + ':' + quantity);
        }
      })
      .catch(function () {
        window.location.href = apiUrl('cart/' + variantId + ':' + quantity);
      })
      .finally(function () {
        directWrap.style.pointerEvents = '';
        directWrap.style.opacity = '';
      });
  });

  /* -------------------------------------------------------------------
   * 14. 单卡 3D 倾斜与收藏切换
   * ----------------------------------------------------------------- */
  (function cardTilt() {
    var card = document.querySelector('[data-tilt-card]');
    if (!card) return;
    var media = card.closest('._productMedia_4xdw3_145');
    if (!media) return;
    var MAX = 12;
    media.addEventListener('pointermove', function (e) {
      var r = media.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top) / r.height;
      var ry = (px - 0.5) * 2 * MAX;
      var rx = -(py - 0.5) * 2 * MAX;
      card.style.setProperty('--tilt-y', ry.toFixed(2) + 'deg');
      card.style.setProperty('--tilt-x', rx.toFixed(2) + 'deg');
      card.style.setProperty('--shadow-x', (-ry * 1.2).toFixed(1) + 'px');
      card.style.setProperty('--shadow-y', (20 + Math.abs(rx)).toFixed(1) + 'px');
    });
    media.addEventListener('pointerleave', function () {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
      card.style.setProperty('--shadow-x', '0px');
      card.style.setProperty('--shadow-y', '20px');
    });
  })();

  on('[data-wishlist]', 'click', function (e, btn) {
    var active = btn.classList.toggle('_saveButtonActive_4xdw3_458');
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  /* -------------------------------------------------------------------
   * 15. 购物车与官方支付同步（完全对齐参考模板 component-cart-items.js / cart-note.js / cart-discount.js / cart-summary.liquid）
   * ----------------------------------------------------------------- */
  function detectCurrencyPrefix() {
    var sampleEl = document.querySelector('[data-currency-sample]');
    var sample = sampleEl ? sampleEl.getAttribute('data-currency-sample') : '';
    if (!sample) {
      var anyPriceEl = document.querySelector('p[data-variant-price], ._cardPrice_36e53_317, ._lineTotal_1z0wo_152, [data-summary-total]');
      sample = anyPriceEl ? anyPriceEl.textContent : '';
    }
    var m = String(sample || '').trim().match(/^([^\d\s-]+)/);
    return (m && m[1]) ? m[1] : '€';
  }

  function formatMoneyCents(cents) {
    var num = (Number(cents) || 0) / 100;
    return detectCurrencyPrefix() + num.toFixed(2);
  }

  function syncCartDomFromSectionHtml(sectionId, htmlString) {
    if (!sectionId || !htmlString || typeof DOMParser === 'undefined') return false;
    try {
      var doc = new DOMParser().parseFromString(htmlString, 'text/html');
      var newRoot = doc.querySelector('[data-tcg-cart-section], [data-tcg-checkout-section]') || doc.getElementById('shopify-section-' + sectionId);
      var curRoot = document.querySelector('[data-tcg-cart-section], [data-tcg-checkout-section]');
      if (newRoot && curRoot) {
        var newInner = newRoot.matches('[data-tcg-cart-section], [data-tcg-checkout-section]')
          ? newRoot
          : newRoot.querySelector('[data-tcg-cart-section], [data-tcg-checkout-section]');
        if (newInner) {
          curRoot.innerHTML = newInner.innerHTML;
          return true;
        }
      }
    } catch (e) {}
    return false;
  }

  /**
   * 对齐参考模板 assets/component-cart-items.js (updateQuantity)：
   * 发送 { line, quantity, sections, sections_url } 到 Theme.routes.cart_change_url (/cart/change.js)
   * 若返回 sections HTML 则无刷新更新当前购物车区块，同时更新购物车总件数、小计、总价与结账按钮状态
   */
  function updateCartLineQuantity(line, quantity, rowEl) {
    var cleanLine = Number(line);
    var cleanQty = Math.max(0, parseInt(quantity, 10) || 0);
    if (!cleanLine || isNaN(cleanLine)) return;

    var cartSection = document.querySelector('[data-tcg-cart-section], [data-tcg-checkout-section]');
    var sectionId = cartSection ? cartSection.getAttribute('data-section-id') : null;
    var sectionsToUpdate = sectionId ? [sectionId] : [];
    var changeUrl = getThemeRoute('cart_change_url', 'cart/change.js');
    if (!/\.js($|\?)/.test(changeUrl)) {
      changeUrl = changeUrl.replace(/\/?$/, '.js');
    }

    var bodyObj = {
      line: cleanLine,
      quantity: cleanQty,
      sections: sectionsToUpdate.join(','),
      sections_url: window.location.pathname
    };

    return fetch(changeUrl, fetchConfig('json', { body: JSON.stringify(bodyObj) }))
      .then(function (response) {
        return response.text();
      })
      .then(function (responseText) {
        var parsed = JSON.parse(responseText);
        if (parsed.errors) {
          var errEl = rowEl ? rowEl.querySelector('[data-cart-line-error]') : null;
          if (errEl) {
            errEl.textContent = typeof parsed.errors === 'string' ? parsed.errors : (parsed.message || 'Unable to update quantity.');
            errEl.removeAttribute('hidden');
          }
          if (rowEl) {
            var prevQty = rowEl.getAttribute('data-quantity') || '1';
            var inp = rowEl.querySelector('[data-cart-qty-input]');
            if (inp) inp.value = prevQty;
          }
          return;
        }

        // 若服务端返回了 Section Rendering HTML，优先用最新服务端 HTML 同步
        if (sectionId && parsed.sections && parsed.sections[sectionId]) {
          var morphed = syncCartDomFromSectionHtml(sectionId, parsed.sections[sectionId]);
          if (morphed) {
            updateCartCount(parsed.item_count || 0, true);
            return;
          }
        }

        // 否则直接根据返回的 cart JSON 更新 DOM 行与汇总金额
        if (cleanQty <= 0 && rowEl) {
          rowEl.remove();
        } else if (rowEl) {
          rowEl.setAttribute('data-quantity', String(cleanQty));
          var input = rowEl.querySelector('[data-cart-qty-input]');
          if (input) {
            input.value = String(cleanQty);
            input.setAttribute('data-cart-quantity', String(cleanQty));
          }
          var matchedLine = (parsed.items && parsed.items[cleanLine - 1]) ? parsed.items[cleanLine - 1] : null;
          var unitCents = matchedLine ? Number(matchedLine.final_price) : (parseInt(rowEl.getAttribute('data-unit-price'), 10) || 0);
          var lineCents = matchedLine ? Number(matchedLine.final_line_price) : (unitCents * cleanQty);
          var lineTotalEl = rowEl.querySelector('[data-row-line-total]');
          if (lineTotalEl) lineTotalEl.textContent = formatMoneyCents(lineCents);
        }

        var newCount = typeof parsed.item_count === 'number' ? parsed.item_count : 0;
        updateCartCount(newCount, true);

        if (newCount <= 0) {
          window.location.reload();
          return;
        }

        if (cartSection) {
          var headerCount = cartSection.querySelector('[data-cart-header-count]');
          if (headerCount) {
            headerCount.textContent = ' (' + newCount + (newCount === 1 ? ' item)' : ' items)');
          }
          cartSection.querySelectorAll('[data-summary-item-count]').forEach(function (el) {
            el.textContent = String(newCount);
          });
          if (typeof parsed.original_total_price === 'number') {
            cartSection.querySelectorAll('[data-summary-subtotal]').forEach(function (el) {
              el.textContent = formatMoneyCents(parsed.original_total_price);
            });
          }
          if (typeof parsed.total_price === 'number') {
            cartSection.querySelectorAll('[data-summary-total]').forEach(function (el) {
              el.textContent = formatMoneyCents(parsed.total_price);
            });
          }
          var checkoutBtn = cartSection.querySelector('[data-official-checkout-submit]');
          if (checkoutBtn) {
            checkoutBtn.disabled = newCount <= 0;
          }
        }
      })
      .catch(function () {
        window.location.reload();
      });
  }

  on('[data-cart-minus]', 'click', function (e, btn) {
    var row = btn.closest('[data-cart-row]');
    if (!row) return;
    var input = row.querySelector('[data-cart-qty-input]');
    var valEl = row.querySelector('._qtyValue_1z0wo_135');
    var cur = input ? parseInt(input.value, 10) : (valEl ? parseInt(valEl.textContent, 10) : 1);
    var q = Math.max(0, (cur || 1) - 1);
    updateCartLineQuantity(btn.getAttribute('data-line') || row.getAttribute('data-line'), q, row);
  });

  on('[data-cart-plus]', 'click', function (e, btn) {
    var row = btn.closest('[data-cart-row]');
    if (!row) return;
    var input = row.querySelector('[data-cart-qty-input]');
    var valEl = row.querySelector('._qtyValue_1z0wo_135');
    var cur = input ? parseInt(input.value, 10) : (valEl ? parseInt(valEl.textContent, 10) : 0);
    var q = (cur || 0) + 1;
    updateCartLineQuantity(btn.getAttribute('data-line') || row.getAttribute('data-line'), q, row);
  });

  on('[data-cart-qty-input]', 'change', function (e, input) {
    var row = input.closest('[data-cart-row]');
    var q = parseInt(input.value, 10);
    var cleanQ = isNaN(q) || q < 0 ? 0 : q;
    updateCartLineQuantity(input.getAttribute('data-line') || (row && row.getAttribute('data-line')), cleanQ, row);
  });

  on('[data-cart-remove]', 'click', function (e, btn) {
    var row = btn.closest('[data-cart-row]');
    updateCartLineQuantity(btn.getAttribute('data-line') || (row && row.getAttribute('data-line')), 0, row);
  });

  /**
   * 对齐参考模板 assets/cart-note.js：输入订单备注时防抖 200ms POST JSON { note } 到 Theme.routes.cart_update_url
   */
  var noteTimer = null;
  var noteAbortController = null;
  on('[data-cart-note]', 'input', function (e, textarea) {
    clearTimeout(noteTimer);
    noteTimer = setTimeout(function () {
      if (noteAbortController && typeof noteAbortController.abort === 'function') {
        noteAbortController.abort();
      }
      if (typeof AbortController === 'function') {
        noteAbortController = new AbortController();
      }
      var updateUrl = getThemeRoute('cart_update_url', 'cart/update.js');
      if (!/\.js($|\?)/.test(updateUrl)) {
        updateUrl = updateUrl.replace(/\/?$/, '.js');
      }
      var cfg = fetchConfig('json', { body: JSON.stringify({ note: textarea.value }) });
      if (noteAbortController) cfg.signal = noteAbortController.signal;
      fetch(updateUrl, cfg).catch(function () {});
    }, 200);
  });

  /**
   * 对齐参考模板 assets/cart-discount.js：应用与移除折扣码（POST { discount, sections } 到 Theme.routes.cart_update_url）
   */
  function getExistingDiscountCodes(wrapper) {
    var codes = [];
    (wrapper || document).querySelectorAll('[data-discount-code]').forEach(function (pill) {
      var c = pill.getAttribute('data-discount-code');
      if (c && codes.indexOf(c) === -1) codes.push(c);
    });
    return codes;
  }

  function applyOrUpdateDiscounts(discountList, wrapper, inputEl) {
    var sectionId = (wrapper && wrapper.getAttribute('data-section-id')) || '';
    var errEl = wrapper ? wrapper.querySelector('[data-cart-discount-error]') : null;
    if (errEl) errEl.setAttribute('hidden', '');

    var updateUrl = getThemeRoute('cart_update_url', 'cart/update.js');
    if (!/\.js($|\?)/.test(updateUrl)) {
      updateUrl = updateUrl.replace(/\/?$/, '.js');
    }

    var payload = {
      discount: discountList.join(',')
    };
    if (sectionId) payload.sections = [sectionId];

    return fetch(updateUrl, fetchConfig('json', { body: JSON.stringify(payload) }))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (inputEl && inputEl.value) {
          var codeVal = inputEl.value.trim();
          if (Array.isArray(data.discount_codes)) {
            var invalid = data.discount_codes.some(function (d) {
              return d && d.code === codeVal && d.applicable === false;
            });
            if (invalid) {
              inputEl.value = '';
              if (errEl) errEl.removeAttribute('hidden');
              return;
            }
          }
        }
        if (sectionId && data.sections && data.sections[sectionId]) {
          syncCartDomFromSectionHtml(sectionId, data.sections[sectionId]);
        } else if (typeof data.total_price === 'number') {
          document.querySelectorAll('[data-summary-total]').forEach(function (el) {
            el.textContent = formatMoneyCents(data.total_price);
          });
        }
      })
      .catch(function () {});
  }

  on('[data-apply-discount-btn]', 'click', function (e, btn) {
    e.preventDefault();
    var wrapper = btn.closest('[data-cart-discount-wrapper]') || document;
    var input = wrapper.querySelector('[data-cart-discount]');
    if (!input || !input.value.trim()) return;
    var code = input.value.trim();
    var existing = getExistingDiscountCodes(wrapper);
    if (existing.indexOf(code) === -1) existing.push(code);
    applyOrUpdateDiscounts(existing, wrapper, input);
  });

  on('[data-remove-discount]', 'click', function (e, btn) {
    e.preventDefault();
    var code = btn.getAttribute('data-remove-discount');
    var wrapper = btn.closest('[data-cart-discount-wrapper]') || document;
    var existing = getExistingDiscountCodes(wrapper).filter(function (c) { return c !== code; });
    applyOrUpdateDiscounts(existing, wrapper, null);
  });

  /* -------------------------------------------------------------------
   * 16. 排序下拉自动提交 / 筛选抽屉 / 登录找回密码切换 / 政策页签
   * ----------------------------------------------------------------- */
  on('[data-auto-submit]', 'change', function (e, sel) {
    var url = new URL(window.location.href);
    url.searchParams.set('sort_by', sel.value);
    window.location.href = url.toString();
  });

  (function filterDrawer() {
    var toggle = document.querySelector('[data-filter-toggle]');
    var rail = document.querySelector('._rail_1nz9z_318');
    if (!toggle || !rail) return;
    var scrim = null;

    function close() {
      rail.classList.remove('_railOpen_1nz9z_906');
      toggle.setAttribute('aria-expanded', 'false');
      if (scrim) { scrim.remove(); scrim = null; }
    }
    function open() {
      rail.classList.add('_railOpen_1nz9z_906');
      toggle.setAttribute('aria-expanded', 'true');
      scrim = document.createElement('div');
      scrim.className = '_scrim_1nz9z_885';
      scrim.addEventListener('click', close);
      document.body.appendChild(scrim);
    }

    toggle.addEventListener('click', function () {
      if (rail.classList.contains('_railOpen_1nz9z_906')) close();
      else open();
    });
    var closeBtn = rail.querySelector('._railClose_1nz9z_374');
    if (closeBtn) closeBtn.addEventListener('click', close);
  })();

  /* 登录页：找回密码面板切换 */
  (function authRecoverToggle() {
    var loginPanel = document.querySelector('[data-login-panel]');
    var recoverPanel = document.querySelector('[data-recover-panel]');
    if (!loginPanel || !recoverPanel) return;

    function showRecover(show) {
      if (show) {
        recoverPanel.removeAttribute('hidden');
        loginPanel.setAttribute('hidden', '');
      } else {
        loginPanel.removeAttribute('hidden');
        recoverPanel.setAttribute('hidden', '');
      }
    }

    if (window.location.hash === '#recover') showRecover(true);
    window.addEventListener('hashchange', function () {
      showRecover(window.location.hash === '#recover');
    });

    on('[data-toggle-recover]', 'click', function (e, link) {
      e.preventDefault();
      var toRecover = link.getAttribute('data-toggle-recover') === 'true';
      showRecover(toRecover);
    });
  })();

  /* Policy 页签高亮与平滑定位 */
  on('[data-policy-tab]', 'click', function (e, tab) {
    var nav = tab.closest('[data-policy-tabs]');
    if (!nav) return;
    nav.querySelectorAll('[data-policy-tab]').forEach(function (t) {
      t.classList.toggle('is-active', t === tab);
    });
  });
})();
