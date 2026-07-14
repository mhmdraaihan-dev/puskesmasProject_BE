#!/usr/bin/env pwsh
# Backup the Postgres database running in the project's docker container (Windows/PowerShell).
# Dumps inside the container, then `docker cp`s the file out -- avoids PowerShell's
# text-pipeline mangling binary pg_dump (-Fc) output.
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Get-Content .env | Where-Object { $_ -match '=' -and $_ -notmatch '^\s*#' } | ForEach-Object {
    $key, $value = $_ -split '=', 2
    Set-Item -Path "env:$($key.Trim())" -Value $value.Trim()
}

$Container = if ($env:POSTGRES_CONTAINER_NAME) { $env:POSTGRES_CONTAINER_NAME } else { "puskesmas-database" }
$BackupDir = "backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$OutFile = Join-Path $BackupDir "$($env:POSTGRES_DB)_$Timestamp.dump"
$TmpPath = "/tmp/backup_$Timestamp.dump"

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

if (-not (docker ps --format '{{.Names}}' | Select-String -Pattern "^$Container$")) {
    Write-Error "Container '$Container' is not running. Start it with: docker compose up -d"
    exit 1
}

Write-Host "Backing up '$($env:POSTGRES_DB)' from container '$Container'..."
docker exec $Container pg_dump -U $env:POSTGRES_USER -d $env:POSTGRES_DB -Fc -f $TmpPath
docker cp "${Container}:${TmpPath}" $OutFile
docker exec $Container rm -f $TmpPath

Write-Host "Backup saved to $OutFile"
