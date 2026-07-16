import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, DragEvent as ReactDragEvent, MouseEvent as ReactMouseEvent } from "react";
import { EditableCell } from "@/components/EditableCell";
import { priorityTone, statusTone } from "@/components/StatusBadge";
import { ColumnFilterKind, ColumnHeaderMenu } from "@/components/table/ColumnHeaderMenu";
import { channels, functionDirections, industries, priorities, statuses } from "@/lib/jobOptions";
import { hasActiveColumnFilter } from "@/lib/jobFilters";
import { getReminderLabel, reminderOptions } from "@/lib/jobSorting";
import type {
  ColumnFilter,
  ColumnFilters,
  ColumnKey,
  Job,
  JobPriority,
  JobStatus,
  ReminderLabel,
  SortState
} from "@/lib/jobTypes";
import { cn, normalizeUrl } from "@/lib/utils";

type JobTableProps = {
  jobs: Job[];
  selectedId?: string;
  focusJobId?: string;
  sort: SortState;
  filters: ColumnFilters;
  onFocused?: () => void;
  onSelect: (jobId: string) => void;
  onUpdate: (jobId: string, patch: Partial<Job>) => void;
  onSortChange: (sort: SortState) => void;
  onFilterChange: (key: ColumnKey, filter?: ColumnFilter) => void;
  onReorder: (draggedId: string, targetId: string) => void;
  onDelete: (jobId: string) => void;
  onToast: (message: string) => void;
};

type ColumnMeta = {
  key: ColumnKey;
  label: string;
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
  filterKind: ColumnFilterKind;
  options?: string[];
  sticky?: "first" | "second";
};

const columns: ColumnMeta[] = [
  { key: "company", label: "公司", defaultWidth: 176, minWidth: 120, filterKind: "text", sticky: "first" },
  { key: "title", label: "岗位名称", defaultWidth: 224, minWidth: 150, filterKind: "text", sticky: "second" },
  { key: "functionDirection", label: "职能方向", defaultWidth: 176, minWidth: 140, filterKind: "multi", options: [...functionDirections] },
  { key: "industry", label: "行业类型", defaultWidth: 176, minWidth: 140, filterKind: "multi", options: [...industries] },
  { key: "city", label: "城市", defaultWidth: 112, minWidth: 88, filterKind: "text" },
  { key: "status", label: "状态", defaultWidth: 112, minWidth: 96, filterKind: "multi", options: statuses },
  { key: "priority", label: "优先级", defaultWidth: 96, minWidth: 88, filterKind: "multi", options: priorities },
  { key: "deadline", label: "投递日期", defaultWidth: 144, minWidth: 128, filterKind: "date" },
  { key: "nextAction", label: "下一步动作", defaultWidth: 208, minWidth: 150, filterKind: "text" },
  { key: "nextActionDate", label: "下一步日期", defaultWidth: 144, minWidth: 128, filterKind: "date" },
  { key: "reminder", label: "提醒", defaultWidth: 128, minWidth: 112, filterKind: "multi", options: [...reminderOptions] },
  { key: "interview", label: "面试准备", defaultWidth: 112, minWidth: 104, filterKind: "multi", options: ["已填写", "待准备"] },
  { key: "channel", label: "渠道", defaultWidth: 128, minWidth: 112, filterKind: "multi", options: [...channels] },
  { key: "link", label: "链接", defaultWidth: 208, minWidth: 160, maxWidth: 520, filterKind: "link" },
  { key: "notes", label: "备注", defaultWidth: 256, minWidth: 180, maxWidth: 560, filterKind: "text" }
];

const headerClass =
  "sticky top-0 z-20 border-b border-r border-slate-200/80 bg-slate-50/90 px-3 py-2 text-left text-xs font-semibold text-slate-500 backdrop-blur";
const cellClass = "border-b border-r border-slate-100 px-1 py-1 align-middle";
const selectBase =
  "h-9 w-full rounded-full border px-2 text-xs font-medium outline-none transition focus:ring-2 focus:ring-indigo-100";
const columnWidthStorageKey = "autumn-job-tracker-column-widths";
const defaultMaxColumnWidth = 480;
const dragHandleWidth = 40;

