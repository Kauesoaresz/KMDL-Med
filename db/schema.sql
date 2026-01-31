CREATE DATABASE IF NOT EXISTS kmed
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE kmed;

-- =========================
-- USERS
-- =========================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  foto VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================
-- SUBJECTS (Matérias)
-- =========================
CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  nome VARCHAR(80) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_subjects_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_subject_user_nome (user_id, nome)
);

-- =========================
-- TOPICS (Tópicos) - obrigatório no registro
-- =========================
CREATE TABLE IF NOT EXISTS topics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  subject_id INT NOT NULL,
  nome VARCHAR(120) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_topics_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_topics_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_topic_user_subject_nome (user_id, subject_id, nome)
);

-- =========================
-- SUBTOPICS (Assuntos) - opcional no registro (pode ser NULL)
-- =========================
CREATE TABLE IF NOT EXISTS subtopics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  topic_id INT NOT NULL,
  nome VARCHAR(160) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_subtopics_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_subtopics_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_subtopic_user_topic_nome (user_id, topic_id, nome)
);

-- =========================
-- STUDY_ENTRIES (Registros do dia / sessões)
-- =========================
CREATE TABLE IF NOT EXISTS study_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  data DATE NOT NULL,
  subject_id INT NOT NULL,
  topic_id INT NOT NULL,
  subtopic_id INT NULL,
  horas DECIMAL(5,2) NOT NULL DEFAULT 0,
  questoes INT NOT NULL DEFAULT 0,
  acertos INT NOT NULL DEFAULT 0,
  dificuldade ENUM('MUITO_FACIL','FACIL','MEDIA','DIFICIL','MUITO_DIFICIL') NOT NULL DEFAULT 'MEDIA',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_entries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_entries_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT,
  CONSTRAINT fk_entries_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE RESTRICT,
  CONSTRAINT fk_entries_subtopic FOREIGN KEY (subtopic_id) REFERENCES subtopics(id) ON DELETE SET NULL
);

CREATE INDEX idx_entries_user_date ON study_entries(user_id, data);

-- =========================
-- TABELA: simulados
-- =========================
CREATE TABLE simulados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  nome VARCHAR(255) NOT NULL,

  dia ENUM('DIA_1', 'DIA_2') NOT NULL,
  area ENUM('LINGUAGENS', 'HUMANAS', 'NATUREZA', 'MATEMATICA') NOT NULL,

  data_prova DATE NOT NULL,
  tempo_minutos INT NOT NULL,

  status ENUM('EM_ANDAMENTO', 'FINALIZADO') DEFAULT 'EM_ANDAMENTO',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


  CONSTRAINT fk_simulados_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- =========================
-- TABELA: simulado_erros
-- =========================
CREATE TABLE simulado_erros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  simulado_id INT NOT NULL,
  area ENUM('LINGUAGENS', 'HUMANAS', 'NATUREZA', 'MATEMATICA') NOT NULL,
  questao INT NOT NULL,
  revisado BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_erros_simulado
    FOREIGN KEY (simulado_id)
    REFERENCES simulados(id)
    ON DELETE CASCADE
);
