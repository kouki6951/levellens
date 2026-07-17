export type SimplifyOutput = {
  title: string;
  text: string;
};

export type FactCheckOutput = {
  retainedCount: number;
  simplifiedCount: number;
  lostCount: number;
  items: Array<{
    fact: string;
    status: "retained" | "simplified" | "lost";
    sourceSpan: string;
    note: string;
  }>;
};

export type KeyPhraseOutput = {
  phrases: Array<{
    position: number;
    phrase: string;
    charStart: number;
    charEnd: number;
    gloss: string;
  }>;
};

export type QuestionsOutput = {
  questions: Array<{
    orderIndex: number;
    type: "multiple_choice" | "open_ended";
    questionText: string;
    choices: string[];
    answer: string;
    explanation: string;
    keyPhrasePosition: number | null;
  }>;
};
