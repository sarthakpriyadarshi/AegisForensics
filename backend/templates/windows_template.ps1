# Aegis Forensics - Windows Live Analysis Script
# Generated automatically for: {{ANALYSIS_TYPE}} analysis
# Target Server: {{SERVER_HOST}}:{{SERVER_PORT}}
# Generated on: {{GENERATION_TIME}}

param(
    [switch]$Silent = {{STEALTH_MODE}}
)

# Configuration
$CONFIG = @{
    Server = @{
        Host = {{SERVER_HOST}}
        Port = {{SERVER_PORT}}
        UseHttps = {{USE_HTTPS}}
        BaseUrl = {{BASE_URL}}
        ApiKey = {{API_KEY}}
        Timeout = {{TIMEOUT_SECONDS}}
    }
    Analysis = @{
        Type = {{ANALYSIS_TYPE}}
        IncludeSystemInfo = {{INCLUDE_SYSTEM_INFO}}
        IncludeEnvironment = {{INCLUDE_ENVIRONMENT}}
        StealthMode = {{STEALTH_MODE}}
    },
    Burst = @{
        Enabled = {{BURST_ENABLED}}
        IntervalSeconds = {{BURST_INTERVAL}}
        BurstCount = {{BURST_COUNT}}
        BatchSizeKB = {{BATCH_SIZE_KB}}
    }
    CustomHeaders = {{CUSTOM_HEADERS}}
}

# Helper Functions
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    if (-not $CONFIG.Analysis.StealthMode) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Write-Host "[$timestamp] $Level: $Message"
    }
}

function Test-Dependencies {
    $required = @("Invoke-RestMethod", "Get-Process", "Get-NetTCPConnection")
    $available = $true
    
    foreach ($cmd in $required) {
        if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
            Write-Log "Missing required command: $cmd" "ERROR"
            $available = $false
        }
    }
    
    return $available
}

function Invoke-SafeCommand {
    param(
        [string]$Command,
        [scriptblock]$ScriptBlock,
        [string]$ErrorMessage = "Command failed"
    )
    
    try {
        $result = & $ScriptBlock
        return @{
            Success = $true
            Data = $result
            Error = $null
        }
    }
    catch {
        Write-Log "$ErrorMessage : $($_.Exception.Message)" "WARNING"
        return @{
            Success = $false
            Data = $null
            Error = $_.Exception.Message
        }
    }
}

function Get-SystemInfo {
    if (-not $CONFIG.Analysis.IncludeSystemInfo) {
        return @{}
    }
    
    $systemInfo = @{
        Timestamp = (Get-Date).ToString("o")
        Hostname = $env:COMPUTERNAME
        Platform = @{
            System = "Windows"
            Version = (Get-WmiObject Win32_OperatingSystem).Caption
            BuildNumber = (Get-WmiObject Win32_OperatingSystem).BuildNumber
            Architecture = (Get-WmiObject Win32_OperatingSystem).OSArchitecture
            ServicePack = (Get-WmiObject Win32_OperatingSystem).ServicePackMajorVersion
        }
        User = $env:USERNAME
        Domain = $env:USERDOMAIN
        PowerShellVersion = $PSVersionTable.PSVersion.ToString()
    }
    
    # Add hardware info
    $cpu = Invoke-SafeCommand "CPU Info" { Get-WmiObject Win32_Processor | Select-Object -First 1 }
    if ($cpu.Success) {
        $systemInfo.CPU = $cpu.Data.Name
    }
    
    $memory = Invoke-SafeCommand "Memory Info" { Get-WmiObject Win32_ComputerSystem }
    if ($memory.Success) {
        $systemInfo.TotalMemoryGB = [math]::Round($memory.Data.TotalPhysicalMemory / 1GB, 2)
    }
    
    return $systemInfo
}

function Get-EnvironmentData {
    if (-not $CONFIG.Analysis.IncludeEnvironment) {
        return @{}
    }
    
    return @{
        EnvironmentVariables = Get-ChildItem Env: | ForEach-Object { @{$_.Name = $_.Value} }
        Path = $env:PATH -split ";"
        Home = $env:USERPROFILE
        WorkingDirectory = (Get-Location).Path
    }
}

