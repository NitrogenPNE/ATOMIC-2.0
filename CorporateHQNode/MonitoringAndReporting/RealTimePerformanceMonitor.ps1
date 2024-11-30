<#
.SYNOPSIS
    Monitors real-time performance metrics for the Corporate HQ Node.

.DESCRIPTION
    This script collects real-time performance data including CPU, memory, disk usage,
    and network activity for the Corporate HQ Node. It generates reports, issues alerts
    for thresholds, and logs data for trend analysis.

.AUTHOR
    Corporate HQ Node Development Team

.VERSION
    1.0.0
#>

# Define configuration
$PerformanceLogPath = "C:\ATOMIC 2.0\CorporateHQNode\Logs\performanceLog.json"
$AlertLogPath = "C:\ATOMIC 2.0\CorporateHQNode\Alerts\performanceAlerts.json"

# Performance thresholds
$Thresholds = @{
    CPUUsage      = 80  # Percentage
    MemoryUsage   = 85  # Percentage
    DiskUsage     = 90  # Percentage
    NetworkLatency = 100 # Milliseconds
}

# Ensure directories exist
$PathsToCheck = @($PerformanceLogPath, $AlertLogPath)
foreach ($Path in $PathsToCheck) {
    $Directory = Split-Path -Path $Path
    if (-not (Test-Path -Path $Directory)) {
        New-Item -ItemType Directory -Path $Directory | Out-Null
    }
}

# Function: Monitor system performance
function Monitor-SystemPerformance {
    Write-Host "Collecting system performance metrics..." -ForegroundColor Cyan

    $CPUUsage = (Get-Counter '\Processor(_Total)\% Processor Time').CounterSamples[0].CookedValue
    $MemoryUsage = Get-MemoryUsagePercentage
    $DiskUsage = Get-DiskUsagePercentage
    $NetworkLatency = Test-NetworkLatency -Target "hq.supernode.local"

    $Metrics = @{
        Timestamp      = (Get-Date).ToString("o")
        CPUUsage       = [math]::Round($CPUUsage, 2)
        MemoryUsage    = $MemoryUsage
        DiskUsage      = $DiskUsage
        NetworkLatency = $NetworkLatency
    }

    Log-PerformanceMetrics $Metrics
    Check-Thresholds $Metrics
}

# Function: Get memory usage percentage
function Get-MemoryUsagePercentage {
    $TotalMemory = (Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory
    $FreeMemory = (Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory * 1KB
    $UsedMemory = $TotalMemory - $FreeMemory
    return [math]::Round(($UsedMemory / $TotalMemory) * 100, 2)
}

# Function: Get disk usage percentage
function Get-DiskUsagePercentage {
    $Disks = Get-PSDrive -PSProvider FileSystem
    $DiskUsage = @()
    foreach ($Disk in $Disks) {
        if ($Disk.Used -gt 0 -and $Disk.Free -gt 0) {
            $Usage = [math]::Round(($Disk.Used / ($Disk.Used + $Disk.Free)) * 100, 2)
            $DiskUsage += $Usage
        }
    }
    return [math]::Round(($DiskUsage | Measure-Object -Average).Average, 2)
}

# Function: Test network latency
function Test-NetworkLatency {
    param (
        [string]$Target
    )
    $PingResult = Test-Connection -ComputerName $Target -Count 1 -ErrorAction SilentlyContinue
    if ($PingResult) {
        return $PingResult.ResponseTime
    } else {
        return -1  # Indicate network failure
    }
}

# Function: Log performance metrics
function Log-PerformanceMetrics {
    param (
        [hashtable]$Metrics
    )

    if (Test-Path $PerformanceLogPath) {
        $ExistingLog = Get-Content $PerformanceLogPath | ConvertFrom-Json
        $UpdatedLog = $ExistingLog + $Metrics
    } else {
        $UpdatedLog = @($Metrics)
    }

    $UpdatedLog | ConvertTo-Json -Depth 10 | Set-Content -Path $PerformanceLogPath
    Write-Host "Performance metrics logged." -ForegroundColor Green
}

# Function: Check thresholds and issue alerts
function Check-Thresholds {
    param (
        [hashtable]$Metrics
    )

    $Alerts = @()
    foreach ($Key in $Thresholds.Keys) {
        if ($Metrics[$Key] -ge $Thresholds[$Key]) {
            $Alerts += @{
                Timestamp = (Get-Date).ToString("o")
                Metric    = $Key
                Value     = $Metrics[$Key]
                Threshold = $Thresholds[$Key]
                Status    = "Threshold Exceeded"
            }
        }
    }

    if ($Alerts.Count -gt 0) {
        Log-Alerts $Alerts
        Write-Host "Alerts issued for exceeding thresholds!" -ForegroundColor Red
    } else {
        Write-Host "No thresholds exceeded." -ForegroundColor Green
    }
}

# Function: Log alerts
function Log-Alerts {
    param (
        [array]$Alerts
    )

    if (Test-Path $AlertLogPath) {
        $ExistingAlerts = Get-Content $AlertLogPath | ConvertFrom-Json
        $UpdatedAlerts = $ExistingAlerts + $Alerts
    } else {
        $UpdatedAlerts = $Alerts
    }

    $UpdatedAlerts | ConvertTo-Json -Depth 10 | Set-Content -Path $AlertLogPath
}

# Schedule monitoring
Write-Host "Starting real-time performance monitoring..." -ForegroundColor Yellow
while ($true) {
    Monitor-SystemPerformance
    Start-Sleep -Seconds 60
}