import { SupporterCard } from "../types";
import { SAMPLE_CARD } from "../data/sample";

const STORAGE_KEY = "supporter_cards_list";
const ACTIVE_ID_KEY = "supporter_cards_active_id";

// Helper to generate a UUID-v4-like string
export function generateId(): string {
  return "card_" + Math.random().toString(36).substring(2, 11);
}

// Load cards from localStorage
export function loadCards(): SupporterCard[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load cards from localStorage", e);
  }

  // Fallback to initial sample card
  const defaultCard: SupporterCard = {
    id: generateId(),
    ...SAMPLE_CARD,
    name: "支援 太郎" // Let's give it a friendly name as a default starter
  };
  const list = [defaultCard];
  saveCards(list);
  return list;
}

// Save cards to localStorage
export function saveCards(cards: SupporterCard[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    return true;
  } catch (e) {
    console.error("Failed to save cards to localStorage", e);
    return false;
  }
}

// Load active card ID
export function loadActiveId(): string | null {
  return localStorage.getItem(ACTIVE_ID_KEY);
}

// Save active card ID
export function saveActiveId(id: string): void {
  localStorage.setItem(ACTIVE_ID_KEY, id);
}

// Validate structure of a single imported card object
export function isValidCard(obj: any): obj is SupporterCard {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.name === "string" &&
    typeof obj.affiliation === "string" &&
    typeof obj.contact === "string" &&
    typeof obj.title === "string" &&
    typeof obj.introduction === "string" &&
    typeof obj.origin === "string" &&
    typeof obj.philosophy === "string" &&
    typeof obj.entryPoint === "string" &&
    typeof obj.nextStep === "string" &&
    Array.isArray(obj.keywords) &&
    typeof obj.createdDate === "string"
  );
}

// Export list of cards as JSON file
export function exportToJsonFile(cards: SupporterCard[]) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cards, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "supporter-cards.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
