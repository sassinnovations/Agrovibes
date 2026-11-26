export function listingStatusText(status: string) {
  const value = String(status || "").toLowerCase();
  if (value === "approved") return "Available";
  if (value === "rejected" || value === "unpublished") return "Rejected";
  return "Waiting for approval";
}
