/* ============================================================
   main.js —— 双语切换 + 滚动揭示 + 首页鼠标互动
   依据 docs/00-设计系统总纲.md（§5 动效 / §6 i18n）
   ============================================================ */

/* ------------------------------------------------------------
   1 · 语言初始化（尽早执行，避免切换时闪烁）
   —— 必须放在文件最顶部，先于任何渲染逻辑
   ------------------------------------------------------------ */
(function () {
  var saved = localStorage.getItem("lang") || "zh";
  document.documentElement.dataset.lang = saved;
})();

/* 语言切换：全局函数，供 <button onclick="toggleLang()"> 调用 */
function toggleLang() {
  var next = document.documentElement.dataset.lang === "zh" ? "en" : "zh";
  document.documentElement.dataset.lang = next;
  localStorage.setItem("lang", next);
}

/* ------------------------------------------------------------
   2 · 页面交互
   ------------------------------------------------------------ */
(function () {
  "use strict";

  /* ---------- 2.1 滚动揭示（进入视口加 .in，错峰出现） ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e, i) {
          if (e.isIntersecting) {
            e.target.style.transitionDelay = (i % 6) * 60 + "ms";
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    // 不支持时直接显示
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- 2.2 自动填充年份 ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 2.3 锚点导航高亮（子页面侧边目录） ---------- */
  var navLinks = document.querySelectorAll("[data-spy]");
  var sections = document.querySelectorAll("section[id]");
  if (navLinks.length && sections.length && "IntersectionObserver" in window) {
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.getAttribute("id");
            navLinks.forEach(function (l) {
              l.classList.toggle("active", l.getAttribute("href") === "#" + id);
            });
          }
        });
      },
      { threshold: 0.5 }
    );
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- 2.4 首页：三层视差 + 名片 3D 转身 + 高光跟手（docs/01）---------- */
  (function () {
    var card = document.getElementById("card");
    var shine = card && card.querySelector(".card-shine");
    var layers = Array.prototype.slice.call(document.querySelectorAll("[data-depth]"));
    if (!layers.length) return;                                            // 非主页直接退出
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // 无障碍

    var raf = null, mx = 0, my = 0;
    window.addEventListener("mousemove", function (e) {
      mx = e.clientX / window.innerWidth - 0.5;   // -0.5 ~ 0.5
      my = e.clientY / window.innerHeight - 0.5;
      if (shine) {
        var r = card.getBoundingClientRect();
        shine.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
        shine.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
      }
      if (!raf) raf = requestAnimationFrame(apply);
    });

    function apply() {
      raf = null;
      layers.forEach(function (l) {
        var d = parseFloat(l.dataset.depth) * 100;
        var t = "translate3d(" + (-mx * d) + "px," + (-my * d) + "px,0)";
        if (l === card) t += " rotateY(" + (mx * 6) + "deg) rotateX(" + (-my * 6) + "deg)";  // 朝光标转身
        l.style.transform = t;
      });
    }
  })();

  /* ---------- 2.5 首页：飘落的星星 ---------- */
  (function () {
    var box = document.querySelector(".stars");
    if (!box) return;                                                       // 非主页直接退出
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // 无障碍

    var glyphs = ["✦", "✧", "⋆", "·"];
    var N = 26;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < N; i++) {
      var s = document.createElement("span");
      s.className = "star";
      s.textContent = glyphs[(Math.random() * glyphs.length) | 0];
      var dur = 7 + Math.random() * 9;                          // 7 - 16s
      s.style.left = (Math.random() * 100).toFixed(2) + "%";
      s.style.fontSize = (6 + Math.random() * 14).toFixed(1) + "px"; // 6 - 20px
      s.style.animationDuration = dur.toFixed(2) + "s";
      s.style.animationDelay = (-Math.random() * dur).toFixed(2) + "s";    // 负延迟 → 错峰、首屏即有
      frag.appendChild(s);
    }
    box.appendChild(frag);
  })();

  /* ---------- 2.6 首页：气泡入口（点击破裂迸溅 → 进入） ---------- */
  (function () {
    var bubbles = document.querySelectorAll(".bubble");
    if (!bubbles.length) return;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    bubbles.forEach(function (b) {
      b.addEventListener("click", function (e) {
        // 修饰键点击 → 交给浏览器（新标签等）
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        if (b.classList.contains("pop")) return;
        var href = b.getAttribute("href");

        if (reduced) { window.location.href = href; return; }

        b.classList.add("pop");
        burst(b);
        window.setTimeout(function () { window.location.href = href; }, 520);
      });
    });

    // 迸溅的水珠
    function burst(b) {
      var r = b.getBoundingClientRect();
      var cx = r.left + r.width / 2;
      var cy = r.top + r.height / 2;
      var layer = document.createElement("div");
      layer.className = "droplets";
      document.body.appendChild(layer);

      var n = 32;                                  // 很多很多小气泡
      for (var i = 0; i < n; i++) {
        var d = document.createElement("span");
        d.className = "droplet";
        var ang = (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.7;
        var dist = 30 + Math.random() * 100;       // 向外四散，远近不一
        var sz = 4 + Math.random() * 14;
        d.style.left = cx + "px";
        d.style.top = cy + "px";
        d.style.width = sz + "px";
        d.style.height = sz + "px";
        d.style.setProperty("--dx", Math.cos(ang) * dist + "px");
        d.style.setProperty("--dy", Math.sin(ang) * dist + "px");
        layer.appendChild(d);
      }
      window.setTimeout(function () { layer.remove(); }, 900);
    }
  })();

  /* ---------- 2.7 首页：欢迎语逐字书写 + 写完冒出小太阳 ---------- */
  (function () {
    var line = document.querySelector(".welcome-line");
    if (!line) return;
    var sun = document.querySelector(".welcome-sun");
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var text = line.textContent;

    if (reduced) { if (sun) sun.classList.add("go"); return; }

    // 拆成「词(不折断) + 词内逐字」，避免单词被换行截断
    line.textContent = "";
    var chars = [];
    var words = text.split(" ");
    words.forEach(function (word, wi) {
      var w = document.createElement("span");
      w.className = "word";
      for (var j = 0; j < word.length; j++) {
        var c = document.createElement("span");
        c.className = "ch";
        c.textContent = word.charAt(j);
        w.appendChild(c);
        chars.push(c);
      }
      line.appendChild(w);
      if (wi < words.length - 1) {
        var sp = document.createElement("span");
        sp.className = "ch ch-space";
        sp.textContent = " ";
        line.appendChild(sp);
        chars.push(sp);
      }
    });
    // 粉笔尖
    var tip = document.createElement("span");
    tip.className = "welcome-tip";
    line.appendChild(tip);

    var START = 350, STEP = 78;
    chars.forEach(function (c, i) {
      window.setTimeout(function () {
        c.classList.add("inked");
        tip.style.left = (c.offsetLeft + c.offsetWidth) + "px";
        tip.style.top = c.offsetTop + "px";
        tip.style.height = c.offsetHeight + "px";
        tip.style.opacity = "1";
      }, START + i * STEP);
    });
    // 写完：收笔 + 冒出小太阳抖动
    window.setTimeout(function () {
      tip.style.opacity = "0";
      if (sun) sun.classList.add("go");
    }, START + chars.length * STEP + 160);
  })();

  /* ---------- 2.8 背景音乐 开关 ---------- */
  (function () {
    var btn = document.getElementById("music-btn");
    var audio = document.getElementById("bgm");
    if (!btn || !audio) return;
    btn.addEventListener("click", function () {
      var playing = btn.classList.toggle("playing");
      btn.setAttribute("aria-pressed", playing ? "true" : "false");
      if (playing) {
        audio.play().catch(function () { /* mp3 还没上传则静默忽略 */ });
      } else {
        audio.pause();
      }
    });
  })();

  /* ---------- 2.9 工作页飘叶 / 生活页飘花瓣（同一机制） ---------- */
  (function () {
    var petalBox = document.querySelector(".petals");
    var box = document.querySelector(".leaves") || petalBox;
    if (!box) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var isPetal = !!petalBox;                                    // 生活页飘花瓣，工作页飘叶
    var childClass = isPetal ? "petal" : "leaf";
    var glyphs = isPetal ? ["🌸", "🌼", "🌾", "🍃"] : ["🍃", "🌿"];
    var N = 16;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < N; i++) {
      var s = document.createElement("span");
      s.className = childClass;
      s.textContent = glyphs[(Math.random() * glyphs.length) | 0];
      var dur = 10 + Math.random() * 12;                         // 10-22s（飘得慢）
      s.style.left = (Math.random() * 100).toFixed(2) + "%";
      s.style.fontSize = (14 + Math.random() * 16).toFixed(0) + "px";
      s.style.opacity = "0.85";
      s.style.setProperty("--sway", ((Math.random() - 0.5) * 220).toFixed(0) + "px");
      s.style.animationDuration = dur.toFixed(2) + "s";
      s.style.animationDelay = (-Math.random() * dur).toFixed(2) + "s";
      frag.appendChild(s);
    }
    box.appendChild(frag);
  })();

  /* ---------- 2.10 deck（工作 / 生活页）：整屏吸附 + 点击弹性翻页 ---------- */
  (function () {
    var hero = document.querySelector(".w-hero, .l-hero");
    if (!hero) return;                                  // 仅 deck 页（工作 / 生活）
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var docEl = document.documentElement;

    // 仅本页开启整屏吸附
    if (!reduced) docEl.style.scrollSnapType = "y mandatory";

    // 回弹缓动（easeOutBack：结尾轻微越过再归位 → "弹"上来）
    function easeOutBack(t) {
      var c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    function springTo(targetY, dur) {
      var startY = window.scrollY, dist = targetY - startY, t0 = null;
      var prevSnap = docEl.style.scrollSnapType;
      var prevBeh = docEl.style.scrollBehavior;
      docEl.style.scrollSnapType = "none";            // 动画期间关闭吸附，避免打架
      docEl.style.scrollBehavior = "auto";            // 关掉 CSS smooth，否则每帧 scrollTo 自带平滑会打架卡顿
      function step(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        window.scrollTo(0, Math.round(startY + dist * easeOutBack(p)));
        if (p < 1) requestAnimationFrame(step);
        else { docEl.style.scrollSnapType = prevSnap; docEl.style.scrollBehavior = prevBeh; }  // 还原
      }
      requestAnimationFrame(step);
    }

    function goTo(target) {
      if (!target) return;
      var y = Math.round(target.getBoundingClientRect().top + window.scrollY);
      if (reduced) { window.scrollTo(0, y); return; }
      springTo(y, 780);
    }

    // 向下指引 + 左侧轴：点击 → 弹性滚到对应屏
    // 为每个内容屏（除最后一屏）生成"只箭头"指引，点击弹到下一屏
    var screens = Array.prototype.slice.call(document.querySelectorAll(".w-hero, .w-section, .l-hero, .l-section"));
    for (var i = 1; i < screens.length - 1; i++) {       // 跳过 Hero(已有带字指引) 与最后一屏
      var next = screens[i + 1];
      if (!next.id) continue;
      var cue = document.createElement("a");
      cue.className = "scroll-cue cue-arrow";
      cue.href = "#" + next.id;
      cue.setAttribute("aria-label", "下一屏");
      cue.innerHTML = '<svg class="cue-svg" viewBox="0 0 28 28" aria-hidden="true"><path d="M6 10l8 8 8-8"/></svg>';
      screens[i].appendChild(cue);
    }

    // 指引 + 左侧轴：事件委托 → 弹性滚动（兼容动态生成的指引）
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest(".scroll-cue, .w-rail a, .l-rail a");
      if (!a) return;
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) !== "#") return;
      var t = document.getElementById(href.slice(1));
      if (t) { e.preventDefault(); goTo(t); }
    });

    // 每次进入板块 → 卡片重新弹入（离开则瞬间复位，回来再弹）
    if (!reduced && "IntersectionObserver" in window) {
      var cards = document.querySelectorAll(".w-card.reveal, .l-card.reveal");
      var reObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          e.target.classList.toggle("in", e.isIntersecting);
        });
      }, { threshold: 0.35 });
      Array.prototype.forEach.call(cards, function (c) { reObs.observe(c); });
    }
  })();

  /* ---------- 2.11 生活页：彩蛋互动（名牌翻面 / 戳我喷爱心 / No.1 撒花） ---------- */
  (function () {
    if (!document.querySelector(".page-life")) return;   // 仅生活页
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ENFJ 名牌翻面
    var flip = document.querySelector("[data-flip]");
    if (flip) flip.addEventListener("click", function () { this.classList.toggle("flipped"); });

    // 点击迸发小元素（爱心 / 撒花）
    function burst(x, y, set) {
      if (reduce) return;
      for (var i = 0; i < 14; i++) {
        var s = document.createElement("span");
        s.className = "spark";
        s.textContent = set[(Math.random() * set.length) | 0];
        s.style.left = x + "px";
        s.style.top = y + "px";
        s.style.setProperty("--dx", (Math.random() * 180 - 90).toFixed(0) + "px");
        s.style.setProperty("--dy", (-(60 + Math.random() * 140)).toFixed(0) + "px");
        s.style.fontSize = (14 + Math.random() * 14).toFixed(0) + "px";
        document.body.appendChild(s);
        (function (el) { window.setTimeout(function () { el.remove(); }, 1100); })(s);
      }
    }
    document.querySelectorAll("[data-poke]").forEach(function (el) {
      el.addEventListener("click", function (e) { burst(e.clientX, e.clientY, ["❤️", "💛", "🐾", "✨"]); });
    });
    var rank1 = document.querySelector(".rank-1");
    if (rank1) rank1.addEventListener("click", function (e) { burst(e.clientX, e.clientY, ["🎉", "😋", "⭐", "🍜"]); });
  })();
})();
