const { StudyGoal, StudyEntry } = require("../models");
const { Op, fn, col } = require("sequelize");
const sequelize = require("../config/database");

/* =========================
   HELPERS
========================= */
function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function parseDateBR(dateStr) {
  if (!dateStr) return null;
  
  // Se já estiver no formato yyyy-mm-dd (do input type="date")
  if (dateStr.includes("-") && dateStr.split("-").length === 3) {
    return dateStr; // Já está no formato correto para o banco
  }
  
  // Se estiver no formato dd/mm/yyyy
  const [d, m, y] = dateStr.split("/");
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/* =========================
   ATUALIZAR PROGRESSO AUTOMÁTICO
========================= */
async function atualizarProgressoMeta(goal) {
  const hoje = todayISO();
  
  // Buscar todos os estudos a partir da data de início
  const estudos = await StudyEntry.findAll({
    where: {
      user_id: goal.user_id,
      data: { [Op.gte]: goal.data_inicio }
    },
    attributes: [
      [fn("SUM", col("horas")), "horas"],
      [fn("SUM", col("questoes")), "questoes"]
    ],
    raw: true
  });

  const horasConcluidas = Number(estudos[0]?.horas) || 0;
  const questoesConcluidas = Number(estudos[0]?.questoes) || 0;

  // Atualizar o registro da meta
  goal.horas_concluidas = horasConcluidas;
  goal.questoes_concluidas = questoesConcluidas;

  // Verificar se a meta foi concluída
  const horasConcluidasMeta = horasConcluidas >= goal.meta_horas;
  const questoesConcluidasMeta = goal.meta_questoes > 0 
    ? questoesConcluidas >= goal.meta_questoes 
    : true;

  // Se passaram da data limite e não concluiu
  if (hoje > goal.data_limite && (!horasConcluidasMeta || !questoesConcluidasMeta)) {
    goal.status = "vencida";
  }

  // Se completou todas as metas
  if (horasConcluidasMeta && questoesConcluidasMeta && goal.status === "ativa") {
    goal.status = "concluida";
    goal.data_conclusao = hoje;
  }

  await goal.save();
  return goal;
}

/* =========================
   CRIAR META
========================= */
exports.criarMeta = async (req, res) => {
  try {
    const userId = req.session.userId;
const { nome, meta_horas, meta_questoes, data_inicio, data_limite, eh_principal } = req.body;

    if (!nome || !meta_horas || !data_inicio || !data_limite) {
      return res.status(400).json({ erro: "Preencha todos os campos obrigatórios" });
    }

    const meta = await StudyGoal.create({
      user_id: userId,
      nome,
      meta_horas: parseFloat(meta_horas),
      meta_questoes: parseInt(meta_questoes) || 0,
      data_inicio: parseDateBR(data_inicio),
      data_limite: parseDateBR(data_limite),
      eh_principal: eh_principal === true || eh_principal === 'true',
      status: "ativa"
    });

    // Atualizar progresso inicial
    await atualizarProgressoMeta(meta);

    res.json({ sucesso: true, meta });
  } catch (error) {
    console.error("Erro ao criar meta:", error);
    res.status(500).json({ erro: "Erro ao criar meta" });
  }
};

/* =========================
   LISTAR METAS PRINCIPAIS (ATIVAS)
========================= */
exports.listarMetasPrincipais = async (req, res) => {
  try {
    const userId = req.session.userId;

    const metas = await StudyGoal.findAll({
      where: {
        user_id: userId,
        eh_principal: true,
        status: "ativa"
      },
      order: [["data_limite", "ASC"]],
      limit: 4
    });

    // Atualizar progresso de cada meta
    const metasAtualizadas = await Promise.all(
      metas.map(async (meta) => {
        const atualizada = await atualizarProgressoMeta(meta);
        return {
          id: atualizada.id,
          nome: atualizada.nome,
          meta_horas: Number(atualizada.meta_horas),
          meta_questoes: atualizada.meta_questoes,
          horas_concluidas: Number(atualizada.horas_concluidas),
          questoes_concluidas: atualizada.questoes_concluidas,
          data_inicio: atualizada.data_inicio,
          data_limite: atualizada.data_limite,
          data_limite_formatada: formatDate(atualizada.data_limite),
          eh_principal: atualizada.eh_principal,
          status: atualizada.status,
          progresso_horas: Math.min(Math.round((Number(atualizada.horas_concluidas) / Number(atualizada.meta_horas)) * 100), 100),
          progresso_questoes: atualizada.meta_questoes > 0 
            ? Math.min(Math.round((atualizada.questoes_concluidas / atualizada.meta_questoes) * 100), 100)
            : 100,
          progresso_total: atualizada.meta_questoes > 0
            ? Math.min(Math.round(((Number(atualizada.horas_concluidas) / Number(atualizada.meta_horas)) + (atualizada.questoes_concluidas / atualizada.meta_questoes)) / 2 * 100), 100)
            : Math.min(Math.round((Number(atualizada.horas_concluidas) / Number(atualizada.meta_horas)) * 100), 100)
        };
      })
    );

    res.json({ metas: metasAtualizadas });
  } catch (error) {
    console.error("Erro ao listar metas principais:", error);
    res.status(500).json({ erro: "Erro ao listar metas" });
  }
};

/* =========================
   DEFINIR COMO PRINCIPAL
========================= */
exports.definirPrincipal = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { id } = req.params;

    const meta = await StudyGoal.findOne({
      where: { id, user_id: userId }
    });

    if (!meta) {
      return res.status(404).json({ erro: "Meta não encontrada" });
    }

    // Se está definindo como principal
    if (!meta.eh_principal) {
      // Contar quantas já são principais
      const countPrincipais = await StudyGoal.count({
        where: {
          user_id: userId,
          eh_principal: true,
          status: "ativa"
        }
      });

      if (countPrincipais >= 4) {
        return res.status(400).json({ erro: "Máximo de 4 metas principais permitido" });
      }

      meta.eh_principal = true;
      await meta.save();
    } else {
      // Se está removendo da principal
      meta.eh_principal = false;
      await meta.save();
    }

    res.json({ sucesso: true, eh_principal: meta.eh_principal });
  } catch (error) {
    console.error("Erro ao definir meta principal:", error);
    res.status(500).json({ erro: "Erro ao definir meta principal" });
  }
};

