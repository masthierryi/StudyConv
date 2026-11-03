# Focus Dashboard

Site pessoal de foco e organização, feito com HTML, CSS e JavaScript puro, sem bibliotecas nem servidor. Tudo fica salvo no navegador (localStorage).

## O que tem

- **Barra superior:** data e hora do aparelho ao vivo, menu Pomodoro / Timer, seletor de paleta e configurações.
- **Pomodoro:** ciclo foco/descanso com tempos prontos (25:5 e 50:10) ou personalizados, e uma nota ao lado para descrever a tarefa.
- **Timer:** fila de tasks com nome, tempo e cor. Dá para editar, reordenar arrastando, separar com divisórias e organizar em várias listas (abas).
- **Barra lateral esquerda:**
  - **Notas:** vários blocos que expandem e contraem (mostrando só a primeira linha), com negrito, itálico, listas e indentação em Markdown.
  - **Listas:** tarefas com checkbox organizadas em pastas e subpastas.
- **Barra lateral direita:** bloco de notas rápido.
- **Temas:** paletas prontas (Gruvbox, Dracula, Nord, Solarized, Monokai).
- **Configurações:** baixar backup (.json com tudo), importar backup e apagar todos os dados.

## Como usar

Acesse https://masthierryi.github.io/StudyConv/

## Estrutura

```
index.html
style.css
js/
  utils.js      funções de apoio (storage, som, escape de HTML)
  views.js      troca de páginas e relógio
  pomodoro.js   pomodoro
  timer.js      fila de tasks, abas, edição, arrastar, divisórias
  sidebar.js    barras laterais
  notes.js      blocos de notas
  lists.js      listas com pastas
  settings.js   configurações e backup
  themes.js     paletas de cores
```

Cada arquivo em `js/` funciona sozinho, então um erro em um deles não derruba os outros.

## Dados

Nada sai do seu navegador. Limpar os dados do site apaga tudo, por isso vale baixar um backup de vez em quando em **Configurações > Dados**.