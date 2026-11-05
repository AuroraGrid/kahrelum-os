(function () {
  "use strict";
  var path = (location.pathname || "/").replace(/\/+$/, "") || "/";
  function isActive(href) {
    var target = href.replace(/\/$/, "") || "/";
    if (target === "/sports" && path.indexOf("/nfl/") === 0) return true;
    if (target === "/forecasting" && (path.indexOf("/election-") === 0 || path.indexOf("/israel-certified") === 0)) return true;
    return path === target || (target !== "/" && path.indexOf(target + "/") === 0);
  }
  Array.prototype.forEach.call(document.querySelectorAll(".site-header a[href]"), function (a) {
    var href = a.getAttribute("href") || "";
    if (href.charAt(0) === "/" && isActive(href)) a.setAttribute("aria-current", "page");
  });
  var labs = document.querySelector(".site-labs");
  if (labs && labs.querySelector('[aria-current="page"]')) labs.classList.add("is-active");

  Array.prototype.forEach.call(document.querySelectorAll("body header:not(.site-header)"), function (oldHeader) {
    if (oldHeader.querySelector("nav") && oldHeader.querySelector(".brand, .wordmark") &&
        !oldHeader.querySelector("[role='tablist'],button,input,select,.topbar")) {
      oldHeader.classList.add("site-local-header");
    }
  });
  document.body.classList.add("site-shell-ready");
  if (path === "/") document.body.classList.add("site-home");

  Array.prototype.forEach.call(document.querySelectorAll(".case-status"), function (el) {
    el.classList.add("status-badge");
    var text = el.textContent.trim().toUpperCase();
    if (text.indexOf("READY") >= 0) el.classList.add("status-ready");
    else if (text.indexOf("ACTIVE") >= 0) el.classList.add("status-active");
    else if (text.indexOf("OPEN") >= 0) el.classList.add("status-open");
  });
  Array.prototype.forEach.call(document.querySelectorAll(".tag"), function (el) {
    el.classList.add("status-badge");
    var text = el.textContent.trim().toLowerCase();
    if (text.indexOf("template only") >= 0) el.classList.add("status-template");
    else if (text.indexOf("operational") >= 0) el.classList.add("status-operational");
  });

  var jurisdictionStatuses = {
    "European Union": [["STATUTORY FRAMEWORK", "Member-state wallet availability requirements; national rollout varies."]],
    "United Kingdom": [["NOT ASSESSED", "The page records a prior government response and calls for dated rechecking."]],
    "Pakistan": [["NOT ASSESSED", "Credentials and digital public infrastructure are tracked individually."]],
    "Australia": [["STATUTORY FRAMEWORK", "Digital ID Act 2024 framework."], ["VOLUNTARY", "Generally voluntary, with exceptions and phased private-sector provisions."]],
    "India": [["VOLUNTARY", "Applies only to Aadhaar paperless offline eKYC; not every Aadhaar use case."]],
    "United States": [["NOT ASSESSED", "State mobile IDs and applications are tracked separately."]]
  };
  Array.prototype.forEach.call(document.querySelectorAll("h3"), function (heading) {
    var labels = jurisdictionStatuses[heading.textContent.trim()];
    var card = heading.closest(".card");
    if (!labels || !card || card.querySelector(".jurisdiction-statuses")) return;
    var group = document.createElement("div");
    group.className = "jurisdiction-statuses";
    labels.forEach(function (item) {
      var badge = document.createElement("span");
      badge.className = "status-badge " + (item[0] === "VOLUNTARY" ? "status-voluntary" : item[0] === "NOT ASSESSED" ? "status-unknown" : "status-framework");
      badge.textContent = item[0];
      badge.title = item[1];
      group.appendChild(badge);
    });
    heading.insertAdjacentElement("afterend", group);
  });

  if (path === "/sports/mlb" || path === "/sports/nhl") {
    var hero = document.querySelector(".hero, .brief-head");
    if (hero && !hero.querySelector(".status-template")) {
      var badge = document.createElement("span");
      badge.className = "status-badge status-template";
      badge.textContent = "Template only";
      hero.insertBefore(badge, hero.firstChild);
    }
  }

  function compactCards() {
    if (window.innerWidth > 768) return;
    Array.prototype.forEach.call(document.querySelectorAll(".card,.case-record,.case-stat,.offer,.metric,.boundary,.example"), function (el) {
      var cs = window.getComputedStyle(el);
      var top = parseFloat(cs.paddingTop) || 0;
      var side = parseFloat(cs.paddingLeft) || 0;
      if (top > 0) el.style.setProperty("--site-mobile-padding-block", Math.max(10, top * .78) + "px");
      if (side > 0) el.style.setProperty("--site-mobile-padding-inline", Math.max(10, side * .78) + "px");
      el.classList.add("site-density");
    });
  }
  compactCards();
  window.addEventListener("resize", compactCards, { passive: true });
})();