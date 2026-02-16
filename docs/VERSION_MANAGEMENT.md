# Version Management System

This project uses an automated version management system that automatically updates the application version based on the latest Git commit.

## How It Works

1. **`js/version.js`** - Contains the current application version (date and commit hash)
2. **`scripts/update-version.ps1`** - PowerShell script that updates version.js with the latest commit info
3. **`scripts/setup-hooks.ps1`** - Setup script to install the Git pre-commit hook
4. **`.git/hooks/pre-commit`** - Git hook that automatically runs the update script before each commit

## Setup Instructions

### Initial Setup (One Time)

After cloning the repository, run the setup script to install Git hooks:

```powershell
pwsh scripts/setup-hooks.ps1
```

Or manually for Windows:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/setup-hooks.ps1
```

### How It Works After Setup

Every time you make a commit:

1. Git triggers the pre-commit hook
2. The hook runs `scripts/update-version.ps1`
3. The script gets the latest commit date and hash
4. `js/version.js` is updated automatically
5. The updated file is staged for commit
6. Your commit includes the updated version information

### Accessing Version Info

In any JavaScript module:

```javascript
import { VERSION } from './version.js';

console.log(VERSION.date);     // e.g., '2026-02-16'
console.log(VERSION.commit);   // e.g., 'abc123ef'
console.log(VERSION.full);     // e.g., '2026-02-16 abc123ef'
```

### Manual Version Update

If you need to manually update the version without committing:

```powershell
pwsh scripts/update-version.ps1
```

## Version Format

The version string follows this format: `YYYY-MM-DD <short-commit-hash>`

Example: `2026-02-16 fb956f7`

## Troubleshooting

### Git Hook Not Running

1. Verify the hook is installed:
   ```powershell
   Test-Path .git\hooks\pre-commit
   ```

2. Reinstall the hook:
   ```powershell
   pwsh scripts/setup-hooks.ps1
   ```

### PowerShell Execution Policy Error

If you get an execution policy error, run:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Or use the `-ExecutionPolicy Bypass` flag when running scripts.

## Notes

- The version file is automatically included in each commit
- Do not manually edit `js/version.js` - it will be overwritten on the next commit
- The system requires PowerShell and Git to be installed
