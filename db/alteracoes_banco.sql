-- =====================================================
-- NOVAS TABELAS E ALTERAÇÕES PARA SISTEMA DE REVISÕES
-- Adicionar ao banco de dados existente
-- =====================================================

-- --------------------------------------------------------
-- Table structure for table `review_history`
-- --------------------------------------------------------

CREATE TABLE `review_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `topic_id` int NOT NULL,
  `assunto` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dificuldade` enum('muito_facil','facil','medio','dificil','muito_dificil') COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_revisao` date NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `subject_id` (`subject_id`),
  KEY `topic_id` (`topic_id`),
  CONSTRAINT `review_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `review_history_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `review_history_ibfk_3` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Alter table `topics` - adicionar campos de revisão
-- --------------------------------------------------------

ALTER TABLE `topics` 
ADD COLUMN `ultima_revisao` date DEFAULT NULL,
ADD COLUMN `proxima_revisao` date DEFAULT NULL;

