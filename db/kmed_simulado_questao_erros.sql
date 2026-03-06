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
-- Table structure for table `simulado_questao_erros`
--

DROP TABLE IF EXISTS `simulado_questao_erros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `simulado_questao_erros` (
  `id` int NOT NULL AUTO_INCREMENT,
  `simulado_bloco_id` int NOT NULL,
  `area` enum('linguagens','humanas','naturezas','matematica') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero_questao` int NOT NULL,
  `motivo` enum('falta_conteudo','lacuna','falta_atencao') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `revisada` tinyint(1) NOT NULL DEFAULT '0',
  `data_revisao` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `subject_id` int DEFAULT NULL,
  `topic_id` int DEFAULT NULL,
  `subtopic_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `simulado_bloco_id` (`simulado_bloco_id`),
  KEY `subject_id` (`subject_id`),
  KEY `topic_id` (`topic_id`),
  KEY `subtopic_id` (`subtopic_id`),
  CONSTRAINT `simulado_questao_erros_ibfk_33` FOREIGN KEY (`simulado_bloco_id`) REFERENCES `simulado_blocos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `simulado_questao_erros_ibfk_34` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `simulado_questao_erros_ibfk_35` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `simulado_questao_erros_ibfk_36` FOREIGN KEY (`subtopic_id`) REFERENCES `subtopics` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=92 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `simulado_questao_erros`
--

LOCK TABLES `simulado_questao_erros` WRITE;
/*!40000 ALTER TABLE `simulado_questao_erros` DISABLE KEYS */;
/*!40000 ALTER TABLE `simulado_questao_erros` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-06 14:04:57
