const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");
const { Arquivo, ArquivoTipo, Simulado, Subject, Topic, Subtopic } = require("../models");

exports.renderHub = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { query } = req; // Pega os filtros da URL

    // Constrói a query de filtro dinamicamente
    const whereClause = { user_id: userId };
    if (query.busca) whereClause.nome = { [Op.like]: `%${query.busca}%` };
    if (query.tipo_id) whereClause.tipo_id = query.tipo_id;
    if (query.simulado_id) whereClause.simulado_id = query.simulado_id;
    if (query.subject_id) whereClause.subject_id = query.subject_id;
    if (query.topic_id) whereClause.topic_id = query.topic_id;
    if (query.subtopic_id) whereClause.subtopic_id = query.subtopic_id;

    const tipos = await ArquivoTipo.findAll({ where: { user_id: userId }, order: [["nome", "ASC"]] });

    // Busca arquivos com o filtro aplicado
    const arquivos = await Arquivo.findAll({
      where: whereClause,
      include: [
        { model: ArquivoTipo, as: "tipo" },
        { model: Simulado, as: "simulado", attributes: ["id", "nome"] },
        { model: Subject, as: "subject", attributes: ["id", "nome"] },
        { model: Topic, as: "topic", attributes: ["id", "nome", "subject_id"] },
        { model: Subtopic, as: "subtopic", attributes: ["id", "nome", "topic_id"] }
      ],
      order: [["created_at", "DESC"]]
    });

    // Busca os dados para preencher os <select> e fazer a cascata no JS
    const simulados = await Simulado.findAll({ where: { user_id: userId }, order: [["data_realizacao", "DESC"]] });
    const subjects = await Subject.findAll({ where: { user_id: userId }, order: [["nome", "ASC"]] });
    const topics = await Topic.findAll({ where: { user_id: userId }, order: [["nome", "ASC"]] });
    const subtopics = await Subtopic.findAll({ where: { user_id: userId }, order: [["nome", "ASC"]] });

    res.render("app/arquivos/hub", {
      userNome: req.session.userNome || "Estudante",
      userFoto: req.session.userFoto || null,
      tipos,
      arquivos,
      simulados,
      subjects,
      topics, // Enviamos para o JS montar a cascata
      subtopics, // Enviamos para o JS montar a cascata
      filtrosAtual: query, // Retornamos para manter os selects preenchidos na tela
      active: "arquivos"
    });
  } catch (error) {
    console.error("Erro ao carregar hub de arquivos:", error);
    res.status(500).send("Erro interno do servidor");
  }
};

exports.criarTipo = async (req, res) => {
  try {
    if (req.body.nome) await ArquivoTipo.create({ user_id: req.session.userId, nome: req.body.nome });
    res.redirect("/arquivos");
  } catch (error) {
    res.redirect("/arquivos");
  }
};

exports.deletarTipo = async (req, res) => {
  try {
    await ArquivoTipo.destroy({ where: { id: req.params.id, user_id: req.session.userId } });
    res.redirect("/arquivos");
  } catch (error) {
    res.redirect("/arquivos");
  }
};

exports.uploadArquivo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("Nenhum arquivo enviado.");
    const { nome, tipo_id, simulado_id, subject_id, topic_id, subtopic_id } = req.body;

    await Arquivo.create({
      user_id: req.session.userId,
      nome: nome,
      caminho: `/public/uploads/materiais/${req.file.filename}`,
      extensao: path.extname(req.file.originalname),
      tipo_id: tipo_id || null,
      simulado_id: simulado_id || null,
      subject_id: subject_id || null,
      topic_id: topic_id || null,
      subtopic_id: subtopic_id || null
    });
    res.redirect("/arquivos");
  } catch (error) {
    console.error("Erro ao fazer upload:", error);
    res.status(500).send("Erro ao salvar arquivo.");
  }
};

exports.deletarArquivo = async (req, res) => {
  try {
    const arquivo = await Arquivo.findOne({ where: { id: req.params.id, user_id: req.session.userId } });
    if (arquivo) {
      const filePath = path.join(__dirname, "..", arquivo.caminho);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      await arquivo.destroy();
    }
    res.redirect("/arquivos");
  } catch (error) {
    res.redirect("/arquivos");
  }
};

exports.downloadArquivo = async (req, res) => {
  try {
    const arquivo = await Arquivo.findOne({ where: { id: req.params.id, user_id: req.session.userId } });
    if (!arquivo) return res.status(404).send("Arquivo não encontrado.");
    const filePath = path.join(__dirname, "..", arquivo.caminho);
    res.download(filePath, `${arquivo.nome}${arquivo.extensao}`);
  } catch (error) {
    res.status(500).send("Erro interno");
  }
};