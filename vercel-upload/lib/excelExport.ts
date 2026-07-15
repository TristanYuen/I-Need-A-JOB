import { getReminderLabel } from "@/lib/jobSorting";
import type { Job } from "@/lib/jobTypes";

type ExportColumn = {
  header: string;
  width: number;
  getValue: (job: Job) => string;
};

const exportColumns: ExportColumn[] = [
  { header: "公司", width: 18, getValue: (job) => job.company },
  { header: "岗位名称", width: 26, getValue: (job) => job.title },
  { header: "职能方向", width: 18, getValue: (job) => job.functionDirection },
  { header: "行业类型", width: 18, getValue: (job) => job.industry },
  { header: "城市", width: 12, getValue: (job) => job.city },
  { header: "状态", width: 12, getValue: (job) => job.status },
  { header: "优先级", width: 10, getValue: (job) => job.priority },
  { header: "投递日期", width: 14, getValue: (job) => job.deadline ?? "" },
  { header: "下一步动作", width: 28, getValue: (job) => job.nextAction ?? "" },
  { header: "下一步日期", width: 14, getValue: (job) => job.nextActionDate ?? "" },
  { header: "提醒", width: 14, getValue: (job) => getReminderLabel(job) },
  { header: "渠道", width: 16, getValue: (job) => job.channel ?? "" },
  { header: "链接", width: 36, getValue: (job) => job.link ?? "" },
  { header: "备注", width: 32, getValue: (job) => job.notes ?? "" },
  { header: "JD 原文", width: 48, getValue: (job) => job.interviewPrep?.jdText ?? job.jdText ?? "" },
  { header: "岗位信息源文本", width: 48, getValue: (job) => job.interviewPrep?.sourceText ?? "" },
  { header: "本岗位简历 ID", width: 24, getValue: (job) => job.interviewPrep?.selectedResumeId ?? "" },
  { header: "补充经历素材", width: 42, getValue: (job) => job.interviewPrep?.candidateContext ?? "" },
  { header: "历史截图文件名", width: 24, getValue: (job) => job.interviewPrep?.screenshot?.name ?? "" },
  { header: "AI 状态", width: 14, getValue: (job) => job.interviewPrep?.aiStatus ?? "" },
  { header: "AI 生成时间", width: 22, getValue: (job) => formatDateTime(job.interviewPrep?.aiGeneratedAt) },
  { header: "JD 拆解", width: 48, getValue: (job) => job.interviewPrep?.jdAnalysis ?? "" },
  { header: "岗位重点", width: 42, getValue: (job) => job.interviewPrep?.keyPoints ?? "" },
  { header: "匹配度判断", width: 48, getValue: (job) => job.interviewPrep?.matchAnalysis ?? "" },
  { header: "公司研究", width: 42, getValue: (job) => job.interviewPrep?.companyOverview ?? "" },
  { header: "业务 / 产品研究", width: 42, getValue: (job) => job.interviewPrep?.businessProducts ?? "" },
  { header: "自我介绍", width: 42, getValue: (job) => job.interviewPrep?.selfIntro ?? "" },
  { header: "求职动机 / 转岗解释", width: 42, getValue: (job) => job.interviewPrep?.motivationAnswer ?? "" },
  { header: "HR 高频问答", width: 48, getValue: (job) => job.interviewPrep?.hrQuestions ?? "" },
  { header: "简历深挖问题", width: 42, getValue: (job) => job.interviewPrep?.resumeQuestions ?? "" },
  { header: "专业问题", width: 42, getValue: (job) => job.interviewPrep?.roleQuestions ?? "" },
  { header: "情景分析题", width: 42, getValue: (job) => job.interviewPrep?.scenarioQuestions ?? "" },
  { header: "反问问题", width: 42, getValue: (job) => job.interviewPrep?.reverseQuestions ?? "" },
  { header: "边界问题与安全话术", width: 42, getValue: (job) => job.interviewPrep?.boundaryQuestions ?? "" },
  { header: "英文与 Excel 准备", width: 42, getValue: (job) => job.interviewPrep?.englishExcelPrep ?? "" },
  { header: "最后一天速记版", width: 42, getValue: (job) => job.interviewPrep?.cheatSheet ?? "" },
  { header: "面试记录 / 复盘", width: 42, getValue: (job) => job.interviewPrep?.interviewNotes ?? "" },
  { header: "创建时间", width: 22, getValue: (job) => formatDateTime(job.createdAt) },
  { header: "更新时间", width: 22, getValue: (job) => formatDateTime(job.updatedAt) }
];

