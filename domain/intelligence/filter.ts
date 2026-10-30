import type { IntelligenceEvidence, IntelligenceFilters } from "@/domain/intelligence/types";

export function filterEvidence(records: IntelligenceEvidence[], filters: IntelligenceFilters) {
  const query = filters.query.trim().toLocaleLowerCase();
  return records.filter((record) => {
    if (filters.topic !== "All" && record.topic !== filters.topic) return false;
    if (filters.status !== "All" && record.verificationStatus !== filters.status) return false;
    if (!query) return true;
    return [record.title, record.publisher, record.topic, record.fact, record.interpretation, record.limitations]
      .join(" ")
      .toLocaleLowerCase()
      .includes(query);
  });
}

function csvCell(value: string | number) {
  let text = String(value ?? "").replace(/\r?\n/g, " ");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function evidenceCsv(records: IntelligenceEvidence[]) {
  const rows = records.map((record) => [
    record.title,
    record.publisher,
    record.topic,
    record.verificationStatus,
    record.publishedOn ?? "",
    record.capturedOn,
    record.fact,
    record.interpretation,
    record.limitations,
    record.sourceUrl,
    record.linkedScenarioCount,
  ]);
  return [
    ["Title", "Publisher", "Topic", "Status", "Published", "Captured", "Fact", "Interpretation", "Limitations", "Source URL", "Linked scenarios"],
    ...rows,
  ].map((row) => row.map(csvCell).join(",")).join("\r\n");
}
