# Kill processes occupying agent-native dev ports
# Ports: 8082-8085, 8086-8089, 8092-8094, 8099-8100, 8102, 8105

$ports = @(
    8082, 8083, 8084, 8085,
    8086, 8087, 8088, 8089,
    8092, 8093, 8094,
    8099, 8100,
    8102, 8105
)

$killed = @()

foreach ($port in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) {
        $pid = $conn.OwningProcess
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($proc) {
            $name = $proc.ProcessName
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "Killed $name (PID $pid) on port $port" -ForegroundColor Green
            $killed += "$port"
        }
    }
}

if ($killed.Count -eq 0) {
    Write-Host "All ports are free." -ForegroundColor Cyan
} else {
    Write-Host "Cleared $($killed.Count) port(s): $($killed -join ', ')" -ForegroundColor Yellow
}