const textEncoder = new TextEncoder();
const crcTable = createCrcTable();

function formatDateTime(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const pad = (number: number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function columnName(index: number) {
  let name = "";
  let value = index;

  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }

  return name;
}

function cellXml(rowIndex: number, columnIndex: number, value: string, styleId = 2) {
  const ref = `${columnName(columnIndex)}${rowIndex}`;
  const normalizedValue = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return `<c r="${ref}" t="inlineStr" s="${styleId}"><is><t xml:space="preserve">${escapeXml(
    normalizedValue
  )}</t></is></c>`;
}

function buildWorksheet(jobs: Job[]) {
  const cols = exportColumns
    .map((column, index) => `<col min="${index + 1}" max="${index + 1}" width="${column.width}" customWidth="1"/>`)
    .join("");
  const headerRow = `<row r="1">${exportColumns
    .map((column, index) => cellXml(1, index + 1, column.header, 1))
    .join("")}</row>`;
  const dataRows = jobs
    .map((job, rowIndex) => {
      const excelRowIndex = rowIndex + 2;
      const cells = exportColumns
        .map((column, columnIndex) => cellXml(excelRowIndex, columnIndex + 1, column.getValue(job)))
        .join("");
      return `<row r="${excelRowIndex}">${cells}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetViews>
    <sheetView workbookViewId="0">
      <pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  <cols>${cols}</cols>
  <sheetData>${headerRow}${dataRows}</sheetData>
</worksheet>`;
}

function buildWorkbook() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="秋招投递表" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;
}

function buildWorkbookRels() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function buildRootRels() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

function buildContentTypes() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;
}

function buildStyles() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Microsoft YaHei"/></font>
    <font><b/><sz val="11"/><name val="Microsoft YaHei"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEFF6FF"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color rgb="FFE2E8F0"/></left><right style="thin"><color rgb="FFE2E8F0"/></right><top style="thin"><color rgb="FFE2E8F0"/></top><bottom style="thin"><color rgb="FFE2E8F0"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
    <xf numFmtId="0" fontId="1" fillId="1" borderId="1" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1"><alignment vertical="top" wrapText="1"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

function createCrcTable() {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let value = index;

    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    table[index] = value >>> 0;
  }

  return table;
}

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of data) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function uint16(value: number) {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value, true);
  return bytes;
}

function uint32(value: number) {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value, true);
  return bytes;
}

function concatBytes(parts: Uint8Array[]) {
  const totalLength = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;

  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }

  return output;
}

function createZip(files: Array<{ path: string; content: string }>) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = textEncoder.encode(file.path);
    const dataBytes = textEncoder.encode(file.content);
    const crc = crc32(dataBytes);
    const localHeader = concatBytes([
      uint32(0x04034b50),
      uint16(20),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(crc),
      uint32(dataBytes.length),
      uint32(dataBytes.length),
      uint16(nameBytes.length),
      uint16(0),
      nameBytes
    ]);
    const centralHeader = concatBytes([
      uint32(0x02014b50),
      uint16(20),
      uint16(20),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(crc),
      uint32(dataBytes.length),
      uint32(dataBytes.length),
      uint16(nameBytes.length),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(0),
      uint32(offset),
      nameBytes
    ]);

    localParts.push(localHeader, dataBytes);
    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  const centralDirectory = concatBytes(centralParts);
  const endOfCentralDirectory = concatBytes([
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(files.length),
    uint16(files.length),
    uint32(centralDirectory.length),
    uint32(offset),
    uint16(0)
  ]);

  return concatBytes([...localParts, centralDirectory, endOfCentralDirectory]);
}

function createWorkbookBlob(jobs: Job[]) {
  const zipBytes = createZip([
    { path: "[Content_Types].xml", content: buildContentTypes() },
    { path: "_rels/.rels", content: buildRootRels() },
    { path: "xl/workbook.xml", content: buildWorkbook() },
    { path: "xl/_rels/workbook.xml.rels", content: buildWorkbookRels() },
    { path: "xl/styles.xml", content: buildStyles() },
    { path: "xl/worksheets/sheet1.xml", content: buildWorksheet(jobs) }
  ]);

  return new Blob([zipBytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
}

export function exportJobsToExcel(jobs: Job[]) {
  const blob = createWorkbookBlob(jobs);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date();
  const pad = (number: number) => String(number).padStart(2, "0");
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(
    date.getHours()
  )}${pad(date.getMinutes())}`;

  link.href = url;
  link.download = `秋招投递表-${stamp}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
