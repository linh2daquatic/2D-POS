// ============================================================
// SIDEBAR + TOPBAR dùng chung cho mọi trang (trừ login.html)
// Gọi renderLayout(activePage, profile, pageTitle, pageSubtitle)
// ============================================================

const NAV_ITEMS = [
  { key: "orders", label: "Bán hàng", href: "orders.html", icon: "🛒", ownerOnly: false },
  { key: "products", label: "Kho hàng", href: "products.html", icon: "📦", ownerOnly: false },
  { key: "dashboard", label: "Dashboard", href: "index.html", icon: "◱", ownerOnly: false },
  { key: "customers", label: "Khách hàng", href: "customers.html", icon: "👤", ownerOnly: false },
  { key: "customer-debt", label: "Công nợ khách hàng", href: "customer-debt.html", icon: "📗", ownerOnly: false },
  { key: "suppliers", label: "Nhà cung cấp", href: "suppliers.html", icon: "🚚", ownerOnly: true },
  { key: "supplier-debt", label: "Công nợ NCC", href: "supplier-debt.html", icon: "📕", ownerOnly: true },
  { key: "cash", label: "Quỹ tiền mặt", href: "cash.html", icon: "💰", ownerOnly: true },
];

function renderLayout({ activePage, profile, title, subtitle }) {
  const isOwner = profile.role === "owner";

  const navHtml = NAV_ITEMS.map(item => {
    const locked = item.ownerOnly && !isOwner;
    const activeCls = item.key === activePage ? "active" : "";
    if (locked) {
      return `<div class="nav-item locked" title="Chỉ Chủ cửa hàng mới xem được mục này">
        <span class="icon">${item.icon}</span> ${item.label} 🔒
      </div>`;
    }
    return `<a class="nav-item ${activeCls}" href="${item.href}">
      <span class="icon">${item.icon}</span> ${item.label}
    </a>`;
  }).join("");

  const shellHtml = `
    <div class="app-shell">
      <div class="sidebar" id="sidebar">
        <div class="sidebar-brand"><span class="dot"></span> 2D Aquatic</div>
        <div class="nav-group">
          <div class="nav-label">Điều hướng</div>
          ${navHtml}
        </div>
        <div class="sidebar-footer">
          <div>${profile.full_name || "Người dùng"}</div>
          <span class="role-badge">${isOwner ? "Chủ cửa hàng" : "Nhân viên"}</span>
          <div class="logout-btn" id="logoutBtn">Đăng xuất →</div>
        </div>
      </div>
      <div class="main">
        <div class="topbar">
          <div>
            <div class="menu-toggle btn btn-secondary" id="menuToggle" style="margin-bottom:8px;">☰ Menu</div>
            <h1>${title}</h1>
            ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ""}
          </div>
        </div>
        <div class="content" id="pageContent"></div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("afterbegin", shellHtml);

  document.getElementById("logoutBtn").addEventListener("click", doLogout);

  const menuToggle = document.getElementById("menuToggle");
  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      document.getElementById("sidebar").classList.toggle("open");
    });
  }
}
