# Serves the content folder at http://localhost:8765/ for testing the lesson runtime in a browser.
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File tools/serve.ps1 [-Port 8765]
param([int]$Port = 8765)

$root = (Resolve-Path (Join-Path $PSScriptRoot "..\content")).Path
$mime = @{
  ".html" = "text/html; charset=utf-8"; ".js" = "text/javascript; charset=utf-8"; ".css" = "text/css; charset=utf-8"
  ".json" = "application/json; charset=utf-8"; ".svg" = "image/svg+xml"; ".png" = "image/png"; ".woff2" = "font/woff2"
  ".md" = "text/markdown; charset=utf-8"
}
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Lernwerk-Inhalte unter http://localhost:$Port/runtime/dev.html (Strg+C beendet)"
try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $res = $ctx.Response
    try {
      $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
      if ($path -eq "") {
        $res.StatusCode = 302
        $res.RedirectLocation = "/runtime/dev.html"
        continue
      }
      $full = [System.IO.Path]::GetFullPath((Join-Path $root $path))
      $res.Headers.Add("Cache-Control", "no-store")
      $body = $null
      if ($full.StartsWith($root) -and (Test-Path -LiteralPath $full -PathType Leaf)) {
        $body = [System.IO.File]::ReadAllBytes($full)
        $ext = [System.IO.Path]::GetExtension($full).ToLower()
        $res.ContentType = $(if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" })
      } else {
        $res.StatusCode = 404
        $res.ContentType = "text/plain; charset=utf-8"
        $body = [System.Text.Encoding]::UTF8.GetBytes("nicht gefunden: $path")
      }
      $res.ContentLength64 = $body.Length
      if ($ctx.Request.HttpMethod -ne "HEAD") { $res.OutputStream.Write($body, 0, $body.Length) }
    } catch {
      Write-Host "Fehler bei $($ctx.Request.Url): $($_.Exception.Message)"
    } finally {
      try { $res.Close() } catch {}
    }
  }
} finally {
  $listener.Stop()
}
