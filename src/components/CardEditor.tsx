import React, { useState } from "react";
import { Sparkles, Wand2, RefreshCw, X, Check, HelpCircle, Key, ChevronDown, ChevronUp, Settings } from "lucide-react";
import { SupporterCard } from "../types";
import { CONSTRAINTS } from "../layout";

interface CardEditorProps {
  card: SupporterCard;
  onChange: (updatedCard: SupporterCard) => void;
}

export const CardEditor: React.FC<CardEditorProps> = ({ card, onChange }) => {
  const [aiDialog, setAiDialog] = useState<{
    field: keyof SupporterCard;
    fieldLabel: string;
    originalText: string;
    maxLength: number;
    loading: boolean;
    suggestions: string[];
    error: string | null;
  } | null>(null);

  const [userApiKey, setUserApiKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("user_gemini_api_key") || "";
    }
    return "";
  });
  const [showApiKeySection, setShowApiKeySection] = useState(false);

  const handleFieldChange = (field: keyof SupporterCard, value: any) => {
    onChange({
      ...card,
      [field]: value,
    });
  };

  const handleKeywordChange = (index: number, val: string) => {
    const kws = [...(card.keywords || [])];
    while (kws.length < 5) {
      kws.push("");
    }
    kws[index] = val;
    handleFieldChange("keywords", kws);
  };

  // Triggers AI writing helper on the server side
  const triggerAiAssist = async (fieldKey: keyof SupporterCard, fieldLabel: string, maxLength: number) => {
    const currentText = (card[fieldKey] as string) || "";
    if (!currentText.trim()) {
      alert("AI推敲を行うには、まず文章をテキストボックスに入力してください。");
      return;
    }

    setAiDialog({
      field: fieldKey,
      fieldLabel,
      originalText: currentText,
      maxLength,
      loading: true,
      suggestions: [],
      error: null,
    });

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const savedKey = typeof window !== "undefined" ? localStorage.getItem("user_gemini_api_key") : "";
    if (savedKey) {
      headers["x-api-key"] = savedKey;
    }

    try {
      const response = await fetch("/api/gemini/suggest", {
        method: "POST",
        headers,
        body: JSON.stringify({
          text: currentText,
          field: fieldLabel,
          maxLength,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "AI文章補助の取得に失敗しました。");
      }

      setAiDialog((prev) =>
        prev
          ? {
              ...prev,
              loading: false,
              suggestions: data.suggestions || [],
            }
          : null
      );
    } catch (err: any) {
      console.error(err);
      setAiDialog((prev) =>
        prev
          ? {
              ...prev,
              loading: false,
              error: err.message || "エラーが発生しました。接続状況を確認してください。",
            }
          : null
      );
    }
  };

  // Renders label and count warning
  const renderFieldHeader = (
    fieldKey: keyof SupporterCard,
    label: string,
    min: number,
    max: number,
    desc: string
  ) => {
    const currentLength = ((card[fieldKey] as string) || "").length;
    const isUnder = currentLength < min && currentLength > 0;
    const isOver = currentLength > max;

    return (
      <div className="flex flex-col gap-1 mb-2">
        <div className="flex justify-between items-baseline">
          <label htmlFor={`input-${fieldKey}`} className="text-sm font-sans font-extrabold text-stone-900 flex items-center gap-1">
            <span>{label}</span>
            <span className="text-xs font-normal font-sans text-stone-500">（{desc}）</span>
          </label>
          <div className="text-xs font-semibold flex items-center gap-1 font-sans">
            <span
              className={`${
                isOver
                  ? "text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200"
                  : isUnder
                  ? "text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200"
                  : currentLength > 0
                  ? "text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                  : "text-stone-400"
              }`}
            >
              {currentLength} / {min}〜{max}文字
            </span>
          </div>
        </div>
        {isOver && (
          <p id={`warn-over-${fieldKey}`} className="text-rose-600 text-[11px] font-semibold font-sans">
            ⚠️ 推奨最大文字数を超えています。PPTXに収まらない恐れがあります。
          </p>
        )}
        {isUnder && (
          <p id={`warn-under-${fieldKey}`} className="text-amber-600 text-[11px] font-semibold font-sans">
            ⚠️ 推奨文字数より短いです（目安は {min}〜{max} 文字）。
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 bg-white p-5 rounded-xl border border-stone-200/80 shadow-[0_4px_20px_rgba(40,35,30,0.04)] max-w-full">
      <div className="border-b border-stone-100 pb-3 flex justify-between items-center">
        <h2 className="text-base font-sans font-black text-stone-900 flex items-center gap-2">
          <span>📝 支援者情報の編集</span>
        </h2>
        <div className="flex items-center gap-2">
          <label htmlFor="input-createdDate" className="text-xs text-stone-500 font-bold font-sans">作成日:</label>
          <input
            id="input-createdDate"
            type="date"
            className="text-xs px-2.5 py-1 border border-stone-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-stone-50/50"
            value={card.createdDate}
            onChange={(e) => handleFieldChange("createdDate", e.target.value)}
          />
        </div>
      </div>

      {/* --- Profile block (Top of editor for good input hierarchy) --- */}
      <div className="p-4 bg-stone-50/60 rounded-xl border border-stone-200/80 flex flex-col gap-4">
        <h3 className="text-xs font-bold text-stone-500 tracking-wider uppercase mb-1 font-sans">
          👤 基本プロフィール（下部表示）
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="input-name" className="block text-xs font-bold text-stone-700 mb-1">
              氏名 <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-name"
              type="text"
              placeholder="山田 太郎"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium"
              value={card.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="input-affiliation" className="block text-xs font-bold text-stone-700 mb-1">
              所属・活動エリア <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-affiliation"
              type="text"
              placeholder="特定非営利活動法人○○"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium"
              value={card.affiliation}
              onChange={(e) => handleFieldChange("affiliation", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="input-contact" className="block text-xs font-bold text-stone-700 mb-1">
              連絡先（任意）
            </label>
            <input
              id="input-contact"
              type="text"
              placeholder="yamada@example.com"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium"
              value={card.contact}
              onChange={(e) => handleFieldChange("contact", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* --- Main Card Sections --- */}
      <div className="grid grid-cols-1 gap-5">
        {/* 1. Title / 称号 */}
        <div className="flex flex-col p-4 border border-stone-200/80 rounded-xl hover:border-stone-300 transition-colors bg-white shadow-sm">
          {renderFieldHeader("title", "称号", CONSTRAINTS.title.min, CONSTRAINTS.title.max, CONSTRAINTS.title.desc)}
          <div className="flex gap-2">
            <input
              id="input-title"
              type="text"
              placeholder="例: まだ曖昧な価値に問いを置く人"
              className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1644B5]/10 focus:border-[#1644B5] font-sans font-bold text-[#1644B5]"
              value={card.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
            />
            <button
              id="btn-ai-title"
              type="button"
              onClick={() => triggerAiAssist("title", "称号", CONSTRAINTS.title.max)}
              className="px-3 py-2 bg-blue-50/40 hover:bg-blue-100/60 text-[#1644B5] border border-blue-200/50 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-all hover:scale-[1.02] cursor-pointer"
              title="AIに文章を整えてもらう"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>AI文章補助</span>
            </button>
          </div>
        </div>

        {/* 2. Introduction / 紹介 */}
        <div className="flex flex-col p-4 border border-stone-200/80 rounded-xl hover:border-stone-300 transition-colors bg-white shadow-sm">
          {renderFieldHeader("introduction", "紹介", CONSTRAINTS.introduction.min, CONSTRAINTS.introduction.max, CONSTRAINTS.introduction.desc)}
          <div className="flex gap-2 items-start">
            <textarea
              id="input-introduction"
              rows={3}
              placeholder="例: まだ課題として認識されていない価値を、対話と問いから見つける支援者です。"
              className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1644B5]/10 focus:border-[#1644B5] resize-y font-medium"
              value={card.introduction}
              onChange={(e) => handleFieldChange("introduction", e.target.value)}
            />
            <button
              id="btn-ai-introduction"
              type="button"
              onClick={() => triggerAiAssist("introduction", "紹介文", CONSTRAINTS.introduction.max)}
              className="px-3 py-2 bg-blue-50/40 hover:bg-blue-100/60 text-[#1644B5] border border-blue-200/50 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-all hover:scale-[1.02] cursor-pointer"
              title="AIに文章を整えてもらう"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>AI文章補助</span>
            </button>
          </div>
        </div>

        {/* 3. Entrance / 入口 */}
        <div className="flex flex-col p-4 border border-stone-200/80 rounded-xl hover:border-stone-300 transition-colors bg-white shadow-sm">
          {renderFieldHeader("entryPoint", "入口", CONSTRAINTS.entryPoint.min, CONSTRAINTS.entryPoint.max, CONSTRAINTS.entryPoint.desc)}
          <div className="flex gap-2 items-start">
            <textarea
              id="input-entryPoint"
              rows={3}
              placeholder="例: 言葉になっていない違和感や、関係者の間にある小さなずれを見る。"
              className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1644B5]/10 focus:border-[#1644B5] resize-y font-medium"
              value={card.entryPoint}
              onChange={(e) => handleFieldChange("entryPoint", e.target.value)}
            />
            <button
              id="btn-ai-entryPoint"
              type="button"
              onClick={() => triggerAiAssist("entryPoint", "支援の入口", CONSTRAINTS.entryPoint.max)}
              className="px-3 py-2 bg-blue-50/40 hover:bg-blue-100/60 text-[#1644B5] border border-blue-200/50 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-all hover:scale-[1.02] cursor-pointer"
              title="AIに文章を整えてもらう"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>AI文章補助</span>
            </button>
          </div>
        </div>

        {/* 4. Next Step / 一歩 */}
        <div className="flex flex-col p-4 border border-stone-200/80 rounded-xl hover:border-stone-300 transition-colors bg-white shadow-sm">
          {renderFieldHeader("nextStep", "一歩", CONSTRAINTS.nextStep.min, CONSTRAINTS.nextStep.max, CONSTRAINTS.nextStep.desc)}
          <div className="flex gap-2 items-start">
            <textarea
              id="input-nextStep"
              rows={2}
              placeholder="例: 次の打ち合わせでは、解決案を出す前に、相手の違和感を一つ聞く。"
              className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1644B5]/10 focus:border-[#1644B5] resize-y font-medium"
              value={card.nextStep}
              onChange={(e) => handleFieldChange("nextStep", e.target.value)}
            />
            <button
              id="btn-ai-nextStep"
              type="button"
              onClick={() => triggerAiAssist("nextStep", "明日からの一歩", CONSTRAINTS.nextStep.max)}
              className="px-3 py-2 bg-blue-50/40 hover:bg-blue-100/60 text-[#1644B5] border border-blue-200/50 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-all hover:scale-[1.02] cursor-pointer"
              title="AIに文章を整えてもらう"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>AI文章補助</span>
            </button>
          </div>
        </div>

        {/* 5. Origin / 原点 */}
        <div className="flex flex-col p-4 border border-stone-200/80 rounded-xl hover:border-stone-300 transition-colors bg-white shadow-sm">
          {renderFieldHeader("origin", "原点", CONSTRAINTS.origin.min, CONSTRAINTS.origin.max, CONSTRAINTS.origin.desc)}
          <div className="flex gap-2 items-start">
            <textarea
              id="input-origin"
              rows={3}
              placeholder="例: 既に見えている課題だけでは、その人や場所の本当の価値に、届かないと感じた経験。"
              className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1644B5]/10 focus:border-[#1644B5] resize-y font-medium"
              value={card.origin}
              onChange={(e) => handleFieldChange("origin", e.target.value)}
            />
            <button
              id="btn-ai-origin"
              type="button"
              onClick={() => triggerAiAssist("origin", "支援観の原点", CONSTRAINTS.origin.max)}
              className="px-3 py-2 bg-blue-50/40 hover:bg-blue-100/60 text-[#1644B5] border border-blue-200/50 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-all hover:scale-[1.02] cursor-pointer"
              title="AIに文章を整えてもらう"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>AI文章補助</span>
            </button>
          </div>
        </div>

        {/* 6. Philosophy / 哲学 */}
        <div className="flex flex-col p-4 border border-stone-200/80 rounded-xl hover:border-stone-300 transition-colors bg-white shadow-sm">
          {renderFieldHeader("philosophy", "哲学", CONSTRAINTS.philosophy.min, CONSTRAINTS.philosophy.max, CONSTRAINTS.philosophy.desc)}
          <div className="flex gap-2 items-start">
            <textarea
              id="input-philosophy"
              rows={4}
              placeholder="例: 私は、まだ曖昧な価値に、問いを置く支援者でありたい。すぐに課題を解決するのではなく、名づけられていないものの間に希望をつくる。"
              className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1644B5]/10 focus:border-[#1644B5] resize-y font-medium"
              value={card.philosophy}
              onChange={(e) => handleFieldChange("philosophy", e.target.value)}
            />
            <button
              id="btn-ai-philosophy"
              type="button"
              onClick={() => triggerAiAssist("philosophy", "支援哲学", CONSTRAINTS.philosophy.max)}
              className="px-3 py-2 bg-blue-50/40 hover:bg-blue-100/60 text-[#1644B5] border border-blue-200/50 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-all hover:scale-[1.02] cursor-pointer"
              title="AIに文章を整えてもらう"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>AI文章補助</span>
            </button>
          </div>
        </div>

        {/* 7. Keywords / キーワード (3 inline fields) */}
        <div className="flex flex-col p-4 border border-stone-200/80 rounded-xl hover:border-stone-300 bg-white shadow-sm">
          <div className="flex justify-between items-baseline mb-2">
            <label className="text-sm font-sans font-extrabold text-stone-900 flex items-center gap-1">
              <span>キーワード</span>
              <span className="text-xs font-normal font-sans text-stone-500">（自分の支援を表す3つの言葉）</span>
            </label>
            <span className="text-xs text-stone-400 font-semibold font-sans">
              {(card.keywords || []).filter(k => k.trim()).length} / 3語
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-50 text-[#1644B5] font-bold text-xs flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <input
                  id={`input-keyword-${i}`}
                  type="text"
                  placeholder={`例: キーワード ${i + 1}`}
                  className="flex-1 px-3 py-1.5 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1644B5]/10 focus:border-[#1644B5] font-medium"
                  value={card.keywords?.[i] || ""}
                  onChange={(e) => handleKeywordChange(i, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- AI Assist Dialog Modal --- */}
      {aiDialog && (
        <div id="ai-assist-modal" className="fixed inset-0 bg-stone-900/45 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200/80 flex flex-col gap-4 max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-[#1644B5]">
                <Sparkles className="w-5 h-5 fill-[#1644B5]" />
                <h3 className="font-sans font-black text-base text-stone-900">AI文章補助：{aiDialog.fieldLabel}</h3>
              </div>
              <button
                id="btn-close-ai"
                onClick={() => setAiDialog(null)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-50 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
              {/* API Key Configuration Section */}
              <div className="border border-stone-200 rounded-xl overflow-hidden bg-stone-50/50">
                <button
                  type="button"
                  onClick={() => setShowApiKeySection(!showApiKeySection)}
                  className="w-full px-4 py-2.5 flex items-center justify-between bg-stone-50 hover:bg-stone-100 transition-colors text-left"
                >
                  <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5 font-sans">
                    <Key className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>🔑 独自のGemini APIキーを使用する（無課金・個人ホスト対応）</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-sans ${
                      userApiKey ? "bg-emerald-100 text-emerald-800" : "bg-stone-200/80 text-stone-600"
                    }`}>
                      {userApiKey ? "設定済み（優先利用中）" : "未設定（サーバー用を使用）"}
                    </span>
                    {showApiKeySection ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                  </div>
                </button>
                {showApiKeySection && (
                  <div className="p-4 border-t border-stone-200 bg-white flex flex-col gap-3 text-xs">
                    <p className="text-stone-600 leading-relaxed font-sans text-[11px]">
                      Vercel等の無料枠でご自身でホスト（デプロブ）される際や、無課金でAI文章補助を使いたい場合、ご自身のGemini APIキーをここに設定できます。<strong className="text-[#1644B5]">キーはあなたのブラウザ（localStorage）にのみ安全に保存され</strong>、直接サーバーを介してGoogleのAPIを呼び出すために使用されます。
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="AIzaSy... （APIキーを入力してください）"
                        className="flex-1 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-[#1644B5]/10 focus:border-[#1644B5] font-mono"
                        value={userApiKey}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          setUserApiKey(val);
                          if (val) {
                            localStorage.setItem("user_gemini_api_key", val);
                          } else {
                            localStorage.removeItem("user_gemini_api_key");
                          }
                        }}
                      />
                      {userApiKey && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserApiKey("");
                            localStorage.removeItem("user_gemini_api_key");
                          }}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg font-bold hover:text-stone-800 transition-colors shrink-0"
                        >
                          クリア
                        </button>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-stone-400">
                      <span>※キーはいつでも削除・変更できます。</span>
                      <a
                        href="https://aistudio.google.com/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1644B5] hover:underline font-bold flex items-center gap-0.5"
                      >
                        無料のGemini APIキーを取得する（Google AI Studio） ↗
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Original sentence box */}
              <div className="bg-stone-50/80 p-3.5 rounded-lg border border-stone-200 text-xs">
                <span className="font-bold text-stone-500 block mb-1 font-sans">【元の文章】</span>
                <p className="text-stone-800 whitespace-pre-wrap font-sans leading-relaxed">{aiDialog.originalText || "（未入力）"}</p>
                <span className="text-[10px] text-stone-400 block mt-1 text-right font-sans">
                  （{aiDialog.originalText.length}文字）
                </span>
              </div>

              {/* Progress state */}
              {aiDialog.loading && (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <RefreshCw className="w-8 h-8 text-[#1644B5] animate-spin" />
                  <p className="text-sm font-bold text-stone-700">AIが推敲案（3案）を作成中...</p>
                  <p className="text-xs text-stone-400">（数秒かかります。新しい情報は追加せず、本人らしさを活かして整えます）</p>
                </div>
              )}

              {/* Error State */}
              {aiDialog.error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                  <p className="font-bold">❌ 提案の作成中にエラーが発生しました</p>
                  <p className="mt-1">{aiDialog.error}</p>
                  <button
                    onClick={() => triggerAiAssist(aiDialog.field, aiDialog.fieldLabel, aiDialog.maxLength)}
                    className="mt-2 text-[#1644B5] underline font-bold"
                  >
                    再試行する
                  </button>
                </div>
              )}

              {/* Suggestions list */}
              {!aiDialog.loading && !aiDialog.error && aiDialog.suggestions.length > 0 && (
                <div className="flex flex-col gap-4">
                  <div className="text-xs text-stone-600 bg-blue-50/30 p-3 rounded-lg border border-blue-100/50 leading-relaxed font-sans">
                    💡 <strong>AIルール遵守：</strong> 新しい事実は追加せず、元の意味を保ち、あなたらしい言葉づかいを残しながら <strong>{aiDialog.maxLength}文字以内</strong> に整えました。お好きな案を反映してください。
                  </div>
                  {aiDialog.suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="border border-stone-200 hover:border-blue-300 rounded-xl p-4 flex flex-col gap-3 hover:bg-blue-50/10 transition-all shadow-sm"
                    >
                      <div className="flex justify-between items-center border-b border-stone-100 pb-1.5 font-sans">
                        <span className="text-xs font-bold text-[#1644B5] px-2 py-0.5 bg-blue-50/60 rounded">
                          推敲案 {index + 1}
                        </span>
                        <span className="text-xs text-stone-500 font-bold">
                          {suggestion.length}文字
                        </span>
                      </div>
                      <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap font-sans">{suggestion}</p>
                      <div className="flex justify-end mt-1">
                        <button
                          id={`btn-apply-ai-${index}`}
                          onClick={() => {
                            handleFieldChange(aiDialog.field, suggestion);
                            setAiDialog(null);
                          }}
                          className="px-4 py-1.5 bg-[#1644B5] hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-all hover:scale-[1.02] cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>この案を反映する</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-stone-100 pt-3 flex justify-end font-sans">
              <button
                id="btn-close-ai-footer"
                onClick={() => setAiDialog(null)}
                className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-xs font-bold hover:bg-stone-50 transition-colors cursor-pointer"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
