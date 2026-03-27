import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PosterParams {
  campaignName: string;
  programName: string;
  promoCode: string;
  qrCodeDataUrl?: string; // should point to https://sqooli.com
}

// ── djb2 hash ─────────────────────────────────────────────────────────────────

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0;
  return h;
}

// ── 6 color palettes — one per campaign ──────────────────────────────────────

interface Palette {
  block1: string; // top-right block
  block2: string; // bottom-left block
  accent: string; // checkmarks, sub-headline, badges
  hi: string;     // promo code text, "SQOOLI" label
}

const PALETTES: Palette[] = [
  { block1: "#F5C518", block2: "#C41E2A", accent: "#C41E2A", hi: "#F5C518" }, // Crimson Gold
  { block1: "#29B6F6", block2: "#0D47A1", accent: "#0D47A1", hi: "#29B6F6" }, // Ocean Blue
  { block1: "#66BB6A", block2: "#1B5E20", accent: "#1B5E20", hi: "#66BB6A" }, // Forest Green
  { block1: "#FFB300", block2: "#4A148C", accent: "#4A148C", hi: "#FFB300" }, // Amber Purple
  { block1: "#F06292", block2: "#880E4F", accent: "#880E4F", hi: "#F06292" }, // Rose Pink
  { block1: "#FFC107", block2: "#1A237E", accent: "#1A237E", hi: "#FFC107" }, // Navy Gold
];

function getPalette(promoCode: string): Palette {
  return PALETTES[hash(promoCode + ":palette") % PALETTES.length];
}

// ── Color helper used by CampaignDetails.tsx for placeholder preview ──────────

export function getPosterColorsFromPromoCode(promoCode: string) {
  const p = getPalette(promoCode);
  return { bg: "#FFFFFF", card: p.block2 + "14", accent: p.accent, hi: p.hi, muted: p.block2 + "0a" };
}

// ── 10 education-themed Unsplash photo IDs ────────────────────────────────────
// Each is a royalty-free photo; selection is deterministic per campaign.

const PHOTO_IDS = [
  "1523050854058-8df90110c9f1", // student at laptop
  "1427504494785-3a9ca7044f45", // classroom, raised hands
  "1509062522246-3755977927d7", // open books on desk
  "1580582932707-520aed937b7b", // diverse students studying
  "1488521787991-ed7bbaae773c", // graduation ceremony
  "1529156069898-49953e39b3ac", // university students
  "1434030216411-0b3a34ae7a53", // teacher and student
  "1503676260728-1c00da094a0b", // education concept
  "1456513080510-7bf3a84b82f8", // student at desk
  "1497633762265-9d179a990aa6", // school setting
];

function getPhotoId(promoCode: string): string {
  return PHOTO_IDS[hash(promoCode + ":photo") % PHOTO_IDS.length];
}

// ── Load external image and convert to base64 data URL ───────────────────────
// html2canvas renders data URLs reliably even without CORS proxying.

async function loadPhotoAsDataUrl(photoId: string): Promise<string | null> {
  const url =
    `https://images.unsplash.com/photo-${photoId}` +
    `?w=320&h=430&fit=crop&crop=faces,center&auto=format&q=80`;

  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => resolve(null), 9000);

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      clearTimeout(timeoutId);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 320;
        canvas.height = img.naturalHeight || 430;
        canvas.getContext("2d")!.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      resolve(null);
    };

    img.src = url;
  });
}

// ── Headline splitting ────────────────────────────────────────────────────────

function splitHeadline(name: string): [string, string] {
  const t = name.trim();
  if (t.length <= 11) return [t, ""];
  const sp = t.lastIndexOf(" ", 12);
  if (sp > 0) return [t.slice(0, sp), t.slice(sp + 1, sp + 15)];
  return [t.slice(0, 11), t.slice(11, 22)];
}

function splitSubHeadline(name: string): [string, string] {
  const words = name.trim().split(/\s+/);
  return [
    words.slice(0, 2).join(" "),
    words.length > 2 ? words.slice(2, 4).join(" ") : "",
  ];
}

// ── Dot-grid texture ──────────────────────────────────────────────────────────

function dotGrid(color: string, cols: number, rows: number, spacing = 18): string {
  let dots = "";
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      dots += `<circle cx="${c * spacing + spacing / 2}" cy="${r * spacing + spacing / 2}" r="2" fill="${color}"/>`;
  return `<svg width="${cols * spacing}" height="${rows * spacing}" xmlns="http://www.w3.org/2000/svg">${dots}</svg>`;
}

