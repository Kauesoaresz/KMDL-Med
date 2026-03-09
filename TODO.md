# TODO - Novo Layout do Relatório PDF

## Plano de Melhoria do Relatório de Estudos

### 1. Análise do Sistema Atual
- [x] Controller existente: `reportController.js` 
- [x] Dados coletados do banco: StudyEntry (matérias, tópicos, subtopics)
- [x] Lógica de filtragem: 0 horas e 0 questões = não aparece
- [x] Modelos disponíveis: StudyEntry, Subject, Topic, Subtopic, Simulado

### 2. Estrutura do Novo Relatório PDF

#### 2.1 Cabeçalho
- [x] Título: "RELATÓRIO DE DESEMPENHO DE ESTUDOS"
- [x] Subtítulo: "Preparação para Vestibular de Medicina"
- [x] Data de geração do relatório
- [x] Linha divisória elegante

#### 2.2 Resumo Geral (Dashboard)
- [x] Total de horas estudadas
- [x] Total de questões feitas
- [x] Total de questões acertadas
- [x] Taxa geral de acertos
- [x] Número de dias estudados
- [x] Média de horas por dia
- [x] Cards organizados em grid

#### 2.3 Desempenho por Matéria
- [x] Tabela com colunas: Matéria | Horas | Questões | Acertos | Taxa %
- [x] Ordenar da mais estudada para a menos estudada

#### 2.4 Detalhamento por Assunto
- [x] Cada matéria separada
- [x] Tabela: Assunto | Horas | Questões | Acertos | Taxa %

#### 2.5 Detalhamento por Tópico
- [x] Dentro de cada assunto
- [x] Tabela: Tópico | Horas | Questões | Acertos | Taxa %

#### 2.6 Simulados (se existirem)
- [x] Tabela: Simulado | Data | Questões | Acertos | Taxa %

### 3. Regras Visuais

#### 3.1 Layout PDF
- [x] Formato A4
- [x] Margens: top: 20mm, bottom: 20mm, left: 15mm, right: 15mm
- [x] page-break-before/after para evitar cortes ruins
- [x] page-break-inside: avoid nos blocos de matéria

#### 3.2 Design Visual
- [x] Fontes limpas (Arial, sans-serif)
- [x] Espaçamento consistente
- [x] Cores: cinza claro (#f8fafc, #f1f5f9), azul escuro (#1e3a5f), preto (#1a1a2e)
- [x] Separação clara entre seções
- [x] Tabelas bem alinhadas
- [x] Bordas suaves
- [x] Fundo leve nos cabeçalhos das tabelas

### 4. Melhorias no Código

#### 4.1 Atualizar reportController.js
- [x] Adicionar consulta de simulados
- [x] Calcular dias estudados
- [x] Calcular média de horas/dia
- [x] Novo template HTML com estrutura completa
- [x] CSS profissional inline
- [x] Placeholders para dados dinâmicos

### 5. Testes
- [ ] Gerar relatório de teste
- [ ] Verificar formatação PDF
- [ ] Verificar que dados com 0 não aparecem
- [ ] Verificar que simulados aparecem quando existirem

---

## Dependencies / Arquivos editados:
- `src/controllers/reportController.js` - ✅ Concluído

