

/**
 * Generate a visually appealing social poster using Cloudinary.
 * 🎨 Features:
 * - Gradient background
 * - Rounded card effect
 * - Brand-style typography hierarchy
 * - Auto-optimized quality
 * - Works both in frontend & Convex server
 */

export function socialPostGenerator({
  campaignName,
  promoCode,
  whatsappNumber,
  programName,
  cloudName =  "dh50yueq2", 
}: {
  campaignName: string;
  promoCode: string;
  whatsappNumber: string;
  programName: string;
  cloudName?: string;
}): string {
  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;

  // Background gradient style
  const background = "b_gradient:linear,colors:667eea:764ba2";

  // Transformations for text and layout
  const transformations = [
    "w_1080,h_1080,c_fill,q_auto,f_auto,fl_layer_apply",
    background,
    "r_60,bo_5px_solid_white,pad_60", // rounded card border
    `l_text:Montserrat_70_bold:${encodeURIComponent(programName)},co_rgb:ffffff,g_north,y_300`,
    `l_text:Montserrat_50_bold:${encodeURIComponent(campaignName)},co_rgb:FFD700,g_center,y_-80`,
    `l_text:Montserrat_90_bold:${encodeURIComponent(promoCode)},co_rgb:ffffff,g_center`,
    "l_text:Arial_50:-----------------------------,co_rgb:ffffff,g_center,y_80",
    `l_text:Montserrat_45:${encodeURIComponent("WhatsApp: " + whatsappNumber)},co_rgb:25D366,g_south,y_120`,
    `l_text:Montserrat_35:Join%20now%20and%20start%20learning!,co_rgb:ffffff,g_south,y_60`,
  ].join("/");

  // Optional abstract background image (upload your own to Cloudinary if preferred)
  const backgroundImage = "v1728000000/abstract_shapes_bg.jpg";

  return `${baseUrl}/${transformations}/${backgroundImage}`;
}