function Get-MemoryData {
    $data = @{
        MemoryAnalysis = @{}
    }
    
    # Running processes
    $processes = Invoke-SafeCommand "Process List" { 
        Get-Process | Select-Object Id, ProcessName, CPU, WorkingSet, VirtualMemorySize, StartTime, Path
    }
    if ($processes.Success) {
        $data.MemoryAnalysis.Processes = $processes.Data
    }
    
    # Memory usage
    $memory = Invoke-SafeCommand "Memory Usage" { 
        Get-WmiObject Win32_OperatingSystem | Select-Object TotalVisibleMemorySize, FreePhysicalMemory
    }
    if ($memory.Success) {
        $data.MemoryAnalysis.MemoryUsage = $memory.Data
    }
    
    # Loaded modules for suspicious processes
    $modules = Invoke-SafeCommand "Loaded Modules" {
        Get-Process | Where-Object { $_.ProcessName -match "(powershell|cmd|wscript|cscript)" } | 
        ForEach-Object { 
            try {
                @{
                    ProcessId = $_.Id
                    ProcessName = $_.ProcessName
                    Modules = $_.Modules | Select-Object ModuleName, FileName
                }
            } catch { $null }
        } | Where-Object { $_ -ne $null }
    }
    if ($modules.Success) {
        $data.MemoryAnalysis.LoadedModules = $modules.Data
    }
    
    return $data
}

function Get-NetworkData {
    $data = @{
        NetworkAnalysis = @{}
    }
    
    # Active connections
    $connections = Invoke-SafeCommand "Network Connections" {
        Get-NetTCPConnection | Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, State, OwningProcess
    }
    if ($connections.Success) {
        $data.NetworkAnalysis.TCPConnections = $connections.Data
    }
    
    # Network adapters
    $adapters = Invoke-SafeCommand "Network Adapters" {
        Get-NetAdapter | Select-Object Name, InterfaceDescription, Status, LinkSpeed
    }
    if ($adapters.Success) {
        $data.NetworkAnalysis.NetworkAdapters = $adapters.Data
    }
    
    # DNS client cache
    $dns = Invoke-SafeCommand "DNS Cache" {
        Get-DnsClientCache | Select-Object Entry, Name, Type, Status, Section, TimeToLive
    }
    if ($dns.Success) {
        $data.NetworkAnalysis.DNSCache = $dns.Data
    }
    
    # Routing table
    $routes = Invoke-SafeCommand "Routing Table" {
        Get-NetRoute | Select-Object DestinationPrefix, NextHop, InterfaceAlias, Metric
    }
    if ($routes.Success) {
        $data.NetworkAnalysis.RoutingTable = $routes.Data
    }
    
    return $data
}

function Get-DiskData {
    $data = @{
        DiskAnalysis = @{}
    }
    
    # Disk usage
    $disks = Invoke-SafeCommand "Disk Usage" {
        Get-WmiObject Win32_LogicalDisk | Select-Object DeviceID, Size, FreeSpace, FileSystem
    }
    if ($disks.Success) {
        $data.DiskAnalysis.DiskUsage = $disks.Data
    }
    
    # Recent files in temp directories
    $recentFiles = Invoke-SafeCommand "Recent Temp Files" {
        $tempPaths = @($env:TEMP, "$env:USERPROFILE\AppData\Local\Temp", "C:\Windows\Temp")
        foreach ($path in $tempPaths) {
            if (Test-Path $path) {
                Get-ChildItem $path -File | Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-1) } | 
                Select-Object -First 20 Name, Length, LastWriteTime, FullName
            }
        }
    }
    if ($recentFiles.Success) {
        $data.DiskAnalysis.RecentTempFiles = $recentFiles.Data
    }
    
    # File handles
    $handles = Invoke-SafeCommand "File Handles" {
        Get-Process | Where-Object { $_.Handles -gt 1000 } | 
        Select-Object -First 10 Id, ProcessName, Handles, WorkingSet
    }
    if ($handles.Success) {
        $data.DiskAnalysis.ProcessHandles = $handles.Data
    }
    
    return $data
}

