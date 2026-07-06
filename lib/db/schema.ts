import {
  mysqlTable,
  int,
  varchar,
  text,
  datetime,
  tinyint,
  mysqlEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["admin", "quanly", "nhanvien"])
    .notNull()
    .default("nhanvien"),
  maNv: varchar("ma_nv", { length: 32 }),
  displayName: varchar("display_name", { length: 128 }),
  isActive: tinyint("is_active").notNull().default(1),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
}, (table) => [
  index("idx_users_ma_nv").on(table.maNv),
]);

export const thanhVien = mysqlTable("thanh_vien", {
  id: int("id").autoincrement().primaryKey(),
  maNv: varchar("ma_nv", { length: 32 }).notNull().unique(),
  hoTen: varchar("ho_ten", { length: 128 }).notNull(),
  boPhan: varchar("bo_phan", { length: 128 }),
  xuong: varchar("xuong", { length: 128 }),
  chucVu: varchar("chuc_vu", { length: 128 }),
  email: varchar("email", { length: 191 }),
  vaiTro: mysqlEnum("vai_tro", ["nhanvien", "nguoikhacphuc", "quanly"])
    .notNull()
    .default("nhanvien"),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
}, (table) => [
  index("idx_thanh_vien_xuong").on(table.xuong),
  index("idx_thanh_vien_vai_tro").on(table.vaiTro),
]);

export const qrAreas = mysqlTable("qr_areas", {
  id: int("id").autoincrement().primaryKey(),
  maQr: varchar("ma_qr", { length: 64 }).notNull().unique(),
  xuong: varchar("xuong", { length: 128 }).notNull(),
  khuVuc: varchar("khu_vuc", { length: 128 }).notNull(),
  phuTrach: varchar("phu_trach", { length: 128 }),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("uq_xuong_khuvuc").on(table.xuong, table.khuVuc),
  index("idx_qr_xuong").on(table.xuong),
]);

export const baoCao = mysqlTable("bao_cao", {
  id: int("id").autoincrement().primaryKey(),

  // submission snapshot
  maNv: varchar("ma_nv", { length: 32 }).notNull(),
  hoTen: varchar("ho_ten", { length: 128 }).notNull(),
  boPhan: varchar("bo_phan", { length: 128 }),
  xuong: varchar("xuong", { length: 128 }).notNull(),
  viTri: varchar("vi_tri", { length: 255 }).notNull(),
  noiDung: text("noi_dung").notNull(),
  hinhAnh: varchar("hinh_anh", { length: 512 }),

  status: mysqlEnum("status", ["pending", "approved", "rejected", "fixed"])
    .notNull()
    .default("pending"),

  // set at approval time
  category: varchar("category", { length: 128 }),
  goldenRule: varchar("golden_rule", { length: 128 }),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]),
  area: varchar("area", { length: 128 }),
  areaId: int("area_id").references(() => qrAreas.id, { onDelete: "set null" }),
  nguoiKp: varchar("nguoi_kp", { length: 128 }),
  nguoiKpMaNv: varchar("nguoi_kp_ma_nv", { length: 32 }),
  nkpChucVu: varchar("nkp_chuc_vu", { length: 128 }),
  nkpEmail: varchar("nkp_email", { length: 191 }),
  approvedBy: int("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedDate: datetime("approved_date"),
  deadline: datetime("deadline"),
  rejectReason: text("reject_reason"),

  // fix-side
  fixer: varchar("fixer", { length: 128 }),
  fixTime: datetime("fix_time"),
  fixNote: text("fix_note"),
  fixImg: varchar("fix_img", { length: 512 }),

  // magic-link fix flow
  fixToken: varchar("fix_token", { length: 43 }).unique(),
  fixTokenExpires: datetime("fix_token_expires"),

  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
}, (table) => [
  index("idx_bc_status").on(table.status),
  index("idx_bc_xuong").on(table.xuong),
  index("idx_bc_created_at").on(table.createdAt),
  index("idx_bc_deadline").on(table.deadline),
]);

export const gemba = mysqlTable("gemba", {
  id: int("id").autoincrement().primaryKey(),
  maQr: varchar("ma_qr", { length: 64 }).notNull(),
  areaId: int("area_id").references(() => qrAreas.id, { onDelete: "set null" }),
  xuong: varchar("xuong", { length: 128 }).notNull(),
  khuVuc: varchar("khu_vuc", { length: 128 }).notNull(),
  phuTrach: varchar("phu_trach", { length: 128 }),

  maNv: varchar("ma_nv", { length: 32 }).notNull(),
  hoTen: varchar("ho_ten", { length: 128 }).notNull(),
  boPhan: varchar("bo_phan", { length: 128 }),

  interlock: mysqlEnum("interlock", ["dat", "khong_dat"]).notNull(),
  checan: mysqlEnum("checan", ["dat", "khong_dat"]).notNull(),
  tudien: mysqlEnum("tudien", ["dat", "khong_dat"]).notNull(),
  s5Moitruong: mysqlEnum("s5_moitruong", ["dat", "khong_dat"]).notNull(),
  coSuCo: tinyint("co_su_co").notNull().default(0),
  ghiChu: text("ghi_chu"),

  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
}, (table) => [
  index("idx_gemba_xuong").on(table.xuong),
  index("idx_gemba_created_at").on(table.createdAt),
  index("idx_gemba_ma_qr").on(table.maQr),
]);

export const webhookSettings = mysqlTable("webhook_settings", {
  id: int("id").autoincrement().primaryKey(),
  eventKey: mysqlEnum("event_key", [
    "baocao_moi",
    "phe_duyet",
    "phe_duyet_2",
    "da_khac_phuc",
  ])
    .notNull()
    .unique(),
  webhookUrl: varchar("webhook_url", { length: 512 }),
  isEnabled: tinyint("is_enabled").notNull().default(1),
  updatedAt: datetime("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});
