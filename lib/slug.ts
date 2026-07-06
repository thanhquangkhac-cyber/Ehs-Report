/**
 * Generates the `ma_qr` code for a workshop (xuong) + area (khu_vuc) pair.
 * Ported from the reference app's client-side genQRCode() to keep generated
 * codes stable/compatible if data is ever cross-referenced with the old system.
 */

// Strip combining diacritical marks (U+0300-U+036F) left behind after NFD
// normalization, then fold the Vietnamese đ/Đ (which NFD does not decompose).
function removeDiacritics(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d") // đ
    .replace(/Đ/g, "D"); // Đ
}

function xuongCode(xuong: string): string {
  const x = removeDiacritics(xuong);
  if (x.includes("-")) {
    const [prefixRaw, suffixRaw = ""] = x.split("-");
    const prefix = prefixRaw.trim().replace(/\s+/g, "");
    const suffix = suffixRaw.trim().replace(/\s+/g, "");
    return `${prefix}-${suffix}`;
  }
  return x.replace(/[^A-Za-z0-9]/g, "");
}

function khuVucCode(khuVuc: string): string {
  const k = removeDiacritics(khuVuc);
  const words = k.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 2) {
    return words.join("").replace(/[^A-Za-z0-9]/g, "");
  }
  return words.map((w) => (w[0] ? w[0].toUpperCase() : "")).join("");
}

export function generateMaQr(xuong: string, khuVuc: string): string {
  return `QR-${xuongCode(xuong)}-${khuVucCode(khuVuc)}`;
}
