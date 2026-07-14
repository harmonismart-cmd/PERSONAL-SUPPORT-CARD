export type SupporterCard = {
  id: string;
  name: string;
  affiliation: string;
  contact: string;
  title: string;
  introduction: string;
  origin: string;
  philosophy: string;
  entryPoint: string;
  nextStep: string;
  keywords: string[];
  createdDate: string;
};

export type WritingAssistResult = {
  suggestions: string[];
};
