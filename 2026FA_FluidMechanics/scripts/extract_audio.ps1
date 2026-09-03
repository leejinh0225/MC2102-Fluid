[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateNotNullOrEmpty()]
    [string]$InputVideo,

    [Parameter(Position = 1)]
    [string]$OutputAudio,

    [ValidateSet('Transcription', 'Archive')]
    [string]$Mode = 'Transcription',

    [string]$FfmpegPath,

    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Resolve-FfmpegExecutable {
    param([string]$RequestedPath)

    if ($RequestedPath) {
        $item = Get-Item -LiteralPath $RequestedPath -ErrorAction Stop
        if ($item.PSIsContainer) {
            throw "-FfmpegPath must point to ffmpeg.exe, not a directory: $RequestedPath"
        }
        return $item.FullName
    }

    foreach ($name in @('ffmpeg.exe', 'ffmpeg')) {
        $command = Get-Command $name -ErrorAction SilentlyContinue
        if ($command) {
            return $command.Source
        }
    }

    throw 'FFmpeg was not found. Install FFmpeg or pass the full ffmpeg.exe path with -FfmpegPath.'
}

$inputItem = Get-Item -LiteralPath $InputVideo -ErrorAction Stop
if ($inputItem.PSIsContainer) {
    throw "InputVideo must be a video file, not a directory: $InputVideo"
}

$inputFullPath = $inputItem.FullName
if (-not $OutputAudio) {
    $suffix = if ($Mode -eq 'Transcription') { '.transcription.wav' } else { '.archive.m4a' }
    $OutputAudio = Join-Path $inputItem.DirectoryName ($inputItem.BaseName + $suffix)
}

$outputFullPath = [System.IO.Path]::GetFullPath($OutputAudio)
if ($inputFullPath -eq $outputFullPath) {
    throw 'OutputAudio must be different from InputVideo.'
}

$expectedExtension = if ($Mode -eq 'Transcription') { '.wav' } else { '.m4a' }
if ([System.IO.Path]::GetExtension($outputFullPath) -ine $expectedExtension) {
    throw "$Mode mode requires a $expectedExtension output file: $outputFullPath"
}

if ((Test-Path -LiteralPath $outputFullPath) -and -not $Force) {
    throw "Output already exists. Choose another path or add -Force: $outputFullPath"
}

$outputDirectory = Split-Path -Parent $outputFullPath
if (-not (Test-Path -LiteralPath $outputDirectory)) {
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
}

$ffmpeg = Resolve-FfmpegExecutable -RequestedPath $FfmpegPath
$overwriteFlag = if ($Force) { '-y' } else { '-n' }
$arguments = @(
    '-nostdin',
    '-hide_banner',
    '-loglevel', 'warning',
    $overwriteFlag,
    '-i', $inputFullPath,
    '-map', '0:a:0',
    '-vn'
)

if ($Mode -eq 'Transcription') {
    $arguments += @('-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', $outputFullPath)
} else {
    $arguments += @('-ac', '1', '-c:a', 'aac', '-b:a', '96k', $outputFullPath)
}

& $ffmpeg @arguments
if ($LASTEXITCODE -ne 0) {
    throw "FFmpeg failed with exit code $LASTEXITCODE."
}

$outputItem = Get-Item -LiteralPath $outputFullPath -ErrorAction Stop
if ($outputItem.Length -le 0) {
    throw "FFmpeg created an empty output file: $outputFullPath"
}

[pscustomobject]@{
    Mode = $Mode
    Input = $inputFullPath
    Output = $outputItem.FullName
    Bytes = $outputItem.Length
    Format = if ($Mode -eq 'Transcription') { 'mono 16 kHz PCM WAV' } else { 'mono AAC 96 kbps' }
}
