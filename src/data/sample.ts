import { SupporterCard } from "../types";

export const SAMPLE_CARD: Omit<SupporterCard, "id"> = {
  name: "山田 太郎",
  affiliation: "特定非営利活動法人 ローカルサポーターズ",
  contact: "yamada@example.com / 090-1234-5678",
  title: "まだ曖昧な価値に問いを置く人",
  introduction: "まだ課題として認識されていない価値を、対話と問いから見つける支援者です。様々なステークホルダーの想いを引き出し、新たなプロジェクトの創出に伴走しています。",
  origin: "既に見えている課題だけでは、その人や場所の本当の価値に、届かないと感じた経験。表面的な課題解決を急ぐあまり、本質的な可能性が埋もれてしまう違和感を抱いたことが活動の原点です。",
  philosophy: "私は、まだ曖昧な価値に、問いを置く支援者でありたい。すぐに課題を解決するのではなく、人とまだ名づけられていないものの間に、希望が立ち上がる場をつくる。",
  entryPoint: "言葉になっていない違和感や、関係者の間にある小さなずれを見る。そこにこそ、本当に向き合うべき大切なテーマや新しい価値が眠っていると信じています。",
  nextStep: "次の打ち合わせでは、解決案を出す前に、相手の違和感を一つ聞く。",
  keywords: ["対話", "本質的価値", "違和感の探求"],
  createdDate: new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).replace(/\//g, "-") // e.g. 2026-07-13
};
