/** Print the current report as PDF via the browser's print dialog (light theme forced). */
export function exportReportPdf(title: string) {
  const root = document.documentElement;
  const wasDark = root.classList.contains("dark");
  const prevTitle = document.title;
  root.classList.remove("dark");
  document.title = title;
  document.body.classList.add("printing");
  const restore = () => {
    if (wasDark) root.classList.add("dark");
    document.title = prevTitle;
    document.body.classList.remove("printing");
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  // allow charts to re-render in light colours before snapshot
  setTimeout(() => window.print(), 150);
}
