// ============================================================
// KHỞI TẠO SUPABASE CLIENT — dùng chung cho toàn bộ hệ thống
// ============================================================
const SUPABASE_URL = "https://uihcjotjfpxpwzdxyjow.supabase.co";
const SUPABASE_KEY = "sb_publishable_VoY4j3Y7eKGMQ4glxT-_OA_DtV3T06h";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ------------------------------------------------------------
// Bắt buộc phải đăng nhập mới xem được trang.
// Gọi hàm này ở đầu mỗi trang (trừ login.html).
// Trả về { user, profile } nếu hợp lệ, tự động chuyển hướng
// về login.html nếu chưa đăng nhập.
// ------------------------------------------------------------
async function requireAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    window.location.href = "login.html";
    return null;
  }
  const { data: profile, error } = await sb
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (error || !profile) {
    console.error("Không lấy được thông tin tài khoản:", error);
    await sb.auth.signOut();
    window.location.href = "login.html";
    return null;
  }

  return { user: session.user, profile };
}

// Đăng xuất
async function doLogout() {
  await sb.auth.signOut();
  window.location.href = "login.html";
}

// Định dạng tiền VNĐ
function formatVND(amount) {
  const n = Number(amount || 0);
  return n.toLocaleString("vi-VN") + "₫";
}

// Định dạng ngày giờ Việt Nam
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Định dạng ngày + giờ:phút Việt Nam (dùng cho lịch sử đơn hàng, thu chi, nhập hàng...)
function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  const datePart = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timePart = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return `${datePart} ${timePart}`;
}

// Chuẩn hóa SĐT (bỏ khoảng trắng, dấu chấm, gạch ngang...) để tìm kiếm không bị lệch do cách gõ khác nhau
function normalizePhone(str) {
  return (str || "").replace(/[^0-9+]/g, "");
}
function phoneOrNameMatches(name, phone, filter) {
  if (!filter) return true;
  if ((name || "").toLowerCase().includes(filter)) return true;
  const normF = normalizePhone(filter);
  return normF.length > 0 && normalizePhone(phone).includes(normF);
}

// Kiểm tra sản phẩm có phải sinh vật (cá/san hô) không — dùng để bỏ cảnh báo hết hàng/sắp hết cho nhóm này
function isLivestockCategory(category) {
  const c = (category || "").trim().toLowerCase();
  return ["cá", "ca", "san hô", "san ho"].includes(c);
}

// Gửi thông báo. targetRole: 'owner' (mặc định) hoặc 'all'. targetUserId: nếu có, gửi đích danh cho đúng 1 người đó.
async function pushNotification(type, title, message, link, targetRole = "owner", targetUserId = null) {
  try {
    await sb.from("notifications").insert({ type, title, message, link, target_role: targetRole, target_user_id: targetUserId });
  } catch (e) {
    console.error("Không gửi được thông báo:", e);
  }
}
