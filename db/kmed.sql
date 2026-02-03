-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: kmed
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `simulado_blocos`
--

DROP TABLE IF EXISTS `simulado_blocos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `simulado_blocos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `simulado_id` int NOT NULL,
  `area` enum('linguagens','humanas','naturezas','matematica') COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_questoes` int NOT NULL,
  `acertos` int NOT NULL,
  `tempo_minutos` int DEFAULT NULL,
  `data_realizacao` date NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_bloco_simulado` (`simulado_id`),
  CONSTRAINT `fk_bloco_simulado` FOREIGN KEY (`simulado_id`) REFERENCES `simulados` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `simulado_questao_erros`
--

DROP TABLE IF EXISTS `simulado_questao_erros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `simulado_questao_erros` (
  `id` int NOT NULL AUTO_INCREMENT,
  `simulado_bloco_id` int NOT NULL,
  `area` enum('linguagens','humanas','naturezas','matematica') COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero_questao` int NOT NULL,
  `motivo` enum('falta_conteudo','lacuna','falta_atencao') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `revisada` tinyint(1) DEFAULT '0',
  `data_revisao` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `subject_id` int DEFAULT NULL,
  `topic_id` int DEFAULT NULL,
  `subtopic_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_erro_bloco` (`simulado_bloco_id`),
  CONSTRAINT `fk_erro_bloco` FOREIGN KEY (`simulado_bloco_id`) REFERENCES `simulado_blocos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `simulados`
--

DROP TABLE IF EXISTS `simulados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `simulados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `nome` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('em_andamento','finalizado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'em_andamento',
  `finished_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `data_realizacao` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_simulados_user` (`user_id`),
  CONSTRAINT `fk_simulados_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `study_entries`
--

DROP TABLE IF EXISTS `study_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `study_entries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `data` date NOT NULL,
  `subject_id` int NOT NULL,
  `topic_id` int NOT NULL,
  `subtopic_id` int DEFAULT NULL,
  `horas` decimal(5,2) NOT NULL DEFAULT '0.00',
  `questoes` int NOT NULL DEFAULT '0',
  `acertos` int NOT NULL DEFAULT '0',
  `dificuldade` enum('MUITO_FACIL','FACIL','MEDIA','DIFICIL','MUITO_DIFICIL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MEDIA',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_entries_subject` (`subject_id`),
  KEY `fk_entries_topic` (`topic_id`),
  KEY `fk_entries_subtopic` (`subtopic_id`),
  KEY `idx_entries_user_date` (`user_id`,`data`),
  CONSTRAINT `fk_entries_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_entries_subtopic` FOREIGN KEY (`subtopic_id`) REFERENCES `subtopics` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_entries_topic` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_entries_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=141 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `subjects`
--

DROP TABLE IF EXISTS `subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `nome` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_subject_user_nome` (`user_id`,`nome`),
  CONSTRAINT `fk_subjects_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `subtopics`
--

DROP TABLE IF EXISTS `subtopics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subtopics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `topic_id` int NOT NULL,
  `nome` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_subtopic_user_topic_nome` (`user_id`,`topic_id`,`nome`),
  KEY `fk_subtopics_topic` (`topic_id`),
  CONSTRAINT `fk_subtopics_topic` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_subtopics_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=338 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `topics`
--

DROP TABLE IF EXISTS `topics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `topics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `nome` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_topic_user_subject_nome` (`user_id`,`subject_id`,`nome`),
  KEY `fk_topics_subject` (`subject_id`),
  CONSTRAINT `fk_topics_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_topics_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=156 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `senha_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `foto` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-03  3:38:12
