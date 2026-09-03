[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateNotNullOrEmpty()]
    [string]$InputPdf,

    [Parameter(Mandatory = $true, Position = 1)]
    [ValidateNotNullOrEmpty()]
    [string]$OutputDirectory,

    [string]$PdftoppmPath,

    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Resolve-PdftoppmExecutable {
    param([string]$RequestedPath)

    if ($RequestedPath) {
        $item = Get-Item -LiteralPath $RequestedPath -ErrorAction Stop
        if ($item.PSIsContainer) {
            throw "-PdftoppmPath must point to pdftoppm.exe, not a directory: $RequestedPath"
        }
        return $item.FullName
    }

    foreach ($name in @('pdftoppm.exe', 'pdftoppm')) {
        $command = Get-Command $name -ErrorAction SilentlyContinue
        if ($command) {
            return $command.Source
        }
    }

    $profile = [Environment]::GetFolderPath('UserProfile')
    $bundled = Join-Path $profile '.cache\codex-runtimes\codex-primary-runtime\dependencies\native\poppler\Library\bin\pdftoppm.exe'
    if (Test-Path -LiteralPath $bundled) {
        return $bundled
    }

    throw 'pdftoppm was not found. Install Poppler or pass its executable with -PdftoppmPath.'
}

$pdfItem = Get-Item -LiteralPath $InputPdf -ErrorAction Stop
if ($pdfItem.PSIsContainer) {
    throw "InputPdf must be a PDF file: $InputPdf"
}

$outputFullPath = [System.IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Path $outputFullPath -Force | Out-Null
$existing = @(Get-ChildItem -LiteralPath $outputFullPath -File -Filter 'slide-*.jpg')
if ($existing.Count -gt 0 -and -not $Force) {
    throw "Slide images already exist. Use a new directory or add -Force: $outputFullPath"
}
if ($Force) {
    foreach ($file in $existing) {
        Remove-Item -LiteralPath $file.FullName -Force
    }
}

$pdftoppm = Resolve-PdftoppmExecutable -RequestedPath $PdftoppmPath
$prefix = Join-Path $outputFullPath 'slide'
& $pdftoppm -jpeg -scale-to-x 1440 -scale-to-y 1080 -jpegopt 'quality=92,progressive=y' $pdfItem.FullName $prefix
if ($LASTEXITCODE -ne 0) {
    throw "pdftoppm failed with exit code $LASTEXITCODE."
}

$slides = @(
    Get-ChildItem -LiteralPath $outputFullPath -File -Filter 'slide-*.jpg' |
        Sort-Object { [int]([regex]::Match($_.BaseName, '(\d+)$').Groups[1].Value) }
)
if ($slides.Count -eq 0) {
    throw 'No slide images were produced.'
}

# Normalize names to slide-01.jpg, slide-02.jpg, ... without collision.
for ($index = 0; $index -lt $slides.Count; $index++) {
    $temporaryName = ".fluid-render-$([guid]::NewGuid().ToString('N')).jpg"
    Rename-Item -LiteralPath $slides[$index].FullName -NewName $temporaryName
    $slides[$index] = Get-Item -LiteralPath (Join-Path $outputFullPath $temporaryName)
}
for ($index = 0; $index -lt $slides.Count; $index++) {
    $finalName = 'slide-{0:D2}.jpg' -f ($index + 1)
    Rename-Item -LiteralPath $slides[$index].FullName -NewName $finalName
}

Add-Type -AssemblyName System.Drawing
$wrongDimensions = @()
foreach ($slide in Get-ChildItem -LiteralPath $outputFullPath -File -Filter 'slide-*.jpg') {
    $image = [System.Drawing.Image]::FromFile($slide.FullName)
    try {
        if ($image.Width -ne 1440 -or $image.Height -ne 1080) {
            $wrongDimensions += "$($slide.Name)=$($image.Width)x$($image.Height)"
        }
    } finally {
        $image.Dispose()
    }
}
if ($wrongDimensions.Count -gt 0) {
    throw "Unexpected slide dimensions: $($wrongDimensions -join ', ')"
}

[pscustomobject]@{
    Input = $pdfItem.FullName
    OutputDirectory = $outputFullPath
    Slides = $slides.Count
    Dimensions = '1440x1080'
}
