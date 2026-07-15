import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ColumnFilter, ColumnKey, SortState } from "@/lib/jobTypes";
import { cn } from "@/lib/utils";

export type ColumnFilterKind = "text" | "multi" | "date" | "link";

export type ColumnHeaderMenuProps = {
  columnKey: ColumnKey;
  label: string;
  filterKind: ColumnFilterKind;
  options?: string[];
  filter?: ColumnFilter;
  sort: SortState;
  active: boolean;
  onSortChange: (sort: SortState) => void;
  onFilterChange: (key: ColumnKey, filter?: ColumnFilter) => void;
};

const menuWidth = 288;
const menuMaxHeight = 360;
const viewportGap = 16;

type MenuPosition = {
  left: number;
  top: number;
  maxHeight: number;
};

function getSortLabel(sort: SortState, key: ColumnKey) {
  if (!sort || sort.key !== key) {
    return "↕";
  }

  return sort.direction === "asc" ? "↑" : "↓";
}

export function ColumnHeaderMenu({
  columnKey,
  label,
  filterKind,
  options = [],
  filter,
  sort,
  active,
  onSortChange,
  onFilterChange
}: ColumnHeaderMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>();
  const ref = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  function updateMenuPosition() {
    const button = buttonRef.current;

    if (!button) {
      return;
    }

    const rect = button.getBoundingClientRect();
    const maxLeft = Math.max(viewportGap, window.innerWidth - menuWidth - viewportGap);
    const left = Math.min(Math.max(rect.left, viewportGap), maxLeft);
    const topLimit = Math.max(viewportGap, window.innerHeight - menuMaxHeight - viewportGap);
    const top = Math.min(rect.bottom + 8, topLimit);
    const maxHeight = Math.min(menuMaxHeight, Math.max(180, window.innerHeight - top - viewportGap));

    setMenuPosition({ left, top, maxHeight });
  }

  useEffect(() => {
    function close(event: MouseEvent) {
      const target = event.target as Node;

      if (ref.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    if (!open) {
      return;
    }

    updateMenuPosition();
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open]);

  function updateText(value: string) {
    onFilterChange(columnKey, { type: "text", value });
  }

  function updateDate(part: "from" | "to", value: string) {
    const current = filter?.type === "date" ? filter : { type: "date" as const, from: "", to: "" };
    const next = { ...current, [part]: value };

    onFilterChange(columnKey, next.from || next.to ? next : undefined);
  }

  function updateMulti(value: string) {
    const current = filter?.type === "multi" ? filter.values : [];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];

    onFilterChange(columnKey, next.length > 0 ? { type: "multi", values: next } : undefined);
  }

  function updateLink(mode: "has" | "empty" | "") {
    onFilterChange(columnKey, mode ? { type: "link", mode } : undefined);
  }

  const menu = open && menuPosition ? (
    <div
      ref={menuRef}
      onClick={(event) => event.stopPropagation()}
      className="fixed z-[100] w-72 overflow-auto rounded-xl border border-slate-200 bg-white/95 p-3 text-sm text-slate-700 shadow-xl backdrop-blur"
      style={{
        left: menuPosition.left,
        top: menuPosition.top,
        maxHeight: menuPosition.maxHeight
      }}
    >
      <div className="grid gap-1">
        <button
          type="button"
          onClick={() => onSortChange({ key: columnKey, direction: "asc" })}
          className="rounded-lg px-3 py-2 text-left hover:bg-slate-50"
        >
          升序排序
        </button>
        <button
          type="button"
          onClick={() => onSortChange({ key: columnKey, direction: "desc" })}
          className="rounded-lg px-3 py-2 text-left hover:bg-slate-50"
        >
          降序排序
        </button>
        <button
          type="button"
          onClick={() => onSortChange(null)}
          className="rounded-lg px-3 py-2 text-left text-slate-500 hover:bg-slate-50"
        >
          清除本列排序
        </button>
      </div>

      <div className="my-3 h-px bg-slate-100" />

      {filterKind === "text" ? (
        <label className="grid gap-2">
          <span className="text-xs font-medium text-slate-500">本列筛选</span>
          <input
            value={filter?.type === "text" ? filter.value : ""}
            onChange={(event) => updateText(event.target.value)}
            placeholder="输入关键词"
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
        </label>
      ) : null}

      {filterKind === "multi" ? (
        <div className="grid gap-2">
          <div className="text-xs font-medium text-slate-500">本列筛选</div>
          <div className="max-h-56 overflow-auto pr-1 scrollbar-thin">
            {options.map((option) => (
              <label key={option} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={filter?.type === "multi" ? filter.values.includes(option) : false}
                  onChange={() => updateMulti(option)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {filterKind === "date" ? (
        <div className="grid gap-2">
          <div className="text-xs font-medium text-slate-500">本列筛选</div>
          <input
            type="date"
            value={filter?.type === "date" ? filter.from : ""}
            onChange={(event) => updateDate("from", event.target.value)}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
          <input
            type="date"
            value={filter?.type === "date" ? filter.to : ""}
            onChange={(event) => updateDate("to", event.target.value)}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      ) : null}

      {filterKind === "link" ? (
        <div className="grid gap-2">
          <div className="text-xs font-medium text-slate-500">本列筛选</div>
          <select
            value={filter?.type === "link" ? filter.mode : ""}
            onChange={(event) => updateLink(event.target.value as "has" | "empty" | "")}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">全部</option>
            <option value="has">有链接</option>
            <option value="empty">无链接</option>
          </select>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => onFilterChange(columnKey, undefined)}
        className="mt-3 h-9 w-full rounded-lg border border-slate-200 text-sm font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
      >
        清除本列筛选
      </button>
    </div>
  ) : null;

  return (
    <div ref={ref} className="relative flex items-center justify-between gap-2">
      <span className="inline-flex min-w-0 items-center gap-1.5">
        <span className="truncate">{label}</span>
        {active ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" /> : null}
      </span>
      <button
        ref={buttonRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation();

          if (!open) {
            updateMenuPosition();
          }

          setOpen((value) => !value);
        }}
        className={cn(
          "relative grid h-7 w-7 place-items-center rounded-md border text-xs transition",
          active || sort?.key === columnKey
            ? "border-indigo-200 bg-indigo-50 text-indigo-700"
            : "border-transparent text-slate-400 hover:border-slate-200 hover:bg-white hover:text-slate-700"
        )}
        aria-label={`${label} 排序筛选`}
      >
        {getSortLabel(sort, columnKey)}
        {active ? <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-indigo-500" /> : null}
      </button>

      {menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
