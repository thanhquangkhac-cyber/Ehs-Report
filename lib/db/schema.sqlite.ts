import {
  sqliteTable,
  integer,
  text,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * DEV-ONLY mirror of schema.ts for local verification when MySQL/Docker is
 * unavailable (e.g. virtualization disabled in BIOS). Column shapes mirror
 * the MySQL schema; enums are enforced at the app layer instead of the DB
 * layer since SQLite has no native ENUM type. This file is NOT the source of
 * truth for production - lib/db/schema.ts (MySQL) is. Keep both in sync
 * manually when adding/removing columns.
 */

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "quanly", "nhanvien"] })
    .notNull()
    .default("nhanvien"),
  maNv: text("ma_nv"),
  displayName: text("display_name"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_users_ma_nv").on(table.maNv),
]);

export const thanhVien = sqliteTable("thanh_vien", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  maNv: text("ma_nv").notNull().unique(),
  hoTen: text("ho_ten").notNull(),
  boPhan: text("bo_phan"),
  xuong: text("xuong"),
  chucVu: text("chuc_vu"),
  email: text("email"),
  vaiTro: text("vai_tro", { enum: ["nhanvien", "nguoikhacphuc", "quanly"] })
    .notNull()
    .default("nhanvien"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_thanh_vien_xuong").on(table.xuong),
  index("idx_thanh_vien_vai_tro").on(table.vaiTro),
]);

export const qrAreas = sqliteTable("qr_areas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  maQr: text("ma_qr").notNull().unique(),
  xuong: text("xuong").notNull(),
  khuVuc: text("khu_vuc").notNull(),
  phuTrach: text("phu_trach"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("uq_xuong_khuvuc").on(table.xuong, table.khuVuc),
  index("idx_qr_xuong").on(table.xuong),
]);

export const baoCao = sqliteTable("bao_cao", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  maNv: text("ma_nv").notNull(),
  hoTen: text("ho_ten").notNull(),
  boPhan: text("bo_phan"),
  xuong: text("xuong").notNull(),
  viTri: text("vi_tri").notNull(),
  noiDung: text("noi_dung").notNull(),
  hinhAnh: text("hinh_anh"),

  status: text("status", { enum: ["pending", "approved", "rejected", "fixed"] })
    .notNull()
    .default("pending"),

  category: text("category"),
  goldenRule: text("golden_rule"),
  severity: text("severity", { enum: ["low", "medium", "high", "critical"] }),
  area: text("area"),
  areaId: integer("area_id").references(() => qrAreas.id, { onDelete: "set null" }),
  nguoiKp: text("nguoi_kp"),
  nguoiKpMaNv: text("nguoi_kp_ma_nv"),
  nkpChucVu: text("nkp_chuc_vu"),
  nkpEmail: text("nkp_email"),
  approvedBy: integer("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedDate: text("approved_date"),
  deadline: text("deadline"),
  rejectReason: text("reject_reason"),

  fixer: text("fixer"),
  fixTime: text("fix_time"),
  fixNote: text("fix_note"),
  fixImg: text("fix_img"),

  fixToken: text("fix_token").unique(),
  fixTokenExpires: text("fix_token_expires"),

  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_bc_status").on(table.status),
  index("idx_bc_xuong").on(table.xuong),
  index("idx_bc_created_at").on(table.createdAt),
  index("idx_bc_deadline").on(table.deadline),
]);

export const gemba = sqliteTable("gemba", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  maQr: text("ma_qr").notNull(),
  areaId: integer("area_id").references(() => qrAreas.id, { onDelete: "set null" }),
  xuong: text("xuong").notNull(),
  khuVuc: text("khu_vuc").notNull(),
  phuTrach: text("phu_trach"),

  maNv: text("ma_nv").notNull(),
  hoTen: text("ho_ten").notNull(),
  boPhan: text("bo_phan"),

  interlock: text("interlock", { enum: ["dat", "khong_dat"] }).notNull(),
  checan: text("checan", { enum: ["dat", "khong_dat"] }).notNull(),
  tudien: text("tudien", { enum: ["dat", "khong_dat"] }).notNull(),
  s5Moitruong: text("s5_moitruong", { enum: ["dat", "khong_dat"] }).notNull(),
  coSuCo: integer("co_su_co").notNull().default(0),
  ghiChu: text("ghi_chu"),

  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_gemba_xuong").on(table.xuong),
  index("idx_gemba_created_at").on(table.createdAt),
  index("idx_gemba_ma_qr").on(table.maQr),
]);

export const webhookSettings = sqliteTable("webhook_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventKey: text("event_key", {
    enum: ["baocao_moi", "phe_duyet", "phe_duyet_2", "da_khac_phuc"],
  })
    .notNull()
    .unique(),
  webhookUrl: text("webhook_url"),
  isEnabled: integer("is_enabled").notNull().default(1),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const notificationChannels = sqliteTable("notification_channels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  platform: text("platform", { enum: ["telegram", "zalo", "slack"] }).notNull(),
  name: text("name").notNull(),
  isEnabled: integer("is_enabled").notNull().default(1),

  telegramBotToken: text("telegram_bot_token"),
  telegramChatId: text("telegram_chat_id"),

  zaloAccessToken: text("zalo_access_token"),
  zaloRefreshToken: text("zalo_refresh_token"),
  zaloAppId: text("zalo_app_id"),
  zaloAppSecret: text("zalo_app_secret"),
  zaloOaId: text("zalo_oa_id"),
  zaloRecipientUserId: text("zalo_recipient_user_id"),
  zaloTokenExpiresAt: text("zalo_token_expires_at"),

  slackWebhookUrl: text("slack_webhook_url"),

  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_notification_channels_platform").on(table.platform),
]);

export const notificationChannelEvents = sqliteTable("notification_channel_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  channelId: integer("channel_id")
    .notNull()
    .references(() => notificationChannels.id, { onDelete: "cascade" }),
  eventKey: text("event_key", {
    enum: ["baocao_moi", "phe_duyet", "phe_duyet_2", "da_khac_phuc"],
  }).notNull(),
  isEnabled: integer("is_enabled").notNull().default(1),
}, (table) => [
  uniqueIndex("uq_channel_event").on(table.channelId, table.eventKey),
  index("idx_nce_event_key").on(table.eventKey),
]);
