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

  var mobilePanel = document.querySelector(".site-mobile-panel");
  if (mobilePanel && !mobilePanel.querySelector(".site-mobile-group")) {
    var mobileLinks = Array.prototype.slice.call(mobilePanel.querySelectorAll(":scope > a"));
    var commercialHrefs = ["/assurance", "/pilot", "/demo", "/os", "mailto:hasan@kahrelum.com"];
    var publicHrefs = ["/forecasting", "/investigations", "/election-lab", "/digital-id", "/sports", "/insights"];
    function makeMobileGroup(label, className, hrefs) {
      var group = document.createElement("div");
      group.className = "site-mobile-group " + className;
      var title = document.createElement("p");
      title.className = "site-mobile-group-label";
      title.textContent = label;
      group.appendChild(title);
      hrefs.forEach(function (href) {
        var link = mobileLinks.find(function (item) { return item.getAttribute("href") === href; });
        if (link) group.appendChild(link);
      });
      return group;
    }
    var commercialGroup = makeMobileGroup("Commercial Assurance", "site-mobile-group-commercial", commercialHrefs);
    var publicGroup = makeMobileGroup("Public Intelligence Desks", "site-mobile-group-public", publicHrefs);
    mobileLinks.forEach(function (link) {
      if (link.parentNode === mobilePanel) publicGroup.appendChild(link);
    });
    mobilePanel.replaceChildren(commercialGroup, publicGroup);
  }

  var sharedFooter = document.querySelector("footer.site-footer");
  if (sharedFooter) {
    var footerInner = sharedFooter.querySelector(".site-footer-inner") || sharedFooter;
    Array.prototype.forEach.call(document.querySelectorAll("body footer:not(.site-footer)"), function (oldFooter) {
      var context = document.createElement("div");
      context.className = "site-footer-context";
      while (oldFooter.firstChild) context.appendChild(oldFooter.firstChild);
      if (context.textContent.trim()) footerInner.insertBefore(context, footerInner.firstChild);
      oldFooter.remove();
    });
    if (!footerInner.textContent.includes("© 2026 KAHRELUM")) {
      var copyright = document.createElement("p");
      copyright.className = "site-footer-copyright";
      copyright.textContent = "© 2026 KAHRELUM";
      footerInner.appendChild(copyright);
    }
  }
})();
// Optional analytics: no Google requests before affirmative consent.
(function () {
  "use strict";
  var id = "G-73RQ7RNKG4", key = "kahrelum-analytics-consent", enabled = false;
  if (navigator.globalPrivacyControl || navigator.doNotTrack === "1") return;
  var choice = "";
  try { choice = localStorage.getItem(key) || ""; } catch (_) {}
  function start() {
    if (enabled) return;
    enabled = true;
    window.dataLayer = window.dataLayer || [];
    function tag() { window.dataLayer.push(arguments); }
    tag("consent", "default", {analytics_storage:"granted", ad_storage:"denied", ad_user_data:"denied", ad_personalization:"denied"});
    tag("set", "page_location", location.origin + location.pathname);
    tag("set", "page_title", "KAHRELUM");
    tag("set", "allow_google_signals", false);
    tag("set", "allow_ad_personalization_signals", false);
    tag("js", new Date());
    var ref = "";
    try { ref = document.referrer ? new URL(document.referrer).origin + "/" : ""; } catch (_) {}
    tag("set", "page_referrer", ref);
    tag("config", id, {
      page_location: location.origin + location.pathname,
      page_referrer: ref, page_title: "KAHRELUM",
      allow_google_signals: false, allow_ad_personalization_signals: false,
      cookie_expires: 2592000
    });
    var script = document.createElement("script");
    script.async = true; script.src = "https://www.googletagmanager.com/gtag/js?id=" + id;
    document.head.appendChild(script);
    document.addEventListener("click", function (event) {
      if (!enabled) return;
      // These describe interest only. Copying text is not sending a lead.
      var button = event.target.closest && event.target.closest("button");
      if (button && button.id === "copyInquiry") {
        tag("event", "pilot_inquiry_copy_attempt", {page_location:location.origin + location.pathname});
      }
      var a = event.target.closest && event.target.closest("a[href]");
      if (!a) return;
      var href = a.getAttribute("href"), name;
      if (/^mailto:/i.test(href)) name = "contact_click";
      else {
        var target;
        try { target = new URL(href, location.href); } catch (_) { return; }
        if (target.origin !== location.origin) return;
        if (/^\/pilot(?:\.html)?\/?$/.test(target.pathname)) name = "pilot_cta_click";
        if (/fit check/i.test(a.textContent) && name) name = "fit_check_cta_click";
      }
      if (name) tag("event", name, {page_location:location.origin + location.pathname});
    });
    document.addEventListener("submit", function (event) {
      if (!enabled || !event.target || event.target.id !== "pilotInquiry") return;
      // The form only prepares an email-app draft. Do not emit a lead or sale conversion.
      tag("event", "pilot_inquiry_email_draft_request", {page_location:location.origin + location.pathname});
    });
  }
  var box = document.createElement("aside");
  box.setAttribute("aria-label", "Analytics privacy choices");
  box.style.cssText = "position:fixed;bottom:12px;left:12px;max-width:420px;padding:12px;background:#fff;color:#111;border:1px solid #777;z-index:9999;font:14px sans-serif";
  function render() {
    box.replaceChildren();
    if (choice) {
      var settings = document.createElement("button"); settings.textContent = "Analytics preferences";
      settings.onclick = function () { choice = ""; render(); }; box.appendChild(settings); return;
    }
    var text = document.createElement("p");
    text.textContent = "Allow optional Google Analytics cookies to measure page visits, referral sites and service/contact clicks? Google receives browser and connection data. No form contents or email addresses are sent. You can decline or withdraw at any time.";
    box.appendChild(text);
    ["Allow analytics", "Decline analytics"].forEach(function (label, index) {
      var button = document.createElement("button"); button.textContent = label;
      button.onclick = function () {
        choice = index === 0 ? "yes" : "no";
        try { localStorage.setItem(key, choice); } catch (_) {}
        if (index === 0) start();
        else if (enabled) {
          window["ga-disable-" + id] = true; enabled = false;
          document.cookie.split(";").forEach(function (c) {
            var n = c.split("=")[0].trim();
            if (/^_ga(?:_|$)/.test(n)) ["", "; domain=" + location.hostname, "; domain=.kahrelum.com"].forEach(function (d) { document.cookie = n + "=; Max-Age=0; path=/" + d; });
          });
          location.reload();
        }
        render();
      }; box.appendChild(button);
    });
  }
  render(); document.body.appendChild(box);
  if (choice === "yes") start();
})();
