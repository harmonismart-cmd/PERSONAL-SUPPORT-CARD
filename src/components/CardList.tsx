import React, { useRef } from "react";
import {
  Plus,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Download,
  Upload,
  FileSpreadsheet,
  Eraser,
  Layers
} from "lucide-react";
import { SupporterCard } from "../types";

interface CardListProps {
  cards: SupporterCard[];
  activeId: string;
  onSelectCard: (id: string) => void;
  onAddCard: () => void;
  onCloneCard: (id: string) => void;
  onDeleteCard: (id: string) => void;
  onMoveCard: (id: string, direction: "up" | "down") => void;
  onLoadSample: () => void;
  onClearActive: () => void;
  onExportJson: () => void;
  onImportJson: (imported: SupporterCard[]) => void;
  onExportPptx: (onlyActive: boolean) => void;
}

export const CardList: React.FC<CardListProps> = ({
  cards,
  activeId,
  onSelectCard,
  onAddCard,
  onCloneCard,
  onDeleteCard,
  onMoveCard,
  onLoadSample,
  onClearActive,
  onExportJson,
  onImportJson,
  onExportPptx
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle local file upload for JSON cards list import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const importedList: SupporterCard[] = [];

        // Support importing either a single card or an array of cards
        const rawArray = Array.isArray(json) ? json : [json];

        rawArray.forEach((item: any) => {
          // Generate an ID if missing, ensure correct fields
          importedList.push({
            id: item.id || `card_${Math.random().toString(36).substring(2, 11)}`,
            name: String(item.name || "").trim() || "無名",
            affiliation: String(item.affiliation || "").trim(),
            contact: String(item.contact || "").trim(),
            title: String(item.title || "").trim(),
            introduction: String(item.introduction || "").trim(),
            origin: String(item.origin || "").trim(),
            philosophy: String(item.philosophy || "").trim(),
            entryPoint: String(item.entryPoint || "").trim(),
            nextStep: String(item.nextStep || "").trim(),
            keywords: Array.isArray(item.keywords) ? item.keywords.map(String) : [],
            createdDate: String(item.createdDate || "").trim() || new Date().toISOString().split("T")[0],
          });
        });

        if (importedList.length === 0) {
          alert("有効なカードデータが見つかりませんでした。");
          return;
        }

        onImportJson(importedList);
        alert(`${importedList.length} 件のカードをインポートしました！`);
      } catch (err) {
        alert("JSONファイルの読み込みに失敗しました。正しいフォーマットか確認してください。");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Clear file input
  };

  const activeIndex = cards.findIndex((c) => c.id === activeId);

  return (
    <div className="flex flex-col gap-5 bg-white p-5 rounded-xl border border-stone-200/80 shadow-[0_4px_20px_rgba(40,35,30,0.04)]">
      {/* List Header */}
      <div className="border-b border-stone-100 pb-3 flex justify-between items-center">
        <h2 className="text-base font-serif font-black text-stone-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#1644B5]" />
          <span>📇 カード一覧・管理</span>
          <span className="text-xs font-normal font-sans text-stone-500">({cards.length}名)</span>
        </h2>
        <button
          id="btn-add-card"
          onClick={onAddCard}
          className="px-3 py-1.5 bg-[#1644B5] hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all hover:scale-[1.02] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>カードを追加</span>
        </button>
      </div>

      {/* Cards List Scroller */}
      <div className="max-h-[300px] overflow-y-auto pr-1 flex flex-col gap-2">
        {cards.map((c, index) => {
          const isActive = c.id === activeId;
          return (
            <div
              key={c.id}
              id={`card-item-${c.id}`}
              className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                isActive
                  ? "bg-blue-50/40 border-blue-400 ring-1 ring-blue-400/50"
                  : "bg-stone-50/60 hover:bg-stone-100/80 border-stone-200/80"
              }`}
            >
              {/* Card Meta Description / Click to select */}
              <button
                id={`card-item-select-${c.id}`}
                onClick={() => onSelectCard(c.id)}
                className="flex-1 text-left flex flex-col cursor-pointer min-w-0"
              >
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-bold font-serif text-[#1644B5]">スライド {index + 1}</span>
                  <span className="font-serif font-bold text-sm text-stone-800 truncate">
                    {c.name.trim() || "（氏名未入力）"}
                  </span>
                </div>
                <span className="text-xs text-stone-500 truncate mt-0.5">
                  {c.affiliation.trim() || "（所属未入力）"}
                </span>
                {c.title && (
                  <span className="text-[11px] text-stone-400 italic truncate mt-0.5">
                    「{c.title}」
                  </span>
                )}
              </button>

              {/* Actions: Reorder, Clone, Delete */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Reorder Up */}
                <button
                  id={`btn-move-up-${c.id}`}
                  onClick={() => onMoveCard(c.id, "up")}
                  disabled={index === 0}
                  className="p-1 hover:bg-white rounded border border-stone-200 text-stone-500 hover:text-stone-700 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  title="上に並べ替え"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>

                {/* Reorder Down */}
                <button
                  id={`btn-move-down-${c.id}`}
                  onClick={() => onMoveCard(c.id, "down")}
                  disabled={index === cards.length - 1}
                  className="p-1 hover:bg-white rounded border border-stone-200 text-stone-500 hover:text-stone-700 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  title="下に並べ替え"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>

                {/* Clone */}
                <button
                  id={`btn-clone-${c.id}`}
                  onClick={() => onCloneCard(c.id)}
                  className="p-1 hover:bg-white rounded border border-stone-200 text-[#1644B5] hover:text-blue-800 cursor-pointer"
                  title="カードを複製"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                {/* Delete */}
                <button
                  id={`btn-delete-${c.id}`}
                  onClick={() => onDeleteCard(c.id)}
                  disabled={cards.length <= 1}
                  className="p-1 hover:bg-rose-50 rounded border border-rose-100 text-rose-600 hover:text-rose-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  title="カードを削除"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Operation Control Panels (2 grid columns for organization) */}
      <div className="flex flex-col gap-3 border-t border-stone-100 pt-4">
        <h3 className="text-xs font-bold text-stone-400 tracking-wider uppercase">
          🛠️ 各種操作
        </h3>

        {/* First Row: Sample Load, Clear Field */}
        <div className="grid grid-cols-2 gap-3">
          <button
            id="btn-load-sample"
            onClick={onLoadSample}
            className="px-3 py-2 bg-blue-50/40 hover:bg-blue-100/60 border border-blue-200/50 text-[#1644B5] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>入力例を表示</span>
          </button>
          <button
            id="btn-clear-active"
            onClick={onClearActive}
            className="px-3 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Eraser className="w-4 h-4" />
            <span>全項目を消去</span>
          </button>
        </div>

        {/* Second Row: JSON backup operations */}
        <div className="grid grid-cols-2 gap-3">
          <button
            id="btn-export-json"
            onClick={onExportJson}
            className="px-3 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>JSONを保存</span>
          </button>
          <button
            id="btn-import-json-trigger"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>JSONを読み込む</span>
          </button>
          <input
            id="file-import-json"
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>

        {/* Bottom Big CTA: Export PPTX (Editable) */}
        <div className="mt-2 p-3 bg-blue-50/10 rounded-xl border border-blue-100/60 flex flex-col gap-2 shadow-[inset_0_1px_2px_rgba(22,68,181,0.01)]">
          <div className="text-xs font-bold text-[#1644B5] flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4" />
            <span>PowerPoint (PPTX) 書き出し</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <button
              id="btn-export-pptx-active"
              onClick={() => onExportPptx(true)}
              className={`py-2 bg-white hover:bg-blue-50/40 border border-[#1644B5]/30 text-[#1644B5] rounded-lg text-[11px] font-bold transition-colors cursor-pointer shadow-sm text-center ${
                cards.length === 1 ? "md:col-span-2" : ""
              }`}
            >
              選択中の1枚を書き出し
            </button>
            {cards.length > 1 && (
              <button
                id="btn-export-pptx-all"
                onClick={() => onExportPptx(false)}
                className="py-2 bg-[#1644B5] hover:bg-blue-800 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer shadow-sm text-center"
              >
                全スライド({cards.length}名分)を書き出し
              </button>
            )}
          </div>
          <p className="text-[10px] text-stone-400 mt-0.5 leading-relaxed">
            ※ PptxGenJS を使用してA4縦比率の PowerPoint スライドを生成します。背景や枠、線、文字は個別の要素として作成されるため、ダウンロード後に PowerPoint 上で自由に編集・調整が可能です。
          </p>
        </div>
      </div>
    </div>
  );
};