function Get-ProcessData {
    $data = @{
        ProcessAnalysis = @{}
    }
    
    # Detailed process information
    $processes = Invoke-SafeCommand "Process Details" {
        Get-WmiObject Win32_Process | Select-Object ProcessId, Name, CommandLine, ParentProcessId, CreationDate, ExecutablePath
    }
    if ($processes.Success) {
        $data.ProcessAnalysis.ProcessDetails = $processes.Data
    }
    
    # Services
    $services = Invoke-SafeCommand "Running Services" {
        Get-Service | Where-Object { $_.Status -eq "Running" } | Select-Object Name, DisplayName, Status, ServiceType
    }
    if ($services.Success) {
        $data.ProcessAnalysis.RunningServices = $services.Data
    }
    
    # Scheduled tasks
    $tasks = Invoke-SafeCommand "Scheduled Tasks" {
        Get-ScheduledTask | Where-Object { $_.State -eq "Running" } | 
        Select-Object -First 20 TaskName, State, Author, Description
    }
    if ($tasks.Success) {
        $data.ProcessAnalysis.ScheduledTasks = $tasks.Data
    }
    
    return $data
}

function Get-RegistryData {
    $data = @{
        RegistryAnalysis = @{}
    }
    
    # Startup programs
    $startup = Invoke-SafeCommand "Startup Programs" {
        $startupKeys = @(
            "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
            "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
            "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce",
            "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce"
        )
        
        foreach ($key in $startupKeys) {
            if (Test-Path $key) {
                Get-ItemProperty $key | ForEach-Object {
                    $_.PSObject.Properties | Where-Object { $_.Name -ne "PSPath" -and $_.Name -ne "PSParentPath" -and $_.Name -ne "PSChildName" -and $_.Name -ne "PSDrive" -and $_.Name -ne "PSProvider" } | 
                    ForEach-Object { @{ Key = $key; Name = $_.Name; Value = $_.Value } }
                }
            }
        }
    }
    if ($startup.Success) {
        $data.RegistryAnalysis.StartupPrograms = $startup.Data
    }
    
    # Recently opened files
    $recentDocs = Invoke-SafeCommand "Recent Documents" {
        $recentKey = "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\RecentDocs"
        if (Test-Path $recentKey) {
            Get-ChildItem $recentKey | ForEach-Object {
                @{
                    FileType = $_.PSChildName
                    Entries = Get-ItemProperty $_.PSPath | Select-Object -Property * -ExcludeProperty PS*
                }
            }
        }
    }
    if ($recentDocs.Success) {
        $data.RegistryAnalysis.RecentDocuments = $recentDocs.Data
    }
    
    return $data
}

function Get-LogsData {
    $data = @{
        LogsAnalysis = @{}
    }
    
    # Security event logs
    $securityLogs = Invoke-SafeCommand "Security Logs" {
        Get-WinEvent -LogName Security -MaxEvents 100 | 
        Select-Object TimeCreated, Id, LevelDisplayName, LogName, Message
    }
    if ($securityLogs.Success) {
        $data.LogsAnalysis.SecurityLogs = $securityLogs.Data
    }
    
    # Application event logs
    $appLogs = Invoke-SafeCommand "Application Logs" {
        Get-WinEvent -LogName Application -MaxEvents 100 | 
        Where-Object { $_.LevelDisplayName -eq "Error" -or $_.LevelDisplayName -eq "Warning" } |
        Select-Object TimeCreated, Id, LevelDisplayName, LogName, Message
    }
    if ($appLogs.Success) {
        $data.LogsAnalysis.ApplicationLogs = $appLogs.Data
    }
    
    # System event logs
    $systemLogs = Invoke-SafeCommand "System Logs" {
        Get-WinEvent -LogName System -MaxEvents 100 | 
        Where-Object { $_.LevelDisplayName -eq "Error" -or $_.LevelDisplayName -eq "Warning" } |
        Select-Object TimeCreated, Id, LevelDisplayName, LogName, Message
    }
    if ($systemLogs.Success) {
        $data.LogsAnalysis.SystemLogs = $systemLogs.Data
    }
    
    return $data
}

