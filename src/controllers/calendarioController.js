const { StudyEntry } = require("../models");
const { Op, fn, col } = require("sequelize");

function toISO(date) {
  return date.toISOString().slice(0, 10);
}

// Helper function to convert decimal hours to "Xh Ymin" format
function formatHoursMinutes(decimalHours) {
  if (!decimalHours || decimalHours <= 0) return "0h 0min";
  
  const horas = Math.floor(decimalHours);
  const minutos = Math.round((decimalHours - horas) * 60);
  
  if (horas === 0) {
    return `${minutos}min`;
  }
  
  return `${horas}h ${minutos}min`;
}

exports.calendario = async (req, res) => {
  try {
    const userId = req.session.userId;

    const hoje = new Date();
    const hojeISO = toISO(hoje);

    const ano = parseInt(req.query.ano) || hoje.getFullYear();
    const mes = parseInt(req.query.mes) || hoje.getMonth() + 1;

    const inicioMes = new Date(ano, mes - 1, 1);
    const fimMes = new Date(ano, mes, 0);

    const registros = await StudyEntry.findAll({
      where: {
        user_id: userId,
        data: {
          [Op.between]: [toISO(inicioMes), toISO(fimMes)]
        }
      },
      attributes: [
        "data",
        [fn("SUM", col("horas")), "horas_dia"],
        [fn("SUM", col("questoes")), "questoes_dia"],
        [fn("SUM", col("acertos")), "acertos_dia"]
      ],
      group: ["data"]
    });

    const mapa = {};
    registros.forEach(r => {
      mapa[r.data] = {
        horas: Number(r.get("horas_dia")),
        questoes: Number(r.get("questoes_dia")),
        acertos: Number(r.get("acertos_dia"))
      };
    });

    const diasMes = [];
    let totalHorasMes = 0;
    let diasEstudados = 0;

    for (let d = 1; d <= fimMes.getDate(); d++) {
      const data = new Date(ano, mes - 1, d);
      const iso = toISO(data);

      const info = mapa[iso] || { horas: 0, questoes: 0, acertos: 0 };
      const horasInt = Math.floor(info.horas);

      if (info.horas > 0) diasEstudados++;
      totalHorasMes += info.horas;

      // --- LÓGICA DE CORES ATUALIZADA ---
      let cor = "zero";
      if (horasInt >= 12) cor = "h12";
      else if (horasInt === 11) cor = "h11";
      else if (horasInt === 10) cor = "h10";
      else if (horasInt === 9) cor = "h9";
      else if (horasInt === 8) cor = "h8";
      else if (horasInt === 7) cor = "h7";
      else if (horasInt === 6) cor = "h6";
      else if (horasInt === 5) cor = "h5";
      else if (horasInt === 4) cor = "h4";
      else if (horasInt === 3) cor = "h3";
      else if (horasInt === 2) cor = "h2";
      else if (horasInt === 1) cor = "h1";

      const perfeito =
        info.horas >= 6 &&
        info.questoes >= 30 &&
        info.acertos > 0 &&
        info.acertos / info.questoes >= 0.8;

      diasMes.push({
        dia: d,
        dataISO: iso,
        horas: formatHoursMinutes(info.horas), // Format in "Xh Ymin" format
        cor,
        perfeito,
        isHoje: iso === hojeISO,
        futuro: iso > hojeISO
      });
    }

    const mediaDiaria =
      diasEstudados > 0
        ? totalHorasMes / diasEstudados
        : 0;

    const mesLabel = inicioMes.toLocaleString("pt-BR", {
      month: "long",
      year: "numeric"
    });

    res.render("app/calendario", {
      active: "calendario",
      userNome: req.session.userNome,
      userFoto: req.session.userFoto,

      diasMes,
      totalHorasMes: totalHorasMes, // Raw number for view to format
      diasEstudados,
      mediaDiaria: mediaDiaria, // Raw number for view to format

      mesLabel,
      anoAnterior: mes === 1 ? ano - 1 : ano,
      mesAnterior: mes === 1 ? 12 : mes - 1,
      anoProximo: mes === 12 ? ano + 1 : ano,
      mesProximo: mes === 12 ? 1 : mes + 1
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Erro no calendário");
  }
};

