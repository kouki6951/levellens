import type { UiLocale } from "@/lib/ui-i18n";

type GuideSection = { step: string; title: string; body: string; bullets: string[] };

export type GuideContent = {
  navLabel: string;
  eyebrow: string;
  title: string;
  intro: string;
  sections: GuideSection[];
  startLabel: string;
};

export const GUIDE_CONTENT: Record<UiLocale, GuideContent> = {
  en: {
    navLabel: "Guide",
    eyebrow: "Teacher guide",
    title: "How to use LevelLens",
    intro: "Turn one teaching text into reading-level versions, then review the language support and export classroom materials.",
    startLabel: "Create material",
    sections: [
      { step: "01", title: "Add teaching material", body: "Start with pasted text or import one public web article URL. Review imported text before creating a job.", bullets: ["Choose EN, ES, or JA, or let LevelLens detect the language.", "Use 200 to 8,000 characters of teaching material.", "Confirm that you may use an imported article for teaching."] },
      { step: "02", title: "Choose reading levels", body: "Select one to four target levels. Levels appear from lower to higher difficulty throughout the workspace.", bullets: ["English: Grade 2-3 through ELL A2-B1.", "Spanish: Grado 2-3 through CEFR A2-B1.", "Japanese: elementary bands and JLPT N4-N3."] },
      { step: "03", title: "Review the result", body: "Compare the original material with the selected simplified version. The active level remains selected while its work continues.", bullets: ["An animated status shows conversion, verification, and later steps.", "Readability shows the deterministic score, target range, and attempts.", "A near match can be regenerated from the simplified-text panel."] },
      { step: "04", title: "Use language focus", body: "Language focus highlights three teachable expressions from the simplified text. It prioritizes grammar and sentence patterns over topic vocabulary.", bullets: ["Click an item to find its exact span in the text.", "Read the explanation to see how the expression works in context.", "Linked questions can check the use of a language-focus expression."] },
      { step: "05", title: "Prepare classroom materials", body: "Open Questions to review four-choice comprehension questions, then open Export to prepare a worksheet.", bullets: ["Select completed levels for one combined PDF.", "Choose a student copy or a teacher copy with answers and quality details.", "Imported materials keep their source domain and access date in the worksheet."] },
      { step: "06", title: "Return to prior work", body: "History keeps recent conversions available for review or reuse as a new material.", bullets: ["Search by source title or text.", "Filter by job status.", "Reuse keeps the original text, language, and selected levels."] },
      { step: "07", title: "Understand quality checks", body: "LevelLens verifies the generated draft with a deterministic readability score, then checks factual consistency against the original material.", bullets: ["Readability reports the metric, the target range, and the number of verification attempts.", "In range means the score reached the selected level's target; near match means the last draft is usable but outside that range.", "Fact consistency counts claims that were retained, simplified, or lost. Open details when you need to inspect the claims."] },
      { step: "08", title: "Resolve a result that needs attention", body: "A level can finish as a near match or fail without blocking the other selected levels.", bullets: ["Use Regenerate level for a failed or near-match level. It replaces that level's text, language focus, and questions.", "If an imported URL cannot be read, check that it is a public HTML article, not a login page, PDF, or paywalled article.", "Use History to keep a useful source text and try different levels later."] },
    ],
  },
  es: {
    navLabel: "Guía",
    eyebrow: "Guía docente",
    title: "Cómo usar LevelLens",
    intro: "Convierte un texto didáctico en varias versiones por nivel de lectura, revisa el apoyo lingüístico y exporta materiales para clase.",
    startLabel: "Crear material",
    sections: [
      { step: "01", title: "Añade material didáctico", body: "Pega texto o importa la URL de un artículo web público. Revisa el texto importado antes de crear el trabajo.", bullets: ["Elige EN, ES o JA, o deja que LevelLens detecte el idioma.", "Usa entre 200 y 8.000 caracteres.", "Confirma que puedes utilizar un artículo importado para la enseñanza."] },
      { step: "02", title: "Elige niveles de lectura", body: "Selecciona de uno a cuatro niveles objetivo. Los niveles aparecen de menor a mayor dificultad.", bullets: ["Inglés: de Grade 2-3 a ELL A2-B1.", "Español: de Grado 2-3 a CEFR A2-B1.", "Japonés: bandas de primaria y JLPT N4-N3."] },
      { step: "03", title: "Revisa el resultado", body: "Compara el material original con la versión simplificada seleccionada. El nivel activo permanece seleccionado durante el proceso.", bullets: ["El estado animado muestra conversión, verificación y pasos posteriores.", "La legibilidad muestra puntuación determinista, objetivo e intentos.", "Puedes regenerar un resultado aproximado desde el panel de texto simplificado."] },
      { step: "04", title: "Usa el enfoque lingüístico", body: "El enfoque lingüístico resalta tres expresiones enseñables del texto simplificado. Prioriza gramática y estructuras de oración.", bullets: ["Haz clic en un elemento para encontrarlo en el texto.", "Lee la explicación para entender su función en contexto.", "Las preguntas vinculadas pueden comprobar el uso de una expresión."] },
      { step: "05", title: "Prepara materiales para clase", body: "Abre Preguntas para revisar preguntas de comprensión de cuatro opciones y Exportar para preparar una hoja de trabajo.", bullets: ["Selecciona niveles terminados para un PDF combinado.", "Elige una copia para estudiantes o docentes con respuestas y detalles de calidad.", "Los materiales importados conservan el dominio y la fecha de acceso."] },
      { step: "06", title: "Vuelve a trabajos anteriores", body: "El historial conserva conversiones recientes para revisarlas o reutilizarlas como material nuevo.", bullets: ["Busca por título o texto de origen.", "Filtra por estado.", "Reutilizar conserva texto, idioma y niveles seleccionados."] },
      { step: "07", title: "Comprende las verificaciones de calidad", body: "LevelLens verifica el borrador con una puntuación de legibilidad determinista y después comprueba la coherencia factual con el material original.", bullets: ["La legibilidad muestra la métrica, el rango objetivo y el número de intentos.", "Dentro del rango significa que se alcanzó el objetivo; aproximado indica que el último borrador es utilizable pero quedó fuera del rango.", "La coherencia factual cuenta afirmaciones conservadas, simplificadas u omitidas. Abre los detalles para revisarlas."] },
      { step: "08", title: "Resuelve un resultado que requiere atención", body: "Un nivel puede terminar como aproximado o fallar sin bloquear los demás niveles seleccionados.", bullets: ["Usa Regenerar nivel para un nivel fallido o aproximado. Reemplaza el texto, enfoque lingüístico y preguntas de ese nivel.", "Si no se puede leer una URL importada, comprueba que sea un artículo HTML público, no una página con acceso, PDF o muro de pago.", "Usa el historial para conservar un texto útil y probar otros niveles más tarde."] },
    ],
  },
  ja: {
    navLabel: "使い方",
    eyebrow: "教師用ガイド",
    title: "LevelLens の使い方",
    intro: "1つの教材から読解レベル別の文章を作り、言語のポイントを確認して、授業用の教材として出力します。",
    startLabel: "教材を作成",
    sections: [
      { step: "01", title: "教材を追加する", body: "本文を貼り付けるか、公開 Web 記事の URL を取り込みます。URL から取得した本文は、作成前に確認・編集できます。", bullets: ["EN・ES・JA を選ぶか、言語検出を使います。", "教材は200〜8,000文字で入力します。", "取り込んだ記事を授業で利用できることを確認します。"] },
      { step: "02", title: "読解レベルを選ぶ", body: "対象レベルを1〜4件選びます。ワークスペースでは、低い難度から高い難度の順に表示されます。", bullets: ["英語: Grade 2-3 から ELL A2-B1。", "スペイン語: Grado 2-3 から CEFR A2-B1。", "日本語: 小学校向けの段階と JLPT N4-N3。"] },
      { step: "03", title: "結果を確認する", body: "元の教材と、選択したレベルの変換文を見比べます。処理中も、選択中のレベルタブは変わりません。", bullets: ["アニメーション付きの状態表示で、変換・検証・後続処理を確認できます。", "読みやすさには決定的なスコア、目標範囲、試行回数が表示されます。", "近似達成の結果は、変換文パネルから再生成できます。"] },
      { step: "04", title: "言語のポイントを使う", body: "言語のポイントは、変換文から授業で扱える表現を3つ示します。内容語よりも、文法や文型を優先します。", bullets: ["項目をクリックすると、本文中の該当箇所へ移動します。", "解説で、その表現が文中で果たす働きを確認します。", "連動した問題では、表現の使い方を確認できます。"] },
      { step: "05", title: "授業用教材を準備する", body: "問題画面で4択の読解問題を確認し、出力画面でワークシートを準備します。", bullets: ["完了したレベルを選択して、1つの PDF にまとめます。", "生徒用、または解答・品質情報付きの教師用を選べます。", "URL から取り込んだ教材には、出典ドメインと取得日が表示されます。"] },
      { step: "06", title: "過去の教材を使う", body: "履歴では、過去の変換結果を確認したり、新しい教材として再利用したりできます。", bullets: ["元のタイトルや本文で検索できます。", "処理状態で絞り込めます。", "再利用すると、本文・言語・対象レベルを引き継ぎます。"] },
      { step: "07", title: "品質確認の見方", body: "LevelLens は、決定的な読みやすさスコアで変換文を検証し、その後に元の教材との事実の整合性を確認します。", bullets: ["読みやすさには、指標・目標範囲・検証試行回数が表示されます。", "目標範囲内は選択レベルの目標に到達した状態、近似達成は使える文章ですが範囲外の状態です。", "事実の整合性では、保持・簡略化・欠落した内容の数を確認できます。必要に応じて詳細を開きます。"] },
      { step: "08", title: "確認が必要な結果への対応", body: "一部のレベルが近似達成または失敗になっても、ほかの選択レベルの処理は止まりません。", bullets: ["失敗または近似達成のレベルは、レベル再生成で再実行できます。本文・言語のポイント・問題がそのレベルだけ更新されます。", "URL を取り込めない場合は、公開 HTML 記事であること、ログイン画面・PDF・有料記事ではないことを確認します。", "履歴に残した教材を使い、あとから別のレベルで試すこともできます。"] },
    ],
  },
};
