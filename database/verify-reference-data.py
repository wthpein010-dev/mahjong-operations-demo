"""Offline SQLite verification. No network, source-system or MySQL access."""
import json
import sqlite3
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
manifest = json.loads((HERE / "seed-manifest.json").read_text(encoding="utf-8"))
bound = json.loads((HERE / "seed-statements.json").read_text(encoding="utf-8"))
seed = json.loads((ROOT / "public/reference/seed.json").read_text(encoding="utf-8"))
schema = (HERE / "schema.sqlite.sql").read_text(encoding="utf-8")
seed_sql = (HERE / "seed.sqlite.sql").read_text(encoding="utf-8")


def verify(connection):
    assert connection.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
    assert connection.execute("PRAGMA foreign_key_check").fetchall() == []
    counts = {name: connection.execute(f'SELECT COUNT(*) FROM "{name}"').fetchone()[0]
              for name in manifest["tables"]}
    assert counts == manifest["tables"], (counts, manifest["tables"])
    snapshot, revision = connection.execute(
        "SELECT data_json, revision FROM demo_snapshots WHERE id = ?", ("public-v17",)
    ).fetchone()
    assert json.loads(snapshot) == seed
    assert revision == 0
    assert connection.execute("SELECT value FROM demo_seed_meta WHERE key = 'seed-version'").fetchone()[0] == "v1.7"
    assert connection.execute("SELECT COUNT(*) FROM charges WHERE typeof(amount_cents) <> 'integer'").fetchone()[0] == 0
    assert connection.execute("SELECT COUNT(*) FROM refunds f JOIN charges c ON c.id=f.charge_id WHERE f.amount_cents>c.amount_cents").fetchone()[0] == 0
    assert connection.execute("SELECT COUNT(*) FROM rewards WHERE amount_cents <> CASE kind WHEN 'accrual' THEN CAST(ROUND(base_cents * rate_bps / 10000.0) AS INTEGER) ELSE -CAST(ROUND(base_cents * rate_bps / 10000.0) AS INTEGER) END").fetchone()[0] == 0
    assert connection.execute("SELECT COUNT(*) FROM rewards WHERE kind='refund_reversal'").fetchone()[0] > 0
    totals = connection.execute(
        "SELECT (SELECT SUM(amount_cents) FROM charges), (SELECT SUM(amount_cents) FROM refunds), (SELECT SUM(amount_cents) FROM rewards)"
    ).fetchone()
    return counts, {"paidCents": totals[0], "refundCents": totals[1], "netCents": totals[0] - totals[1], "rewardCents": totals[2]}


literal_db = sqlite3.connect(":memory:")
literal_db.executescript(schema)
literal_db.executescript(seed_sql)
counts, totals = verify(literal_db)
literal_db.executescript(seed_sql)
assert verify(literal_db) == (counts, totals), "SQL reimport changed existing rows"

bound_db = sqlite3.connect(":memory:")
bound_db.executescript(schema)
assert max(len(statement["params"]) for statement in bound["statements"]) <= 90
for statement in bound["statements"]:
    bound_db.execute(statement["sql"], statement["params"])
bound_db.commit()
assert verify(bound_db) == (counts, totals)
for statement in bound["statements"]:
    bound_db.execute(statement["sql"], statement["params"])
bound_db.commit()
assert verify(bound_db) == (counts, totals), "Bound reimport changed existing rows"
# Initialization is safe to resume: simulate a partially applied first batch.
partial_db = sqlite3.connect(":memory:")
partial_db.executescript(schema)
for statement in bound["statements"][:10]:
    partial_db.execute(statement["sql"], statement["params"])
assert partial_db.execute("SELECT value FROM demo_seed_meta WHERE key='seed-version'").fetchone() is None
for statement in bound["statements"]:
    partial_db.execute(statement["sql"], statement["params"])
assert verify(partial_db) == (counts, totals)

report = {"version": "v1.7", "sqliteVersion": sqlite3.sqlite_version,
          "literalSqlImport": "passed", "boundD1StatementsLocalSqliteImport": "passed",
          "idempotentReimport": "passed", "partialInitializationResume": "passed",
          "integrityCheck": "ok", "foreignKeyViolations": 0,
          "statementCount": len(bound["statements"]),
          "maxBindParameters": max(len(row["params"]) for row in bound["statements"]),
          "tables": counts, "totalRows": sum(counts.values()), "totals": totals,
          "snapshotExactMatch": True,
          "mysql": "Generated MySQL 8 schema and seed; no MySQL server was available or executed."}
(HERE / "verification.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(report, ensure_ascii=False, indent=2))