/* =========================
   ATUALIZAR PROGRESSO MANUAL
========================= */
exports.atualizarProgresso = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { id } = req.params;

    const meta = await StudyGoal.findOne({
      where: { id, user_id: userId }
    });

    if (!meta) {
      return res.status(404).json({ erro: "Meta não encontrada" });
    }

    const atualizada = await atualizarProgressoMeta(meta);

    res.json({ sucesso: true, meta: atualizada });
  } catch (error) {
    console.error("Erro ao atualizar progresso:", error);
    res.status(500).json({ erro: "Erro ao atualizar progresso" });
  }
};

/* =========================
   FINALIZAR META MANUALMENTE
========================= */
exports.finalizarMeta = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { id } = req.params;

    const meta = await StudyGoal.findOne({
      where: { id, user_id: userId }
    });

    if (!meta) {
      return res.status(404).json({ erro: "Meta não encontrada" });
    }

    meta.status = "concluida";
    meta.data_conclusao = todayISO();
    await meta.save();

    res.json({ sucesso: true, meta });
  } catch (error) {
    console.error("Erro ao finalizar meta:", error);
    res.status(500).json({ erro: "Erro ao finalizar meta" });
  }
};

/* =========================
   DELETAR META
========================= */
exports.deletarMeta = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { id } = req.params;

    const meta = await StudyGoal.findOne({
      where: { id, user_id: userId }
    });

    if (!meta) {
      return res.status(404).json({ erro: "Meta não encontrada" });
    }

    await meta.destroy();

    res.json({ sucesso: true });
  } catch (error) {
    console.error("Erro ao deletar meta:", error);
    res.status(500).json({ erro: "Erro ao deletar meta" });
  }
};

