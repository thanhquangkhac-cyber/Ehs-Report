import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  smallint,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["admin", "quanly", "nhanvien"]);
export const vaiTroEnum = pgEnum("vai_tro", ["nhanvien", "nguoikhacphuc", "quanly"]);
export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "approved",
  "rejected",
  "fixed",
]);
export const severityEnum = pgEnum("severity", ["low", "medium", "high", "critical"]);
export const checklistEnum = pgEnum("checklist_value", ["dat", "khong_dat"]);
export const webhookEventEnum = pgEnum("webhook_event_key", [
  "baocao_moi",
  "phe_duyet",
  "phe_duyet_2",
  "da_khac_phuc",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: roleEnum("role").notNull().default("nhanvien"),
  maNv: varchar("ma_nv", { length: 32 }),
  displayName: varchar("display_name", { length: 128 }),
  isActive: smallint("is_active").notNull().default(1),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().default(sql`now()`),
}, (table) => [
  index("idx_users_ma_nv").on(table.maNv),
]);

export const thanhVien = pgTable("thanh_vien", {
  id: serial("id").primaryKey(),
  maNv: varchar("ma_nv", { length: 32 }).notNull().unique(),
  hoTen: varchar("ho_ten", { length: 128 }).notNull(),
  boPhan: varchar("bo_phan", { length: 128 }),
  xuong: varchar("xuong", { length: 128 }),
  chucVu: varchar("chuc_vu", { length: 128 }),
  email: varchar("email", { length: 191 }),
  vaiTro: vaiTroEnum("vai_tro").notNull().default("nhanvien"),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().default(sql`now()`),
}, (table) => [
  index("idx_thanh_vien_xuong").on(table.xuong),
  index("idx_thanh_vien_vai_tro").on(table.vaiTro),
]);

export const qrAreas = pgTable("qr_areas", {
  id: serial("id").primaryKey(),
  maQr: varchar("ma_qr", { length: 64 }).notNull().unique(),
  xuong: varchar("xuong", { length: 128 }).notNull(),
  khuVuc: varchar("khu_vuc", { length: 128 }).notNull(),
  phuTrach: varchar("phu_trach", { length: 128 }),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().default(sql`now()`),
}, (table) => [
  uniqueIndex("uq_xuong_khuvuc").on(table.xuong, table.khuVuc),
  index("idx_qr_xuong").on(table.xuong),
]);

export const baoCao = pgTable("bao_cao", {
  id: serial("id").primaryKey(),

  maNv: varchar("ma_nv", { length: 32 }).notNull(),
  hoTen: varchar("ho_ten", { length: 128 }).notNull(),
  boPhan: varchar("bo_phan", { length: 128 }),
  xuong: varchar("xuong", { length: 128 }).notNull(),
  viTri: varchar("vi_tri", { length: 255 }).notNull(),
  noiDung: text("noi_dung").notNull(),
  hinhAnh: varchar("hinh_anh", { length: 512 }),

  status: reportStatusEnum("status").notNull().default("pending"),

  category: varchar("category", { length: 128 }),
  goldenRule: varchar("golden_rule", { length: 128 }),
  severity: severityEnum("severity"),
  area: varchar("area", { length: 128 }),
  areaId: integer("area_id").references(() => qrAreas.id, { onDelete: "set null" }),
  nguoiKp: varchar("nguoi_kp", { length: 128 }),
  nguoiKpMaNv: varchar("nguoi_kp_ma_nv", { length: 32 }),
  nkpChucVu: varchar("nkp_chuc_vu", { length: 128 }),
  nkpEmail: varchar("nkp_email", { length: 191 }),
  approvedBy: integer("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedDate: timestamp("approved_date", { mode: "string" }),
  deadline: timestamp("deadline", { mode: "string" }),
  rejectReason: text("reject_reason"),

  fixer: varchar("fixer", { length: 128 }),
  fixTime: timestamp("fix_time", { mode: "string" }),
  fixNote: text("fix_note"),
  fixImg: varchar("fix_img", { length: 512 }),

  fixToken: varchar("fix_token", { length: 43 }).unique(),
  fixTokenExpires: timestamp("fix_token_expires", { mode: "string" }),

  createdAt: timestamp("created_at", { mode: "string" }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().default(sql`now()`),
}, (table) => [
  index("idx_bc_status").on(table.status),
  index("idx_bc_xuong").on(table.xuong),
  index("idx_bc_created_at").on(table.createdAt),
  index("idx_bc_deadline").on(table.deadline),
]);

export const gemba = pgTable("gemba", {
  id: serial("id").primaryKey(),
  maQr: varchar("ma_qr", { length: 64 }).notNull(),
  areaId: integer("area_id").references(() => qrAreas.id, { onDelete: "set null" }),
  xuong: varchar("xuong", { length: 128 }).notNull(),
  khuVuc: varchar("khu_vuc", { length: 128 }).notNull(),
  phuTrach: varchar("phu_trach", { length: 128 }),

  maNv: varchar("ma_nv", { length: 32 }).notNull(),
  hoTen: varchar("ho_ten", { length: 128 }).notNull(),
  boPhan: varchar("bo_phan", { length: 128 }),

  interlock: checklistEnum("interlock").notNull(),
  checan: checklistEnum("checan").notNull(),
  tudien: checklistEnum("tudien").notNull(),
  s5Moitruong: checklistEnum("s5_moitruong").notNull(),
  coSuCo: smallint("co_su_co").notNull().default(0),
  ghiChu: text("ghi_chu"),

  createdAt: timestamp("created_at", { mode: "string" }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().default(sql`now()`),
}, (table) => [
  index("idx_gemba_xuong").on(table.xuong),
  index("idx_gemba_created_at").on(table.createdAt),
  index("idx_gemba_ma_qr").on(table.maQr),
]);

export const webhookSettings = pgTable("webhook_settings", {
  id: serial("id").primaryKey(),
  eventKey: webhookEventEnum("event_key").notNull().unique(),
  webhookUrl: varchar("webhook_url", { length: 512 }),
  isEnabled: smallint("is_enabled").notNull().default(1),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().default(sql`now()`),
});
