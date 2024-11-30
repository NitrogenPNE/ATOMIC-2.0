<#
.SYNOPSIS
    Intrusion Detection System (IDS) for monitoring and detecting unauthorized access attempts within the ATOMIC CorporateHQ network.

.DESCRIPTION
    This script monitors network traffic, system logs, and application events for suspicious activity.
    It includes real-time alerts, anomaly detection, and logging capabilities for forensic analysis.

.AUTHOR
    ATOMIC Development Team
#>

# Configuration
$LogDirectory = "C:\ATOMIC 2.0\CorporateHQNode\SecurityEnhancements\Logs"
$AlertRecipients = @("security@atomic.corp")
$MaxLogFileSizeMB = 10
$MonitoringIntervalSeconds = 10

# Initialize logging
If (-Not (Test-Path $LogDirectory)) {
    New-Item -ItemType Directory -Path $LogDirectory | Out-Null
}
$LogFile = Join-Path -Path $LogDirectory -ChildPath "IntrusionDetectionLogs.log"
Function Write-Log {
    Param (
        [Parameter(Mandatory = $true)]
        [string]$Message,
        [string]$Level = "INFO"
    )
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "$Timestamp [$Level] $Message"
    $LogEntry | Out-File -FilePath $LogFile -Append -Encoding UTF8
    Write-Output $LogEntry
}

# Define alerting function
Function Send-Alert {
    Param (
        [Parameter(Mandatory = $true)]
        [string]$Message
    )
    foreach ($Recipient in $AlertRecipients) {
        Write-Log "Sending alert to $Recipient: $Message" "ALERT"
        # Simulate sending email or notification
        Write-Output "ALERT: $Message (sent to $Recipient)"
    }
}

# Monitor network traffic
Function Monitor-NetworkTraffic {
    Write-Log "Starting network traffic monitoring..."
    Try {
        # Example: Check for unauthorized IP connections (placeholder for real network monitoring logic)
        $UnauthorizedConnections = Get-NetTCPConnection | Where-Object { $_.RemoteAddress -notmatch "^(192\.168\.|10\.0\.)" }
        If ($UnauthorizedConnections) {
            $Message = "Detected unauthorized connections: $($UnauthorizedConnections | Format-Table -AutoSize | Out-String)"
            Write-Log $Message "WARNING"
            Send-Alert $Message
        }
    } Catch {
        Write-Log "Error during network traffic monitoring: $_" "ERROR"
    }
}

# Monitor system logs
Function Monitor-SystemLogs {
    Write-Log "Starting system log monitoring..."
    Try {
        # Example: Check event logs for failed login attempts
        $FailedLogins = Get-EventLog -LogName Security -InstanceId 4625 -Newest 100
        If ($FailedLogins.Count -gt 0) {
            $Message = "Detected failed login attempts: $($FailedLogins | Format-Table -AutoSize | Out-String)"
            Write-Log $Message "WARNING"
            Send-Alert $Message
        }
    } Catch {
        Write-Log "Error during system log monitoring: $_" "ERROR"
    }
}

# Monitor application logs
Function Monitor-ApplicationLogs {
    Write-Log "Starting application log monitoring..."
    Try {
        # Example: Check application logs for critical errors (placeholder for real monitoring logic)
        $CriticalErrors = Get-EventLog -LogName Application -EntryType Error -Newest 100
        If ($CriticalErrors.Count -gt 0) {
            $Message = "Detected critical application errors: $($CriticalErrors | Format-Table -AutoSize | Out-String)"
            Write-Log $Message "CRITICAL"
            Send-Alert $Message
        }
    } Catch {
        Write-Log "Error during application log monitoring: $_" "ERROR"
    }
}

# Ensure log file rotation
Function Rotate-LogFiles {
    $LogFileSizeMB = (Get-Item $LogFile).Length / 1MB
    If ($LogFileSizeMB -ge $MaxLogFileSizeMB) {
        $ArchiveFile = $LogFile -replace "\.log$", "_$(Get-Date -Format 'yyyyMMddHHmmss').log"
        Rename-Item -Path $LogFile -NewName $ArchiveFile
        Write-Log "Log file rotated: $ArchiveFile"
    }
}

# Main loop
While ($true) {
    Try {
        Rotate-LogFiles
        Monitor-NetworkTraffic
        Monitor-SystemLogs
        Monitor-ApplicationLogs
    } Catch {
        Write-Log "Unexpected error in Intrusion Detection System: $_" "ERROR"
    }
    Start-Sleep -Seconds $MonitoringIntervalSeconds
}