/* =========================
   PÁGINA DE HISTÓRICO DE METAS
========================= */
exports.historicoMetas = async (req, res) => {
  try {
    const userId = req.session.userId;
    const userNome = req.session.userNome;
    const userFoto = req.session.userFoto;

    const hoje = todayISO();

    // Metas concluídas e vencidas
    const metas = await StudyGoal.findAll({
      where: {
        user_id: userId
      },
      order: [["created_at", "DESC"]]
    });

    // Processar dados para display
    const metasFormatadas = metas.map(meta => {
      const diasParaConclusao = meta.data_conclusao 
        ? daysBetween(meta.data_inicio, meta.data_conclusao)
        : daysBetween(meta.data_inicio, meta.data_limite);
      
      const diasTotais = daysBetween(meta.data_inicio, meta.data_limite);
      const dentroDoPrazo = meta.status === "concluida" && meta.data_conclusao <= meta.data_limite;

      return {
        id: meta.id,
        nome: meta.nome,
        meta_horas: Number(meta.meta_horas),
        meta_questoes: meta.meta_questoes,
        horas_concluidas: Number(meta.horas_concluidas),
        questoes_concluidas: meta.questoes_concluidas,
        data_inicio: formatDate(meta.data_inicio),
        data_limite: formatDate(meta.data_limite),
        data_conclusao: meta.data_conclusao ? formatDate(meta.data_conclusao) : null,
        status: meta.status,
        dias_para_conclusao: diasParaConclusao,
        dias_totais: diasTotais,
        dentro_do_prazo: dentroDoPrazo,
        progresso_horas: Math.min(Math.round((Number(meta.horas_concluidas) / Number(meta.meta_horas)) * 100), 100),
        progresso_questoes: meta.meta_questoes > 0 
          ? Math.min(Math.round((meta.questoes_concluidas / meta.meta_questoes) * 100), 100)
          : 100
      };
    });

    // Estatísticas
    const totalConcluidas = metas.filter(m => m.status === "concluida").length;
    const totalVencidas = metas.filter(m => m.status === "vencida").length;
    const dentroDoPrazo = metasFormatadas.filter(m => m.status === "concluida" && m.dentro_do_prazo).length;
    const foraDoPrazo = metasFormatadas.filter(m => m.status === "concluida" && !m.dentro_do_prazo).length;

    res.render("app/metas", {
      active: "metas",
      userNome,
      userFoto,
      metas: metasFormatadas,
      stats: {
        totalConcluidas,
        totalVencidas,
        dentroDoPrazo,
        foraDoPrazo
      }
    });
  } catch (error) {
    console.error("Erro ao carregar histórico de metas:", error);
    res.status(500).send("Erro ao carregar página");
  }
};

/* =========================
   API: LISTAR TODAS AS METAS (para modal de seleção)
========================= */
exports.listarTodasMetas = async (req, res) => {
  try {
    const userId = req.session.userId;

    const metas = await StudyGoal.findAll({
      where: {
        user_id: userId,
        status: "ativa"
      },
      order: [["created_at", "DESC"]]
    });

    const metasFormatadas = await Promise.all(
      metas.map(async (meta) => {
        const atualizada = await atualizarProgressoMeta(meta);
        return {
          id: atualizada.id,
          nome: atualizada.nome,
          meta_horas: Number(atualizada.meta_horas),
          meta_questoes: atualizada.meta_questoes,
          horas_concluidas: Number(atualizada.horas_concluidas),
          questoes_concluidas: atualizada.questoes_concluidas,
          data_limite: formatDate(atualizada.data_limite),
          eh_principal: atualizada.eh_principal,
          progresso_horas: Math.min(Math.round((Number(atualizada.horas_concluidas) / Number(atualizada.meta_horas)) * 100), 100),
          progresso_questoes: atualizada.meta_questoes > 0 
            ? Math.min(Math.round((atualizada.questoes_concluidas / atualizada.meta_questoes) * 100), 100)
            : 100
        };
      })
    );

    res.json({ metas: metasFormatadas });
  } catch (error) {
    console.error("Erro ao listar todas as metas:", error);
    res.status(500).json({ erro: "Erro ao listar metas" });
  }
};

