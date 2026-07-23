from __future__ import annotations

import csv
import hashlib
import os
import sqlite3
import sys
import time
from pathlib import Path

CSV_PATH = Path(r"C:\Users\jeffg\OneDrive\Desktop\00_All_Records\All_Records__File_1_of_1.csv")
DB_PATH = Path(__file__).resolve().parents[1] / "data.sqlite"
BATCH_SIZE = 50000

RAW_COLUMNS = [
    ("property_id", "TEXT"),
    ("raw_property_type", "TEXT"),
    ("cash_reported", "REAL"),
    ("shares_reported", "REAL"),
    ("name_of_securities_reported", "TEXT"),
    ("no_of_owners", "INTEGER"),
    ("owner_name", "TEXT"),
    ("owner_street_1", "TEXT"),
    ("owner_street_2", "TEXT"),
    ("owner_street_3", "TEXT"),
    ("owner_city", "TEXT"),
    ("owner_state", "TEXT"),
    ("owner_zip", "TEXT"),
    ("owner_country_code", "TEXT"),
    ("current_cash_balance", "REAL"),
    ("number_of_pending_claims", "INTEGER"),
    ("number_of_paid_claims", "INTEGER"),
    ("holder_name", "TEXT"),
    ("holder_street_1", "TEXT"),
    ("holder_street_2", "TEXT"),
    ("holder_street_3", "TEXT"),
    ("holder_city", "TEXT"),
    ("holder_state", "TEXT"),
    ("holder_zip", "TEXT"),
    ("cusip", "TEXT"),
]


