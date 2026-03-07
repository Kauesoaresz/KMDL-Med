-- =====================================================
-- Tabela de Metas de Estudo (Study Goals)
-- =====================================================

DROP TABLE IF EXISTS `study_goals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `study_goals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `nome` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `meta_horas` decimal(6,2) NOT NULL,
  `meta_questoes` int NOT NULL DEFAULT '0',
  `data_inicio` date NOT NULL,
  `data_limite` date NOT NULL,
  `eh_principal` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('ativa','concluida','vencida') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ativa',
  `data_conclusao` date DEFAULT NULL,
  `horas_concluidas` decimal(6,2) NOT NULL DEFAULT '0.00',
  `questoes_concluidas` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_goals_user_status` (`user_id`,`status`),
  KEY `idx_goals_user_principal` (`user_id`,`eh_principal`),
  CONSTRAINT `study_goals_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

