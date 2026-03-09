<<<<<<< HEAD
# Plano para Implementar Modo Claro/Escuro

## Problema Identificado
O sistema de tema está configurado corretamente no `theme.css` e `sidebar.ejs` (o sidebar muda de cor), mas os outros arquivos CSS usam cores hexadecimais fixas em vez de variáveis CSS, fazendo com que o restante da página não mude de cor.

## Mapeamento de Cores para Variáveis CSS

### Backgrounds (Fundos)
- `#08090c` → `var(--bg-primary)` (fundo principal)
- `#0b0c10` → `var(--bg-secondary)` (fundo secundário)
- `#121318` → `var(--bg-tertiary)` (fundo terciário)
- `#14161a` → `var(--bg-card)` (cards)
- `#1a1d24` → `var(--bg-card-hover)` (hover de cards)
- `#0e1015`, `#0f1116`, `#101216` → `var(--bg-tertiary)` (fundos diversos)
- `#0f1218`, `#0c0d12` → `var(--bg-secondary)` (fundos diversos)

### Textos
- `#ffffff` → `var(--text-primary)` (texto principal)
- `#eaeaea` → `var(--text-primary)` (texto principal)
- `#9aa1ad` → `var(--text-secondary)` (texto secundário)
- `#6b7280` → `var(--text-muted)` (texto muted)

### Bordas
- `#1f2229` → `var(--border-color)` (borda principal)
- `#2a2e38` → `var(--border-color-light)` (borda clara)
- `#232734` → `var(--border-color)` (borda alternativa)
- `rgba(255,255,255,0.06)` → `var(--border-color)` com opacity
- `rgba(255,255,255,0.08)`, `rgba(255,255,255,0.1)`, `rgba(255,255,255,0.18)` → ajustar para light mode

### Modo Claro
No `[data-theme="light"]`, as variáveis já estão definidas:
- `--bg-primary: #f8fafc`
- `--bg-secondary: #ffffff`
- `--bg-tertiary: #f1f5f9`
- `--bg-card: #ffffff`
- `--bg-card-hover: #f8fafc`
- `--text-primary: #0f172a`
- `--text-secondary: #475569`
- `--text-muted: #94a3b8`
- `--border-color: #e2e8f0`
- `--border-color-light: #cbd5e1`

## Arquivos a Serem Modificados

### Prioridade Alta (Mais usados) - EM ANDAMENTO
1. ~~`src/public/css/app/dashboard.css`~~ - ✅ CONCLUÍDO
2. `src/public/css/app/metas.css` - Pendente
3. `src/public/css/app/profile.css` - Pendente
4. `src/public/css/app/calendario.css` - Pendente

### Prioridade Média (Simulados)
5. `src/public/css/app/simulados-lista.css`
6. `src/public/css/app/simulados-hub.css`
7. `src/public/css/app/simulados-comparar.css`
8. `src/public/css/app/simulados-estatisticas.css`
9. `src/public/css/app/simulados-erro-editar.css`
10. `src/public/css/app/simulados-bloco-editar.css`
11. `src/public/css/app/simulados-detalhes.css`
12. `src/public/css/app/simulados-erros.css`

### Prioridade Média (Provas)
13. `src/public/css/app/provas.css`
14. `src/public/css/app/provas-lista.css`
15. `src/public/css/app/nova-prova.css`
16. `src/public/css/app/editar-prova.css`

### Prioridade Média (Outros)
17. `src/public/css/app/register-list.css`
18. `src/public/css/app/estatisticas-hub.css`
19. `src/public/css/app/estatisticas-conteudo.css`
20. `src/public/css/app/revisoes.css`
21. `src/public/css/app/statistics.css`

### Prioridade Baixa (Conteúdos)
22. `src/public/css/content/materias.css`
23. `src/public/css/content/materias-edit.css`
24. `src/public/css/content/assuntos.css`
25. `src/public/css/content/assuntos-edit.css`
26. `src/public/css/content/topicos.css`
27. `src/public/css/content/topicos-edit.css`

## Ação Necessária
Para cada propriedade CSS, substituir os valores hexadecimais fixos pelas variáveis CSS correspondentes.

## Exemplos de Substituição

```css
/* ANTES (cor fixa) */
background: linear-gradient(180deg, #121318, #0b0c10);
color: #ffffff;
border: 1px solid #1f2229;
box-shadow: 0 30px 60px rgba(0,0,0,0.6);

/* DEPOIS (variável CSS) */
background: linear-gradient(180deg, var(--bg-tertiary), var(--bg-secondary));
color: var(--text-primary);
border: 1px solid var(--border-color);
box-shadow: var(--shadow-card);
```

## Nota sobre Gradientes
Para gradientes, usar as variáveis diretamente quando possível, ou manter cores fixas que funcionam bem em ambos os modos (como o verde `--accent`).

## Execução
1. Modificar cada arquivo CSS substituindo cores fixas por variáveis
2. Testar alternando entre modo claro e escuro
3. Verificar se todos os elementos estão respondendo corretamente ao tema
=======
# TODO - Implement Hours and Minutes

## Task: Change time tracking from Days to Hours and Minutes

### 1. register-day.ejs ✅
- [x] Replace single "Minutos" input with Hours and Minutes fields

### 2. register-edit.ejs ✅
- [x] Replace single "Minutos" input with Hours and Minutes fields
- [x] Add JavaScript to handle editing existing entries

### 3. studyController.js ✅
- [x] Update registerSave to accept hours and minutes separately
- [x] Update editSave to accept hours and minutes separately

### 4. calendario.ejs ✅
- [x] Change display from decimal hours to "Xh Ymin" format

### 5. register-list.ejs ✅
- [x] Change display from decimal hours to "Xh Ymin" format

### 6. review-card.ejs ✅
- [x] Change "Dias sem estudar" to hours/minutes (now shows "Tempo sem estudar")

### 7. reviewController.js ✅
- [x] Update calculation from days to hours (horasSemEstudar)
>>>>>>> f47d1d6d316171d8548aeb01b514e937ac0f84d7

