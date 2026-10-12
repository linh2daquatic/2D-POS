// ============================================================
// ẢNH SẢN PHẨM — chụp/chọn ảnh, tự nén, lưu vào Supabase Storage
// Ảnh nằm trong kho "product-photos"; bảng products chỉ giữ đường dẫn (cột images).
// Danh sách sản phẩm KHÔNG tải ảnh — chỉ tải khi mở cửa sổ 📷 của 1 sản phẩm.
// ============================================================
const PHOTO_BUCKET = "product-photos";
const PHOTO_MAX_SIDE = 1280;     // cạnh dài sau khi nén
const PHOTO_QUALITY = 0.82;      // JPEG ~150–250KB
const PHOTO_LIMIT = 8;           // tối đa ảnh / sản phẩm
let PHOTO_PID = null;

function photoUrl(path) {
  return sb.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}
function photoList(p) {
  const v = p && p.images;
  return Array.isArray(v) ? v.slice() : [];
}
function photoNewName() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + ".jpg";
}

function ensurePhotoModal() {
  if (document.getElementById("photoModal")) return;
  const css = document.createElement("style");
  css.textContent = `
  #photoModal .ph-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;margin:12px 0}
  #photoModal .ph-item{position:relative;border-radius:10px;overflow:hidden;border:1px solid var(--border);aspect-ratio:1/1;background:#f1f5f9}
  #photoModal .ph-item img{width:100%;height:100%;object-fit:cover;display:block}
  #photoModal .ph-item .ph-del{position:absolute;top:6px;right:6px;background:rgba(10,22,40,.75);color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px}
  #photoModal .ph-item .ph-main{position:absolute;left:6px;bottom:6px;background:var(--teal-deep,#16a085);color:#fff;font-size:11px;font-weight:700;border-radius:6px;padding:2px 7px}
  #photoModal .ph-item .ph-star{position:absolute;left:6px;bottom:6px;background:rgba(255,255,255,.9);color:var(--ink,#0a1628);font-size:11px;font-weight:600;border-radius:6px;padding:2px 7px;cursor:pointer}
  #photoModal .ph-add{display:flex;gap:8px;flex-wrap:wrap}
  #photoModal .ph-add label{flex:1 1 140px;text-align:center;padding:12px;border:1.5px dashed var(--teal,#00d4b8);border-radius:10px;cursor:pointer;font-weight:600;font-size:13.5px;color:var(--teal-deep,#16a085);background:#f0fdfa}
  #photoModal .ph-status{font-size:12.5px;color:var(--text-mute);min-height:18px;margin-top:8px}
  #photoModal .ph-tip{font-size:12px;color:var(--text-mute);margin-top:10px;line-height:1.5}`;
  document.head.appendChild(css);
  const el = document.createElement("div");
  el.className = "modal-overlay";
  el.id = "photoModal";
  el.innerHTML = `
    <div class="modal-box" style="max-width:560px">
      <div class="modal-header"><h3>📷 Ảnh sản phẩm</h3><span class="modal-close" id="phClose">✕</span></div>
      <div class="modal-body">
        <div style="font-weight:600" id="phName">—</div>
        <div class="ph-grid" id="phGrid"></div>
        <div class="ph-add">
          <label>📸 Chụp ảnh<input type="file" accept="image/*" capture="environment" id="phCam" hidden></label>
          <label>🖼️ Chọn từ máy<input type="file" accept="image/*" multiple id="phPick" hidden></label>
        </div>
        <div class="ph-status" id="phStatus"></div>
        <div class="ph-tip">Ảnh đầu tiên (⭐ Ảnh chính) được ưu tiên khi đăng bài. San hô: chụp đúng con đang bán, ánh sáng trắng/xanh như ngoài bể khách.
        Ảnh tự nén còn ~200KB nên không làm POS chậm.</div>
      </div>
    </div>`;
  document.body.appendChild(el);
  el.addEventListener("click", e => { if (e.target === el) closePhotoModal(); });
  document.getElementById("phClose").onclick = closePhotoModal;
  document.getElementById("phCam").onchange = e => uploadPhotos(e.target.files, e.target);
  document.getElementById("phPick").onchange = e => uploadPhotos(e.target.files, e.target);
}

function openPhotoModal(id) {
  ensurePhotoModal();
  PHOTO_PID = id;
  const p = ALL_PRODUCTS.find(x => x.id === id);
  document.getElementById("phName").textContent = p ? p.name : "";
  document.getElementById("phStatus").textContent = "";
  renderPhotoGrid();
  document.getElementById("photoModal").classList.add("open");
}
function closePhotoModal() {
  document.getElementById("photoModal").classList.remove("open");
  PHOTO_PID = null;
}

