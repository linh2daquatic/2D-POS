// ============================================================
// TOP NAVBAR (hàng ngang, cố định phía trên) dùng chung cho mọi trang
// Gọi renderLayout({activePage, profile, title, subtitle})
// ============================================================

const NAV_ITEMS = [
  { key: "orders", label: "Bán hàng", href: "orders.html", icon: "🛒", ownerOnly: false },
  { key: "order-history", label: "Lịch sử đơn", href: "order-history.html", icon: "🧾", ownerOnly: false },
  { key: "products", label: "Kho hàng", href: "products.html", icon: "📦", ownerOnly: false },
  { key: "cash", label: "Quỹ tiền mặt", href: "cash.html", icon: "💰", ownerOnly: false },
  { key: "dashboard", label: "Dashboard", href: "index.html", icon: "◱", ownerOnly: false },
  { key: "customers", label: "Khách hàng", href: "customers.html", icon: "👤", ownerOnly: false },
  { key: "tanks", label: "Quản lý bể", href: "tanks.html", icon: "🪸", ownerOnly: false },
  { key: "payroll", label: "Lương", href: "payroll.html", icon: "💼", ownerOnly: true },
  { key: "assets", label: "Tài sản & Đầu tư", href: "assets.html", icon: "🏗️", ownerOnly: true },
  { key: "suppliers", label: "Nhà cung cấp", href: "suppliers.html", icon: "🚚", ownerOnly: true },
];

// Nhóm menu: mỗi nhóm xổ ra các mục con. Muốn thêm trang mới: thêm vào NAV_ITEMS rồi bỏ key vào nhóm phù hợp.
const NAV_GROUPS = [
  { label: "Bán hàng", icon: "🛒", keys: ["orders", "order-history"] },
  { label: "Kho & NCC", icon: "📦", keys: ["products", "suppliers"] },
  { label: "Tiền", icon: "💰", keys: ["cash", "payroll", "assets"] },
  { label: "Khách & Bể", icon: "👥", keys: ["customers", "tanks"] },
  { key: "dashboard" },   // đứng riêng, bấm vào là mở luôn
];

function renderLayout({ activePage, profile, title, subtitle }) {
  const isOwner = profile.role === "owner";

  const itemByKey = k => NAV_ITEMS.find(i => i.key === k);
  const navHtml = NAV_GROUPS.map(g => {
    if (g.key) {
      const item = itemByKey(g.key);
      if (!item) return "";
      const locked = item.ownerOnly && !isOwner;
      if (locked) return `<div class="topnav-item locked" title="Chỉ Chủ cửa hàng mới xem được mục này"><span class="icon">${item.icon}</span> ${item.label} 🔒</div>`;
      return `<a class="topnav-item ${item.key === activePage ? "active" : ""}" href="${item.href}"><span class="icon">${item.icon}</span> ${item.label}</a>`;
    }
    const items = g.keys.map(itemByKey).filter(Boolean);
    const isActive = items.some(i => i.key === activePage);
    const cur = items.find(i => i.key === activePage);
    const payload = items.map(i => ({ label: i.label, href: i.href, icon: i.icon, locked: i.ownerOnly && !isOwner, active: i.key === activePage }));
    return `<div class="topnav-item nav-group ${isActive ? "active" : ""}" data-items='${JSON.stringify(payload).replace(/'/g, "&#39;")}'><span class="icon">${g.icon}</span> ${cur ? cur.label : g.label} <span style="font-size:10px; opacity:.7;">▾</span></div>`;
  }).join("");

  const shellHtml = `
    <div class="app-shell-top">
      <div class="topnav" id="topnav">
        <div class="topnav-brand"><span class="dot"></span> 2D Aquatic</div>
        <div class="topnav-items" id="topnavItems">${navHtml}</div>
        <div class="topnav-user">
          <div class="notif-bell-wrap" id="notifBellWrap">
            <span class="notif-bell" id="notifBell">🔔<span class="notif-badge" id="notifBadge" style="display:none;">0</span></span>
            <div class="notif-dropdown" id="notifDropdown"></div>
          </div>
          <span class="role-badge">${isOwner ? "Chủ cửa hàng" : "Nhân viên"}</span>
          <span class="topnav-username">${profile.full_name || "Người dùng"}</span>
          <span class="logout-btn" id="logoutBtn">Đăng xuất →</span>
        </div>
      </div>
      <div class="main-top">
        <div class="content" id="pageContent"></div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("afterbegin", shellHtml);

  document.getElementById("logoutBtn").addEventListener("click", doLogout);

  // Menu xổ xuống của từng nhóm (vẽ cố định theo vị trí nút để không bị cắt bởi vùng cuộn ngang)
  const navMenu = document.createElement("div");
  navMenu.id = "navGroupMenu";
  navMenu.style.cssText = "position:fixed; display:none; z-index:300; background:#fff; border-radius:10px; box-shadow:0 8px 24px rgba(10,22,40,.28); padding:6px; min-width:190px;";
  document.body.appendChild(navMenu);
  const closeNavMenu = () => { navMenu.style.display = "none"; navMenu.dataset.owner = ""; };
  document.querySelectorAll(".nav-group").forEach(btn => btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (navMenu.dataset.owner === btn.dataset.items && navMenu.style.display === "block") { closeNavMenu(); return; }
    const items = JSON.parse(btn.dataset.items);
    navMenu.innerHTML = items.map(i => i.locked
      ? `<div style="padding:9px 12px; border-radius:7px; color:#94a3b8; cursor:not-allowed; font-size:14px;" title="Chỉ Chủ cửa hàng mới xem được mục này">${i.icon} ${i.label} 🔒</div>`
      : `<a href="${i.href}" style="display:block; padding:9px 12px; border-radius:7px; text-decoration:none; font-size:14px; color:#14213d; ${i.active ? "background:#e8f3ef; font-weight:700;" : ""}" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='${i.active ? "#e8f3ef" : "transparent"}'">${i.icon} ${i.label}</a>`).join("");
    const r = btn.getBoundingClientRect();
    navMenu.style.top = (r.bottom + 6) + "px";
    navMenu.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 210)) + "px";
    navMenu.style.display = "block";
    navMenu.dataset.owner = btn.dataset.items;
  }));
  document.addEventListener("click", closeNavMenu);
  window.addEventListener("scroll", closeNavMenu, { passive: true });
  window.addEventListener("resize", closeNavMenu);

  setupNotifications(profile, isOwner);

  // Tự cuộn tới mục đang chọn nếu bị tràn ngoài vùng nhìn thấy (hữu ích trên mobile)
  const activeEl = document.querySelector(".topnav-item.active");
  if (activeEl) activeEl.scrollIntoView({ inline: "center", block: "nearest" });
}

