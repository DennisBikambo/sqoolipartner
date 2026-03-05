import QRCode from "qrcode";

export interface QRCodeOptions {
  width?: number;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  margin?: number;
}

export async function generateQRCode(
  data: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const { width = 300, errorCorrectionLevel = "M", margin = 2 } = options;
  return QRCode.toDataURL(data, { width, errorCorrectionLevel, margin });
}

export async function generateWhatsAppQRCode(
  whatsappNumber: string,
  promoCode: string,
  campaignName?: string
): Promise<string> {
  const formattedNumber = whatsappNumber.replace(/\+/g, "");
  const message = campaignName
    ? `Hi! I'm interested in ${campaignName}. My promo code is: ${promoCode}`
    : `Hi! I'm interested in your campaign. Promo code: ${promoCode}`;
  const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
  return generateQRCode(whatsappUrl, { width: 400, errorCorrectionLevel: "H" });
}

export async function generateCampaignQRCode(promoCode: string): Promise<string> {
  const url = `https://sqooli.co/campaign?code=${promoCode}`;
  return generateQRCode(url, { width: 400, errorCorrectionLevel: "H" });
}

export async function generatePaymentQRCode(
  paybill: string,
  amount: number,
  promoCode: string
): Promise<string> {
  const paymentInfo = `Paybill: ${paybill}\nAmount: KES ${amount}\nPromo Code: ${promoCode}`;
  return generateQRCode(paymentInfo, { width: 400, errorCorrectionLevel: "H" });
}

// NOTE: generateWhatsAppQRCode and generatePaymentQRCode are imported by convex/campaign.ts
// which calls them from a Convex mutation. The `qrcode` npm library uses Node.js / browser
// Canvas APIs that are NOT available in Convex's V8 runtime environment.
// These calls will need to be moved to a Convex action (which runs in Node.js) before
// they will work correctly in the Convex backend.

export function socialPostGenerator({
  campaignName,
  promoCode,
  whatsappNumber,
  programName,
  cloudName = "dh50yueq2",
}: {
  campaignName: string;
  promoCode: string;
  whatsappNumber: string;
  programName: string;
  cloudName?: string;
}): string {
  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;
  const background = "b_gradient:linear,colors:667eea:764ba2";
  const transformations = [
    "w_1080,h_1080,c_fill,q_auto,f_auto",
    background,
    "r_60,bo_5px_solid_white,pad_60",
    `l_text:Montserrat_70_bold:${encodeURIComponent(programName)},co_rgb:ffffff,g_north,y_250`,
    `l_text:Montserrat_50_bold:${encodeURIComponent(campaignName)},co_rgb:FFD700,g_center,y_-100`,
    `l_text:Montserrat_90_bold:${encodeURIComponent(promoCode)},co_rgb:ffffff,g_center`,
    "l_text:Arial_50:-----------------------------,co_rgb:ffffff,g_center,y_80",
    `l_text:Montserrat_45:${encodeURIComponent("WhatsApp: " + whatsappNumber)},co_rgb:25D366,g_south,y_150`,
    `l_text:Montserrat_35:${encodeURIComponent("Join now and start learning!")},co_rgb:ffffff,g_south,y_70`,
  ].join("/");
  const backgroundImage = "v1655220561/samples/cloudinary-group.jpg";
  const posterUrl = `${baseUrl}/${transformations}/${backgroundImage}`;
  return posterUrl;
}
