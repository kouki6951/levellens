import type { UiLocale } from "@/lib/ui-i18n";

type FeedbackCopy = {
  conversionNeeds: string;
  addCharacters: (count: number) => string;
  reduceCharacters: (count: number) => string;
  chooseLevel: string;
  targetReached: string;
  targetOutside: string;
  scorePending: string;
  factsRetained: string;
  factsNeedReview: (count: number) => string;
  noHistoryAction: string;
  noResultsAction: string;
  resultUnavailable: string;
  resultUnavailableBody: string;
};

export const UI_FEEDBACK: Record<UiLocale, FeedbackCopy> = {
  en: {
    conversionNeeds: "Before converting",
    addCharacters: (count) => `Add ${count} more characters.`,
    reduceCharacters: (count) => `Remove ${count} characters to stay within 8,000.`,
    chooseLevel: "Choose at least one target level.",
    targetReached: "Target reached",
    targetOutside: "Outside target",
    scorePending: "Score in progress",
    factsRetained: "No facts marked lost",
    factsNeedReview: (count) => `${count} fact${count === 1 ? "" : "s"} to review`,
    noHistoryAction: "Create material",
    noResultsAction: "Clear filters",
    resultUnavailable: "This result is not available",
    resultUnavailableBody: "The job may have been removed or the link is incomplete. Return to History to open another material.",
  },
  es: {
    conversionNeeds: "Antes de convertir",
    addCharacters: (count) => `Anade ${count} caracteres mas.`,
    reduceCharacters: (count) => `Elimina ${count} caracteres para no superar 8.000.`,
    chooseLevel: "Elige al menos un nivel objetivo.",
    targetReached: "Objetivo alcanzado",
    targetOutside: "Fuera del objetivo",
    scorePending: "Puntuacion en proceso",
    factsRetained: "No hay hechos marcados como omitidos",
    factsNeedReview: (count) => `${count} hecho${count === 1 ? "" : "s"} para revisar`,
    noHistoryAction: "Crear material",
    noResultsAction: "Limpiar filtros",
    resultUnavailable: "Este resultado no esta disponible",
    resultUnavailableBody: "Es posible que el trabajo se haya eliminado o que el enlace este incompleto. Vuelve al Historial para abrir otro material.",
  },
  ja: {
    conversionNeeds: "変換前に確認してください",
    addCharacters: (count) => `あと${count}文字入力してください。`,
    reduceCharacters: (count) => `8,000文字以内にするため${count}文字減らしてください。`,
    chooseLevel: "対象レベルを1つ以上選択してください。",
    targetReached: "目標範囲内",
    targetOutside: "目標範囲外",
    scorePending: "スコアを確認中",
    factsRetained: "欠落として判定された事実はありません",
    factsNeedReview: (count) => `確認が必要な事実が${count}件あります`,
    noHistoryAction: "教材を作成",
    noResultsAction: "絞り込みを解除",
    resultUnavailable: "この結果は表示できません",
    resultUnavailableBody: "ジョブが削除されたか、リンクが不完全な可能性があります。履歴から別の教材を開いてください。",
  },
};
