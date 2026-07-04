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
  { key: "customer-debt", label: "Công nợ khách hàng", href: "customer-debt.html", icon: "📗", ownerOnly: false },
  { key: "tanks", label: "Quản lý bể", href: "tanks.html", icon: "🪸", ownerOnly: false },
  { key: "suppliers", label: "Nhà cung cấp", href: "suppliers.html", icon: "🚚", ownerOnly: true },
];

function renderLayout({ activePage, profile, title, subtitle }) {
  const isOwner = profile.role === "owner";

  const navHtml = NAV_ITEMS.map(item => {
    const locked = item.ownerOnly && !isOwner;
    const activeCls = item.key === activePage ? "active" : "";
    if (locked) {
      return `<div class="topnav-item locked" title="Chỉ Chủ cửa hàng mới xem được mục này">
        <span class="icon">${item.icon}</span> ${item.label} 🔒
      </div>`;
    }
    return `<a class="topnav-item ${activeCls}" href="${item.href}">
      <span class="icon">${item.icon}</span> ${item.label}
    </a>`;
  }).join("");

  const shellHtml = `
    <div class="app-shell-top">
      <div class="topnav" id="topnav">
        <div class="topnav-brand"><span class="dot"></span> 2D Aquatic</div>
        <div class="topnav-items" id="topnavItems">${navHtml}</div>
        <div class="topnav-user">
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

  // Tự cuộn tới mục đang chọn nếu bị tràn ngoài vùng nhìn thấy (hữu ích trên mobile)
  const activeEl = document.querySelector(".topnav-item.active");
  if (activeEl) activeEl.scrollIntoView({ inline: "center", block: "nearest" });
}
