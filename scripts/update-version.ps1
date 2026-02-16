# Script to update version.js from docs/version.txt file
# This allows manual version management without Git automation

$repoPath = Split-Path -Parent -Path $PSScriptRoot
$versionFile = Join-Path $repoPath "docs\version.txt"
$jsVersionFile = Join-Path $repoPath "js\version.js"

# Read version from text file
if (Test-Path $versionFile) {
    $versionString = (Get-Content -Path $versionFile -Raw).Trim()
    
    if ($versionString) {
        # Parse version string (format: "YYYY-MM-DD hash")
        $parts = $versionString -split '\s+'
        if ($parts.Count -ge 2) {
            $date = $parts[0]
            $commit = $parts[1]
            
            # Create version.js content
            $jsContent = @"
// Version info - updated manually from docs/version.txt
export const VERSION = {
    date: '$date',
    commit: '$commit',
    full: '$versionString'
};
"@
            
            Set-Content -Path $jsVersionFile -Value $jsContent -Encoding UTF8
            Write-Host "[OK] Version updated from docs/version.txt"
            Write-Host "     Version: $versionString"
        } else {
            Write-Host "[ERROR] Invalid version format in docs/version.txt"
            Write-Host "        Expected format: YYYY-MM-DD hash"
            exit 1
        }
    } else {
        Write-Host "[ERROR] docs/version.txt is empty"
        exit 1
    }
} else {
    Write-Host "[ERROR] docs/version.txt not found at $versionFile"
    exit 1
}
