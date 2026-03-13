$phpRoot = 'C:\php-8.2.30-Win32-vs16-x64'
$phpIni = Join-Path $phpRoot 'php.ini'
if (-not (Test-Path $phpIni)) {
    $dev = Join-Path $phpRoot 'php.ini-development'
    $prod = Join-Path $phpRoot 'php.ini-production'
    if (Test-Path $dev) { Copy-Item $dev $phpIni -Force; Write-Output 'Copied php.ini-development -> php.ini' }
    elseif (Test-Path $prod) { Copy-Item $prod $phpIni -Force; Write-Output 'Copied php.ini-production -> php.ini' }
    else { Write-Output 'No php.ini template found' }
}
if (Test-Path $phpIni) {
    (Get-Content $phpIni) -replace '^[\s;]*extension\s*=\s*(php_mbstring\.dll|mbstring)','extension=$1' | Set-Content $phpIni
    Write-Output 'Patched php.ini to enable mbstring (if present)'
} else {
    Write-Output 'php.ini not found to patch'
}
Write-Output 'Done.'
