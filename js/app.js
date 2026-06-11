/* ============================================================
   AI プロンプトライブラリ — アプリ本体
   検索 / ツールタブ / カテゴリチップ / コピー
   ============================================================ */
(function () {
  "use strict";

  const state = {
    query: "",
    tool: "all",
    category: "all"
  };

  const $search = document.getElementById("searchInput");
  const $clear = document.getElementById("clearSearch");
  const $toolTabs = document.getElementById("toolTabs");
  const $categoryChips = document.getElementById("categoryChips");
  const $grid = document.getElementById("cardGrid");
  const $empty = document.getElementById("emptyState");
  const $count = document.getElementById("resultCount");
  const $toast = document.getElementById("toast");

  /* ---------- フィルタUIの生成 ---------- */

  function buildToolTabs() {
    const tabs = [{ id: "all", label: "すべて" }].concat(
      Object.keys(TOOLS).map(function (id) {
        return { id: id, label: TOOLS[id].label };
      })
    );
    $toolTabs.innerHTML = "";
    tabs.forEach(function (t) {
      const n = t.id === "all"
        ? PROMPTS.length
        : PROMPTS.filter(function (p) { return p.tool === t.id; }).length;
      if (t.id !== "all" && n === 0) return;
      const btn = document.createElement("button");
      btn.className = "tab" + (state.tool === t.id ? " active" : "");
      btn.setAttribute("role", "tab");
      btn.dataset.tool = t.id;
      btn.innerHTML = escapeHtml(t.label) + ' <span class="count">' + n + "</span>";
      btn.addEventListener("click", function () {
        state.tool = t.id;
        buildToolTabs();
        render();
      });
      $toolTabs.appendChild(btn);
    });
  }

  function buildCategoryChips() {
    const cats = ["all"].concat(CATEGORIES.filter(function (c) {
      return PROMPTS.some(function (p) { return p.category === c; });
    }));
    // データ内にだけ存在する新カテゴリも拾う
    PROMPTS.forEach(function (p) {
      if (cats.indexOf(p.category) === -1) cats.push(p.category);
    });
    $categoryChips.innerHTML = "";
    cats.forEach(function (c) {
      const chip = document.createElement("button");
      chip.className = "chip" + (state.category === c ? " active" : "");
      chip.dataset.category = c;
      chip.textContent = c === "all" ? "全カテゴリ" : c;
      chip.addEventListener("click", function () {
        state.category = c;
        buildCategoryChips();
        render();
      });
      $categoryChips.appendChild(chip);
    });
  }

  /* ---------- 検索 ---------- */

  function normalize(s) {
    return (s || "").toString().toLowerCase().normalize("NFKC");
  }

  function matches(p) {
    if (state.tool !== "all" && p.tool !== state.tool) return false;
    if (state.category !== "all" && p.category !== state.category) return false;
    if (!state.query) return true;
    const hay = normalize(
      [p.title, p.description, p.prompt, p.category, (p.tags || []).join(" "), TOOLS[p.tool].label].join(" ")
    );
    // スペース区切りはAND検索
    return normalize(state.query).split(/\s+/).filter(Boolean).every(function (term) {
      return hay.indexOf(term) !== -1;
    });
  }

  /* ---------- 描画 ---------- */

  function escapeHtml(s) {
    return (s || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function render() {
    const hits = PROMPTS.filter(matches);
    $grid.innerHTML = "";
    hits.forEach(function (p) {
      const tool = TOOLS[p.tool] || TOOLS.common;
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML =
        '<div class="card-head">' +
          '<span class="tool-badge" style="background:' + tool.color + '">' + escapeHtml(tool.label) + "</span>" +
          '<span class="category-label">' + escapeHtml(p.category) + "</span>" +
        "</div>" +
        '<h2 class="card-title">' + escapeHtml(p.title) + "</h2>" +
        '<p class="card-desc">' + escapeHtml(p.description) + "</p>" +
        '<div class="prompt-box"><pre class="prompt-text">' + escapeHtml(p.prompt) + "</pre></div>" +
        '<button class="copy-btn">📋 コピーする</button>' +
        '<div class="card-tags">' +
          (p.tags || []).map(function (t) {
            return '<span class="tag" data-tag="' + escapeHtml(t) + '">#' + escapeHtml(t) + "</span>";
          }).join("") +
        "</div>";

      card.querySelector(".copy-btn").addEventListener("click", function () {
        copyText(p.prompt, this);
      });
      card.querySelectorAll(".tag").forEach(function (el) {
        el.addEventListener("click", function () {
          $search.value = el.dataset.tag;
          state.query = el.dataset.tag;
          $clear.hidden = false;
          render();
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      });
      $grid.appendChild(card);
    });

    $empty.hidden = hits.length !== 0;
    $count.textContent = hits.length + " 件のプロンプト";
  }

  /* ---------- コピー ---------- */

  function copyText(text, btn) {
    function done() {
      btn.classList.add("copied");
      btn.textContent = "✅ コピーしました！";
      showToast("クリップボードにコピーしました");
      setTimeout(function () {
        btn.classList.remove("copied");
        btn.textContent = "📋 コピーする";
      }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        fallbackCopy(text); done();
      });
    } else {
      fallbackCopy(text); done();
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }

  let toastTimer = null;
  function showToast(msg) {
    $toast.textContent = msg;
    $toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      $toast.classList.remove("show");
    }, 1800);
  }

  /* ---------- イベント ---------- */

  $search.addEventListener("input", function () {
    state.query = $search.value.trim();
    $clear.hidden = state.query === "";
    render();
  });

  $clear.addEventListener("click", function () {
    $search.value = "";
    state.query = "";
    $clear.hidden = true;
    $search.focus();
    render();
  });

  // "/" キーで検索にフォーカス
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement !== $search) {
      e.preventDefault();
      $search.focus();
    }
  });

  /* ---------- 起動 ---------- */
  buildToolTabs();
  buildCategoryChips();
  render();
})();
