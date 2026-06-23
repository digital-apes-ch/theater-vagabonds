/**
 * Bildergalerie-Komponente
 * -------------------------
 * Selbst-initialisierend über ein Container-Element mit [data-gallery].
 * Konfiguration via data-Attribute:
 *   data-count : Anzahl Bilder (1..N)
 *   data-src   : Pfad-Präfix vor der Nummer (z. B. "source/Carussell-Top/TVT_2026_")
 *   data-ext   : Dateiendung (z. B. ".jpg")
 *   data-alt   : alt-Vorlage, "{n}" wird durch die Bildnummer ersetzt
 *
 * Zwei Darstellungen:
 *   - Mosaik (>= 760px): Foto-Wand, einzelne Kacheln drehen sich periodisch
 *     um die Y-Achse und tauschen dabei das Bild aus.
 *   - Peek   (< 760px):  Coverflow, mittleres Bild gross/hervorgehoben,
 *     Nachbarn schauen hervor, wischbar.
 * Klick auf ein Bild öffnet eine Lightbox (Tastatur: ←/→/Esc).
 */
(function () {
  "use strict";

  const container = document.querySelector("[data-gallery]");
  if (!container) return;

  const COUNT = parseInt(container.dataset.count || "0", 10);
  const SRC = container.dataset.src || "";
  const EXT = container.dataset.ext || ".jpg";
  const ALT_TPL = container.dataset.alt || "Foto {n}";
  if (!COUNT) return;

  const srcOf = (n) => `${SRC}${n}${EXT}`;
  const altOf = (n) => ALT_TPL.replace("{n}", n);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Breakpoints
  const MOSAIC_MIN = 760;
  const getMode = () => (window.innerWidth >= MOSAIC_MIN ? "mosaic" : "peek");
  const mosaicCols = () => (window.innerWidth >= 1100 ? 4 : 3);
  const MOSAIC_ROWS = 3;

  // ---- Grundgerüst aufbauen ----
  container.classList.add("gallery");
  container.innerHTML = "";

  const prevBtn = makeNav("prev", "Vorheriges Bild", "‹");
  const nextBtn = makeNav("next", "Nächstes Bild", "›");
  const viewport = document.createElement("div");
  viewport.className = "gallery__viewport";
  container.append(prevBtn, viewport, nextBtn);

  const caption = document.createElement("p");
  caption.className = "gallery__caption";
  caption.setAttribute("aria-live", "polite");
  container.insertAdjacentElement("afterend", caption);

  function makeNav(kind, label, glyph) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `gallery__nav gallery__nav--${kind}`;
    b.setAttribute("aria-label", label);
    b.textContent = glyph;
    return b;
  }

  let mode = "";
  let flipTimer = null;
  let mosaicTiles = [];
  let mosaicPool = [];
  let peekCurrent = 0;

  // ---- Mosaik ----
  function buildMosaic() {
    stopFlips();
    mode = "mosaic";
    container.classList.remove("gallery--peek");
    container.classList.add("gallery--mosaic");
    prevBtn.hidden = true;
    nextBtn.hidden = true;

    const cols = mosaicCols();
    const tileCount = Math.min(cols * MOSAIC_ROWS, COUNT);
    viewport.className = "gallery__viewport gallery__viewport--mosaic";
    viewport.style.setProperty("--cols", cols);
    viewport.innerHTML = "";
    mosaicTiles = [];

    const order = [];
    for (let n = 1; n <= COUNT; n++) order.push(n);
    order.slice(0, tileCount).forEach((n) => {
      const tile = makeMosaicTile(n);
      mosaicTiles.push(tile);
      viewport.appendChild(tile.el);
    });
    mosaicPool = order.slice(tileCount);

    caption.textContent = `${COUNT} Fotos der Aufführung «Kuh in Therapie» 2026`;

    if (!reduceMotion && mosaicPool.length) {
      flipTimer = setInterval(flipRandomTile, 2200);
    }
  }

  function makeMosaicTile(n) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "mosaic__tile";
    el.setAttribute("aria-label", "Foto vergrössern");

    const card = document.createElement("div");
    card.className = "mosaic__card";
    const front = makeFace("front", n);
    const back = makeFace("back", n);
    card.append(front.face, back.face);
    el.appendChild(card);

    const tile = { el, card, faces: { front, back }, shown: "front", index: n };
    el.addEventListener("click", () => openLightbox(tile.index - 1));
    return tile;
  }

  function makeFace(side, n) {
    const face = document.createElement("span");
    face.className = `mosaic__face mosaic__face--${side}`;
    const img = document.createElement("img");
    img.src = srcOf(n);
    img.alt = altOf(n);
    img.loading = "lazy";
    img.decoding = "async";
    face.appendChild(img);
    return { face, img };
  }

  function flipRandomTile() {
    if (!mosaicTiles.length || !mosaicPool.length) return;
    const tile = mosaicTiles[Math.floor(Math.random() * mosaicTiles.length)];
    if (tile.busy) return;
    tile.busy = true;

    const nextN = mosaicPool.shift();
    const hidden = tile.shown === "front" ? tile.faces.back : tile.faces.front;
    hidden.img.src = srcOf(nextN);
    hidden.img.alt = altOf(nextN);

    const oldN = tile.index;
    tile.card.classList.toggle("is-flipped");
    tile.shown = tile.shown === "front" ? "back" : "front";
    tile.index = nextN;
    mosaicPool.push(oldN);

    window.setTimeout(() => { tile.busy = false; }, 850);
  }

  function stopFlips() {
    if (flipTimer) {
      clearInterval(flipTimer);
      flipTimer = null;
    }
  }

  // ---- Peek (Coverflow) ----
  function buildPeek() {
    stopFlips();
    mode = "peek";
    container.classList.remove("gallery--mosaic");
    container.classList.add("gallery--peek");
    prevBtn.hidden = false;
    nextBtn.hidden = false;

    viewport.className = "gallery__viewport gallery__viewport--peek";
    viewport.style.removeProperty("--cols");
    viewport.innerHTML = "";

    for (let n = 1; n <= COUNT; n++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "peek__tile";
      btn.setAttribute("aria-label", "Foto vergrössern");
      const img = document.createElement("img");
      img.src = srcOf(n);
      img.alt = altOf(n);
      img.loading = "lazy";
      btn.appendChild(img);
      btn.addEventListener("click", () => openLightbox(n - 1));
      viewport.appendChild(btn);
    }
    requestAnimationFrame(() => scrollPeekTo(peekCurrent, false));
  }

  function markActivePeek() {
    [...viewport.children].forEach((t, i) =>
      t.classList.toggle("is-active", i === peekCurrent)
    );
  }

  function scrollPeekTo(idx, smooth = true) {
    if (!viewport.children.length) return;
    peekCurrent = (idx + COUNT) % COUNT;
    const tile = viewport.children[peekCurrent];
    const left = tile.offsetLeft - (viewport.clientWidth - tile.clientWidth) / 2;
    viewport.scrollTo({ left, behavior: smooth ? "smooth" : "auto" });
    markActivePeek();
    caption.textContent = `${peekCurrent + 1} / ${COUNT}`;
  }

  let scrollRaf = null;
  viewport.addEventListener("scroll", () => {
    if (mode !== "peek") return;
    if (scrollRaf) cancelAnimationFrame(scrollRaf);
    scrollRaf = requestAnimationFrame(() => {
      const center = viewport.scrollLeft + viewport.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      [...viewport.children].forEach((t, i) => {
        const c = t.offsetLeft + t.clientWidth / 2;
        const d = Math.abs(c - center);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      if (best !== peekCurrent) {
        peekCurrent = best;
        markActivePeek();
        caption.textContent = `${peekCurrent + 1} / ${COUNT}`;
      }
    });
  });

  prevBtn.addEventListener("click", () => scrollPeekTo(peekCurrent - 1));
  nextBtn.addEventListener("click", () => scrollPeekTo(peekCurrent + 1));

  // ---- Lightbox ----
  const lb = buildLightbox();
  let lbIndex = 0;

  function buildLightbox() {
    const root = document.createElement("div");
    root.className = "lightbox";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Bildansicht");
    root.hidden = true;
    root.innerHTML =
      '<button class="lightbox__close" type="button" aria-label="Schliessen">✕</button>' +
      '<button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="Vorheriges Bild">‹</button>' +
      '<img class="lightbox__img" src="" alt="" />' +
      '<button class="lightbox__nav lightbox__nav--next" type="button" aria-label="Nächstes Bild">›</button>' +
      '<p class="lightbox__counter" aria-live="polite"></p>';
    document.body.appendChild(root);

    const obj = {
      root,
      img: root.querySelector(".lightbox__img"),
      counter: root.querySelector(".lightbox__counter"),
    };
    root.querySelector(".lightbox__close").addEventListener("click", closeLightbox);
    root.querySelector(".lightbox__nav--prev").addEventListener("click", () => showLightbox(lbIndex - 1));
    root.querySelector(".lightbox__nav--next").addEventListener("click", () => showLightbox(lbIndex + 1));
    root.addEventListener("click", (e) => { if (e.target === root) closeLightbox(); });
    return obj;
  }

  function showLightbox(idx) {
    lbIndex = (idx + COUNT) % COUNT;
    const n = lbIndex + 1;
    lb.img.src = srcOf(n);
    lb.img.alt = altOf(n);
    lb.counter.textContent = `${n} / ${COUNT}`;
  }

  function openLightbox(idx) {
    showLightbox(idx);
    lb.root.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lb.root.hidden = true;
    document.body.style.overflow = "";
    if (mode === "peek") scrollPeekTo(lbIndex);
  }

  document.addEventListener("keydown", (e) => {
    if (lb.root.hidden) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowLeft") showLightbox(lbIndex - 1);
    else if (e.key === "ArrowRight") showLightbox(lbIndex + 1);
  });

  // ---- Layout-Steuerung ----
  function render() {
    if (getMode() === "mosaic") buildMosaic();
    else buildPeek();
  }

  const layoutSig = () =>
    getMode() === "mosaic" ? `mosaic-${mosaicCols()}` : "peek";
  let lastSig = layoutSig();
  let resizeRaf = null;
  window.addEventListener("resize", () => {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      const sig = layoutSig();
      if (sig === lastSig) return;
      lastSig = sig;
      render();
    });
  });

  // Flips pausieren, wenn die Seite/Sektion nicht sichtbar ist (Performance)
  document.addEventListener("visibilitychange", () => {
    if (mode !== "mosaic") return;
    if (document.hidden) stopFlips();
    else if (!flipTimer && !reduceMotion && mosaicPool.length) {
      flipTimer = setInterval(flipRandomTile, 2200);
    }
  });

  render();
})();
