param([Parameter(Mandatory=$true)][string]$Source,
      [Parameter(Mandatory=$true)][string]$Output,
      [int]$Page=0, [int]$Width=0, [string]$WorkspaceRoot='')
$ErrorActionPreference='Stop'
# Native Windows PDF renderer; no dependency install or runtime application change.
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null=[Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]
$null=[Windows.Data.Pdf.PdfDocument,Windows.Data.Pdf,ContentType=WindowsRuntime]
$null=[Windows.Storage.Streams.InMemoryRandomAccessStream,Windows.Storage.Streams,ContentType=WindowsRuntime]
$null=[Windows.Storage.Streams.DataReader,Windows.Storage.Streams,ContentType=WindowsRuntime]
$null=[Windows.Data.Pdf.PdfPageRenderOptions,Windows.Data.Pdf,ContentType=WindowsRuntime]
$taskMethods=[System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object Name -eq AsTask
function AwaitOperation($operation,[type]$resultType) {
  $method=$taskMethods | Where-Object { $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1
  $task=$method.MakeGenericMethod($resultType).Invoke($null,@($operation))
  $task.GetAwaiter().GetResult()
}
function AwaitAction($operation) {
  $method=$taskMethods | Where-Object { !$_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncAction' } | Select-Object -First 1
  $task=$method.Invoke($null,@($operation)); $null=$task.GetAwaiter().GetResult()
}
$sourcePath=(Resolve-Path -LiteralPath $Source).Path
$outputPath=[System.IO.Path]::GetFullPath($Output)
$workspace=if($WorkspaceRoot){[System.IO.Path]::GetFullPath($WorkspaceRoot)}else{[System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))}
if(!$sourcePath.StartsWith((Join-Path $workspace 'CODEX\'),[StringComparison]::OrdinalIgnoreCase)){throw 'Reference must be inside CODEX'}
if(!$outputPath.StartsWith((Join-Path $workspace 'CoCo\planning\phase10\evidence\'),[StringComparison]::OrdinalIgnoreCase)){throw 'Output must stay in phase10 evidence'}
$file=AwaitOperation ([Windows.Storage.StorageFile]::GetFileFromPathAsync($sourcePath)) ([Windows.Storage.StorageFile])
$document=AwaitOperation ([Windows.Data.Pdf.PdfDocument]::LoadFromFileAsync($file)) ([Windows.Data.Pdf.PdfDocument])
if($Page -lt 0 -or $Page -ge $document.PageCount){throw 'Invalid PDF page'}
$pdfPage=$document.GetPage($Page)
$stream=New-Object Windows.Storage.Streams.InMemoryRandomAccessStream
$options=New-Object Windows.Data.Pdf.PdfPageRenderOptions
$targetWidth=if($Width -gt 0){$Width}else{[int][Math]::Round($pdfPage.Size.Width)}
$options.DestinationWidth=[uint32]$targetWidth
$options.DestinationHeight=[uint32][Math]::Round($pdfPage.Size.Height*$targetWidth/$pdfPage.Size.Width)
AwaitAction ($pdfPage.RenderToStreamAsync($stream,$options))
$reader=New-Object Windows.Storage.Streams.DataReader($stream.GetInputStreamAt(0))
$null=AwaitOperation ($reader.LoadAsync([uint32]$stream.Size)) ([uint32])
$bytes=New-Object byte[] ([int]$stream.Size); $reader.ReadBytes($bytes)
$null=New-Item -ItemType Directory -Force -Path ([System.IO.Path]::GetDirectoryName($outputPath))
[System.IO.File]::WriteAllBytes($outputPath,$bytes)
[pscustomobject]@{renderer='Windows.Data.Pdf'; page=$Page; pageCount=$document.PageCount;
  nativeWidth=$pdfPage.Size.Width; nativeHeight=$pdfPage.Size.Height;
  renderedWidth=$options.DestinationWidth; renderedHeight=$options.DestinationHeight;
  sourceSha256=(Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash.ToLowerInvariant();
  outputSha256=(Get-FileHash -LiteralPath $outputPath -Algorithm SHA256).Hash.ToLowerInvariant()} | ConvertTo-Json
$reader.Dispose(); $stream.Dispose(); $pdfPage.Dispose()
