export const isComplaintOverdue = (
  createdAt: string,
  status: string,
  resolvedAt?: string | null
): boolean => {
  if (status === "resolved") return false;
  
  const created = new Date(createdAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  
  return hoursDiff > 48; // 48 hour SLA
};

export const getOverdueHours = (createdAt: string): number => {
  const created = new Date(createdAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  
  return Math.max(0, hoursDiff - 48);
};
