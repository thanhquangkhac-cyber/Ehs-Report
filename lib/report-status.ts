export interface ReportOverdueInput {
  status: string;
  deadline: string | Date | null;
}

export interface ReportOverdueOutput {
  isOverdue: boolean;
  daysRemaining: number | null;
}

/**
 * Computes is_overdue/days_remaining at read time rather than storing them,
 * so they never drift from `status`/`deadline` after e.g. an admin edits
 * the deadline or marks a report fixed.
 */
export function computeOverdue(
  input: ReportOverdueInput,
  now: Date = new Date()
): ReportOverdueOutput {
  if (!input.deadline) {
    return { isOverdue: false, daysRemaining: null };
  }

  const deadlineDate = new Date(input.deadline);
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysRemaining = Math.ceil((deadlineDate.getTime() - now.getTime()) / msPerDay);

  const isOverdue = input.status !== "fixed" && now.getTime() > deadlineDate.getTime();

  return { isOverdue, daysRemaining };
}

/** deadline = approval time + 7 days, matching the reference app's default. */
export function computeDeadline(approvedDate: Date): Date {
  const deadline = new Date(approvedDate);
  deadline.setDate(deadline.getDate() + 7);
  return deadline;
}
