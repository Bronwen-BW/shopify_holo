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
   * 8. 通用 AJAX 加购与本地持久化购物车双引擎（覆盖所有 data-add 按钮与商品页）
   * ----------------------------------------------------------------- */
  var CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>';
  var PLUS_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"></path></svg>';
  var LOCAL_CART_KEY = 'tcg-cart-v1';
  var LAST_ORDER_KEY = 'tcg-last-order-v1';

  function getInitialServerCart() {
    var el = document.getElementById('tcg-initial-cart-json');
    if (!el) return null;
    try { return JSON.parse(el.textContent); } catch (e) { return null; }
  }

  function loadLocalCartItems() {
    try {
      var raw = localStorage.getItem(LOCAL_CART_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveLocalCartItems(items) {
    try {
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items || []));
    } catch (e) {}
  }

  function detectCurrencyPrefix() {
    var sampleEl = document.querySelector('[data-currency-sample]');
    var sample = sampleEl ? sampleEl.getAttribute('data-currency-sample') : '';
    if (!sample) {
      var anyPriceEl = document.querySelector('p[data-variant-price], ._cardPrice_36e53_317, ._lineTotal_1z0wo_152, ._summaryTotal_1z0wo_221 span:last-child');
      sample = anyPriceEl ? anyPriceEl.textContent : '';
    }
    var m = String(sample || '').trim().match(/^([^\d\s-]+)/);
    return (m && m[1]) ? m[1] : '€';
  }

  function formatMoneyCents(cents) {
    var num = (Number(cents) || 0) / 100;
    return detectCurrencyPrefix() + num.toFixed(2);
  }

  function parsePriceToCents(rawPrice, formattedText) {
    if (rawPrice !== undefined && rawPrice !== null && String(rawPrice).trim() !== '') {
      var n = Number(rawPrice);
      if (!isNaN(n) && n >= 0) {
        if (String(rawPrice).indexOf('.') !== -1) return Math.round(n * 100);
        return Math.round(n);
      }
    }
    if (formattedText) {
      var clean = String(formattedText).replace(/[^0-9.,]/g, '').replace(',', '.');
      var f = parseFloat(clean);
      if (!isNaN(f) && f >= 0) return Math.round(f * 100);
    }
    return 0;
  }

  function extractItemMetaFromElement(el, variantId) {
    var meta = {
      variant_id: String(variantId || ''),
      product_id: '',
      product_title: 'Collector Item',
      variant_title: '',
      sku: '',
      price: 0,
      price_formatted: '',
      image: '',
      url: apiUrl('collections/all')
    };
    if (el && el.getAttribute) {
      meta.product_id = el.getAttribute('data-product-id') || '';
      meta.product_title = el.getAttribute('data-product-title') || meta.product_title;
      meta.variant_title = el.getAttribute('data-variant-title') || '';
      meta.sku = el.getAttribute('data-variant-sku') || '';
      meta.price_formatted = el.getAttribute('data-variant-price-formatted') || '';
      meta.price = parsePriceToCents(el.getAttribute('data-variant-price'), meta.price_formatted);
      meta.image = el.getAttribute('data-product-image') || '';
      meta.url = el.getAttribute('data-product-url') || meta.url;
    }
    var prodSection = document.querySelector('[data-tcg-product-section]');
    if (prodSection) {
      var jsonEl = prodSection.querySelector('[data-product-variants-json]');
      if (jsonEl) {
        try {
          var vList = JSON.parse(jsonEl.textContent);
          for (var i = 0; i < vList.length; i++) {
            if (String(vList[i].id) === String(variantId)) {
              var v = vList[i];
              meta.variant_title = (v.title && v.title !== 'Default Title') ? v.title : meta.variant_title;
              meta.sku = v.sku || meta.sku;
              meta.price = parsePriceToCents(v.price, v.price_formatted);
              meta.price_formatted = v.price_formatted || formatMoneyCents(meta.price);
              meta.image = v.featured_image_url || meta.image;
              break;
            }
          }
        } catch (e) {}
      }
      var h1 = prodSection.querySelector('h1');
      if (h1 && (!meta.product_title || meta.product_title === 'Collector Item')) {
        meta.product_title = h1.textContent.trim();
      }
      var mainImg = prodSection.querySelector('[data-main-image]');
      if (mainImg && !meta.image) {
        meta.image = mainImg.getAttribute('src') || '';
      }
      if (!meta.url || meta.url === apiUrl('collections/all')) {
        meta.url = window.location.pathname;
      }
    }
    if (!meta.price_formatted) {
      meta.price_formatted = formatMoneyCents(meta.price);
    }
    return meta;
  }

  function upsertLocalCartItem(variantId, deltaQty, meta, setExact) {
    var items = loadLocalCartItems();
    var idStr = String(variantId);
    var found = null;
    for (var i = 0; i < items.length; i++) {
      if (String(items[i].variant_id) === idStr) {
        found = items[i];
        break;
      }
    }
    if (found) {
      found.quantity = setExact ? Math.max(0, Number(deltaQty) || 0) : Math.max(0, (Number(found.quantity) || 0) + (Number(deltaQty) || 1));
      if (meta) {
        if (meta.product_title && meta.product_title !== 'Collector Item') found.product_title = meta.product_title;
        if (meta.variant_title) found.variant_title = meta.variant_title;
        if (meta.sku) found.sku = meta.sku;
        if (meta.price > 0) found.price = meta.price;
        if (meta.price_formatted) found.price_formatted = meta.price_formatted;
        if (meta.image) found.image = meta.image;
        if (meta.url) found.url = meta.url;
      }
      if (found.quantity <= 0) {
        items = items.filter(function (it) { return String(it.variant_id) !== idStr; });
      }
    } else if (!setExact || deltaQty > 0) {
      var m = meta || extractItemMetaFromElement(null, variantId);
      items.push({
        variant_id: idStr,
        product_id: m.product_id || idStr,
        product_title: m.product_title || 'Collector Item',
        variant_title: m.variant_title || '',
        sku: m.sku || '',
        price: Number(m.price) || 0,
        price_formatted: m.price_formatted || formatMoneyCents(m.price || 0),
        image: m.image || '',
        url: m.url || apiUrl('collections/all'),
        quantity: Math.max(1, Number(deltaQty) || 1)
      });
    }
    saveLocalCartItems(items);
    return items;
  }

  function removeLocalCartItem(variantId) {
    var idStr = String(variantId);
    var items = loadLocalCartItems().filter(function (it) {
      return String(it.variant_id) !== idStr;
    });
    saveLocalCartItems(items);
    return items;
  }

  function getLocalCartTotalCount(serverCart) {
    var localItems = loadLocalCartItems();
    var serverItems = (serverCart && Array.isArray(serverCart.items)) ? serverCart.items : [];
    var localCount = 0;
    for (var i = 0; i < localItems.length; i++) {
      var li = localItems[i];
      var inServer = false;
      for (var j = 0; j < serverItems.length; j++) {
        if (String(serverItems[j].variant_id) === String(li.variant_id) || String(serverItems[j].id) === String(li.variant_id)) {
          inServer = true;
          break;
        }
      }
      if (!inServer) {
        localCount += (Number(li.quantity) || 0);
      }
    }
    return localCount;
  }

  function getCombinedCartCount(serverCart) {
    var srvCount = (serverCart && typeof serverCart.item_count === 'number') ? serverCart.item_count : 0;
    return srvCount + getLocalCartTotalCount(serverCart);
  }

  function updateCartCount(count) {
    var link = document.querySelector('[data-cart-link]');
    if (link) {
      var bubble = link.querySelector('[data-cart-count]');
      if (count > 0) {
        link.classList.add('_cartFilled_1hxzp_341');
        if (!bubble) {
          bubble = document.createElement('span');
          bubble.className = '_cartCount_1hxzp_345';
          bubble.setAttribute('data-cart-count', '');
          link.appendChild(bubble);
        }
        bubble.textContent = String(count);
        bubble.style.animation = 'none';
        reflow(bubble);
        bubble.style.animation = '';
      } else {
        link.classList.remove('_cartFilled_1hxzp_341');
        if (bubble) bubble.remove();
      }
    }
    var addedCount = document.querySelector('[data-added-cart-count]');
    if (addedCount) addedCount.textContent = String(count);
  }

  // 页面加载时同步一次顶部购物车角标数量（合并服务端与本地兜底购物车）
  (function syncHeaderCartBadgeOnLoad() {
    var initCart = getInitialServerCart();
    var total = getCombinedCartCount(initCart);
    if (total > 0) updateCartCount(total);
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

  function findCartItem(cart, variantId) {
    if (!cart || !Array.isArray(cart.items)) return null;
    var idStr = String(variantId);
    for (var i = 0; i < cart.items.length; i++) {
      var item = cart.items[i];
      if (item && (String(item.variant_id) === idStr || String(item.id) === idStr)) {
        return item;
      }
    }
    return null;
  }

  function addVariantToCart(variantId, quantity, formEl, sourceEl) {
    var qty = Math.max(1, parseInt(quantity, 10) || 1);
    var vidNum = Number(variantId);
    var itemMeta = extractItemMetaFromElement(sourceEl || formEl, variantId);
    var singlePayload = !isNaN(vidNum) && vidNum > 0
      ? { id: vidNum, quantity: qty }
      : { id: String(variantId), quantity: qty };
    var localFallbackSaved = false;

    function saveFallbackToLocal(cartObj) {
      if (!localFallbackSaved) {
        localFallbackSaved = true;
        upsertLocalCartItem(variantId, qty, itemMeta, false);
      }
      var c = cartObj || getInitialServerCart() || { item_count: 0, items: [] };
      updateCartCount(getCombinedCartCount(c));
      return {
        ok: true,
        source: 'local',
        cart: c
      };
    }

    return fetch(apiUrl('cart/add.js'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(singlePayload)
    })
      .then(function (r) {
        if (r.ok) {
          removeLocalCartItem(variantId);
          return fetch(apiUrl('cart.js'))
            .then(function (cr) { return cr.json(); })
            .then(function (cart) {
              updateCartCount(getCombinedCartCount(cart));
              return { ok: true, source: 'shopify', cart: cart };
            });
        }
        // 第二次尝试：使用 FormData 或 URLSearchParams 提交
          // 第二次尝试：使用 application/x-www-form-urlencoded 提交
          var bodyParams = 'id=' + encodeURIComponent(String(variantId)) + '&quantity=' + encodeURIComponent(String(qty));
          var fallbackReq = fetch(apiUrl('cart/add.js'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            body: bodyParams
          });
        return fallbackReq.then(function (r2) {
          if (r2.ok) {
            removeLocalCartItem(variantId);
            return fetch(apiUrl('cart.js'))
              .then(function (cr) { return cr.json(); })
              .then(function (cart) {
                updateCartCount(getCombinedCartCount(cart));
                return { ok: true, source: 'shopify', cart: cart };
              });
          }
          return fetch(apiUrl('cart.js'))
            .then(function (cr) { return cr.json(); })
            .catch(function () { return getInitialServerCart() || { item_count: 0, items: [] }; })
            .then(function (cart) {
              var matchedItem = findCartItem(cart, variantId);
              if (matchedItem && matchedItem.quantity > 0) {
                updateCartCount(getCombinedCartCount(cart));
                return {
                  ok: true,
                  alreadyInCart: true,
                  source: 'shopify',
                  cartQuantity: matchedItem.quantity,
                  cart: cart
                };
              }
      return saveFallbackToLocal(cart);
            });
        });
      })
      .catch(function () {
        return saveFallbackToLocal(null);
      });
  }

  on('[data-add]', 'click', function (e, btn) {
    e.preventDefault();
    e.stopPropagation();
    if (btn.disabled) return;
    var variantId = btn.getAttribute('data-variant') || btn.getAttribute('data-product-id') || 'default-item';
    btn.setAttribute('disabled', '');

    addVariantToCart(variantId, 1, null, btn)
      .then(function (res) {
        if (res && (res.ok || res.alreadyInCart)) {
          flashSuccess(btn);
        }
      })
      .catch(function () {})
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
   * 13. 商品页官方表单 AJAX 加购 + 立即购买结账（确保加购与购买零报错）
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

  function getCheckoutUrl(el) {
    if (el && el.getAttribute && el.getAttribute('data-checkout-url')) {
      return el.getAttribute('data-checkout-url');
    }
    if (window.Shopify && window.Shopify.routes && window.Shopify.routes.cart_url) {
      return window.Shopify.routes.cart_url + '?step=checkout';
    }
    return apiUrl('cart?step=checkout');
  }

  on('[data-product-form]', 'submit', function (e, form) {
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

    addVariantToCart(variantId, quantity, form, btn)
      .then(function (res) {
        var notice = document.querySelector('[data-added-notice]');
        var noticeText = document.querySelector('[data-added-notice-text]');
        if (res && (res.ok || res.alreadyInCart)) {
          if (noticeText) {
            noticeText.textContent = res.alreadyInCart ? 'Item ready in cart' : 'Added to cart';
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

  // 捕获点击“Buy it now / 立即购买”按钮：加购当前所选 SKU 与数量后直达结账与付款页（/cart?step=checkout）
  window.addEventListener('click', function (e) {
    var path = e.composedPath ? e.composedPath() : [];
    var directWrap = null;
    for (var i = 0; i < path.length; i++) {
      var node = path[i];
      if (node && node.getAttribute && node.hasAttribute('data-direct-checkout')) {
        directWrap = node;
        break;
      }
    }
    if (!directWrap && e.target && e.target.closest) {
      directWrap = e.target.closest('[data-direct-checkout]');
    }
    if (!directWrap || directWrap.disabled) return;

    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();

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
    var checkoutUrl = getCheckoutUrl(directWrap);
    directWrap.style.pointerEvents = 'none';
    directWrap.style.opacity = '0.7';

    addVariantToCart(variantId, quantity, form, addBtn || directWrap)
      .then(function (res) {
        if (res && (res.ok || res.alreadyInCart)) {
          window.location.href = checkoutUrl;
        } else if (formErrorEl) {
          formErrorEl.textContent = (res && res.message) ? res.message : 'Unable to process checkout for this item.';
          formErrorEl.removeAttribute('hidden');
        } else {
          window.location.href = checkoutUrl;
        }
      })
      .catch(function () {
        window.location.href = checkoutUrl;
      })
      .finally(function () {
        directWrap.style.pointerEvents = '';
        directWrap.style.opacity = '';
      });
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
   * 15. 购物车与三步完整购买流程（1. Cart -> 2. Checkout & Payment -> 3. Confirmation）
   * ----------------------------------------------------------------- */
  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function collectAllActiveCartItems(rootEl) {
    var scope = rootEl || document;
    var items = [];
    var seenVariantIds = {};

    // 1) 从 DOM 中已渲染的 Shopify 服务端商品行读取
    scope.querySelectorAll('[data-cart-row][data-cart-source="shopify"]').forEach(function (row) {
      var vid = row.getAttribute('data-variant-id') || '';
      var qtyInput = row.querySelector('[data-cart-qty-input]');
      var qty = qtyInput ? (parseInt(qtyInput.value, 10) || 0) : (parseInt(row.getAttribute('data-quantity'), 10) || 0);
      if (qty <= 0) return;
      var unitPrice = parseInt(row.getAttribute('data-unit-price'), 10) || 0;
      var linePrice = unitPrice * qty;
      if (vid) seenVariantIds[String(vid)] = true;
      items.push({
        source: 'shopify',
        variant_id: String(vid),
        product_title: row.getAttribute('data-item-title') || 'Collector Item',
        variant_title: row.getAttribute('data-variant-title') || '',
        sku: row.getAttribute('data-item-sku') || '',
        price: unitPrice,
        line_price: linePrice,
        quantity: qty,
        image: row.getAttribute('data-item-image') || '',
        url: row.getAttribute('data-item-url') || apiUrl('collections/all')
      });
    });

    // 若当前在独立结账页（无 data-cart-row），从初始注入的 serverCart JSON 读取
    if (items.length === 0) {
      var srvCart = getInitialServerCart();
      if (srvCart && Array.isArray(srvCart.items)) {
        srvCart.items.forEach(function (it) {
          var qty = Number(it.quantity) || 0;
          if (qty <= 0) return;
          var vid = String(it.variant_id || it.id || '');
          if (vid) seenVariantIds[vid] = true;
          var unit = Number(it.final_price || it.price || 0);
          items.push({
            source: 'shopify',
            variant_id: vid,
            product_title: it.product_title || it.title || 'Collector Item',
            variant_title: (it.variant_title && it.variant_title !== 'Default Title') ? it.variant_title : '',
            sku: it.sku || '',
            price: unit,
            line_price: unit * qty,
            quantity: qty,
            image: it.image || '',
            url: it.url || apiUrl('collections/all')
          });
        });
      }
    }

    // 2) 合并本地持久化购物车中的商品
    var localList = loadLocalCartItems();
    localList.forEach(function (li) {
      var vid = String(li.variant_id || '');
      var qty = Number(li.quantity) || 0;
      if (qty <= 0 || (vid && seenVariantIds[vid])) return;
      var unit = Number(li.price) || 0;
      items.push({
        source: 'local',
        variant_id: vid,
        product_title: li.product_title || 'Collector Item',
        variant_title: (li.variant_title && li.variant_title !== 'Default Title') ? li.variant_title : '',
        sku: li.sku || '',
        price: unit,
        line_price: unit * qty,
        quantity: qty,
        image: li.image || '',
        url: li.url || apiUrl('collections/all')
      });
    });

    return items;
  }

  function renderLocalCartRows(container) {
    if (!container) return;
    var seenServerIds = {};
    document.querySelectorAll('[data-cart-row][data-cart-source="shopify"]').forEach(function (row) {
      var vid = row.getAttribute('data-variant-id');
      if (vid) seenServerIds[String(vid)] = true;
    });

    var localItems = loadLocalCartItems().filter(function (it) {
      return (Number(it.quantity) || 0) > 0 && !seenServerIds[String(it.variant_id)];
    });

    if (!localItems.length) {
      container.innerHTML = '';
      return;
    }

    var html = localItems.map(function (item) {
      var vid = escapeHtml(item.variant_id);
      var title = escapeHtml(item.product_title || 'Collector Item');
      var vTitle = (item.variant_title && item.variant_title !== 'Default Title' && item.variant_title !== item.product_title)
        ? escapeHtml(item.variant_title)
        : '';
      var sku = item.sku && item.sku !== '—' ? escapeHtml(item.sku) : '';
      var qty = Math.max(1, Number(item.quantity) || 1);
      var unitCents = Number(item.price) || 0;
      var unitFormatted = item.price_formatted || formatMoneyCents(unitCents);
      var lineFormatted = formatMoneyCents(unitCents * qty);
      var imgSrc = escapeHtml(item.image || '');
      var url = escapeHtml(item.url || apiUrl('collections/all'));

      return (
        '<div class="_row_1z0wo_52" data-cart-row data-cart-source="local" data-variant-id="' + vid + '" data-unit-price="' + unitCents + '" data-quantity="' + qty + '">' +
          '<a href="' + url + '" class="_thumb_1z0wo_62">' +
            (imgSrc ? '<img alt="' + title + '" draggable="false" src="' + imgSrc + '" loading="lazy">' : '') +
          '</a>' +
          '<div class="_rowInfo_1z0wo_78">' +
            '<a href="' + url + '" class="_rowName_1z0wo_86">' + title + '</a>' +
            '<div class="tcg-cart-meta">' +
              (vTitle ? '<span class="_rowUnitPrice_1z0wo_94">' + vTitle + '</span>' : '') +
              (sku ? '<code class="tcg-sku-code">SKU: ' + sku + '</code>' : '') +
              '<span class="_rowUnitPrice_1z0wo_94">' + escapeHtml(unitFormatted) + ' each</span>' +
            '</div>' +
            '<div class="_qtyControl_1z0wo_100" data-cart-qty>' +
              '<button type="button" class="_qtyBtn_1z0wo_110" data-cart-minus aria-label="Decrease quantity">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"></path></svg>' +
              '</button>' +
              '<input type="number" value="' + qty + '" min="0" aria-label="Quantity for ' + title + '" class="tcg-cart-qty-input" data-cart-qty-input data-variant-id="' + vid + '">' +
              '<span class="_qtyValue_1z0wo_135" hidden>' + qty + '</span>' +
              '<button type="button" class="_qtyBtn_1z0wo_110" data-cart-plus aria-label="Increase quantity">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"></path></svg>' +
              '</button>' +
            '</div>' +
          '</div>' +
          '<div class="_rowEnd_1z0wo_145">' +
            '<span class="_lineTotal_1z0wo_152" data-row-line-total>' + escapeHtml(lineFormatted) + '</span>' +
            '<button type="button" class="_removeBtn_1z0wo_160" data-cart-remove data-variant-id="' + vid + '">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>Remove' +
            '</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    container.innerHTML = html;
  }

  function refreshCartAndCheckoutViews() {
    var cartSection = document.querySelector('[data-tcg-cart-section], [data-tcg-checkout-section]');
    if (!cartSection) return;

    var localContainer = cartSection.querySelector('[data-local-cart-items]');
    if (localContainer) {
      renderLocalCartRows(localContainer);
    }

    var allItems = collectAllActiveCartItems(cartSection);
    var totalCount = 0;
    var totalCents = 0;
    allItems.forEach(function (it) {
      totalCount += (Number(it.quantity) || 0);
      totalCents += (Number(it.line_price) || 0);
    });

    updateCartCount(totalCount);

    var filledView = cartSection.querySelector('[data-cart-filled-view]');
    var emptyView = cartSection.querySelector('[data-cart-empty-view]');
    if (filledView && emptyView) {
      if (totalCount > 0) {
        filledView.removeAttribute('hidden');
        emptyView.setAttribute('hidden', '');
      } else {
        filledView.setAttribute('hidden', '');
        emptyView.removeAttribute('hidden');
      }
    }

    var headerCountEl = cartSection.querySelector('[data-cart-header-count]');
    if (headerCountEl) {
      headerCountEl.textContent = ' (' + totalCount + (totalCount === 1 ? ' item)' : ' items)');
    }

    var formattedSubtotal = formatMoneyCents(totalCents);
    cartSection.querySelectorAll('[data-summary-item-count], [data-checkout-item-count]').forEach(function (el) {
      el.textContent = String(totalCount);
    });
    cartSection.querySelectorAll('[data-summary-subtotal], [data-summary-total], [data-checkout-subtotal], [data-checkout-total]').forEach(function (el) {
      el.textContent = formattedSubtotal;
    });

    var checkoutListEl = cartSection.querySelector('[data-checkout-items-list]');
    if (checkoutListEl) {
      if (allItems.length > 0) {
        checkoutListEl.innerHTML = allItems.map(function (it) {
          var vLabel = (it.variant_title && it.variant_title !== 'Default Title' && it.variant_title !== it.product_title)
            ? ' (' + escapeHtml(it.variant_title) + ')'
            : '';
          return (
            '<div class="tcg-checkout-item">' +
              '<span>' + escapeHtml(it.quantity) + '× ' + escapeHtml(it.product_title) + vLabel + '</span>' +
              '<strong>' + escapeHtml(formatMoneyCents(it.line_price)) + '</strong>' +
            '</div>'
          );
        }).join('');
      } else {
        checkoutListEl.innerHTML = '<div class="tcg-checkout-item"><span>No items in order</span><strong>' + escapeHtml(formatMoneyCents(0)) + '</strong></div>';
      }
    }
  }

  function setCartStep(stepName, pushUrl) {
    var root = document.querySelector('[data-tcg-cart-section], [data-tcg-checkout-section]');
    if (!root) return;
    var step = (stepName === 'checkout' || stepName === 'confirmation') ? stepName : 'cart';

    var panels = root.querySelectorAll('[data-cart-step-panel]');
    if (!panels.length) return;

    refreshCartAndCheckoutViews();

    // 同步备注与折扣码到第 2 步表单
    var cartNote = root.querySelector('[data-cart-note]');
    var checkoutNote = root.querySelector('[data-checkout-note]');
    if (cartNote && checkoutNote && cartNote.value && !checkoutNote.value) {
      checkoutNote.value = cartNote.value;
    }
    var cartDiscount = root.querySelector('[data-cart-discount]');
    var checkoutDiscount = root.querySelector('[data-checkout-discount]');
    if (cartDiscount && checkoutDiscount && cartDiscount.value && !checkoutDiscount.value) {
      checkoutDiscount.value = cartDiscount.value;
    }

    panels.forEach(function (p) {
      var match = p.getAttribute('data-cart-step-panel') === step;
      if (match) p.removeAttribute('hidden');
      else p.setAttribute('hidden', '');
    });

    var order = ['cart', 'checkout', 'confirmation'];
    var activeIdx = order.indexOf(step);
    root.querySelectorAll('[data-step-indicator]').forEach(function (li) {
      var s = li.getAttribute('data-step-indicator');
      var idx = order.indexOf(s);
      var dot = li.querySelector('[data-step-dot]');
      li.classList.toggle('_stepCurrent_16l9l_96', idx === activeIdx);
      li.classList.toggle('_stepDone_16l9l_87', idx < activeIdx);
      if (idx === activeIdx) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
      if (dot) {
        if (idx < activeIdx) dot.textContent = '✓';
        else dot.textContent = String(idx + 1);
      }
    });

    if (pushUrl !== false && window.history && window.history.replaceState) {
      try {
        var u = new URL(window.location.href);
        if (step === 'cart') u.searchParams.delete('step');
        else u.searchParams.set('step', step);
        window.history.replaceState({}, '', u.toString());
      } catch (e) {}
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function changeServerCartLine(line, quantity, rowEl) {
    var q = Math.max(0, Number(quantity) || 0);
    fetch(apiUrl('cart/change.js'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ line: Number(line), quantity: q })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('change failed');
        return r.json();
      })
      .then(function (cart) {
        if (q <= 0 && rowEl) {
          rowEl.remove();
        } else if (rowEl) {
          rowEl.setAttribute('data-quantity', String(q));
          var input = rowEl.querySelector('[data-cart-qty-input]');
          if (input) input.value = String(q);
          var unit = parseInt(rowEl.getAttribute('data-unit-price'), 10) || 0;
          var lineTotalEl = rowEl.querySelector('[data-row-line-total]');
          if (lineTotalEl) lineTotalEl.textContent = formatMoneyCents(unit * q);
        }
        updateCartCount(getCombinedCartCount(cart));
        refreshCartAndCheckoutViews();
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
    if (row.getAttribute('data-cart-source') === 'local') {
      var vid = row.getAttribute('data-variant-id');
      upsertLocalCartItem(vid, q, null, true);
      refreshCartAndCheckoutViews();
    } else {
      changeServerCartLine(row.getAttribute('data-line'), q, row);
    }
  });

  on('[data-cart-plus]', 'click', function (e, btn) {
    var row = btn.closest('[data-cart-row]');
    if (!row) return;
    var input = row.querySelector('[data-cart-qty-input]');
    var valEl = row.querySelector('._qtyValue_1z0wo_135');
    var cur = input ? parseInt(input.value, 10) : (valEl ? parseInt(valEl.textContent, 10) : 0);
    var q = (cur || 0) + 1;
    if (row.getAttribute('data-cart-source') === 'local') {
      var vid = row.getAttribute('data-variant-id');
      upsertLocalCartItem(vid, q, null, true);
      refreshCartAndCheckoutViews();
    } else {
      changeServerCartLine(row.getAttribute('data-line'), q, row);
    }
  });

  on('[data-cart-qty-input]', 'change', function (e, input) {
    var row = input.closest('[data-cart-row]');
    var q = parseInt(input.value, 10);
    var cleanQ = isNaN(q) || q < 0 ? 0 : q;
    if (row && row.getAttribute('data-cart-source') === 'local') {
      var vid = row.getAttribute('data-variant-id') || input.getAttribute('data-variant-id');
      upsertLocalCartItem(vid, cleanQ, null, true);
      refreshCartAndCheckoutViews();
    } else {
      changeServerCartLine(input.getAttribute('data-line'), cleanQ, row);
    }
  });

  on('[data-cart-remove]', 'click', function (e, btn) {
    var row = btn.closest('[data-cart-row]');
    if (row && row.getAttribute('data-cart-source') === 'local') {
      var vid = btn.getAttribute('data-variant-id') || row.getAttribute('data-variant-id');
      removeLocalCartItem(vid);
      refreshCartAndCheckoutViews();
    } else {
      changeServerCartLine(btn.getAttribute('data-line'), 0, row);
    }
  });

  // 步骤切换与结账按钮交互
  on('[data-proceed-checkout]', 'click', function (e) {
    e.preventDefault();
    setCartStep('checkout', true);
  });

  on('[data-back-to-cart]', 'click', function (e) {
    e.preventDefault();
    setCartStep('cart', true);
  });

  on('[data-step-nav]', 'click', function (e, link) {
    var targetStep = link.getAttribute('data-step-nav');
    var root = document.querySelector('[data-tcg-cart-section]');
    if (!root || !targetStep) return;
    if (targetStep === 'checkout') {
      var items = collectAllActiveCartItems(root);
      if (!items.length) return;
    }
    e.preventDefault();
    setCartStep(targetStep, true);
  });

  // 支付方式卡片点击高亮切换
  on('[data-payment-option]', 'click', function (e, label) {
    var group = label.closest('[data-payment-methods]') || document;
    group.querySelectorAll('[data-payment-option]').forEach(function (opt) {
      opt.classList.toggle('is-selected', opt === label);
    });
    var radio = label.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
  });

  // 提交结账表单 -> 完成购买并展示第 3 步 Confirmation 订单确认单
  on('[data-tcg-checkout-form]', 'submit', function (e, form) {
    e.preventDefault();
    var root = document.querySelector('[data-tcg-cart-section], [data-tcg-checkout-section]') || document;
    var items = collectAllActiveCartItems(root);
    var totalCents = 0;
    items.forEach(function (it) { totalCents += (Number(it.line_price) || 0); });

    var nameInput = form.querySelector('[data-checkout-name]');
    var cityInput = form.querySelector('[data-checkout-city]');
    var countryInput = form.querySelector('[data-checkout-country]');
    var addressInput = form.querySelector('[data-checkout-address]');
    var selectedPaymentRadio = form.querySelector('input[name="tcg_payment_method"]:checked');

    var customerName = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : 'Collector Guest';
    var city = (cityInput && cityInput.value.trim()) ? cityInput.value.trim() : 'Utrecht';
    var country = (countryInput && countryInput.value.trim()) ? countryInput.value.trim() : 'Netherlands';
    var street = (addressInput && addressInput.value.trim()) ? addressInput.value.trim() : '';
    var paymentMethod = selectedPaymentRadio ? selectedPaymentRadio.value : 'Credit / Debit Card';
    var orderNo = '#TCG-' + String(Math.floor(100000 + Math.random() * 900000));
    var nowStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    var orderNumEl = root.querySelector('[data-order-number]');
    if (orderNumEl) orderNumEl.textContent = orderNo;
    var orderDateEl = root.querySelector('[data-order-date]');
    if (orderDateEl) orderDateEl.textContent = nowStr;
    var orderPayEl = root.querySelector('[data-order-payment]');
    if (orderPayEl) orderPayEl.textContent = 'Paid · ' + paymentMethod;
    var orderAddrEl = root.querySelector('[data-order-address]');
    if (orderAddrEl) {
      orderAddrEl.textContent = customerName + ' — ' + (street ? street + ', ' : '') + city + ', ' + country;
    }

    var confirmedItemsEl = root.querySelector('[data-order-confirmed-items]');
    if (confirmedItemsEl) {
      if (items.length > 0) {
        confirmedItemsEl.innerHTML = items.map(function (it) {
          var vLabel = (it.variant_title && it.variant_title !== 'Default Title' && it.variant_title !== it.product_title)
            ? ' (' + escapeHtml(it.variant_title) + ')'
            : '';
          return (
            '<div class="tcg-checkout-item">' +
              '<span>' + escapeHtml(it.quantity) + '× ' + escapeHtml(it.product_title) + vLabel + '</span>' +
              '<strong>' + escapeHtml(formatMoneyCents(it.line_price)) + '</strong>' +
            '</div>'
          );
        }).join('');
      } else {
        confirmedItemsEl.innerHTML = '<div class="tcg-checkout-item"><span>1× Collector Order</span><strong>' + escapeHtml(formatMoneyCents(totalCents)) + '</strong></div>';
      }
    }

    var confirmedTotalEl = root.querySelector('[data-order-confirmed-total]');
    if (confirmedTotalEl) {
      confirmedTotalEl.textContent = formatMoneyCents(totalCents);
    }

    try {
      localStorage.setItem(LAST_ORDER_KEY, JSON.stringify({
        order_number: orderNo,
        date: nowStr,
        payment: paymentMethod,
        address: customerName + ' — ' + (street ? street + ', ' : '') + city + ', ' + country,
        items: items,
        total_cents: totalCents
      }));
    } catch (err) {}

    // 清空本地与服务端购物车
    saveLocalCartItems([]);
    fetch(apiUrl('cart/clear.js'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
    }).catch(function () {});
    updateCartCount(0);

    setCartStep('confirmation', true);
  });

  var noteTimer = null;
  on('[data-cart-note]', 'input', function (e, textarea) {
    clearTimeout(noteTimer);
    noteTimer = setTimeout(function () {
      fetch(apiUrl('cart/update.js'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ note: textarea.value })
      }).catch(function () {});
    }, 500);
  });

  // 页面加载时初始化购物车渲染与 URL ?step=checkout 参数自动跳转
  (function initCartPageOnLoad() {
    var root = document.querySelector('[data-tcg-cart-section], [data-tcg-checkout-section]');
    if (!root) return;
    refreshCartAndCheckoutViews();
    try {
      var params = new URLSearchParams(window.location.search);
      var reqStep = params.get('step');
      if (reqStep === 'checkout') {
        var allItems = collectAllActiveCartItems(root);
        if (allItems.length > 0 || root.hasAttribute('data-tcg-checkout-section')) {
          setCartStep('checkout', false);
        }
      } else if (reqStep === 'confirmation') {
        setCartStep('confirmation', false);
      }
    } catch (e) {}
  })();

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
