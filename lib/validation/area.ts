import { z } from "zod";

export const areaInputSchema = z.object({
  xuong: z.string().trim().min(1).max(128),
  khuVuc: z.string().trim().min(1).max(128),
  phuTrach: z.string().trim().max(128).optional().nullable(),
});

export type AreaInput = z.infer<typeof areaInputSchema>;

/** Vietnamese header aliases -> canonical field name for the area bulk import. */
export const AREA_IMPORT_COLS: Record<string, string> = {
  xuong: "xuong",
  "xưởng": "xuong",
  khu_vuc: "khuVuc",
  "khu vực": "khuVuc",
  "khu vuc": "khuVuc",
  phu_trach: "phuTrach",
  "phụ trách": "phuTrach",
  "phu trach": "phuTrach",
};
