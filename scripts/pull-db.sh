#!/bin/bash

set -euo pipefail

PACKAGE="com.synmarket.playcalmo"

adb shell "run-as $PACKAGE cat databases/ytcurator.db" > /tmp/ytcurator.db

echo "DB salvo em /tmp/ytcurator.db — abra com: sqlite3 /tmp/ytcurator.db"
