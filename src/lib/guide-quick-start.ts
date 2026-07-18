import type { UiLocale } from "@/lib/ui-i18n";

export type GuideQuickStart = {
  title: string;
  body: string;
  steps: string[];
};

export const GUIDE_QUICK_START: Record<UiLocale, GuideQuickStart> = {
  en: {
    title: "Quick start",
    body: "Use this short path for your first classroom-ready result.",
    steps: [
      "Add or import one teaching text.",
      "Select the language and one to four target levels.",
      "Review the result, then open Questions or Export.",
    ],
  },
  es: {
    title: "Inicio rapido",
    body: "Sigue esta ruta breve para obtener tu primer material listo para clase.",
    steps: [
      "Anade o importa un texto didactico.",
      "Selecciona el idioma y de uno a cuatro niveles objetivo.",
      "Revisa el resultado y abre Preguntas o Exportar.",
    ],
  },
  ja: {
    title: "まずは3ステップ",
    body: "初めて使う場合は、この流れで授業用教材を作成できます。",
    steps: [
      "教材テキストを貼り付けるか、URLから取り込む。",
      "言語と1〜4件の対象レベルを選ぶ。",
      "結果を確認し、問題または出力を開く。",
    ],
  },
};
