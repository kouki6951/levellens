import type { Scorer, ScoreResult } from "./types";

// 2020 MEXT Gakunenbetsu Kanji Haitouhyo (1,026 kyōiku kanji).
// Source data was derived from the public KANJIDIC grade data; grades 1-6 map
// to the Japanese elementary school year in which each character is taught.
const KYOIKU_KANJI_BY_GRADE: Record<number, string> = {
  1: "日一人年大十二本中出三見月生五上四金九入立手力学円子目田八六下気小七山正女百先名川文千水男村口町校空土木車石足早白字音天火花赤青竹右森左休林王玉夕雨草犬耳虫糸貝",
  2: "国会長同時自行社分後前間東地合市内方今回新場米高明京通外言理体当首来作用強公野思家話多数記北午心点教書活原交元近考画海売組知道引半計直朝西台広電少工語止聞切食何南番算楽万店線声親形頭毎門答夜帰谷古歌買光科細図週丸室太歩風紙母黒戸春読色友走園秋馬父夏顔船羽岩角池星寺遠絵曜弱肉晴鳥冬里昼茶雪弟毛牛魚兄黄雲鳴矢妹姉才麦刀弓汽",
  3: "事発対部者業相定員開問代実決動全表調化主題意度期持取都和平世受区県進安院指界第予向勝面委反重集物使所次品死係感投打始島両式運終住談真流有局放球急送役身由転研消神配宮究育起着乗想病農州待族銀助追商葉落医仕去味負写守美命福整横深申様港注階路悪他橋岸客登速央号館屋根苦具鉄返短油昭植宿薬習倍駅波洋旅級幸練軽等曲庭血温庫坂服息板列遊君飲章酒悲秒暗勉陽皮歯柱祭筆童畑緑礼詩昔泳荷炭丁湖湯箱豆暑氷寒帳拾漢鼻皿羊笛",
  4: "議民連選関戦最氏約法不的要治成協以機加続改初産結府共得告軍参利案信別側求昨官特変各挙果必争無位置料建費付説夫害副席残念試象労例然験伝働景好賞辺英低失差課末極種量望松観察型票達良候史満敗管兵器士積録省周材健飛殺単完隊競給歴辞愛未航冷類児印標輪熱清覚億芸便停陸帯努固散司康静喜囲卒順紀博救老令徒貨季功欠底養街願希笑束仲栄札借節包折郡焼照堂飯典漁貯倉唱訓浴塩兆祝旗衣梅臣浅勇械菜刷牧泣孫毒径脈粉鏡巣灯胃芽腸",
  5: "政経現性制務統総領設保支報解資際査判在件団任増情示基価確提勢減容応演能再格過税検常状営職証可構比防断境規術護態導備条幹独輸述率武質衛張限額義退準造技復移個評非製財識程接授効旧師易券破編責修採織故弁因富貿講素河適婦寄益余禁逆久妻暴険均圧許留罪興精則測豊厚略承絶版損仏績築志混居雑招永刊像賛犯布属複似迷夢燃災預貸銭群謝仮賀快徳序舎慣敵液貧酸祖桜句墓鉱飼枝恩往肥俵綿銅眼耕潔舌",
  6: "党権派済認策論私革疑裁供割難補優収展宅視警訪域映担株姿閣衆若脳蔵段呼針専推値討処憲激否系批存盟座除降並従危拡就異将厳遺装諸亡劇模宣背盛皇臨署源創障筋延乱善庁城層裏密我勤幕染困傷著誌秘刻宇欲痛縮枚郵探骨射届巻揮閉賃貴暮簡納樹臓律至宗宙操誕孝純訳吸看奏翌片郷敬泉己忠沿誠忘俳宝胸砂誤聖洗尊窓幼潮鋼縦捨腹乳紅冊仁卵干頂穴暖朗肺熟晩陛拝棒糖覧奮蒸后班詞寸机磁灰垂穀絹尺蚕",
};

const KANJI_GRADE = new Map<string, number>(
  Object.entries(KYOIKU_KANJI_BY_GRADE).flatMap(([grade, characters]) =>
    [...characters].map((character) => [character, Number(grade)] as const),
  ),
);

const KANJI_PATTERN = /[\u3400-\u9fff]/gu;

export function japaneseSentenceLengths(text: string) {
  return text
    .split(/[。！？]+/u)
    .map((sentence) => sentence.replace(/\s/gu, "").length)
    .filter((length) => length > 0);
}

export function japaneseScoreDetails(text: string) {
  const kanji = text.match(KANJI_PATTERN) ?? [];
  const grades = kanji.map((character) => KANJI_GRADE.get(character) ?? 7);
  const lengths = japaneseSentenceLengths(text);
  const averageSentenceLength = lengths.length === 0 ? 0 : lengths.reduce((sum, length) => sum + length, 0) / lengths.length;
  const averageKanjiGrade = grades.length === 0 ? 1 : grades.reduce((sum, grade) => sum + Math.min(grade, 6.5), 0) / grades.length;
  const highGrade = grades.length === 0 ? 1 : [...grades].sort((a, b) => a - b)[Math.max(0, Math.ceil(grades.length * 0.8) - 1)];
  const unknownRatio = grades.length === 0 ? 0 : grades.filter((grade) => grade > 6).length / grades.length;
  const longSentencePenalty = Math.max(0, averageSentenceLength - 25) / 30;
  const score = Math.min(6.5, Math.max(1, averageKanjiGrade * 0.65 + Math.min(highGrade, 6.5) * 0.35 + unknownRatio * 0.8 + longSentencePenalty));
  const kanjiGrades = Object.fromEntries([...new Set(kanji)].map((character) => [character, KANJI_GRADE.get(character) ?? 7]));

  return { score: Number(score.toFixed(2)), averageSentenceLength: Number(averageSentenceLength.toFixed(1)), kanjiGrades };
}

export class JapaneseScorer implements Scorer {
  lang = "ja" as const;

  score(text: string): ScoreResult {
    const details = japaneseScoreDetails(text);
    return { metric: "ja_composite", score: details.score, details };
  }
}
