# .\stress-webhooks.ps1 -Port 65296 -Total 10 -Parallel 10

param(
    [Parameter(Mandatory = $true)]
    [int]$Port,

    [int]$Total = 100,
    [int]$Parallel = 10
)

$Url = "http://localhost:$Port/webhooks/inventory_levels/update"
$jobs = @()

Write-Host "Sending $Total webhooks with $Parallel concurrent jobs to $Url"

for ($i = 1; $i -le $Total; $i++) {

    # Remove completed jobs from active list
    $jobs = @($jobs | Where-Object { $_.State -eq "Running" })

    while ($jobs.Count -ge $Parallel) {
        Start-Sleep -Milliseconds 200
        $jobs = @($jobs | Where-Object { $_.State -eq "Running" })
    }

    $ProjectPath = $PSScriptRoot

    $job = Start-Job -ArgumentList $Url, $i, $ProjectPath -ScriptBlock {
        param($url, $index, $projectPath)

        Set-Location $projectPath

        $output = & shopify app webhook trigger `
            --topic inventory_levels/update `
            --api-version 2026-10 `
            --address $url 2>&1

        $exitCode = $LASTEXITCODE

        if ($exitCode -ne 0) {
            Write-Output "FAILED webhook $index (exit: $exitCode)"
            Write-Output ($output | Out-String)
        }
        else {
            Write-Output "SUCCESS webhook $index"
        }
    }

    $jobs += $job
}

$jobs | Wait-Job | Receive-Job
$jobs | Remove-Job

Write-Host "All webhook commands completed."