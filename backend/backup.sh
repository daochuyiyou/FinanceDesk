#!/bin/bash
BACKUP_DIR="/home/hermes/workspace/source/backend/backups"
DB_PATH="/home/hermes/workspace/source/backend/FinanceDesk_Data/finance.db"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"
python3 -c "
import sqlite3, gzip
conn = sqlite3.connect('$DB_PATH')
with gzip.open('$BACKUP_DIR/finance_$DATE.sql.gz', 'wt') as f:
    for line in conn.iterdump():
        f.write(line + chr(10))
conn.close()
"
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
echo "Backup: $BACKUP_DIR/finance_$DATE.sql.gz"
