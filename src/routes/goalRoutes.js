const express = require("express");
const auth = require("../middlewares/auth");
const c = require("../controllers/goalController");

const router = express.Router();

router.get("/metas", auth, c.pagina);

router.post("/api/metas/criar", auth, c.criarMeta);
router.put("/api/metas/:id", auth, c.editarMeta);
router.post("/api/metas/:id/principal", auth, c.definirPrincipal);
router.post("/api/metas/:id/finalizar", auth, c.finalizarMeta);
router.delete("/api/metas/:id", auth, c.deletarMeta);

module.exports = router;