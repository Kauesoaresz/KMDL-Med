# TODO - Melhorias no Perfil do Usuário

## Objetivo
Adicionar estatísticas automáticas e bio ao perfil do usuário.

## Tarefas

### 1. Banco de Dados
- [x] Adicionar campo `bio` na tabela users (VARCHAR 500)

### 2. Model User
- [x] Adicionar campo `bio` no modelo User.js

### 3. Controller (profileController.js)
- [x] Criar função para calcular estatísticas do usuário:
  - Total de horas estudadas
  - Total de questões respondidas
  - Total de acertos
  - Taxa de acertos (%)
  - Total de simulados realizados
  - Data de cadastro (tempo como usuário)
- [x] Passar estatísticas para a view
- [x] Salvar bio no banco

### 4. View (profile.ejs)
- [x] Adicionar seção de estatísticas com cards
- [x] Adicionar campo de bio/descrição
- [x] Reorganizar layout

### 5. CSS (profile.css)
- [x] Estilizar cards de estatísticas
- [x] Melhorar visual da bio
- [x] Design moderno e bonito

## Próximo Passo
- [ ] Executar o SQL `db/alteracoes_perfil_bio.sql` no banco de dados

## Estatísticas a Exibir
- ⏱️ Horas estudadas
- 📝 Questões respondidas
- ✅ Acertos / Taxa de acertos
- 📋 Simulados realizados
- 📅 Membro desde (data)
- 🔥 Sequência de estudos (streak)

