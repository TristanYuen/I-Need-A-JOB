export const generatedInterviewPrepFields = [
  "jdText",
  "jdAnalysis",
  "keyPoints",
  "matchAnalysis",
  "companyOverview",
  "businessProducts",
  "selfIntro",
  "motivationAnswer",
  "hrQuestions",
  "roleQuestions",
  "resumeQuestions",
  "scenarioQuestions",
  "reverseQuestions",
  "boundaryQuestions",
  "englishExcelPrep",
  "cheatSheet",
  "interviewNotes"
] as const;

export type GeneratedInterviewPrepField = (typeof generatedInterviewPrepFields)[number];

export type GeneratedInterviewPrep = Record<GeneratedInterviewPrepField, string>;

export function createEmptyGeneratedInterviewPrep(): GeneratedInterviewPrep {
  return generatedInterviewPrepFields.reduce<GeneratedInterviewPrep>((result, field) => {
    result[field] = "";
    return result;
  }, {} as GeneratedInterviewPrep);
}
