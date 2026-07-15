import type { InterviewPrep, Job, JobPriority, JobStatus, TimelineItem } from "@/lib/jobTypes";

const dayMs = 24 * 60 * 60 * 1000;

function formatDate(daysFromToday: number) {
  const date = new Date(Date.now() + daysFromToday * dayMs);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function createTimeline(content: string, date: string): TimelineItem[] {
  return [{ id: crypto.randomUUID(), date, type: "created", content }];
}

type SampleInput = {
  company: string;
  title: string;
  functionDirection: string;
  industry: string;
  city: string;
  status: JobStatus;
  priority: JobPriority;
  deadline: string;
  nextAction: string;
  nextActionDate: string;
  channel: string;
  link: string;
  notes: string;
  jdText: string;
  interviewPrep?: InterviewPrep;
};

function sampleInputs(): SampleInput[] {
  return [
    {
      company: "宝洁",
      title: "Brand Management Trainee",
      functionDirection: "品牌管理",
      industry: "快消",
      city: "广州",
      status: "待投",
      priority: "高",
      deadline: formatDate(4),
      nextAction: "完善英文简历并投递",
      nextActionDate: formatDate(0),
      channel: "官网",
      link: "https://www.pg.com",
      notes: "重点关注品牌轮岗和英文材料。",
      jdText: "负责品牌策略、消费者洞察、市场活动执行与跨部门协同。",
      interviewPrep: {
        jdText: "负责品牌策略、消费者洞察、市场活动执行与跨部门协同。",
        keyPoints: "准备品牌定位、消费者洞察和跨部门推进案例，重点突出数据复盘能力。",
        companyOverview: "宝洁是全球快消公司，品牌矩阵丰富，重视消费者理解、品牌管理和长期人才培养。",
        businessProducts: "核心业务覆盖日化、个护、母婴等品类，代表品牌包括海飞丝、飘柔、护舒宝等。",
        selfIntro: "用市场项目经历切入，强调对消费者需求的洞察、项目推进和结果复盘。",
        reverseQuestions: "品牌管培生在第一年通常会接触哪些品类和市场项目？"
      }
    },
    {
      company: "腾讯",
      title: "产品运营培训生",
      functionDirection: "产品运营",
      industry: "互联网",
      city: "深圳",
      status: "已投",
      priority: "高",
      deadline: formatDate(9),
      nextAction: "等待笔试通知",
      nextActionDate: formatDate(2),
      channel: "官网",
      link: "https://join.qq.com",
      notes: "补充游戏和内容平台经历。",
      jdText: "参与产品运营策略制定、用户增长、活动策划和数据复盘。",
      interviewPrep: {
        jdText: "参与产品运营策略制定、用户增长、活动策划和数据复盘。",
        keyPoints: "准备用户增长、活动运营、指标拆解和跨团队协作案例。",
        companyOverview: "腾讯以社交、内容、游戏和企业服务为核心业务，强调产品体验和生态连接。",
        businessProducts: "重点关注微信生态、腾讯会议、腾讯文档、游戏与内容平台的运营逻辑。",
        selfIntro: "突出内容运营和用户增长项目，说明如何发现问题、设计动作并复盘指标。",
        reverseQuestions: "产品运营培训生进入业务后，通常如何参与核心指标拆解？"
      }
    },
    {
      company: "安踏",
      title: "品牌传播实习生",
      functionDirection: "公关传播",
      industry: "运动户外",
      city: "厦门",
      status: "面试",
      priority: "高",
      deadline: formatDate(2),
      nextAction: "准备品牌案例复盘",
      nextActionDate: formatDate(1),
      channel: "内推",
      link: "https://www.anta.com",
      notes: "突出运动户外项目经验。",
      jdText: "协助品牌传播项目、媒体沟通、内容策划和活动执行。"
    },
    {
      company: "京东",
      title: "商家运营管培生",
      functionDirection: "商家运营",
      industry: "电商",
      city: "北京",
      status: "笔试",
      priority: "中",
      deadline: formatDate(6),
      nextAction: "完成行测和商业分析练习",
      nextActionDate: formatDate(0),
      channel: "学校就业网",
      link: "https://campus.jd.com",
      notes: "关注平台商家增长和大促案例。",
      jdText: "负责商家经营分析、活动运营、资源协调和平台规则落地。"
    },
    {
      company: "欧莱雅",
      title: "市场管培生",
      functionDirection: "市场营销",
      industry: "美妆个护",
      city: "上海",
      status: "收藏",
      priority: "中",
      deadline: formatDate(3),
      nextAction: "整理品牌项目案例",
      nextActionDate: formatDate(3),
      channel: "公众号",
      link: "https://www.loreal.com",
      notes: "适合用美妆内容营销经历匹配。",
      jdText: "参与品牌营销计划、消费者研究、产品上市和渠道沟通。"
    },
    {
      company: "万博宣伟",
      title: "PR Intern",
      functionDirection: "公关传播",
      industry: "广告 / 公关 / 代理商",
      city: "上海",
      status: "已投",
      priority: "中",
      deadline: formatDate(12),
      nextAction: "跟进邮件反馈",
      nextActionDate: formatDate(-1),
      channel: "实习僧",
      link: "https://www.webershandwick.com",
      notes: "补充英文新闻稿和媒体关系经历。",
      jdText: "支持公关传播项目、媒体清单维护、新闻稿撰写和客户沟通。"
    },
    {
      company: "字节跳动",
      title: "内容运营",
      functionDirection: "内容运营",
      industry: "互联网",
      city: "北京",
      status: "待投",
      priority: "低",
      deadline: formatDate(15),
      nextAction: "补充内容增长项目数据",
      nextActionDate: formatDate(5),
      channel: "牛客",
      link: "https://jobs.bytedance.com",
      notes: "投递前强化数据指标。",
      jdText: "负责内容生态运营、作者增长、活动策划和效果分析。"
    },
    {
      company: "Nike",
      title: "Retail Management Trainee",
      functionDirection: "零售管理",
      industry: "运动户外",
      city: "上海",
      status: "Offer",
      priority: "高",
      deadline: formatDate(-5),
      nextAction: "确认入职材料",
      nextActionDate: formatDate(7),
      channel: "LinkedIn",
      link: "https://jobs.nike.com",
      notes: "已收到口头 Offer，等待正式邮件。",
      jdText: "参与门店运营、团队管理、零售数据分析和消费者体验优化。"
    }
  ];
}

export function createSampleJobs(): Job[] {
  const now = new Date().toISOString();

  return sampleInputs().map((sample, index) => ({
    id: crypto.randomUUID(),
    ...sample,
    timeline: createTimeline("创建岗位记录", now),
    createdAt: new Date(Date.now() - (index + 1) * dayMs).toISOString(),
    updatedAt: now
  }));
}

export function createEmptyJob(): Job {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    company: "",
    title: "",
    functionDirection: "其他",
    industry: "其他",
    city: "",
    status: "收藏",
    priority: "中",
    deadline: "",
    nextAction: "",
    nextActionDate: "",
    channel: "其他",
    link: "",
    notes: "",
    jdText: "",
    interviewPrep: {
      sourceText: "",
      jdText: "",
      keyPoints: "",
      companyOverview: "",
      businessProducts: "",
      selfIntro: "",
      resumeQuestions: "",
      roleQuestions: "",
      reverseQuestions: "",
      interviewNotes: "",
      aiStatus: "empty",
      aiSource: "manual"
    },
    timeline: createTimeline("创建岗位记录", now),
    createdAt: now,
    updatedAt: now
  };
}

