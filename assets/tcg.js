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
   * 8. Shopify 官方 AJAX 加购与 Storefront Cart API 双通道官方支付核心（对齐参考模板 product-form.js / utilities.js / cart-icon.js）
   * ----------------------------------------------------------------- */
  var CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>';
  var PLUS_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"></path></svg>';
  var SF_CART_STORAGE_KEY = 'tcg-sf-official-cart-v1';
  var DEFAULT_SF_ACCESS_TOKEN = '62beeb8383e9513ae4ae60d687c2ac8b';

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
    if (window.TCG_ROUTES && window.TCG_ROUTES[key]) {
      return window.TCG_ROUTES[key];
    }
    return apiUrl(fallbackPath);
  }

  var SF_CART_STORAGE_KEY = 'tcg-sf-cart-v1';
  var BUY_NOW_CART_STORAGE_KEY = 'tcg-buy-now-cart-v1';
  var LOCAL_NOTE_KEY = 'tcg-order-note-v1';
  var LOCAL_DISCOUNTS_KEY = 'tcg-discount-codes-v1';
  var DEFAULT_SF_ACCESS_TOKEN = '62beeb8383e9513ae4ae60d687c2ac8b';

  function isBuyNowIntermediatePage() {
    try {
      var searchStr = (window.location && window.location.search) ? String(window.location.search) : '';
      return /(?:^\?|&)buy_now=1(?:&|$)/.test(searchStr);
    } catch (e) {
      return false;
    }
  }

  function getActiveStorefrontStorageKey() {
    return isBuyNowIntermediatePage() ? BUY_NOW_CART_STORAGE_KEY : SF_CART_STORAGE_KEY;
  }

  function loadSavedOrderNote() {
    try { return localStorage.getItem(LOCAL_NOTE_KEY) || ''; } catch (e) { return ''; }
  }

  function saveOrderNoteLocal(noteStr) {
    try { localStorage.setItem(LOCAL_NOTE_KEY, String(noteStr == null ? '' : noteStr)); } catch (e) {}
  }

  function loadSavedDiscountCodes() {
    try {
      var raw = localStorage.getItem(LOCAL_DISCOUNTS_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.filter(Boolean) : [];
    } catch (e) {
      return [];
    }
  }

  function saveDiscountCodesLocal(codes) {
    try {
      var clean = Array.isArray(codes) ? codes.map(function (c) { return String(c || '').trim(); }).filter(Boolean) : [];
      localStorage.setItem(LOCAL_DISCOUNTS_KEY, JSON.stringify(clean));
    } catch (e) {}
  }

  function buildCheckoutUrlWithNoteAndDiscount(baseUrl, noteVal, discountCodes) {
    var resultUrl = baseUrl || getThemeRoute('cart_checkout_url', 'checkout');
    var codes = Array.isArray(discountCodes)
      ? discountCodes.map(function (c) { return String(c && typeof c === 'object' ? c.code : c || '').trim(); }).filter(Boolean)
      : [];
    var cleanNote = String(noteVal == null ? '' : noteVal).trim();
    if (!codes.length && !cleanNote) return resultUrl;

    var hashIdx = resultUrl.indexOf('#');
    var hashPart = hashIdx >= 0 ? resultUrl.slice(hashIdx) : '';
    var withoutHash = hashIdx >= 0 ? resultUrl.slice(0, hashIdx) : resultUrl;
    var qIdx = withoutHash.indexOf('?');
    var pathPart = qIdx >= 0 ? withoutHash.slice(0, qIdx) : withoutHash;
    var queryStr = qIdx >= 0 ? withoutHash.slice(qIdx + 1) : '';

    var pairs = queryStr ? queryStr.split('&').filter(Boolean) : [];
    var filtered = pairs.filter(function (p) {
      var k = p.split('=')[0];
      return k !== 'discount' && k !== 'note';
    });
    if (codes.length > 0) {
      filtered.push('discount=' + encodeURIComponent(codes.join(',')));
    }
    if (cleanNote) {
      filtered.push('note=' + encodeURIComponent(cleanNote));
    }
    return pathPart + (filtered.length ? '?' + filtered.join('&') : '') + hashPart;
  }

  function getStorefrontAccessToken() {
    if (window.TCG_ROUTES && window.TCG_ROUTES.storefront_access_token) {
      return window.TCG_ROUTES.storefront_access_token;
    }
    if (window.Theme && window.Theme.routes && window.Theme.routes.storefront_access_token) {
      return window.Theme.routes.storefront_access_token;
    }
    return DEFAULT_SF_ACCESS_TOKEN;
  }

  function getStorefrontGraphqlUrl() {
    if (window.TCG_ROUTES && window.TCG_ROUTES.storefront_graphql_url) {
      return window.TCG_ROUTES.storefront_graphql_url;
    }
    return apiUrl('api/2024-10/graphql.json');
  }

  function toVariantGid(variantId) {
    var s = String(variantId || '').trim();
    if (s.indexOf('gid://shopify/ProductVariant/') === 0) return s;
    var num = s.replace(/^.*\//, '');
    return 'gid://shopify/ProductVariant/' + num;
  }

  function extractNumericId(idOrGid) {
    var s = String(idOrGid || '').trim();
    var idx = s.lastIndexOf('/');
    return idx >= 0 ? s.slice(idx + 1) : s;
  }

  function loadSavedStorefrontCart(storageKeyOverride) {
    var key = storageKeyOverride || getActiveStorefrontStorageKey();
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return (parsed && parsed.id) ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  function saveStorefrontCart(cartObj, storageKeyOverride) {
    var key = storageKeyOverride || getActiveStorefrontStorageKey();
    try {
      if (!cartObj || !cartObj.id) {
        localStorage.removeItem(key);
        return;
      }
      localStorage.setItem(key, JSON.stringify(cartObj));
    } catch (e) {}
  }

  var SF_CART_FRAGMENT = [
    'fragment CartFields on Cart {',
    '  id',
    '  checkoutUrl',
    '  totalQuantity',
    '  note',
    '  attributes { key value }',
    '  discountCodes { code applicable }',
    '  discountAllocations {',
    '    discountedAmount { amount currencyCode }',
    '  }',
    '  cost {',
    '    subtotalAmount { amount currencyCode }',
    '    totalAmount { amount currencyCode }',
    '  }',
    '  lines(first: 100) {',
    '    nodes {',
    '      id',
    '      quantity',
    '      attributes { key value }',
    '      discountAllocations {',
    '        discountedAmount { amount currencyCode }',
    '      }',
    '      cost {',
    '        amountPerQuantity { amount currencyCode }',
    '        subtotalAmount { amount currencyCode }',
    '        totalAmount { amount currencyCode }',
    '      }',
    '      merchandise {',
    '        ... on ProductVariant {',
    '          id',
    '          title',
    '          sku',
    '          price { amount currencyCode }',
    '          image { url altText }',
    '          product { title handle }',
    '        }',
    '      }',
    '    }',
    '  }',
    '}'
  ].join('\n');

  function executeStorefrontGraphql(query, variables) {
    var token = getStorefrontAccessToken();
    if (!token) return Promise.reject(new Error('No Storefront Access Token'));
    return fetch(getStorefrontGraphqlUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Shopify-Storefront-Access-Token': token
      },
      body: JSON.stringify({ query: query, variables: variables || {} })
    }).then(function (r) {
      return r.json();
    });
  }

  function normalizeStorefrontCart(sfCart, storageKeyOverride) {
    if (!sfCart || !sfCart.id) return null;
    var lines = (sfCart.lines && Array.isArray(sfCart.lines.nodes)) ? sfCart.lines.nodes : [];
    var rawSubtotalCents = 0;
    var totalLineDiscountCents = 0;

    var items = lines.map(function (node) {
      var merch = node.merchandise || {};
      var prod = merch.product || {};
      var qtyNum = Number(node.quantity) || 1;
      var unitAmt = (node.cost && node.cost.amountPerQuantity && node.cost.amountPerQuantity.amount)
        ? parseFloat(node.cost.amountPerQuantity.amount)
        : (merch.price && merch.price.amount ? parseFloat(merch.price.amount) : 0);
      var lineSubAmt = (node.cost && node.cost.subtotalAmount && node.cost.subtotalAmount.amount)
        ? parseFloat(node.cost.subtotalAmount.amount)
        : (unitAmt * qtyNum);
      var lineTotAmt = (node.cost && node.cost.totalAmount && node.cost.totalAmount.amount)
        ? parseFloat(node.cost.totalAmount.amount)
        : lineSubAmt;

      var unitCents = Math.round((isNaN(unitAmt) ? 0 : unitAmt) * 100);
      var origLineCents = Math.round((isNaN(lineSubAmt) ? 0 : lineSubAmt) * 100);
      var finalLineCents = Math.round((isNaN(lineTotAmt) ? 0 : lineTotAmt) * 100);
      var lineDiscCents = Math.max(0, origLineCents - finalLineCents);

      rawSubtotalCents += origLineCents;
      totalLineDiscountCents += lineDiscCents;

      var vidNum = extractNumericId(merch.id || '');
      return {
        line_id: node.id,
        variant_id: vidNum,
        variant_gid: merch.id || toVariantGid(vidNum),
        quantity: qtyNum,
        product_title: prod.title || 'Product',
        variant_title: (merch.title && merch.title !== 'Default Title') ? merch.title : '',
        sku: merch.sku || '',
        original_price: unitCents,
        final_price: qtyNum > 0 ? Math.round(finalLineCents / qtyNum) : unitCents,
        original_line_price: origLineCents,
        final_line_price: finalLineCents,
        line_discount: lineDiscCents,
        attributes: Array.isArray(node.attributes) ? node.attributes : [],
        image: (merch.image && merch.image.url) ? merch.image.url : '',
        url: prod.handle ? apiUrl('products/' + prod.handle) : apiUrl('collections/all')
      };
    });

    var subAmt = (sfCart.cost && sfCart.cost.subtotalAmount && sfCart.cost.subtotalAmount.amount)
      ? parseFloat(sfCart.cost.subtotalAmount.amount)
      : (rawSubtotalCents / 100);
    var totAmt = (sfCart.cost && sfCart.cost.totalAmount && sfCart.cost.totalAmount.amount)
      ? parseFloat(sfCart.cost.totalAmount.amount)
      : subAmt;

    var cartLevelDiscCents = 0;
    if (Array.isArray(sfCart.discountAllocations)) {
      sfCart.discountAllocations.forEach(function (da) {
        var dAmt = da && da.discountedAmount && da.discountedAmount.amount ? parseFloat(da.discountedAmount.amount) : 0;
        if (!isNaN(dAmt) && dAmt > 0) cartLevelDiscCents += Math.round(dAmt * 100);
      });
    }

    var finalTotalCents = Math.round((isNaN(totAmt) ? 0 : totAmt) * 100);
    var origSubtotalCents = rawSubtotalCents > 0 ? rawSubtotalCents : Math.round((isNaN(subAmt) ? 0 : subAmt) * 100);
    var totalDiscountCents = Math.max(totalLineDiscountCents + cartLevelDiscCents, Math.max(0, origSubtotalCents - finalTotalCents));

    var noteStr = sfCart.note || loadSavedOrderNote() || '';
    if (sfCart.note !== undefined && sfCart.note !== null) {
      saveOrderNoteLocal(sfCart.note);
    }

    var discCodes = Array.isArray(sfCart.discountCodes) ? sfCart.discountCodes : [];
    var applicableCodes = discCodes.filter(function (d) { return d && d.code && d.applicable !== false; }).map(function (d) { return d.code; });
    if (applicableCodes.length > 0) {
      saveDiscountCodesLocal(applicableCodes);
    }

    var enrichedCheckoutUrl = buildCheckoutUrlWithNoteAndDiscount(
      sfCart.checkoutUrl || getThemeRoute('cart_checkout_url', 'checkout'),
      noteStr,
      applicableCodes.length > 0 ? applicableCodes : loadSavedDiscountCodes()
    );

    var normalized = {
      id: sfCart.id,
      rawCheckoutUrl: sfCart.checkoutUrl || getThemeRoute('cart_checkout_url', 'checkout'),
      checkoutUrl: enrichedCheckoutUrl,
      item_count: Number(sfCart.totalQuantity) || 0,
      note: noteStr,
      discount_codes: discCodes,
      original_total_price: origSubtotalCents,
      total_discount: totalDiscountCents,
      total_price: finalTotalCents,
      items: items
    };
    saveStorefrontCart(normalized, storageKeyOverride);
    return normalized;
  }

  function addVariantViaStorefrontCartApi(variantId, quantity) {
    var qty = Math.max(1, parseInt(quantity, 10) || 1);
    var merchGid = toVariantGid(variantId);
    var saved = loadSavedStorefrontCart();

    function createNewSfCart() {
      var savedNote = loadSavedOrderNote();
      var savedDiscounts = loadSavedDiscountCodes();
      var lineItemInput = { merchandiseId: merchGid, quantity: qty };
      if (savedNote) {
        lineItemInput.attributes = [{ key: 'Order Note', value: savedNote }];
      }
      var cartInput = {
        lines: [lineItemInput]
      };
      if (savedNote) {
        cartInput.note = savedNote;
        cartInput.attributes = [{ key: 'Order Note', value: savedNote }];
      }
      if (savedDiscounts.length > 0) {
        cartInput.discountCodes = savedDiscounts;
      }
      var createMut = SF_CART_FRAGMENT + '\nmutation CartCreate($input: CartInput!) {\n  cartCreate(input: $input) {\n    cart { ...CartFields }\n    userErrors { field message code }\n  }\n}';
      return executeStorefrontGraphql(createMut, {
        input: cartInput
      }).then(function (res) {
        var payload = res && res.data && res.data.cartCreate;
        if (payload && payload.cart) {
          var norm = normalizeStorefrontCart(payload.cart);
          updateCartCount(getCombinedCartItemCount(null, norm), true);
          syncCheckoutLinksWithUrl(norm.checkoutUrl);
          return {
            ok: true,
            source: 'storefront_api',
            checkoutUrl: norm.checkoutUrl,
            cart: norm
          };
        }
        var uErr = (payload && payload.userErrors && payload.userErrors[0]) ? payload.userErrors[0].message : 'Unable to add item to cart.';
        return { ok: false, message: uErr };
      });
    }

    if (saved && saved.id) {
      var savedNoteForLine = saved.note || loadSavedOrderNote();
      var addLineItem = { merchandiseId: merchGid, quantity: qty };
      if (savedNoteForLine) {
        addLineItem.attributes = [{ key: 'Order Note', value: savedNoteForLine }];
      }
      var addLinesMut = SF_CART_FRAGMENT + '\nmutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {\n  cartLinesAdd(cartId: $cartId, lines: $lines) {\n    cart { ...CartFields }\n    userErrors { field message code }\n  }\n}';
      return executeStorefrontGraphql(addLinesMut, {
        cartId: saved.id,
        lines: [addLineItem]
      }).then(function (res) {
        var payload = res && res.data && res.data.cartLinesAdd;
        if (payload && payload.cart) {
          var norm = normalizeStorefrontCart(payload.cart);
          updateCartCount(getCombinedCartItemCount(null, norm), true);
          syncCheckoutLinksWithUrl(norm.checkoutUrl);
          return {
            ok: true,
            source: 'storefront_api',
            checkoutUrl: norm.checkoutUrl,
            cart: norm
          };
        }
        return createNewSfCart();
      }).catch(function () {
        return createNewSfCart();
      });
    }

    return createNewSfCart();
  }

  /**
   * 立即购买（Buy it now）专属：创建仅包含当前商品与数量的单品独立官方支付会话（Single-item Checkout Session）
   * 保存在 BUY_NOW_CART_STORAGE_KEY，并引导用户进入与购物车同款界面的单品确认中间页（/cart?buy_now=1），支持输入备注、折扣码、增减数量后再跳转至官方支付收银台
   * 绝不把当前商品追加到已有购物车，也绝不把购物车内已有的其他商品带入本次立即购买
   */
  function createBuyNowStandaloneCheckoutUrl(variantId, quantity) {
    var qty = Math.max(1, parseInt(quantity, 10) || 1);
    var merchGid = toVariantGid(variantId);
    var savedNote = loadSavedOrderNote();
    var savedDiscounts = loadSavedDiscountCodes();
    var lineItemInput = { merchandiseId: merchGid, quantity: qty };
    if (savedNote) {
      lineItemInput.attributes = [{ key: 'Order Note', value: savedNote }];
    }
    var cartInput = {
      lines: [lineItemInput]
    };
    if (savedNote) {
      cartInput.note = savedNote;
      cartInput.attributes = [{ key: 'Order Note', value: savedNote }];
    }
    if (savedDiscounts.length > 0) {
      cartInput.discountCodes = savedDiscounts;
    }

    var createMut = SF_CART_FRAGMENT + '\nmutation BuyNowSingleCheckout($input: CartInput!) {\n  cartCreate(input: $input) {\n    cart { ...CartFields }\n    userErrors { field message code }\n  }\n}';
    var intermediateUrl = apiUrl('cart?buy_now=1');

    return executeStorefrontGraphql(createMut, { input: cartInput }).then(function (res) {
      var payload = res && res.data && res.data.cartCreate;
      if (payload && payload.cart && payload.cart.id) {
        var norm = normalizeStorefrontCart(payload.cart, BUY_NOW_CART_STORAGE_KEY);
        return {
          ok: true,
          intermediateUrl: intermediateUrl,
          checkoutUrl: norm ? norm.checkoutUrl : payload.cart.checkoutUrl,
          cart: norm,
          cartId: payload.cart.id
        };
      }
      var uErr = (payload && payload.userErrors && payload.userErrors[0]) ? payload.userErrors[0].message : 'Unable to start direct checkout.';
      return {
        ok: false,
        message: uErr,
        intermediateUrl: intermediateUrl,
        checkoutUrl: buildCheckoutUrlWithNoteAndDiscount(apiUrl('cart/' + variantId + ':' + qty), savedNote, savedDiscounts)
      };
    }).catch(function () {
      return {
        ok: true,
        intermediateUrl: intermediateUrl,
        checkoutUrl: buildCheckoutUrlWithNoteAndDiscount(apiUrl('cart/' + variantId + ':' + qty), savedNote, savedDiscounts)
      };
    });
  }

  function syncCheckoutLinksWithUrl(checkoutUrl) {
    if (!checkoutUrl) return;
    document.querySelectorAll('[data-checkout-now-link], [data-checkout-step-link]').forEach(function (a) {
      a.setAttribute('href', checkoutUrl);
    });
  }

  function getCombinedCartItemCount(serverCart, sfCart) {
    var srv = serverCart || getInitialServerCart();
    var sf = sfCart || loadSavedStorefrontCart();
    var srvCount = (srv && typeof srv.item_count === 'number') ? srv.item_count : 0;
    if (!sf || !Array.isArray(sf.items) || !sf.items.length) return srvCount;
    var srvIds = {};
    if (srv && Array.isArray(srv.items)) {
      srv.items.forEach(function (it) {
        srvIds[String(it.variant_id || it.id)] = true;
      });
    }
    var extra = 0;
    sf.items.forEach(function (it) {
      if (!srvIds[String(it.variant_id)]) {
        extra += (Number(it.quantity) || 0);
      }
    });
    return srvCount + extra;
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
      var sfCart = loadSavedStorefrontCart();
      if (sfCart && sfCart.checkoutUrl) {
        syncCheckoutLinksWithUrl(sfCart.checkoutUrl);
      }
      var initCart = getInitialServerCart();
      var combined = getCombinedCartItemCount(initCart, sfCart);
      if (combined > 0) {
        updateCartCount(combined, false);
        return;
      }
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
   * 2. 若 /cart/add.js 因区域配送缓存返回 422（但当前选中变体在店铺实际有库存且已上架），自动调用 Shopify 官方 Storefront GraphQL Cart API (cartCreate / cartLinesAdd) 创建真实官方购物车与官方 checkoutUrl，绝不误报“已下架/已售罄”
   * 3. 加购成功后更新 data-cart-quantity 与头部购物车气泡，并派发 cart:update 事件
   */
  function isSelectedVariantAvailableInDom(variantId) {
    var idStr = String(variantId || '');
    var prodSection = document.querySelector('[data-tcg-product-section]');
    if (prodSection) {
      var jsonEl = prodSection.querySelector('[data-product-variants-json]');
      if (jsonEl) {
        try {
          var vList = JSON.parse(jsonEl.textContent);
          for (var i = 0; i < vList.length; i++) {
            if (String(vList[i].id) === idStr) {
              var v = vList[i];
              if (v.available || v.raw_available || Number(v.inventory_quantity) > 0 || v.inventory_policy === 'continue' || !v.inventory_management) {
                return true;
              }
              return false;
            }
          }
        } catch (e) {}
      }
      var addBtn = prodSection.querySelector('[data-product-add]');
      if (addBtn && !addBtn.disabled) return true;
    }
    var cardBtn = document.querySelector('[data-add][data-variant="' + idStr + '"]');
    if (cardBtn && !cardBtn.disabled) return true;
    return true;
  }

  function addVariantToCart(variantId, quantity, formEl) {
    var qty = Math.max(1, parseInt(quantity, 10) || 1);
    var addUrl = getThemeRoute('cart_add_url', 'cart/add.js');
    var sectionIds = [];
    document.querySelectorAll('[data-tcg-cart-section][data-section-id], cart-items-component[data-section-id]').forEach(function (el) {
      var sid = el.getAttribute('data-section-id');
      if (sid && sectionIds.indexOf(sid) === -1) sectionIds.push(sid);
    });

    var reqPromise;
    if (formEl && typeof window.FormData === 'function') {
      var formData;
      try {
        formData = new window.FormData(formEl);
      } catch (e) {
        formData = null;
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
        return response.text().then(function (txt) {
          var data = {};
          try { data = JSON.parse(txt); } catch (e) { data = { message: txt || 'Unable to add item to cart.' }; }
          return { httpOk: response.ok, status: response.status, data: data };
        });
      })
      .catch(function () {
        return { httpOk: false, status: 500, data: { status: 500, message: 'Network error' } };
      })
      .then(function (resObj) {
        var data = resObj.data || {};
        if (data.status || !resObj.httpOk) {
          // 当商品实际有库存且处于上架状态，但 /cart/add.js 返回 422 时，自动通过 Shopify 官方 Storefront GraphQL Cart API 加购并生成官方 Checkout URL
          if (isSelectedVariantAvailableInDom(variantId)) {
            return addVariantViaStorefrontCartApi(variantId, qty).then(function (sfRes) {
              if (sfRes && sfRes.ok) {
                return sfRes;
              }
              var fallbackErr = (sfRes && sfRes.message) || data.message || data.description || 'Unable to add item to cart.';
              return { ok: false, status: data.status || resObj.status, message: fallbackErr };
            }).catch(function () {
              var errMsg = data.message || data.description || 'Unable to add item to cart.';
              return { ok: false, status: data.status || resObj.status, message: errMsg };
            });
          }

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

        // 当 /cart/add.js 成功将商品写入服务端购物车时，不再向 Storefront Cart 重复叠加同一商品，并从本地 Storefront 备份中移除该变体，避免数量与金额翻倍
        return fetch(apiUrl('cart.js'))
          .then(function (cr) { return cr.json(); })
          .catch(function () { return null; })
          .then(function (cart) {
            var sfCart = loadSavedStorefrontCart();
            if (sfCart && Array.isArray(sfCart.items) && sfCart.items.length > 0 && cart && Array.isArray(cart.items)) {
              var serverVidMap = {};
              cart.items.forEach(function (it) {
                serverVidMap[String(it.variant_id || it.id)] = true;
              });
              sfCart.items = sfCart.items.filter(function (it) {
                return !serverVidMap[String(it.variant_id)];
              });
              sfCart.item_count = sfCart.items.reduce(function (s, it) { return s + (Number(it.quantity) || 0); }, 0);
              if (sfCart.item_count <= 0) {
                saveStorefrontCart(null);
                sfCart = null;
              } else {
                saveStorefrontCart(sfCart);
              }
            }
            updateCartCount(getCombinedCartItemCount(cart, sfCart), true);
            if (cart && typeof cart.item_count === 'number') {
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
            var bestCheckoutUrl = (sfCart && sfCart.checkoutUrl)
              || buildCheckoutUrlWithNoteAndDiscount(getThemeRoute('cart_checkout_url', 'checkout'), loadSavedOrderNote(), loadSavedDiscountCodes());
            syncCheckoutLinksWithUrl(bestCheckoutUrl);
            return {
              ok: true,
              source: 'shopify',
              checkoutUrl: bestCheckoutUrl,
              cart: cart || sfCart,
              response: data
            };
          });
      });
  }

  on('[data-add]', 'click', function (e, btn) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
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

    // 6) 缩略图单行横向滑动控制（左右按钮 + 滚轮横向滚动 + 选中缩略图自动平滑居中）
    var thumbsTrack = section.querySelector('[data-thumbs-track]');
    if (thumbsTrack) {
      on('[data-thumbs-prev]', 'click', function (e) {
        if (e.preventDefault) e.preventDefault();
        if (typeof thumbsTrack.scrollBy === 'function') {
          thumbsTrack.scrollBy({ left: -240, behavior: 'smooth' });
        } else {
          thumbsTrack.scrollLeft = Math.max(0, (thumbsTrack.scrollLeft || 0) - 240);
        }
      }, section);

      on('[data-thumbs-next]', 'click', function (e) {
        if (e.preventDefault) e.preventDefault();
        if (typeof thumbsTrack.scrollBy === 'function') {
          thumbsTrack.scrollBy({ left: 240, behavior: 'smooth' });
        } else {
          thumbsTrack.scrollLeft = (thumbsTrack.scrollLeft || 0) + 240;
        }
      }, section);

      thumbsTrack.addEventListener('wheel', function (e) {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          if (e.preventDefault) e.preventDefault();
          thumbsTrack.scrollLeft = (thumbsTrack.scrollLeft || 0) + e.deltaY;
        }
      }, { passive: false });
    }

    // 7) 主图点击放大高清灯箱（Lightbox Modal：支持打开/关闭、2× 倍率缩放、上一张/下一张切换、键盘 ESC/方向键）
    var lightbox = section.querySelector('[data-image-lightbox]') || document.querySelector('[data-image-lightbox]');
    if (lightbox) {
      var lbImg = lightbox.querySelector('[data-lightbox-image]');
      var lbWrap = lightbox.querySelector('[data-lightbox-img-wrap]');
      var lbCaption = lightbox.querySelector('[data-lightbox-caption]');
      var lbScaleLabel = lightbox.querySelector('[data-lightbox-scale-label]');

      function getGalleryImageUrls() {
        var urls = [];
        section.querySelectorAll('[data-thumb]').forEach(function (t) {
          var u = t.getAttribute('data-full');
          if (u && urls.indexOf(u) === -1) urls.push(u);
        });
        if (!urls.length && mainImg) {
          var mSrc = mainImg.getAttribute('src') || mainImg.src;
          if (mSrc) urls.push(mSrc);
        }
        return urls;
      }

      function setLightboxScale2x(enable) {
        if (!lbWrap) return;
        lbWrap.classList.toggle('is-zoomed-2x', Boolean(enable));
        if (lbScaleLabel) {
          lbScaleLabel.textContent = enable ? 'Reset 1×' : 'Zoom 2×';
        }
      }

      function openLightbox(srcOverride) {
        var curSrc = srcOverride || (mainImg && (mainImg.getAttribute('src') || mainImg.src)) || '';
        if (lbImg && curSrc) {
          lbImg.setAttribute('src', curSrc);
          lbImg.src = curSrc;
        }
        if (lbCaption) {
          var h1 = section.querySelector('h1');
          lbCaption.textContent = (h1 && h1.textContent) ? h1.textContent.trim() : '';
        }
        setLightboxScale2x(false);
        lightbox.removeAttribute('hidden');
        lightbox.hidden = false;
      }

      function closeLightbox() {
        setLightboxScale2x(false);
        lightbox.setAttribute('hidden', '');
        lightbox.hidden = true;
      }

      function stepLightboxImage(delta) {
        var urls = getGalleryImageUrls();
        if (urls.length <= 1 || !lbImg) return;
        var cur = lbImg.getAttribute('src') || lbImg.src || '';
        var idx = urls.indexOf(cur);
        if (idx === -1) idx = 0;
        var nextIdx = (idx + delta + urls.length) % urls.length;
        var nextUrl = urls[nextIdx];
        lbImg.setAttribute('src', nextUrl);
        lbImg.src = nextUrl;
        setLightboxScale2x(false);
      }

      on('[data-zoom-trigger]', 'click', function (e) {
        if (e.preventDefault) e.preventDefault();
        openLightbox();
      }, section);

      on('[data-zoom-trigger]', 'keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.preventDefault) e.preventDefault();
          openLightbox();
        }
      }, section);

      on('[data-lightbox-close]', 'click', function (e) {
        if (e.preventDefault) e.preventDefault();
        closeLightbox();
      }, lightbox);

      on('[data-lightbox-prev]', 'click', function (e) {
        if (e.preventDefault) e.preventDefault();
        stepLightboxImage(-1);
      }, lightbox);

      on('[data-lightbox-next]', 'click', function (e) {
        if (e.preventDefault) e.preventDefault();
        stepLightboxImage(1);
      }, lightbox);

      on('[data-lightbox-toggle-scale]', 'click', function (e) {
        if (e.preventDefault) e.preventDefault();
        var isZoomed = lbWrap && lbWrap.classList.contains('is-zoomed-2x');
        setLightboxScale2x(!isZoomed);
      }, lightbox);

      on('[data-lightbox-img-wrap]', 'click', function (e) {
        if (e.target && e.target.closest && e.target.closest('button')) return;
        var isZoomed = lbWrap && lbWrap.classList.contains('is-zoomed-2x');
        setLightboxScale2x(!isZoomed);
      }, lightbox);

      window.addEventListener('keydown', function (e) {
        if (lightbox.hasAttribute('hidden')) return;
        if (e.key === 'Escape') closeLightbox();
        else if (e.key === 'ArrowLeft') stepLightboxImage(-1);
        else if (e.key === 'ArrowRight') stepLightboxImage(1);
      });
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
    var sfCart = loadSavedStorefrontCart();
    if (sfCart && sfCart.checkoutUrl && Array.isArray(sfCart.items) && sfCart.items.length > 0) {
      return sfCart.checkoutUrl;
    }
    if (el && el.getAttribute) {
      var officialAttr = el.getAttribute('data-official-checkout-url') || el.getAttribute('data-checkout-url');
      if (officialAttr) return officialAttr;
    }
    return getThemeRoute('cart_checkout_url', 'checkout');
  }

  on('[data-product-form]', 'submit', function (e, form) {
    // 若用户点击的是原生 name="checkout" 提交按钮（立即购买），创建仅含当前单品的独立官方支付会话，绝不把购物车其他商品混入
    var submitter = e.submitter || document.activeElement;
    if (submitter && submitter.getAttribute && submitter.getAttribute('name') === 'checkout') {
      if (e.preventDefault) e.preventDefault();
      var directBtn = submitter;
      var directVidInput = form.querySelector('[data-variant-id-input]');
      var directVid = (directVidInput && directVidInput.value) || directBtn.getAttribute('data-variant');
      if (!directVid) return;
      var directQty = getProductQuantity();
      directBtn.setAttribute('disabled', '');
      createBuyNowStandaloneCheckoutUrl(directVid, directQty)
        .then(function (res) {
          if (res && res.intermediateUrl) {
            window.location.href = res.intermediateUrl;
          } else if (res && res.checkoutUrl) {
            window.location.href = res.checkoutUrl;
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
          if (res.checkoutUrl) {
            syncCheckoutLinksWithUrl(res.checkoutUrl);
          }
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

  // 捕获点击“立即購買 / Buy it now”按钮（含 {{ form | payment_button }} 加速结账容器与备用按钮）：
  // 统一先通过双通道官方购物车（/cart/add.js 或 Storefront Cart API）加购，再直达官方 Checkout，彻底杜绝 wallets/checkouts.json 弹窗报错“交易失敗：此品項已下架。”
  function handleDirectBuyNowClick(e, directWrap) {
    if (!directWrap || directWrap.disabled || directWrap.hasAttribute('hidden')) return;

    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();

    var form = (directWrap.closest && directWrap.closest('form')) || document.querySelector('[data-product-form]');
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
    directWrap.style.pointerEvents = 'none';
    directWrap.style.opacity = '0.7';

    // 立即购买（Buy it now）：创建仅包含当前选中 SKU 与数量的独立单品结账会话，并跳转到与购物车同款的立即购买确认中间页（/cart?buy_now=1），支持输入备注、折扣码后再进入官方收银台
    createBuyNowStandaloneCheckoutUrl(variantId, quantity)
      .then(function (res) {
        if (res && res.ok && res.intermediateUrl) {
          window.location.href = res.intermediateUrl;
        } else if (formErrorEl && res && res.message) {
          formErrorEl.textContent = res.message;
          formErrorEl.removeAttribute('hidden');
        } else if (res && res.intermediateUrl) {
          window.location.href = res.intermediateUrl;
        } else if (res && res.checkoutUrl) {
          window.location.href = res.checkoutUrl;
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
  }

  on('[data-direct-checkout]', 'click', function (e, directWrap) {
    handleDirectBuyNowClick(e, directWrap);
  });

  window.addEventListener('click', function (e) {
    var path = e.composedPath ? e.composedPath() : [];
    var directWrap = null;
    for (var i = 0; i < path.length; i++) {
      var node = path[i];
      if (node && node.hasAttribute && node.hasAttribute('data-direct-checkout')) {
        directWrap = node;
        break;
      }
    }
    if (!directWrap && e.target && e.target.closest) {
      directWrap = e.target.closest('[data-direct-checkout]');
    }
    if (directWrap) {
      handleDirectBuyNowClick(e, directWrap);
    }
  }, true);

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
   * 15. 购物车与官方支付同步（完全对齐参考模板 component-cart-items.js / cart-note.js / cart-discount.js / cart-summary.liquid + Storefront Cart API 官方支付会话同步）
   * ----------------------------------------------------------------- */
  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

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

  function renderStorefrontCartItemsInCartPage(serverCartOverride) {
    var cartSection = document.querySelector('[data-tcg-cart-section], [data-tcg-checkout-section]');
    if (!cartSection) return;

    var sfContainer = cartSection.querySelector('[data-storefront-cart-items]');
    var serverContainer = cartSection.querySelector('[data-shopify-cart-items]');
    var buyNowMode = isBuyNowIntermediatePage();
    var sfCart = loadSavedStorefrontCart();
    var seenServerVids = {};
    var serverCount = 0;
    var serverOrigSubtotalCents = 0;
    var serverFinalSubtotalCents = 0;
    var serverLineDiscountCents = 0;

    if (buyNowMode) {
      if (serverContainer) {
        serverContainer.setAttribute('hidden', '');
        serverContainer.hidden = true;
      }
      var headingTitleEl = cartSection.querySelector('[data-cart-heading-title]');
      if (headingTitleEl) headingTitleEl.textContent = 'Buy it now · Order Review';
      var exitBuyNowLink = cartSection.querySelector('[data-exit-buy-now-link]');
      if (exitBuyNowLink) {
        exitBuyNowLink.removeAttribute('hidden');
        exitBuyNowLink.hidden = false;
      }
    } else {
      if (serverContainer) {
        serverContainer.removeAttribute('hidden');
        serverContainer.hidden = false;
      }
      cartSection.querySelectorAll('[data-cart-row][data-cart-source="shopify"]').forEach(function (row) {
        var vid = row.getAttribute('data-variant-id');
        if (vid) seenServerVids[String(vid)] = true;
        var q = parseInt(row.getAttribute('data-quantity'), 10) || 0;
        var origUnitAttr = parseInt(row.getAttribute('data-original-unit-price'), 10);
        var finalUnitAttr = parseInt(row.getAttribute('data-unit-price'), 10);
        var unitOrig = !isNaN(origUnitAttr) && origUnitAttr >= 0 ? origUnitAttr : (!isNaN(finalUnitAttr) ? finalUnitAttr : 0);
        var unitFinal = !isNaN(finalUnitAttr) && finalUnitAttr >= 0 ? finalUnitAttr : unitOrig;

        var origLineAttr = parseInt(row.getAttribute('data-original-line-price'), 10);
        var finalLineAttr = parseInt(row.getAttribute('data-line-price'), 10);
        var lineOrig = !isNaN(origLineAttr) && origLineAttr >= 0 ? origLineAttr : (unitOrig * q);
        var lineFinal = !isNaN(finalLineAttr) && finalLineAttr >= 0 ? finalLineAttr : (unitFinal * q);
        var lineDiscAttr = parseInt(row.getAttribute('data-line-discount'), 10);
        var lineDisc = !isNaN(lineDiscAttr) && lineDiscAttr >= 0 ? lineDiscAttr : Math.max(0, lineOrig - lineFinal);

        serverCount += q;
        serverOrigSubtotalCents += lineOrig;
        serverFinalSubtotalCents += lineFinal;
        serverLineDiscountCents += lineDisc;
      });
    }

    // 若服务端购物车已包含某商品，同步清理本地 Storefront 备份中的同变体重复项，杜绝数量或金额叠加
    if (sfCart && Array.isArray(sfCart.items) && sfCart.items.length > 0 && Object.keys(seenServerVids).length > 0) {
      var beforeLen = sfCart.items.length;
      sfCart.items = sfCart.items.filter(function (it) {
        return !seenServerVids[String(it.variant_id)];
      });
      if (sfCart.items.length !== beforeLen) {
        sfCart.item_count = sfCart.items.reduce(function (s, it) { return s + (Number(it.quantity) || 0); }, 0);
        if (sfCart.item_count <= 0) {
          saveStorefrontCart(null);
          sfCart = null;
        } else {
          saveStorefrontCart(sfCart);
        }
      }
    }

    var sfItems = (sfCart && Array.isArray(sfCart.items))
      ? sfCart.items.filter(function (it) {
          return (Number(it.quantity) || 0) > 0 && !seenServerVids[String(it.variant_id)];
        })
      : [];

    var activeNote = (sfCart && sfCart.note) ? sfCart.note : loadSavedOrderNote();
    cartSection.querySelectorAll('[data-cart-note]').forEach(function (ta) {
      if (document.activeElement !== ta && !ta.value && activeNote) {
        ta.value = activeNote;
      }
    });

    if (sfContainer) {
      if (!sfItems.length) {
        sfContainer.innerHTML = '';
      } else {
        sfContainer.innerHTML = sfItems.map(function (item, idx) {
          var lineId = escapeHtml(item.line_id || '');
          var vid = escapeHtml(item.variant_id || '');
          var title = escapeHtml(item.product_title || 'Product');
          var vTitle = (item.variant_title && item.variant_title !== 'Default Title') ? escapeHtml(item.variant_title) : '';
          var sku = item.sku ? escapeHtml(item.sku) : '';
          var qty = Math.max(1, Number(item.quantity) || 1);
          var origUnitCents = Number(item.original_price !== undefined ? item.original_price : item.final_price) || 0;
          var origLineCents = Number(item.original_line_price) || (origUnitCents * qty);
          var lineCents = Number(item.final_line_price !== undefined ? item.final_line_price : origLineCents);
          var lineDiscCents = Math.max(0, origLineCents - lineCents);
          var imgSrc = escapeHtml(item.image || '');
          var url = escapeHtml(item.url || apiUrl('collections/all'));
          var noteAttrVal = '';
          if (Array.isArray(item.attributes)) {
            item.attributes.forEach(function (attr) {
              if (attr && attr.key === 'Order Note' && attr.value) noteAttrVal = attr.value;
            });
          }
          if (!noteAttrVal && activeNote) noteAttrVal = activeNote;

          return (
            '<div class="_row_1z0wo_52" data-cart-row data-cart-source="storefront_api" data-sf-line-id="' + lineId + '" data-variant-id="' + vid + '" data-original-unit-price="' + origUnitCents + '" data-unit-price="' + origUnitCents + '" data-original-line-price="' + origLineCents + '" data-line-price="' + lineCents + '" data-quantity="' + qty + '">' +
              '<a href="' + url + '" class="_thumb_1z0wo_62">' +
                (imgSrc ? '<img alt="' + title + '" draggable="false" src="' + imgSrc + '" loading="lazy">' : '') +
              '</a>' +
              '<div class="_rowInfo_1z0wo_78">' +
                '<a href="' + url + '" class="_rowName_1z0wo_86">' + title + '</a>' +
                '<div class="tcg-cart-meta">' +
                  (vTitle ? '<span class="_rowUnitPrice_1z0wo_94">' + vTitle + '</span>' : '') +
                  (sku ? '<code class="tcg-sku-code">SKU: ' + sku + '</code>' : '') +
                  '<span class="_rowUnitPrice_1z0wo_94" data-row-unit-price>' + escapeHtml(formatMoneyCents(origUnitCents)) + ' each</span>' +
                '</div>' +
                (noteAttrVal
                  ? '<div class="tcg-cart-meta" style="margin-top:0.2rem;"><span class="_rowUnitPrice_1z0wo_94" style="color:#34d399;">Order Note: ' + escapeHtml(noteAttrVal) + '</span></div>'
                  : '') +
                (lineDiscCents > 0
                  ? '<div class="tcg-cart-discounts"><span class="tcg-discount-pill">Promo Discount (-' + escapeHtml(formatMoneyCents(lineDiscCents)) + ')</span></div>'
                  : '') +
                '<div class="_qtyControl_1z0wo_100" data-cart-qty>' +
                  '<button type="button" name="minus" class="_qtyBtn_1z0wo_110" data-cart-minus data-sf-line-id="' + lineId + '" aria-label="Decrease quantity">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"></path></svg>' +
                  '</button>' +
                  '<input type="number" value="' + qty + '" min="0" aria-label="Quantity for ' + title + '" class="tcg-cart-qty-input" data-cart-qty-input data-sf-line-id="' + lineId + '">' +
                  '<span class="_qtyValue_1z0wo_135" hidden>' + qty + '</span>' +
                  '<button type="button" name="plus" class="_qtyBtn_1z0wo_110" data-cart-plus data-sf-line-id="' + lineId + '" aria-label="Increase quantity">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"></path></svg>' +
                  '</button>' +
                '</div>' +
                '<p class="tcg-form-error" data-cart-line-error="sf-' + idx + '" hidden></p>' +
              '</div>' +
              '<div class="_rowEnd_1z0wo_145">' +
                (origLineCents > lineCents ? '<del class="tcg-line-compare">' + escapeHtml(formatMoneyCents(origLineCents)) + '</del>' : '') +
                '<span class="_lineTotal_1z0wo_152" data-row-line-total>' + escapeHtml(formatMoneyCents(lineCents)) + '</span>' +
                '<button type="button" class="_removeBtn_1z0wo_160" data-cart-remove data-sf-line-id="' + lineId + '" aria-label="Remove ' + title + '">' +
                  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>Remove' +
                '</button>' +
              '</div>' +
            '</div>'
          );
        }).join('');
      }
    }

    var sfCount = 0;
    var sfOrigSubtotalCents = 0;
    var sfFinalSubtotalCents = 0;
    sfItems.forEach(function (it) {
      var q = Number(it.quantity) || 0;
      sfCount += q;
      var origLine = Number(it.original_line_price) || ((Number(it.original_price || it.final_price) || 0) * q);
      var finalLine = Number(it.final_line_price !== undefined ? it.final_line_price : origLine);
      sfOrigSubtotalCents += origLine;
      sfFinalSubtotalCents += finalLine;
    });

    // 若传入了最新的服务端 cart JSON（如数量修改或折扣更新返回的数据），优先使用其权威统计字段
    if (serverCartOverride && typeof serverCartOverride.item_count === 'number') {
      serverCount = serverCartOverride.item_count;
      if (typeof serverCartOverride.original_total_price === 'number') {
        serverOrigSubtotalCents = serverCartOverride.original_total_price;
      }
      if (typeof serverCartOverride.total_price === 'number') {
        serverFinalSubtotalCents = serverCartOverride.total_price;
      }
      if (typeof serverCartOverride.total_discount === 'number') {
        serverLineDiscountCents = serverCartOverride.total_discount;
      }
    } else if (serverCount > 0) {
      var statsEl = cartSection.querySelector('[data-summary-stats]');
      if (statsEl) {
        var srvTotalDiscAttr = parseInt(statsEl.getAttribute('data-server-total-discount'), 10);
        if (!isNaN(srvTotalDiscAttr) && srvTotalDiscAttr > serverLineDiscountCents) {
          serverLineDiscountCents = srvTotalDiscAttr;
          serverFinalSubtotalCents = Math.max(0, serverOrigSubtotalCents - serverLineDiscountCents);
        }
      }
    }

    var combinedCount = serverCount + sfCount;
    var combinedOrigCents = serverOrigSubtotalCents + sfOrigSubtotalCents;

    var filledView = cartSection.querySelector('[data-cart-filled-view]');
    var emptyView = cartSection.querySelector('[data-cart-empty-view]');
    if (filledView && emptyView) {
      if (combinedCount > 0) {
        filledView.removeAttribute('hidden');
        filledView.hidden = false;
        emptyView.setAttribute('hidden', '');
        emptyView.hidden = true;
      } else {
        filledView.setAttribute('hidden', '');
        filledView.hidden = true;
        emptyView.removeAttribute('hidden');
        emptyView.hidden = false;
      }
    }

    if (!buyNowMode) {
      updateCartCount(combinedCount, false);
    }
    var hiddenCountEl = cartSection.querySelector('[data-cart-hidden-count]');
    if (hiddenCountEl) hiddenCountEl.textContent = String(combinedCount);

    var headerCount = cartSection.querySelector('[data-cart-header-count]');
    if (headerCount) {
      headerCount.textContent = ' (' + combinedCount + (combinedCount === 1 ? ' item)' : ' items)');
    }
    cartSection.querySelectorAll('[data-summary-item-count]').forEach(function (el) {
      el.textContent = String(combinedCount);
    });

    // 严格按当前购物车真实显示的商品计算原价小计、折扣金额与最终应付总价（绝不读取过期的历史缓存）
    var displayOrigCents = combinedOrigCents;
    var sfExtraDiscountCents = Math.max(0, sfOrigSubtotalCents - sfFinalSubtotalCents);
    if (serverCount === 0 && sfItems.length > 0 && sfCart && typeof sfCart.total_discount === 'number') {
      sfExtraDiscountCents = Math.max(sfExtraDiscountCents, sfCart.total_discount);
    }
    var totalDiscountCents = Math.min(displayOrigCents, serverLineDiscountCents + sfExtraDiscountCents);
    var finalTotalCents = Math.max(0, displayOrigCents - totalDiscountCents);

    cartSection.querySelectorAll('[data-summary-subtotal]').forEach(function (el) {
      el.textContent = formatMoneyCents(displayOrigCents);
    });

    cartSection.querySelectorAll('[data-summary-discount-row]').forEach(function (row) {
      if (totalDiscountCents > 0) {
        row.removeAttribute('hidden');
        row.hidden = false;
      } else {
        row.setAttribute('hidden', '');
        row.hidden = true;
      }
    });
    cartSection.querySelectorAll('[data-summary-discount]').forEach(function (el) {
      el.textContent = '-' + formatMoneyCents(totalDiscountCents);
    });

    cartSection.querySelectorAll('[data-summary-total]').forEach(function (el) {
      el.textContent = formatMoneyCents(finalTotalCents);
    });

    // 渲染已生效的折扣码胶囊
    var activeDiscounts = [];
    if (sfCart && Array.isArray(sfCart.discount_codes)) {
      sfCart.discount_codes.forEach(function (d) {
        if (d && d.code && d.applicable !== false && activeDiscounts.indexOf(d.code) === -1) {
          activeDiscounts.push(d.code);
        }
      });
    }
    if (!activeDiscounts.length) {
      activeDiscounts = loadSavedDiscountCodes();
    }
    cartSection.querySelectorAll('[data-cart-discount-pills]').forEach(function (ul) {
      if (activeDiscounts.length > 0) {
        ul.innerHTML = activeDiscounts.map(function (c) {
          var codeEsc = escapeHtml(c);
          return (
            '<li class="tcg-discount-pill" data-discount-code="' + codeEsc + '">' +
              '<span>' + codeEsc + '</span>' +
              '<button type="button" data-remove-discount="' + codeEsc + '" aria-label="Remove discount ' + codeEsc + '" style="background:none;border:0;color:inherit;margin-left:0.35rem;cursor:pointer;font-weight:700;">×</button>' +
            '</li>'
          );
        }).join('');
      } else if (serverCount === 0) {
        ul.innerHTML = '';
      }
    });

    var checkoutBtn = cartSection.querySelector('[data-official-checkout-submit]');
    if (checkoutBtn) {
      checkoutBtn.disabled = combinedCount <= 0;
      if (combinedCount > 0) checkoutBtn.removeAttribute('disabled');
    }
    if (sfCart && (sfCart.rawCheckoutUrl || sfCart.checkoutUrl)) {
      var syncedUrl = buildCheckoutUrlWithNoteAndDiscount(
        sfCart.rawCheckoutUrl || sfCart.checkoutUrl,
        activeNote,
        activeDiscounts
      );
      sfCart.checkoutUrl = syncedUrl;
      saveStorefrontCart(sfCart);
      syncCheckoutLinksWithUrl(syncedUrl);
    }
    var checkoutItemsBox = cartSection.querySelector('[data-checkout-summary-items]');
    if (checkoutItemsBox && serverCount === 0 && sfItems.length > 0) {
      checkoutItemsBox.innerHTML = sfItems.map(function (it) {
        var vLabel = (it.variant_title && it.variant_title !== 'Default Title') ? ' (' + escapeHtml(it.variant_title) + ')' : '';
        var lineCents = Number(it.final_line_price !== undefined ? it.final_line_price : it.original_line_price) || 0;
        return (
          '<div class="tcg-checkout-item">' +
            '<span>' + escapeHtml(it.quantity) + '× ' + escapeHtml(it.product_title) + vLabel + '</span>' +
            '<strong>' + escapeHtml(formatMoneyCents(lineCents)) + '</strong>' +
          '</div>'
        );
      }).join('');
    }
  }

  function updateStorefrontCartLine(sfLineId, newQuantity) {
    var saved = loadSavedStorefrontCart();
    if (!saved || !saved.id || !sfLineId) return;
    var cleanQty = Math.max(0, parseInt(newQuantity, 10) || 0);

    var prom;
    if (cleanQty <= 0) {
      var removeMut = SF_CART_FRAGMENT + '\nmutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {\n  cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {\n    cart { ...CartFields }\n    userErrors { field message }\n  }\n}';
      prom = executeStorefrontGraphql(removeMut, {
        cartId: saved.id,
        lineIds: [sfLineId]
      }).then(function (r) {
        return r && r.data && r.data.cartLinesRemove && r.data.cartLinesRemove.cart;
      });
    } else {
      var updateMut = SF_CART_FRAGMENT + '\nmutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {\n  cartLinesUpdate(cartId: $cartId, lines: $lines) {\n    cart { ...CartFields }\n    userErrors { field message }\n  }\n}';
      prom = executeStorefrontGraphql(updateMut, {
        cartId: saved.id,
        lines: [{ id: sfLineId, quantity: cleanQty }]
      }).then(function (r) {
        return r && r.data && r.data.cartLinesUpdate && r.data.cartLinesUpdate.cart;
      });
    }

    return prom.then(function (updatedSfCart) {
      if (updatedSfCart) {
        normalizeStorefrontCart(updatedSfCart);
      } else if (cleanQty <= 0) {
        saved.items = (saved.items || []).filter(function (it) { return it.line_id !== sfLineId; });
        saved.item_count = saved.items.reduce(function (s, it) { return s + (Number(it.quantity) || 0); }, 0);
        saveStorefrontCart(saved.item_count > 0 ? saved : null);
      }
      renderStorefrontCartItemsInCartPage();
    }).catch(function () {});
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
          renderStorefrontCartItemsInCartPage();
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
    if (rowEl && rowEl.getAttribute('data-cart-source') === 'storefront_api') {
      var sfLineId = rowEl.getAttribute('data-sf-line-id');
      return updateStorefrontCartLine(sfLineId, quantity);
    }

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
            renderStorefrontCartItemsInCartPage(parsed);
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
          var origUnitCents = matchedLine && matchedLine.original_price !== undefined
            ? Number(matchedLine.original_price)
            : (parseInt(rowEl.getAttribute('data-original-unit-price'), 10) || parseInt(rowEl.getAttribute('data-unit-price'), 10) || 0);
          var finalUnitCents = matchedLine && matchedLine.final_price !== undefined
            ? Number(matchedLine.final_price)
            : origUnitCents;
          var origLineCents = matchedLine && matchedLine.original_line_price !== undefined
            ? Number(matchedLine.original_line_price)
            : (origUnitCents * cleanQty);
          var finalLineCents = matchedLine && matchedLine.final_line_price !== undefined
            ? Number(matchedLine.final_line_price)
            : (finalUnitCents * cleanQty);
          var lineDiscCents = Math.max(0, origLineCents - finalLineCents);

          rowEl.setAttribute('data-original-unit-price', String(origUnitCents));
          rowEl.setAttribute('data-unit-price', String(finalUnitCents));
          rowEl.setAttribute('data-original-line-price', String(origLineCents));
          rowEl.setAttribute('data-line-price', String(finalLineCents));
          rowEl.setAttribute('data-line-discount', String(lineDiscCents));

          var unitPriceEl = rowEl.querySelector('[data-row-unit-price]');
          if (unitPriceEl) unitPriceEl.textContent = formatMoneyCents(origUnitCents) + ' each';
          var lineTotalEl = rowEl.querySelector('[data-row-line-total]');
          if (lineTotalEl) lineTotalEl.textContent = formatMoneyCents(finalLineCents);
        }

        renderStorefrontCartItemsInCartPage(parsed);
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

  function syncNoteAndDiscountsToStorefrontCart(noteVal, discountCodes) {
    var cleanNote = String(noteVal == null ? '' : noteVal).trim();
    saveOrderNoteLocal(cleanNote);
    if (Array.isArray(discountCodes)) {
      saveDiscountCodesLocal(discountCodes);
    }
    var sfCart = loadSavedStorefrontCart();
    if (!sfCart || !sfCart.id) return Promise.resolve(null);

    var promises = [];

    // 1. 同步订单级备注与属性，并将 Order Note 写入首个商品行的 line attributes（确保在 Shopify Checkout 右侧商品栏直接可见）
    var noteMut = SF_CART_FRAGMENT + '\nmutation SyncCartNoteAndAttrs($cartId: ID!, $note: String!, $attrs: [AttributeInput!]!) {\n  cartNoteUpdate(cartId: $cartId, note: $note) {\n    cart { ...CartFields }\n  }\n  cartAttributesUpdate(attributes: $attrs, cartId: $cartId) {\n    cart { ...CartFields }\n  }\n}';
    var attrsInput = cleanNote ? [{ key: 'Order Note', value: cleanNote }] : [];
    promises.push(
      executeStorefrontGraphql(noteMut, {
        cartId: sfCart.id,
        note: cleanNote,
        attrs: attrsInput
      }).then(function (r) {
        var updatedCart = (r && r.data && r.data.cartAttributesUpdate && r.data.cartAttributesUpdate.cart)
          || (r && r.data && r.data.cartNoteUpdate && r.data.cartNoteUpdate.cart);
        if (updatedCart) {
          sfCart = normalizeStorefrontCart(updatedCart) || sfCart;
        }
        if (sfCart && Array.isArray(sfCart.items) && sfCart.items.length > 0) {
          var firstItem = sfCart.items[0];
          var lineAttrs = (firstItem.attributes || []).filter(function (a) { return a && a.key !== 'Order Note'; });
          if (cleanNote) {
            lineAttrs.push({ key: 'Order Note', value: cleanNote });
          }
          var lineAttrMut = SF_CART_FRAGMENT + '\nmutation UpdateLineNoteAttr($cartId: ID!, $lines: [CartLineUpdateInput!]!) {\n  cartLinesUpdate(cartId: $cartId, lines: $lines) {\n    cart { ...CartFields }\n  }\n}';
          return executeStorefrontGraphql(lineAttrMut, {
            cartId: sfCart.id,
            lines: [{ id: firstItem.line_id, quantity: firstItem.quantity, attributes: lineAttrs }]
          }).then(function (lr) {
            if (lr && lr.data && lr.data.cartLinesUpdate && lr.data.cartLinesUpdate.cart) {
              sfCart = normalizeStorefrontCart(lr.data.cartLinesUpdate.cart) || sfCart;
            }
          });
        }
      }).catch(function () {})
    );

    // 2. 同步折扣码列表
    if (Array.isArray(discountCodes)) {
      var discMut = SF_CART_FRAGMENT + '\nmutation SyncCartDiscounts($cartId: ID!, $discountCodes: [String!]!) {\n  cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {\n    cart { ...CartFields }\n  }\n}';
      promises.push(
        executeStorefrontGraphql(discMut, {
          cartId: sfCart.id,
          discountCodes: discountCodes
        }).then(function (dr) {
          if (dr && dr.data && dr.data.cartDiscountCodesUpdate && dr.data.cartDiscountCodesUpdate.cart) {
            sfCart = normalizeStorefrontCart(dr.data.cartDiscountCodesUpdate.cart) || sfCart;
          }
        }).catch(function () {})
      );
    }

    return Promise.all(promises).then(function () {
      renderStorefrontCartItemsInCartPage();
      document.querySelectorAll('[data-cart-note-status]').forEach(function (el) {
        if (cleanNote) {
          el.removeAttribute('hidden');
          el.hidden = false;
        } else {
          el.setAttribute('hidden', '');
          el.hidden = true;
        }
      });
      return loadSavedStorefrontCart();
    });
  }

  // 点击 Go to checkout 时：自动把当前备注框与未点击 Apply 的折扣码输入框中的内容同步到官方支付会话，再跳转至带 discount 参数的官方支付页
  on('[data-tcg-official-cart-form]', 'submit', function (e, form) {
    var noteInput = form.querySelector('[data-cart-note]') || document.querySelector('[data-cart-note]');
    var discInput = form.querySelector('[data-cart-discount]') || document.querySelector('[data-cart-discount]');
    var noteVal = noteInput ? noteInput.value.trim() : loadSavedOrderNote();
    var existingCodes = getExistingDiscountCodes(form);
    var typedCode = discInput && discInput.value ? discInput.value.trim() : '';
    if (typedCode && existingCodes.indexOf(typedCode) === -1) {
      existingCodes.push(typedCode);
    }
    if (!existingCodes.length) {
      existingCodes = loadSavedDiscountCodes();
    }
    if (discInput && existingCodes.length > 0) {
      discInput.value = existingCodes.join(',');
    }

    var serverRows = form.querySelectorAll('[data-cart-row][data-cart-source="shopify"]');
    var sfCart = loadSavedStorefrontCart();

    if ((isBuyNowIntermediatePage() || serverRows.length === 0) && sfCart && sfCart.id && Array.isArray(sfCart.items) && sfCart.items.length > 0) {
      if (e.preventDefault) e.preventDefault();
      var submitBtn = form.querySelector('[data-official-checkout-submit]');
      if (submitBtn) submitBtn.disabled = true;

      syncNoteAndDiscountsToStorefrontCart(noteVal, existingCodes)
        .then(function (updatedCart) {
          var latest = updatedCart || loadSavedStorefrontCart() || sfCart;
          var targetUrl = buildCheckoutUrlWithNoteAndDiscount(
            latest.rawCheckoutUrl || latest.checkoutUrl,
            noteVal,
            existingCodes
          );
          window.location.href = targetUrl;
        })
        .catch(function () {
          var fallbackUrl = buildCheckoutUrlWithNoteAndDiscount(
            sfCart.rawCheckoutUrl || sfCart.checkoutUrl,
            noteVal,
            existingCodes
          );
          window.location.href = fallbackUrl;
        });
      return;
    }

    // 服务端购物车结账：保存备注与折扣码，若表单中已绑定 [name="note"] 和 [name="discount"]，让浏览器原生 POST /cart (name="checkout") 进入当前购物车专属官方收银台
    saveOrderNoteLocal(noteVal);
    if (existingCodes.length > 0) saveDiscountCodesLocal(existingCodes);
  });

  /**
   * 对齐参考模板 assets/cart-note.js：输入订单备注时防抖 200ms POST JSON { note } 到 Theme.routes.cart_update_url（同时同步到 Storefront Cart 与商品行属性）
   */
  var noteTimer = null;
  var noteAbortController = null;
  on('[data-cart-note]', 'input', function (e, textarea) {
    clearTimeout(noteTimer);
    noteTimer = setTimeout(function () {
      var noteVal = textarea.value;
      syncNoteAndDiscountsToStorefrontCart(noteVal, null);

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
      var cfg = fetchConfig('json', { body: JSON.stringify({ note: noteVal, attributes: { 'Order Note': noteVal } }) });
      if (noteAbortController) cfg.signal = noteAbortController.signal;
      fetch(updateUrl, cfg).catch(function () {});
    }, 200);
  });

  /**
   * 对齐参考模板 assets/cart-discount.js：应用与移除折扣码（POST { discount, sections } 到 Theme.routes.cart_update_url，同时同步 Storefront Cart）
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
    if (errEl) {
      errEl.setAttribute('hidden', '');
      errEl.hidden = true;
    }

    var typedCode = (inputEl && inputEl.value) ? inputEl.value.trim() : '';
    var sfCart = loadSavedStorefrontCart();
    var sfHandled = false;

    var sfPromise = Promise.resolve();
    if (sfCart && sfCart.id) {
      var discMut = SF_CART_FRAGMENT + '\nmutation CartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]!) {\n  cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {\n    cart { ...CartFields }\n    userErrors { field message }\n  }\n}';
      sfPromise = executeStorefrontGraphql(discMut, { cartId: sfCart.id, discountCodes: discountList })
        .then(function (r) {
          var payload = r && r.data && r.data.cartDiscountCodesUpdate;
          if (payload && payload.cart) {
            sfHandled = true;
            var rawCodes = Array.isArray(payload.cart.discountCodes) ? payload.cart.discountCodes : [];
            var isInvalidInSf = typedCode && rawCodes.some(function (d) {
              return d && String(d.code || '').toLowerCase() === typedCode.toLowerCase() && d.applicable === false;
            });
            var validCodes = rawCodes.filter(function (d) { return d && d.code && d.applicable !== false; }).map(function (d) { return d.code; });
            saveDiscountCodesLocal(validCodes);
            normalizeStorefrontCart(payload.cart);
            renderStorefrontCartItemsInCartPage();

            if (isInvalidInSf) {
              if (inputEl) inputEl.value = '';
              if (errEl) {
                errEl.removeAttribute('hidden');
                errEl.hidden = false;
              }
            } else if (inputEl) {
              inputEl.value = '';
            }
          }
        })
        .catch(function () {});
    }

    var updateUrl = getThemeRoute('cart_update_url', 'cart/update.js');
    if (!/\.js($|\?)/.test(updateUrl)) {
      updateUrl = updateUrl.replace(/\/?$/, '.js');
    }

    var payload = {
      discount: discountList.join(',')
    };
    if (sectionId) payload.sections = [sectionId];

    return sfPromise.then(function () {
      return fetch(updateUrl, fetchConfig('json', { body: JSON.stringify(payload) }))
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (sfHandled) return;
          if (typedCode && Array.isArray(data.discount_codes)) {
            var invalid = data.discount_codes.some(function (d) {
              return d && String(d.code || '').toLowerCase() === typedCode.toLowerCase() && d.applicable === false;
            });
            if (invalid) {
              if (inputEl) inputEl.value = '';
              if (errEl) {
                errEl.removeAttribute('hidden');
                errEl.hidden = false;
              }
              return;
            }
          }
          if (inputEl) inputEl.value = '';
          saveDiscountCodesLocal(discountList);
          if (sectionId && data.sections && data.sections[sectionId]) {
            syncCartDomFromSectionHtml(sectionId, data.sections[sectionId]);
          }
          renderStorefrontCartItemsInCartPage(data);
        })
        .catch(function () {});
    });
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

  on('[data-cart-discount]', 'keydown', function (e, input) {
    if (e.key === 'Enter') {
      e.preventDefault();
      var wrapper = input.closest('[data-cart-discount-wrapper]') || document;
      var code = input.value.trim();
      if (!code) return;
      var existing = getExistingDiscountCodes(wrapper);
      if (existing.indexOf(code) === -1) existing.push(code);
      applyOrUpdateDiscounts(existing, wrapper, input);
    }
  });

  on('[data-remove-discount]', 'click', function (e, btn) {
    e.preventDefault();
    var code = btn.getAttribute('data-remove-discount');
    var wrapper = btn.closest('[data-cart-discount-wrapper]') || document;
    var existing = getExistingDiscountCodes(wrapper).filter(function (c) { return c !== code; });
    applyOrUpdateDiscounts(existing, wrapper, null);
  });

  // 页面加载时同步渲染 Storefront Cart 商品行与官方 Checkout URL
  renderStorefrontCartItemsInCartPage();

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

  /* -------------------------------------------------------------------
   * 17. 文章列表页 -> 点击任意文章卡片切换到对应文章详情页（支持 URL ?article=<handle> 直达、无刷新页内切换与返回列表）
   * ----------------------------------------------------------------- */
  (function blogArticleSwitcher() {
    var blogSection = document.querySelector('[data-tcg-blog-section]');
    if (!blogSection) return;

    var listView = blogSection.querySelector('[data-blog-list-view]');
    var articleView = blogSection.querySelector('[data-blog-article-view]');
    var jsonEl = blogSection.querySelector('[data-blog-articles-json]');
    if (!listView || !articleView || !jsonEl) return;

    var articles = [];
    try {
      articles = JSON.parse(jsonEl.textContent) || [];
    } catch (e) {
      articles = [];
    }

    function findArticleByHandle(handle) {
      if (!handle) return null;
      var h = String(handle).trim().toLowerCase();
      for (var i = 0; i < articles.length; i++) {
        if (articles[i] && String(articles[i].handle || '').toLowerCase() === h) {
          return articles[i];
        }
      }
      return articles[0] || null;
    }

    function openArticleDetail(handle, updateUrlFlag) {
      var art = findArticleByHandle(handle);
      if (!art) return false;

      var crumbEl = articleView.querySelector('[data-article-detail-crumb]');
      var tagEl = articleView.querySelector('[data-article-detail-tag]');
      var metaEl = articleView.querySelector('[data-article-detail-meta]');
      var titleEl = articleView.querySelector('[data-article-detail-title]');
      var imgEl = articleView.querySelector('[data-article-detail-image]');
      var contentEl = articleView.querySelector('[data-article-detail-content]');

      if (crumbEl) crumbEl.textContent = art.title || 'Article';
      if (tagEl) tagEl.textContent = art.tag || 'Collector Guide';
      if (metaEl) metaEl.textContent = (art.published_at || '') + (art.author ? ' · ' + art.author : '');
      if (titleEl) titleEl.textContent = art.title || '';
      if (imgEl && art.image) {
        imgEl.setAttribute('src', art.image);
        imgEl.setAttribute('alt', art.title || '');
      }
      if (contentEl) {
        contentEl.innerHTML = art.content_html || ('<p>' + escapeHtml(art.excerpt || '') + '</p>');
      }

      listView.setAttribute('hidden', '');
      listView.hidden = true;
      articleView.removeAttribute('hidden');
      articleView.hidden = false;

      if (updateUrlFlag !== false && window.history && window.history.pushState) {
        try {
          var u = new URL(window.location.href);
          u.searchParams.set('article', art.handle);
          window.history.pushState({ article: art.handle }, '', u.toString());
        } catch (e) {}
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    }

    function backToArticleList(updateUrlFlag) {
      articleView.setAttribute('hidden', '');
      articleView.hidden = true;
      listView.removeAttribute('hidden');
      listView.hidden = false;

      if (updateUrlFlag !== false && window.history && window.history.pushState) {
        try {
          var u = new URL(window.location.href);
          u.searchParams.delete('article');
          window.history.pushState({}, '', u.toString());
        } catch (e) {}
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    on('[data-blog-article-card]', 'click', function (e, card) {
      var handle = card.getAttribute('data-article-handle');
      var realUrl = card.getAttribute('data-article-url');
      // 若存在真实独立的 Shopify 文章 URL（非 ?article= 查询参数）且不在本地预览模式，优先页内秒切展示完整文章内容并同步 URL
      if (handle && openArticleDetail(handle, true)) {
        e.preventDefault();
        return;
      }
      if (realUrl) {
        window.location.href = realUrl;
      }
    }, blogSection);

    on('[data-back-to-blog-list]', 'click', function (e) {
      e.preventDefault();
      backToArticleList(true);
    }, blogSection);

    window.addEventListener('popstate', function () {
      try {
        var params = new URLSearchParams(window.location.search);
        var h = params.get('article');
        if (h) openArticleDetail(h, false);
        else backToArticleList(false);
      } catch (e) {}
    });

    // 初始化检查 URL 是否带有 ?article=<handle>
    try {
      var initParams = new URLSearchParams(window.location.search);
      var initHandle = initParams.get('article');
      if (initHandle) {
        openArticleDetail(initHandle, false);
      }
    } catch (e) {}
  })();
})();
