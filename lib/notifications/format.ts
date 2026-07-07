export type FormattedMessage = {
  title: string;
  lines: string[];
  url?: string;
};

function reportUrl(id: number): string {
  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  return `${baseUrl}/reports/${id}`;
}

const SEVERITY_LABEL: Record<string, string> = {
  low: "Thap",
  medium: "Trung binh",
  high: "Cao",
  critical: "Nghiem trong",
};

export function formatBaocaoMoi(p: {
  id: number;
  hoTen: string;
  xuong: string;
  viTri: string;
  noiDung?: string;
  severity?: string | null;
}): FormattedMessage {
  const lines = [
    `Nguoi bao cao: ${p.hoTen}`,
    `Xuong: ${p.xuong}`,
    `Vi tri: ${p.viTri}`,
  ];
  if (p.severity) lines.push(`Muc do: ${SEVERITY_LABEL[p.severity] ?? p.severity}`);
  if (p.noiDung) lines.push(`Noi dung: ${p.noiDung}`);
  return {
    title: `Bao cao moi #${p.id}`,
    lines,
    url: reportUrl(p.id),
  };
}

export function formatPheDuyet(p: {
  id: number;
  nguoiKp: string;
  nkpEmail?: string | null;
  deadline: string;
  fixLink: string;
}): FormattedMessage {
  const lines = [
    `Nguoi khac phuc: ${p.nguoiKp}`,
    `Han khac phuc: ${new Date(p.deadline).toLocaleDateString("vi-VN")}`,
  ];
  if (p.nkpEmail) lines.push(`Email: ${p.nkpEmail}`);
  lines.push(`Link khac phuc: ${p.fixLink}`);
  return {
    title: `Bao cao #${p.id} da duoc phe duyet`,
    lines,
  };
}

export function formatPheDuyet2(p: {
  id: number;
  hoTen: string;
  maNv: string;
}): FormattedMessage {
  return {
    title: `Bao cao #${p.id} cua ban da duoc phe duyet`,
    lines: [`Nguoi bao cao: ${p.hoTen} (${p.maNv})`],
    url: reportUrl(p.id),
  };
}

export function formatDaKhacPhuc(p: {
  id: number;
  fixer: string;
  hoTen: string;
  fixNote?: string | null;
  fixImg?: string | null;
}): FormattedMessage {
  const lines = [
    `Nguoi khac phuc: ${p.fixer}`,
    `Nguoi bao cao: ${p.hoTen}`,
  ];
  if (p.fixNote) lines.push(`Ghi chu: ${p.fixNote}`);
  return {
    title: `Bao cao #${p.id} da duoc khac phuc`,
    lines,
    url: reportUrl(p.id),
  };
}
