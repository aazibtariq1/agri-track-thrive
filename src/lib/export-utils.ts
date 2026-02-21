export function exportToCSV(filename: string, headers: string[], rows: string[][]) {
  // UTF-8 BOM for Excel compatibility
  const BOM = "\uFEFF";

  const escapeCell = (cell: string) => {
    if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  };

  const csvContent =
    BOM +
    [headers.map(escapeCell).join(",")]
      .concat(rows.map((row) => row.map(escapeCell).join(",")))
      .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
