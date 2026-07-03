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
