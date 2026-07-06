import { z } from "zod";

export const vaiTroEnum = z.enum(["nhanvien", "nguoikhacphuc", "quanly"]);

export const memberInputSchema = z.object({
  maNv: z.string().trim().min(1).max(32).optional().nullable(),
  hoTen: z.string().trim().min(1).max(128),
  boPhan: z.string().trim().max(128).optional().nullable(),
  xuong: z.string().trim().max(128).optional().nullable(),
  chucVu: z.string().trim().max(128).optional().nullable(),
  email: z.string().trim().email().max(191).optional().nullable().or(z.literal("")),
  vaiTro: vaiTroEnum.default("nhanvien"),
});

export type MemberInput = z.infer<typeof memberInputSchema>;

/** Vietnamese header aliases -> canonical field name, mirroring the reference app's import UX. */
export const MEMBER_IMPORT_COLS: Record<string, string> = {
  ma_nv: "maNv",
  "mã nv": "maNv",
  "ma nv": "maNv",
  ho_ten: "hoTen",
  "họ tên": "hoTen",
  "ho ten": "hoTen",
  "họ và tên": "hoTen",
  "ho va ten": "hoTen",
  "họ và tên *": "hoTen",
  "ho va ten *": "hoTen",
  bo_phan: "boPhan",
  "bộ phận": "boPhan",
  "bo phan": "boPhan",
  xuong: "xuong",
  "xưởng": "xuong",
  chuc_vu: "chucVu",
  "chức vụ": "chucVu",
  "chuc vu": "chucVu",
  email: "email",
  vai_tro: "vaiTro",
  "vai trò": "vaiTro",
  "vai tro": "vaiTro",
};

export const MEMBER_ROLE_ALIAS: Record<string, "nhanvien" | "nguoikhacphuc" | "quanly"> = {
  nhanvien: "nhanvien",
  "nhân viên": "nhanvien",
  "nhan vien": "nhanvien",
  nv: "nhanvien",
  nguoikhacphuc: "nguoikhacphuc",
  "người khắc phục": "nguoikhacphuc",
  "khắc phục": "nguoikhacphuc",
  kp: "nguoikhacphuc",
  quanly: "quanly",
  "quản lý": "quanly",
  "quan ly": "quanly",
  ql: "quanly",
};
