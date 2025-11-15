export const maskPhoneNumber = (phone: string) => {
  if (!phone) return "";
  // Example output: "07****234"
  return phone.slice(0, 2) + "****" + phone.slice(-3);
};