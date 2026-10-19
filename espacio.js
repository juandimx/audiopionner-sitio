/* ============================================================
   AudioPionner — "Ver en tu espacio"
   Abre la cámara del celular con el mueble recortado encima.
   El cliente lo mueve, cambia el tamaño y toma una foto.
   La foto se descarga sola, queda guardada en "Mis fotos" dentro
   del sitio y se puede guardar en la galería o compartir.

   Uso: VerEnTuEspacio.open({ name: "Sala Mónaco", img: "cutouts/sala-monaco.webp" })
   ============================================================ */
(function () {
  const DB = "ap-espacio", STORE = "fotos";
  let root, video, bgImg, ghost, msg, sizeIn, result, resultImg, gallery, galleryGrid, countEl, fileIn;
  let stream = null, current = null, pos = { x: .5, y: .6 }, scale = 60, flip = false, lastBlob = null, lastUrl = null;
  const logo = new Image();

  /* ---------- Base de datos local (las fotos quedan guardadas en el navegador) ---------- */
  function db() {
    return new Promise((res, rej) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: "id" });
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
  }
  async function savePhoto(blob, name) {
    try {
      const d = await db();
      await new Promise((res, rej) => {
        const tx = d.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put({ id: Date.now(), name, blob });
        tx.oncomplete = res; tx.onerror = () => rej(tx.error);
      });
    } catch (e) { /* si el navegador no deja guardar, la foto igual se descarga */ }
    updateCount();
  }
  async function listPhotos() {
    try {
      const d = await db();
      return await new Promise((res) => {
        const r = d.transaction(STORE).objectStore(STORE).getAll();
        r.onsuccess = () => res(r.result.sort((a, b) => b.id - a.id)); r.onerror = () => res([]);
      });
    } catch (e) { return []; }
  }
  async function deletePhoto(id) {
    try { const d = await db(); d.transaction(STORE, "readwrite").objectStore(STORE).delete(id); } catch (e) {}
  }
  async function updateCount() { const n = (await listPhotos()).length; if (countEl) countEl.textContent = n ? ` (${n})` : ""; }

  /* ---------- Interfaz ---------- */
  function build() {
    if (root) return;
    const css = document.createElement("style");
    css.textContent = `
.vte{position:fixed;inset:0;z-index:1000;background:#0E0C0A;color:#fff;display:none;font-family:Montserrat,system-ui,sans-serif}
.vte.open{display:block}
.vte video,.vte .bgimg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.vte .bgimg[hidden],.vte video[hidden]{display:none}
.vte .ghost{position:absolute;left:50%;top:60%;transform:translate(-50%,-50%);touch-action:none;cursor:grab;user-select:none;-webkit-user-drag:none;filter:drop-shadow(0 18px 18px rgba(0,0,0,.35))}
.vte .ghost.flip{transform:translate(-50%,-50%) scaleX(-1)}
.vte .bar{position:absolute;left:0;right:0;top:0;padding:calc(12px + env(safe-area-inset-top,0px)) 16px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px;background:linear-gradient(180deg,rgba(0,0,0,.6),transparent);font-size:.84rem}
.vte .bar b{font-weight:700;text-transform:uppercase;letter-spacing:.03em}
.vte .ic{min-width:40px;height:40px;border-radius:20px;border:0;background:rgba(255,255,255,.18);color:#fff;font-size:.8rem;font-weight:600;padding:0 12px;font-family:inherit}
.vte .tools{position:absolute;left:0;right:0;bottom:0;padding:14px 16px calc(18px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:12px;align-items:center;background:linear-gradient(0deg,rgba(0,0,0,.65),transparent)}
.vte .tools p{margin:0;font-size:.76rem;opacity:.9;text-align:center}
.vte .tools input[type=range]{width:min(320px,80vw);accent-color:#fff}
.vte .row{display:flex;gap:10px;align-items:center}
.vte .shot{width:68px;height:68px;border-radius:50%;border:4px solid #fff;background:rgba(255,255,255,.25);font-size:0}
.vte .shot:active{background:#fff}
.vte .msg{position:absolute;inset:0;display:grid;place-items:center;padding:30px;text-align:center;font-size:.9rem;line-height:1.6;background:#0E0C0A}
.vte .msg[hidden]{display:none}
.vte .msg .btn,.vte .sheet .btn{display:inline-flex;justify-content:center;align-items:center;margin-top:14px;background:#fff;color:#1F1A14;border:0;border-radius:999px;padding:13px 22px;font-weight:700;font-size:.86rem;font-family:inherit;text-decoration:none}
.vte .sheet{position:absolute;inset:0;background:rgba(10,8,6,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:calc(20px + env(safe-area-inset-top,0px)) 20px calc(20px + env(safe-area-inset-bottom,0px))}
.vte .sheet[hidden]{display:none}
.vte .sheet img{max-width:100%;max-height:56vh;border-radius:10px;box-shadow:0 10px 40px rgba(0,0,0,.5)}
.vte .sheet .ok{font-size:.84rem;text-align:center;line-height:1.5;opacity:.92;max-width:340px}
.vte .sheet .btns{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.vte .sheet .btn{margin-top:0}
.vte .sheet .btn.alt{background:rgba(255,255,255,.16);color:#fff}
.vte .gal{position:absolute;inset:0;background:#0E0C0A;overflow:auto;padding:calc(70px + env(safe-area-inset-top,0px)) 14px 30px}
.vte .gal[hidden]{display:none}
.vte .gal .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}
.vte .gal figure{margin:0;background:#1C1813;border-radius:10px;overflow:hidden}
.vte .gal figure img{width:100%;aspect-ratio:3/4;object-fit:cover;display:block}
.vte .gal figcaption{display:flex;gap:6px;padding:8px;font-size:.7rem;align-items:center}
.vte .gal figcaption span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vte .gal figcaption button{border:0;background:rgba(255,255,255,.15);color:#fff;border-radius:14px;padding:5px 9px;font-size:.68rem;font-family:inherit}
.vte .gal .empty{opacity:.75;text-align:center;margin-top:40px;font-size:.9rem}
.vte .galbar{position:fixed;left:0;right:0;top:0;padding:calc(12px + env(safe-area-inset-top,0px)) 16px 12px;background:#0E0C0A;display:flex;justify-content:space-between;align-items:center;z-index:2}
`;
    document.head.appendChild(css);
    root = document.createElement("div");
    root.className = "vte"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Ver mueble en tu espacio");
    root.innerHTML = `
      <video playsinline muted autoplay></video>
      <img class="bgimg" alt="" hidden>
      <img class="ghost" alt="" draggable="false">
      <div class="msg" hidden></div>
      <div class="bar">
        <div><b class="vname"></b><br><span>Ver en tu espacio</span></div>
        <div class="row">
          <button class="ic" data-a="gal" type="button">Mis fotos<span class="cnt"></span></button>
          <button class="ic" data-a="close" type="button" aria-label="Cerrar">✕</button>
        </div>
      </div>
      <div class="tools">
        <p>Arrastra el mueble para ubicarlo. Pellizca o usa la barra para el tamaño.</p>
        <input type="range" min="15" max="170" value="60" aria-label="Tamaño del mueble">
        <div class="row">
          <button class="ic" data-a="flip" type="button">Girar</button>
          <button class="shot" data-a="shot" type="button" aria-label="Tomar foto">Tomar foto</button>
          <button class="ic" data-a="still" type="button">Foto</button>
        </div>
      </div>
      <div class="sheet" hidden>
        <img alt="Tu foto con el mueble">
        <div class="ok">La foto se descargó y quedó guardada en <b>Mis fotos</b>. En iPhone toca <b>Guardar en el celular</b> y elige “Guardar imagen” para pasarla a tu galería.</div>
        <div class="btns">
          <button class="btn" data-a="save" type="button">Guardar en el celular</button>
          <button class="btn alt" data-a="share" type="button">Compartir</button>
          <button class="btn alt" data-a="again" type="button">Tomar otra</button>
        </div>
      </div>
      <div class="gal" hidden>
        <div class="galbar"><b>Mis fotos</b><button class="ic" data-a="galclose" type="button">Volver</button></div>
        <div class="grid"></div>
      </div>
      <input type="file" accept="image/*" capture="environment" hidden>`;
    document.body.appendChild(root);
    video = root.querySelector("video"); bgImg = root.querySelector(".bgimg"); ghost = root.querySelector(".ghost");
    msg = root.querySelector(".msg"); sizeIn = root.querySelector("input[type=range]");
    result = root.querySelector(".sheet"); resultImg = result.querySelector("img");
    gallery = root.querySelector(".gal"); galleryGrid = gallery.querySelector(".grid");
    countEl = root.querySelector(".cnt"); fileIn = root.querySelector("input[type=file]");

    root.addEventListener("click", (e) => {
      const a = e.target.closest("[data-a]"); if (!a) return;
      ({ close, shot: capture, flip: toggleFlip, gal: openGallery, galclose: () => (gallery.hidden = true),
         save: () => saveToDevice(lastBlob), share: () => share(lastBlob), again: () => (result.hidden = true),
         still: () => fileIn.click(), usefile: () => fileIn.click(), retry: startCamera })[a.dataset.a]?.();
    });
    sizeIn.addEventListener("input", () => { scale = +sizeIn.value; place(); });
    fileIn.addEventListener("change", () => {
      const f = fileIn.files[0]; if (!f) return;
      stopCamera();
      bgImg.src = URL.createObjectURL(f); bgImg.hidden = false; video.hidden = true; msg.hidden = true;
      fileIn.value = "";
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && root.classList.contains("open")) close(); });

    // Arrastrar con un dedo, pellizcar con dos
    const pts = new Map(); let startDist = 0, startScale = scale, off = null;
    ghost.addEventListener("pointerdown", (e) => {
      ghost.setPointerCapture(e.pointerId); pts.set(e.pointerId, e);
      if (pts.size === 2) { const [a, b] = [...pts.values()]; startDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); startScale = scale; }
      else off = { x: e.clientX / innerWidth - pos.x, y: e.clientY / innerHeight - pos.y };
    });
    ghost.addEventListener("pointermove", (e) => {
      if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, e);
      if (pts.size === 2) { const [a, b] = [...pts.values()]; scale = Math.max(15, Math.min(170, startScale * Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / startDist)); sizeIn.value = scale; }
      else if (off) pos = { x: e.clientX / innerWidth - off.x, y: e.clientY / innerHeight - off.y };
      place();
    });
    const up = (e) => { pts.delete(e.pointerId); if (pts.size < 2) off = null; };
    ghost.addEventListener("pointerup", up); ghost.addEventListener("pointercancel", up);
  }

  function place() {
    ghost.style.left = pos.x * 100 + "%"; ghost.style.top = pos.y * 100 + "%";
    ghost.style.width = Math.min(scale * innerWidth / 100, scale * 9) + "px";
  }
  function toggleFlip() { flip = !flip; ghost.classList.toggle("flip", flip); }

  async function startCamera() {
    msg.hidden = true; bgImg.hidden = true; video.hidden = false;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return cameraFail();
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      video.srcObject = stream; await video.play().catch(() => {});
    } catch (e) { cameraFail(); }
  }
  function cameraFail() {
    msg.hidden = false;
    msg.innerHTML = `<div>No pudimos abrir la cámara en vivo.<br>Revisa el permiso de cámara del navegador, o toma una foto de tu espacio y ubica el mueble encima.<br>
      <button class="btn" data-a="usefile" type="button">Tomar foto de mi espacio</button><br>
      <button class="btn" data-a="retry" type="button" style="background:rgba(255,255,255,.16);color:#fff">Intentar de nuevo</button></div>`;
  }
  function stopCamera() { if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; } video.srcObject = null; }

  /* ---------- Foto ---------- */
  async function capture() {
    const useVideo = !video.hidden && video.videoWidth;
    const src = useVideo ? video : (!bgImg.hidden && bgImg.naturalWidth ? bgImg : null);
    if (!src) return;
    const sw0 = useVideo ? video.videoWidth : bgImg.naturalWidth, sh0 = useVideo ? video.videoHeight : bgImg.naturalHeight;
    const W = Math.round(innerWidth * Math.min(devicePixelRatio || 1, 2)), H = Math.round(innerHeight * Math.min(devicePixelRatio || 1, 2)), k = W / innerWidth;
    const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
    // Fondo recortado igual que en pantalla (object-fit: cover)
    const vr = sw0 / sh0, cr = W / H; let sw = sw0, sh = sh0, sx = 0, sy = 0;
    if (vr > cr) { sw = sh0 * cr; sx = (sw0 - sw) / 2; } else { sh = sw0 / cr; sy = (sh0 - sh) / 2; }
    g.drawImage(src, sx, sy, sw, sh, 0, 0, W, H);
    // Mueble
    const r = ghost.getBoundingClientRect();
    g.save(); g.shadowColor = "rgba(0,0,0,.35)"; g.shadowBlur = 24 * k; g.shadowOffsetY = 14 * k;
    if (flip) { g.translate((r.left + r.width) * k, 0); g.scale(-1, 1); g.drawImage(ghost, 0, r.top * k, r.width * k, r.height * k); }
    else g.drawImage(ghost, r.left * k, r.top * k, r.width * k, r.height * k);
    g.restore();
    // Marca y nombre del producto
    const pad = 16 * k, bh = 54 * k;
    g.fillStyle = "rgba(255,255,255,.88)"; roundRect(g, pad, H - bh - pad, Math.min(W - 2 * pad, 330 * k), bh, 12 * k); g.fill();
    if (logo.complete && logo.naturalWidth) { const lh = 26 * k, lw = lh * logo.naturalWidth / logo.naturalHeight; g.drawImage(logo, pad + 12 * k, H - pad - bh / 2 - lh / 2, lw, lh); }
    g.fillStyle = "#2A2118"; g.font = `700 ${13 * k}px Montserrat, Arial, sans-serif`; g.textBaseline = "middle";
    g.fillText(current.name.slice(0, 30), pad + 130 * k, H - pad - bh / 2);

    const blob = await new Promise((res) => c.toBlob(res, "image/jpeg", .9));
    lastBlob = blob;
    if (lastUrl) URL.revokeObjectURL(lastUrl);
    lastUrl = URL.createObjectURL(blob);
    resultImg.src = lastUrl; result.hidden = false;
    savePhoto(blob, current.name);
    download(blob); // descarga automática
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function fileName(name) { return "AudioPionner-" + (name || "mueble").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-") + "-" + Date.now() + ".jpg"; }
  function download(blob, name) {
    try {
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = fileName(name || current?.name);
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
    } catch (e) {}
  }
  async function saveToDevice(blob, name) {
    if (!blob) return;
    const file = new File([blob], fileName(name || current?.name), { type: "image/jpeg" });
    // En celulares, el menú de compartir tiene "Guardar imagen" para enviarla a la galería
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: "Mi espacio con AudioPionner" }); return; } catch (e) { if (e.name === "AbortError") return; }
    }
    download(blob, name);
  }
  async function share(blob, name) {
    if (!blob) return;
    const file = new File([blob], fileName(name || current?.name), { type: "image/jpeg" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], text: "Así se vería " + (name || current?.name) + " en mi espacio" }); return; } catch (e) { if (e.name === "AbortError") return; }
    }
    download(blob, name);
  }

  async function openGallery() {
    gallery.hidden = false;
    const fotos = await listPhotos();
    galleryGrid.innerHTML = fotos.length ? "" : `<p class="empty">Aún no has tomado fotos.</p>`;
    fotos.forEach((f) => {
      const url = URL.createObjectURL(f.blob);
      const fig = document.createElement("figure");
      fig.innerHTML = `<img src="${url}" alt="${f.name}"><figcaption><span>${f.name}</span><button type="button" data-s>Guardar</button><button type="button" data-d aria-label="Borrar">✕</button></figcaption>`;
      fig.querySelector("[data-s]").onclick = () => saveToDevice(f.blob, f.name);
      fig.querySelector("[data-d]").onclick = async () => { await deletePhoto(f.id); fig.remove(); updateCount(); };
      galleryGrid.appendChild(fig);
    });
  }

  function open(opts) {
    build();
    current = opts;
    if (opts.logo) logo.src = opts.logo;
    root.querySelector(".vname").textContent = opts.name;
    ghost.src = opts.img; ghost.alt = opts.name;
    pos = { x: .5, y: .6 }; scale = innerWidth > 900 ? 34 : 62; sizeIn.value = scale; flip = false; ghost.classList.remove("flip"); place();
    result.hidden = true; gallery.hidden = true;
    root.classList.add("open"); document.body.style.overflow = "hidden";
    updateCount(); startCamera();
    opts.onOpen && opts.onOpen();
  }
  function close() {
    stopCamera(); root.classList.remove("open"); document.body.style.overflow = "";
    current && current.onClose && current.onClose();
  }

  window.VerEnTuEspacio = { open, close };
})();
