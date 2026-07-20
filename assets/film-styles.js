(function () {
    "use strict";

    var defaultApplied = false;
    var applying = false;
    var categoryIds = ["narrative", "visual", "shooting", "era-region", "commercial", "extended"];
    var categoryMeta = [
        { id: "narrative", match: "叙事风格", index: "01", label: "叙事风格", code: "NAR", count: "12" },
        { id: "visual", match: "视觉美学", index: "02", label: "视觉美学", code: "VIS", count: "13" },
        { id: "shooting", match: "拍摄风格", index: "03", label: "拍摄风格", code: "CAM", count: "12" },
        { id: "era-region", match: "时代地域风格", index: "04", label: "时代地域", code: "ERA", count: "09" },
        { id: "commercial", match: "商业媒介风格", index: "05", label: "商业媒介", code: "COM", count: "14" },
        { id: "extended", match: "扩展风格", index: "06", label: "扩展风格", code: "EXT", count: "04" }
    ];

    function findMenu() {
        var chats = document.querySelectorAll(".ChatDOM");
        for (var i = 0; i < chats.length; i += 1) {
            if (chats[i].textContent.indexOf("你想寻找哪种影视风格？") !== -1) return chats[i];
        }
        return null;
    }

    function categoryFromHash() {
        var prefix = "#film-style-";
        if (window.location.hash.indexOf(prefix) !== 0) return null;
        var id = window.location.hash.slice(prefix.length);
        return categoryIds.indexOf(id) === -1 ? null : id;
    }

    function applyDefaultCategory() {
        if (defaultApplied || applying || !window.CMSData || typeof window.CMSData.ready !== "function") return;
        applying = true;
        window.CMSData.ready().then(function () {
            if (!defaultApplied) {
                defaultApplied = true;
                window.CMSData.filter(categoryFromHash() || "narrative");
            }
        }).finally(function () {
            applying = false;
        });
    }

    function currentProjectCategory() {
        var slug = window.location.pathname.split("/").filter(Boolean).pop() || "";
        if (window.CMS_DATA && Array.isArray(window.CMS_DATA.projects)) {
            var project = window.CMS_DATA.projects.find(function (item) { return item.perma === slug; });
            if (project && categoryIds.indexOf(project.tags) !== -1) return project.tags;
        }
        for (var i = 0; i < categoryIds.length; i += 1) {
            if (slug.indexOf("film-" + categoryIds[i] + "-") === 0) return categoryIds[i];
        }
        return "narrative";
    }

    function enhanceDetailClose() {
        var links = document.querySelectorAll(".ChatDOM a");
        var close = null;
        var wrappers = document.querySelectorAll(".ChatDOM .wrapper");
        for (var w = 0; w < wrappers.length; w += 1) wrappers[w].classList.remove("zwl-detail-back-ready");
        for (var i = 0; i < links.length; i += 1) {
            if (/close/i.test(links[i].textContent || "")) { close = links[i]; break; }
        }
        if (!close) return;
        var wrapper = close.closest(".wrapper");
        if (wrapper) wrapper.classList.add("zwl-detail-back-ready");
        if (close.getAttribute("data-film-back-ready") === "true") return;
        var category = currentProjectCategory();
        close.setAttribute("data-film-back-ready", "true");
        // Keep the original site's native close action. A URL here would navigate
        // away from the current card position instead of revealing its parent layer.
        close.removeAttribute("href");
        close.removeAttribute("target");
        close.removeAttribute("role");
        close.setAttribute("aria-label", "返回" + category + "作品卡片层");
    }

    function enhanceMenuIndex(wrapper) {
        if (!wrapper) return;
        var messages = wrapper.querySelector(".messages");
        if (!messages) return;
        var links = messages.querySelectorAll("a.home");
        for (var i = 0; i < links.length; i += 1) {
            var link = links[i];
            if (link.getAttribute("data-film-index-ready") === "true") continue;
            var original = (link.textContent || "").trim();
            var meta = null;
            for (var m = 0; m < categoryMeta.length; m += 1) {
                if (original.indexOf(categoryMeta[m].match) !== -1) {
                    meta = categoryMeta[m];
                    break;
                }
            }
            if (!meta) continue;
            link.setAttribute("data-film-index-ready", "true");
            link.setAttribute("data-film-category", meta.id);
            link.setAttribute("aria-label", meta.label + "，" + meta.count + " 个风格");
            link.addEventListener("click", function () {
                setActiveMenuCategory(wrapper, this.getAttribute("data-film-category"));
            });
        }
        setActiveMenuCategory(wrapper, categoryFromHash() || "narrative");
    }

    function setActiveMenuCategory(wrapper, category) {
        if (!wrapper || categoryIds.indexOf(category) === -1) return;
        var links = wrapper.querySelectorAll("[data-film-category]");
        for (var i = 0; i < links.length; i += 1) {
            links[i].classList.toggle("active", links[i].getAttribute("data-film-category") === category);
        }
    }

    function sync() {
        enhanceDetailClose();
        var menu = findMenu();
        if (!menu) return;
        var wrapper = menu.querySelector(".wrapper");
        if (wrapper) {
            wrapper.classList.add("zwl-film-menu-ready");
            enhanceMenuIndex(wrapper);
        }
        applyDefaultCategory();
    }

    window.addEventListener("zwl:intro-closed", sync);
    window.addEventListener("hashchange", function () {
        var category = categoryFromHash();
        if (category && window.CMSData && typeof window.CMSData.filter === "function") window.CMSData.filter(category);
        if (category) setActiveMenuCategory(document.querySelector(".wrapper.zwl-film-menu-ready"), category);
    });
    var observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    sync();
}());
