import pptxgen from "pptxgenjs";
import { SupporterCard } from "../types";
import { LAYOUT, COLORS, getFieldFontSize } from "../layout";

// Helper to strip '#' from hex colors for PptxGenJS
const c = (hex: string) => hex.replace("#", "");

// Helper to draw clean vector outline icons using pptx.shapes
function drawIcon(slide: any, iconName: string, x: number, y: number, pptx: any) {
  const size = 0.18;
  const color = c(COLORS.mainBlue);
  const shapes = pptx.shapes || (pptxgen as any).shapes || {};

  if (iconName === "Heart" && shapes.HEART) {
    slide.addShape(shapes.HEART, { x, y: y + 0.01, w: size, h: size, fill: { color }, line: { color, width: 1 } });
  } else if (iconName === "Sparkles" && shapes.STAR) {
    slide.addShape(shapes.STAR, { x, y: y - 0.01, w: size, h: size, fill: { color }, line: { color, width: 1 } });
  } else if (iconName === "Target" && shapes.OVAL) {
    slide.addShape(shapes.OVAL, { x, y, w: size, h: size, line: { color, width: 1.5 } });
    slide.addShape(shapes.OVAL, { x: x + 0.05, y: y + 0.05, w: 0.08, h: 0.08, fill: { color } });
  } else if (iconName === "Rocket" && shapes.UP_ARROW) {
    slide.addShape(shapes.UP_ARROW, { x, y, w: size, h: size, fill: { color }, line: { color, width: 1 } });
  } else if (iconName === "User" && shapes.OVAL && shapes.ARC) {
    slide.addShape(shapes.OVAL, { x: x + 0.03, y, w: 0.12, h: 0.12, fill: { color } });
    slide.addShape(shapes.ARC, { x, y: y + 0.1, w: size, h: 0.08, line: { color, width: 1.5 }, flipV: true });
  } else if (iconName === "BookOpen" && shapes.RECTANGLE) {
    slide.addShape(shapes.RECTANGLE, { x, y: y + 0.02, w: size * 0.45, h: size * 0.8, line: { color, width: 1.5 } });
    slide.addShape(shapes.RECTANGLE, { x: x + size * 0.55, y: y + 0.02, w: size * 0.45, h: size * 0.8, line: { color, width: 1.5 } });
  } else if (iconName === "Bookmark" && shapes.RECTANGLE && shapes.TRIANGLE) {
    slide.addShape(shapes.RECTANGLE, { x, y, w: size, h: size * 0.7, fill: { color } });
    slide.addShape(shapes.TRIANGLE, { x, y: y + size * 0.55, w: size, h: size * 0.45, fill: { color }, flipV: true });
  } else if (iconName === "SquareUser" && shapes.ROUNDED_RECTANGLE && shapes.OVAL) {
    slide.addShape(shapes.ROUNDED_RECTANGLE, { x, y, w: size, h: size, line: { color, width: 1.5 } });
    slide.addShape(shapes.OVAL, { x: x + 0.04, y: y + 0.02, w: 0.1, h: 0.1, fill: { color } });
  }
}

