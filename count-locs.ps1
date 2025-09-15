$sourceFiles = @()
$totalLines = 0
$fileStats = @{}

# Get all source files (excluding tests and config files)
$extensions = @("*.ts", "*.tsx", "*.js", "*.jsx")
$excludePatterns = @("*.test.*", "*.spec.*", "jest.config.*", "vitest.config.*", "*.setup.*", "eslint.config.*", "tailwind.config.*", "postcss.config.*", "vite.config.*")

Write-Host "`n=== Effect-Redux Project Structure and LOC Analysis ===" -ForegroundColor Cyan
Write-Host "Excluding: test files, configuration files, and generated files`n" -ForegroundColor Yellow

# Function to count lines in a file
function Count-Lines {
    param($FilePath)
    try {
        $lines = (Get-Content $FilePath -ErrorAction SilentlyContinue | Measure-Object -Line).Lines
        return $lines
    } catch {
        return 0
    }
}

# Packages to analyze
$packages = @(
    @{Name="db"; Path="packages\db\src"},
    @{Name="dialogs"; Path="packages\dialogs\src"},
    @{Name="frontend"; Path="packages\frontend\src"},
    @{Name="isomorphic"; Path="packages\isomorphic\src"},
    @{Name="server"; Path="packages\server\src"},
    @{Name="steam-api"; Path="packages\steam-api\src"}
)

$grandTotal = 0

foreach ($package in $packages) {
    $packagePath = Join-Path $PWD $package.Path
    $packageTotal = 0
    $packageFiles = @()
    
    Write-Host "`n📦 Package: $($package.Name)" -ForegroundColor Green
    Write-Host "   Path: $($package.Path)" -ForegroundColor Gray
    Write-Host "   " + ("-" * 50) -ForegroundColor DarkGray
    
    if (Test-Path $packagePath) {
        # Get all files in the package
        foreach ($ext in $extensions) {
            $files = Get-ChildItem -Path $packagePath -Filter $ext -Recurse -File -ErrorAction SilentlyContinue
            
            foreach ($file in $files) {
                $isExcluded = $false
                
                # Check if file should be excluded
                foreach ($pattern in $excludePatterns) {
                    if ($file.Name -like $pattern) {
                        $isExcluded = $true
                        break
                    }
                }
                
                # Also exclude test directories
                if ($file.FullName -match "\\test\\" -or $file.FullName -match "\\tests\\") {
                    $isExcluded = $true
                }
                
                if (-not $isExcluded) {
                    $lines = Count-Lines -FilePath $file.FullName
                    if ($lines -gt 0) {
                        $relativePath = $file.FullName.Replace("$packagePath\", "").Replace("\", "/")
                        $packageFiles += @{Path=$relativePath; Lines=$lines}
                        $packageTotal += $lines
                    }
                }
            }
        }
        
        # Sort files by path and display
        $packageFiles | Sort-Object -Property @{Expression={$_.Path}} | ForEach-Object {
            Write-Host ("   {0,-50} {1,6} lines" -f $_.Path, $_.Lines)
        }
        
        Write-Host "   " + ("-" * 50) -ForegroundColor DarkGray
        Write-Host ("   Package Total: {0,6} lines" -f $packageTotal) -ForegroundColor Yellow
    } else {
        Write-Host "   [Directory not found]" -ForegroundColor Red
    }
    
    $grandTotal += $packageTotal
}

# Root level source files (if any)
Write-Host "`n📦 Root Level Files" -ForegroundColor Green
Write-Host "   " + ("-" * 50) -ForegroundColor DarkGray

$rootTotal = 0
$rootFiles = @("interactive-prompt.ts", "prompt-example.ts")

foreach ($fileName in $rootFiles) {
    $filePath = Join-Path $PWD $fileName
    if (Test-Path $filePath) {
        $lines = Count-Lines -FilePath $filePath
        if ($lines -gt 0) {
            Write-Host ("   {0,-50} {1,6} lines" -f $fileName, $lines)
            $rootTotal += $lines
        }
    }
}

# Scripts folder
$scriptsPath = Join-Path $PWD "scripts"
if (Test-Path $scriptsPath) {
    $scriptFiles = Get-ChildItem -Path $scriptsPath -Filter "*.ts" -File -ErrorAction SilentlyContinue
    foreach ($file in $scriptFiles) {
        $lines = Count-Lines -FilePath $file.FullName
        if ($lines -gt 0) {
            Write-Host ("   scripts/{0,-43} {1,6} lines" -f $file.Name, $lines)
            $rootTotal += $lines
        }
    }
}

Write-Host "   " + ("-" * 50) -ForegroundColor DarkGray
Write-Host ("   Root Total: {0,6} lines" -f $rootTotal) -ForegroundColor Yellow

$grandTotal += $rootTotal

# Summary
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

Write-Host "`nProject Type: TypeScript/JavaScript Monorepo (Effect-Redux)" -ForegroundColor White
Write-Host "Package Manager: Yarn Berry (v4.9.2)" -ForegroundColor White
Write-Host "Build System: TypeScript Compiler (tsc)" -ForegroundColor White
Write-Host "Test Runner: Vitest" -ForegroundColor White

Write-Host "`nPackage Structure:" -ForegroundColor White
Write-Host "  - db: Database layer with MongoDB integration" -ForegroundColor Gray
Write-Host "  - dialogs: Dialog management services" -ForegroundColor Gray
Write-Host "  - frontend: React/TypeScript frontend application" -ForegroundColor Gray
Write-Host "  - isomorphic: Shared code between client and server" -ForegroundColor Gray
Write-Host "  - server: Backend server application" -ForegroundColor Gray
Write-Host "  - steam-api: Steam API integration" -ForegroundColor Gray

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host ("TOTAL SOURCE CODE LINES (excluding tests): {0,10} lines" -f $grandTotal) -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Cyan
