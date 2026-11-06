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
   * 3. 滚动时导航收缩 + 阴影
   * ----------------------------------------------------------------- */
  (function scrollHeader() {
    var header = document.querySelector('[data-tcg-header]');
    if (!header) return;
    var inner = header.querySelector('._inner_1hxzp_10');
    if (!inner) return;
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
      if (!input.value && window.matchMedia('(max-width: 1023px)').matches) {
        form.classList.remove('_searchOpen_1hxzp_45');
      }
    });
  })();

  /* -------------------------------------------------------------------
   * 5. 移动端菜单
   * ----------------------------------------------------------------- */
  (function mobileMenu() {
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
   * 8. 通用 AJAX 加购（覆盖所有 data-add 按钮，对接 Shopify /cart/add.js）
   * ----------------------------------------------------------------- */
  var CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>';
  var PLUS_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"></path></svg>';

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
        bubble.textContent = count;
        bubble.style.animation = 'none';
        reflow(bubble);
        bubble.style.animation = '';
      }
    }
    var addedCount = document.querySelector('[data-added-cart-count]');
    if (addedCount) addedCount.textContent = count;
  }

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

  on('[data-add]', 'click', function (e, btn) {
    if (btn.disabled) return;
    var variantId = btn.getAttribute('data-variant');
    if (!variantId) return;
    btn.setAttribute('disabled', '');

    fetch(apiUrl('cart/add.js'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: Number(variantId), quantity: 1 })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('add failed');
        return fetch(apiUrl('cart.js'));
      })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        updateCartCount(cart.item_count);
        flashSuccess(btn);
      })
      .catch(function () {
        window.location.href = apiUrl('cart');
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

    function render() {
      if (n < 1 || isNaN(n)) n = 1;
      if (input) input.value = String(n);
      if (valueSpan) valueSpan.textContent = String(n);
      if (minus) minus.disabled = n <= 1;
    }

    if (minus) {
      minus.addEventListener('click', function () {
        if (n > 1) { n--; render(); }
      });
    }
    if (plus) {
      plus.addEventListener('click', function () {
        n++;
        render();
      });
    }
    if (input) {
      input.addEventListener('change', function () {
        n = parseInt(input.value, 10) || 1;
        render();
      });
    }
    render();
  })();

  /* -------------------------------------------------------------------
   * 12. 商品页完整 SKU / 多规格切换与主图、价格、库存、URL 实时联动
   * ----------------------------------------------------------------- */
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
    var buyNowBtn = section.querySelector('[data-buy-now]');
    var mainImg = section.querySelector('[data-main-image]');
    var selectEl = section.querySelector('[data-variant-select]');
    var priceEl = section.querySelector('[data-variant-price]');
    var compareEl = section.querySelector('[data-variant-compare]');
    var stockBadge = section.querySelector('[data-variant-stock-badge]');
    var stockText = section.querySelector('[data-variant-stock-text]');
    var summaryStock = section.querySelector('[data-variant-summary-stock]');
    var kickerSkuWrap = section.querySelector('[data-kicker-sku-wrap]');

    function selectVariantById(variantId) {
      var idStr = String(variantId);
      var variant = null;
      for (var i = 0; i < variants.length; i++) {
        if (String(variants[i].id) === idStr) {
          variant = variants[i];
          break;
        }
      }

      // 同步表单 hidden input 与按钮属性
      if (idInput) idInput.value = idStr;
      if (addBtn) addBtn.setAttribute('data-variant', idStr);
      if (buyNowBtn) buyNowBtn.setAttribute('data-variant', idStr);
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
      var isAvailable = variant ? Boolean(variant.available) : (activeCard ? activeCard.getAttribute('data-variant-available') === 'true' : true);
      var invQty = variant ? Number(variant.inventory_quantity || 0) : (activeCard ? Number(activeCard.getAttribute('data-variant-qty') || 0) : 0);
      var tracked = variant ? Boolean(variant.inventory_management) : (activeCard ? Boolean(activeCard.getAttribute('data-variant-tracked')) : false);
      var imgUrl = variant ? variant.featured_image_url : (activeCard ? activeCard.getAttribute('data-variant-image') : '');
      var mediaId = variant && variant.featured_media_id ? String(variant.featured_media_id) : (activeCard ? activeCard.getAttribute('data-variant-media-id') : '');

      // 更新所有 SKU 编码与规格名称节点
      section.querySelectorAll('[data-variant-sku]').forEach(function (el) {
        el.textContent = skuCode || '—';
      });
      if (kickerSkuWrap) {
        if (skuCode && skuCode !== '—') kickerSkuWrap.removeAttribute('hidden');
        else kickerSkuWrap.setAttribute('hidden', '');
      }
      section.querySelectorAll('[data-variant-title]').forEach(function (el) {
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
        var labelTarget = addBtnText || addBtn;
        labelTarget.textContent = !isAvailable ? 'Sold out' : (isPreorder ? 'Pre-order' : 'Add to cart');
      }
      if (buyNowBtn) {
        buyNowBtn.disabled = !isAvailable;
      }

      // 同步多维属性胶囊高亮
      if (variant && Array.isArray(variant.options)) {
        section.querySelectorAll('.tcg-option-group').forEach(function (grp, idx) {
          var val = variant.options[idx];
          if (!val) return;
          var selValEl = grp.querySelector('[data-option-selected-val]');
          if (selValEl) selValEl.textContent = val;
          grp.querySelectorAll('[data-option-btn]').forEach(function (btn) {
            btn.classList.toggle('is-selected', btn.getAttribute('data-option-value') === val);
          });
        });
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
      if (window.history && window.history.replaceState) {
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
      if (vid) selectVariantById(vid);
    }, section);

    // 2) 切换 SKU 下拉菜单
    if (selectEl) {
      selectEl.addEventListener('change', function () {
        selectVariantById(selectEl.value);
      });
    }

    // 3) 点击多维属性按钮（按 options 组合查找匹配 variant）
    on('[data-option-btn]', 'click', function (e, btn) {
      var group = btn.closest('.tcg-option-group');
      if (!group) return;
      group.querySelectorAll('[data-option-btn]').forEach(function (b) {
        b.classList.toggle('is-selected', b === btn);
      });
      var selectedOptions = [];
      section.querySelectorAll('.tcg-option-group').forEach(function (grp) {
        var active = grp.querySelector('[data-option-btn].is-selected');
        selectedOptions.push(active ? active.getAttribute('data-option-value') : '');
      });
      for (var i = 0; i < variants.length; i++) {
        var v = variants[i];
        if (!Array.isArray(v.options)) continue;
        var allMatch = selectedOptions.every(function (opt, idx) {
          return !opt || v.options[idx] === opt;
        });
        if (allMatch) {
          selectVariantById(v.id);
          break;
        }
      }
    }, section);

    // 4) 点击缩略图时，同时检查是否有绑定该 media_id 的 SKU
    on('[data-thumb]', 'click', function (e, thumb) {
      var full = thumb.getAttribute('data-full');
      var mediaId = thumb.getAttribute('data-media-id');
      if (mainImg && full) mainImg.src = full;
      section.querySelectorAll('[data-thumb]').forEach(function (t) {
        t.classList.remove('_thumbActive_4xdw3_239');
      });
      thumb.classList.add('_thumbActive_4xdw3_239');

      if (mediaId && variants.length > 1) {
        for (var i = 0; i < variants.length; i++) {
          if (String(variants[i].featured_media_id) === String(mediaId)) {
            selectVariantById(variants[i].id);
            break;
          }
        }
      }
    }, section);
  })();

  /* -------------------------------------------------------------------
   * 13. 商品页官方表单 AJAX 加购 + 立即购买（Buy it now 直达官方 Checkout）
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

  on('[data-product-form]', 'submit', function (e, form) {
    e.preventDefault();
    var btn = form.querySelector('[data-product-add]');
    if (!btn || btn.disabled) return;
    var idInput = form.querySelector('[data-variant-id-input]');
    var variantId = (idInput && idInput.value) || btn.getAttribute('data-variant');
    var quantity = getProductQuantity();
    var textEl = btn.querySelector('[data-product-add-text]') || btn;
    var originalText = textEl.textContent;
    btn.setAttribute('disabled', '');

    fetch(apiUrl('cart/add.js'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: Number(variantId), quantity: quantity })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('add failed');
        return fetch(apiUrl('cart.js'));
      })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        updateCartCount(cart.item_count);
        btn.classList.add('_primaryButtonDone_4xdw3_728');
        textEl.innerHTML = CHECK_ICON;
        var notice = document.querySelector('[data-added-notice]');
        if (notice) notice.removeAttribute('hidden');
        setTimeout(function () {
          btn.classList.remove('_primaryButtonDone_4xdw3_728');
          textEl.textContent = originalText;
        }, 1600);
      })
      .catch(function () {
        // 回退使用原生表单提交到 Shopify 官方 /cart/add
        form.submit();
      })
      .finally(function () {
        btn.removeAttribute('disabled');
      });
  });

  on('[data-buy-now]', 'click', function (e, btn) {
    if (btn.disabled) return;
    var idInput = document.querySelector('[data-variant-id-input]');
    var variantId = (idInput && idInput.value) || btn.getAttribute('data-variant');
    var quantity = getProductQuantity();
    var checkoutUrl = btn.getAttribute('data-checkout-url') || apiUrl('checkout');
    if (!variantId) return;

    btn.setAttribute('disabled', '');
    fetch(apiUrl('cart/add.js'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: Number(variantId), quantity: quantity })
    })
      .then(function () {
        window.location.href = checkoutUrl;
      })
      .catch(function () {
        window.location.href = apiUrl('cart/' + variantId + ':' + quantity);
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
   * 15. 购物车数量调整 / 删除（/cart/change.js）与备注保存（/cart/update.js）
   * ----------------------------------------------------------------- */
  function changeCart(line, quantity) {
    fetch(apiUrl('cart/change.js'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ line: Number(line), quantity: Number(quantity) })
    })
      .then(function (r) { if (!r.ok) throw new Error('change failed'); return r.json(); })
      .then(function () { window.location.reload(); })
      .catch(function () { window.location.href = apiUrl('cart'); });
  }

  on('[data-cart-minus]', 'click', function (e, btn) {
    var row = btn.closest('[data-cart-row]');
    if (!row) return;
    var input = row.querySelector('[data-cart-qty-input]');
    var valEl = row.querySelector('._qtyValue_1z0wo_135');
    var cur = input ? parseInt(input.value, 10) : parseInt(valEl.textContent, 10);
    var q = (cur || 1) - 1;
    changeCart(row.getAttribute('data-line'), q <= 0 ? 0 : q);
  });

  on('[data-cart-plus]', 'click', function (e, btn) {
    var row = btn.closest('[data-cart-row]');
    if (!row) return;
    var input = row.querySelector('[data-cart-qty-input]');
    var valEl = row.querySelector('._qtyValue_1z0wo_135');
    var cur = input ? parseInt(input.value, 10) : parseInt(valEl.textContent, 10);
    changeCart(row.getAttribute('data-line'), (cur || 0) + 1);
  });

  on('[data-cart-qty-input]', 'change', function (e, input) {
    var q = parseInt(input.value, 10);
    changeCart(input.getAttribute('data-line'), isNaN(q) || q < 0 ? 0 : q);
  });

  on('[data-cart-remove]', 'click', function (e, btn) {
    changeCart(btn.getAttribute('data-line'), 0);
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
