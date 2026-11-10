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

  // 当前页面会话内存态（仅记录用户在当前进入页面后主动输入的备注与应用的折扣码，进入页面时始终为空，绝不跨次读取历史缓存）
  var currentSessionNote = '';
  var currentSessionDiscounts = [];
  var hasClearedEntryNoteAndDiscount = false;

  function loadSavedOrderNote() {
    return currentSessionNote || '';
  }

  function saveOrderNoteLocal(noteStr) {
    currentSessionNote = String(noteStr == null ? '' : noteStr);
    try { localStorage.removeItem(LOCAL_NOTE_KEY); } catch (e) {}
  }

  function loadSavedDiscountCodes() {
    return Array.isArray(currentSessionDiscounts) ? currentSessionDiscounts.slice() : [];
  }

  function saveDiscountCodesLocal(codes) {
    currentSessionDiscounts = Array.isArray(codes)
      ? codes.map(function (c) { return String(c || '').trim(); }).filter(Boolean)
      : [];
    try { localStorage.removeItem(LOCAL_DISCOUNTS_KEY); } catch (e) {}
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

    var noteStr = sfCart.note !== undefined && sfCart.note !== null ? String(sfCart.note) : '';
    var discCodes = Array.isArray(sfCart.discountCodes) ? sfCart.discountCodes : [];
    var applicableCodes = discCodes.filter(function (d) { return d && d.code && d.applicable !== false; }).map(function (d) { return d.code; });

    var enrichedCheckoutUrl = buildCheckoutUrlWithNoteAndDiscount(
      sfCart.checkoutUrl || getThemeRoute('cart_checkout_url', 'checkout'),
      noteStr,
      applicableCodes
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
      var lineItemInput = { merchandiseId: merchGid, quantity: qty };
      var cartInput = {
        lines: [lineItemInput]
      };
      var createMut = SF_CART_FRAGMENT + '\nmutation CartCreate($input: CartInput!) {\n  cartCreate(input: $input) {\n    cart { ...CartFields }\n    userErrors { field message code }\n  }\n}';
      return executeStorefrontGraphql(createMut, {
        input: cartInput
      }).then(function (res) {
        var payload = res && res.data && res.data.cartCreate;
        if (payload && payload.cart) {
          var norm = normalizeStorefrontCart(payload.cart, SF_CART_STORAGE_KEY);
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
      var addLineItem = { merchandiseId: merchGid, quantity: qty };
      var addLinesMut = SF_CART_FRAGMENT + '\nmutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {\n  cartLinesAdd(cartId: $cartId, lines: $lines) {\n    cart { ...CartFields }\n    userErrors { field message code }\n  }\n}';
      return executeStorefrontGraphql(addLinesMut, {
        cartId: saved.id,
        lines: [addLineItem]
      }).then(function (res) {
        var payload = res && res.data && res.data.cartLinesAdd;
        if (payload && payload.cart) {
          var norm = normalizeStorefrontCart(payload.cart, SF_CART_STORAGE_KEY);
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
   * 绝不把当前商品追加到已有购物车，绝不让顶部购物车角标 +1，且进入中间页时无任何历史备注和折扣码缓存
   */
  function createBuyNowStandaloneCheckoutUrl(variantId, quantity) {
    var qty = Math.max(1, parseInt(quantity, 10) || 1);
    var merchGid = toVariantGid(variantId);
    saveOrderNoteLocal('');
    saveDiscountCodesLocal([]);
    var lineItemInput = { merchandiseId: merchGid, quantity: qty };
    var cartInput = {
      lines: [lineItemInput]
    };

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
        checkoutUrl: apiUrl('cart/' + variantId + ':' + qty)
      };
    }).catch(function () {
      return {
        ok: true,
        intermediateUrl: intermediateUrl,
        checkoutUrl: apiUrl('cart/' + variantId + ':' + qty)
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
    // 顶部购物车角标永远只统计真实购物车（SF_CART_STORAGE_KEY + serverCart），绝不统计立即购买临时会话（BUY_NOW_CART_STORAGE_KEY）
    var sf = sfCart !== undefined ? sfCart : loadSavedStorefrontCart(SF_CART_STORAGE_KEY);
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
      // 始终读取真实购物车（SF_CART_STORAGE_KEY），绝不读取立即购买临时会话（BUY_NOW_CART_STORAGE_KEY），保证立即购买不会让顶部购物车角标 +1
      var regularSfCart = loadSavedStorefrontCart(SF_CART_STORAGE_KEY);
      if (!isBuyNowIntermediatePage() && regularSfCart && regularSfCart.checkoutUrl) {
        syncCheckoutLinksWithUrl(regularSfCart.checkoutUrl);
      }
      var initCart = getInitialServerCart();
      var combined = getCombinedCartItemCount(initCart, regularSfCart);
      updateCartCount(combined, false);
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
   * 10. 面向海外的以图搜图引擎（方案 2 + 方案 3 轻量组合：Cloudflare 全球边缘架构 + 1228 维多尺度特征向量 + VLM/OCR 语义融合 + shopify_suite 自动索引同步）
   * ----------------------------------------------------------------- */
  (function photoSearch() {
    var trigger = document.querySelector('[data-photo-trigger]');
    var fileInput = document.querySelector('[data-photo-file]');
    var modal = document.querySelector('[data-visual-search-modal]');
    if (!trigger) return;

    var catalogCache = null;
    var catalogPromise = null;
    var configuredWorkerUrl = '';

    function rgbToHsvJs(r, g, b) {
      var max = Math.max(r, Math.max(g, b));
      var min = Math.min(r, Math.min(g, b));
      var d = max - min;
      var v = max;
      var s = max === 0 ? 0 : d / max;
      var h = 0;
      if (max !== min) {
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h /= 6;
      }
      return [h, s, v];
    }

    function autoDetectForegroundBoxJs(pixels) {
      var bgR = (pixels[0][0][0] + pixels[0][63][0] + pixels[63][0][0] + pixels[63][63][0]) * 0.25;
      var bgG = (pixels[0][0][1] + pixels[0][63][1] + pixels[63][0][1] + pixels[63][63][1]) * 0.25;
      var bgB = (pixels[0][0][2] + pixels[0][63][2] + pixels[63][0][2] + pixels[63][63][2]) * 0.25;

      var minX = 63, minY = 63, maxX = 0, maxY = 0, fgCount = 0;
      for (var y = 0; y < 64; y++) {
        for (var x = 0; x < 64; x++) {
          var p = pixels[y][x];
          var dist = Math.abs(p[0] - bgR) + Math.abs(p[1] - bgG) + Math.abs(p[2] - bgB);
          if (dist > 0.16) {
            fgCount++;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (fgCount > 100 && (maxX - minX) >= 20 && (maxY - minY) >= 20 && ((maxX - minX) < 58 || (maxY - minY) < 58)) {
        return [minX, minY, maxX + 1, maxY + 1];
      }
      return [0, 0, 64, 64];
    }

    function sampleRegion12x12ZNormJs(pixels, x0, y0, x1, y1) {
      var w = Math.max(1, x1 - x0);
      var h = Math.max(1, y1 - y0);
      var vals = new Array(432);
      var idx = 0;

      for (var gy = 0; gy < 12; gy++) {
        for (var gx = 0; gx < 12; gx++) {
          var sy0 = y0 + Math.floor((gy * h) / 12);
          var sy1 = Math.max(sy0 + 1, y0 + Math.floor(((gy + 1) * h) / 12));
          var sx0 = x0 + Math.floor((gx * w) / 12);
          var sx1 = Math.max(sx0 + 1, x0 + Math.floor(((gx + 1) * w) / 12));
          var sr = 0, sg = 0, sb = 0, cnt = 0;
          for (var py = Math.max(0, sy0); py < Math.min(64, sy1); py++) {
            for (var px = Math.max(0, sx0); px < Math.min(64, sx1); px++) {
              sr += pixels[py][px][0];
              sg += pixels[py][px][1];
              sb += pixels[py][px][2];
              cnt++;
            }
          }
          if (cnt > 0) { sr /= cnt; sg /= cnt; sb /= cnt; }
          vals[idx++] = sr;
          vals[idx++] = sg;
          vals[idx++] = sb;
        }
      }

      for (var ch = 0; ch < 3; ch++) {
        var sum = 0;
        for (var i = ch; i < 432; i += 3) sum += vals[i];
        var mean = sum / 144;
        for (var j = ch; j < 432; j += 3) vals[j] -= mean;
      }

      var normSq = 0;
      for (var k = 0; k < 432; k++) normSq += vals[k] * vals[k];
      var norm = Math.sqrt(normSq);
      if (norm > 1e-6) {
        for (var m = 0; m < 432; m++) vals[m] = Number((vals[m] / norm).toFixed(4));
      }
      return vals;
    }

    function computeSpatialHsvPyramidJs(pixels, x0, y0, x1, y1) {
      var w = Math.max(1, x1 - x0);
      var h = Math.max(1, y1 - y0);
      var mx = x0 + Math.floor(w / 2);
      var my = y0 + Math.floor(h / 2);
      var regions = [
        [x0, y0, mx, my],
        [mx, y0, x1, my],
        [x0, my, mx, y1],
        [mx, my, x1, y1],
        [x0 + Math.floor(w / 5), y0 + Math.floor(h / 5), x1 - Math.floor(w / 5), y1 - Math.floor(h / 5)]
      ];
      var outVec = new Array(120);
      var offset = 0;
      for (var rIdx = 0; rIdx < 5; rIdx++) {
        var rx0 = regions[rIdx][0], ry0 = regions[rIdx][1], rx1 = regions[rIdx][2], ry1 = regions[rIdx][3];
        var bins = new Array(24).fill(0);
        var cnt = 0;
        for (var py = Math.max(0, ry0); py < Math.min(64, ry1); py++) {
          for (var px = Math.max(0, rx0); px < Math.min(64, rx1); px++) {
            var p = pixels[py][px];
            var hsv = rgbToHsvJs(p[0], p[1], p[2]);
            var hb = Math.min(7, Math.max(0, Math.floor(hsv[0] * 8)));
            var sb = hsv[1] < 0.22 ? 0 : (hsv[1] < 0.58 ? 1 : 2);
            bins[hb * 3 + sb] += 1;
            cnt += 1;
          }
        }
        for (var b = 0; b < 24; b++) {
          outVec[offset++] = cnt > 0 ? bins[b] / cnt : 0;
        }
      }
      var normSq = 0;
      for (var i = 0; i < 120; i++) normSq += outVec[i] * outVec[i];
      var norm = Math.sqrt(normSq);
      if (norm > 1e-6) {
        for (var j = 0; j < 120; j++) outVec[j] = Number((outVec[j] / norm).toFixed(4));
      }
      return outVec;
    }

    /**
     * 方案 3 核心：提取与 C# `VisualSearchIndexSyncService.Compute1228DimDescriptorFromBytes` 及 Cloudflare Worker 100% 同构的 1228 维跨尺度金字塔向量
     */
    function compute1228DimDescriptorFromImage(imgEl) {
      try {
        var canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        var ctx = canvas.getContext && canvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(imgEl, 0, 0, 64, 64);
        var raw = ctx.getImageData(0, 0, 64, 64).data;

        var pixels = [];
        for (var y = 0; y < 64; y++) {
          var row = [];
          for (var x = 0; x < 64; x++) {
            var pIdx = (y * 64 + x) * 4;
            row.push([raw[pIdx] / 255, raw[pIdx + 1] / 255, raw[pIdx + 2] / 255]);
          }
          pixels.push(row);
        }

        var box = autoDetectForegroundBoxJs(pixels);
        var fx0 = box[0], fy0 = box[1], fx1 = box[2], fy1 = box[3];
        var fw = Math.max(1, fx1 - fx0);
        var fh = Math.max(1, fy1 - fy0);

        var s0 = sampleRegion12x12ZNormJs(pixels, fx0, fy0, fx1, fy1);
        var ix16 = Math.floor(fw * 0.16);
        var iy16 = Math.floor(fh * 0.16);
        var s1 = sampleRegion12x12ZNormJs(pixels, fx0 + ix16, fy0 + iy16, fx1 - ix16, fy1 - iy16);
        var ix26 = Math.floor(fw * 0.26);
        var iy26 = Math.floor(fh * 0.26);
        var s2Full = sampleRegion12x12ZNormJs(pixels, fx0 + ix26, fy0 + iy26, fx1 - ix26, fy1 - iy26);
        var s2 = s2Full.slice(0, 244);
        var hsvPyr = computeSpatialHsvPyramidJs(pixels, fx0, fy0, fx1, fy1);

        return s0.concat(s1, s2, hsvPyr);
      } catch (e) {
        return null;
      }
    }

    function loadImageAndCompute1228Descriptor(srcUrl) {
      return new Promise(function (resolve) {
        if (!srcUrl || typeof Image !== 'function') {
          resolve(null);
          return;
        }
        var img = new Image();
        img.crossOrigin = 'anonymous';
        var timer = setTimeout(function () { resolve(null); }, 4500);
        img.onload = function () {
          clearTimeout(timer);
          resolve(compute1228DimDescriptorFromImage(img));
        };
        img.onerror = function () {
          clearTimeout(timer);
          resolve(null);
        };
        img.src = srcUrl;
      });
    }

    function dotSliceJs(a, b, startA, startB, len) {
      var dot = 0, na = 0, nb = 0;
      for (var i = 0; i < len; i++) {
        var va = Number(a[startA + i]) || 0;
        var vb = Number(b[startB + i]) || 0;
        dot += va * vb;
        na += va * va;
        nb += vb * vb;
      }
      return (na > 0 && nb > 0) ? (dot / (Math.sqrt(na) * Math.sqrt(nb))) : 0;
    }

    /**
     * 计算两个 1228 维跨尺度金字塔向量的混合相似度（自适应跨尺度对齐 + 5 区域空间 HSV 金字塔）
     */
    function compute1228Similarity(vecA, vecB) {
      if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length < 1228 || vecB.length < 1228) {
        return 0;
      }
      var sameScale = (dotSliceJs(vecA, vecB, 0, 0, 432) * 0.45) + (dotSliceJs(vecA, vecB, 432, 432, 432) * 0.55);
      var cropScale1 = dotSliceJs(vecA, vecB, 0, 432, 432) * 0.96;
      var cropScale2 = dotSliceJs(vecA, vecB, 432, 864, 244) * 0.95;
      var deepCropScale = dotSliceJs(vecA, vecB, 0, 864, 244) * 0.94;
      var bestSpatial = Math.max(sameScale, cropScale1, cropScale2, deepCropScale);

      var hsvSim = dotSliceJs(vecA, vecB, 1108, 1108, 120);
      var rawSim = (bestSpatial * 0.68) + (hsvSim * 0.32);
      return Math.max(0, Math.min(0.99, 0.5 + 0.5 * rawSim));
    }

    /**
     * 优先加载由 `shopify_suite` 商品管理工具自动构建并同步的 `assets/tcg-visual-index.json`（含全店每个 SKU 的预计算 1228 维向量与卡面编码），
     * 若未找到则自动回退至 Storefront GraphQL API 动态拉取并计算。
     */
    function fetchStoreVisualCatalog() {
      if (catalogCache) return Promise.resolve(catalogCache);
      if (catalogPromise) return catalogPromise;

      var staticIndexUrl = (window.TCG_ROUTES && window.TCG_ROUTES.visual_index_url)
        ? window.TCG_ROUTES.visual_index_url
        : apiUrl('assets/tcg-visual-index.json');

      catalogPromise = fetch(staticIndexUrl)
        .then(function (r) {
          if (!r.ok) throw new Error('index not found');
          return r.json();
        })
        .then(function (doc) {
          if (doc && doc.worker_endpoint && !configuredWorkerUrl) {
            configuredWorkerUrl = doc.worker_endpoint;
          }
          var items = (doc && Array.isArray(doc.items)) ? doc.items : [];
          if (items.length > 0) {
            catalogCache = items;
            return items;
          }
          throw new Error('empty index');
        })
        .catch(function () {
          // 动态回退：从 Shopify Storefront GraphQL API 拉取并现场计算 1228 维向量
          var sfQuery = [
            '{',
            '  products(first: 60) {',
            '    nodes {',
            '      id',
            '      title',
            '      handle',
            '      featuredImage { url }',
            '      images(first: 10) { nodes { id url altText } }',
            '      variants(first: 25) {',
            '        nodes {',
            '          id',
            '          title',
            '          sku',
            '          availableForSale',
            '          price { amount currencyCode }',
            '          image { url }',
            '        }',
            '      }',
            '    }',
            '  }',
            '}'
          ].join('\n');

          return executeStorefrontGraphql(sfQuery, {})
            .then(function (res) {
              var pNodes = (res && res.data && res.data.products && Array.isArray(res.data.products.nodes))
                ? res.data.products.nodes
                : [];
              var entries = [];
              pNodes.forEach(function (p) {
                var variants = (p.variants && Array.isArray(p.variants.nodes)) ? p.variants.nodes : [];
                var defaultVar = variants[0] || {};
                var seenImgs = {};

                variants.forEach(function (v) {
                  var imgUrl = (v.image && v.image.url) || (p.featuredImage && p.featuredImage.url) || '';
                  if (!imgUrl) return;
                  var key = p.handle + '::' + extractNumericId(v.id) + '::' + imgUrl;
                  if (seenImgs[key]) return;
                  seenImgs[key] = true;
                  var priceCents = v.price && v.price.amount ? Math.round(parseFloat(v.price.amount) * 100) : 0;
                  entries.push({
                    product_title: p.title || 'Product',
                    handle: p.handle || '',
                    variant_id: extractNumericId(v.id),
                    variant_title: (v.title && v.title !== 'Default Title') ? v.title : '',
                    sku: v.sku || '',
                    price_cents: priceCents,
                    image: imgUrl,
                    url: apiUrl('products/' + p.handle + '?variant=' + extractNumericId(v.id)),
                    search_blob: ((p.title || '') + ' ' + (v.title || '') + ' ' + (v.sku || '') + ' ' + imgUrl).toLowerCase()
                  });
                });

                var extraImgs = (p.images && Array.isArray(p.images.nodes)) ? p.images.nodes : [];
                extraImgs.forEach(function (im) {
                  if (!im || !im.url) return;
                  var alreadyUsed = entries.some(function (e) { return e.image === im.url && e.handle === p.handle; });
                  if (alreadyUsed) return;
                  var priceCents = defaultVar.price && defaultVar.price.amount ? Math.round(parseFloat(defaultVar.price.amount) * 100) : 0;
                  entries.push({
                    product_title: p.title || 'Product',
                    handle: p.handle || '',
                    variant_id: extractNumericId(defaultVar.id || ''),
                    variant_title: (defaultVar.title && defaultVar.title !== 'Default Title') ? defaultVar.title : '',
                    sku: defaultVar.sku || '',
                    price_cents: priceCents,
                    image: im.url,
                    url: apiUrl('products/' + p.handle),
                    search_blob: ((p.title || '') + ' ' + (im.altText || '') + ' ' + (defaultVar.sku || '') + ' ' + im.url).toLowerCase()
                  });
                });
              });

              return Promise.all(entries.map(function (entry) {
                return loadImageAndCompute1228Descriptor(entry.image).then(function (vec) {
                  entry.vector_1228 = vec;
                  return entry;
                });
              })).then(function (readyEntries) {
                catalogCache = readyEntries;
                return readyEntries;
              });
            })
            .catch(function () {
              catalogCache = [];
              return [];
            });
        });

      return catalogPromise;
    }

    function openVisualSearchModal() {
      if (!modal) {
        if (fileInput) fileInput.click();
        return;
      }
      modal.removeAttribute('hidden');
      modal.hidden = false;
      fetchStoreVisualCatalog();
    }

    function closeVisualSearchModal() {
      if (!modal) return;
      modal.setAttribute('hidden', '');
      modal.hidden = true;
    }

    function renderVisualSearchResults(rankedList, keywordHint) {
      if (!modal) return;
      var grid = modal.querySelector('[data-vsearch-results-grid]');
      var fullSearchLink = modal.querySelector('[data-vsearch-full-search-link]');
      var titleSpan = modal.querySelector('[data-vsearch-results-title]');

      if (fullSearchLink) {
        if (keywordHint) {
          fullSearchLink.setAttribute('href', apiUrl('search?type=product&q=' + encodeURIComponent(keywordHint)));
          fullSearchLink.removeAttribute('hidden');
          fullSearchLink.hidden = false;
        } else {
          fullSearchLink.setAttribute('hidden', '');
          fullSearchLink.hidden = true;
        }
      }

      if (!grid) return;
      if (!rankedList || !rankedList.length) {
        grid.innerHTML = '<div class="tcg-vsearch-empty"><p>No matching products found in catalog.</p></div>';
        return;
      }

      if (titleSpan) {
        titleSpan.textContent = 'Top Visual Matches (' + rankedList.length + ')';
      }

      grid.innerHTML = rankedList.map(function (item) {
        var scorePct = Math.min(99, Math.max(68, Math.round((item.score || 0.85) * 100)));
        var vSub = item.variant_title ? escapeHtml(item.variant_title) : (item.sku ? 'SKU: ' + escapeHtml(item.sku) : 'In Stock');
        return (
          '<div class="tcg-vsearch-card" data-vsearch-result-card data-variant-id="' + escapeHtml(item.variant_id) + '">' +
            '<a href="' + escapeHtml(item.url) + '" class="tcg-vsearch-card-media">' +
              '<span class="tcg-vsearch-score">' + scorePct + '% Match</span>' +
              '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.product_title) + '" loading="lazy">' +
            '</a>' +
            '<div class="tcg-vsearch-card-info">' +
              '<a href="' + escapeHtml(item.url) + '" class="tcg-vsearch-card-title">' + escapeHtml(item.product_title) + '</a>' +
              '<span class="tcg-vsearch-card-variant">' + vSub + '</span>' +
              '<div class="tcg-vsearch-card-foot">' +
                '<span class="tcg-vsearch-card-price">' + escapeHtml(formatMoneyCents(item.price_cents || 0)) + '</span>' +
                '<button type="button" class="_addBtn_36e53_338" data-add data-variant="' + escapeHtml(item.variant_id) + '" aria-label="Add to cart" style="position:static;width:2rem;height:2rem;">' +
                  PLUS_ICON +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }).join('');
    }

    function processVisualSearchFile(fileObj) {
      if (!fileObj) return;
      if (!modal) {
        window.location.href = apiUrl('search');
        return;
      }
      openVisualSearchModal();

      var previewWrap = modal.querySelector('[data-vsearch-preview-wrap]');
      var previewImg = modal.querySelector('[data-vsearch-preview-img]');
      var promptEl = modal.querySelector('[data-vsearch-prompt]');
      var scanLine = modal.querySelector('[data-vsearch-scan-line]');
      var statusEl = modal.querySelector('[data-vsearch-status]');

      var rawFileName = String(fileObj.name || '').replace(/\.[a-zA-Z0-9]+$/, '');
      var codeMatch = rawFileName.match(/([a-zA-Z0-9]{2,6}-\d{2,4}-\d{2,4}|\d{2,3}\/\d{2,3})/i);
      var extractedCardCode = codeMatch ? codeMatch[1].toLowerCase() : '';
      var fileNameTokens = rawFileName
        .split(/[\s_\-.]+/)
        .map(function (t) { return t.toLowerCase(); })
        .filter(function (t) { return t.length >= 2 && !/^(img|image|photo|pic|screenshot|wechat|whatsapp|\d{8,})$/.test(t); });

      if (statusEl) {
        statusEl.textContent = 'Extracting 1228-dim visual vector & VLM/OCR semantics…';
      }
      if (scanLine) {
        scanLine.removeAttribute('hidden');
        scanLine.hidden = false;
      }

      var reader = typeof FileReader === 'function' ? new FileReader() : null;
      var dataUrlPromise = new Promise(function (resolve) {
        if (!reader) {
          resolve('');
          return;
        }
        reader.onload = function (ev) { resolve(String((ev && ev.target && ev.target.result) || '')); };
        reader.onerror = function () { resolve(''); };
        reader.readAsDataURL(fileObj);
      });

      dataUrlPromise.then(function (dataUrl) {
        if (dataUrl && previewImg && previewWrap && promptEl) {
          previewImg.setAttribute('src', dataUrl);
          previewImg.src = dataUrl;
          previewWrap.removeAttribute('hidden');
          previewWrap.hidden = false;
          promptEl.setAttribute('hidden', '');
          promptEl.hidden = true;
        }

        return Promise.all([
          loadImageAndCompute1228Descriptor(dataUrl),
          fetchStoreVisualCatalog()
        ]).then(function (pair) {
          var queryVec = pair[0];
          var catalog = pair[1] || [];

          // 方案 2 + 方案 3 Cloudflare Edge Worker 协同检索（若配置了 Worker 地址则调用边缘端 VLM + Vectorize）
          var customEndpoint = modal.getAttribute('data-visual-search-endpoint')
            || (window.TCG_ROUTES && window.TCG_ROUTES.visual_search_endpoint)
            || configuredWorkerUrl
            || '';
          if (customEndpoint) {
            var searchEndpoint = customEndpoint.replace(/\/+$/, '');
            if (!/\/search$/i.test(searchEndpoint)) searchEndpoint += '/search';
            return fetch(searchEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify({
                image: dataUrl,
                filename: fileObj.name || '',
                vector_1228: queryVec || [],
                catalog: catalog
              })
            })
              .then(function (r) { return r.json(); })
              .then(function (cfRes) {
                return [queryVec, catalog, cfRes];
              })
              .catch(function () {
                return [queryVec, catalog, null];
              });
          }
          return [queryVec, catalog, null];
        });
      }).then(function (triple) {
        var queryVec = triple[0];
        var catalog = triple[1] || [];
        var cfRes = triple[2];

        if (scanLine) {
          scanLine.setAttribute('hidden', '');
          scanLine.hidden = true;
        }

        // 若 Cloudflare Worker 直接返回了混合排序结果，优先使用
        if (cfRes && Array.isArray(cfRes.matches) && cfRes.matches.length > 0) {
          var cfTop = cfRes.matches.slice(0, 6);
          if (statusEl) {
            statusEl.textContent = 'Found ' + cfTop.length + ' visual matches via Cloudflare Edge (Vision + Vectorize).';
          }
          renderVisualSearchResults(cfTop, cfRes.query || (cfTop[0] ? cfTop[0].product_title : ''));
          return;
        }

        var aiKeywords = (cfRes && (cfRes.query || cfRes.keywords))
          ? String(cfRes.query || cfRes.keywords).toLowerCase().split(/\s+/).filter(Boolean)
          : [];
        var allTokens = fileNameTokens.concat(aiKeywords);
        var cardCode = (cfRes && cfRes.card_code) ? String(cfRes.card_code).toLowerCase() : extractedCardCode;

        var scored = catalog.map(function (entry) {
          var vSim = (queryVec && Array.isArray(entry.vector_1228) && entry.vector_1228.length >= 768)
            ? compute1228Similarity(queryVec, entry.vector_1228)
            : 0.72;
          var tokenBoost = 0;
          var blob = String(entry.search_blob || '').toLowerCase();
          if (cardCode && blob.indexOf(cardCode) !== -1) {
            tokenBoost += 0.22;
          }
          allTokens.forEach(function (tok) {
            if (blob.indexOf(tok) !== -1) tokenBoost += 0.06;
          });
          return Object.assign({}, entry, {
            visual_score: vSim,
            score: Math.min(0.995, vSim + Math.min(0.28, tokenBoost))
          });
        });

        scored.sort(function (a, b) { return b.score - a.score; });

        // 按 handle + image 去重，保留最精确的 SKU 变体，取 Top 6
        var topMatches = [];
        var seenKey = {};
        for (var i = 0; i < scored.length; i++) {
          var cleanImg = String(scored[i].image || '').split('?')[0];
          var k = scored[i].handle + '::' + cleanImg;
          if (!seenKey[k]) {
            seenKey[k] = true;
            topMatches.push(scored[i]);
          }
          if (topMatches.length >= 6) break;
        }

        var topKeyword = (cfRes && cfRes.query) || (topMatches[0] ? topMatches[0].product_title : '');
        if (statusEl) {
          statusEl.textContent = topMatches.length > 0
            ? ('Found ' + topMatches.length + ' high-precision SKU matches (' + Math.round((topMatches[0].score || 0.95) * 100) + '% top match).')
            : 'No direct match found.';
        }
        renderVisualSearchResults(topMatches, topKeyword);
      });
    }

    trigger.addEventListener('click', function (e) {
      if (e.preventDefault) e.preventDefault();
      openVisualSearchModal();
    });

    if (fileInput) {
      fileInput.addEventListener('change', function () {
        var f = (fileInput.files && fileInput.files[0]) ? fileInput.files[0] : null;
        if (f) processVisualSearchFile(f);
      });
    }

    if (modal) {
      on('[data-vsearch-close]', 'click', function (e) {
        if (e.preventDefault) e.preventDefault();
        closeVisualSearchModal();
      }, modal);

      on('[data-vsearch-reupload], [data-vsearch-dropzone]', 'click', function (e) {
        if (e.preventDefault) e.preventDefault();
        if (fileInput) fileInput.click();
      }, modal);

      var dropzone = modal.querySelector('[data-vsearch-dropzone]');
      if (dropzone) {
        dropzone.addEventListener('dragover', function (e) {
          if (e.preventDefault) e.preventDefault();
          dropzone.classList.add('is-dragover');
        });
        dropzone.addEventListener('dragleave', function () {
          dropzone.classList.remove('is-dragover');
        });
        dropzone.addEventListener('drop', function (e) {
          if (e.preventDefault) e.preventDefault();
          dropzone.classList.remove('is-dragover');
          var dt = e.dataTransfer;
          if (dt && dt.files && dt.files[0]) {
            processVisualSearchFile(dt.files[0]);
          }
        });
      }

      window.addEventListener('paste', function (e) {
        if (modal.hasAttribute('hidden')) return;
        var items = (e.clipboardData && e.clipboardData.items) ? e.clipboardData.items : [];
        for (var i = 0; i < items.length; i++) {
          if (items[i].type && items[i].type.indexOf('image/') === 0) {
            var blob = items[i].getAsFile();
            if (blob) {
              processVisualSearchFile(blob);
              break;
            }
          }
        }
      });

      window.addEventListener('keydown', function (e) {
        if (!modal.hasAttribute('hidden') && e.key === 'Escape') {
          closeVisualSearchModal();
        }
      });
    }
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

  function clearEntryNoteAndDiscountCacheOnPageLoad() {
    if (hasClearedEntryNoteAndDiscount) return;
    hasClearedEntryNoteAndDiscount = true;

    saveOrderNoteLocal('');
    saveDiscountCodesLocal([]);

    var cartSection = document.querySelector('[data-tcg-cart-section], [data-tcg-checkout-section]');
    if (!cartSection) return;

    // 1. 清空页面上的备注框、折扣码输入框与折扣胶囊
    cartSection.querySelectorAll('[data-cart-note]').forEach(function (ta) {
      ta.value = '';
    });
    cartSection.querySelectorAll('[data-cart-note-status]').forEach(function (el) {
      el.setAttribute('hidden', '');
      el.hidden = true;
    });
    cartSection.querySelectorAll('[data-cart-discount]').forEach(function (inp) {
      inp.value = '';
    });
    cartSection.querySelectorAll('[data-cart-discount-pills]').forEach(function (ul) {
      ul.innerHTML = '';
    });
    cartSection.querySelectorAll('[data-cart-discount-error]').forEach(function (err) {
      err.setAttribute('hidden', '');
      err.hidden = true;
    });

    // 2. 重置本地存储的 Storefront Cart / BuyNow Cart 中的历史备注与折扣缓存，恢复商品原价显示
    [SF_CART_STORAGE_KEY, BUY_NOW_CART_STORAGE_KEY].forEach(function (key) {
      var c = loadSavedStorefrontCart(key);
      if (c && c.id) {
        c.note = '';
        c.discount_codes = [];
        c.total_discount = 0;
        if (Array.isArray(c.items)) {
          var sumOrig = 0;
          c.items.forEach(function (it) {
            var q = Math.max(1, Number(it.quantity) || 1);
            var origU = Number(it.original_price !== undefined ? it.original_price : it.final_price) || 0;
            it.final_price = origU;
            it.original_line_price = origU * q;
            it.final_line_price = origU * q;
            it.line_discount = 0;
            it.attributes = [];
            sumOrig += (origU * q);
          });
          c.original_total_price = sumOrig;
          c.total_price = sumOrig;
        }
        c.checkoutUrl = buildCheckoutUrlWithNoteAndDiscount(c.rawCheckoutUrl || c.checkoutUrl, '', []);
        saveStorefrontCart(c, key);

        // 异步同步清空远端 Storefront Cart 的备注与折扣码
        var resetMut = SF_CART_FRAGMENT + '\nmutation ClearCartNoteAndDiscounts($cartId: ID!) {\n  cartNoteUpdate(cartId: $cartId, note: "") { cart { ...CartFields } }\n  cartAttributesUpdate(attributes: [], cartId: $cartId) { cart { ...CartFields } }\n  cartDiscountCodesUpdate(cartId: $cartId, discountCodes: []) { cart { ...CartFields } }\n}';
        executeStorefrontGraphql(resetMut, { cartId: c.id }).catch(function () {});
      }
    });

    // 3. 异步清空 Shopify 服务端 /cart 会话中的历史备注与折扣码缓存
    var updateUrl = getThemeRoute('cart_update_url', 'cart/update.js');
    if (!/\.js($|\?)/.test(updateUrl)) {
      updateUrl = updateUrl.replace(/\/?$/, '.js');
    }
    fetch(updateUrl, fetchConfig('json', {
      body: JSON.stringify({ note: '', discount: '', attributes: { 'Order Note': '' } })
    })).catch(function () {});
  }

  function renderStorefrontCartItemsInCartPage(serverCartOverride) {
    var cartSection = document.querySelector('[data-tcg-cart-section], [data-tcg-checkout-section]');
    if (!cartSection) return;

    clearEntryNoteAndDiscountCacheOnPageLoad();

    var sfContainer = cartSection.querySelector('[data-storefront-cart-items]');
    var serverContainer = cartSection.querySelector('[data-shopify-cart-items]');
    var buyNowMode = isBuyNowIntermediatePage();
    var cartStepsBar = cartSection.querySelector('[data-cart-steps-bar]');
    var buyNowStepsBar = cartSection.querySelector('[data-buy-now-steps-bar]');
    var sfCart = loadSavedStorefrontCart();
    var seenServerVids = {};
    var serverCount = 0;
    var serverOrigSubtotalCents = 0;
    var serverFinalSubtotalCents = 0;
    var serverLineDiscountCents = 0;

    if (buyNowMode) {
      // 立即购买中间界面：顶部进度条仅保留 "1 Checkout & Payment -> 2 Confirmation"
      if (cartStepsBar) {
        cartStepsBar.setAttribute('hidden', '');
        cartStepsBar.hidden = true;
      }
      if (buyNowStepsBar) {
        buyNowStepsBar.removeAttribute('hidden');
        buyNowStepsBar.hidden = false;
      }
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
      // 购物车界面：保持 "1 Cart -> 2 Checkout & Payment -> 3 Confirmation" 不变
      if (cartStepsBar) {
        cartStepsBar.removeAttribute('hidden');
        cartStepsBar.hidden = false;
      }
      if (buyNowStepsBar) {
        buyNowStepsBar.setAttribute('hidden', '');
        buyNowStepsBar.hidden = true;
      }
      if (serverContainer) {
        serverContainer.removeAttribute('hidden');
        serverContainer.hidden = false;
      }
      var hasActiveUserDiscount = currentSessionDiscounts.length > 0;
      cartSection.querySelectorAll('[data-cart-row][data-cart-source="shopify"]').forEach(function (row) {
        var vid = row.getAttribute('data-variant-id');
        if (vid) seenServerVids[String(vid)] = true;
        var q = parseInt(row.getAttribute('data-quantity'), 10) || 0;
        var origUnitAttr = parseInt(row.getAttribute('data-original-unit-price'), 10);
        var finalUnitAttr = parseInt(row.getAttribute('data-unit-price'), 10);
        var unitOrig = !isNaN(origUnitAttr) && origUnitAttr >= 0 ? origUnitAttr : (!isNaN(finalUnitAttr) ? finalUnitAttr : 0);
        var unitFinal = hasActiveUserDiscount && !isNaN(finalUnitAttr) && finalUnitAttr >= 0 ? finalUnitAttr : unitOrig;

        var origLineAttr = parseInt(row.getAttribute('data-original-line-price'), 10);
        var finalLineAttr = parseInt(row.getAttribute('data-line-price'), 10);
        var lineOrig = !isNaN(origLineAttr) && origLineAttr >= 0 ? origLineAttr : (unitOrig * q);
        var lineFinal = hasActiveUserDiscount && !isNaN(finalLineAttr) && finalLineAttr >= 0 ? finalLineAttr : lineOrig;
        var lineDiscAttr = parseInt(row.getAttribute('data-line-discount'), 10);
        var lineDisc = hasActiveUserDiscount
          ? (!isNaN(lineDiscAttr) && lineDiscAttr >= 0 ? lineDiscAttr : Math.max(0, lineOrig - lineFinal))
          : 0;

        var rowCompareEl = row.querySelector('[data-row-line-compare]');
        if (rowCompareEl) {
          if (hasActiveUserDiscount && lineOrig > lineFinal) {
            rowCompareEl.textContent = formatMoneyCents(lineOrig);
            rowCompareEl.removeAttribute('hidden');
            rowCompareEl.hidden = false;
          } else {
            rowCompareEl.setAttribute('hidden', '');
            rowCompareEl.hidden = true;
          }
        }
        var rowLineTotalEl = row.querySelector('[data-row-line-total]');
        if (rowLineTotalEl) {
          rowLineTotalEl.textContent = formatMoneyCents(lineFinal);
        }

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

    var activeNote = currentSessionNote || '';
    cartSection.querySelectorAll('[data-cart-note]').forEach(function (ta) {
      if (document.activeElement !== ta) {
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
      if (currentSessionDiscounts.length > 0 && typeof serverCartOverride.total_price === 'number') {
        serverFinalSubtotalCents = serverCartOverride.total_price;
      } else {
        serverFinalSubtotalCents = serverOrigSubtotalCents;
      }
      if (currentSessionDiscounts.length > 0 && typeof serverCartOverride.total_discount === 'number') {
        serverLineDiscountCents = serverCartOverride.total_discount;
      } else {
        serverLineDiscountCents = 0;
      }
    } else if (serverCount > 0 && currentSessionDiscounts.length > 0) {
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

    if (buyNowMode) {
      // 立即购买中间界面：顶部导航栏购物车角标必须始终反映用户真实的购物车件数，绝不能因为进入立即购买中间页而 +1
      var realCartCount = getCombinedCartItemCount(getInitialServerCart(), loadSavedStorefrontCart(SF_CART_STORAGE_KEY));
      updateCartCount(realCartCount, false);
    } else {
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

    // 渲染当前用户在本次会话中主动应用的折扣码胶囊（刚进入页面时 currentSessionDiscounts 为空，不渲染任何历史缓存折扣码）
    var activeDiscounts = loadSavedDiscountCodes();
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
      } else {
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

  /* -------------------------------------------------------------------
   * 18. TCG Expansions 左右双栏联动扩展包目录页交互（点击左侧更新右侧 + 图片懒加载 + Grid/Table 视图切换 + 左右自定义区块合并）
   * ----------------------------------------------------------------- */
  (function expansionsDirectoryController() {
    var expSection = document.querySelector('[data-tcg-expansions-section]');
    if (!expSection) return;

    var listView = expSection.querySelector('[data-expansions-list-view]');
    var detailView = expSection.querySelector('[data-expansion-detail-view]');
    var sidebarList = expSection.querySelector('[data-exp-sidebar-list]');
    var groupsContainer = expSection.querySelector('[data-expansions-groups-container]');
    var currentMode = expSection.getAttribute('data-view-mode-initial-value') || 'grid';
    var currentGameKey = (expSection.getAttribute('data-default-game') || 'pokemon').toLowerCase();
    var expansionLookup = {};
    var lazyObserver = null;

    function escAttr(str) {
      return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    function normalizeGameKey(raw) {
      var k = String(raw || 'pokemon').toLowerCase().trim();
      if (k === 'magic-the-gathering' || k === 'magicthegathering' || k === 'mtg') return 'magic';
      if (k === 'one-piece') return 'onepiece';
      if (k === 'yu-gi-oh' || k === 'yu-gi-oh!') return 'yugioh';
      return k;
    }

    function gameSlugForLogo(gameKey) {
      var k = normalizeGameKey(gameKey);
      if (k === 'magic') return 'magicthegathering';
      return k;
    }

    /* 18.1 图片懒加载观察器（配合原生 loading="lazy" 与 data-lazy-src 按需加载） */
    function initLazyObserver() {
      if (lazyObserver) lazyObserver.disconnect();
      if ('IntersectionObserver' in window) {
        lazyObserver = new IntersectionObserver(function (entries, obs) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var img = entry.target;
            var lazySrc = img.getAttribute('data-lazy-src');
            if (lazySrc) {
              img.src = lazySrc;
              img.removeAttribute('data-lazy-src');
            }
            obs.unobserve(img);
          });
        }, { rootMargin: '280px 0px' });
      }
      expSection.querySelectorAll('img[data-lazy-src]').forEach(function (img) {
        if (lazyObserver) {
          lazyObserver.observe(img);
        } else {
          img.src = img.getAttribute('data-lazy-src');
          img.removeAttribute('data-lazy-src');
        }
      });
    }

    /* 18.2 若左侧栏为空（例如在通用 page 模板下未配置 Block），从内置目录自动生成左侧栏 */
    function ensureSidebarPopulated() {
      if (!sidebarList) return;
      if (sidebarList.querySelectorAll('[data-exp-game-item]').length > 0) return;
      var cat = window.TCG_EXPANSIONS_CATALOG;
      if (!cat) return;

      var order = ['pokemon', 'lorcana', 'magic', 'gundam', 'onepiece', 'riftbound', 'digimon', 'yugioh'];
      var html = [];
      order.forEach(function (key) {
        var g = cat[key];
        if (!g) return;
        var active = key === currentGameKey;
        var locked = Boolean(g.locked);
        var expanded = (key === 'riftbound' || active) && !locked;
        var subItems = (g.navGroups && g.navGroups[0] && g.navGroups[0].items) || [];
        var subTitle = (g.navGroups && g.navGroups[0] && g.navGroups[0].title) || 'Latest Expansions';

        var subListHtml = subItems.map(function (si) {
          return (
            '<li>' +
              '<a href="?game=' + encodeURIComponent(key) + '&expansion=' + encodeURIComponent(si.id) + '" class="tcg-exp-sub-link" data-exp-sub-item data-game-key="' + escAttr(key) + '" data-expansion-target="' + escAttr(si.id) + '">' +
                '<span class="tcg-exp-sub-pipe" aria-hidden="true"></span>' +
                '<span class="tcg-exp-sub-text">' + escAttr(si.label) + '</span>' +
              '</a>' +
            '</li>'
          );
        }).join('');

        html.push(
          '<li class="tcg-exp-nav-item' + (active ? ' is-active' : '') + (expanded ? ' is-expanded' : '') + (locked ? ' is-locked' : '') + '" ' +
            'data-exp-game-item data-game-key="' + escAttr(key) + '" ' +
            'data-header-title="' + escAttr(g.headerTitle || g.navTitle) + '" ' +
            'data-header-desc="' + escAttr(g.description || '') + '" ' +
            'data-game-icon="' + escAttr(g.icon || '') + '" ' +
            'data-watermark-url="' + escAttr(g.watermark || '') + '" ' +
            'data-locked="' + (locked ? 'true' : 'false') + '">' +
            '<button type="button" class="tcg-exp-nav-trigger" data-exp-game-trigger="' + escAttr(key) + '" aria-expanded="' + (expanded ? 'true' : 'false') + '">' +
              '<span class="tcg-exp-nav-left">' +
                (g.icon
                  ? '<img src="' + escAttr(g.icon) + '" alt="' + escAttr(g.navTitle) + '" width="20" height="20" loading="lazy" decoding="async" class="tcg-exp-nav-icon">'
                  : '<span class="tcg-exp-nav-icon-placeholder" aria-hidden="true">◈</span>') +
                '<span class="tcg-exp-nav-title">' + escAttr(g.navTitle) + '</span>' +
                (locked ? '<span class="tcg-exp-locked-badge">LOCKED</span>' : '') +
              '</span>' +
              '<span class="tcg-exp-nav-right" aria-hidden="true">' +
                (locked
                  ? '<svg class="tcg-exp-lock-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5Zm-3 8V6a3 3 0 1 1 6 0v3H9Z"/></svg>'
                  : '<svg class="tcg-exp-chevron-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>') +
              '</span>' +
            '</button>' +
            (!locked
              ? '<div class="tcg-exp-nav-subpanel"' + (expanded ? '' : ' hidden') + ' data-exp-subpanel>' +
                  '<a href="#expansions-header" class="tcg-exp-sub-heading" data-exp-sub-all="' + escAttr(key) + '">' +
                    '<span class="tcg-exp-sub-square"></span>' +
                    '<span>' + escAttr(subTitle) + '</span>' +
                  '</a>' +
                  '<ul class="tcg-exp-sub-list">' + subListHtml + '</ul>' +
                  '<a href="/pages/about" class="tcg-exp-sub-heading tcg-exp-sub-extra">' +
                    '<span class="tcg-exp-sub-square"></span>' +
                    '<span>API Docs</span>' +
                  '</a>' +
                '</div>'
              : '') +
          '</li>'
        );
      });
      sidebarList.innerHTML = html.join('');
    }

    /* 18.3 读取商家/用户在右侧配置的自定义 expansion_item 区块，并与全量数据集智能合并（自定义项优先覆盖或插入到对应分组顶部） */
    function getMergedGroupsForGame(gameKey) {
      var normKey = normalizeGameKey(gameKey);
      var cat = window.TCG_EXPANSIONS_CATALOG || {};
      var baseGroups = (cat[normKey] && Array.isArray(cat[normKey].groups))
        ? JSON.parse(JSON.stringify(cat[normKey].groups))
        : [];

      // 收集自定义区块 [data-custom-exp-item]
      var customNodes = expSection.querySelectorAll('[data-custom-exp-item]');
      var customItems = [];
      customNodes.forEach(function (node) {
        var nk = normalizeGameKey(node.getAttribute('data-game-key') || 'pokemon');
        if (nk !== normKey) return;
        customItems.push({
          blockId: node.getAttribute('data-block-id') || '',
          heScope: node.getAttribute('data-he-scope') || '',
          heSection: node.getAttribute('data-he-section') || '',
          heBlock: node.getAttribute('data-he-block') || '',
          heLabel: node.getAttribute('data-he-label') || '',
          heSelected: node.getAttribute('data-he-selected') || '',
          groupName: (node.getAttribute('data-group-name') || 'MEGA EVOLUTION').trim(),
          id: (node.getAttribute('data-exp-id') || '').trim(),
          name: (node.getAttribute('data-exp-name') || '').trim(),
          date: (node.getAttribute('data-exp-date') || '').trim(),
          cards: Number(node.getAttribute('data-exp-cards')) || 0,
          logo: (node.getAttribute('data-exp-logo') || '').trim(),
          collectionUrl: (node.getAttribute('data-collection-url') || '').trim()
        });
      });

      // 将自定义项按反向顺序合并（保证前面的 Block 排在对应分组最前面，同 ID 项直接覆盖原数据）
      for (var cIdx = customItems.length - 1; cIdx >= 0; cIdx--) {
        var ci = customItems[cIdx];
        if (!ci.id && !ci.name) continue;
        var targetGrp = null;
        for (var g = 0; g < baseGroups.length; g++) {
          if (String(baseGroups[g].group || '').toUpperCase() === ci.groupName.toUpperCase()) {
            targetGrp = baseGroups[g];
            break;
          }
        }
        if (!targetGrp) {
          targetGrp = {
            group: ci.groupName,
            slug: ci.groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            count: 0,
            items: []
          };
          baseGroups.unshift(targetGrp);
        }

        // 查找同 ID 项并移除旧项，再插入自定义项到最前
        var existingIdx = -1;
        for (var k = 0; k < targetGrp.items.length; k++) {
          if (String(targetGrp.items[k].id || '').toUpperCase() === ci.id.toUpperCase()) {
            existingIdx = k;
            break;
          }
        }
        if (existingIdx >= 0) {
          targetGrp.items.splice(existingIdx, 1);
        }
        targetGrp.items.unshift({
          id: ci.id,
          name: ci.name,
          date: ci.date,
          cards: ci.cards,
          logo: ci.logo || ('https://images.scrydex.com/' + gameSlugForLogo(normKey) + '/' + ci.id + '-logo/logo'),
          collectionUrl: ci.collectionUrl,
          heScope: ci.heScope,
          heSection: ci.heSection,
          heBlock: ci.heBlock,
          heLabel: ci.heLabel,
          heSelected: ci.heSelected
        });
        targetGrp.count = targetGrp.items.length;
      }

      return baseGroups;
    }

    /* 18.4 渲染右侧当前选中游戏的顶部 Header 与下方扩展包分组列表 */
    function renderRightPaneForGame(gameKey) {
      var normKey = normalizeGameKey(gameKey);
      currentGameKey = normKey;

      var cat = (window.TCG_EXPANSIONS_CATALOG && window.TCG_EXPANSIONS_CATALOG[normKey]) || null;
      var navItem = expSection.querySelector('[data-exp-game-item][data-game-key="' + normKey + '"]') ||
                    expSection.querySelector('[data-exp-game-item][data-game-key="' + gameKey + '"]');

      var hTitle = (navItem && navItem.getAttribute('data-header-title')) || (cat && cat.headerTitle) || normKey.toUpperCase();
      var hDesc = (navItem && navItem.getAttribute('data-header-desc')) || (cat && cat.description) || '';
      var hIcon = (navItem && navItem.getAttribute('data-game-icon')) || (cat && cat.icon) || '';
      var hWatermark = (navItem && navItem.getAttribute('data-watermark-url')) || (cat && cat.watermark) || '';

      var titleEl = expSection.querySelector('[data-exp-header-title]');
      var descEl = expSection.querySelector('[data-exp-header-desc]');
      var iconEl = expSection.querySelector('[data-exp-header-icon]');
      var wmEl = expSection.querySelector('[data-exp-header-watermark]');
      var crumbEl = expSection.querySelector('[data-exp-breadcrumb-current]');

      if (titleEl) titleEl.textContent = hTitle;
      if (descEl) descEl.textContent = hDesc;
      if (iconEl) {
        if (hIcon) {
          iconEl.src = hIcon;
          iconEl.alt = hTitle;
          if (iconEl.parentElement) iconEl.parentElement.style.display = '';
        } else if (iconEl.parentElement) {
          iconEl.parentElement.style.display = 'none';
        }
      }
      if (wmEl) {
        if (hWatermark) {
          wmEl.src = hWatermark;
          wmEl.style.display = '';
        } else {
          wmEl.style.display = 'none';
        }
      }
      if (crumbEl) {
        crumbEl.setAttribute('data-game', normKey === 'onepiece' ? 'one-piece' : normKey);
      }

      if (!groupsContainer) return;
      var groups = getMergedGroupsForGame(normKey);
      if (!groups.length) {
        groupsContainer.innerHTML =
          '<section class="tcg-exp-group">' +
            '<div class="tcg-exp-group-head"><h2>COMING SOON</h2></div>' +
            '<p style="color:var(--tcg-text-muted);padding:1rem 0.25rem;">This game catalog is currently locked or has no expansion items configured yet. You can add or unlock expansions in the editor.</p>' +
          '</section>';
        return;
      }

      var isTable = currentMode === 'table';
      var htmlParts = [];
      var slugPrefix = gameSlugForLogo(normKey);

      for (var gIdx = 0; gIdx < groups.length; gIdx++) {
        var grp = groups[gIdx];
        if (!grp || !Array.isArray(grp.items) || !grp.items.length) continue;
        var grpName = String(grp.group || 'EXPANSIONS').toUpperCase();
        var grpSlug = grp.slug || grpName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        var items = grp.items;

        var gridCards = [];
        var tableRows = [];

        for (var i = 0; i < items.length; i++) {
          var it = items[i];
          var id = String(it.id || '');
          var name = String(it.name || '');
          var cards = Number(it.cards) || 0;
          var date = String(it.date || '');
          var logo = it.logo || ('https://images.scrydex.com/' + slugPrefix + '/' + id + '-logo/logo');
          var colUrl = it.collectionUrl || '';
          var href = colUrl || ('?game=' + encodeURIComponent(normKey) + '&expansion=' + encodeURIComponent(id));

          // 首组前 12 张直接挂 src + loading="lazy"，其余分组使用 data-lazy-src + IntersectionObserver 懒加载
          var useImmediateSrc = (gIdx === 0 && i < 12);
          var placeholderSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='72' viewBox='0 0 160 72'%3E%3C/svg%3E";
          var imgAttrs = useImmediateSrc
            ? 'src="' + escAttr(logo) + '" loading="lazy" decoding="async"'
            : 'src="' + placeholderSvg + '" data-lazy-src="' + escAttr(logo) + '" loading="lazy" decoding="async"';

          var heAttrs = '';
          if (it.heBlock) {
            heAttrs = ' data-he-scope="' + escAttr(it.heScope || 'template') + '" data-he-section="' + escAttr(it.heSection || 'main') + '" data-he-block="' + escAttr(it.heBlock) + '" data-he-label="' + escAttr(it.heLabel || name) + '"' + (it.heSelected === 'true' ? ' data-he-selected="true"' : '');
          }

          expansionLookup[(normKey + ':' + id).toUpperCase()] = {
            gameKey: normKey,
            id: id,
            name: name,
            cards: cards,
            date: date,
            logo: logo,
            group: grpName
          };
          expansionLookup[id.toUpperCase()] = expansionLookup[(normKey + ':' + id).toUpperCase()];

          gridCards.push(
            '<a href="' + escAttr(href) + '" class="tcg-exp-card" data-expansion-card data-game-key="' + escAttr(normKey) + '" data-expansion-id="' + escAttr(id) + '" data-expansion-name="' + escAttr(name) + '" data-expansion-date="' + escAttr(date) + '" data-expansion-cards="' + cards + '" data-expansion-group-name="' + escAttr(grpName) + '" data-expansion-logo="' + escAttr(logo) + '"' + (colUrl ? ' data-collection-url="' + escAttr(colUrl) + '"' : '') + heAttrs + '>' +
              '<div class="tcg-exp-card-inner">' +
                '<div class="tcg-exp-card-logo">' +
                  '<img ' + imgAttrs + ' alt="' + escAttr(name) + '" data-exp-logo="' + escAttr(id) + '" data-exp-game="' + escAttr(slugPrefix) + '">' +
                '</div>' +
                '<div class="tcg-exp-card-meta">' +
                  '<span class="tcg-exp-card-name">' + escAttr(name) + '</span>' +
                  '<span class="tcg-exp-card-date">' + escAttr(date) + '</span>' +
                '</div>' +
              '</div>' +
            '</a>'
          );

          tableRows.push(
            '<tr class="tcg-exp-row" data-action="click->view-mode#navigateToCard" data-expansion-row data-game-key="' + escAttr(normKey) + '" data-expansion-id="' + escAttr(id) + '" data-expansion-name="' + escAttr(name) + '" data-expansion-date="' + escAttr(date) + '" data-expansion-cards="' + cards + '" data-expansion-group-name="' + escAttr(grpName) + '" data-expansion-logo="' + escAttr(logo) + '" data-url="' + escAttr(href) + '"' + heAttrs + '>' +
              '<td>' +
                '<div class="tcg-exp-row-Main">' +
                  '<div class="tcg-exp-row-logo">' +
                    '<img ' + imgAttrs + ' alt="' + escAttr(name) + '" data-exp-logo="' + escAttr(id) + '" data-exp-game="' + escAttr(slugPrefix) + '">' +
                  '</div>' +
                  '<span class="tcg-exp-row-name">' + escAttr(name) + '</span>' +
                '</div>' +
              '</td>' +
              '<td class="is-center"><span class="tcg-exp-mono-id">' + escAttr(id) + '</span></td>' +
              '<td class="is-center"><span class="tcg-exp-mono-cards">' + cards + '</span></td>' +
              '<td class="is-right"><span class="tcg-exp-mono-date">' + escAttr(date) + '</span></td>' +
            '</tr>'
          );
        }

        htmlParts.push(
          '<section id="exp-group-' + escAttr(grpSlug) + '" class="tcg-exp-group" data-expansion-group="' + escAttr(grpSlug) + '">' +
            '<div class="tcg-exp-group-head">' +
              '<h2>' + escAttr(grpName) + '</h2>' +
            '</div>' +
            '<div data-view-mode-target="grid" class="tcg-exp-grid' + (isTable ? ' hidden' : '') + '">' +
              gridCards.join('') +
            '</div>' +
            '<div data-view-mode-target="table" class="tcg-exp-table-wrap' + (isTable ? '' : ' hidden') + '">' +
              '<table class="tcg-exp-table">' +
                '<thead>' +
                  '<tr>' +
                    '<th>Expansion Name</th>' +
                    '<th class="is-center">ID</th>' +
                    '<th class="is-center">Cards</th>' +
                    '<th class="is-right">Release Date</th>' +
                  '</tr>' +
                '</thead>' +
                '<tbody>' +
                  tableRows.join('') +
                '</tbody>' +
              '</table>' +
            '</div>' +
          '</section>'
        );
      }

      groupsContainer.innerHTML = htmlParts.join('');
      initLazyObserver();
    }

    /* 18.5 点击左侧游戏导航项 -> 展开/收起子菜单 + 立即联动更新右侧面板 */
    function selectLeftGame(gameKey, toggleAccordion, pushHistoryFlag) {
      var normKey = normalizeGameKey(gameKey);
      var allItems = expSection.querySelectorAll('[data-exp-game-item]');

      allItems.forEach(function (li) {
        var liKey = normalizeGameKey(li.getAttribute('data-game-key'));
        var isMatch = liKey === normKey;
        var trigger = li.querySelector('[data-exp-game-trigger]');
        var subpanel = li.querySelector('[data-exp-subpanel]');

        li.classList.toggle('is-active', isMatch);
        if (isMatch && subpanel) {
          var willExpand = toggleAccordion ? !li.classList.contains('is-expanded') : true;
          li.classList.toggle('is-expanded', willExpand);
          if (willExpand) subpanel.removeAttribute('hidden');
          else subpanel.setAttribute('hidden', '');
          if (trigger) trigger.setAttribute('aria-expanded', willExpand ? 'true' : 'false');
        }
      });

      // 确保右侧处于扩展包列表视图并立即刷新对应游戏数据
      if (detailView && !detailView.hasAttribute('hidden')) {
        detailView.setAttribute('hidden', '');
        detailView.hidden = true;
      }
      if (listView) {
        listView.removeAttribute('hidden');
        listView.hidden = false;
      }

      renderRightPaneForGame(normKey);

      if (pushHistoryFlag && window.history && window.history.pushState) {
        try {
          var u = new URL(window.location.href);
          u.searchParams.set('game', normKey);
          u.searchParams.delete('expansion');
          window.history.pushState({ game: normKey }, '', u.toString());
        } catch (e) {}
      }
    }

    on('[data-exp-game-trigger]', 'click', function (e, btn) {
      e.preventDefault();
      var li = btn.closest('[data-exp-game-item]');
      var gKey = btn.getAttribute('data-exp-game-trigger') || (li && li.getAttribute('data-game-key')) || 'pokemon';
      var isLocked = li && li.getAttribute('data-locked') === 'true';
      var normKey = normalizeGameKey(gKey);
      var hasCustomItems = expSection.querySelector('[data-custom-exp-item][data-game-key="' + normKey + '"]');
      if (isLocked && !hasCustomItems) {
        selectLeftGame(normKey, false, false);
        return;
      }
      var alreadyActive = normalizeGameKey(currentGameKey) === normKey;
      selectLeftGame(normKey, alreadyActive, true);
    }, expSection);

    on('[data-exp-sub-all]', 'click', function (e, link) {
      e.preventDefault();
      var gKey = link.getAttribute('data-exp-sub-all') || currentGameKey;
      selectLeftGame(gKey, false, true);
    }, expSection);

    on('[data-exp-sub-item]', 'click', function (e, subLink) {
      e.preventDefault();
      var gKey = normalizeGameKey(subLink.getAttribute('data-game-key') || currentGameKey);
      var targetId = subLink.getAttribute('data-expansion-target') || '';
      if (normalizeGameKey(currentGameKey) !== gKey) {
        selectLeftGame(gKey, false, false);
      } else if (detailView && !detailView.hasAttribute('hidden')) {
        backToExpansionsList(false);
      }

      expSection.querySelectorAll('[data-exp-sub-item]').forEach(function (a) {
        a.classList.toggle('is-active', a === subLink);
      });

      if (targetId) {
        var cardEl = groupsContainer && groupsContainer.querySelector('[data-expansion-id="' + targetId + '"]');
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          cardEl.focus({ preventScroll: true });
        } else {
          var info = resolveExpansionData(targetId);
          if (info) openExpansionDetail(info, true);
        }
      }
    }, expSection);

    /* 18.6 View Mode (Grid / Table) 切换与 localStorage('view-mode') 持久化 */
    function switchViewMode(mode, persist) {
      var targetMode = mode === 'table' ? 'table' : 'grid';
      currentMode = targetMode;

      expSection.querySelectorAll('[data-view-mode-target="grid"]').forEach(function (el) {
        el.classList.toggle('hidden', targetMode !== 'grid');
      });
      expSection.querySelectorAll('[data-view-mode-target="table"]').forEach(function (el) {
        el.classList.toggle('hidden', targetMode !== 'table');
      });
      expSection.querySelectorAll('[data-view-mode-target="button"]').forEach(function (btn) {
        var active = btn.getAttribute('data-mode') === targetMode;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      if (persist !== false) {
        try {
          localStorage.setItem('view-mode', targetMode);
        } catch (e) {}
      }
      initLazyObserver();
    }

    var savedMode = null;
    try {
      savedMode = localStorage.getItem('view-mode');
    } catch (e) {}
    switchViewMode(savedMode === 'table' || savedMode === 'grid' ? savedMode : currentMode, false);

    on('[data-view-mode-target="button"]', 'click', function (e, btn) {
      e.preventDefault();
      var m = btn.getAttribute('data-mode') || 'grid';
      switchViewMode(m, true);
    }, expSection);

    /* 18.7 Logo 加载失败时自动降级为系列符号或代号徽章 */
    expSection.addEventListener('error', function (e) {
      var img = e.target;
      if (!img || img.tagName !== 'IMG') return;
      var code = img.getAttribute('data-exp-logo');
      if (!code) return;
      var gameSlug = img.getAttribute('data-exp-game') || gameSlugForLogo(currentGameKey);
      var step = img.getAttribute('data-fallback-step') || '0';
      if (step === '0') {
        img.setAttribute('data-fallback-step', '1');
        img.src = 'https://images.scrydex.com/' + encodeURIComponent(gameSlug) + '/' + encodeURIComponent(code) + '-symbol/symbol';
      } else if (step === '1') {
        img.setAttribute('data-fallback-step', '2');
        var badge = document.createElement('span');
        badge.className = 'tcg-exp-logo-fallback';
        badge.textContent = code;
        if (img.parentNode) {
          img.parentNode.replaceChild(badge, img);
        }
      }
    }, true);

    /* 18.8 扩展包详情页无刷新切换与浏览器历史同步 */
    function resolveExpansionData(codeOrEl) {
      if (typeof codeOrEl === 'string') {
        var k1 = (currentGameKey + ':' + codeOrEl.trim()).toUpperCase();
        var k2 = codeOrEl.trim().toUpperCase();
        if (expansionLookup[k1]) return expansionLookup[k1];
        if (expansionLookup[k2]) return expansionLookup[k2];
        var domMatch = expSection.querySelector('[data-expansion-id="' + codeOrEl.trim() + '"]');
        if (domMatch) codeOrEl = domMatch;
        else return null;
      }
      if (codeOrEl && codeOrEl.getAttribute) {
        var cid = codeOrEl.getAttribute('data-expansion-id') || 'me6';
        var gKey = normalizeGameKey(codeOrEl.getAttribute('data-game-key') || currentGameKey);
        var k = (gKey + ':' + cid).toUpperCase();
        if (expansionLookup[k]) return expansionLookup[k];
        return {
          gameKey: gKey,
          id: cid,
          name: codeOrEl.getAttribute('data-expansion-name') || cid,
          date: codeOrEl.getAttribute('data-expansion-date') || '',
          cards: Number(codeOrEl.getAttribute('data-expansion-cards')) || 0,
          group: codeOrEl.getAttribute('data-expansion-group-name') || 'EXPANSION',
          logo: codeOrEl.getAttribute('data-expansion-logo') || ('https://images.scrydex.com/' + gameSlugForLogo(gKey) + '/' + cid + '-logo/logo')
        };
      }
      return null;
    }

    function openExpansionDetail(expInfo, updateUrlFlag) {
      if (!expInfo || !listView || !detailView) return false;

      var logoEl = detailView.querySelector('[data-exp-detail-logo]');
      var symbolEl = detailView.querySelector('[data-exp-detail-symbol]');
      var titleEl = detailView.querySelector('[data-exp-detail-title]');
      var idEl = detailView.querySelector('[data-exp-detail-id]');
      var groupEl = detailView.querySelector('[data-exp-detail-group]');
      var cardsEl = detailView.querySelector('[data-exp-detail-cards]');
      var dateEl = detailView.querySelector('[data-exp-detail-date]');
      var searchLink = detailView.querySelector('[data-exp-detail-search-link]');
      var gridHead = detailView.querySelector('[data-exp-detail-grid-heading]');
      var cardsGrid = detailView.querySelector('[data-exp-detail-cards-grid]');
      var gSlug = gameSlugForLogo(expInfo.gameKey || currentGameKey);

      if (titleEl) titleEl.textContent = expInfo.name;
      if (idEl) idEl.textContent = expInfo.id;
      if (groupEl) groupEl.textContent = expInfo.group || 'EXPANSION';
      if (cardsEl) cardsEl.textContent = String(expInfo.cards || 0);
      if (dateEl) dateEl.textContent = expInfo.date || '—';
      if (gridHead) gridHead.textContent = expInfo.name + ' (' + expInfo.id + ') — Collector Highlights';

      if (logoEl) {
        logoEl.src = expInfo.logo || ('https://images.scrydex.com/' + gSlug + '/' + expInfo.id + '-logo/logo');
        logoEl.alt = expInfo.name;
      }
      if (symbolEl) {
        if (symbolEl.parentElement) symbolEl.parentElement.style.display = '';
        symbolEl.src = 'https://images.scrydex.com/' + encodeURIComponent(gSlug) + '/' + encodeURIComponent(expInfo.id) + '-symbol/symbol';
        symbolEl.alt = expInfo.id;
      }
      if (searchLink) {
        var searchBase = (window.TCG_ROUTES && window.TCG_ROUTES.search_url) ? window.TCG_ROUTES.search_url : '/search';
        searchLink.href = searchBase + '?type=product&q=' + encodeURIComponent(expInfo.name);
      }

      if (cardsGrid) {
        var sampleNums = [1, 2, 3, 4];
        var fallbackPool = [
          'https://horizon.local/assets/card-charizard.png',
          'https://horizon.local/assets/card-palkia.png',
          'https://horizon.local/assets/card-umbreon.png',
          'https://horizon.local/assets/card-blastoise.png'
        ];
        var cardLabels = [
          'Booster Box Display (36 Packs)',
          'Elite Trainer / Collector Bundle',
          'Chase Illustration Rare Single',
          'Graded Gem Mint 10 Slab'
        ];
        var searchBaseUrl = (window.TCG_ROUTES && window.TCG_ROUTES.search_url) ? window.TCG_ROUTES.search_url : '/search';
        cardsGrid.innerHTML = sampleNums.map(function (n, idx) {
          var cardImg = 'https://images.scrydex.com/' + encodeURIComponent(gSlug) + '/' + encodeURIComponent(expInfo.id) + '-' + n + '/medium';
          var fbImg = fallbackPool[idx % fallbackPool.length];
          return (
            '<a href="' + escAttr(searchBaseUrl + '?type=product&q=' + encodeURIComponent(expInfo.name)) + '" class="tcg-exp-sample-card">' +
              '<div class="tcg-exp-sample-media">' +
                '<img src="' + escAttr(cardImg) + '" alt="' + escAttr(expInfo.name + ' #' + n) + '" loading="lazy" decoding="async" onerror="if(!this.dataset.fb){this.dataset.fb=1;this.src=\'' + escAttr(expInfo.logo) + '\';}else{this.src=\'' + fbImg + '\';}">' +
              '</div>' +
              '<div class="tcg-exp-sample-body">' +
                '<span class="tcg-exp-sample-tag">' + escAttr(expInfo.id) + ' · #' + String(n).padStart(3, '0') + '</span>' +
                '<strong class="tcg-exp-sample-title">' + escAttr(expInfo.name) + ' — ' + escAttr(cardLabels[idx]) + '</strong>' +
                '<span class="tcg-exp-sample-sub">Release: ' + escAttr(expInfo.date || 'TBA') + ' · ' + escAttr(String(expInfo.cards || 0)) + ' cards in set</span>' +
              '</div>' +
            '</a>'
          );
        }).join('');
      }

      listView.setAttribute('hidden', '');
      listView.hidden = true;
      detailView.removeAttribute('hidden');
      detailView.hidden = false;

      if (updateUrlFlag !== false && window.history && window.history.pushState) {
        try {
          var u = new URL(window.location.href);
          u.searchParams.set('game', expInfo.gameKey || currentGameKey);
          u.searchParams.set('expansion', expInfo.id);
          window.history.pushState({ game: expInfo.gameKey || currentGameKey, expansion: expInfo.id }, '', u.toString());
        } catch (e) {}
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    }

    function backToExpansionsList(updateUrlFlag) {
      if (!listView || !detailView) return;
      detailView.setAttribute('hidden', '');
      detailView.hidden = true;
      listView.removeAttribute('hidden');
      listView.hidden = false;

      if (updateUrlFlag !== false && window.history && window.history.pushState) {
        try {
          var u = new URL(window.location.href);
          u.searchParams.delete('expansion');
          window.history.pushState({ game: currentGameKey }, '', u.toString());
        } catch (e) {}
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    on('[data-expansion-card]', 'click', function (e, card) {
      var colUrl = card.getAttribute('data-collection-url');
      if (colUrl) return;
      var info = resolveExpansionData(card);
      if (info && openExpansionDetail(info, true)) {
        e.preventDefault();
      }
    }, expSection);

    on('[data-expansion-row]', 'click', function (e, row) {
      var targetUrl = row.getAttribute('data-url') || '';
      if (targetUrl && targetUrl.indexOf('?') !== 0) {
        window.location.href = targetUrl;
        return;
      }
      var info = resolveExpansionData(row);
      if (info && openExpansionDetail(info, true)) {
        e.preventDefault();
      }
    }, expSection);

    on('[data-back-to-expansions]', 'click', function (e) {
      e.preventDefault();
      backToExpansionsList(true);
    }, expSection);

    window.addEventListener('popstate', function () {
      try {
        var params = new URLSearchParams(window.location.search);
        var gParam = params.get('game');
        if (gParam && normalizeGameKey(gParam) !== normalizeGameKey(currentGameKey)) {
          selectLeftGame(gParam, false, false);
        }
        var expCode = params.get('expansion');
        if (expCode) {
          var info = resolveExpansionData(expCode);
          if (info) openExpansionDetail(info, false);
        } else {
          backToExpansionsList(false);
        }
      } catch (e) {}
    });

    /* 18.9 支持独立模块生成的三层级左侧树 + 独立右侧模板文件按需加载 + 右侧三层块钻取切换 */
    var studioDrillStack = [];
    var activeRightTemplateDoc = null;

    function getStudioManifest() {
      if (window.TCG_EXPANSIONS_STUDIO_DATA && window.TCG_EXPANSIONS_STUDIO_DATA.workspace) {
        return window.TCG_EXPANSIONS_STUDIO_DATA;
      }
      var treeScript = expSection.querySelector('[data-exp-left-tree-json]');
      if (treeScript && treeScript.textContent) {
        try {
          var ws = JSON.parse(treeScript.textContent);
          return { workspace: ws, templates: {} };
        } catch (e) {}
      }
      return null;
    }

    function renderStudioLeftTree(ws) {
      if (!ws || !Array.isArray(ws.left_tree) || !ws.left_tree.length || !sidebarList) return false;
      var brandEl = expSection.querySelector('[data-exp-sidebar-brand]');
      if (brandEl && ws.sidebar_brand) brandEl.textContent = ws.sidebar_brand;
      var brandIconEl = expSection.querySelector('[data-exp-sidebar-brand-icon]');
      if (brandIconEl) {
        if (ws.sidebar_brand_icon_url) {
          brandIconEl.innerHTML = '<img src="' + escAttr(ws.sidebar_brand_icon_url) + '" alt="' + escAttr(ws.sidebar_brand || '') + '" width="22" height="22" style="width:22px;height:22px;object-fit:contain;border-radius:4px;display:block;" loading="lazy" decoding="async">';
        } else {
          brandIconEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z"></path><path d="M12 6a6 6 0 1 0 6 6 6 6 0 0 0-6-6Z"></path><circle cx="12" cy="12" r="2"></circle></svg>';
        }
      }
      var crumbEl = expSection.querySelector('[data-exp-breadcrumb-current]');
      if (crumbEl && ws.breadcrumb_label) crumbEl.textContent = ws.breadcrumb_label;

      var html = [];
      ws.left_tree.forEach(function (l1, idx) {
        var locked = Boolean(l1.is_locked);
        var expanded = Boolean(l1.expanded_by_default) || idx === 0;
        var l2List = Array.isArray(l1.children) ? l1.children : [];
        var subHtml = [];

        l2List.forEach(function (l2) {
          var l3List = Array.isArray(l2.children) ? l2.children : [];
          var l2HasChildren = l3List.length > 0;
          var l2Expanded = l2.expanded_by_default !== false;
          // 第二层级：保持现有样式不变 (.tcg-exp-sub-heading + .tcg-exp-sub-square)；若有子层级则仅展开子层级
          subHtml.push(
            '<a href="' + escAttr(!l2HasChildren && l2.click_mode === 'url' ? (l2.target_url || '#') : '#') + '" ' +
              'class="tcg-exp-sub-heading" data-studio-left-node data-node-level="2" data-node-id="' + escAttr(l2.id) + '" ' +
              'data-has-children="' + (l2HasChildren ? 'true' : 'false') + '" ' +
              'data-click-mode="' + escAttr(l2.click_mode || 'template') + '" ' +
              'data-target-tpl="' + escAttr(l2.target_template_file || '') + '" ' +
              'data-target-url="' + escAttr(l2.target_url || '') + '">' +
              '<span class="tcg-exp-sub-square"></span>' +
              '<span>' + escAttr(l2.title) + '</span>' +
            '</a>'
          );

          if (l2HasChildren) {
            var l3Items = l3List.map(function (l3) {
              // 第三层级：无子层级，保持现有样式不变 (.tcg-exp-sub-link + .tcg-exp-sub-pipe)，点击可切换独立模块或跳转链接
              return (
                '<li>' +
                  '<a href="' + escAttr(l3.click_mode === 'url' ? (l3.target_url || '#') : ('#tpl:' + (l3.target_template_file || ''))) + '" ' +
                    'class="tcg-exp-sub-link" data-studio-left-node data-node-level="3" data-node-id="' + escAttr(l3.id) + '" ' +
                    'data-has-children="false" ' +
                    'data-click-mode="' + escAttr(l3.click_mode || 'template') + '" ' +
                    'data-target-tpl="' + escAttr(l3.target_template_file || '') + '" ' +
                    'data-target-url="' + escAttr(l3.target_url || '') + '">' +
                    '<span class="tcg-exp-sub-pipe" aria-hidden="true"></span>' +
                    '<span class="tcg-exp-sub-text">' + escAttr(l3.title) + '</span>' +
                  '</a>' +
                '</li>'
              );
            }).join('');
            subHtml.push('<ul class="tcg-exp-sub-list" data-l2-sublist="' + escAttr(l2.id) + '"' + (l2Expanded ? '' : ' hidden') + '>' + l3Items + '</ul>');
          }
        });

        var l1HasChildren = l2List.length > 0;
        html.push(
          '<li class="tcg-exp-nav-item' + (idx === 0 ? ' is-active' : '') + (expanded ? ' is-expanded' : '') + (locked ? ' is-locked' : '') + '" data-studio-l1-item>' +
            '<button type="button" class="tcg-exp-nav-trigger" data-studio-left-node data-node-level="1" data-node-id="' + escAttr(l1.id) + '" ' +
              'data-locked="' + (locked ? 'true' : 'false') + '" ' +
              'data-has-children="' + (l1HasChildren ? 'true' : 'false') + '" ' +
              'data-click-mode="' + escAttr(l1.click_mode || 'template') + '" ' +
              'data-target-tpl="' + escAttr(l1.target_template_file || '') + '" ' +
              'data-target-url="' + escAttr(l1.target_url || '') + '">' +
              '<span class="tcg-exp-nav-left">' +
                (l1.icon_url
                  ? '<img src="' + escAttr(l1.icon_url) + '" alt="' + escAttr(l1.title) + '" width="20" height="20" loading="lazy" decoding="async" class="tcg-exp-nav-icon">'
                  : '<span class="tcg-exp-nav-icon-placeholder" aria-hidden="true">◈</span>') +
                '<span class="tcg-exp-nav-title">' + escAttr(l1.title) + '</span>' +
                (locked ? '<span class="tcg-exp-locked-badge">LOCKED</span>' : '') +
              '</span>' +
              '<span class="tcg-exp-nav-right" aria-hidden="true">' +
                (locked
                  ? '<svg class="tcg-exp-lock-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5Zm-3 8V6a3 3 0 1 1 6 0v3H9Z"/></svg>'
                  : '<svg class="tcg-exp-chevron-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>') +
              '</span>' +
            '</button>' +
            (!locked && subHtml.length > 0
              ? '<div class="tcg-exp-nav-subpanel"' + (expanded ? '' : ' hidden') + ' data-exp-subpanel>' + subHtml.join('') + '</div>'
              : '') +
          '</li>'
        );
      });

      sidebarList.innerHTML = html.join('');
      return true;
    }

    function renderStudioRightTemplateDoc(doc, drillStack) {
      if (!doc || !groupsContainer) return;
      activeRightTemplateDoc = doc;
      studioDrillStack = Array.isArray(drillStack) ? drillStack : [];

      var currentLayerBlock = studioDrillStack.length > 0 ? studioDrillStack[studioDrillStack.length - 1] : null;
      var hTitle = currentLayerBlock ? currentLayerBlock.title : (doc.header_title || 'EXPANSIONS');
      var hDesc = (currentLayerBlock && currentLayerBlock.sub_header_description) ? currentLayerBlock.sub_header_description : (doc.header_description || '');
      var hIcon = (currentLayerBlock && currentLayerBlock.image_url) ? currentLayerBlock.image_url : (doc.header_icon_url || '');
      var hWm = doc.header_watermark_url || '';

      var titleEl = expSection.querySelector('[data-exp-header-title]');
      var descEl = expSection.querySelector('[data-exp-header-desc]');
      var iconEl = expSection.querySelector('[data-exp-header-icon]');
      var wmEl = expSection.querySelector('[data-exp-header-watermark]');

      if (titleEl) titleEl.textContent = hTitle;
      if (descEl) descEl.textContent = hDesc;
      if (iconEl && hIcon) iconEl.src = hIcon;
      if (wmEl) {
        if (hWm) {
          wmEl.src = hWm;
          wmEl.style.display = '';
        } else {
          wmEl.style.display = 'none';
        }
      }

      var activeBlocks = currentLayerBlock ? (currentLayerBlock.children || []) : (doc.blocks || []);
      var htmlParts = [];

      // 若处于第 2 层或第 3 层，顶部展示三层返回导航条
      if (studioDrillStack.length > 0) {
        var crumbBtns = [
          '<button type="button" class="tcg-btn-secondary" data-studio-drill-depth="0" style="padding:0.35rem 0.75rem;font-size:0.78rem;">← 第 1 层: ' + escAttr(doc.header_title) + '</button>'
        ];
        if (studioDrillStack.length >= 1) {
          crumbBtns.push('<span style="color:var(--tcg-text-muted);">/</span>');
          crumbBtns.push('<button type="button" class="tcg-btn-secondary" data-studio-drill-depth="1" style="padding:0.35rem 0.75rem;font-size:0.78rem;">第 2 层: ' + escAttr(studioDrillStack[0].title) + '</button>');
        }
        if (studioDrillStack.length >= 2) {
          crumbBtns.push('<span style="color:var(--tcg-text-muted);">/</span>');
          crumbBtns.push('<span style="color:var(--tcg-accent-hover);font-weight:700;font-size:0.82rem;">第 3 层: ' + escAttr(studioDrillStack[1].title) + '</span>');
        }
        htmlParts.push('<div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.5rem;">' + crumbBtns.join('') + '</div>');
      }

      // 按 group_name 分组
      var groupMap = {};
      var groupOrder = [];
      activeBlocks.forEach(function (b) {
        var gName = String(b.group_name || 'EXPANSIONS').toUpperCase();
        if (!groupMap[gName]) {
          groupMap[gName] = [];
          groupOrder.push(gName);
        }
        groupMap[gName].push(b);
      });

      var isTable = currentMode === 'table';
      var placeholderSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='72' viewBox='0 0 160 72'%3E%3C/svg%3E";

      groupOrder.forEach(function (gName, gIdx) {
        var items = groupMap[gName];
        var gridCards = [];
        var tableRows = [];

        items.forEach(function (it, i) {
          var useImmediate = (gIdx === 0 && i < 12);
          var imgAttrs = useImmediate
            ? 'src="' + escAttr(it.image_url) + '" loading="lazy" decoding="async"'
            : 'src="' + placeholderSvg + '" data-lazy-src="' + escAttr(it.image_url) + '" loading="lazy" decoding="async"';

          var sMode = String(it.card_size_mode || 'small').toLowerCase();
          var wPx = sMode === 'large' ? 260 : (sMode === 'custom' ? Math.max(110, Math.min(560, Number(it.custom_width_px) || 210)) : 170);
          var hPx = sMode === 'large' ? 220 : (sMode === 'custom' ? Math.max(100, Math.min(480, Number(it.custom_height_px) || 185)) : 152);
          var logoH = Math.max(42, hPx - 78);

          gridCards.push(
            '<a href="' + escAttr(it.target_url || '#') + '" style="width:' + wPx + 'px;min-height:' + hPx + 'px;" class="tcg-exp-card tcg-exp-card-sized" data-studio-right-block data-block-id="' + escAttr(it.id) + '">' +
              '<div class="tcg-exp-card-inner" style="height:100%;justify-content:space-between;">' +
                '<div class="tcg-exp-card-logo" style="height:' + logoH + 'px;"><img ' + imgAttrs + ' style="max-height:' + (logoH - 6) + 'px;" alt="' + escAttr(it.title) + '"></div>' +
                '<div class="tcg-exp-card-meta">' +
                  '<span class="tcg-exp-card-name">' + escAttr(it.title) + '</span>' +
                  '<span class="tcg-exp-card-date">' + escAttr(it.release_date) + '</span>' +
                '</div>' +
              '</div>' +
            '</a>'
          );

          tableRows.push(
            '<tr class="tcg-exp-row" data-studio-right-block data-block-id="' + escAttr(it.id) + '">' +
              '<td><div class="tcg-exp-row-Main"><div class="tcg-exp-row-logo"><img ' + imgAttrs + ' alt="' + escAttr(it.title) + '"></div><span class="tcg-exp-row-name">' + escAttr(it.title) + '</span></div></td>' +
              '<td class="is-center"><span class="tcg-exp-mono-id">' + escAttr(it.code) + '</span></td>' +
              '<td class="is-center"><span class="tcg-exp-mono-cards">' + escAttr(it.cards_text) + '</span></td>' +
              '<td class="is-right"><span class="tcg-exp-mono-date">' + escAttr(it.release_date) + '</span></td>' +
            '</tr>'
          );
        });

        htmlParts.push(
          '<section class="tcg-exp-group">' +
            '<div class="tcg-exp-group-head"><h2>' + escAttr(gName) + '</h2></div>' +
            '<div data-view-mode-target="grid" class="tcg-exp-grid tcg-exp-grid-sized' + (isTable ? ' hidden' : '') + '">' + gridCards.join('') + '</div>' +
            '<div data-view-mode-target="table" class="tcg-exp-table-wrap' + (isTable ? '' : ' hidden') + '">' +
              '<table class="tcg-exp-table"><thead><tr><th>Expansion Name</th><th class="is-center">ID</th><th class="is-center">Cards</th><th class="is-right">Release Date</th></tr></thead><tbody>' + tableRows.join('') + '</tbody></table>' +
            '</div>' +
          '</section>'
        );
      });

      groupsContainer.innerHTML = htmlParts.join('');
      initLazyObserver();
    }

    function loadAndSwitchRightTemplateFile(tplFileName) {
      if (!tplFileName) return;
      var manifest = getStudioManifest();
      if (manifest && manifest.templates && manifest.templates[tplFileName]) {
        renderStudioRightTemplateDoc(manifest.templates[tplFileName], []);
        return;
      }
      var gameGuess = tplFileName.replace(/^page\.expansions-/, '').replace(/\.json$/, '').split('-')[0];
      selectLeftGame(gameGuess, false, true);
    }

    function isShopifyProductFeedUrl(url) {
      var u = String(url || '').toLowerCase();
      return u.indexOf('/collections') !== -1 || u.indexOf('/search') !== -1 || u.indexOf('filter.') !== -1 || u.indexOf('q=') !== -1;
    }

    function findLeftNodeModelById(nodes, targetId) {
      if (!Array.isArray(nodes)) return null;
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (n.id === targetId) return n;
        var found = findLeftNodeModelById(n.children, targetId);
        if (found) return found;
      }
      return null;
    }

    /* 18.10 拉取 Shopify 搜索、分类、筛选链接下的所有商品并以 Expansion 同款格子展示，点击商品跳转新页面到加购或付款界面 */
    function renderShopifyProductFeedIntoList(title, sourceUrl, products, wPx, hPx, clickTargetMode) {
      if (!groupsContainer) return;
      var list = Array.isArray(products) ? products : [];
      var pw = Number(wPx) || 170;
      var ph = Number(hPx) || 152;
      var logoH = Math.max(42, ph - 78);
      var isCheckout = clickTargetMode === 'checkout';
      var isTable = currentMode === 'table';

      var titleEl = expSection.querySelector('[data-exp-header-title]');
      var descEl = expSection.querySelector('[data-exp-header-desc]');
      if (titleEl && title) titleEl.textContent = title;
      if (descEl) descEl.textContent = 'Showing all products pulled from Shopify link (' + (sourceUrl || '/collections/all') + '). Click any product tile to open its Add-to-Cart or Checkout page in a new tab.';

      var gridCards = [];
      var tableRows = [];

      list.forEach(function (prod) {
        var destUrl = prod.add_to_cart_url || ('/products/' + encodeURIComponent(prod.handle || '') + (prod.variant_id ? ('?variant=' + encodeURIComponent(prod.variant_id)) : ''));

        gridCards.push(
          '<a href="' + escAttr(destUrl) + '" target="_blank" rel="noopener" style="width:' + pw + 'px;min-height:' + ph + 'px;" class="tcg-exp-card tcg-exp-card-sized" data-shopify-product-tile>' +
            '<div class="tcg-exp-card-inner" style="height:100%;justify-content:space-between;">' +
              '<div class="tcg-exp-card-logo" style="height:' + logoH + 'px;">' +
                '<img src="' + escAttr(prod.image_url || '') + '" style="max-height:' + (logoH - 6) + 'px;" alt="' + escAttr(prod.title || '') + '" loading="lazy" decoding="async">' +
              '</div>' +
              '<div class="tcg-exp-card-meta">' +
                '<span class="tcg-exp-card-name">' + escAttr(prod.title || '') + '</span>' +
                '<span class="tcg-exp-card-date">' + escAttr(prod.price_display || '$29.99') + '</span>' +
              '</div>' +
            '</div>' +
          '</a>'
        );

        tableRows.push(
          '<tr class="tcg-exp-row" onclick="window.open(\'' + escAttr(destUrl).replace(/'/g, "\\'") + '\', \'_blank\')">' +
            '<td><div class="tcg-exp-row-Main"><div class="tcg-exp-row-logo"><img src="' + escAttr(prod.image_url || '') + '" alt="' + escAttr(prod.title || '') + '" loading="lazy"></div><span class="tcg-exp-row-name">' + escAttr(prod.title || '') + '</span></div></td>' +
            '<td class="is-center"><span class="tcg-exp-mono-id">' + escAttr(prod.sku || prod.handle || '') + '</span></td>' +
            '<td class="is-center"><span class="tcg-exp-mono-cards">' + escAttr(String(prod.inventory_qty != null ? prod.inventory_qty : 10)) + '</span></td>' +
            '<td class="is-right"><span class="tcg-exp-mono-date">' + escAttr(prod.price_display || '$29.99') + '</span></td>' +
          '</tr>'
        );
      });

      groupsContainer.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:0.75rem;flex-wrap:wrap;margin-bottom:0.85rem;">' +
          '<button type="button" class="tcg-btn-secondary" data-exit-shopify-product-feed style="padding:0.4rem 0.85rem;font-size:0.8rem;">← Back to Expansions</button>' +
          '<span style="color:var(--tcg-text-secondary);font-family:monospace;font-size:0.78rem;">Shopify Source: ' + escAttr(sourceUrl || '/collections/all') + ' · ' + list.length + ' Products</span>' +
        '</div>' +
        '<section class="tcg-exp-group">' +
          '<div class="tcg-exp-group-head"><h2>' + escAttr(String(title || 'PRODUCTS').toUpperCase()) + '</h2></div>' +
          '<div data-view-mode-target="grid" class="tcg-exp-grid tcg-exp-grid-sized' + (isTable ? ' hidden' : '') + '">' + gridCards.join('') + '</div>' +
          '<div data-view-mode-target="table" class="tcg-exp-table-wrap' + (isTable ? '' : ' hidden') + '">' +
            '<table class="tcg-exp-table"><thead><tr><th>Product Name</th><th class="is-center">SKU</th><th class="is-center">Stock</th><th class="is-right">Price</th></tr></thead><tbody>' + tableRows.join('') + '</tbody></table>' +
          '</div>' +
        '</section>';

      initLazyObserver();
    }

    function filterProductsByShopifyLink(pool, rawUrl, fallbackTitle) {
      var list = Array.isArray(pool) ? pool.slice() : [];
      if (!list.length) return [];
      var q = '';
      var pType = '';
      var inStock = false;
      var minP = null;
      var maxP = null;
      var colHandle = '';
      function fullyDecodeUrlPart(val) {
        var cur = String(val || '');
        for (var r = 0; r < 3; r++) {
          try {
            var next = decodeURIComponent(cur.replace(/\+/g, ' '));
            if (next === cur) break;
            cur = next;
          } catch (e) { break; }
        }
        return cur.trim();
      }
      try {
        var u = new URL(rawUrl || '/collections/all', window.location.origin || 'https://horizon.local');
        var segs = u.pathname.split('/').filter(Boolean);
        if (segs[0] === 'collections' && segs[1]) {
          colHandle = fullyDecodeUrlPart(segs[1]).replace(/\.json$/i, '');
        }
        q = fullyDecodeUrlPart(u.searchParams.get('q') || '');
        pType = fullyDecodeUrlPart(u.searchParams.get('filter.p.product_type') || u.searchParams.get('filter.type') || '');
        inStock = u.searchParams.get('filter.v.availability') === '1';
        if (u.searchParams.get('filter.v.price.gte')) minP = Number(u.searchParams.get('filter.v.price.gte'));
        if (u.searchParams.get('filter.v.price.lte')) maxP = Number(u.searchParams.get('filter.v.price.lte'));
      } catch (e) {}

      var kw = q || (colHandle && colHandle !== 'all' ? colHandle.replace(/-/g, ' ') : '');
      var filtered = list.filter(function (p) {
        if (inStock && Number(p.inventory_qty) <= 0) return false;
        if (minP !== null && Number(p.raw_price) < minP) return false;
        if (maxP !== null && Number(p.raw_price) > maxP) return false;
        if (pType && String(p.product_type || '').toLowerCase().indexOf(pType.toLowerCase()) === -1) return false;
        if (kw) {
          var hay = (String(p.title || '') + ' ' + String(p.sku || '') + ' ' + String(p.product_type || '') + ' ' + String(p.handle || '')).toLowerCase();
          var tokens = kw.toLowerCase().split(/\s+/).filter(Boolean);
          for (var t = 0; t < tokens.length; t++) {
            if (hay.indexOf(tokens[t]) === -1) return false;
          }
        }
        return true;
      });

      return filtered.length > 0 ? filtered : list;
    }

    function fetchAndShowShopifyLinkProducts(opts) {
      var title = opts.title || 'Store Products';
      var rawUrl = opts.url || '/collections/all';
      var cached = Array.isArray(opts.cachedProducts) && opts.cachedProducts.length > 0 ? opts.cachedProducts : null;
      var wPx = opts.wPx || 170;
      var hPx = opts.hPx || 152;
      var clickTargetMode = opts.clickTargetMode || 'add_to_cart';

      var manifest = getStudioManifest();
      var fallbackPool = (Array.isArray(window.TCG_LIQUID_STORE_PRODUCTS) && window.TCG_LIQUID_STORE_PRODUCTS.length > 0)
        ? window.TCG_LIQUID_STORE_PRODUCTS
        : ((manifest && Array.isArray(manifest.store_products)) ? manifest.store_products : []);

      // 先立即展示已缓存或本地筛选的商品列表，随后若在在线 Shopify 环境则异步拉取最新 Storefront JSON 更新
      var initialList = cached || filterProductsByShopifyLink(fallbackPool, rawUrl, title);
      renderShopifyProductFeedIntoList(title, rawUrl, initialList, wPx, hPx, clickTargetMode);

      try {
        var u = new URL(rawUrl, window.location.origin);
        var segs = u.pathname.split('/').filter(Boolean);
        var decodedHandle = '';
        if (segs[0] === 'collections' && segs[1]) {
          var tmp = segs[1];
          for (var d = 0; d < 3; d++) {
            try { var nx = decodeURIComponent(tmp); if (nx === tmp) break; tmp = nx; } catch (e) { break; }
          }
          decodedHandle = tmp.replace(/\.json$/i, '');
        }
        var baseJsonEndpoint = (decodedHandle && decodedHandle !== 'all')
          ? ('/collections/' + encodeURIComponent(decodedHandle) + '/products.json')
          : '/products.json';

        var allMapped = [];
        var seenIds = {};
        function fetchPageRecursive(pageNum) {
          if (pageNum > 200) return Promise.resolve();
          return fetch(baseJsonEndpoint + '?limit=250&page=' + pageNum)
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (data) {
              if (!data || !Array.isArray(data.products) || !data.products.length) return;
              var added = 0;
              data.products.forEach(function (p) {
                var key = String(p.id || p.handle || '');
                if (!key || seenIds[key]) return;
                seenIds[key] = true;
                var v0 = (p.variants && p.variants[0]) || {};
                var img = (p.images && p.images[0] && p.images[0].src) || (p.image && p.image.src) || '';
                var priceNum = Number(v0.price) || 29.99;
                allMapped.push({
                  id: String(p.id || ''),
                  handle: p.handle || '',
                  variant_id: String(v0.id || ''),
                  title: p.title || '',
                  image_url: img,
                  price_display: '$' + priceNum.toFixed(2),
                  raw_price: priceNum,
                  sku: v0.sku || p.vendor || '',
                  product_type: p.product_type || 'Single',
                  inventory_qty: v0.available === false ? 0 : 10,
                  add_to_cart_url: '/products/' + p.handle + (v0.id ? ('?variant=' + v0.id) : ''),
                  checkout_url: v0.id ? ('/cart/' + v0.id + ':1') : ('/products/' + p.handle)
                });
                added++;
              });
              if (data.products.length >= 250 && added > 0) {
                return fetchPageRecursive(pageNum + 1);
              }
            });
        }

        fetchPageRecursive(1)
          .then(function () {
            if (!allMapped.length) return;
            var finalItems = filterProductsByShopifyLink(allMapped, rawUrl, title);
            if (finalItems.length > 0) {
              renderShopifyProductFeedIntoList(title, rawUrl, finalItems, wPx, hPx, clickTargetMode);
            }
          })
          .catch(function () {});
      } catch (e) {}
    }

    on('[data-exit-shopify-product-feed]', 'click', function (e) {
      e.preventDefault();
      if (activeRightTemplateDoc) {
        renderStudioRightTemplateDoc(activeRightTemplateDoc, studioDrillStack);
      } else {
        selectLeftGame(currentGameKey, false, false);
      }
    }, expSection);

    function triggerStudioLeafNodeAction(nodeEl) {
      if (!nodeEl) return;
      var nodeId = nodeEl.getAttribute('data-node-id') || '';
      expSection.querySelectorAll('[data-studio-left-node]').forEach(function (el) {
        el.classList.toggle('is-active', el === nodeEl);
      });
      var parentLi = nodeEl.closest('[data-studio-l1-item]');
      if (parentLi) {
        expSection.querySelectorAll('[data-studio-l1-item]').forEach(function (other) {
          other.classList.toggle('is-active', other === parentLi);
        });
      }

      var mode = nodeEl.getAttribute('data-click-mode') || 'template';
      var targetUrl = nodeEl.getAttribute('data-target-url') || '';
      var targetTpl = nodeEl.getAttribute('data-target-tpl') || '';

      if (mode === 'shopify_products' || (mode === 'url' && isShopifyProductFeedUrl(targetUrl))) {
        var manifest = getStudioManifest();
        var leftModel = manifest && manifest.workspace ? findLeftNodeModelById(manifest.workspace.left_tree, nodeId) : null;
        fetchAndShowShopifyLinkProducts({
          title: (leftModel && leftModel.title) || nodeEl.textContent.trim(),
          url: targetUrl,
          cachedProducts: leftModel ? leftModel.cached_products : null,
          wPx: leftModel && leftModel.product_card_size_mode === 'large' ? 260 : 170,
          hPx: leftModel && leftModel.product_card_size_mode === 'large' ? 220 : 152,
          clickTargetMode: (leftModel && leftModel.product_click_target_mode) || 'add_to_cart'
        });
        return;
      }

      if (mode === 'url' && targetUrl) {
        window.location.href = targetUrl;
        return;
      }
      loadAndSwitchRightTemplateFile(targetTpl);
    }

    on('[data-studio-left-node]', 'click', function (e, nodeEl) {
      var locked = nodeEl.getAttribute('data-locked') === 'true';
      if (locked) {
        e.preventDefault();
        return;
      }
      var level = nodeEl.getAttribute('data-node-level');
      var hasChildren = nodeEl.getAttribute('data-has-children') === 'true';
      var nodeId = nodeEl.getAttribute('data-node-id') || '';

      // 规则1：若第 1 层级下有子层级，或第 2 层级下有子层级，展开子层级并自动选择该层级下的第一个无子层级子项
      if (hasChildren) {
        e.preventDefault();
        if (level === '1') {
          var li = nodeEl.closest('[data-studio-l1-item]');
          if (li) {
            var sub = li.querySelector('[data-exp-subpanel]');
            if (sub) {
              var exp = !li.classList.contains('is-expanded');
              li.classList.toggle('is-expanded', exp);
              if (exp) {
                sub.removeAttribute('hidden');
                var firstLeafInL1 = sub.querySelector('[data-studio-left-node][data-has-children="false"]');
                if (firstLeafInL1) triggerStudioLeafNodeAction(firstLeafInL1);
              } else {
                sub.setAttribute('hidden', '');
              }
            }
          }
        } else if (level === '2') {
          var subList = expSection.querySelector('[data-l2-sublist="' + nodeId + '"]');
          if (subList) {
            if (subList.hasAttribute('hidden')) {
              subList.removeAttribute('hidden');
              var firstLeafInL2 = subList.querySelector('[data-studio-left-node][data-has-children="false"]');
              if (firstLeafInL2) triggerStudioLeafNodeAction(firstLeafInL2);
            } else {
              subList.setAttribute('hidden', '');
            }
          }
        }
        return;
      }

      e.preventDefault();
      triggerStudioLeafNodeAction(nodeEl);
    }, expSection);

    on('[data-studio-right-block]', 'click', function (e, cardEl) {
      if (!activeRightTemplateDoc) return;
      var blkId = cardEl.getAttribute('data-block-id');
      var pool = studioDrillStack.length > 0 ? (studioDrillStack[studioDrillStack.length - 1].children || []) : (activeRightTemplateDoc.blocks || []);
      var found = null;
      for (var i = 0; i < pool.length; i++) {
        if (pool[i].id === blkId) {
          found = pool[i];
          break;
        }
      }
      if (!found) return;
      var hasChildBlocks = Array.isArray(found.children) && found.children.length > 0;

      // 1) 若该块配置为跳转外链 (click_mode === 'url'，包括右侧第三层级及任意层级)，直接执行外链跳转
      if (found.click_mode === 'url') {
        e.preventDefault();
        var extUrl = found.external_redirect_url || found.target_url || '#';
        if (extUrl && extUrl !== '#') {
          if (/^https?:\/\//i.test(extUrl)) {
            window.open(extUrl, '_blank', 'noopener');
          } else {
            window.location.href = extUrl;
          }
        }
        return;
      }

      // 2) 若该块有子层级且未达第 3 层上限，切换到下一层块
      if (studioDrillStack.length < 2 && found.click_mode === 'drilldown' && hasChildBlocks) {
        e.preventDefault();
        var nextStack = studioDrillStack.slice();
        nextStack.push(found);
        renderStudioRightTemplateDoc(activeRightTemplateDoc, nextStack);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // 3) 若该块配置为拉取列表 (click_mode === 'shopify_products') 或无子层级，点击后拉取其专属 Shopify 链接下的所有商品进入列表
      if (found.click_mode === 'shopify_products' || !hasChildBlocks) {
        e.preventDefault();
        var sMode = String(found.card_size_mode || 'small').toLowerCase();
        var wPx = sMode === 'large' ? 260 : (sMode === 'custom' ? (Number(found.custom_width_px) || 210) : 170);
        var hPx = sMode === 'large' ? 220 : (sMode === 'custom' ? (Number(found.custom_height_px) || 185) : 152);
        var shopUrl = found.shopify_source_url || found.target_url || ('/search?type=product&q=' + encodeURIComponent(found.title || ''));
        fetchAndShowShopifyLinkProducts({
          title: found.title,
          url: shopUrl,
          cachedProducts: found.cached_products,
          wPx: wPx,
          hPx: hPx,
          clickTargetMode: found.product_click_target_mode || 'add_to_cart'
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }, expSection);

    on('[data-studio-drill-depth]', 'click', function (e, btn) {
      e.preventDefault();
      if (!activeRightTemplateDoc) return;
      var depth = Number(btn.getAttribute('data-studio-drill-depth')) || 0;
      renderStudioRightTemplateDoc(activeRightTemplateDoc, studioDrillStack.slice(0, depth));
    }, expSection);

    function initDataAndRoute() {
      var manifest = getStudioManifest();
      if (manifest && manifest.workspace && renderStudioLeftTree(manifest.workspace)) {
        var firstLeafEl = sidebarList ? sidebarList.querySelector('[data-studio-left-node][data-has-children="false"]') : null;
        if (firstLeafEl) {
          triggerStudioLeafNodeAction(firstLeafEl);
        } else {
          var defTpl = manifest.workspace.default_template_file || 'page.expansions-pokemon.json';
          loadAndSwitchRightTemplateFile(defTpl);
        }
        return;
      }
      ensureSidebarPopulated();
      try {
        var params = new URLSearchParams(window.location.search);
        var initGame = params.get('game') || currentGameKey;
        selectLeftGame(initGame, false, false);
        var initCode = params.get('expansion');
        if (initCode) {
          var info = resolveExpansionData(initCode);
          if (info) openExpansionDetail(info, false);
        }
      } catch (e) {
        selectLeftGame(currentGameKey, false, false);
      }
    }

    if (window.TCG_EXPANSIONS_CATALOG) {
      initDataAndRoute();
    } else {
      window.addEventListener('DOMContentLoaded', initDataAndRoute);
      window.addEventListener('load', initDataAndRoute);
    }
  })();
})();
