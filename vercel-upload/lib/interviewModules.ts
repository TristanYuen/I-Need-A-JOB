import type { InterviewPrep } from "@/lib/jobTypes";

export type InterviewModuleId =
  | "jd"
  | "match"
  | "self-intro"
  | "hr"
  | "role"
  | "resume"
  | "scenario"
  | "reverse"
  | "english-excel"
  | "cheat-sheet";

export type InterviewPrepField = keyof Pick<
  InterviewPrep,
  | "jdText"
  | "jdAnalysis"
  | "keyPoints"
  | "matchAnalysis"
  | "companyOverview"
  | "businessProducts"
  | "selfIntro"
  | "motivationAnswer"
  | "hrQuestions"
  | "resumeQuestions"
  | "roleQuestions"
  | "scenarioQuestions"
  | "reverseQuestions"
  | "boundaryQuestions"
  | "englishExcelPrep"
  | "cheatSheet"
  | "interviewNotes"
>;

export type InterviewModule = {
  id: InterviewModuleId;
  title: string;
  description: string;
  fields: Array<{
    key: InterviewPrepField;
    label: string;
    description: string;
    rows: number;
  }>;
};

export const interviewModules: InterviewModule[] = [
  {
    id: "jd",
    title: "JD 拆解：岗位真正筛什么",
    description: "整理 JD 原文、关键词、隐藏风险和岗位筛选逻辑。",
    fields: [
      {
        key: "jdText",
        label: "JD 原文整理",
        description: "保留核心岗位职责、任职要求、加分项和关键词，方便后续复盘。",
        rows: 10
      },
      {
        key: "jdAnalysis",
        label: "JD 关键词拆解与隐藏风险",
        description: "拆出岗位真正看重的能力、任务边界、潜在坑点和需要追问的信息。",
        rows: 12
      }
    ]
  },
  {
    id: "match",
    title: "候选人与岗位匹配度判断",
    description: "把岗位要求和简历证据对齐，提前准备风险补救说法。",
    fields: [
      {
        key: "matchAnalysis",
        label: "匹配度判断与简历证据映射",
        description: "包含总体匹配度、可引用经历、短板风险和补救表达。",
        rows: 14
      },
      {
        key: "keyPoints",
        label: "岗位准备重点",
        description: "记录最需要强化的能力、经历和面试前动作。",
        rows: 10
      }
    ]
  },
  {
    id: "self-intro",
    title: "开场自我介绍与求职动机",
    description: "准备 60 秒开场、30 秒精简版和转岗 / 投递动机解释。",
    fields: [
      {
        key: "selfIntro",
        label: "自我介绍",
        description: "针对当前岗位准备的 60 秒版本和 30 秒精简版。",
        rows: 12
      },
      {
        key: "motivationAnswer",
        label: "求职动机 / 转岗解释",
        description: "回答为什么选择这个岗位、公司和方向，避免空泛表达。",
        rows: 10
      }
    ]
  },
  {
    id: "hr",
    title: "HR 高频问题与参考答案",
    description: "准备稳定性、动机、优势短板、规划、薪资等 HR 常见问题。",
    fields: [
      {
        key: "hrQuestions",
        label: "HR 高频问答",
        description: "用 Q/A 形式整理参考答案，并保留每题的回答抓手。",
        rows: 18
      }
    ]
  },
  {
    id: "role",
    title: "专业问题与业务研究",
    description: "结合公司、业务、岗位职责和行业理解准备专业问题。",
    fields: [
      {
        key: "companyOverview",
        label: "公司主要信息",
        description: "记录公司定位、主营业务、行业位置、雇主特点和需核实信息。",
        rows: 10
      },
      {
        key: "businessProducts",
        label: "业务 / 产品信息",
        description: "记录核心产品、业务线、用户、商业模式和竞品理解。",
        rows: 10
      },
      {
        key: "roleQuestions",
        label: "专业问题与参考答案",
        description: "覆盖岗位理解、能力要求、行业理解和业务场景题。",
        rows: 16
      }
    ]
  },
  {
    id: "resume",
    title: "简历深挖问题与参考答案",
    description: "围绕实习、项目、校园经历、成果数据准备追问。",
    fields: [
      {
        key: "resumeQuestions",
        label: "简历深挖问答",
        description: "面试官可能追问的经历问题、回答思路和风险点。",
        rows: 18
      }
    ]
  },
  {
    id: "scenario",
    title: "情景分析题：按结果展开分析",
    description: "提前准备业务场景、指标异常、执行推进和复盘题。",
    fields: [
      {
        key: "scenarioQuestions",
        label: "情景分析题",
        description: "用题目、拆解步骤、回答框架和示范要点组织。",
        rows: 16
      }
    ]
  },
  {
    id: "reverse",
    title: "反问与边界问题",
    description: "准备反问、远程办公、共创成长、薪资口径和风险信号。",
    fields: [
      {
        key: "reverseQuestions",
        label: "反问问题",
        description: "偏向岗位、团队、业务和成长，避免过早聚焦福利。",
        rows: 10
      },
      {
        key: "boundaryQuestions",
        label: "边界问题与安全话术",
        description: "准备远程办公、共创成长、薪资沟通、风险信号和安全表达。",
        rows: 12
      }
    ]
  },
  {
    id: "english-excel",
    title: "英文与 Excel 小测试准备",
    description: "准备英文自我介绍、岗位英文词汇和常见 Excel 问题。",
    fields: [
      {
        key: "englishExcelPrep",
        label: "英文与 Excel 准备",
        description: "包含英文自我介绍、业务英文词、Excel 常见考点和简单模拟题。",
        rows: 14
      }
    ]
  },
  {
    id: "cheat-sheet",
    title: "最后一天速记版",
    description: "把面试前最后一天真正要背的内容压缩成小抄。",
    fields: [
      {
        key: "cheatSheet",
        label: "速记小抄",
        description: "包含必背句、避免说法、面试结束跟进消息等。",
        rows: 12
      },
      {
        key: "interviewNotes",
        label: "面试记录 / 复盘",
        description: "面试前检查清单和面试后复盘模板。",
        rows: 10
      }
    ]
  }
];

export function getInterviewModule(id: string) {
  return interviewModules.find((module) => module.id === id);
}

export function isModuleComplete(prep: InterviewPrep | undefined, module: InterviewModule) {
  return module.fields.some((field) => Boolean(prep?.[field.key]?.trim()));
}
