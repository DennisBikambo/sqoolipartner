/**
 * Shared formatter utilities used across sections and components.
 */

/**
 * Format a monetary amount in KES using Intl.NumberFormat.
 */
export const formatCurrency = (amount: number | undefined): string => {
  if (amount === undefined) return "KES 0.00";
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format a date string or timestamp into a human-readable string.
 */
export const formatDate = (timestamp: number | string | undefined): string => {
  if (timestamp === undefined) return "";
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Get initials from a full name string.
 */
export const getInitials = (name: string = ""): string =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

/**
 * Get a deterministic avatar background color class from a name string.
 */
export const getAvatarColor = (name: string): string => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-orange-500",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

/**
 * Map a transaction/withdrawal status string to a Badge variant.
 */
export const getStatusBadgeVariant = (
  status: string
): "default" | "secondary" | "outline" | "destructive" => {
  switch (status.toLowerCase()) {
    case "verified":
    case "completed":
    case "success":
      return "default";
    case "pending":
      return "secondary";
    case "processing":
      return "outline";
    case "failed":
    case "rejected":
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
};
