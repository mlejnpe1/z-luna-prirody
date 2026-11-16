$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$publicPath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\public'))
$originalLogo = [Drawing.Image]::FromFile((Join-Path $publicPath 'assets\logo.jpg'))
function Export-IconPng([int]$size) {
  $bitmap = [Drawing.Bitmap]::new($size, $size)
  $graphics = [Drawing.Graphics]::FromImage($bitmap)
  $stream = [IO.MemoryStream]::new()
  try {
    $graphics.Clear([Drawing.Color]::White)
    $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage($originalLogo, [Drawing.Rectangle]::new(0, 0, $size, $size))
    $bitmap.Save($stream, [Drawing.Imaging.ImageFormat]::Png)
    return ,$stream.ToArray()
  } finally { $graphics.Dispose(); $bitmap.Dispose(); $stream.Dispose() }
}
try {
  [IO.File]::WriteAllBytes((Join-Path $publicPath 'favicon-96.png'), (Export-IconPng 96))
  [IO.File]::WriteAllBytes((Join-Path $publicPath 'apple-touch-icon.png'), (Export-IconPng 180))
  $sizes = @(16,32,48)
  $images = @($sizes | ForEach-Object { ,(Export-IconPng $_) })
  $icon = [IO.File]::Create((Join-Path $publicPath 'favicon.ico'))
  $writer = [IO.BinaryWriter]::new($icon)
  try {
    $writer.Write([UInt16]0); $writer.Write([UInt16]1); $writer.Write([UInt16]$sizes.Count)
    $offset = 6 + 16 * $sizes.Count
    for ($index = 0; $index -lt $sizes.Count; $index++) {
      $writer.Write([byte]$sizes[$index]); $writer.Write([byte]$sizes[$index]); $writer.Write([byte]0); $writer.Write([byte]0)
      $writer.Write([UInt16]1); $writer.Write([UInt16]32); $writer.Write([UInt32]$images[$index].Length); $writer.Write([UInt32]$offset)
      $offset += $images[$index].Length
    }
    foreach ($image in $images) { $writer.Write([byte[]]$image) }
  } finally { $writer.Dispose(); $icon.Dispose() }
} finally { $originalLogo.Dispose() }
Write-Output 'Exportováno: favicon.ico (16/32/48), favicon-96.png a apple-touch-icon.png (180).'
