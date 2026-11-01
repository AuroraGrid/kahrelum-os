import { h, empty, formatTime } from "./views.mjs";
let youtubePromise;
function youtube() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!youtubePromise)
    youtubePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(Error("Player unavailable")),
        10000,
      );
      window.onYouTubeIframeAPIReady = () => {
        clearTimeout(timeout);
        resolve(window.YT);
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.onerror = () => {
        clearTimeout(timeout);
        reject(Error("Player unavailable"));
      };
      document.head.append(script);
    });
  return youtubePromise;
}
export function renderHighlights(container, groups) {
  const clips = groups.flatMap((g) => [g.primary, ...g.alternatives]);
  let disposed = false;
  const players = [],
    timers = [];
  const noVideos = () => {
    if (!container.querySelector(".video-card"))
      container.innerHTML = empty("No playable highlights available");
  };
  if (!clips.length) {
    container.innerHTML = empty("No playable highlights available");
    return () => {};
  }
  container.innerHTML =
    "<h2>Game highlights</h2>" +
    clips
      .map(
        (c, i) =>
          `<article class="video-card" data-clip="${i}"><h3>${h(c.description)}</h3><p class="video-meta">${h(c.source)} · ${h(c.publisher)} · ${h(formatTime(c.publishedAt))}${c.angle ? " · " + h(c.angle) : ""}</p><div class="video-stage"><button data-play="${i}">Play highlight</button></div></article>`,
      )
      .join("");
  const play = async (event) => {
    const button = event.target.closest("[data-play]");
    if (!button) return;
    const i = Number(button.dataset.play),
      c = clips[i],
      card = button.closest(".video-card"),
      stage = card.querySelector(".video-stage");
    button.disabled = true;
    button.textContent = "Loading player…";
    let player;
    const remove = () => {
      try {
        player?.destroy();
      } catch {}
      card.remove();
      noVideos();
    };
    try {
      const YT = await youtube();
      if (disposed) return;
      const mount = document.createElement("div");
      stage.replaceChildren(mount);
      player = new YT.Player(mount, {
        host: "https://www.youtube-nocookie.com",
        videoId: c.videoId,
        playerVars: { playsinline: 1, controls: 1, origin: location.origin },
        events: { onReady: () => player.playVideo(), onError: remove },
      });
      players.push(player);
      let firstTime = null,
        advanced = false;
      const deadline = Date.now() + 20000;
      const timer = setInterval(() => {
        if (disposed || !card.isConnected) {
          clearInterval(timer);
          return;
        }
        const t = player.getCurrentTime?.();
        if (Number.isFinite(t)) {
          if (firstTime === null) firstTime = t;
          if (t - firstTime >= 1) advanced = true;
        }
        if (Date.now() > deadline && !advanced) {
          remove();
          clearInterval(timer);
        }
      }, 500);
      timers.push(timer);
    } catch {
      if (!disposed) remove();
    }
  };
  container.addEventListener("click", play);
  return () => {
    disposed = true;
    container.removeEventListener("click", play);
    timers.forEach(clearInterval);
    players.forEach((p) => {
      try {
        p.destroy();
      } catch {}
    });
  };
}
