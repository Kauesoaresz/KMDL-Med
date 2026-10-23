const {
  Simulado,
  SimuladoBloco,
  SimuladoQuestaoErro,
  Subject,
  Topic,
} = require("../models");
const sequelize = require("../config/database");

/* =========================
   CONSTANTES
========================= */
const POR_AREA = 45;

const AREAS = [
  { key: "linguagens", label: "Linguagens", start: 1 },
  { key: "humanas", label: "Humanas", start: 46 },
  { key: "naturezas", label: "Natureza", start: 91 },
  { key: "matematica", label: "Matemática", start: 136 },
];

const MOTIVOS = ["falta_atencao", "falta_conteudo", "lacuna"];

function ensureInt(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function hojeISO() {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD no fuso local
}

function voltar(req, res, fallback) {
  return res.redirect(req.get("Referer") || fallback);
}

// Cria os 4 blocos de um simulado já FECHADOS
// (45 questões "não feitas" por área, total 0 e acertos 0)
async function criarBlocosFechados(simulado, transaction) {
  for (const a of AREAS) {
    const bloco = await SimuladoBloco.create(
      {
        simulado_id: simulado.id,
        area: a.key,
        total_questoes: 0,
        acertos: 0,
        tempo_minutos: null,
        data_realizacao: simulado.data_realizacao,
      },
      { transaction }
    );

    const linhas = [];
    for (let n = a.start; n < a.start + POR_AREA; n++) {
      linhas.push({
        simulado_bloco_id: bloco.id,
        area: a.key,
        numero_questao: n,
        status: "nao_feita",
        motivo: null,
      });
    }
    await SimuladoQuestaoErro.bulkCreate(linhas, { transaction });
  }
}

/* =========================
   LISTAR
========================= */
exports.listarSimulados = async (req, res) => {
  const userId = req.session.userId;

  try {
    const simulados = await Simulado.findAll({
      where: { user_id: userId },
      order: [["data_realizacao", "DESC"], ["id", "DESC"]],
    });

    res.render("app/simulados/lista", {
      simulados,
      error: req.query.erro || null,
      ok: req.query.ok || null,
      active: "simulados",
      userNome: req.session.userNome,
      userFoto: req.session.userFoto || null,
    });
  } catch (err) {
    console.error(err);
    res.render("app/simulados/lista", {
      simulados: [],
      error: "Erro ao carregar simulados.",
      ok: null,
      active: "simulados",
      userNome: req.session.userNome,
      userFoto: req.session.userFoto || null,
    });
  }
};

/* =========================
   CRIAR (já cria os 4 blocos)
========================= */
exports.criarSimulado = async (req, res) => {
  const userId = req.session.userId;
  const nome = (req.body.nome || "").trim();
  const data = req.body.data_realizacao;

  if (!nome || !data) {
    return res.redirect("/simulados/lista?erro=Preencha nome e data");
  }

  if (data > hojeISO()) {
    return res.redirect("/simulados/lista?erro=Não é permitido usar data futura");
  }

  const t = await sequelize.transaction();
  try {
    const simulado = await Simulado.create(
      { user_id: userId, nome, data_realizacao: data },
      { transaction: t }
    );

    await criarBlocosFechados(simulado, t);

    await t.commit();
    return res.redirect(`/simulados/${simulado.id}`);
  } catch (err) {
    await t.rollback();
    console.error("Erro ao criar simulado:", err);
    return res.redirect("/simulados/lista?erro=Erro ao criar simulado");
  }
};

/* =========================
   DETALHES (GRADE)
========================= */
async function carregarSimulado(id, userId) {
  return Simulado.findOne({
    where: { id, user_id: userId },
    include: [
      {
        model: SimuladoBloco,
        as: "blocos",
        include: [
          {
            model: SimuladoQuestaoErro,
            as: "erros",
            include: [
              { model: Subject, as: "subject" },
              { model: Topic, as: "topic" },
            ],
          },
        ],
      },
    ],
  });
}

exports.detalhesSimulado = async (req, res) => {
  const userId = req.session.userId;
  const { id } = req.params;

  try {
    let simulado = await carregarSimulado(id, userId);
    if (!simulado) return res.redirect("/simulados/lista");

    // Garante os 4 blocos (por segurança)
    const faltando = AREAS.filter(
      (a) => !simulado.blocos.some((b) => b.area === a.key)
    );
        if (faltando.length) {
      const t = await sequelize.transaction();
      try {
        for (const a of faltando) {
          const bloco = await SimuladoBloco.create(
            {
              simulado_id: simulado.id,
              area: a.key,
              total_questoes: 0,
              acertos: 0,
              tempo_minutos: null,
              data_realizacao: simulado.data_realizacao,
            },
            { transaction: t }
          );
          const linhas = [];
          for (let n = a.start; n < a.start + POR_AREA; n++) {
            linhas.push({
              simulado_bloco_id: bloco.id,
              area: a.key,
              numero_questao: n,
              status: "nao_feita",
              motivo: null,
            });
          }
          await SimuladoQuestaoErro.bulkCreate(linhas, { transaction: t });
        }
        await t.commit();
      } catch (e) {
        await t.rollback();
        throw e;
      }
      simulado = await carregarSimulado(id, userId);
    }

    const subjects = await Subject.findAll({
      where: { user_id: userId },
      order: [["nome", "ASC"]],
    });

    const tempos = {};
    const questoes = [];

    simulado.blocos.forEach((b) => {
      tempos[b.area] = b.tempo_minutos;
      b.erros.forEach((e) => {
        questoes.push({
          n: e.numero_questao,
          estado: e.status === "nao_feita" ? "nao_feita" : "errada",
          motivo: e.motivo,
          subject_id: e.subject_id,
          topic_id: e.topic_id,
          subject_nome: e.subject ? e.subject.nome : null,
          topic_nome: e.topic ? e.topic.nome : null,
          anotacao: e.anotacao,
        });
      });
    });

    const simJson = JSON.stringify({
      id: simulado.id,
      areas: AREAS,
      questoes,
    }).replace(/</g, "\\u003c");

    res.render("app/simulados/detalhes", {
      simulado,
      subjects,
      areas: AREAS,
      tempos,
      simJson,
      active: "simulados",
      userNome: req.session.userNome,
      userFoto: req.session.userFoto || null,
    });
  } catch (err) {
    console.error("ERRO detalhesSimulado:", err);
    res.redirect("/simulados/lista");
  }
};

/* =========================
   SALVAR GABARITO (JSON)
   Só grava exceções: errada / não feita.
   Não recria tudo, para preservar "revisada".
========================= */
exports.salvarGabarito = async (req, res) => {
  const userId = req.session.userId;
  const { id } = req.params;
  const { nome, redacao_nota, tempos, questoes } = req.body || {};

  const fail = (msg) => res.status(400).json({ error: msg });

  try {
    const simulado = await Simulado.findOne({
      where: { id, user_id: userId },
      include: [{ model: SimuladoBloco, as: "blocos" }],
    });
    if (!simulado) return res.status(404).json({ error: "Simulado não encontrado." });

    /* ---- metadados ---- */
    const nomeLimpo = (nome || "").toString().trim();
    if (!nomeLimpo) return fail("Dê um nome ao simulado.");

    let nota = null;
    if (redacao_nota !== undefined && redacao_nota !== null && redacao_nota !== "") {
      nota = Number(redacao_nota);
      if (!Number.isInteger(nota) || nota < 0 || nota > 1000) {
        return fail("A nota da redação deve ser um inteiro entre 0 e 1000.");
      }
    }

    const temposLimpos = {};
    for (const a of AREAS) {
      const v = tempos ? tempos[a.key] : null;
      if (v === undefined || v === null || v === "") {
        temposLimpos[a.key] = null;
      } else {
        const n = Number(v);
        if (!Number.isInteger(n) || n < 0) return fail(`Tempo inválido em ${a.label}.`);
        temposLimpos[a.key] = n;
      }
    }

    /* ---- questões ---- */
    const porNumero = new Map();
    for (const q of Array.isArray(questoes) ? questoes : []) {
      const n = Number(q.n);
      if (!Number.isInteger(n) || n < 1 || n > 180) return fail("Número de questão inválido.");
      if (!["errada", "nao_feita"].includes(q.estado)) return fail("Estado de questão inválido.");

      const item = {
        n,
        estado: q.estado,
        motivo: null,
        subject_id: null,
        topic_id: null,
        anotacao: null,
      };

      if (q.estado === "errada") {
        if (!MOTIVOS.includes(q.motivo)) return fail(`Questão ${n}: escolha o motivo do erro.`);
        item.motivo = q.motivo;

        if (q.motivo === "lacuna") {
          item.subject_id = ensureInt(q.subject_id);
          item.topic_id = ensureInt(q.topic_id);
          if (!item.subject_id || !item.topic_id) {
            return fail(`Questão ${n}: lacuna exige matéria e tópico.`);
          }
        }

        const anot = (q.anotacao || "").toString().trim().slice(0, 255);
        item.anotacao = anot || null;
      }

      porNumero.set(n, item);
    }

    /* ---- matérias/tópicos pertencem ao usuário? ---- */
    const items = [...porNumero.values()];
    const subjectIds = [...new Set(items.map((i) => i.subject_id).filter(Boolean))];
    const topicIds = [...new Set(items.map((i) => i.topic_id).filter(Boolean))];

    if (subjectIds.length) {
      const c = await Subject.count({ where: { id: subjectIds, user_id: userId } });
      if (c !== subjectIds.length) return fail("Matéria inválida.");
    }
    if (topicIds.length) {
      const c = await Topic.count({ where: { id: topicIds, user_id: userId } });
      if (c !== topicIds.length) return fail("Tópico inválido.");
    }

    /* ---- grava ---- */
    const t = await sequelize.transaction();
    try {
      for (const area of AREAS) {
        let bloco = simulado.blocos.find((b) => b.area === area.key);
        if (!bloco) {
          bloco = await SimuladoBloco.create(
            {
              simulado_id: simulado.id,
              area: area.key,
              total_questoes: POR_AREA,
              acertos: POR_AREA,
              data_realizacao: simulado.data_realizacao,
            },
            { transaction: t }
          );
        }

        const existentes = await SimuladoQuestaoErro.findAll({
          where: { simulado_bloco_id: bloco.id },
          transaction: t,
        });
        const mapaEx = new Map(existentes.map((e) => [e.numero_questao, e]));

        let erradas = 0;
        let naoFeitas = 0;

        for (let n = area.start; n < area.start + POR_AREA; n++) {
          const novo = porNumero.get(n);
          const ex = mapaEx.get(n);

          if (!novo) {
            // voltou a ser "certa"
            if (ex) await ex.destroy({ transaction: t });
            continue;
          }

          if (novo.estado === "errada") erradas++;
          else naoFeitas++;

          const dados = {
            area: area.key,
            numero_questao: n,
            status: novo.estado,
            motivo: novo.motivo,
            subject_id: novo.subject_id,
            topic_id: novo.topic_id,
            anotacao: novo.anotacao,
          };

          if (!ex) {
            await SimuladoQuestaoErro.create(
              { simulado_bloco_id: bloco.id, ...dados },
              { transaction: t }
            );
          } else {
            if (ex.status !== novo.estado) {
              dados.revisada = false;
              dados.data_revisao = null;
            }
            await ex.update(dados, { transaction: t });
          }
        }

        const feitas = POR_AREA - naoFeitas;
        await bloco.update(
          {
            total_questoes: feitas,
            acertos: feitas - erradas,
            tempo_minutos: temposLimpos[area.key],
          },
          { transaction: t }
        );
      }

      await simulado.update({ nome: nomeLimpo, redacao_nota: nota }, { transaction: t });
      await t.commit();
      return res.json({ ok: true });
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (err) {
    console.error("ERRO salvarGabarito:", err);
    return res.status(500).json({ error: "Erro interno ao salvar." });
  }
};

/* =========================
   STATUS (em andamento <-> finalizado)
========================= */
exports.alterarStatus = async (req, res) => {
  const userId = req.session.userId;
  const { id } = req.params;
  const { status } = req.body || {};

  if (!["em_andamento", "finalizado"].includes(status)) {
    return res.status(400).json({ error: "Status inválido." });
  }

  try {
    const simulado = await Simulado.findOne({ where: { id, user_id: userId } });
    if (!simulado) return res.status(404).json({ error: "Simulado não encontrado." });

    simulado.status = status;
    simulado.finished_at = status === "finalizado" ? new Date() : null;
    await simulado.save();

    return res.json({ ok: true });
  } catch (err) {
    console.error("ERRO alterarStatus:", err);
    return res.status(500).json({ error: "Erro interno." });
  }
};

/* =========================
   EXCLUIR
========================= */
exports.excluirSimulado = async (req, res) => {
  const userId = req.session.userId;
  const { id } = req.params;

  try {
    const simulado = await Simulado.findOne({ where: { id, user_id: userId } });
    if (simulado) await simulado.destroy(); // CASCADE apaga blocos e erros
    res.redirect("/simulados/lista");
  } catch (err) {
    console.error("Erro ao excluir simulado:", err);
    res.redirect("/simulados/lista?erro=Erro ao excluir simulado");
  }
};

/* =========================
   CADERNO DE ERROS (global)
========================= */
exports.listarErros = async (req, res) => {
  const userId = req.session.userId;
  const { area, motivo, status } = req.query;

  const whereErro = { status: "errada" }; // "não feita" não entra no caderno
  if (area) whereErro.area = area;
  if (motivo) whereErro.motivo = motivo;
  if (status === "pendentes") whereErro.revisada = false;
  if (status === "revisadas") whereErro.revisada = true;

  try {
    const erros = await SimuladoQuestaoErro.findAll({
      where: whereErro,
      include: [
        {
          model: SimuladoBloco,
          as: "bloco",
          required: true,
          include: [
            {
              model: Simulado,
              as: "simulado",
              required: true,
              where: { user_id: userId },
            },
          ],
        },
        { model: Subject, as: "subject" },
        { model: Topic, as: "topic" },
      ],
      order: [["created_at", "DESC"]],
    });

    res.render("app/simulados/erros", {
      erros,
      active: "simulados",
      userNome: req.session.userNome,
      qArea: area || "",
      qMotivo: motivo || "",
      qStatus: status || "",
      userFoto: req.session.userFoto || null,
    });
  } catch (err) {
    console.error("ERRO LISTAR ERROS:", err);
    res.render("app/simulados/erros", {
      erros: [],
      active: "simulados",
      userNome: req.session.userNome,
      qArea: area || "",
      qMotivo: motivo || "",
      qStatus: status || "",
      userFoto: req.session.userFoto || null,
    });
  }
};

async function buscarErroDoUsuario(erroId, userId) {
  return SimuladoQuestaoErro.findOne({
    where: { id: erroId },
    include: [
      {
        model: SimuladoBloco,
        as: "bloco",
        required: true,
        include: [
          { model: Simulado, as: "simulado", required: true, where: { user_id: userId } },
        ],
      },
    ],
  });
}

exports.marcarErroRevisado = async (req, res) => {
  try {
    const erro = await buscarErroDoUsuario(req.params.erroId, req.session.userId);
    if (!erro) return res.redirect("/simulados/erros");

    erro.revisada = true;
    erro.data_revisao = new Date();
    await erro.save();

    voltar(req, res, "/simulados/erros");
  } catch (err) {
    console.error(err);
    res.redirect("/simulados/erros");
  }
};

exports.desfazerErroRevisado = async (req, res) => {
  try {
    const erro = await buscarErroDoUsuario(req.params.erroId, req.session.userId);
    if (!erro) return res.redirect("/simulados/erros");

    erro.revisada = false;
    erro.data_revisao = null;
    await erro.save();

    voltar(req, res, "/simulados/erros");
  } catch (err) {
    console.error(err);
    res.redirect("/simulados/erros");
  }
};