/* ============================================================
   THÔNG BÁO — mọi tài khoản đều nhận được (Chủ nhận theo vai trò,
   nhân viên nhận thông báo gửi đích danh cho mình)
   ============================================================ */
async function setupNotifications(profile, isOwner) {
  const bell = document.getElementById("notifBell");
  const dropdown = document.getElementById("notifDropdown");
  const badge = document.getElementById("notifBadge");

  async function loadNotifications() {
    let query = sb.from("notifications").select("*").order("created_at", { ascending: false }).limit(20);
    if (isOwner) {
      query = query.or(`target_role.eq.owner,target_role.eq.all,target_user_id.eq.${profile.id}`);
    } else {
      query = query.or(`target_role.eq.all,target_user_id.eq.${profile.id}`);
    }
    const { data } = await query;
    return data || [];
  }

  function matchesMe(n) {
    if (n.target_user_id === profile.id) return true;
    if (n.target_role === "all") return true;
    if (n.target_role === "owner" && isOwner) return true;
    return false;
  }

  function renderDropdown(list) {
    const unreadCount = list.filter(n => !n.is_read).length;
    badge.textContent = unreadCount;
    badge.style.display = unreadCount > 0 ? "flex" : "none";

    if (list.length === 0) {
      dropdown.innerHTML = `<div class="notif-empty">Chưa có thông báo nào.</div>`;
      return;
    }
    dropdown.innerHTML = `
      <div class="notif-header">Thông báo</div>
      <div class="notif-list">
        ${list.map(n => `
          <div class="notif-item ${n.is_read ? '' : 'unread'}" data-id="${n.id}" data-link="${n.link || ''}">
            <div class="notif-title">${n.title}</div>
            ${n.message ? `<div class="notif-message">${n.message}</div>` : ""}
            <div class="notif-time">${formatDateTime(n.created_at)}</div>
          </div>
        `).join("")}
      </div>
    `;
    dropdown.querySelectorAll(".notif-item").forEach(el => {
      el.addEventListener("click", async () => {
        await sb.from("notifications").update({ is_read: true }).eq("id", el.dataset.id);
        if (el.dataset.link) window.location.href = el.dataset.link;
      });
    });
  }

  let cachedList = await loadNotifications();
  renderDropdown(cachedList);

  bell.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#notifBellWrap")) dropdown.classList.remove("open");
  });

  // Lắng nghe realtime — có thông báo mới thì hiện ngay, không cần tải lại trang
  sb.channel("notifications-channel")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
      const n = payload.new;
      if (!matchesMe(n)) return;
      cachedList = [n, ...cachedList].slice(0, 20);
      renderDropdown(cachedList);
      bell.classList.add("pulse");
      setTimeout(() => bell.classList.remove("pulse"), 1000);

      // Thông báo hệ điều hành (nếu trình duyệt đã cấp quyền)
      if (window.Notification && Notification.permission === "granted") {
        new Notification(n.title, { body: n.message || "", icon: "" });
      }
    })
    .subscribe();

  // Xin quyền hiện thông báo hệ điều hành khi Chủ bấm vào chuông lần đầu
  if (window.Notification && Notification.permission === "default") {
    bell.addEventListener("click", () => Notification.requestPermission(), { once: true });
  }
}
