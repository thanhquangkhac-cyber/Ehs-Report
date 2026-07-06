import { z } from "zod";

const checklistValue = z.enum(["dat", "khong_dat"]);

export const gembaSubmitSchema = z.object({
  maQr: z.string().trim().min(1).max(64),
  xuong: z.string().trim().min(1).max(128),
  khuVuc: z.string().trim().min(1).max(128),
  phuTrach: z.string().trim().max(128).optional().nullable(),

  maNv: z.string().trim().min(1).max(32),
  hoTen: z.string().trim().min(1).max(128),
  boPhan: z.string().trim().max(128).optional().nullable(),

  interlock: checklistValue,
  checan: checklistValue,
  tudien: checklistValue,
  s5Moitruong: checklistValue,
  coSuCo: z.boolean().default(false),
  ghiChu: z.string().trim().max(2000).optional().nullable(),
});

export const gembaEditSchema = gembaSubmitSchema.partial();
