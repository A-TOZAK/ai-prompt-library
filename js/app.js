/* ============================================================
   AI プロンプトライブラリ — アプリ本体
   コレクション切替（しごと用／授業・教科用）
   検索 / フィルタ / コピー
   ============================================================ */
(function () {
  "use strict";

  const state = {
    collection: "work",  // "work" | "school"
    query: "",
    tool: "all",         // workコレクション用
    category: "all",     // workコレクション用
    school: "all",       // schoolコレクション用
    subject: "all"       // schoolコレクション用
  };

  const $search = document.getElementById("searchInput");
  const $clear = document.getElementById("clearSearch");
  const $collectionToggle = document.getElementById("collectionToggle");
  const $toolTabs = document.getElementById("toolTabs");
  const $categoryChips = document.getElementById("categoryChips");
  const $grid = document.getElementById("cardGrid");
  const $empty = document.getElementById("emptyState");
  const $count = document.getElementById("resultCount");
  const $toast = document.getElementById("toast");
  const $editPanel = document.getElementById("editPanel");
  const $editOverlay = document.getElementById("editOverlay");
  const $editTextarea = document.getElementById("editTextarea");
  const $editPanelClose = document.getElementById("editPanelClose");
  const $editCopyBtn = document.getElementById("editCopyBtn");

  /* ---------- ユーティリティ ---------- */

  function escapeHtml(s) {
    return (s || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function normalize(s) {
    return (s || "").toString().toLowerCase().normalize("NFKC");
  }

  function currentData() {
    return state.collection === "work" ? PROMPTS : SCHOOL_PROMPTS;
  }

  /* ---------- コレクション切替 ---------- */

  function buildCollectionToggle() {
    $collectionToggle.querySelectorAll(".seg").forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.collection === state.collection);
    });
  }

  $collectionToggle.querySelectorAll(".seg").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.collection = btn.dataset.collection;
      buildCollectionToggle();
      buildFilters();
      render();
    });
  });

  /* ---------- フィルタUIの生成 ---------- */

  function buildFilters() {
    if (state.collection === "work") {
      buildToolTabs();
      buildCategoryChips();
      $search.placeholder = "キーワードで検索（例：授業 / 占い / アンケート / note）";
    } else {
      buildSchoolTabs();
      buildSubjectChips();
      $search.placeholder = "キーワードで検索（例：ルーブリック / 発問 / 道徳 / 面接）";
    }
  }

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

  function buildSchoolTabs() {
    const tabs = [{ id: "all", label: "すべて" }].concat(
      Object.keys(SCHOOLS).map(function (id) {
        return { id: id, label: SCHOOLS[id].label };
      })
    );
    $toolTabs.innerHTML = "";
    tabs.forEach(function (t) {
      const n = t.id === "all"
        ? SCHOOL_PROMPTS.length
        : SCHOOL_PROMPTS.filter(function (p) { return p.school === t.id; }).length;
      if (t.id !== "all" && n === 0) return;
      const btn = document.createElement("button");
      btn.className = "tab" + (state.school === t.id ? " active" : "");
      btn.setAttribute("role", "tab");
      btn.dataset.school = t.id;
      btn.innerHTML = escapeHtml(t.label) + ' <span class="count">' + n + "</span>";
      btn.addEventListener("click", function () {
        state.school = t.id;
        // 校種を変えたら、存在しない教科の選択は解除
        const pool = t.id === "all" ? SCHOOL_PROMPTS
          : SCHOOL_PROMPTS.filter(function (p) { return p.school === t.id; });
        if (state.subject !== "all" &&
            !pool.some(function (p) { return p.subject === state.subject; })) {
          state.subject = "all";
        }
        buildSchoolTabs();
        buildSubjectChips();
        render();
      });
      $toolTabs.appendChild(btn);
    });
  }

  function buildSubjectChips() {
    const pool = state.school === "all" ? SCHOOL_PROMPTS
      : SCHOOL_PROMPTS.filter(function (p) { return p.school === state.school; });
    const subjects = [];
    pool.forEach(function (p) {
      if (subjects.indexOf(p.subject) === -1) subjects.push(p.subject);
    });
    $categoryChips.innerHTML = "";
    ["all"].concat(subjects).forEach(function (s) {
      const chip = document.createElement("button");
      chip.className = "chip" + (state.subject === s ? " active" : "");
      chip.dataset.subject = s;
      chip.textContent = s === "all" ? "全教科" : s;
      chip.addEventListener("click", function () {
        state.subject = s;
        buildSubjectChips();
        render();
      });
      $categoryChips.appendChild(chip);
    });
  }

  /* ---------- 検索・絞り込み ---------- */

  function matchesQuery(p) {
    if (!state.query) return true;
    const toolLabel = state.collection === "work"
      ? (TOOLS[p.tool] ? TOOLS[p.tool].label : "")
      : (SCHOOLS[p.school] ? SCHOOLS[p.school].label : "");
    const hay = normalize([
      p.title, p.description, p.prompt,
      p.category || "", p.subject || "",
      (p.tags || []).join(" "), toolLabel
    ].join(" "));
    return normalize(state.query).split(/\s+/).filter(Boolean).every(function (term) {
      return hay.indexOf(term) !== -1;
    });
  }

  function matches(p) {
    if (state.collection === "work") {
      if (state.tool !== "all" && p.tool !== state.tool) return false;
      if (state.category !== "all" && p.category !== state.category) return false;
    } else {
      if (state.school !== "all" && p.school !== state.school) return false;
      if (state.subject !== "all" && p.subject !== state.subject) return false;
    }
    return matchesQuery(p);
  }

  /* ---------- 描画 ---------- */

  function render() {
    const hits = currentData().filter(matches);
    $grid.innerHTML = "";
    hits.forEach(function (p) {
      const isWork = state.collection === "work";
      const badge = isWork ? (TOOLS[p.tool] || TOOLS.common) : SCHOOLS[p.school];
      const subLabel = isWork ? p.category : p.subject;
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML =
        '<div class="card-head">' +
          '<span class="tool-badge" style="background:' + badge.color + '">' + escapeHtml(badge.label) + "</span>" +
          '<span class="category-label">' + escapeHtml(subLabel) + "</span>" +
        "</div>" +
        '<h2 class="card-title">' + escapeHtml(p.title) + "</h2>" +
        '<p class="card-desc">' + escapeHtml(p.description) + "</p>" +
        '<div class="prompt-box"><pre class="prompt-text">' + escapeHtml(p.prompt) + "</pre></div>" +
        '<div class="card-actions">' +
          '<button class="copy-btn">📋 コピー</button>' +
          '<button class="edit-btn">✏️ 編集して使う</button>' +
        '</div>' +
        '<div class="card-tags">' +
          (p.tags || []).map(function (t) {
            return '<span class="tag" data-tag="' + escapeHtml(t) + '">#' + escapeHtml(t) + "</span>";
          }).join("") +
        "</div>";

      card.querySelector(".copy-btn").addEventListener("click", function () {
        copyText(p.prompt, this);
      });
      card.querySelector(".edit-btn").addEventListener("click", function () {
        openEditPanel(p.prompt);
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

  /* ---------- 編集パネル ---------- */

  function openEditPanel(promptText) {
    $editTextarea.value = promptText;
    $editPanel.classList.add("open");
    $editOverlay.classList.add("open");
    setTimeout(function () { $editTextarea.focus(); }, 320);
  }

  function closeEditPanel() {
    $editPanel.classList.remove("open");
    $editOverlay.classList.remove("open");
  }

  $editPanelClose.addEventListener("click", closeEditPanel);

  $editOverlay.addEventListener("click", function (e) {
    if (e.target === $editOverlay) closeEditPanel();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && $editOverlay.classList.contains("open")) {
      closeEditPanel();
    }
  });

  $editCopyBtn.addEventListener("click", function () {
    var text = $editTextarea.value;
    var btn = this;
    function done() {
      btn.classList.add("copied");
      btn.textContent = "コピーしました";
      showToast("クリップボードにコピーしました");
      setTimeout(function () {
        btn.classList.remove("copied");
        btn.textContent = "コピー";
      }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text); done(); });
    } else {
      fallbackCopy(text); done();
    }
  });

  document.querySelectorAll(".ai-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = $editTextarea.value;
      var name = btn.dataset.name;
      var url  = btn.dataset.url;
      function openAI() {
        window.open(url, "_blank", "noopener");
        showToast("コピーして " + name + " を開きました — そのまま貼り付けてください");
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(openAI).catch(function () {
          fallbackCopy(text); openAI();
        });
      } else {
        fallbackCopy(text); openAI();
      }
    });
  });

  /* ---------- 起動 ---------- */
  buildCollectionToggle();
  buildFilters();
  render();
})();
