import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const inputs = [
  "Heir_Recovery_Ranks_051_250.xlsx",
  "Heir_Recovery_Ranks_251_500.xlsx",
].map((file) => path.join(root, file));

const records = [];
for (const workbookPath of inputs) {
  const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(workbookPath));
  const sheet = workbook.worksheets.getItem("Raw_Import");
  const values = sheet.getUsedRange().values;
  const [headers, ...rows] = values;
  const index = Object.fromEntries(headers.map((header, i) => [String(header), i]));
  const get = (row, field) => row[index[field]] ?? "";

  for (const [rowIndex, row] of rows.entries()) {
    const ownerName = String(get(row, "OWNER_NAME")).trim();
    const propertyId = String(get(row, "PROPERTY_ID")).trim();
    if (!ownerName) continue;
    const name = ownerName.split(/\s+/);
    records.push({
      id: `${propertyId || "ROW"}-${path.basename(workbookPath)}-${rowIndex + 2}`,
      firstName: name[0] || ownerName,
      lastName: name.slice(1).join(" "),
      state: String(get(row, "OWNER_STATE")).trim().toUpperCase(),
      city: String(get(row, "OWNER_CITY")).trim(),
      propertyType: String(get(row, "PROPERTY_TYPE")).trim() || "Unclaimed Property",
      amount: Number(get(row, "CURRENT_CASH_BALANCE") || get(row, "CASH_REPORTED") || 0),
      holder: String(get(row, "HOLDER_NAME")).trim() || "Unknown holder",
      source: path.basename(workbookPath),
    });
  }
}

records.sort((a, b) => b.amount - a.amount);
await fs.mkdir(path.join(root, "data"), { recursive: true });
await fs.writeFile(
  path.join(root, "data", "lite-heir-records.json"),
  JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), recordCount: records.length, records }, null, 2) + "\n",
);
console.log(JSON.stringify({ recordCount: records.length, totalValue: records.reduce((sum, record) => sum + record.amount, 0) }));
