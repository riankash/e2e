import { test, expect } from "@playwright/test";

const BASE_URL = "https://absensi-siswa-tau.vercel.app";
const ADMIN_EMAIL = "rian@admin.com";
const ADMIN_PASS = "Gangster18";

// ─── Helper ───────────────────────────────────────────────
async function login(page: any, email: string, pass: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState("networkidle");

  // Isi email
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
  await emailInput.fill(email);

  // Isi password
  const passInput = page.locator('input[type="password"]').first();
  await passInput.fill(pass);

  // Klik login
  const loginBtn = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Masuk")').first();
  await loginBtn.click();

  await page.waitForLoadState("networkidle");
}

// ─── 1. Halaman Login ──────────────────────────────────────
test("halaman login bisa dibuka", async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await expect(page).toHaveURL(/login/);
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  await expect(emailInput).toBeVisible();
});

test("login dengan kredensial salah gagal", async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState("networkidle");

  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  await emailInput.fill("salah@email.com");

  const passInput = page.locator('input[type="password"]').first();
  await passInput.fill("passwordsalah");

  const loginBtn = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Masuk")').first();
  await loginBtn.click();

  await page.waitForLoadState("networkidle");

  // Harus tetap di halaman login atau muncul pesan error
  const stillOnLogin = page.url().includes("login");
  const errorMsg = page.locator('text=/gagal|invalid|salah|error|incorrect/i').first();
  const hasError = await errorMsg.isVisible().catch(() => false);

  expect(stillOnLogin || hasError).toBeTruthy();
});

test("login admin berhasil dan masuk dashboard", async ({ page }) => {
  await login(page, ADMIN_EMAIL, ADMIN_PASS);

  // Setelah login harus redirect ke dashboard / home
  await expect(page).not.toHaveURL(/login/);

  // Cek ada elemen dashboard
  const dashboard = page.locator('text=/dashboard|selamat datang|absensi|beranda/i').first();
  await expect(dashboard).toBeVisible({ timeout: 8000 });
});

// ─── 2. Navigasi ───────────────────────────────────────────
test("navigasi menu utama berfungsi", async ({ page }) => {
  await login(page, ADMIN_EMAIL, ADMIN_PASS);

  // Cek sidebar/navbar ada
  const nav = page.locator('nav, aside, [role="navigation"]').first();
  await expect(nav).toBeVisible({ timeout: 8000 });
});

// ─── 3. Fitur Absensi ──────────────────────────────────────
test("halaman absensi bisa diakses", async ({ page }) => {
  await login(page, ADMIN_EMAIL, ADMIN_PASS);

  // Cari menu absensi
  const absensiMenu = page.locator('a:has-text("Absensi"), button:has-text("Absensi"), [href*="absensi"]').first();
  const isVisible = await absensiMenu.isVisible().catch(() => false);

  if (isVisible) {
    await absensiMenu.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator('text=/absensi/i').first()).toBeVisible();
  } else {
    // Langsung ke URL absensi
    await page.goto(`${BASE_URL}/absensi`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/login/);
  }
});

// ─── 4. Manajemen Siswa/Guru ───────────────────────────────
test("halaman data siswa bisa diakses", async ({ page }) => {
  await login(page, ADMIN_EMAIL, ADMIN_PASS);

  const siswaMenu = page.locator('a:has-text("Siswa"), button:has-text("Siswa"), [href*="siswa"]').first();
  const isVisible = await siswaMenu.isVisible().catch(() => false);

  if (isVisible) {
    await siswaMenu.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator('text=/siswa/i').first()).toBeVisible();
  } else {
    await page.goto(`${BASE_URL}/siswa`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/login/);
  }
});

test("halaman data guru bisa diakses", async ({ page }) => {
  await login(page, ADMIN_EMAIL, ADMIN_PASS);

  const guruMenu = page.locator('a:has-text("Guru"), button:has-text("Guru"), [href*="guru"]').first();
  const isVisible = await guruMenu.isVisible().catch(() => false);

  if (isVisible) {
    await guruMenu.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator('text=/guru/i').first()).toBeVisible();
  } else {
    await page.goto(`${BASE_URL}/guru`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/login/);
  }
});

// ─── 5. Rekap / Laporan ────────────────────────────────────
test("halaman rekap/laporan bisa diakses", async ({ page }) => {
  await login(page, ADMIN_EMAIL, ADMIN_PASS);

  const rekapMenu = page.locator('a:has-text("Rekap"), a:has-text("Laporan"), [href*="rekap"], [href*="laporan"]').first();
  const isVisible = await rekapMenu.isVisible().catch(() => false);

  if (isVisible) {
    await rekapMenu.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator('text=/rekap|laporan/i').first()).toBeVisible();
  } else {
    await page.goto(`${BASE_URL}/rekap`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/login/);
  }
});

// ─── 6. Logout ─────────────────────────────────────────────
test("logout berhasil kembali ke login", async ({ page }) => {
  await login(page, ADMIN_EMAIL, ADMIN_PASS);

  // Cari tombol logout
  const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Keluar"), a:has-text("Logout"), a:has-text("Keluar")').first();
  const isVisible = await logoutBtn.isVisible().catch(() => false);

  if (!isVisible) {
    // Mungkin ada di dropdown avatar/profil
    const avatar = page.locator('[aria-label*="profile" i], [aria-label*="user" i], img[alt*="avatar" i]').first();
    const avatarVisible = await avatar.isVisible().catch(() => false);
    if (avatarVisible) {
      await avatar.click();
      await page.waitForTimeout(500);
    }
  }

  const logoutBtn2 = page.locator('button:has-text("Logout"), button:has-text("Keluar"), a:has-text("Logout"), a:has-text("Keluar")').first();
  await logoutBtn2.click();
  await page.waitForLoadState("networkidle");

  await expect(page).toHaveURL(/login/);
});

// ─── 7. Proteksi Route ─────────────────────────────────────
test("halaman dashboard tidak bisa diakses tanpa login", async ({ page }) => {
  // Langsung akses tanpa login
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState("networkidle");

  // Harus redirect ke login
  await expect(page).toHaveURL(/login/);
});
     
