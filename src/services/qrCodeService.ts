interface QRCodeOptions {
  size?: string; // e.g., "300x300"
  format?: "png" | "svg";
  margin?: number;
  errorCorrection?: "L" | "M" | "Q" | "H";
}

/**
 * Generate QR Code using QR Server API
 * Free tier: Unlimited requests
 * Docs: https://goqr.me/api/
 */
export async function generateQRCode(
  data: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const {
    size = "300x300",
    format = "png",
    margin = 2,
    errorCorrection = "M",
  } = options;

  const encodedData = encodeURIComponent(data);
  
  // Using QR Server API (goqr.me)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}&data=${encodedData}&margin=${margin}&format=${format}&ecc=${errorCorrection}`;

  return qrUrl;
}

/**
 * Alternative: Using Quickchart.io API
 * Free tier: 500,000 requests/month
 * Returns base64 encoded image
 */
export async function generateQRCodeQuickchart(
  data: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const { size = "300" } = options;
  
  const encodedData = encodeURIComponent(data);
  const qrUrl = `https://quickchart.io/qr?text=${encodedData}&size=${size}`;

  return qrUrl;
}

/**
 * Alternative: Generate QR Code and get base64 image
 * Useful if you want to store the image data directly
 */
export async function generateQRCodeBase64(
  data: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const { size = "300" } = options;
  const encodedData = encodeURIComponent(data);
  
  try {
    // Using quickchart.io to get base64
    const response = await fetch(
      `https://quickchart.io/qr?text=${encodedData}&size=${size}`
    );
    
    if (!response.ok) {
      throw new Error(`QR Code generation failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove the "data:*/*;base64," prefix
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(new Blob([arrayBuffer]));
    });

    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error("QR Code generation error:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Generate WhatsApp QR Code for campaigns
 */
export async function generateWhatsAppQRCode(
  whatsappNumber: string,
  promoCode: string,
  campaignName?: string
): Promise<string> {
  // Format WhatsApp number (remove +)
  const formattedNumber = whatsappNumber.replace(/\+/g, '');
  
  // Create WhatsApp message
  const message = campaignName 
    ? `Hi! I'm interested in ${campaignName}. My promo code is: ${promoCode}`
    : `Hi! I'm interested in your campaign. Promo code: ${promoCode}`;
  
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
  
  // Generate QR code URL
  return await generateQRCode(whatsappUrl, { size: "400x400", errorCorrection: "H" });
}

/**
 * Generate Campaign Landing Page QR Code
 */
export async function generateCampaignQRCode(promoCode: string): Promise<string> {
  const campaignUrl = `https://sqooli.co/campaign?code=${promoCode}`;
  return await generateQRCode(campaignUrl, { size: "400x400", errorCorrection: "H" });
}

/**
 * Generate Payment Instructions QR Code
 */
export async function generatePaymentQRCode(
  paybill: string,
  amount: number,
  promoCode: string
): Promise<string> {
  const paymentInfo = `Paybill: ${paybill}\nAmount: KES ${amount}\nPromo Code: ${promoCode}\n\nSteps:\n1. Go to M-PESA\n2. Lipa na M-PESA\n3. Paybill\n4. Enter ${paybill}\n5. Account: Transaction ID\n6. Amount: ${amount}`;
  
  return await generateQRCode(paymentInfo, { size: "400x400", errorCorrection: "H" });
}


export function socialPostGenerator({
  campaignName,
  promoCode,
  whatsappNumber,
  programName,
  cloudName = "dh50yueq2", // your Cloudinary name
}: {
  campaignName: string;
  promoCode: string;
  whatsappNumber: string;
  programName: string;
  cloudName?: string;
}): string {
  // Base Cloudinary URL
  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;

  // Gradient background styling
  const background = "b_gradient:linear,colors:667eea:764ba2";

  // Layered transformations (fonts, layout, colors)
  const transformations = [
    "w_1080,h_1080,c_fill,q_auto,f_auto",        // quality + auto-format
    background,                                  // gradient base
    "r_60,bo_5px_solid_white,pad_60",            // rounded border
    // Program name (top)
    `l_text:Montserrat_70_bold:${encodeURIComponent(programName)},co_rgb:ffffff,g_north,y_250`,
    // Campaign name (middle)
    `l_text:Montserrat_50_bold:${encodeURIComponent(campaignName)},co_rgb:FFD700,g_center,y_-100`,
    // Promo code (center)
    `l_text:Montserrat_90_bold:${encodeURIComponent(promoCode)},co_rgb:ffffff,g_center`,
    // Separator line
    "l_text:Arial_50:-----------------------------,co_rgb:ffffff,g_center,y_80",
    // WhatsApp number (bottom)
    `l_text:Montserrat_45:${encodeURIComponent("WhatsApp: " + whatsappNumber)},co_rgb:25D366,g_south,y_150`,
    // CTA (bottom text)
    `l_text:Montserrat_35:${encodeURIComponent("Join now and start learning!")},co_rgb:ffffff,g_south,y_70`,
  ].join("/");

  /**
   * Optional background image
   * You can upload your own image in Cloudinary and replace this with its public ID.
   * Example: "v1655220561/samples/cloudinary-group.jpg"
   */
  const backgroundImage = "v1655220561/samples/cloudinary-group.jpg"; // ✅ this exists in all accounts

  // Fallback: if the background image fails to load, just use the gradient
  const posterUrl = `${baseUrl}/${transformations}/${backgroundImage}`;

  return posterUrl;
}