type ColumnWidths = Partial<Record<ColumnKey, number>>;
type DisplayColumn = ColumnMeta & { sticky?: "first" | "second" };
type ColumnOrder = ColumnKey[];
type ResizeState = {
  key: ColumnKey;
  startX: number;
  startWidth: number;
  minWidth: number;
  maxWidth: number;
  previousCursor: string;
  previousUserSelect: string;
};
type RowContextMenu = {
  jobId: string;
  x: number;
  y: number;
};

const columnOrderStorageKey = "autumn-job-tracker-column-order";

const reminderStyles: Record<ReminderLabel, string> = {
  已逾期: "border-rose-200 bg-rose-50 text-rose-700",
  今日处理: "border-indigo-200 bg-indigo-50 text-indigo-700",
  明天截止: "border-amber-200 bg-amber-50 text-amber-700",
  即将截止: "border-orange-200 bg-orange-50 text-orange-700",
  面试准备: "border-violet-200 bg-violet-50 text-violet-700",
  等待反馈: "border-sky-200 bg-sky-50 text-sky-700",
  已结束: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "—": "border-slate-200 bg-slate-50 text-slate-400"
};

function stickyClass(sticky?: ColumnMeta["sticky"], header = false) {
  if (sticky === "first" || sticky === "second") {
    return cn("sticky", header ? "z-30" : "z-10");
  }

  return "";
}

function stickyCellClass(selected: boolean) {
  return cn(
    "bg-white shadow-[8px_0_14px_-14px_rgba(15,23,42,0.45)] group-hover:bg-indigo-50",
    selected && "bg-indigo-50 group-hover:bg-indigo-50"
  );
}

function clampColumnWidth(column: ColumnMeta, width: number) {
  const minWidth = column.minWidth ?? 88;
  const maxWidth = column.maxWidth ?? defaultMaxColumnWidth;

  return Math.min(Math.max(Math.round(width), minWidth), maxWidth);
}

function loadColumnWidths() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = window.localStorage.getItem(columnWidthStorageKey);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as ColumnWidths;
    return columns.reduce<ColumnWidths>((widths, column) => {
      const width = parsed[column.key];

      if (typeof width === "number" && Number.isFinite(width)) {
        widths[column.key] = clampColumnWidth(column, width);
      }

      return widths;
    }, {});
  } catch {
    return {};
  }
}

function normalizeColumnOrder(value: unknown): ColumnOrder {
  const defaultOrder = columns.map((column) => column.key);

  if (!Array.isArray(value)) {
    return defaultOrder;
  }

  const allowedKeys = new Set(defaultOrder);
  const seenKeys = new Set<ColumnKey>();
  const parsedOrder = value.reduce<ColumnOrder>((order, key) => {
    if (typeof key !== "string" || !allowedKeys.has(key as ColumnKey) || seenKeys.has(key as ColumnKey)) {
      return order;
    }

    seenKeys.add(key as ColumnKey);
    order.push(key as ColumnKey);
    return order;
  }, []);

  return [...parsedOrder, ...defaultOrder.filter((key) => !seenKeys.has(key))];
}

function loadColumnOrder() {
  if (typeof window === "undefined") {
    return normalizeColumnOrder(undefined);
  }

  try {
    const stored = window.localStorage.getItem(columnOrderStorageKey);
    return normalizeColumnOrder(stored ? JSON.parse(stored) : undefined);
  } catch {
    return normalizeColumnOrder(undefined);
  }
}

function getOrderedColumns(columnOrder: ColumnOrder): DisplayColumn[] {
  const columnByKey = new Map(columns.map((column) => [column.key, column]));

  return normalizeColumnOrder(columnOrder).map((key, index) => {
    const column = columnByKey.get(key);

    return {
      ...(column ?? columns[0]),
      sticky: index === 0 ? "first" : index === 1 ? "second" : undefined
    };
  });
}

function getColumnWidth(column: ColumnMeta, widths: ColumnWidths) {
  return clampColumnWidth(column, widths[column.key] ?? column.defaultWidth);
}

