param(
    [switch]$NoOpen,
    [switch]$CheckOnly
)

$ErrorActionPreference = 'Stop'
$appDirectory = Split-Path -Parent $PSScriptRoot
$appUrl = 'http://127.0.0.1:5173/50K142.03.3007/'

try {
    Set-Location -LiteralPath $appDirectory
    if (!(Get-Command node.exe -ErrorAction SilentlyContinue) -or !(Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
        throw 'Can Node.js 24.x va npm 11.x. Cai dat roi mo lai file nay.'
    }
    $nodeVersion = & node.exe --version
    $npmVersion = & npm.cmd --version
    if ($LASTEXITCODE -ne 0 -or $nodeVersion -notmatch '^v24\.' -or $npmVersion -notmatch '^11\.') {
        throw "Phien ban chua phu hop: Node $nodeVersion, npm $npmVersion. Can Node 24.x / npm 11.x."
    }
    Write-Host "CoCo: $appDirectory"
    Write-Host "URL:  $appUrl"
    if ($CheckOnly) {
        if (!(Test-Path -LiteralPath 'node_modules/.bin/vite.cmd')) { throw 'Chua cai dependencies. Chay npm.cmd ci trong thu muc CoCo.' }
        Write-Host 'Kiem tra cau hinh local: PASS. Khong khoi dong server, khong mo trinh duyet.'
        exit 0
    }

    # Reuse this origin; do not kill a server or silently choose another port.
    $portInUse = $false
    $probe = New-Object System.Net.Sockets.TcpClient
    try {
        $probe.Connect('127.0.0.1', 5173)
        $portInUse = $true
    } catch { } finally { $probe.Dispose() }
    if ($portInUse) {
        $existingApp = $null
        try { $existingApp = Invoke-WebRequest -Uri $appUrl -UseBasicParsing -TimeoutSec 5 } catch { }
        if (!$existingApp -or $existingApp.Content -notmatch '<title>CoCo' -or $existingApp.Content -notmatch '/src/main\.tsx') {
            throw 'Cong 5173 dang duoc ung dung khac su dung. Hay kiem tra va dong ung dung do; CoCo khong tu doi cong.'
        }
        Write-Host 'CoCo da chay tren cong 5173; su dung server hien tai.'
        if (!$NoOpen) { Start-Process $appUrl }
        exit 0
    }

    if (!(Test-Path -LiteralPath 'node_modules/.bin/vite.cmd')) {
        Write-Host 'Dang cai dependencies theo package-lock.json...'
        & npm.cmd ci
        if ($LASTEXITCODE -ne 0) { throw 'Cai dependencies that bai. Kiem tra ket noi mang va thong bao npm.' }
    }
    Write-Host 'Giu cua so nay khi su dung. Nhan Ctrl+C de dung server. Khong xoa du lieu trinh duyet.'
    $viteArguments = @('run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173', '--strictPort')
    if (!$NoOpen) { $viteArguments += @('--open', '/50K142.03.3007/') }
    & npm.cmd @viteArguments
    exit $LASTEXITCODE
} catch {
    Write-Host "Khong the chay CoCo: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
