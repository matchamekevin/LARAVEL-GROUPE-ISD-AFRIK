$phpRoot = 'C:\php-8.2.30-Win32-vs16-x64'
$phpIni = Join-Path $phpRoot 'php.ini'
if (Test-Path $phpIni) {
    $dir = "$phpRoot\\ext"
    (Get-Content $phpIni) -replace '^[\s;]*extension_dir\s*=.*','$("extension_dir = \"" + $dir + "\"")' | Set-Content $phpIni
    Write-Output "Set extension_dir to $dir in php.ini"
} else {
    Write-Output "php.ini not found: $phpIni"
}
