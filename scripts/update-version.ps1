# Script to update version.js from the latest Git commit info
$repoPath = Split-Path -Parent -Path $PSScriptRoot

# Get latest commit date and hash
$commitInfo = git -C $repoPath log -1 --format="%ad %h" --date=format:"%Y-%m-%d"

if ($LASTEXITCODE -eq 0 -and $commitInfo) {
    $parts = $commitInfo -split '\s+'
    $date = $parts[0]
    $hash = $parts[1]
    
    # Create version file content
    $versionContent = @"
// Auto-generated version info - updates on each commit
export const VERSION = {
    date: '$date',
    commit: '$hash',
    full: '$commitInfo'
};
"@
    
    # Write to version.js file
    $versionFile = Join-Path $repoPath "js\version.js"
    Set-Content -Path $versionFile -Value $versionContent -Encoding UTF8
    
    Write-Host "[OK] Version updated: $commitInfo"
} else {
    Write-Host "[ERROR] Failed to get Git commit info"
    exit 1
}
