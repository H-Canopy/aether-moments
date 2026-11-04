param([Parameter(Mandatory=$true)][string]$ProjectRoot)
$ErrorActionPreference = 'Stop'
$skillSource = Split-Path -Parent $PSScriptRoot
$projectPath = (Resolve-Path -LiteralPath $ProjectRoot).Path
$skillDestination = Join-Path $projectPath '.codeartsdoer/skills/aether-moments'
if (Test-Path -LiteralPath $skillDestination) { throw 'Target skill already exists; refusing to overwrite.' }
New-Item -ItemType Directory -Path $skillDestination -Force | Out-Null
foreach ($entry in @('SKILL.md','package.json','src','docs','tests')) {
    Copy-Item -LiteralPath (Join-Path $skillSource $entry) -Destination $skillDestination -Recurse
}
Write-Output "Skill files installed: $skillDestination"
Write-Output 'File placement only. CodeArts loading and execution still require verification inside the IDE.'
