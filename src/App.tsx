import { useState, useEffect } from "react";
import { Layers, Download, CheckCircle, AlertTriangle, Info, HelpCircle, ExternalLink } from "lucide-react";
import { SupporterCard } from "./types";
import { SAMPLE_CARD } from "./data/sample";
import {
  loadCards,
  saveCards,
  loadActiveId,
  saveActiveId,
  generateId,
  exportToJsonFile
} from "./utils/storage";
import { exportCardsToPptx } from "./utils/exportPptx";
import { CardList } from "./components/CardList";
import { CardEditor } from "./components/CardEditor";
import { CardPreview } from "./components/CardPreview";

export default function App() {
  // --- Core State Managers ---
  const [cards, setCards] = useState<SupporterCard[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pptxError, setPptxError] = useState<string | null>(null);
  const [pptxSuccess, setPptxSuccess] = useState<string | null>(null);

  // Load initial cards and active ID from LocalStorage on mount
  useEffect(() => {
    const loadedList = loadCards();
    setCards(loadedList);

    const savedActiveId = loadActiveId();
    if (savedActiveId && loadedList.some((c) => c.id === savedActiveId)) {
      setActiveId(savedActiveId);
    } else if (loadedList.length > 0) {
      setActiveId(loadedList[0].id);
      saveActiveId(loadedList[0].id);
    }
  }, []);

  // Sync cards changes to LocalStorage
  const updateCardsList = (newCards: SupporterCard[]) => {
    setCards(newCards);
    const success = saveCards(newCards);
    if (!success) {
      setSaveError("ブラウザの保存領域（LocalStorage）への保存に失敗しました。容量が不足している可能性があります。");
    } else {
      setSaveError(null);
    }
  };

  const handleSelectCard = (id: string) => {
    setActiveId(id);
    saveActiveId(id);
    setPptxSuccess(null);
    setPptxError(null);
  };

  // Find active card
  const activeCard = cards.find((c) => c.id === activeId) || cards[0];

  const handleActiveCardChange = (updated: SupporterCard) => {
    const updatedList = cards.map((c) => (c.id === updated.id ? updated : c));
    updateCardsList(updatedList);
  };

  // 1. Add Blank Card
  const handleAddCard = () => {
    const today = new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).replace(/\//g, "-");

    const newCard: SupporterCard = {
      id: generateId(),
      name: "",
      affiliation: "",
      contact: "",
      title: "",
      introduction: "",
      origin: "",
      philosophy: "",
      entryPoint: "",
      nextStep: "",
      keywords: ["", "", ""],
      createdDate: today
    };

    const newList = [...cards, newCard];
    updateCardsList(newList);
    handleSelectCard(newCard.id);
  };

  // 2. Clone Card
  const handleCloneCard = (id: string) => {
    const target = cards.find((c) => c.id === id);
    if (!target) return;

    const cloned: SupporterCard = {
      ...target,
      id: generateId(),
      name: target.name ? `${target.name} [複製]` : "（複製）"
    };

    // Insert right after target in the list
    const index = cards.findIndex((c) => c.id === id);
    const newList = [...cards];
    newList.splice(index + 1, 0, cloned);
    
    updateCardsList(newList);
    handleSelectCard(cloned.id);
  };

  // 3. Delete Card
  const handleDeleteCard = (id: string) => {
    if (cards.length <= 1) {
      alert("最後の1枚のカードは削除できません。");
      return;
    }

    const cardToDelete = cards.find((c) => c.id === id);
    const confirmName = cardToDelete?.name || "無名のスライド";
    if (!confirm(`「${confirmName}」のカードを完全に削除しますか？`)) {
      return;
    }

    const index = cards.findIndex((c) => c.id === id);
    const newList = cards.filter((c) => c.id !== id);
    updateCardsList(newList);

    // If deleting the active card, switch active pointer
    if (activeId === id) {
      const nextActiveIndex = Math.min(index, newList.length - 1);
      handleSelectCard(newList[nextActiveIndex].id);
    }
  };

  // 4. Move/Reorder Card
  const handleMoveCard = (id: string, direction: "up" | "down") => {
    const index = cards.findIndex((c) => c.id === id);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= cards.length) return;

    const newList = [...cards];
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;

    updateCardsList(newList);
  };

  // 5. Fill active card with Predefined Sample
  const handleLoadSample = () => {
    if (!activeCard) return;
    if (
      activeCard.name ||
      activeCard.title ||
      activeCard.introduction ||
      activeCard.origin ||
      activeCard.philosophy
    ) {
      if (!confirm("現在入力されている内容が上書きされますが、よろしいですか？")) {
        return;
      }
    }

    const updated: SupporterCard = {
      ...activeCard,
      ...SAMPLE_CARD,
      name: "山田 太郎"
    };
    handleActiveCardChange(updated);
  };

  // 6. Clear all fields on active card
  const handleClearActive = () => {
    if (!activeCard) return;
    if (!confirm("現在編集中のカードの全項目を消去しますか？（作成日は維持されます）")) {
      return;
    }

    const updated: SupporterCard = {
      ...activeCard,
      name: "",
      affiliation: "",
      contact: "",
      title: "",
      introduction: "",
      origin: "",
      philosophy: "",
      entryPoint: "",
      nextStep: "",
      keywords: ["", "", ""]
    };
    handleActiveCardChange(updated);
  };

  // 7. Save JSON to file
  const handleExportJson = () => {
    exportToJsonFile(cards);
  };

  // 8. Import JSON from file
  const handleImportJson = (importedList: SupporterCard[]) => {
    if (importedList.length === 0) return;
    if (confirm("現在編集中のすべてのカードを破棄し、インポートした内容で置き換えますか？")) {
      updateCardsList(importedList);
      handleSelectCard(importedList[0].id);
    }
  };

  // 9. Export PowerPoint PPTX
  const handleExportPptx = async (onlyActive: boolean) => {
    setPptxSuccess(null);
    setPptxError(null);

    try {
      await exportCardsToPptx(cards, activeId, onlyActive);
      const name = onlyActive ? `「${activeCard.name || "無名"}」` : "すべてのカード";
      setPptxSuccess(`${name} のパワーポイントファイルを正常に書き出しました！ダウンロードフォルダをご確認ください。`);
    } catch (err: any) {
      console.error(err);
      setPptxError(err.message || "PPTXファイルの生成中にエラーが発生しました。");
    }
  };

  // Generate checklist of empty fields for active card
  const getEmptyFields = (card: SupporterCard) => {
    if (!card) return [];
    const list = [];
    if (!card.name.trim()) list.push("氏名");
    if (!card.affiliation.trim()) list.push("所属・活動エリア");
    if (!card.contact.trim()) list.push("連絡先");
    if (!card.title.trim()) list.push("称号");
    if (!card.introduction.trim()) list.push("紹介文");
    if (!card.origin.trim()) list.push("私の支援観の原点");
    if (!card.philosophy.trim()) list.push("私の支援哲学");
    if (!card.entryPoint.trim()) list.push("私が見る支援の入口");
    if (!card.nextStep.trim()) list.push("明日からの一歩");
    
    const kwCount = (card.keywords || []).filter((k) => k.trim()).length;
    if (kwCount < 3) {
      list.push(`キーワード（現在${kwCount}個／推奨3〜5個）`);
    }
    return list;
  };

  const emptyFields = activeCard ? getEmptyFields(activeCard) : [];
  const isIframe = typeof window !== "undefined" && window.self !== window.top;

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-stone-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 pb-16">
      {/* Iframe sandbox restriction warning bar */}
      {isIframe && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 text-white px-4 py-3 text-xs md:text-sm font-sans font-bold flex flex-col sm:flex-row items-center justify-center gap-3 text-center shadow-md border-b border-orange-700 relative z-50">
          <span className="flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-200 shrink-0 animate-bounce" />
            <span>【重要】現在プレビュー枠内で表示されています。ブラウザのセキュリティ制限により「画像で書き出し」が保存されません。</span>
          </span>
          <a
            href={window.location.href}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-stone-900 px-3 py-1 rounded-xl hover:bg-stone-100 transition-all shadow-md flex items-center gap-1 text-[11px] font-black shrink-0 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-orange-600" />
            <span>別タブで開いて完全に保存する（推奨）</span>
          </a>
        </div>
      )}

      {/* Upper Navigation / Title Block */}
      <header className="bg-stone-50/95 backdrop-blur-md border-b border-stone-200/80 py-5 px-6 sticky top-0 z-40 shadow-[0_2px_12px_rgba(40,35,30,0.03)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-[#1644B5] tracking-widest uppercase bg-blue-50/80 border border-blue-200/40 px-2.5 py-0.5 rounded-sm w-fit font-sans">
              POWERED BY PPTXGENJS & GEMINI 3.5 FLASH
            </span>
            <h1 className="text-xl md:text-2xl font-sans font-black text-stone-900 tracking-tight flex items-center gap-2">
              <span>📇 支援者パーソナルカード生成ツール</span>
            </h1>
          </div>
          <p className="text-xs text-stone-600 max-w-md leading-relaxed font-sans font-medium">
            プロフィールや想いを入力し、A4縦サイズのカードを生成します。作成したカードは、PowerPoint(PPTX)上でテキストボックスや線をそのまま個別に編集可能な状態で書き出しできます。
          </p>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-8 w-full">
        {/* Error / Success Notifications */}
        <div className="flex flex-col gap-3 mb-6">
          {saveError && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-start gap-2 shadow-xs">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold">データの保存エラー</p>
                <p className="text-xs mt-1 text-rose-700">{saveError}</p>
              </div>
            </div>
          )}

          {pptxError && (
            <div id="pptx-error-banner" className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-start gap-2 shadow-xs">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold">PPTX書き出しエラー</p>
                <p className="text-xs mt-1 text-rose-700">{pptxError}</p>
              </div>
            </div>
          )}

          {pptxSuccess && (
            <div id="pptx-success-banner" className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-start gap-2 shadow-xs">
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-bold">書き出し成功</p>
                <p className="text-xs mt-1 text-emerald-700">{pptxSuccess}</p>
              </div>
            </div>
          )}
        </div>

        {/* 2-Column Desktop Grid / Stacked responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (Inputs, Management & Tools) -> 5 cols */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Cards List Selector */}
            <CardList
              cards={cards}
              activeId={activeId}
              onSelectCard={handleSelectCard}
              onAddCard={handleAddCard}
              onCloneCard={handleCloneCard}
              onDeleteCard={handleDeleteCard}
              onMoveCard={handleMoveCard}
              onLoadSample={handleLoadSample}
              onClearActive={handleClearActive}
              onExportJson={handleExportJson}
              onImportJson={handleImportJson}
              onExportPptx={handleExportPptx}
            />

            {/* Input Form Fields */}
            {activeCard && (
              <CardEditor
                card={activeCard}
                onChange={handleActiveCardChange}
              />
            )}
          </div>

          {/* Right Column (A4 Page Preview & Status Details) -> 7 cols */}
          <div className="lg:col-span-7 flex flex-col gap-6 lg:sticky lg:top-24">
            
            {/* Header for Preview Section */}
            <div className="flex justify-between items-center border-b border-stone-200 pb-2">
              <h3 className="font-sans font-black text-stone-800 text-sm tracking-wider uppercase flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1644B5]" />
                <span>完成プレビュー（A4縦アスペクト）</span>
              </h3>
              <div className="text-xs text-stone-500 font-bold font-sans">
                ※ 入力に応じてリアルタイムに自動更新
              </div>
            </div>

            {/* A4 Preview Screen */}
            {activeCard ? (
              <CardPreview card={activeCard} />
            ) : (
              <div className="w-full aspect-[210/297] bg-white rounded-xl border border-dashed border-stone-300 flex items-center justify-center p-6 text-stone-400 font-sans">
                表示するカードがありません。カードを追加してください。
              </div>
            )}

            {/* Checklist of unentered inputs */}
            {activeCard && (
              <div id="unentered-checklist" className="bg-stone-50/50 p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col gap-3">
                <div className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-stone-500" />
                  <span>入力状態の確認（未入力項目チェックリスト）</span>
                </div>
                {emptyFields.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-stone-500 leading-relaxed font-medium">
                      以下の項目が未入力です。未入力でもPPTX書き出しは可能ですが、該当箇所は空欄として出力されます。
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {emptyFields.map((field, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-bold text-stone-600 bg-stone-100/80 px-2.5 py-0.5 rounded border border-stone-200/50"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs font-bold text-emerald-700 flex items-center gap-1 font-sans">
                    🎉 すべての項目（キーワード含む）が埋まりました！素晴らしいパーソナルカードです。
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </main>
    </div>
  );
}
