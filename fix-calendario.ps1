$content = Get-Content -Path "F:\01 - PROGRAMAÇÃO\01 - Testes do Estudo\KMDL-Med\src\views\app\calendario.ejs" -Raw -Encoding UTF8

$oldStr = '<strong><%= totalHorasMes %> h</strong>'
$newStr = '<% const horasMes = totalHorasMes || 0; const horasMesInt = Math.floor(horasMes); const minutosMes = Math.round((horasMes - horasMesInt) * 60); %><strong><%= horasMesInt %>h <%= minutosMes %>min</strong>'

$content = $content -replace [regex]::Escape($oldStr), $newStr

Set-Content -Path "F:\01 - PROGRAMAÇÃO\01 - Testes do Estudo\KMDL-Med\src\views\app\calendario.ejs" -Value $content -Encoding UTF8

Write-Host "Done!"
