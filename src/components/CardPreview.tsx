import React, { useState, useRef, useEffect } from "react";
import {
  User,
  BookOpen,
  Target,
  Rocket,
  Heart,
  Sparkles,
  Bookmark,
  SquareUser,
  Image as ImageIcon,
  Loader2,
  X,
  Download,
  ExternalLink,
  Copy,
  Check
} from "lucide-react";
import { SupporterCard } from "../types";
import { LAYOUT, COLORS, getFieldFontSize } from "../layout";
import html2canvas from "html2canvas";

// Map string icon names from layout.ts to Lucide React icons
const IconMap: Record<string, React.ComponentType<any>> = {
  User,
  BookOpen,
  Target,
  Rocket,
  Heart,
  Sparkles,
  Bookmark,
  SquareUser
};

interface CardPreviewProps {
  card: SupporterCard;
}

export const CardPreview: React.FC<CardPreviewProps> = ({ card }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportedImgUrl, setExportedImgUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // ResizeObserver to calculate the exact width-based scale factor dynamically
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const width = containerRef.current.getBoundingClientRect().width;
        // Base coordinate space is 800px wide
        setScale(width / 800);
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateScale();
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateScale);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  // Conversion functions from Inches to Pixels based on 800px standard width
  const inchToPx = (val: number) => val * (800 / 8.267);

  // Font Pt conversion to exact px size
  const getPxFont = (fontSizePt: number) => `${fontSizePt * 1.344}px`;

  // Check for any field overflowing the limit
  const fieldsToCheck = ["title", "introduction", "origin", "philosophy", "entryPoint", "nextStep"];
  const overflowFields: string[] = [];
  fieldsToCheck.forEach((f) => {
    const text = (card as any)[f] || "";
    const { warnOverflow } = getFieldFontSize(f, text);
    if (warnOverflow) {
      const label = f === "title" ? "称号" : f === "introduction" ? "紹介文" : f === "origin" ? "原点" : f === "philosophy" ? "哲学" : f === "entryPoint" ? "入口" : "一歩";
      overflowFields.push(label);
    }
  });

  // Format creation date for display
  const dateStr = card.createdDate || "";
  let displayDate = "作成日：    年   月   日";
  if (dateStr.includes("-")) {
    const [y, m, d] = dateStr.split("-");
    displayDate = `作成日： ${y} 年 ${m} 月 ${d} 日`;
  } else if (dateStr) {
    displayDate = `作成日： ${dateStr}`;
  }

  // PNG Image export function using html2canvas with Blob optimization
  const handleExportPng = async () => {
    const element = document.getElementById("supporter-personal-card-container");
    const parent = containerRef.current;
    if (!element || !parent) return;
    
    setIsExporting(true);

    // Save original styles to restore later
    const originalTransform = element.style.transform;
    const originalParentHeight = parent.style.height;

    try {
      // Ensure all custom fonts are completely loaded with a safe timeout
      if (document.fonts) {
        await Promise.race([
          document.fonts.ready,
          new Promise((resolve) => setTimeout(resolve, 800))
        ]);
      }

      // Temporarily unscale the card and parent container for a perfect 1:1 capture without clipping or resizing bugs
      element.style.transform = "none";
      parent.style.height = "1131px";

      // Small pause for layout synchronization
      await new Promise((resolve) => setTimeout(resolve, 120));

      const canvas = await html2canvas(element, {
        scale: 2.5, // High quality crisp output (2000x2827px)
        useCORS: true,
        backgroundColor: COLORS.bg,
        logging: false
      });

      // Restore original styles immediately
      element.style.transform = originalTransform;
      parent.style.height = originalParentHeight;

      // Convert Canvas to Blob for robust storage & security compliance (better than giant base64 strings)
      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert("画像の変換に失敗しました。");
          return;
        }

        const blobUrl = URL.createObjectURL(blob);
        setExportedImgUrl(blobUrl); // Open custom dialog with blob URL

        // Auto-download fallback using the Blob URL
        try {
          const link = document.createElement("a");
          link.download = `${card.name || "supporter"}_personal_card.png`;
          link.href = blobUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (dlErr) {
          console.warn("Auto download failed, relying on dialog:", dlErr);
        }
      }, "image/png");

    } catch (err) {
      console.error("Failed to export image:", err);
      // Ensure styles are restored even if it fails
      if (element) element.style.transform = originalTransform;
      if (parent) parent.style.height = originalParentHeight;
    } finally {
      setIsExporting(false);
    }
  };

  // Copy PNG Blob directly to Clipboard
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle");
  const handleCopyToClipboard = async () => {
    if (!exportedImgUrl) return;
    setCopyStatus("idle");
    try {
      const response = await fetch(exportedImgUrl);
      const blob = await response.blob();
      
      if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ]);
        setCopyStatus("success");
        setTimeout(() => setCopyStatus("idle"), 3000);
      } else {
        throw new Error("Clipboard API not fully supported in this context");
      }
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 3000);
    }
  };

  // Combine left and right blocks for unified coordinate rendering
  const leftBlocks = LAYOUT.leftCol.blocks.map(b => ({ ...b, colX: LAYOUT.leftCol.x, colW: LAYOUT.leftCol.w }));
  const rightBlocks = LAYOUT.rightCol.blocks.map(b => ({ ...b, colX: LAYOUT.rightCol.x, colW: LAYOUT.rightCol.w }));
  const allBlocks = [...leftBlocks, ...rightBlocks];

  // Get current font size for the Title
  const titleText = card.title || "";
  const { fontSizePt: titleSizePt } = getFieldFontSize("title", titleText);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Top action bar in Preview Header */}
      <div className="flex justify-between items-center bg-stone-50 p-2.5 rounded-xl border border-stone-200">
        <span className="text-[11px] font-bold text-stone-500 font-sans">
          ※ リアルタイムのレイアウト確認用
        </span>
        <button
          onClick={handleExportPng}
          disabled={isExporting}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer shadow-sm"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>画像作成中...</span>
            </>
          ) : (
            <>
              <ImageIcon className="w-3.5 h-3.5" />
              <span>画像 (PNG) で書き出し</span>
            </>
          )}
        </button>
      </div>

      {/* Dynamic Warning Alert */}
      {overflowFields.length > 0 && (
        <div id="overflow-warning" className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex flex-col gap-1 shadow-sm">
          <div className="font-semibold flex items-center gap-1">
            ⚠️ 文章量過多の警告
          </div>
          <p>
            「{overflowFields.join("、")}」の文章量が多いため、A4紙面に収まらない・見切れる可能性があります。文字数を調整することをお勧めします。
          </p>
        </div>
      )}

      {/* Responsive Scaling Wrapper */}
      <div
        ref={containerRef}
        className="relative w-full rounded-lg shadow-xl border border-stone-300/80 overflow-hidden select-none transition-shadow duration-300 hover:shadow-2xl"
        style={{
          height: `${1131 * scale}px`
        }}
      >
        {/* Fixed coordinate workspace (800x1131px matches exactly A4 Portrait) */}
        <div
          id="supporter-personal-card-container"
          className="absolute origin-top-left"
          style={{
            width: "800px",
            height: "1131px",
            transform: `scale(${scale})`,
            backgroundColor: COLORS.bg,
            color: COLORS.bodyText,
            fontFamily: "var(--font-sans)",
            top: 0,
            left: 0
          }}
        >
          {/* === Header Section === */}
          {/* English Title label */}
          <div
            id="header-eng-title"
            className="absolute font-sans font-black tracking-widest uppercase text-[#1644B5]/60 flex items-center"
            style={{
              left: `${inchToPx(LAYOUT.header.engTitle.x)}px`,
              top: `${inchToPx(LAYOUT.header.engTitle.y)}px`,
              width: `${inchToPx(LAYOUT.header.engTitle.w)}px`,
              height: `${inchToPx(LAYOUT.header.engTitle.h)}px`,
              fontSize: getPxFont(8)
            }}
          >
            PERSONAL SUPPORT CARD
          </div>

          {/* Supporter Title / Role ("称号") - NOW THE MOST PROMINENT GIANT HEADLINE */}
          <div
            id="header-supporter-title"
            className="absolute font-sans font-black tracking-tight text-[#1644B5] flex items-center leading-[1.25]"
            style={{
              left: `${inchToPx(LAYOUT.header.subTitle.x)}px`,
              top: `${inchToPx(LAYOUT.header.subTitle.y)}px`,
              width: `${inchToPx(LAYOUT.header.subTitle.w)}px`,
              height: `${inchToPx(LAYOUT.header.subTitle.h)}px`,
              fontSize: getPxFont(titleSizePt)
            }}
          >
            {card.title.trim() ? (
              card.title
            ) : (
              <span className="text-[#A49C90]/70 font-normal italic">（称号・一言の役割を入力してください）</span>
            )}
          </div>

          {/* Supporter Name (Elegant, nested nicely below the giant 称号) */}
          <div
            id="header-supporter-name"
            className="absolute font-sans tracking-tight flex items-center leading-none"
            style={{
              left: `${inchToPx(LAYOUT.header.jpTitle.x)}px`,
              top: `${inchToPx(LAYOUT.header.jpTitle.y)}px`,
              width: `${inchToPx(LAYOUT.header.jpTitle.w)}px`,
              height: `${inchToPx(LAYOUT.header.jpTitle.h)}px`,
              fontSize: getPxFont(14)
            }}
          >
            {card.name.trim() ? (
              <span className="text-stone-800 font-bold">
                支援者: <span className="text-[#1644B5] font-black">{card.name}</span>
              </span>
            ) : (
              <span className="text-stone-300 font-normal tracking-normal italic">（お名前を入力）</span>
            )}
          </div>

          {/* Static Subtitle / Tagline */}
          <div
            id="header-static-tagline"
            className="absolute font-sans font-semibold text-stone-500 tracking-tight flex items-center"
            style={{
              left: `${inchToPx(LAYOUT.header.tagline.x)}px`,
              top: `${inchToPx(LAYOUT.header.tagline.y)}px`,
              width: `${inchToPx(LAYOUT.header.tagline.w)}px`,
              height: `${inchToPx(LAYOUT.header.tagline.h)}px`,
              fontSize: getPxFont(8.5)
            }}
          >
            私らしい支援のかたちを、ひと目で伝えるカード
          </div>

          {/* Right Header Area: Contact & Profile Sidebar */}
          <div
            id="header-contact-label"
            className="absolute font-sans font-black tracking-wider text-[#1644B5]/80 flex items-center"
            style={{
              left: `${inchToPx(LAYOUT.header.contactHeader.x)}px`,
              top: `${inchToPx(LAYOUT.header.contactHeader.y)}px`,
              width: `${inchToPx(LAYOUT.header.contactHeader.w)}px`,
              height: `${inchToPx(LAYOUT.header.contactHeader.h)}px`,
              fontSize: getPxFont(8.5)
            }}
          >
            PROFILE & CONTACT
          </div>

          <div
            id="header-contact-line"
            className="absolute bg-[#1644B5]/35"
            style={{
              left: `${inchToPx(LAYOUT.header.contactLine.x)}px`,
              top: `${inchToPx(LAYOUT.header.contactLine.y)}px`,
              width: `${inchToPx(LAYOUT.header.contactLine.w)}px`,
              height: `${inchToPx(LAYOUT.header.contactLine.h)}px`
            }}
          />

          {/* Affiliation block (Right Header) */}
          <div
            id="header-contact-affiliation"
            className="absolute font-sans flex flex-col justify-start"
            style={{
              left: `${inchToPx(LAYOUT.header.affiliation.x)}px`,
              top: `${inchToPx(LAYOUT.header.affiliation.y)}px`,
              width: `${inchToPx(LAYOUT.header.affiliation.w)}px`,
              height: `${inchToPx(LAYOUT.header.affiliation.h)}px`
            }}
          >
            <span className="text-[#1644B5] font-bold tracking-wider" style={{ fontSize: getPxFont(7) }}>AFFILIATION</span>
            <span className="font-bold text-stone-800 line-clamp-2 mt-0.5" style={{ fontSize: getPxFont(9.5), lineHeight: 1.25 }}>
              {card.affiliation.trim() ? card.affiliation : <span className="text-[#A49C90]/40 font-normal">（所属を入力してください）</span>}
            </span>
          </div>

          {/* Contact block (Right Header) */}
          <div
            id="header-contact-details"
            className="absolute font-sans flex flex-col justify-start"
            style={{
              left: `${inchToPx(LAYOUT.header.contact.x)}px`,
              top: `${inchToPx(LAYOUT.header.contact.y)}px`,
              width: `${inchToPx(LAYOUT.header.contact.w)}px`,
              height: `${inchToPx(LAYOUT.header.contact.h)}px`
            }}
          >
            <span className="text-[#1644B5] font-bold tracking-wider" style={{ fontSize: getPxFont(7) }}>CONTACT</span>
            <span className="font-semibold text-stone-700 truncate mt-0.5" style={{ fontSize: getPxFont(8.5) }}>
              {card.contact.trim() ? card.contact : <span className="text-[#A49C90]/40 font-normal">（連絡先を入力してください）</span>}
            </span>
          </div>

          {/* Date block */}
          <div
            id="header-contact-date"
            className="absolute font-sans font-bold text-stone-500 text-right flex items-center justify-end"
            style={{
              left: `${inchToPx(LAYOUT.header.createdDate.x)}px`,
              top: `${inchToPx(LAYOUT.header.createdDate.y)}px`,
              width: `${inchToPx(LAYOUT.header.createdDate.w)}px`,
              height: `${inchToPx(LAYOUT.header.createdDate.h)}px`,
              fontSize: getPxFont(8.5)
            }}
          >
            {displayDate}
          </div>

          {/* Horizontal Divider Line */}
          <div
            id="header-main-divider"
            className="absolute bg-[#1644B5]"
            style={{
              left: `${inchToPx(LAYOUT.header.divider.x)}px`,
              top: `${inchToPx(LAYOUT.header.divider.y)}px`,
              width: `${inchToPx(LAYOUT.header.divider.w)}px`,
              height: `${inchToPx(LAYOUT.header.divider.h)}px`
            }}
          />

          {/* Column Divider Line down the center */}
          <div
            id="column-divider-vertical"
            className="absolute bg-[#D2C9BC]"
            style={{
              left: `${inchToPx(LAYOUT.dividerLine.x)}px`,
              top: `${inchToPx(LAYOUT.dividerLine.y)}px`,
              width: `${inchToPx(LAYOUT.dividerLine.w)}px`,
              height: `${inchToPx(LAYOUT.dividerLine.h)}px`
            }}
          />

          {/* === Main Column Blocks (Mapped dynamically) === */}
          {allBlocks.map((block) => {
            const textVal = (card as any)[block.id] || "";
            const { fontSizePt } = getFieldFontSize(block.id, textVal);
            const IconComponent = IconMap[block.icon];

            return (
              <div
                key={block.id}
                id={`block-container-${block.id}`}
                className="absolute font-sans flex flex-col justify-start"
                style={{
                  left: `${inchToPx(block.colX)}px`,
                  top: `${inchToPx(block.y)}px`,
                  width: `${inchToPx(block.colW)}px`,
                  height: `${inchToPx(block.h)}px`
                }}
              >
                {/* Section Heading with Swiss numbering & clean accent line */}
                <div className="flex items-center gap-1.5 text-[#1644B5] font-sans font-black tracking-tight shrink-0">
                  <span className="text-[10px] font-black tracking-widest text-[#1644B5]/50 leading-none">
                    {block.num}
                  </span>
                  <span className="flex items-center gap-1" style={{ fontSize: getPxFont(11) }}>
                    {IconComponent && <IconComponent className="w-4 h-4 shrink-0 stroke-[2.5]" />}
                    <span>{block.label}</span>
                  </span>
                </div>

                {/* Minimal Section Divider Line */}
                <div className="w-full h-[1.5px] bg-[#1644B5]/25 my-1.5 shrink-0" />

                {/* Block Content Body */}
                {block.id === "keywords" ? (
                  <div className="flex-1 flex flex-col justify-start gap-1.5 pt-1">
                    <div className="grid grid-cols-3 gap-2.5 w-full">
                      {[0, 1, 2].map((i) => {
                        const kw = card.keywords?.[i] || "";
                        return (
                          <div
                            key={i}
                            className="flex flex-col justify-center bg-[#1644B5]/4 border border-[#1644B5]/15 rounded-lg px-2 py-1.5 min-w-0"
                          >
                            <span className="text-[12px] font-black font-sans text-[#1644B5]/30 leading-none mb-0.5">
                              0{i + 1}
                            </span>
                            <span
                              className="font-sans font-black text-stone-800 truncate"
                              style={{ fontSize: getPxFont(9.5) }}
                            >
                              {kw.trim() ? (
                                kw
                              ) : (
                                <span className="text-[#A49C90]/50 font-normal italic">
                                  未設定
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex-1 whitespace-pre-wrap overflow-hidden text-[#1F1F1F] font-medium leading-[1.65] tracking-tight pr-1"
                    style={{
                      fontSize: getPxFont(fontSizePt),
                      color: "#2C2C2C"
                    }}
                  >
                    {textVal.trim() ? (
                      textVal
                    ) : (
                      <span className="text-[#A49C90]/70 font-normal italic" style={{ fontSize: getPxFont(9) }}>
                        {block.subLabel} を入力してください。
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* === Footer Section === */}
          <div
            id="block-footer"
            className="absolute flex items-center justify-center font-sans font-bold italic text-[#1644B5] tracking-wide"
            style={{
              left: `${inchToPx(LAYOUT.footer.x)}px`,
              top: `${inchToPx(LAYOUT.footer.y)}px`,
              width: `${inchToPx(LAYOUT.footer.w)}px`,
              height: `${inchToPx(LAYOUT.footer.h)}px`,
              fontSize: getPxFont(10)
            }}
          >
            “　{LAYOUT.footer.quote}　”
          </div>
        </div>
      </div>

      {/* Image Export Confirmation Modal (Foolproof fallback for iframe sandboxing) */}
      {exportedImgUrl && (() => {
        const isIframeEnv = typeof window !== "undefined" && window.self !== window.top;
        return (
          <div 
            id="export-img-modal-backdrop"
            className="fixed inset-0 bg-stone-900/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setExportedImgUrl(null)}
          >
            <div 
              id="export-img-modal-content"
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[95vh] overflow-y-auto border border-stone-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-2">
                  {isIframeEnv ? (
                    <>
                      <h3 className="text-base font-black text-amber-600 flex items-center gap-1.5 font-sans">
                        ⚠️ プレビュー制限により自動保存が制限されています
                      </h3>
                      <p className="text-[11px] text-stone-500 mt-1 leading-relaxed font-sans">
                        AI Studioのプレビュー枠内（現在の画面）は、ブラウザの強力なセキュリティ制限（サンドボックス）が適用されているため、自動ダウンロードや保存先指定ダイアログの表示が強制ブロックされます。
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-base font-black text-stone-900 flex items-center gap-1.5 font-sans">
                        ✨ 高画質画像のダウンロードを開始しました！
                      </h3>
                      <p className="text-[11px] text-stone-500 mt-1 leading-relaxed font-sans">
                        セキュリティ制限のない安全なブラウザ環境で起動しているため、自動ダウンロードが開始されました。ブラウザの保存先指定ダイアログ、またはダウンロードフォルダをご確認ください。
                      </p>
                    </>
                  )}
                </div>
                <button 
                  onClick={() => setExportedImgUrl(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-all cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action Guides */}
              <div className="flex flex-col gap-2.5">
                {isIframeEnv && (
                  /* Method A: Open in New Tab for Native Save (Highly recommended for iframe) */
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-xl flex flex-col gap-2.5 font-sans shadow-xs">
                    <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                      🌐 【最優先・確実】ブラウザの別タブでアプリを開き直す
                    </span>
                    <p className="text-[11.5px] text-stone-700 leading-relaxed font-medium">
                      プレビュー制限を解除し、独立した新しいブラウザタブでツールを開き直します。<strong>現在の編集データは自動的に引き継がれます</strong>。別タブではセキュリティ制限がすべて解除されるため、通常のダウンロード処理や保存先指定のダウンロードが完璧に動作します。
                    </p>
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center shadow-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>別タブで開き直す（自動保存が完全に有効化されます）</span>
                    </a>
                  </div>
                )}

                {/* Method B: Clipboard Copy */}
                <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl flex flex-col gap-1.5 font-sans">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-stone-700 flex items-center gap-1">
                      📋 方法1：クリップボードにコピー（Word/PowerPoint貼付用）
                    </span>
                    <button
                      onClick={handleCopyToClipboard}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        copyStatus === "success" 
                          ? "bg-emerald-600 text-white" 
                          : copyStatus === "error"
                          ? "bg-rose-600 text-white"
                          : "bg-stone-800 hover:bg-stone-900 text-white"
                      }`}
                    >
                      {copyStatus === "success" ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>コピー完了！</span>
                        </>
                      ) : copyStatus === "error" ? (
                        <span>失敗（別タブ推奨）</span>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>画像をコピー</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-600 leading-relaxed">
                    生成された高解像度画像を直接コピーします。そのまま PowerPoint や Word などの編集画面、あるいはチャットツールに移動し、<strong>「貼り付け (Ctrl+V / Cmd+V)」</strong>するだけで、画像ファイル保存ダイアログを介さずに一瞬でドキュメントに挿入できます。
                  </p>
                </div>

                {/* Method C: Right-Click / Press & Hold */}
                <div className="bg-amber-50/70 border border-amber-100 p-3 rounded-xl flex flex-col gap-1 font-sans">
                  <span className="text-[11px] font-black text-amber-800 block">
                    📸 方法2：画像の上で右クリックまたは長押し保存
                  </span>
                  <p className="text-[10px] text-stone-600 leading-relaxed">
                    下部にレンダリングされている画像の上で <strong>右クリック</strong>（スマートフォンは <strong>画像を長押し</strong>）し、メニューから <strong>「名前を付けて画像を保存」</strong> または「写真に追加／共有」をお試しください。
                  </p>
                </div>
              </div>

              {/* Rendered Image Preview */}
              <div className="relative border border-stone-200 rounded-xl bg-stone-50 p-2 overflow-hidden group flex flex-col items-center justify-center gap-1.5">
                <span className="text-[9px] font-bold text-stone-400 select-none">
                  【高解像度プレビュー画像：右クリック / 長押し対応】
                </span>
                <img 
                  src={exportedImgUrl} 
                  className="max-h-[30vh] w-auto rounded-lg shadow-md object-contain select-all cursor-pointer hover:opacity-95 transition-opacity" 
                  alt="Supporter Card" 
                  title="右クリックまたは長押しで保存"
                />
              </div>

              {/* Footer Actions */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => {
                    try {
                      const link = document.createElement("a");
                      link.download = `${card.name || "supporter"}_personal_card.png`;
                      link.href = exportedImgUrl;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-stone-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>自動保存を再試行</span>
                </button>
                <button
                  onClick={() => setExportedImgUrl(null)}
                  className="py-2.5 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