function getColumnStyle(column: DisplayColumn, widths: Record<ColumnKey, number>, stickyLeft?: number): CSSProperties {
  const width = widths[column.key];
  const style: CSSProperties = {
    width,
    minWidth: width,
    maxWidth: width
  };

  if (typeof stickyLeft === "number") {
    style.left = stickyLeft;
  }

  return style;
}

function ReminderBadge({ reminder }: { reminder: ReminderLabel }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full border px-2 text-xs font-medium",
        reminderStyles[reminder]
      )}
    >
      {reminder}
    </span>
  );
}

export function JobTable({
  jobs,
  selectedId,
  focusJobId,
  sort,
  filters,
  onFocused,
  onSelect,
  onUpdate,
  onSortChange,
  onFilterChange,
  onReorder,
  onDelete,
  onToast
}: JobTableProps) {
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(() => loadColumnWidths());
  const [columnOrder, setColumnOrder] = useState<ColumnOrder>(() => loadColumnOrder());
  const [resizingKey, setResizingKey] = useState<ColumnKey>();
  const [draggingId, setDraggingId] = useState<string>();
  const [dragOverId, setDragOverId] = useState<string>();
  const [draggingColumnKey, setDraggingColumnKey] = useState<ColumnKey>();
  const [dragOverColumnKey, setDragOverColumnKey] = useState<ColumnKey>();
  const [rowContextMenu, setRowContextMenu] = useState<RowContextMenu | null>(null);
  const resizingRef = useRef<ResizeState | null>(null);

  const orderedColumns = useMemo(() => getOrderedColumns(columnOrder), [columnOrder]);

  const resolvedColumnWidths = useMemo(
    () =>
      columns.reduce<Record<ColumnKey, number>>((widths, column) => {
        widths[column.key] = getColumnWidth(column, columnWidths);
        return widths;
      }, {} as Record<ColumnKey, number>),
    [columnWidths]
  );
  const columnStyles = useMemo(
    () =>
      orderedColumns.reduce<Record<ColumnKey, CSSProperties>>((styles, column, index) => {
        const stickyLeft =
          index === 0
            ? dragHandleWidth
            : index === 1
              ? dragHandleWidth + resolvedColumnWidths[orderedColumns[0].key]
              : undefined;

        styles[column.key] = getColumnStyle(column, resolvedColumnWidths, stickyLeft);
        return styles;
      }, {} as Record<ColumnKey, CSSProperties>),
    [orderedColumns, resolvedColumnWidths]
  );
  const tableWidth = useMemo(
    () => dragHandleWidth + orderedColumns.reduce((total, column) => total + resolvedColumnWidths[column.key], 0),
    [orderedColumns, resolvedColumnWidths]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(columnWidthStorageKey, JSON.stringify(columnWidths));
  }, [columnWidths]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(columnOrderStorageKey, JSON.stringify(columnOrder));
  }, [columnOrder]);

  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      const state = resizingRef.current;

      if (!state) {
        return;
      }

      const nextWidth = Math.min(
        Math.max(Math.round(state.startWidth + event.clientX - state.startX), state.minWidth),
        state.maxWidth
      );

      setColumnWidths((current) =>
        current[state.key] === nextWidth ? current : { ...current, [state.key]: nextWidth }
      );
    }

    function handleMouseUp() {
      const state = resizingRef.current;

      if (!state) {
        return;
      }

      document.body.style.cursor = state.previousCursor;
      document.body.style.userSelect = state.previousUserSelect;
      resizingRef.current = null;
      setResizingKey(undefined);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      handleMouseUp();
    };
  }, []);

  useEffect(() => {
    if (!rowContextMenu) {
      return;
    }

    function closeMenu() {
      setRowContextMenu(null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    window.addEventListener("click", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [rowContextMenu]);

  useEffect(() => {
    if (!focusJobId) {
      return;
    }

    const timer = window.setTimeout(() => {
      const target = document.querySelector<HTMLInputElement>(
        `[data-focus-cell="${focusJobId}-company"]`
      );
      target?.focus();
      target?.select();
      onFocused?.();
    }, 40);

    return () => window.clearTimeout(timer);
  }, [focusJobId, onFocused]);

  function startColumnResize(event: ReactMouseEvent<HTMLButtonElement>, column: ColumnMeta) {
    event.preventDefault();
    event.stopPropagation();

    resizingRef.current = {
      key: column.key,
      startX: event.clientX,
      startWidth: resolvedColumnWidths[column.key],
      minWidth: column.minWidth ?? 88,
      maxWidth: column.maxWidth ?? defaultMaxColumnWidth,
      previousCursor: document.body.style.cursor,
      previousUserSelect: document.body.style.userSelect
    };
    setResizingKey(column.key);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  function resetColumnWidth(event: ReactMouseEvent<HTMLButtonElement>, column: ColumnMeta) {
    event.preventDefault();
    event.stopPropagation();

    setColumnWidths((current) => {
      if (!(column.key in current)) {
        return current;
      }

      const next = { ...current };
      delete next[column.key];
      return next;
    });
  }

  function openLink(link?: string) {
    const url = normalizeUrl(link);

    if (!url) {
      onToast("请先填写岗位链接。");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleDragStart(event: ReactDragEvent<HTMLButtonElement>, jobId: string) {
    setDraggingId(jobId);
    setDragOverId(jobId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `row:${jobId}`);
  }

  function handleDragOver(event: ReactDragEvent<HTMLTableRowElement>, jobId: string) {
    if (!draggingId || draggingId === jobId) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverId(jobId);
  }

  function handleDrop(event: ReactDragEvent<HTMLTableRowElement>, jobId: string) {
    event.preventDefault();
    const rawValue = event.dataTransfer.getData("text/plain");
    const sourceId = rawValue.startsWith("row:") ? rawValue.slice(4) : draggingId;

    if (sourceId && sourceId !== jobId) {
      onReorder(sourceId, jobId);
    }

    setDraggingId(undefined);
    setDragOverId(undefined);
  }

  function handleDragEnd() {
    setDraggingId(undefined);
    setDragOverId(undefined);
  }

  function handleColumnDragStart(event: ReactDragEvent<HTMLButtonElement>, columnKey: ColumnKey) {
    setDraggingColumnKey(columnKey);
    setDragOverColumnKey(columnKey);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `column:${columnKey}`);
  }

  function handleColumnDragOver(event: ReactDragEvent<HTMLTableCellElement>, columnKey: ColumnKey) {
    if (!draggingColumnKey || draggingColumnKey === columnKey) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverColumnKey(columnKey);
  }

  function handleColumnDrop(event: ReactDragEvent<HTMLTableCellElement>, columnKey: ColumnKey) {
    event.preventDefault();
    const rawValue = event.dataTransfer.getData("text/plain");
    const sourceKey = rawValue.startsWith("column:") ? (rawValue.slice(7) as ColumnKey) : draggingColumnKey;

    if (sourceKey && sourceKey !== columnKey) {
      setColumnOrder((currentOrder) => {
        const nextOrder = normalizeColumnOrder(currentOrder);
        const fromIndex = nextOrder.indexOf(sourceKey);
        const toIndex = nextOrder.indexOf(columnKey);

        if (fromIndex < 0 || toIndex < 0) {
          return currentOrder;
        }

        const [movedKey] = nextOrder.splice(fromIndex, 1);
        nextOrder.splice(toIndex, 0, movedKey);
        return nextOrder;
      });
      onToast("列顺序已调整。");
    }

    setDraggingColumnKey(undefined);
    setDragOverColumnKey(undefined);
  }

  function handleColumnDragEnd() {
    setDraggingColumnKey(undefined);
    setDragOverColumnKey(undefined);
  }

  function openRowContextMenu(event: ReactMouseEvent<HTMLTableRowElement>, jobId: string) {
    event.preventDefault();
    onSelect(jobId);

    const menuWidth = 224;
    const menuHeight = 110;
    const padding = 12;
    const maxX = Math.max(padding, window.innerWidth - menuWidth - padding);
    const maxY = Math.max(padding, window.innerHeight - menuHeight - padding);
    const x = Math.min(Math.max(event.clientX, padding), maxX);
    const y = Math.min(Math.max(event.clientY, padding), maxY);

    setRowContextMenu({ jobId, x, y });
  }

  function deleteContextMenuJob() {
    if (!rowContextMenu) {
      return;
    }

    const targetJob = jobs.find((job) => job.id === rowContextMenu.jobId);
    const label = targetJob?.company || targetJob?.title || "当前岗位";

    if (window.confirm(`确认删除「${label}」吗？`)) {
      onDelete(rowContextMenu.jobId);
    }

    setRowContextMenu(null);
  }

  function bodyCellClass(column: DisplayColumn, selected: boolean) {
    return cn(
      cellClass,
      column.sticky && stickyClass(column.sticky),
      column.sticky && stickyCellClass(selected)
    );
  }

  function renderJobCell(column: DisplayColumn, job: Job, selected: boolean) {
    const style = columnStyles[column.key];

    switch (column.key) {
      case "company":
        return (
          <td key={column.key} className={bodyCellClass(column, selected)} style={style}>
            <EditableCell
              focusId={`${job.id}-company`}
              value={job.company}
              placeholder="公司"
              onChange={(value) => onUpdate(job.id, { company: value })}
            />
          </td>
        );
      case "title":
        return (
          <td key={column.key} className={bodyCellClass(column, selected)} style={style}>
            <EditableCell
              value={job.title}
              placeholder="岗位名称"
              onChange={(value) => onUpdate(job.id, { title: value })}
            />
          </td>
        );
      case "functionDirection":
        return (
          <td
            key={column.key}
            className={bodyCellClass(column, selected)}
            style={style}
            onClick={(event) => event.stopPropagation()}
          >
            <select
              value={job.functionDirection}
              onChange={(event) => onUpdate(job.id, { functionDirection: event.target.value })}
              className="h-9 w-full rounded-md border border-transparent bg-transparent px-2 text-sm text-slate-700 outline-none transition hover:border-slate-200 hover:bg-white focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            >
              {functionDirections.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </td>
        );
      case "industry":
        return (
          <td
            key={column.key}
            className={bodyCellClass(column, selected)}
            style={style}
            onClick={(event) => event.stopPropagation()}
          >
            <select
              value={job.industry}
              onChange={(event) => onUpdate(job.id, { industry: event.target.value })}
              className="h-9 w-full rounded-md border border-transparent bg-transparent px-2 text-sm text-slate-700 outline-none transition hover:border-slate-200 hover:bg-white focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            >
              {industries.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </td>
        );
      case "city":
        return (
          <td key={column.key} className={bodyCellClass(column, selected)} style={style}>
            <EditableCell
              value={job.city}
              placeholder="城市"
              onChange={(value) => onUpdate(job.id, { city: value })}
            />
          </td>
        );
      case "status":
        return (
          <td
            key={column.key}
            className={bodyCellClass(column, selected)}
            style={style}
            onClick={(event) => event.stopPropagation()}
          >
            <select
              value={job.status}
              onChange={(event) => onUpdate(job.id, { status: event.target.value as JobStatus })}
              className={cn(selectBase, statusTone(job.status))}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </td>
        );
      case "priority":
        return (
          <td
            key={column.key}
            className={bodyCellClass(column, selected)}
            style={style}
            onClick={(event) => event.stopPropagation()}
          >
            <select
              value={job.priority}
              onChange={(event) => onUpdate(job.id, { priority: event.target.value as JobPriority })}
              className={cn(selectBase, priorityTone(job.priority))}
            >
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </td>
        );
      case "deadline":
        return (
          <td key={column.key} className={bodyCellClass(column, selected)} style={style}>
            <EditableCell
              type="date"
              value={job.deadline}
              onChange={(value) => onUpdate(job.id, { deadline: value })}
            />
          </td>
        );
      case "nextAction":
        return (
          <td key={column.key} className={bodyCellClass(column, selected)} style={style}>
            <EditableCell
              value={job.nextAction}
              placeholder="下一步"
              onChange={(value) => onUpdate(job.id, { nextAction: value })}
            />
          </td>
        );
      case "nextActionDate":
        return (
          <td key={column.key} className={bodyCellClass(column, selected)} style={style}>
            <EditableCell
              type="date"
              value={job.nextActionDate}
              onChange={(value) => onUpdate(job.id, { nextActionDate: value })}
            />
          </td>
        );
      case "reminder":
        return (
          <td key={column.key} className={bodyCellClass(column, selected)} style={style}>
            <div className="px-2">
              <ReminderBadge reminder={getReminderLabel(job)} />
            </div>
          </td>
        );
      case "interview":
        return (
          <td
            key={column.key}
            className={bodyCellClass(column, selected)}
            style={style}
            onClick={(event) => event.stopPropagation()}
          >
            <Link
              href={`/interview/${job.id}`}
              className="inline-flex h-8 items-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-medium text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100"
            >
              进入
            </Link>
          </td>
        );
      case "channel":
        return (
          <td
            key={column.key}
            className={bodyCellClass(column, selected)}
            style={style}
            onClick={(event) => event.stopPropagation()}
          >
            <select
              value={job.channel}
              onChange={(event) => onUpdate(job.id, { channel: event.target.value })}
              className="h-9 w-full rounded-md border border-transparent bg-transparent px-2 text-sm text-slate-700 outline-none transition hover:border-slate-200 hover:bg-white focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            >
              {channels.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </td>
        );
      case "link":
        return (
          <td
            key={column.key}
            className={bodyCellClass(column, selected)}
            style={style}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-1">
              <EditableCell
                value={job.link}
                placeholder="URL"
                onChange={(value) => onUpdate(job.id, { link: value })}
              />
              {job.link ? (
                <button
                  type="button"
                  onClick={() => openLink(job.link)}
                  className="h-8 shrink-0 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
                >
                  打开
                </button>
              ) : null}
            </div>
          </td>
        );
      case "notes":
        return (
          <td key={column.key} className={bodyCellClass(column, selected)} style={style}>
            <EditableCell
              value={job.notes}
              placeholder="备注"
              onChange={(value) => onUpdate(job.id, { notes: value })}
            />
          </td>
        );
      default:
        return null;
    }
  }

  const contextMenuJob = rowContextMenu ? jobs.find((job) => job.id === rowContextMenu.jobId) : undefined;
  const contextMenuLabel = contextMenuJob?.company || contextMenuJob?.title || "当前岗位";

  return (
    <>
    <section className="overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-[0_24px_80px_rgba(79,70,229,0.10)] backdrop-blur">
      <div className="max-h-[calc(100vh-318px)] min-h-[430px] overflow-auto scrollbar-thin">
        <table
          className="border-separate border-spacing-0 text-sm"
          style={{ minWidth: tableWidth, width: tableWidth, tableLayout: "fixed" }}
        >
          <thead>
            <tr>
              <th
                style={{ left: 0, width: dragHandleWidth, minWidth: dragHandleWidth, maxWidth: dragHandleWidth }}
                className={cn(headerClass, "sticky z-30 px-0 text-center")}
              >
                <span className="sr-only">拖动排序</span>
              </th>
              {orderedColumns.map((column) => (
                <th
                  key={column.key}
                  style={columnStyles[column.key]}
                  onDragOver={(event) => handleColumnDragOver(event, column.key)}
                  onDrop={(event) => handleColumnDrop(event, column.key)}
                  onDragEnd={handleColumnDragEnd}
                  className={cn(
                    headerClass,
                    "relative pl-8",
                    stickyClass(column.sticky, true),
                    draggingColumnKey === column.key && "opacity-45",
                    dragOverColumnKey === column.key &&
                      draggingColumnKey !== column.key &&
                      "outline outline-2 -outline-offset-2 outline-indigo-300",
                  )}
                >
                  <button
                    type="button"
                    draggable
                    onDragStart={(event) => handleColumnDragStart(event, column.key)}
                    onDragEnd={handleColumnDragEnd}
                    onClick={(event) => event.stopPropagation()}
                    aria-label={`拖动${column.label}列调整顺序`}
                    title="拖动调整列顺序"
                    className="absolute left-1 top-1/2 grid h-7 w-6 -translate-y-1/2 cursor-grab place-items-center rounded-md text-slate-300 transition hover:bg-white hover:text-indigo-500 active:cursor-grabbing"
                  >
                    ⋮⋮
                  </button>
                  <div className="min-w-0">
                    <ColumnHeaderMenu
                      columnKey={column.key}
                      label={column.label}
                      filterKind={column.filterKind}
                      options={column.options}
                      filter={filters[column.key]}
                      sort={sort}
                      active={hasActiveColumnFilter(filters, column.key)}
                      onSortChange={onSortChange}
                      onFilterChange={onFilterChange}
                    />
                  </div>
                  <button
                    type="button"
                    onMouseDown={(event) => startColumnResize(event, column)}
                    onDoubleClick={(event) => resetColumnWidth(event, column)}
                    aria-label={`调整${column.label}列宽`}
                    title="拖拽调整列宽，双击还原"
                    className={cn(
                      "absolute right-0 top-0 h-full w-2 cursor-col-resize touch-none border-r-2 border-transparent transition hover:border-indigo-300 hover:bg-indigo-100/60 focus:border-indigo-400 focus:outline-none",
                      resizingKey === column.key && "border-indigo-400 bg-indigo-100/70"
                    )}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="h-72 text-center text-sm text-slate-400">
                  没有符合当前筛选条件的岗位。
                </td>
              </tr>
            ) : (
              jobs.map((job, index) => {
                const selected = selectedId === job.id;
                const dragging = draggingId === job.id;
                const dragOver = dragOverId === job.id && draggingId !== job.id;

                return (
                  <tr
                    key={job.id}
                    onClick={(event) => {
                      const target = event.target as HTMLElement;

                      if (target.closest("input, textarea, select, button, a, [contenteditable='true']")) {
                        return;
                      }

                      onSelect(job.id);
                    }}
                    onContextMenu={(event) => openRowContextMenu(event, job.id)}
                    onDragOver={(event) => handleDragOver(event, job.id)}
                    onDrop={(event) => handleDrop(event, job.id)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "group cursor-pointer bg-white transition hover:bg-indigo-50/40",
                      selected && "bg-indigo-50/70 hover:bg-indigo-50/70",
                      dragging && "opacity-45",
                      dragOver && "outline outline-2 -outline-offset-2 outline-indigo-300"
                    )}
                  >
                    <td
                      className={cn(
                        cellClass,
                        "sticky z-10 px-0 text-center",
                        stickyCellClass(selected)
                      )}
                      style={{
                        left: 0,
                        width: dragHandleWidth,
                        minWidth: dragHandleWidth,
                        maxWidth: dragHandleWidth
                      }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        draggable
                        onDragStart={(event) => handleDragStart(event, job.id)}
                        onDragEnd={handleDragEnd}
                        aria-label={`拖动${job.company || job.title || "当前岗位"}调整顺序`}
                        title="拖动调整行顺序"
                        className="mx-auto flex h-8 w-8 cursor-grab items-center justify-center gap-0.5 rounded-lg transition hover:bg-white active:cursor-grabbing"
                      >
                        <span aria-hidden="true" className="text-[9px] tracking-[-2px] text-slate-300 group-hover:text-indigo-400">
                          ⋮⋮
                        </span>
                        <span className="min-w-3 text-center text-[11px] font-semibold tabular-nums text-slate-500">
                          {index + 1}
                        </span>
                      </button>
                    </td>
                    {orderedColumns.map((column) => renderJobCell(column, job, selected))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
    {rowContextMenu ? (
      <div
        role="menu"
        style={{ left: rowContextMenu.x, top: rowContextMenu.y }}
        onClick={(event) => event.stopPropagation()}
        className="fixed z-[120] w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-[0_18px_50px_rgba(15,23,42,0.18)]"
      >
        <div className="border-b border-slate-100 px-3 py-2">
          <div className="truncate text-xs font-medium text-slate-400">岗位操作</div>
          <div className="mt-0.5 truncate text-sm font-semibold text-slate-800">{contextMenuLabel}</div>
        </div>
        <button
          type="button"
          role="menuitem"
          onClick={deleteContextMenuJob}
          className="flex h-10 w-full items-center px-3 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
        >
          删除岗位
        </button>
      </div>
    ) : null}
    </>
  );
}
