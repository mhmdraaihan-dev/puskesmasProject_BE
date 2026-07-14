#!/usr/bin/env pwsh
# Restore a backup produced by backup-database.ps1/.sh (Windows/PowerShell).
# Usage: ./restore-database.ps1 [backup_file] [target_db]
#   backup_file defaults to the newest file in ./backups
#   target_db   defaults to POSTGRES_DB from .env (existing data is dropped/replaced)
param(
    [string]$BackupFile,
    [string]$TargetDb
)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Get-Content .env | Where-Object { $_ -match '=' -and $_ -notmatch '^\s*#' } | ForEach-Object {
    $key, $value = $_ -split '=', 2
    Set-Item -Path "env:$($key.Trim())" -Value $value.Trim()
}

$Container = if ($env:POSTGRES_CONTAINER_NAME) { $env:POSTGRES_CONTAINER_NAME } else { "puskesmas-database" }

if (-not $BackupFile) {
    $BackupFile = Get-ChildItem "backups/*.dump" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName
}
if (-not $TargetDb) { $TargetDb = $env:POSTGRES_DB }

if (-not $BackupFile -or -not (Test-Path $BackupFile)) {
    Write-Error "No backup file found. Usage: ./restore-database.ps1 [backup_file] [target_db]"
    exit 1
}

if (-not (docker ps --format '{{.Names}}' | Select-String -Pattern "^$Container$")) {
    Write-Error "Container '$Container' is not running. Start it with: docker compose up -d"
    exit 1
}

Write-Host "Restoring $BackupFile into database '$TargetDb' on container '$Container'..."

$exists = docker exec $Container psql -U $env:POSTGRES_USER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$TargetDb'"
if ($exists -ne "1") {
    docker exec $Container createdb -U $env:POSTGRES_USER $TargetDb
}

$TmpPath = "/tmp/restore_$(Split-Path $BackupFile -Leaf)"
docker cp $BackupFile "${Container}:${TmpPath}"
docker exec $Container pg_restore -U $env:POSTGRES_USER -d $TargetDb --clean --if-exists $TmpPath
docker exec $Container rm -f $TmpPath

Write-Host "Restore complete into '$TargetDb'."
