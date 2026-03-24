# PADRAO.md — PianoLab
Padrões e anti-padrões descobertos durante o desenvolvimento.

## Padrões estabelecidos

### P01 — Arquivo HTML por módulo
Cada módulo é um único arquivo `.html` contendo todas as telas/exercícios daquele módulo.
Novo exercício = nova `<div class="screen">` no mesmo arquivo, não novo arquivo.

### P02 — Granularidade de escrita
Arquivos com mais de 300 linhas são escritos em partes do contexto principal (nunca delegados a agente).
Ordem: HTML → CSS → JS dados → JS lógica → JS feedback → QA mental → commit.

### P03 — AudioContext lazy
AudioContext criado apenas após o primeiro gesto do usuário (clique/toque).
Evita bloqueio de autoplay em mobile.

### P04 — Cores das notas (associação permanente)
Dó=#E53935, Ré=#FB8C00, Mi=#F9A825, Fá=#43A047, Sol=#1E88E5, Lá=#8E24AA, Si=#E91E63, Sustenidos=#37474F.
Nunca usar essas cores para outros fins — a associação nota-cor deve ser consistente em todo o app.

## Anti-padrões

### AP01 — Agente escrevendo arquivo grande
Agentes têm limite de output e truncam silenciosamente. Nunca delegar escrita de HTML/JS completo a agente.

### AP02 — CSS sem DOM trace
Nunca definir CSS sem antes verificar qual JS gera o DOM. CSS definido "no escuro" cria bugs difíceis de rastrear.

### AP03 — Feedback punitivo
Nenhuma animação, cor ou som deve sinalizar "errou" de forma negativa. Criança de 7-9 anos precisa de ambiente seguro para tentar.
