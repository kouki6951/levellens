import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const notoSansSource = typeof window === "undefined"
  ? `${process.cwd()}/public/fonts/NotoSansJP-Regular.otf`
  : "/fonts/NotoSansJP-Regular.otf";

Font.register({ family: "NotoSansJP", src: notoSansSource });

export type WorksheetQuestion = {
  id: string;
  orderIndex: number;
  questionText: string;
  choices: unknown;
  answer: string;
  explanation: string | null;
};

export type WorksheetLevel = {
  levelCode: string;
  levelLabel: string;
  simplifiedText: string;
  keyPhrases: Array<{ position: number; phrase: string; charStart: number; charEnd: number; gloss: string }>;
  questions: WorksheetQuestion[];
  quality?: {
    metric: string | null;
    score: number | null;
    targetMin: number | null;
    targetMax: number | null;
    retained: number | null;
    simplified: number | null;
    lost: number | null;
  };
};

export type WorksheetOptions = {
  keyPhraseBox: boolean;
  questions: boolean;
  answerPage: boolean;
  teacherSummary: boolean;
};

export type WorksheetLabels = {
  name: string;
  date: string;
  keyPhrases: string;
  questions: string;
  answerKey: string;
  readability: string;
  factConsistency: string;
  retained: string;
  simplified: string;
  lost: string;
};

export function worksheetLabelsFor(locale: "en" | "es" | "ja"): WorksheetLabels {
  if (locale === "ja") return { name: "名前", date: "日付", keyPhrases: "言語のポイント", questions: "問題", answerKey: "解答", readability: "読みやすさ", factConsistency: "事実の整合性", retained: "保持", simplified: "簡略化", lost: "欠落" };
  if (locale === "es") return { name: "Nombre", date: "Fecha", keyPhrases: "Enfoque lingüístico", questions: "Preguntas", answerKey: "Respuestas", readability: "Legibilidad", factConsistency: "Coherencia factual", retained: "Conservado", simplified: "Simplificado", lost: "Omitido" };
  return { name: "Name", date: "Date", keyPhrases: "Language focus", questions: "Questions", answerKey: "Answer key", readability: "Readability", factConsistency: "Fact consistency", retained: "Retained", simplified: "Simplified", lost: "Lost" };
}

const styles = StyleSheet.create({
  page: { padding: 42, fontFamily: "NotoSansJP", fontSize: 10, lineHeight: 1.6, color: "#1c1917" },
  header: { marginBottom: 18, borderBottomWidth: 1, borderBottomColor: "#a8a29e", paddingBottom: 8 },
  title: { fontSize: 18, fontWeight: 700 },
  level: { fontSize: 10, color: "#57534e", marginTop: 3 },
  fields: { flexDirection: "row", gap: 20, marginTop: 8, fontSize: 9, color: "#44403c" },
  body: { fontSize: 11, marginBottom: 16 },
  highlight: { backgroundColor: "#fde68a" },
  section: { marginTop: 14 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 6 },
  phraseBox: { borderWidth: 1, borderColor: "#d6d3d1", padding: 10, backgroundColor: "#fafaf9" },
  phrase: { marginBottom: 5 },
  question: { marginBottom: 10 },
  choice: { marginLeft: 10 },
  answer: { marginBottom: 8 },
  qualityBox: { marginTop: 12, borderWidth: 1, borderColor: "#d6d3d1", padding: 8, backgroundColor: "#f5f5f4" },
  qualityLine: { fontSize: 9, marginTop: 2 },
});

function markedText(text: string, phrases: WorksheetLevel["keyPhrases"]) {
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  for (const phrase of [...phrases].sort((a, b) => a.charStart - b.charStart)) {
    if (phrase.charStart < cursor) continue;
    nodes.push(text.slice(cursor, phrase.charStart));
    nodes.push(<Text key={`${phrase.position}-${phrase.charStart}`} style={styles.highlight}>{text.slice(phrase.charStart, phrase.charEnd)}</Text>);
    cursor = phrase.charEnd;
  }
  nodes.push(text.slice(cursor));
  return nodes;
}

function choicesFor(question: WorksheetQuestion) {
  return Array.isArray(question.choices) ? question.choices.filter((choice): choice is string => typeof choice === "string") : [];
}

export function WorksheetDocument({ title, source, levels, include, labels }: { title: string; source?: { domain: string; url: string; accessedAt: string | null } | null; levels: WorksheetLevel[]; include: WorksheetOptions; labels: WorksheetLabels }) {
  return (
    <Document title={`LevelLens - ${title}`}>
      {levels.map((level) => (
        <Page key={level.levelCode} size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.level}>{level.levelLabel}</Text>
            {source ? <Text style={styles.level}>{`Source: ${source.domain} | ${source.accessedAt ? new Date(source.accessedAt).toLocaleDateString("en-CA") : ""}`}</Text> : null}
            <View style={styles.fields}><Text>{`${labels.name}: ____________________`}</Text><Text>{`${labels.date}: ____________________`}</Text></View>
          </View>
          <Text style={styles.body}>{markedText(level.simplifiedText, level.keyPhrases)}</Text>
          {include.teacherSummary && level.quality ? <View style={styles.qualityBox}>
            <Text style={styles.qualityLine}>{`${labels.readability}: ${level.quality.metric ?? "-"} ${level.quality.score ?? "-"} (${level.quality.targetMin ?? "-"}-${level.quality.targetMax ?? "-"})`}</Text>
            <Text style={styles.qualityLine}>{`${labels.factConsistency}: ${labels.retained} ${level.quality.retained ?? 0} / ${labels.simplified} ${level.quality.simplified ?? 0} / ${labels.lost} ${level.quality.lost ?? 0}`}</Text>
          </View> : null}
          {include.keyPhraseBox ? <View style={[styles.section, styles.phraseBox]}>
            <Text style={styles.sectionTitle}>{labels.keyPhrases}</Text>
            {level.keyPhrases.map((phrase) => <Text key={phrase.position} style={styles.phrase}>{`${phrase.position}. ${phrase.phrase}: ${phrase.gloss}`}</Text>)}
          </View> : null}
          {include.questions ? <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>{labels.questions}</Text>
            {level.questions.map((question) => <View key={question.id} style={styles.question} wrap={false}>
              <Text>{`${question.orderIndex}. ${question.questionText}`}</Text>
              {choicesFor(question).map((choice, index) => <Text key={index} style={styles.choice}>{`${String.fromCharCode(65 + index)}. ${choice}`}</Text>)}
            </View>)}
          </View> : null}
        </Page>
      ))}
      {include.answerPage ? <Page size="A4" style={styles.page}>
        <View style={styles.header}><Text style={styles.title}>{labels.answerKey}</Text></View>
        {levels.flatMap((level) => level.questions.map((question) => <View key={question.id} style={styles.answer}>
          <Text>{`${level.levelLabel} - ${question.orderIndex}. ${question.answer}`}</Text>
          {question.explanation ? <Text>{question.explanation}</Text> : null}
        </View>))}
      </Page> : null}
    </Document>
  );
}
