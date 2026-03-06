# TODO: Dashboard Premium KMed - CONCLUÍDO ✅

## Objetivo: Transformar o dashboard no centro de comando completo do sistema

---

## ✅ Funcionalidades Implementadas

### 1. Seção de Revisões Pendentes 🔴
- [x] Buscar topics com `proxima_revisao` <= hoje
- [x] Cards mini das próximas revisões (máx 5)
- [x] Botão "Revisar Agora" → /revisoes

### 2. Mini Calendário (Heatmap) 📅
- [x] Mostrar calendário do mês atual
- [x] Colorir dias por intensidade de horas estudadas
- [x] Legenda de cores

### 3. Widget de Simulados 📝
- [x] Último simulado realizado (data, nota)
- [x] Média dos últimos 5 simulados FINALIZADOS
- [x] Link para /simulados

### 4. Gráfico de Rosca - Matérias 🥧
- [x] Buscar horas por subject_id
- [x] Gráfico Chart.js doughnut
- [x] Legenda com cores por matéria

### 5. Gráfico de Barras - Dia da Semana 📊
- [x] Agregar horas por dia da semana (0-6)
- [x] Gráfico de barras verticais
- [x] Identificar padrão de estudos

### 6. Widget de Meta Diária 🎯
- [x] Meta padrão: 4h/dia
- [x] Barra de progresso
- [x] Porcentagem completada

### 7. Sistema de Conquistas/Badges 🏆
- [x] streak_7: 7 dias seguidos
- [x] streak_30: 30 dias seguidos
- [x] horas_100: 100 horas total
- [x] horas_500: 500 horas total
- [x] questoes_500: 500 questões
- [x] simulado_1: Primeiro simulado
- [x] revisoes_10: 10 revisões feitas

### 8. Quick Actions ⚡
- [x] Botão "Registrar Estudo" → /registrar/novo
- [x] Botão "Novo Simulado" → /simulados/lista

### 9. Assuntos por Desempenho 📚
- [x] Top 5 matérias por horas estudadas (no gráfico rosca)

### 10. Melhorias Visuais 🎨
- [x] Font Plus Jakarta Sans
- [x] Font Space Grotesk para números
- [x] Animações CSS suaves (contadores animados)

---

## Arquivos a Alterar

1. **src/controllers/dashboardController.js** - Adicionar todas as queries
2. **src/views/app/dashboard.ejs** - Novo layout com todas as seções
3. **src/public/css/app/dashboard.css** - Novo estilo premium

---

## Estrutura de Dados Nova (no controller)

```javascript
// Revisões pendentes
const revisoesPendentes = await Topic.findAll({
  where: {
    user_id: userId,
    proxima_revisao: { [Op.lte]: hoje }
  },
  include: [{ model: Subject, as: "subject", attributes: ["nome"] }],
  limit: 5
});

// Simulados
const ultimosSimulados = await Simulado.findAll({
  where: { user_id: userId, status: "finalizado" },
  order: [["finished_at", "DESC"]],
  limit: 5
});

// Por matéria
const porMateria = await StudyEntry.findAll({
  where: { user_id: userId },
  attributes: ["subject_id", [fn("SUM", col("horas")), "horas"]],
  include: [{ model: Subject, as: "subject", attributes: ["nome"] }],
  group: ["subject_id"],
  raw: false
});

// Por dia da semana
const porDiaSemana = await StudyEntry.findAll({
  where: { user_id: userId },
  attributes: [
    [fn("DAYOFWEEK", col("data")), "dia"]
  ],
  raw: true
});

// Conquistas
const conquistas = [];

// Meta diária
const metaDiaria = 4; // horas
```

---

## Ordem de Implementação

1. Controller - Todas as queries
2. EJS - Estrutura HTML
3. CSS - Estilo completo
4. Testes e ajustes

