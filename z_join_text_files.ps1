# Nome do arquivo final que será gerado
$OutputFile = "z_codigo_completo.md"

# Apaga o arquivo anterior se ele já existir na pasta
if (Test-Path $OutputFile) { Remove-Item $OutputFile }

# Busca recursivamente todos os arquivos HTML, CSS e JS
$Files = Get-ChildItem -Path . -Include *.html, *.css, *.js, *.py, *.json -Recurse -File

foreach ($File in $Files) {
    # Pega o caminho relativo do arquivo (ex: .\src\index.html)
    $RelativePath = Resolve-Path -Path $File.FullName -Relative

    # Define a tag de linguagem correta para o Markdown
    $Ext = $File.Extension.Trim('.')
    $Lang = if ($Ext -eq 'js') { 'javascript' } else { $Ext }

    # Lê o conteúdo do arquivo original
    $FileContent = Get-Content -Path $File.FullName -Raw

    # Monta a estrutura do Markdown
    $Block = "### Arquivo: $RelativePath`n"
    $Block += "```$Lang`n"
    $Block += "$FileContent`n"
    $Block += "````n`n"

    # Salva no arquivo final usando UTF-8 para não quebrar acentos
    Add-Content -Path $OutputFile -Value $Block -Encoding UTF8
}

Write-Host "Concluído! Arquivo gerado: $OutputFile" -ForegroundColor Green