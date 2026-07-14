// Card Page Dimensions (A4 Portrait aspect ratio)
export const PAGE_WIDTH_IN = 8.267; // A4 standard width in inches
export const PAGE_HEIGHT_IN = 11.693; // A4 standard height in inches
export const ASPECT_RATIO = PAGE_HEIGHT_IN / PAGE_WIDTH_IN; // ~1.4144 (A4 portrait)

// Design Colors
export const COLORS = {
  bg: "#F6F2E9",          // Ivory background
  mainBlue: "#1644B5",    // Primary Royal Blue
  bodyText: "#1F1F1F",    // Main charcoal body text
  auxLine: "#D2C9BC",     // Clean, modern divider line
  borderLine: "#E2DCD0",  // Sophisticated subtle border line
  cardWhite: "#FFFFFF",   // Box white background
  placeholder: "#A49C90", // Muted brown-gray placeholder
};

// Character Constraints & Guidelines
export const CONSTRAINTS = {
  title: { min: 20, max: 45, label: "称号", desc: "あなたを一言で表す名前（支援者としての肩書やパーソナリティ）" },
  introduction: { min: 80, max: 200, label: "紹介", desc: "どんな人で、どんな支援をしているのか" },
  origin: { min: 50, max: 180, label: "原点", desc: "支援観が生まれた経験や想い" },
  philosophy: { min: 100, max: 280, label: "哲学", desc: "支援で大切にする信念や姿勢" },
  entryPoint: { min: 80, max: 200, label: "入口", desc: "支援の現場で最初に見るもの" },
  nextStep: { min: 50, max: 180, label: "一歩", desc: "明日から試す具体的行動" },
};

// Font sizing rules based on character count (optimized to prevent overflow)
// Returns { fontSizePt: number, warnOverflow: boolean }
export function getFieldFontSize(field: string, text: string): { fontSizePt: number; warnOverflow: boolean } {
  const len = text ? text.length : 0;
  let fontSizePt = 10;
  let warnOverflow = false;

  switch (field) {
    case "title": {
      if (len <= 15) {
        fontSizePt = 22;
      } else if (len <= 25) {
        fontSizePt = 18;
      } else if (len <= 35) {
        fontSizePt = 15;
      } else if (len <= 45) {
        fontSizePt = 12.5;
      } else {
        fontSizePt = 11;
        warnOverflow = true;
      }
      break;
    }
    case "introduction": {
      if (len <= 110) {
        fontSizePt = 10.5;
      } else if (len <= 150) {
        fontSizePt = 9.5;
      } else if (len <= 200) {
        fontSizePt = 9;
      } else {
        fontSizePt = 8;
        warnOverflow = true;
      }
      break;
    }
    case "origin": {
      if (len <= 90) {
        fontSizePt = 10.5;
      } else if (len <= 140) {
        fontSizePt = 9.5;
      } else if (len <= 180) {
        fontSizePt = 9;
      } else {
        fontSizePt = 8;
        warnOverflow = true;
      }
      break;
    }
    case "philosophy": {
      if (len <= 150) {
        fontSizePt = 10.5;
      } else if (len <= 210) {
        fontSizePt = 9.5;
      } else if (len <= 280) {
        fontSizePt = 9;
      } else {
        fontSizePt = 8;
        warnOverflow = true;
      }
      break;
    }
    case "entryPoint": {
      if (len <= 110) {
        fontSizePt = 10.5;
      } else if (len <= 150) {
        fontSizePt = 9.5;
      } else if (len <= 200) {
        fontSizePt = 9;
      } else {
        fontSizePt = 8;
        warnOverflow = true;
      }
      break;
    }
    case "nextStep": {
      if (len <= 90) {
        fontSizePt = 10.5;
      } else if (len <= 140) {
        fontSizePt = 9.5;
      } else if (len <= 180) {
        fontSizePt = 9;
      } else {
        fontSizePt = 8;
        warnOverflow = true;
      }
      break;
    }
    default:
      fontSizePt = 10;
  }

  return { fontSizePt, warnOverflow };
}

// Coordinate Layout Map (in inches)
export const LAYOUT = {
  header: {
    engTitle: { x: 0.6, y: 0.45, w: 4.5, h: 0.2 },
    subTitle: { x: 0.55, y: 0.65, w: 4.5, h: 0.95 },      // Used for giant Supporter Title/Role ("称号") - MOST PROMINENT!
    jpTitle: { x: 0.55, y: 1.62, w: 4.5, h: 0.38 },       // Used for Supporter Name (Slightly smaller, nested below)
    tagline: { x: 0.6, y: 2.05, w: 4.5, h: 0.25 },       // Static tagline description
    contactHeader: { x: 5.4, y: 0.65, w: 2.27, h: 0.2 },
    contactLine: { x: 5.4, y: 0.85, w: 2.27, h: 0.015 },
    affiliation: { x: 5.4, y: 0.95, w: 2.27, h: 0.55 },
    contact: { x: 5.4, y: 1.5, w: 2.27, h: 0.55 },
    createdDate: { x: 5.4, y: 2.05, w: 2.27, h: 0.25 },
    divider: { x: 0.6, y: 2.4, w: 7.067, h: 0.02 }
  },
  leftCol: {
    x: 0.6,
    w: 3.3,
    blocks: [
      {
        id: "introduction",
        label: "紹介文",
        subLabel: "どんな人で、どんな支援をしているのか",
        num: "01",
        y: 2.7,
        h: 2.4,
        icon: "BookOpen"
      },
      {
        id: "entryPoint",
        label: "私が見る支援の入口",
        subLabel: "支援の現場で最初に見るもの",
        num: "02",
        y: 5.35,
        h: 2.4,
        icon: "Target"
      },
      {
        id: "nextStep",
        label: "明日からの第一歩",
        subLabel: "明日から試す具体的な行動",
        num: "03",
        y: 8.0,
        h: 2.4,
        icon: "Rocket"
      }
    ]
  },
  rightCol: {
    x: 4.3,
    w: 3.37,
    blocks: [
      {
        id: "origin",
        label: "私の支援観の原点",
        subLabel: "支援観が生まれた経験や想い",
        num: "04",
        y: 2.7,
        h: 3.4,
        icon: "Heart"
      },
      {
        id: "philosophy",
        label: "私の支援哲学",
        subLabel: "支援で大切にする信念や姿勢",
        num: "05",
        y: 6.25,
        h: 2.65,
        icon: "Sparkles"
      },
      {
        id: "keywords",
        label: "キーワード",
        subLabel: "自分の支援を表す3つの言葉",
        num: "06",
        y: 9.05,
        h: 1.35,
        icon: "Bookmark"
      }
    ]
  },
  dividerLine: {
    x: 4.1,
    y: 2.7,
    w: 0.015,
    h: 7.7
  },
  footer: {
    quote: "あなたの支援が、誰かの未来をひらく。",
    y: 11.0,
    h: 0.3,
    x: 0.6,
    w: 7.067
  }
};