// ── Feature list item ─────────────────────────────────────────────────────────

function featureItem(text: string, accent: string): string {
  return `<div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;">
    <div style="width:30px;height:30px;border-radius:50%;background:${accent};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
      <svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
        <polyline points="2,7 5.5,10.5 12,4" stroke="white" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <span style="color:#333333;font-weight:600;font-size:15px;font-family:'Poppins','Montserrat',Arial,sans-serif;line-height:1.3;">${text}</span>
  </div>`;
}

// ── Floating school objects ───────────────────────────────────────────────────

function floatingBook(accent: string): string {
  return `<svg width="112" height="90" viewBox="0 0 112 90" xmlns="http://www.w3.org/2000/svg"
    style="filter:drop-shadow(3px 5px 10px rgba(0,0,0,0.22));">
  <rect x="6" y="4" width="100" height="82" rx="6" fill="${accent}"/>
  <rect x="6" y="4" width="13" height="82" rx="5" fill="rgba(0,0,0,0.2)"/>
  <line x1="24" y1="22" x2="100" y2="22" stroke="rgba(255,255,255,0.48)" stroke-width="2"/>
  <line x1="24" y1="36" x2="100" y2="36" stroke="rgba(255,255,255,0.48)" stroke-width="2"/>
  <line x1="24" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.48)" stroke-width="2"/>
  <line x1="24" y1="64" x2="84"  y2="64" stroke="rgba(255,255,255,0.48)" stroke-width="2"/>
</svg>`;
}

function floatingPencil(hi: string): string {
  return `<svg width="24" height="122" viewBox="0 0 24 122" xmlns="http://www.w3.org/2000/svg"
    style="filter:drop-shadow(2px 4px 8px rgba(0,0,0,0.2));">
  <rect x="3" y="8" width="18" height="86" rx="2" fill="${hi}"/>
  <rect x="3" y="6" width="18" height="14" rx="3" fill="rgba(0,0,0,0.15)"/>
  <rect x="4" y="4" width="16" height="9"  rx="2" fill="rgba(0,0,0,0.22)"/>
  <polygon points="3,94 21,94 12,116" fill="${hi}"/>
  <polygon points="7,104 17,104 12,116" fill="#D4956A"/>
  <polygon points="10,112 14,112 12,116" fill="#1a1a1a"/>
  <line x1="10" y1="8" x2="10" y2="94" stroke="rgba(0,0,0,0.07)" stroke-width="1"/>
</svg>`;
}

function floatingGradCap(accent: string, hi: string): string {
  return `<svg width="92" height="74" viewBox="0 0 92 74" xmlns="http://www.w3.org/2000/svg"
    style="filter:drop-shadow(2px 4px 10px rgba(0,0,0,0.22));">
  <polygon points="46,8 90,28 46,48 2,28" fill="#1a1a1a"/>
  <rect x="37" y="26" width="18" height="36" rx="2" fill="#333"/>
  <rect x="35" y="60" width="22" height="8"  rx="4" fill="#333"/>
  <line x1="90" y1="28" x2="90" y2="50" stroke="${hi}" stroke-width="2.5"/>
  <circle cx="90" cy="52" r="5" fill="${hi}"/>
  <line x1="85" y1="52" x2="85" y2="66" stroke="${hi}" stroke-width="1.5"/>
  <line x1="90" y1="52" x2="90" y2="68" stroke="${hi}" stroke-width="1.5"/>
  <line x1="95" y1="52" x2="95" y2="66" stroke="${hi}" stroke-width="1.5"/>
  <polygon points="46,8 90,28 46,48 2,28" fill="${accent}" opacity="0.18"/>
</svg>`;
}

function floatingLightbulb(hi: string): string {
  return `<svg width="52" height="68" viewBox="0 0 52 68" xmlns="http://www.w3.org/2000/svg"
    style="filter:drop-shadow(0 0 14px rgba(245,197,24,0.55));">
  <circle cx="26" cy="24" r="20" fill="${hi}"/>
  <path d="M16 40 Q16 48 26 50 Q36 48 36 40" fill="${hi}"/>
  <rect x="18" y="50" width="16" height="5" rx="2" fill="rgba(0,0,0,0.18)"/>
  <rect x="19" y="56" width="14" height="5" rx="2" fill="rgba(0,0,0,0.22)"/>
  <rect x="21" y="62" width="10" height="5" rx="2.5" fill="rgba(0,0,0,0.28)"/>
  <circle cx="18" cy="17" r="5" fill="rgba(255,255,255,0.5)"/>
  <circle cx="26" cy="11" r="3" fill="rgba(255,255,255,0.38)"/>
</svg>`;
}

