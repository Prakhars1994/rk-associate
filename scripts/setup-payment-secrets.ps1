# Stores the secrets online course payments need on the rk-associate Worker.
# Run from anywhere:  powershell -ExecutionPolicy Bypass -File <this file>
# Values are typed hidden, sent straight to Cloudflare, and never written to disk.
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$secrets = [ordered]@{
  "RAZORPAY_KEY_ID"           = "Razorpay Key ID (dashboard > Account & Settings > API Keys; starts with rzp_test_ or rzp_live_)"
  "RAZORPAY_KEY_SECRET"       = "Razorpay Key Secret (same page as the Key ID)"
  "SUPABASE_SERVICE_ROLE_KEY" = "Supabase service_role key (supabase.com > project rk-associates > Project Settings > API)"
}

foreach ($name in $secrets.Keys) {
  Write-Host ""
  Write-Host $secrets[$name] -ForegroundColor Cyan
  $secure = Read-Host "Paste $name (hidden) and press Enter" -AsSecureString
  $plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
  if ([string]::IsNullOrWhiteSpace($plain)) { Write-Host "Skipped $name (empty)." -ForegroundColor Yellow; continue }
  $plain.Trim() | npx wrangler secret put $name
  $plain = $null
}

Write-Host ""
Write-Host "Done. Tell Claude 'keys done' to switch payments on and run a test payment." -ForegroundColor Green
