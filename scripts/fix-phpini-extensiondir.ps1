$phpIni = 'C:\php-8.2.30-Win32-vs16-x64\php.ini'
if (Test-Path $phpIni) {
    $new = (Get-Content $phpIni) -replace '\$\(.*extension_dir.*\)', 'extension_dir = "C:\\php-8.2.30-Win32-vs16-x64\\ext"'
    $new = $new -replace '^;?extension_dir\s*=.*', 'extension_dir = "C:\\php-8.2.30-Win32-vs16-x64\\ext"'
    Set-Content -Path $phpIni -Value $new
    Write-Output "Fixed extension_dir in $phpIni"
} else {
    Write-Output "php.ini not found: $phpIni"
}
