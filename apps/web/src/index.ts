export const appName = "Living Harness App";

export interface DemoItemView {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderDemoItems(items: DemoItemView[]): string {
  const rows = items.map((item) => {
    const status = item.completed ? "done" : "open";
    return `<li data-id="${escapeHtml(item.id)}" data-status="${status}">${escapeHtml(item.title)}</li>`;
  }).join("");
  return `<section aria-label="LHF demo items"><h1>${appName}</h1><ul>${rows}</ul></section>`;
}