export function exportCardsToPptx(cards: SupporterCard[], activeCardId?: string, exportOnlyActive: boolean = false) {
  const cardsToExport = exportOnlyActive && activeCardId
    ? cards.filter(c => c.id === activeCardId)
    : cards;

  if (cardsToExport.length === 0) {
    throw new Error("書き出すカードがありません。");
  }

  const pptx = new pptxgen();

  // Define custom A4 portrait layout
  pptx.defineLayout({
    name: "A4_PORTRAIT",
    width: 8.267,
    height: 11.693
  });
  pptx.layout = "A4_PORTRAIT";

  const shapes = (pptx as any).shapes || (pptxgen as any).shapes || {};

  cardsToExport.forEach((card) => {
    const slide = pptx.addSlide();

    // 1. Draw Page Background (Ivory flat base)
    slide.addShape(shapes.RECTANGLE, {
      x: 0,
      y: 0,
      w: 8.267,
      h: 11.693,
      fill: { color: c(COLORS.bg) }
    });

    // 2. Add Header Texts
    slide.addText("PERSONAL SUPPORT CARD", {
      x: LAYOUT.header.engTitle.x,
      y: LAYOUT.header.engTitle.y,
      w: LAYOUT.header.engTitle.w,
      h: LAYOUT.header.engTitle.h,
      fontSize: 10,
      fontFace: "Noto Sans JP",
      color: c(COLORS.mainBlue),
      bold: true,
      valign: "middle"
    });

    // Supporter Title / Role (称号) - NOW THE MAIN GIANT HEADLINE
    const displayTitle = card.title.trim() || "（称号・一言の役割を入力してください）";
    const { fontSizePt: titleSizePt } = getFieldFontSize("title", card.title);
    slide.addText(displayTitle, {
      x: LAYOUT.header.subTitle.x,
      y: LAYOUT.header.subTitle.y,
      w: LAYOUT.header.subTitle.w,
      h: LAYOUT.header.subTitle.h,
      fontSize: titleSizePt,
      fontFace: "Noto Sans JP",
      color: card.title.trim() ? c(COLORS.mainBlue) : c(COLORS.placeholder),
      bold: true,
      valign: "middle"
    });

    // Supporter Name (Slightly smaller, nested below)
    const displayName = card.name.trim() ? `支援者: ${card.name}` : "（お名前を入力）";
    slide.addText(displayName, {
      x: LAYOUT.header.jpTitle.x,
      y: LAYOUT.header.jpTitle.y,
      w: LAYOUT.header.jpTitle.w,
      h: LAYOUT.header.jpTitle.h,
      fontSize: 14,
      fontFace: "Noto Sans JP",
      color: card.name.trim() ? "1F1F1F" : c(COLORS.placeholder),
      bold: true,
      valign: "middle"
    });

    // Static Tagline Description
    slide.addText("私らしい支援のかたちを、ひと目で伝えるカード", {
      x: LAYOUT.header.tagline.x,
      y: LAYOUT.header.tagline.y,
      w: LAYOUT.header.tagline.w,
      h: LAYOUT.header.tagline.h,
      fontSize: 8.5,
      fontFace: "Noto Sans JP",
      color: "666666",
      bold: true,
      valign: "middle"
    });

    // Right Header Sidebar: PROFILE & CONTACT label
    slide.addText("PROFILE & CONTACT", {
      x: LAYOUT.header.contactHeader.x,
      y: LAYOUT.header.contactHeader.y,
      w: LAYOUT.header.contactHeader.w,
      h: LAYOUT.header.contactHeader.h,
      fontSize: 8.5,
      fontFace: "Noto Sans JP",
      color: c(COLORS.mainBlue),
      bold: true,
      valign: "middle"
    });

    // Underline divider for Profile sidebar
    slide.addShape(shapes.RECTANGLE, {
      x: LAYOUT.header.contactLine.x,
      y: LAYOUT.header.contactLine.y,
      w: LAYOUT.header.contactLine.w,
      h: LAYOUT.header.contactLine.h,
      fill: { color: c(COLORS.mainBlue) },
      line: { color: c(COLORS.mainBlue), width: 0.5 }
    });

    // Affiliation Block
    slide.addText("AFFILIATION", {
      x: LAYOUT.header.affiliation.x,
      y: LAYOUT.header.affiliation.y,
      w: LAYOUT.header.affiliation.w,
      h: 0.15,
      fontSize: 7,
      fontFace: "Noto Sans JP",
      color: c(COLORS.mainBlue),
      bold: true,
      valign: "middle"
    });

    const displayAffil = card.affiliation.trim() || "（所属を入力してください）";
    slide.addText(displayAffil, {
      x: LAYOUT.header.affiliation.x,
      y: LAYOUT.header.affiliation.y + 0.15,
      w: LAYOUT.header.affiliation.w,
      h: 0.38,
      fontSize: 9.5,
      fontFace: "Noto Sans JP",
      color: card.affiliation.trim() ? "1F1F1F" : c(COLORS.placeholder),
      bold: card.affiliation.trim() ? true : false,
      valign: "top"
    });

    // Contact Block
    slide.addText("CONTACT", {
      x: LAYOUT.header.contact.x,
      y: LAYOUT.header.contact.y,
      w: LAYOUT.header.contact.w,
      h: 0.15,
      fontSize: 7,
      fontFace: "Noto Sans JP",
      color: c(COLORS.mainBlue),
      bold: true,
      valign: "middle"
    });

    const displayContact = card.contact.trim() || "（連絡先を入力してください）";
    slide.addText(displayContact, {
      x: LAYOUT.header.contact.x,
      y: LAYOUT.header.contact.y + 0.15,
      w: LAYOUT.header.contact.w,
      h: 0.38,
      fontSize: 8.5,
      fontFace: "Noto Sans JP",
      color: card.contact.trim() ? "1F1F1F" : c(COLORS.placeholder),
      bold: card.contact.trim() ? true : false,
      valign: "top"
    });

    // Created Date top right
    const dateStr = card.createdDate || "";
    let displayDate = "作成日：    年   月   日";
    if (dateStr.includes("-")) {
      const [y, m, d] = dateStr.split("-");
      displayDate = `作成日： ${y} 年 ${m} 月 ${d} 日`;
    } else if (dateStr) {
      displayDate = `作成日： ${dateStr}`;
    }

    slide.addText(displayDate, {
      x: LAYOUT.header.createdDate.x,
      y: LAYOUT.header.createdDate.y,
      w: LAYOUT.header.createdDate.w,
      h: LAYOUT.header.createdDate.h,
      fontSize: 8.5,
      fontFace: "Noto Sans JP",
      color: "666666",
      bold: true,
      align: "right",
      valign: "middle"
    });

    // Header Main Divider Line
    slide.addShape(shapes.RECTANGLE, {
      x: LAYOUT.header.divider.x,
      y: LAYOUT.header.divider.y,
      w: LAYOUT.header.divider.w,
      h: LAYOUT.header.divider.h,
      fill: { color: c(COLORS.mainBlue) },
      line: { color: c(COLORS.mainBlue), width: 0.5 }
    });

    // Column Vertical Divider Line
    slide.addShape(shapes.RECTANGLE, {
      x: LAYOUT.dividerLine.x,
      y: LAYOUT.dividerLine.y,
      w: LAYOUT.dividerLine.w,
      h: LAYOUT.dividerLine.h,
      fill: { color: c(COLORS.auxLine) },
      line: { color: c(COLORS.auxLine), width: 0.5 }
    });

    // Draw Left and Right Column Blocks
    const leftBlocks = LAYOUT.leftCol.blocks.map(b => ({ ...b, colX: LAYOUT.leftCol.x, colW: LAYOUT.leftCol.w }));
    const rightBlocks = LAYOUT.rightCol.blocks.map(b => ({ ...b, colX: LAYOUT.rightCol.x, colW: LAYOUT.rightCol.w }));
    const allBlocks = [...leftBlocks, ...rightBlocks];

    allBlocks.forEach((block) => {
      // 1. Heading number
      slide.addText(block.num, {
        x: block.colX,
        y: block.y,
        w: 0.22,
        h: 0.25,
        fontSize: 8,
        fontFace: "Noto Sans JP",
        color: "99A9D0",
        bold: true,
        valign: "middle"
      });

      // 2. Icon drawing
      drawIcon(slide, block.icon, block.colX + 0.24, block.y + 0.03, pptx);

      // 3. Block Label Text
      slide.addText(block.label, {
        x: block.colX + 0.45,
        y: block.y,
        w: block.colW - 0.45,
        h: 0.25,
        fontSize: 11,
        fontFace: "Noto Sans JP",
        color: c(COLORS.mainBlue),
        bold: true,
        valign: "middle"
      });

      // 4. Clean line under block header (Swiss style)
      slide.addShape(shapes.RECTANGLE, {
        x: block.colX,
        y: block.y + 0.26,
        w: block.colW,
        h: 0.01,
        fill: { color: "E2E7F3" },
        line: { color: "E2E7F3", width: 0.5 }
      });

      // 5. Block Content
      if (block.id === "keywords") {
        const kws = card.keywords || [];
        const cardW = 1.04;
        const gap = 0.125;

        for (let i = 0; i < 3; i++) {
          const cardX = block.colX + i * (cardW + gap);
          const cardY = block.y + 0.35;

          // Cute light blue background badge card
          slide.addShape(shapes.ROUNDED_RECTANGLE, {
            x: cardX,
            y: cardY,
            w: cardW,
            h: 0.9,
            fill: { color: "EDF2FC" },
            line: { color: "DCE4F8", width: 0.8 },
            rectRadius: 0.08
          });

          // Keyword Index Number (Watermark-like)
          slide.addText(`0${i + 1}`, {
            x: cardX + 0.08,
            y: cardY + 0.08,
            w: cardW - 0.16,
            h: 0.22,
            fontSize: 12,
            fontFace: "Noto Sans JP",
            color: "B8C6EB",
            bold: true,
            valign: "top"
          });

          // Actual Keyword Value
          const kwText = kws[i] ? String(kws[i]).trim() : "";
          slide.addText(kwText || "未設定", {
            x: cardX + 0.08,
            y: cardY + 0.35,
            w: cardW - 0.16,
            h: 0.45,
            fontSize: 9.5,
            fontFace: "Noto Sans JP",
            color: kwText ? "1F1F1F" : "A49C90",
            bold: true,
            valign: "middle"
          });
        }
      } else {
        const rawVal = (card as any)[block.id];
        const textVal = rawVal ? String(rawVal).trim() : "";

        if (textVal) {
          const { fontSizePt } = getFieldFontSize(block.id, textVal);
          slide.addText(textVal, {
            x: block.colX,
            y: block.y + 0.34,
            w: block.colW,
            h: block.h - 0.36,
            fontSize: fontSizePt,
            fontFace: "Noto Sans JP",
            color: "2C2C2C",
            valign: "top",
            lineSpacing: 16,
            margin: [0, 0, 0, 0]
          });
        } else {
          // Placeholder styling
          slide.addText(`${block.subLabel} を入力してください。`, {
            x: block.colX,
            y: block.y + 0.34,
            w: block.colW,
            h: block.h - 0.36,
            fontSize: 9,
            fontFace: "Noto Sans JP",
            color: c(COLORS.placeholder),
            valign: "top"
          });
        }
      }
    });

    // 7. Footer Text Quote
    slide.addText(`“   ${LAYOUT.footer.quote}   ”`, {
      x: LAYOUT.footer.x,
      y: LAYOUT.footer.y,
      w: LAYOUT.footer.w,
      h: LAYOUT.footer.h,
      fontSize: 10,
      fontFace: "Noto Sans JP",
      color: c(COLORS.mainBlue),
      align: "center",
      valign: "middle",
      bold: true
    });
  });

  // Determine export file name
  let filename = "supporter-cards.pptx";
  if (cardsToExport.length === 1) {
    const singleName = cardsToExport[0].name.trim() || "無名";
    filename = `supporter-card_${singleName}.pptx`;
  }

  // Export presentation
  return pptx.writeFile({ fileName: filename });
}