function renderPhotoGrid() {
  const p = ALL_PRODUCTS.find(x => x.id === PHOTO_PID);
  const list = photoList(p);
  const grid = document.getElementById("phGrid");
  if (!list.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;color:var(--text-mute);font-size:13px;padding:14px 0">Chưa có ảnh.</div>`;
    return;
  }
  grid.innerHTML = list.map((path, i) => `
    <div class="ph-item">
      <img src="${photoUrl(path)}" loading="lazy" alt="">
      <span class="ph-del" title="Xoá ảnh" data-i="${i}">✕</span>
      ${i === 0 ? `<span class="ph-main">⭐ Ảnh chính</span>` : `<span class="ph-star" data-i="${i}">Đặt làm chính</span>`}
    </div>`).join("");
  grid.querySelectorAll(".ph-del").forEach(b => b.onclick = () => deletePhoto(Number(b.dataset.i)));
  grid.querySelectorAll(".ph-star").forEach(b => b.onclick = () => makeMainPhoto(Number(b.dataset.i)));
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, PHOTO_MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * s), h = Math.round(img.naturalHeight * s);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      c.toBlob(b => b ? resolve(b) : reject(new Error("Không nén được ảnh")), "image/jpeg", PHOTO_QUALITY);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("File không phải ảnh")); };
    img.src = url;
  });
}

async function saveImagesColumn(id, list) {
  const { error } = await sb.from("products").update({ images: list }).eq("id", id);
  if (error) throw error;
  const p = ALL_PRODUCTS.find(x => x.id === id);
  if (p) p.images = list;
}

async function uploadPhotos(files, input) {
  const id = PHOTO_PID;
  const p = ALL_PRODUCTS.find(x => x.id === id);
  if (!p || !files || !files.length) return;
  const st = document.getElementById("phStatus");
  let list = photoList(p);
  const room = PHOTO_LIMIT - list.length;
  if (room <= 0) { st.textContent = `Tối đa ${PHOTO_LIMIT} ảnh mỗi sản phẩm — xoá bớt ảnh cũ trước.`; return; }
  const todo = [...files].slice(0, room);
  try {
    for (let i = 0; i < todo.length; i++) {
      st.textContent = `Đang nén và tải ảnh ${i + 1}/${todo.length}…`;
      const blob = await compressImage(todo[i]);
      const path = `${id}/${photoNewName()}`;
      const { error } = await sb.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: "image/jpeg", upsert: false });
      if (error) throw error;
      list = list.concat(path);
      await saveImagesColumn(id, list);
      if (PHOTO_PID === id) renderPhotoGrid();
    }
    st.textContent = `✅ Đã lưu ${todo.length} ảnh.` + (files.length > todo.length ? ` (Bỏ ${files.length - todo.length} ảnh vì quá ${PHOTO_LIMIT} ảnh.)` : "");
    if (typeof renderTable === "function") renderTable(document.getElementById("searchInput")?.value || "");
  } catch (e) {
    console.error(e);
    st.textContent = "❌ Lỗi tải ảnh: " + (e.message || e);
  } finally {
    if (input) input.value = "";
  }
}

async function deletePhoto(i) {
  const id = PHOTO_PID;
  const p = ALL_PRODUCTS.find(x => x.id === id);
  const list = photoList(p);
  const path = list[i];
  if (!path || !confirm("Xoá ảnh này?")) return;
  const st = document.getElementById("phStatus");
  try {
    const next = list.filter((_, k) => k !== i);
    await saveImagesColumn(id, next);
    await sb.storage.from(PHOTO_BUCKET).remove([path]);
    renderPhotoGrid();
    st.textContent = "Đã xoá ảnh.";
    if (typeof renderTable === "function") renderTable(document.getElementById("searchInput")?.value || "");
  } catch (e) {
    st.textContent = "❌ Lỗi xoá ảnh: " + (e.message || e);
  }
}

async function makeMainPhoto(i) {
  const id = PHOTO_PID;
  const p = ALL_PRODUCTS.find(x => x.id === id);
  const list = photoList(p);
  if (!list[i]) return;
  const next = [list[i]].concat(list.filter((_, k) => k !== i));
  try { await saveImagesColumn(id, next); renderPhotoGrid(); }
  catch (e) { document.getElementById("phStatus").textContent = "❌ " + (e.message || e); }
}
