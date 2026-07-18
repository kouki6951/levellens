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
};

export type WorksheetOptions = {
  keyPhraseBox: boolean;
  questions: boolean;
  answerPage: boolean;
};

const styles = StyleSheet.create({
  page: { padding: 42, fontFamily: "NotoSansJP", fontSize: 10, lineHeight: 1.6, color: "#1c1917" },
  header: { marginBottom: 18, borderBottomWidth: 1, borderBottomColor: "#a8a29e", paddingBottom: 8 },
  title: { fontSize: 18, fontWeight: 700 },
  level: { fontSize: 10, color: "#57534e", marginTop: 3 },
  body: { fontSize: 11, marginBottom: 16 },
  highlight: { backgroundColor: "#fde68a" },
  section: { marginTop: 14 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 6 },
  phraseBox: { borderWidth: 1, borderColor: "#d6d3d1", padding: 10, backgroundColor: "#fafaf9" },
  phrase: { marginBottom: 5 },
  question: { marginBottom: 10 },
  choice: { marginLeft: 10 },
  answer: { marginBottom: 8 },
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

export function WorksheetDocument({ title, levels, include }: { title: string; levels: WorksheetLevel[]; include: WorksheetOptions }) {
  return (
    <Document title={`LevelLens - ${title}`}>
      {levels.map((level) => (
        <Page key={level.levelCode} size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.level}>{level.levelLabel}</Text>
          </View>
          <Text style={styles.body}>{markedText(level.simplifiedText, level.keyPhrases)}</Text>
          {include.keyPhraseBox ? <View style={[styles.section, styles.phraseBox]}>
            <Text style={styles.sectionTitle}>Key phrases</Text>
            {level.keyPhrases.map((phrase) => <Text key={phrase.position} style={styles.phrase}>{`${phrase.position}. ${phrase.phrase}: ${phrase.gloss}`}</Text>)}
          </View> : null}
          {include.questions ? <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Questions</Text>
            {level.questions.map((question) => <View key={question.id} style={styles.question} wrap={false}>
              <Text>{`${question.orderIndex}. ${question.questionText}`}</Text>
              {choicesFor(question).map((choice, index) => <Text key={index} style={styles.choice}>{`${String.fromCharCode(65 + index)}. ${choice}`}</Text>)}
            </View>)}
          </View> : null}
        </Page>
      ))}
      {include.answerPage ? <Page size="A4" style={styles.page}>
        <View style={styles.header}><Text style={styles.title}>Answer key</Text></View>
        {levels.flatMap((level) => level.questions.map((question) => <View key={question.id} style={styles.answer}>
          <Text>{`${level.levelLabel} - ${question.orderIndex}. ${question.answer}`}</Text>
          {question.explanation ? <Text>{question.explanation}</Text> : null}
        </View>))}
      </Page> : null}
    </Document>
  );
}
