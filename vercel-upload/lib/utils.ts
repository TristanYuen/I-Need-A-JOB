export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDisplayDate(value?: string) {
  return value || "未设置";
}

export function normalizeUrl(value?: string) {
  const url = value?.trim();

  if (!url) {
    return "";
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `https://${url}`;
}
