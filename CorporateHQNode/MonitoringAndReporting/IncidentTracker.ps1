<#
.SYNOPSIS
    Tracks and logs incidents related to the Corporate HQ Node for monitoring and reporting purposes.

.DESCRIPTION
    This script tracks incidents reported by various monitoring modules. It logs the incidents
    with timestamps, categories, severity levels, and descriptions. It also supports generating
    summary reports and issuing alerts for critical issues.

.AUTHOR
    Corporate HQ Node Development Team

.VERSION
    1.0.0

#>

# Define configuration
$IncidentLogPath = "C:\ATOMIC 2.0\CorporateHQNode\Logs\incidentLog.json"
$CriticalAlertPath = "C:\ATOMIC 2.0\CorporateHQNode\Alerts\criticalAlerts.json"
$SummaryReportPath = "C:\ATOMIC 2.0\CorporateHQNode\Reports\incidentSummary.json"

# Ensure directories exist
$PathsToCheck = @($IncidentLogPath, $CriticalAlertPath, $SummaryReportPath)
foreach ($Path in $PathsToCheck) {
    $Directory = Split-Path -Path $Path
    if (-not (Test-Path -Path $Directory)) {
        New-Item -ItemType Directory -Path $Directory | Out-Null
    }
}

# Function: Log an incident
function Log-Incident {
    param (
        [Parameter(Mandatory = $true)]
        [string]$Category,
        
        [Parameter(Mandatory = $true)]
        [string]$Severity,
        
        [Parameter(Mandatory = $true)]
        [string]$Description
    )

    $Incident = @{
        Timestamp   = (Get-Date).ToString("o")
        Category    = $Category
        Severity    = $Severity
        Description = $Description
    }

    # Append to the incident log
    if (Test-Path $IncidentLogPath) {
        $ExistingLog = Get-Content $IncidentLogPath | ConvertFrom-Json
        $UpdatedLog = $ExistingLog + $Incident
    } else {
        $UpdatedLog = @($Incident)
    }

    $UpdatedLog | ConvertTo-Json -Depth 10 | Set-Content -Path $IncidentLogPath

    Write-Host "Incident logged:" -ForegroundColor Green
    Write-Output $Incident

    # If critical, trigger an alert
    if ($Severity -eq "Critical") {
        Issue-CriticalAlert $Incident
    }
}

# Function: Issue a critical alert
function Issue-CriticalAlert {
    param (
        [Parameter(Mandatory = $true)]
        [hashtable]$Incident
    )

    if (Test-Path $CriticalAlertPath) {
        $ExistingAlerts = Get-Content $CriticalAlertPath | ConvertFrom-Json
        $UpdatedAlerts = $ExistingAlerts + $Incident
    } else {
        $UpdatedAlerts = @($Incident)
    }

    $UpdatedAlerts | ConvertTo-Json -Depth 10 | Set-Content -Path $CriticalAlertPath
    Write-Host "Critical alert issued!" -ForegroundColor Red
}

# Function: Generate a summary report
function Generate-SummaryReport {
    Write-Host "Generating incident summary report..." -ForegroundColor Yellow

    if (-not (Test-Path $IncidentLogPath)) {
        Write-Host "No incident logs found. Summary report cannot be generated." -ForegroundColor Red
        return
    }

    $IncidentLog = Get-Content $IncidentLogPath | ConvertFrom-Json
    $Summary = $IncidentLog | Group-Object -Property Severity -NoElement | ForEach-Object {
        @{
            Severity = $_.Name
            Count    = $_.Count
        }
    }

    $Summary | ConvertTo-Json -Depth 10 | Set-Content -Path $SummaryReportPath
    Write-Host "Summary report saved to $SummaryReportPath" -ForegroundColor Green
}

# Script entry point
Write-Host "Incident Tracker Initialized" -ForegroundColor Cyan
Write-Host "Use the following commands:" -ForegroundColor Yellow
Write-Host "  Log-Incident -Category 'Network' -Severity 'Critical' -Description 'Node outage detected.'"
Write-Host "  Generate-SummaryReport"