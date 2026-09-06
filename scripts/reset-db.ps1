#Requires -Version 5.1
<#
.SYNOPSIS
    Resets the TaxShield Ledger PostgreSQL database, reapplies migrations, seeds tax rules, and verifies state.

.DESCRIPTION
    This script drops and recreates the database schema, executes all Prisma migrations,
    seeds the authoritative multi-state tax rules and jurisdictions, creates required partial indexes,
    and outputs a diagnostic verification summary.

.PARAMETER Target
    The target application environment: "oss" (default) or "saas".

.PARAMETER Force
    Skips interactive confirmation prompt.

.PARAMETER SkipSeed
    Skips seeding the tax rules fixtures after schema reset.

.EXAMPLE
    .\reset-db.ps1
    Prompts for confirmation, then resets and seeds the OSS database.

.EXAMPLE
    .\reset-db.ps1 -Force
    Resets the database without interactive prompts.
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Position = 0)]
    [ValidateSet("oss", "saas")]
    [string]$Target = "oss",

    [Parameter()]
    [switch]$Force,

    [Parameter()]
    [switch]$SkipSeed
)

$ErrorActionPreference = "Stop"

$RootDir = $PSScriptRoot
if (Test-Path (Join-Path $PSScriptRoot "taxshield-ledger-oss") -PathType Container) {
    $RootDir = $PSScriptRoot
}
elseif (Test-Path (Join-Path $PSScriptRoot "..\taxshield-ledger-oss") -PathType Container) {
    $RootDir = (Get-Item (Join-Path $PSScriptRoot "..")).FullName
}
elseif (Test-Path (Join-Path $PSScriptRoot "..\..\taxshield-ledger-oss") -PathType Container) {
    $RootDir = (Get-Item (Join-Path $PSScriptRoot "..\..")).FullName
}

function Show-Header {
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host "   TaxShield Ledger - Database Reset Utility    " -ForegroundColor White
    Write-Host "=================================================" -ForegroundColor Cyan
}

function Confirm-Reset([switch]$forceFlag) {
    if ($forceFlag) {
        return $true
    }
    Write-Host ""
    Write-Host "WARNING: This operation will DROP all database tables and erase all:" -ForegroundColor Yellow
    Write-Host "  - Registered Users and Password Credentials" -ForegroundColor Yellow
    Write-Host "  - Company Profiles and Employee Roster" -ForegroundColor Yellow
    Write-Host "  - Payroll Runs, Pay Stubs, and Timesheets" -ForegroundColor Yellow
    Write-Host "  - Expense Logs, Mileage Records, and Audit Logs" -ForegroundColor Yellow
    Write-Host ""
    $confirmation = Read-Host "Are you sure you want to completely reset the database? [y/N]"
    if ($confirmation -notmatch '^(y|yes)$') {
        Write-Host "Database reset cancelled by user." -ForegroundColor Gray
        return $false
    }
    return $true
}

function Test-DatabaseConnectivity {
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect("127.0.0.1", 5432)
        $tcpClient.Close()
        return $true
    }
    catch {
        return $false
    }
}

function Reset-PrismaDatabase([string]$appDir, [switch]$skipSeedFlag) {
    Push-Location $appDir
    try {
        Write-Host ""
        Write-Host "[1/2] Resetting schema, reapplying migrations, and seeding..." -ForegroundColor Cyan
        if ($skipSeedFlag) {
            pnpm prisma migrate reset --force --skip-seed
        }
        else {
            pnpm prisma migrate reset --force
        }
        if ($LASTEXITCODE -ne 0) {
            throw "Prisma migrate reset failed with exit code $LASTEXITCODE"
        }

        Write-Host ""
        Write-Host "[2/2] Ensuring single-owner partial index and verifying database state..." -ForegroundColor Cyan
        $verifyScriptPath = Join-Path $appDir "scripts/ensure-indexes-and-verify.ts"
        if (Test-Path $verifyScriptPath -PathType Leaf) {
            pnpm exec tsx scripts/ensure-indexes-and-verify.ts
            if ($LASTEXITCODE -ne 0) {
                throw "Database index creation and verification failed"
            }
        }
    }
    finally {
        Pop-Location
    }
}

# Main Execution
Show-Header

if (-not (Confirm-Reset -forceFlag:$Force)) {
    exit 0
}

Write-Host ""
Write-Host "Checking PostgreSQL connection on port 5432..." -ForegroundColor Gray
if (-not (Test-DatabaseConnectivity)) {
    Write-Host "WARNING: Could not connect to PostgreSQL on 127.0.0.1:5432." -ForegroundColor Red
    Write-Host "Make sure PostgreSQL is running (e.g. docker compose up -d or local service)." -ForegroundColor Yellow
    exit 1
}

$TargetDir = if ($Target -eq "saas") {
    Join-Path $RootDir "taxshield-ledger-saas"
} else {
    Join-Path $RootDir "taxshield-ledger-oss"
}

if (-not (Test-Path $TargetDir -PathType Container)) {
    Write-Host "Target directory not found: $TargetDir" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path (Join-Path $TargetDir "prisma/schema.prisma") -PathType Leaf)) {
    Write-Host "Prisma schema not found in $TargetDir. Defaulting to taxshield-ledger-oss." -ForegroundColor Yellow
    $TargetDir = Join-Path $RootDir "taxshield-ledger-oss"
}

Reset-PrismaDatabase -appDir $TargetDir -skipSeedFlag:$SkipSeed

Write-Host ""
Write-Host "=================================================" -ForegroundColor Green
Write-Host "[OK] Database reset complete and ready for setup!" -ForegroundColor Green
Write-Host "  Start the server: pnpm dev                     " -ForegroundColor White
Write-Host "  Open browser:     http://localhost:3000        " -ForegroundColor White
Write-Host "=================================================" -ForegroundColor Green
