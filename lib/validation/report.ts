import { z } from "zod";

export const reportSubmitSchema = z.object({
  maNv: z.string().trim().min(1).max(32),
  hoTen: z.string().trim().min(1).max(128),
  boPhan: z.string().trim().max(128).optional().nullable(),
  xuong: z.string().trim().min(1).max(128),
  viTri: z.string().trim().min(1).max(255),
  noiDung: z.string().trim().min(1),
  hinhAnh: z.string().trim().max(512).optional().nullable(),
});

export const reportApproveSchema = z.object({
  category: z.string().trim().min(1).max(128),
  goldenRule: z.string().trim().min(1).max(128),
  severity: z.enum(["low", "medium", "high", "critical"]),
  area: z.string().trim().min(1).max(128),
  nguoiKp: z.string().trim().min(1).max(128),
  nguoiKpMaNv: z.string().trim().max(32).optional().nullable(),
  nkpChucVu: z.string().trim().max(128).optional().nullable(),
  nkpEmail: z.string().trim().email().max(191).optional().nullable().or(z.literal("")),
  deadline: z.string().trim().min(1), // ISO date string from the approve form
});

export const reportRejectSchema = z.object({
  rejectReason: z.string().trim().max(1000).optional().nullable(),
});

export const reportFixSchema = z.object({
  fixer: z.string().trim().min(1).max(128),
  fixNote: z.string().trim().min(1),
  fixImg: z.string().trim().max(512).min(1),
});

export const reportEditSchema = z.object({
  hoTen: z.string().trim().min(1).max(128).optional(),
  boPhan: z.string().trim().max(128).optional().nullable(),
  xuong: z.string().trim().min(1).max(128).optional(),
  viTri: z.string().trim().min(1).max(255).optional(),
  noiDung: z.string().trim().min(1).optional(),
  hinhAnh: z.string().trim().max(512).optional().nullable(),
  category: z.string().trim().max(128).optional().nullable(),
  goldenRule: z.string().trim().max(128).optional().nullable(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional().nullable(),
  area: z.string().trim().max(128).optional().nullable(),
  nguoiKp: z.string().trim().max(128).optional().nullable(),
  nkpChucVu: z.string().trim().max(128).optional().nullable(),
  nkpEmail: z.string().trim().max(191).optional().nullable(),
  deadline: z.string().trim().optional().nullable(),
  status: z.enum(["pending", "approved", "rejected", "fixed"]).optional(),
});
