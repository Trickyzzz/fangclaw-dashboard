import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const dbPath = path.resolve(process.cwd(), "data", "fangclaw.db");
const db = new DatabaseSync(dbPath);

const invalidRows = db
  .prepare(`
    SELECT id, evidenceId, message
    FROM changeLogs
    WHERE action = 'analysis'
      AND message IS NOT NULL
      AND (
        message LIKE '%命中 0 家%'
        OR message LIKE '%落地 0 家公司%'
        OR message LIKE '%未命中目标池公司%'
        OR message LIKE '%未命中明确公司实体%'
      )
  `)
  .all();

const evidenceIds = Array.from(
  new Set(
    invalidRows
      .map(row => row.evidenceId)
      .filter(Boolean)
  )
);

const deleteInvalidAnalysisLogs = db.prepare(`
  DELETE FROM changeLogs
  WHERE action = 'analysis'
    AND message IS NOT NULL
    AND (
      message LIKE '%命中 0 家%'
      OR message LIKE '%落地 0 家公司%'
      OR message LIKE '%未命中目标池公司%'
      OR message LIKE '%未命中明确公司实体%'
    )
`);

const deleteEvidenceById = db.prepare(`
  DELETE FROM evidenceChains
  WHERE evidenceId = ?
`);

let deletedEvidence = 0;
db.exec("BEGIN");
try {
  const logResult = deleteInvalidAnalysisLogs.run();
  for (const evidenceId of evidenceIds) {
    const result = deleteEvidenceById.run(evidenceId);
    deletedEvidence += Number(result.changes ?? 0);
  }
  db.exec("COMMIT");

  console.log(
    JSON.stringify(
      {
        deletedAnalysisLogs: Number(logResult.changes ?? 0),
        deletedEvidenceChains: deletedEvidence,
        keptEvidenceChains: db.prepare("SELECT COUNT(1) AS c FROM evidenceChains").get().c,
        keptChangeLogs: db.prepare("SELECT COUNT(1) AS c FROM changeLogs").get().c,
      },
      null,
      2
    )
  );
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}