// ── Photo frame (replaces student illustration) ───────────────────────────────

function photoFrame(dataUrl: string, block2: string): string {
  if (dataUrl) {
    return `<div style="
      position:absolute;bottom:88px;left:22px;
      width:278px;height:380px;
      border-radius:18px;
      border:5px solid white;
      overflow:hidden;
      box-shadow:0 10px 30px rgba(0,0,0,0.30);
      z-index:2;
    ">
      <img src="${dataUrl}" style="width:100%;height:100%;object-fit:cover;display:block;" crossorigin="anonymous"/>
    </div>`;
  }
  // fallback: colored gradient block with pattern
  return `<div style="
    position:absolute;bottom:88px;left:22px;
    width:278px;height:380px;
    border-radius:18px;
    border:5px solid white;
    overflow:hidden;
    box-shadow:0 10px 30px rgba(0,0,0,0.30);
    background:linear-gradient(160deg,${block2}cc,${block2});
    display:flex;align-items:center;justify-content:center;
    z-index:2;
  ">
    <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="28" r="18" fill="rgba(255,255,255,0.35)"/>
      <path d="M10 72 Q10 52 40 52 Q70 52 70 72" fill="rgba(255,255,255,0.35)"/>
    </svg>
  </div>`;
}

// ── QR code card (replaces GET STARTED button) ────────────────────────────────

function qrCard(qrDataUrl: string | undefined): string {
  if (!qrDataUrl) {
    return `<div style="
      position:absolute;bottom:106px;right:46px;
      background:white;border-radius:12px;padding:14px;
      box-shadow:0 4px 16px rgba(0,0,0,0.15);
      display:flex;flex-direction:column;align-items:center;gap:6px;
      z-index:3;
    ">
      <div style="width:120px;height:120px;background:#f0f0f0;border-radius:8px;display:flex;align-items:center;justify-content:center;">
        <span style="color:#999;font-size:11px;font-family:Arial,sans-serif;">sqooli.com</span>
      </div>
      <div style="color:#666;font-size:11px;font-weight:600;font-family:'Montserrat',Arial,sans-serif;letter-spacing:0.4px;">sqooli.com</div>
    </div>`;
  }
  return `<div style="
    position:absolute;bottom:106px;right:46px;
    background:white;border-radius:12px;padding:14px;
    box-shadow:0 6px 20px rgba(0,0,0,0.16);
    display:flex;flex-direction:column;align-items:center;gap:7px;
    z-index:3;
  ">
    <img src="${qrDataUrl}" style="width:120px;height:120px;display:block;border-radius:6px;" />
    <div style="color:#555;font-size:11px;font-weight:700;font-family:'Montserrat',Arial,sans-serif;letter-spacing:0.6px;text-transform:uppercase;">Scan to visit</div>
    <div style="color:#1a1a1a;font-size:13px;font-weight:800;font-family:'Montserrat',Arial,sans-serif;letter-spacing:-0.2px;">sqooli.com</div>
  </div>`;
}

// ── Font loader ───────────────────────────────────────────────────────────────

async function ensureFontsLoaded(): Promise<void> {
  if (!document.querySelector("#sqooli-poster-fonts")) {
    const link = document.createElement("link");
    link.id = "sqooli-poster-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Poppins:wght@400;600&display=swap";
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  }
  await Promise.race([
    document.fonts.ready,
    new Promise<void>((r) => setTimeout(r, 2500)),
  ]);
}

// ── HTML escaping ──────────────────────────────────────────────────────────────

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Main generator ────────────────────────────────────────────────────────────