def clean(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return value or None


def num(value: str | None) -> float | None:
    value = clean(value)
    if value is None:
        return None
    try:
        return float(value.replace(",", "").replace("$", ""))
    except ValueError:
        return None


def integer(value: str | None) -> int | None:
    value = clean(value)
    if value is None:
        return None
    try:
        return int(float(value.replace(",", "")))
    except ValueError:
        return None


def row_to_values(row: dict[str, str], source: str) -> tuple:
    owner = clean(row.get("OWNER_NAME")) or ""
    owner_state = (clean(row.get("OWNER_STATE")) or "").upper()
    street = " ".join(
        x for x in (clean(row.get("OWNER_STREET_1")), clean(row.get("OWNER_STREET_2")), clean(row.get("OWNER_STREET_3"))) if x
    )
    location = ", ".join(
        x for x in (street, clean(row.get("OWNER_CITY")), owner_state, clean(row.get("OWNER_ZIP"))) if x
    )
    property_id = clean(row.get("PROPERTY_ID")) or ""
    raw_type = clean(row.get("PROPERTY_TYPE")) or "Unclaimed Property"
    current_balance = num(row.get("CURRENT_CASH_BALANCE"))
    amount = current_balance if current_balance is not None else (num(row.get("CASH_REPORTED")) or 0.0)

    app_values = (
        owner, "", owner_state, raw_type, amount, clean(row.get("HOLDER_NAME")) or "Unknown Holder",
        location, property_id, "1", "State Unclaimed Property", raw_type, None, None, source
    )
    raw_values = (
        property_id, raw_type, num(row.get("CASH_REPORTED")), num(row.get("SHARES_REPORTED")),
        clean(row.get("NAME_OF_SECURITIES_REPORTED")), integer(row.get("NO_OF_OWNERS")), owner,
        clean(row.get("OWNER_STREET_1")), clean(row.get("OWNER_STREET_2")), clean(row.get("OWNER_STREET_3")),
        clean(row.get("OWNER_CITY")), owner_state, clean(row.get("OWNER_ZIP")), clean(row.get("OWNER_COUNTRY_CODE")),
        current_balance, integer(row.get("NUMBER_OF_PENDING_CLAIMS")), integer(row.get("NUMBER_OF_PAID_CLAIMS")),
        clean(row.get("HOLDER_NAME")), clean(row.get("HOLDER_STREET_1")), clean(row.get("HOLDER_STREET_2")),
        clean(row.get("HOLDER_STREET_3")), clean(row.get("HOLDER_CITY")), clean(row.get("HOLDER_STATE")),
        clean(row.get("HOLDER_ZIP")), clean(row.get("CUSIP")),
    )
    return app_values + raw_values


def main() -> int:
    if not CSV_PATH.is_file():
        print(f"ERROR source_not_found path={CSV_PATH}")
        return 2

    source = str(CSV_PATH)
    size = CSV_PATH.stat().st_size
    digest = os.environ.get("SOURCE_SHA256")
    if not digest:
        checksum = hashlib.sha256()
        with CSV_PATH.open("rb") as f:
            for block in iter(lambda: f.read(8 * 1024 * 1024), b""):
                checksum.update(block)
        digest = checksum.hexdigest()
    print(f"source_bytes={size} sha256={digest}", flush=True)

    db = sqlite3.connect(DB_PATH)
    db.execute("PRAGMA foreign_keys=ON")
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("PRAGMA synchronous=NORMAL")
    db.execute("PRAGMA busy_timeout=60000")

    db.execute("CREATE TABLE IF NOT EXISTS import_manifest (source_path TEXT PRIMARY KEY, source_size INTEGER NOT NULL, source_sha256 TEXT NOT NULL, status TEXT NOT NULL, rows_imported INTEGER NOT NULL DEFAULT 0, started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, completed_at TEXT)")
    previous = db.execute("SELECT status, source_size, source_sha256, rows_imported FROM import_manifest WHERE source_path=?", (source,)).fetchone()
    if previous and previous[0] == "complete" and previous[1] == size and previous[2] == digest:
        print(f"already_complete rows={previous[3]}", flush=True)
        return 0

    for name, typ in RAW_COLUMNS:
        try:
            db.execute(f"ALTER TABLE scraped_records ADD COLUMN {name} {typ}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" not in str(e).lower():
                raise

    db.execute("INSERT INTO import_manifest(source_path,source_size,source_sha256,status,rows_imported) VALUES(?,?,?,?,0) ON CONFLICT(source_path) DO UPDATE SET source_size=excluded.source_size,source_sha256=excluded.source_sha256,status='running',started_at=CURRENT_TIMESTAMP,completed_at=NULL", (source, size, digest, "running"))
    db.commit()

    insert_cols = [
        "first_name", "last_name", "state", "property_type", "amount", "company", "location", "state_id", "category_id", "category_title", "sub_type", "decedent_name", "ssn_last4", "source"
    ] + [name for name, _ in RAW_COLUMNS]
    placeholders = ",".join("?" for _ in insert_cols)
    sql = f"INSERT OR IGNORE INTO scraped_records ({','.join(insert_cols)}) VALUES ({placeholders})"
    insert = db.cursor()
    total = 0
    skipped = 0
    started = time.time()

    with CSV_PATH.open("r", encoding="utf-8-sig", newline="", errors="replace") as f:
        reader = csv.DictReader(f)
        expected = {"PROPERTY_ID", "PROPERTY_TYPE", "OWNER_NAME", "OWNER_STATE"}
        missing = expected - set(reader.fieldnames or [])
        if missing:
            raise RuntimeError(f"missing_headers={sorted(missing)}")
        batch = []
        for row in reader:
            if not clean(row.get("PROPERTY_ID")):
                skipped += 1
                continue
            try:
                batch.append(row_to_values(row, source))
            except Exception:
                skipped += 1
                continue
            if len(batch) >= BATCH_SIZE:
                db.execute("BEGIN")
                insert.executemany(sql, batch)
                db.execute("COMMIT")
                total += len(batch)
                batch.clear()
                if total % 100000 == 0:
                    db.execute("UPDATE import_manifest SET rows_imported=? WHERE source_path=?", (total, source))
                    db.commit()
                    elapsed = max(time.time() - started, 0.001)
                    print(f"progress_rows={total} skipped={skipped} rows_per_sec={total/elapsed:.1f}", flush=True)
        if batch:
            db.execute("BEGIN")
            insert.executemany(sql, batch)
            db.execute("COMMIT")
            total += len(batch)

    db.execute("CREATE INDEX IF NOT EXISTS idx_scraped_records_property_id ON scraped_records(property_id)")
    db.execute("CREATE INDEX IF NOT EXISTS idx_scraped_records_owner_state ON scraped_records(owner_state)")
    db.execute("CREATE INDEX IF NOT EXISTS idx_scraped_records_owner_name ON scraped_records(owner_name)")
    db.execute("UPDATE import_manifest SET status='complete',rows_imported=?,completed_at=CURRENT_TIMESTAMP WHERE source_path=?", (total, source))
    db.commit()
    db.execute("PRAGMA wal_checkpoint(TRUNCATE)")
    count, value = db.execute("SELECT COUNT(*), COALESCE(SUM(amount),0) FROM scraped_records").fetchone()
    print(f"complete source_rows_seen={total} skipped={skipped} db_rows={count} total_amount={value:.2f}", flush=True)
    db.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
