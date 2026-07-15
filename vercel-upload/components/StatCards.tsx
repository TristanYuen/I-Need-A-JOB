type StatCardsProps = {
  total: number;
  today: number;
  upcoming: number;
  interview: number;
};

export function StatCards({ total, today, upcoming, interview }: StatCardsProps) {
  const items = [
    { label: "总岗位数", value: total, caption: "当前记录" },
    { label: "今日待处理", value: today, caption: "需要推进" },
    { label: "即将截止", value: upcoming, caption: "7 天内" },
    { label: "面试中", value: interview, caption: "重点准备" }
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-sm backdrop-blur"
        >
          <div className="text-xs font-medium text-slate-500">{item.label}</div>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div className="text-2xl font-semibold tracking-normal text-slate-950">
              {item.value}
            </div>
            <div className="pb-1 text-xs text-slate-400">{item.caption}</div>
          </div>
        </div>
      ))}
    </section>
  );
}
