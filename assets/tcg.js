/* =====================================================================
 * TCG 主题交互脚本（原生 JS，无依赖）
 * 模块：路由进度条 / 滚动导航 / 搜索 / 移动菜单 / 滚动揭示 /
 *       Hero 轮播 / AJAX 加购 / 预售倒计时
 * ===================================================================== */
(function () {
  'use strict';

  /* 通用：事件委托绑定 */
  function on(selector, event, handler, root) {
    (root || document).addEventListener(event, function (e) {
      var el = e.target.closest(selector);
      if (el) handler.call(el, e, el);
    });
  }

  /* 通用：下一帧重新触发 CSS 动画 */
  function reflow(el) {
    void el.offsetWidth;
  }

  /* -------------------------------------------------------------------
   * 1. 路由顶部进度条（页面加载时短暂演示）
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
   * 2. 滚动时导航收缩 + 阴影
   * ----------------------------------------------------------------- */
  (function scrollHeader() {
    var header = document.querySelector('[data-tcg-header]');
    if (!header) return;
    var inner = header.querySelector('._inner_1hxzp_10');
    function onScroll() {
      var scrolled = window.scrollY > 24;
      inner.classList.toggle('_scrolled_1hxzp_27', scrolled);
      inner.classList.toggle('_compact_1hxzp_41', scrolled);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  /* -------------------------------------------------------------------
   * 3. 搜索框展开 / 收起
   * ----------------------------------------------------------------- */
  (function searchToggle() {
    var trigger = document.querySelector('[data-search-trigger]');
    if (!trigger) return;
    var form = trigger.closest('form');
    var input = form.querySelector('input');
    trigger.addEventListener('click', function () {
      var opened = form.classList.toggle('_searchOpen_1hxzp_45');
      if (opened) input.focus();
    });
    // 失焦且输入为空时收起（移动端体验）
    input.addEventListener('blur', function () {
      if (!input.value && window.matchMedia('(max-width: 1023px)').matches) {
        form.classList.remove('_searchOpen_1hxzp_45');
      }
    });
  })();

  /* -------------------------------------------------------------------
   * 4. 移动端菜单
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
   * 5. 滚动揭示（data-reveal 进入视口后由隐藏转为可见）
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
   * 6. Hero 轮播：自动 6s 推进 + 分段点击 + 鼠标聚光
   * ----------------------------------------------------------------- */
  (function heroCarousel() {
    var stage = document.querySelector('[data-hero]');
    if (!stage) return;
    var slides = Array.prototype.slice.call(stage.querySelectorAll('[data-slide]'));
    var segments = Array.prototype.slice.call(stage.querySelectorAll('[data-segment]'));
    var spotlight = stage.querySelector('._spotlight_n65qd_40');
    var DURATION = 6000;
    var current = 0;
    var timer = null;

    /* 切换到指定索引 */
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
        var fill = seg.querySelector('._segmentFill_n65qd_363');
        seg.classList.toggle('_segmentActive_n65qd_356', active);
        seg.setAttribute('aria-selected', active ? 'true' : 'false');
        // 重置并重新触发填充动画
        fill.classList.remove('_segmentTimed_n65qd_382');
        if (active) {
          reflow(fill);
          fill.classList.add('_segmentTimed_n65qd_382');
        }
      });
    }

    /* 重新启动自动计时 */
    function restart() {
      clearInterval(timer);
      timer = setInterval(function () { go(current + 1); }, DURATION);
    }

    segments.forEach(function (seg, i) {
      seg.addEventListener('click', function () {
        go(i);
        restart();
      });
    });

    /* 鼠标移动更新聚光位置（--mx / --my） */
    stage.addEventListener('pointermove', function (e) {
      var rect = stage.getBoundingClientRect();
      stage.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width).toFixed(3));
      stage.style.setProperty('--my', ((e.clientY - rect.top) / rect.height).toFixed(3));
    });

    /* 标签页隐藏时暂停，可见时恢复 */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearInterval(timer);
      else restart();
    });

    restart();
  })();

  /* -------------------------------------------------------------------
   * 7. AJAX 加购（事件委托，覆盖所有 data-add 按钮）
   * ----------------------------------------------------------------- */
  var CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>';
  var PLUS_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"></path></svg>';

  /* 更新购物车角标数量 */
  function updateCartCount(count) {
    var link = document.querySelector('[data-cart-link]');
    if (!link) return;
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
      // 重新触发弹跳动画
      bubble.style.animation = 'none';
      reflow(bubble);
      bubble.style.animation = '';
    }
  }

  /* 按钮成功打勾反馈，1.6s 后还原 */
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
    btn.setAttribute('disabled', '');

    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: Number(variantId), quantity: 1 })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('add failed');
        return fetch('/cart.js');
      })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        updateCartCount(cart.item_count);
        flashSuccess(btn);
      })
      .catch(function () {
        // 失败时回退到购物车页
        window.location.href = '/cart';
      })
      .finally(function () {
        btn.removeAttribute('disabled');
      });
  });

  /* -------------------------------------------------------------------
   * 8. 预售倒计时（data-countdown 携带 ISO 日期）
   * ----------------------------------------------------------------- */
  (function countdowns() {
    var nodes = document.querySelectorAll('[data-countdown]');
    if (!nodes.length) return;

    function tick() {
      nodes.forEach(function (node) {
        var target = new Date(node.getAttribute('data-countdown')).getTime();
        var diff = target - Date.now();
        if (diff <= 0) {
          node.querySelector('strong').textContent = 'Available now';
          return;
        }
        var days = Math.floor(diff / 86400000);
        var hours = Math.floor((diff % 86400000) / 3600000);
        node.querySelector('strong').textContent = days + 'd ' + hours + 'h';
      });
    }
    tick();
    setInterval(tick, 60000);
  })();

  /* -------------------------------------------------------------------
   * 9. 拍照搜卡：点击拍照按钮触发隐藏文件选择
   * ----------------------------------------------------------------- */
  (function photoSearch() {
    var trigger = document.querySelector('[data-photo-trigger]');
    var file = document.querySelector('[data-photo-file]');
    if (!trigger || !file) return;
    trigger.addEventListener('click', function () { file.click(); });
    file.addEventListener('change', function () {
      // 拍照识别为高级后端能力，此处先回退到搜索页
      if (file.value) window.location.href = '/search';
    });
  })();

  /* -------------------------------------------------------------------
   * 10. 商品页数量选择器
   * ----------------------------------------------------------------- */
  (function productQuantity() {
    var qty = document.querySelector('[data-quantity]');
    if (!qty) return;
    var value = qty.querySelector('[data-qty-value]');
    var minus = qty.querySelector('[data-qty-minus]');
    var plus = qty.querySelector('[data-qty-plus]');
    var n = 1;
    function render() {
      value.textContent = n;
      minus.disabled = n <= 1;
    }
    minus.addEventListener('click', function () { if (n > 1) { n--; render(); } });
    plus.addEventListener('click', function () { n++; render(); });
  })();

  /* -------------------------------------------------------------------
   * 11. 商品页 AJAX 加购（携带所选数量，主按钮打勾反馈）
   * ----------------------------------------------------------------- */
  on('[data-product-add]', 'click', function (e, btn) {
    if (btn.disabled) return;
    var variantId = btn.getAttribute('data-variant');
    var qtyWrap = document.querySelector('[data-quantity]');
    var quantity = qtyWrap ? parseInt(qtyWrap.querySelector('[data-qty-value]').textContent, 10) : 1;
    var original = btn.textContent;
    btn.setAttribute('disabled', '');

    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: Number(variantId), quantity: quantity })
    })
      .then(function (r) { if (!r.ok) throw new Error('add failed'); return fetch('/cart.js'); })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        updateCartCount(cart.item_count);
        btn.classList.add('_primaryButtonDone_4xdw3_728');
        btn.innerHTML = CHECK_ICON;
        setTimeout(function () {
          btn.classList.remove('_primaryButtonDone_4xdw3_728');
          btn.textContent = original;
        }, 1600);
      })
      .catch(function () { window.location.href = '/cart'; })
      .finally(function () { btn.removeAttribute('disabled'); });
  });

  /* -------------------------------------------------------------------
   * 12. 多图缩略图切换主图
   * ----------------------------------------------------------------- */
  on('[data-thumb]', 'click', function (e, thumb) {
    var full = thumb.getAttribute('data-full');
    var main = document.querySelector('[data-main-image]');
    if (main && full) main.src = full;
    document.querySelectorAll('[data-thumb]').forEach(function (t) {
      t.classList.remove('_thumbActive_4xdw3_239');
    });
    thumb.classList.add('_thumbActive_4xdw3_239');
  });

  /* -------------------------------------------------------------------
   * 13. 单卡 3D 倾斜（pointer 移动更新 CSS 变量 --tilt/--shadow）
   * ----------------------------------------------------------------- */
  (function cardTilt() {
    var card = document.querySelector('[data-tilt-card]');
    if (!card) return;
    var media = card.closest('._productMedia_4xdw3_145');
    if (!media) return;
    var MAX = 12; // 最大倾斜角度
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

  /* -------------------------------------------------------------------
   * 14. 收藏（wishlist）按钮切换
   * ----------------------------------------------------------------- */
  on('[data-wishlist]', 'click', function (e, btn) {
    var active = btn.classList.toggle('_saveButtonActive_4xdw3_458');
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  /* -------------------------------------------------------------------
   * 15. 购物车数量调整 / 删除（change.js，完成后刷新页面反映总价）
   * ----------------------------------------------------------------- */
  function changeCart(line, quantity) {
    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ line: Number(line), quantity: Number(quantity) })
    })
      .then(function (r) { if (!r.ok) throw new Error('change failed'); return r.json(); })
      .then(function () { window.location.reload(); })
      .catch(function () { window.location.href = '/cart'; });
  }

  on('[data-cart-minus]', 'click', function (e, btn) {
    var row = btn.closest('[data-cart-row]');
    var q = parseInt(row.querySelector('._qtyValue_1z0wo_135').textContent, 10) - 1;
    changeCart(row.getAttribute('data-line'), q <= 0 ? 0 : q);
  });

  on('[data-cart-plus]', 'click', function (e, btn) {
    var row = btn.closest('[data-cart-row]');
    var q = parseInt(row.querySelector('._qtyValue_1z0wo_135').textContent, 10) + 1;
    changeCart(row.getAttribute('data-line'), q);
  });

  on('[data-cart-remove]', 'click', function (e, btn) {
    changeCart(btn.getAttribute('data-line'), 0);
  });

  /* -------------------------------------------------------------------
   * 16. 搜索排序下拉自动提交
   * ----------------------------------------------------------------- */
  on('[data-auto-submit]', 'change', function (e, sel) {
    var url = new URL(window.location.href);
    url.searchParams.set('sort_by', sel.value);
    window.location.href = url.toString();
  });

  /* -------------------------------------------------------------------
   * 17. 筛选抽屉：打开/关闭 + 遮罩 scrim
   * ----------------------------------------------------------------- */
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
})();