function Get-AnalysisData {
    $analysisType = $CONFIG.Analysis.Type
    
    # Always include basic system info
    $data = Get-SystemInfo
    $data += Get-EnvironmentData
    
    # Add analysis-specific data
    switch ($analysisType) {
        "memory" { $data += Get-MemoryData }
        "network" { $data += Get-NetworkData }
        "disk" { $data += Get-DiskData }
        "processes" { $data += Get-ProcessData }
        "registry" { $data += Get-RegistryData }
        "logs" { $data += Get-LogsData }
        "comprehensive" {
            $data += Get-MemoryData
            $data += Get-NetworkData
            $data += Get-DiskData
            $data += Get-ProcessData
            $data += Get-RegistryData
            $data += Get-LogsData
        }
    }
    
    return $data
}

function Send-DataToServer {
    param(
        [hashtable]$Data,
        [string]$BurstId
    )
    
    $url = "$($CONFIG.Server.BaseUrl)/api/stream/live-analysis"
    
    $headers = @{
        "Content-Type" = "application/json"
        "User-Agent" = "AegisForensics-Windows-$($CONFIG.Analysis.Type)/1.0"
    }
    
    # Add API key if configured
    if ($CONFIG.Server.ApiKey) {
        $headers["Authorization"] = "Bearer $($CONFIG.Server.ApiKey)"
    }
    
    # Add custom headers
    if ($CONFIG.CustomHeaders) {
        foreach ($header in $CONFIG.CustomHeaders.GetEnumerator()) {
            $headers[$header.Key] = $header.Value
        }
    }
    
    $payload = @{
        burst_id = $BurstId
        platform = "windows"
        analysis_type = $CONFIG.Analysis.Type
        timestamp = (Get-Date).ToString("o")
        data = $Data
    }
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method Post -Body ($payload | ConvertTo-Json -Depth 10) -Headers $headers -TimeoutSec $CONFIG.Server.Timeout
        
        Write-Log "✅ Burst $BurstId sent successfully"
        return $true
    }
    catch {
        Write-Log "❌ Failed to send data: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Start-LiveAnalysis {
    Write-Log "🚀 Starting Aegis Forensics Live Analysis"
    Write-Log "📊 Analysis Type: $($CONFIG.Analysis.Type.ToUpper())"
    Write-Log "🎯 Target Server: $($CONFIG.Server.BaseUrl)"
    
    if (-not (Test-Dependencies)) {
        Write-Log "❌ Dependency check failed" "ERROR"
        exit 1
    }
    
    $burstCount = if ($CONFIG.Burst.Enabled) { $CONFIG.Burst.BurstCount } else { 1 }
    $interval = if ($CONFIG.Burst.Enabled) { $CONFIG.Burst.IntervalSeconds } else { 0 }
    
    $successfulBursts = 0
    
    for ($i = 1; $i -le $burstCount; $i++) {
        $burstId = "windows-$($CONFIG.Analysis.Type)-$((New-Guid).ToString().Substring(0,8))"
        
        Write-Log "🔍 Collecting data for burst $i/$burstCount (ID: $burstId)"
        
        try {
            # Collect analysis data
            $data = Get-AnalysisData
            
            # Send to server
            if (Send-DataToServer -Data $data -BurstId $burstId) {
                $successfulBursts++
            }
            
            # Wait between bursts (except for the last one)
            if ($i -lt $burstCount -and $interval -gt 0) {
                Write-Log "⏱️  Waiting $interval seconds until next burst..."
                Start-Sleep -Seconds $interval
            }
        }
        catch {
            Write-Log "❌ Error in burst $i : $($_.Exception.Message)" "ERROR"
            continue
        }
    }
    
    Write-Log "🎉 Analysis completed! $successfulBursts/$burstCount bursts sent successfully"
}

# Main execution
try {
    Start-LiveAnalysis
}
catch {
    Write-Log "❌ Fatal error: $($_.Exception.Message)" "ERROR"
    exit 1
}