export async function generateCampaignPosterDataUrl(params: PosterParams): Promise<string> {
  const { campaignName, programName, promoCode, qrCodeDataUrl } = params;

  const palette = getPalette(promoCode);
  const { block1, block2, accent, hi } = palette;

  const [headLine1Raw, headLine2Raw] = splitHeadline(campaignName);
  const [subLine1Raw, subLine2Raw] = splitSubHeadline(programName);
  const headLine1 = escHtml(headLine1Raw);
  const headLine2 = headLine2Raw ? escHtml(headLine2Raw) : headLine2Raw;
  const subLine1 = escHtml(subLine1Raw);
  const subLine2 = subLine2Raw ? escHtml(subLine2Raw) : subLine2Raw;
  const safePromoCode = escHtml(promoCode);

  const photoId = getPhotoId(promoCode);

  // Load everything in parallel
  const [, photoDataUrl] = await Promise.all([
    ensureFontsLoaded(),
    loadPhotoAsDataUrl(photoId),
  ]);

  const html = `
<div style="
  width:1080px;height:1080px;
  background:#FFFFFF;
  font-family:'Montserrat','Arial Black',Arial,sans-serif;
  position:relative;overflow:hidden;
  box-sizing:border-box;
">

  <!-- ── Colour blocks ── -->
  <div style="position:absolute;top:0;right:0;width:565px;height:465px;background:${block1};border-radius:0 0 0 248px;z-index:0;"></div>
  <div style="position:absolute;bottom:0;left:0;width:510px;height:510px;background:${block2};border-radius:0 268px 0 0;z-index:0;"></div>

  <!-- ── Dot-grid textures ── -->
  <div style="position:absolute;top:330px;right:28px;opacity:0.11;z-index:1;">${dotGrid(accent, 7, 7)}</div>
  <div style="position:absolute;top:52px;left:355px;opacity:0.10;z-index:1;">${dotGrid(block1, 5, 5)}</div>
  <div style="position:absolute;bottom:100px;right:36px;opacity:0.09;z-index:1;">${dotGrid("#1a1a1a", 6, 4)}</div>

  <!-- ── Floating school objects ── -->
  <div style="position:absolute;top:50px;right:80px;transform:rotate(-12deg);z-index:2;">${floatingBook(accent)}</div>
  <div style="position:absolute;top:386px;right:22px;transform:rotate(25deg);z-index:2;">${floatingPencil(hi)}</div>
  <div style="position:absolute;top:30px;left:44%;transform:translateX(-50%) rotate(-8deg);z-index:2;">${floatingGradCap(accent, hi)}</div>
  <div style="position:absolute;top:488px;right:206px;z-index:2;">${floatingLightbulb(hi)}</div>

  <!-- ── Photo (replaces student illustration) ── -->
  ${photoFrame(photoDataUrl ?? "", block2)}

  <!-- ── Top bar: logo + LIMITED OFFER ── -->
  <div style="position:absolute;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:34px 46px;z-index:3;">
    <div style="display:flex;align-items:center;gap:11px;">
      <div style="width:40px;height:40px;background:white;border-radius:11px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,0.14);">
        <span style="color:#7C3AED;font-size:22px;font-weight:900;font-family:'Montserrat',Arial,sans-serif;line-height:1;">S</span>
      </div>
      <span style="color:#1a1a1a;font-size:20px;font-weight:800;font-family:'Montserrat',Arial,sans-serif;letter-spacing:-0.3px;">sqooli</span>
    </div>
    <div style="background:${accent};color:white;font-size:12px;font-weight:800;letter-spacing:1.4px;padding:10px 20px;border-radius:8px;font-family:'Montserrat',Arial,sans-serif;text-transform:uppercase;">LIMITED OFFER</div>
  </div>

  <!-- ── Left content: headlines + body ── -->
  <div style="position:absolute;top:158px;left:46px;width:488px;z-index:3;">
    <div style="color:#999;font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;font-family:'Montserrat',Arial,sans-serif;">School Program</div>
    <div style="color:#1a1a1a;font-size:72px;font-weight:900;line-height:0.96;letter-spacing:-2.5px;font-family:'Montserrat','Arial Black',Arial,sans-serif;margin-bottom:10px;">
      ${headLine1}${headLine2 ? `<br>${headLine2}` : ""}
    </div>
    <div style="color:${accent};font-size:38px;font-weight:800;line-height:1.08;letter-spacing:-0.8px;font-family:'Montserrat','Arial Black',Arial,sans-serif;margin-bottom:22px;">
      ${subLine1}${subLine2 ? `<br>${subLine2}` : ""}
    </div>
    <div style="color:#666666;font-size:16px;line-height:1.72;max-width:365px;font-family:'Poppins','Montserrat',Arial,sans-serif;font-weight:400;">
      Join our certified learning program and grow your skills with expert guidance — start anytime.
    </div>
  </div>

  <!-- ── Right content: features list ── -->
  <div style="position:absolute;top:228px;right:46px;width:345px;z-index:3;">
    ${featureItem("Quality instruction from experts", accent)}
    ${featureItem("Certified learning programs", accent)}
    ${featureItem("Flexible class schedules", accent)}
    ${featureItem("Personalized learning paths", accent)}
    ${featureItem("Start anytime, grow daily", accent)}
  </div>

  <!-- ── Brand label on red/coloured block ── -->
  <div style="position:absolute;bottom:185px;left:318px;z-index:3;">
    <div style="color:${hi};font-size:24px;font-weight:900;letter-spacing:3.5px;font-family:'Montserrat',Arial,sans-serif;text-transform:uppercase;line-height:1;">SQOOLI</div>
    <div style="color:rgba(255,255,255,0.82);font-size:13px;font-weight:400;font-family:'Poppins',Arial,sans-serif;margin-top:4px;letter-spacing:0.3px;">School Program · sqooli.com</div>
  </div>

  <!-- ── QR code card (sqooli.com) — replaces GET STARTED ── -->
  ${qrCard(qrCodeDataUrl)}

  <!-- ── Bottom bar ── -->
  <div style="position:absolute;bottom:0;left:0;right:0;height:88px;background:#1a1a1a;display:flex;align-items:center;padding:0 52px;z-index:4;">
    <div style="display:flex;flex-direction:column;justify-content:center;flex:1;min-width:0;">
      <div style="color:#888888;font-size:10px;font-weight:700;letter-spacing:2.2px;text-transform:uppercase;margin-bottom:5px;font-family:'Montserrat',Arial,sans-serif;">Promo Code</div>
      <div style="color:${hi};font-size:22px;font-weight:800;letter-spacing:2.5px;font-family:'Montserrat',Arial,sans-serif;white-space:nowrap;">${safePromoCode}</div>
    </div>
    <div style="width:1px;height:50px;background:rgba(255,255,255,0.16);margin:0 34px;flex-shrink:0;"></div>
    <div style="display:flex;flex-direction:column;justify-content:center;flex:2;min-width:0;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:5px;">
        <div style="background:#4CAF50;color:white;font-size:10px;font-weight:800;letter-spacing:1.2px;padding:3px 10px;border-radius:4px;font-family:'Montserrat',Arial,sans-serif;white-space:nowrap;">M-PESA</div>
        <span style="color:#888888;font-size:11px;font-family:'Poppins',Arial,sans-serif;">Pay via M-Pesa</span>
      </div>
      <div style="color:white;font-size:14px;font-family:'Poppins',Arial,sans-serif;white-space:nowrap;">
        Paybill <strong style="color:${hi};">247247</strong>&nbsp;&nbsp;·&nbsp;&nbsp;Account <strong style="color:${hi};">${safePromoCode}</strong>
      </div>
    </div>
    <div style="width:1px;height:50px;background:rgba(255,255,255,0.16);margin:0 34px;flex-shrink:0;"></div>
    <div style="color:#888888;font-size:14px;font-weight:600;font-family:'Montserrat',Arial,sans-serif;white-space:nowrap;">sqooli.com</div>
  </div>

</div>`;

  const wrap = document.createElement("div");
  wrap.style.cssText = "position:fixed;top:-9999px;left:-9999px;z-index:-1;";
  wrap.innerHTML = html;
  document.body.appendChild(wrap);
  const el = wrap.firstElementChild as HTMLElement;

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#FFFFFF",
      logging: false,
    });
    return canvas.toDataURL("image/png");
  } finally {
    document.body.removeChild(wrap);
  }
}

// ── Download helpers ──────────────────────────────────────────────────────────

export function downloadPosterAsPng(dataUrl: string, campaignName: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `${campaignName.replace(/\s+/g, "_")}_poster.png`;
  a.click();
}

export function downloadPosterAsPdf(dataUrl: string, campaignName: string): void {
  const pdf = new jsPDF({ unit: "px", format: [1080, 1080] });
  pdf.addImage(dataUrl, "PNG", 0, 0, 1080, 1080);
  pdf.save(`${campaignName.replace(/\s+/g, "_")}_poster.pdf`);
}
