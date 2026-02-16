# Version Management System

This project uses a simple manual version management system. Version information is stored in a text file and can be updated manually.

## How It Works

1. **`docs/version.txt`** - Plain text file containing the application version in format: `YYYY-MM-DD hash`
2. **`js/version.js`** - Generated JavaScript file containing VERSION export (auto-generated from version.txt)
3. **`scripts/update-version.ps1`** - PowerShell script that reads from version.txt and generates js/version.js

## Workflow

### Updating the Version

1. Edit `docs/version.txt` with your desired version:
   ```
   2026-02-16 2954545
   ```

2. Run the update script:
   ```powershell
   pwsh scripts/update-version.ps1
   ```

3. This generates/updates `js/version.js` with the new version info

4. Commit both files:
   ```bash
   git add docs/version.txt js/version.js
   git commit -m "chore: bump version to <version>"
   ```

### Accessing Version Info in Code

In any JavaScript module:

```javascript
import { VERSION } from './version.js';

console.log(VERSION.date);     // e.g., '2026-02-16'
console.log(VERSION.commit);   // e.g., '2954545'
console.log(VERSION.full);     // e.g., '2026-02-16 2954545'
```

## Version Format

The version string in `docs/version.txt` uses the format:

```
YYYY-MM-DD <identifier>
```

### Examples

- `2026-02-16 2954545` - Date with short commit hash
- `2026-02-16 1.0.0` - Date with semantic version
- `2026-02-16 beta` - Date with version label

## File Structure

```
project/
├── docs/
│   └── version.txt          # Source of truth for version
├── js/
│   └── version.js           # Generated from docs/version.txt
├── scripts/
│   └── update-version.ps1   # Script to generate js/version.js
```

## Manual Update Procedure

When you want to bump the version:

1. Decide on new version identifier
2. Edit `docs/version.txt`:
   ```
   2026-02-16 abc1234
   ```
3. Run: `pwsh scripts/update-version.ps1`
4. Check that `js/version.js` was updated correctly
5. Commit both files

## Important Notes

- **`docs/version.txt`** is the source of truth - always update this first
- **`js/version.js`** is auto-generated - do not edit manually
- Both files should be committed to version control
- No Git automation - version updates are entirely manual and explicit

