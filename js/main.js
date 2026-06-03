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

      var n = 14;
      for (var i = 0; i < n; i++) {
        var d = document.createElement("span");
        d.className = "droplet";
        var ang = (Math.PI * 2 * i) / n + Math.random() * 0.5;
        var dist = 38 + Math.random() * 54;
        var sz = 5 + Math.random() * 8;
        d.style.left = cx + "px";
        d.style.top = cy + "px";
        d.style.width = sz + "px";
        d.style.height = sz + "px";
        d.style.setProperty("--dx", Math.cos(ang) * dist + "px");
        d.style.setProperty("--dy", Math.sin(ang) * dist + "px");
        layer.appendChild(d);
      }
      window.setTimeout(function () { layer.remove(); }, 700);
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
})();
