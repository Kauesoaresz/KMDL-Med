-- =====================================================
-- KMed Gamificação - Sistema Completo de Conquistas e XP
-- Conquistas até Dezembro/2026
-- =====================================================

-- Tabela de Progresso do Usuário
CREATE TABLE IF NOT EXISTS user_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    xp_total INT DEFAULT 0,
    nivel INT DEFAULT 1,
    xp_atual INT DEFAULT 0,
    xp_proximo_nivel INT DEFAULT 500,
    titulo VARCHAR(50) DEFAULT 'Iniciante',
    conquistas_desbloqueadas INT DEFAULT 0,
    streak_atual INT DEFAULT 0,
    streak_maior INT DEFAULT 0,
    ultimo_estudo DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Conquistas Desbloqueadas
CREATE TABLE IF NOT EXISTS user_conquistas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    conquista_key VARCHAR(100) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    icone VARCHAR(50),
    xp_bonus INT DEFAULT 0,
    dificuldade VARCHAR(20) DEFAULT 'facil',
    data_conquista TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progresso INT DEFAULT 0,
    meta INT DEFAULT 0,
    UNIQUE KEY unique_conquista (user_id, conquista_key)
);

-- Tabela de Histórico de XP
CREATE TABLE IF NOT EXISTS xp_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    xp_ganho INT NOT NULL,
    motivo TEXT,
    tipo VARCHAR(50),
    data_ganho TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Conquistas Base
CREATE TABLE IF NOT EXISTS conquistas_base (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conquista_key VARCHAR(100) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    icone VARCHAR(50),
    categoria VARCHAR(50),
    tipo_valor VARCHAR(50),
    meta INT NOT NULL,
    xp_bonus INT DEFAULT 50,
    dificuldade VARCHAR(20) DEFAULT 'facil'
);

-- =====================================================
-- CONQUISTAS DE DIAS ESTUDADOS (até 365 dias)
-- =====================================================
INSERT INTO conquistas_base (conquista_key, titulo, descricao, icone, categoria, tipo_valor, meta, xp_bonus, dificuldade) VALUES
('dia_1', 'Primeiro Dia', 'Estude por 1 dia', '📅', 'dias', 'dias', 1, 10, 'facil'),
('dia_2', 'Dois Dias', 'Estude por 2 dias', '📆', 'dias', 'dias', 2, 15, 'facil'),
('dia_3', 'Três Dias', 'Estude por 3 dias', '🗓️', 'dias', 'dias', 3, 20, 'facil'),
('dia_4', 'Quatro Dias', 'Estude por 4 dias', '📅', 'dias', 'dias', 4, 25, 'facil'),
('dia_5', 'Cinco Dias', 'Estude por 5 dias', '📆', 'dias', 'dias', 5, 30, 'facil'),
('dia_6', 'Seis Dias', 'Estude por 6 dias', '🗓️', 'dias', 'dias', 6, 35, 'facil'),
('dia_7', 'Uma Semana', 'Estude por 7 dias', '📅', 'dias', 'dias', 7, 40, 'facil'),
('dia_8', 'Oito Dias', 'Estude por 8 dias', '📆', 'dias', 'dias', 8, 42, 'facil'),
('dia_9', 'Nove Dias', 'Estude por 9 dias', '🗓️', 'dias', 'dias', 9, 44, 'facil'),
('dia_10', 'Dez Dias', 'Estude por 10 dias', '📅', 'dias', 'dias', 10, 46, 'facil'),
('dia_11', 'Onze Dias', 'Estude por 11 dias', '📆', 'dias', 'dias', 11, 48, 'facil'),
('dia_12', 'Doze Dias', 'Estude por 12 dias', '🗓️', 'dias', 'dias', 12, 50, 'facil'),
('dia_13', 'Treze Dias', 'Estude por 13 dias', '📅', 'dias', 'dias', 13, 52, 'facil'),
('dia_14', 'Duas Semanas', 'Estude por 14 dias', '📆', 'dias', 'dias', 14, 54, 'facil'),
('dia_15', 'Quinze Dias', 'Estude por 15 dias', '🗓️', 'dias', 'dias', 15, 56, 'facil'),
('dia_16', 'Dezesseis Dias', 'Estude por 16 dias', '📅', 'dias', 'dias', 16, 58, 'facil'),
('dia_17', 'Dezessete Dias', 'Estude por 17 dias', '📆', 'dias', 'dias', 17, 60, 'facil'),
('dia_18', 'Dezoito Dias', 'Estude por 18 dias', '🗓️', 'dias', 'dias', 18, 62, 'facil'),
('dia_19', 'Dezenove Dias', 'Estude por 19 dias', '📅', 'dias', 'dias', 19, 64, 'facil'),
('dia_20', 'Vinte Dias', 'Estude por 20 dias', '📆', 'dias', 'dias', 20, 66, 'facil'),
('dia_21', 'Tres Semanas', 'Estude por 21 dias', '🗓️', 'dias', 'dias', 21, 70, 'facil'),
('dia_22', 'Vinte e Dois Dias', 'Estude por 22 dias', '📅', 'dias', 'dias', 22, 72, 'facil'),
('dia_23', 'Vinte e Tres Dias', 'Estude por 23 dias', '📆', 'dias', 'dias', 23, 74, 'facil'),
('dia_24', 'Vinte e Quatro Dias', 'Estude por 24 dias', '🗓️', 'dias', 'dias', 24, 76, 'facil'),
('dia_25', 'Vinte e Cinco Dias', 'Estude por 25 dias', '📅', 'dias', 'dias', 25, 78, 'facil'),
('dia_26', 'Vinte e Seis Dias', 'Estude por 26 dias', '📆', 'dias', 'dias', 26, 80, 'facil'),
('dia_27', 'Vinte e Sete Dias', 'Estude por 27 dias', '🗓️', 'dias', 'dias', 27, 82, 'facil'),
('dia_28', 'Quatro Semanas', 'Estude por 28 dias', '📅', 'dias', 'dias', 28, 84, 'facil'),
('dia_29', 'Vinte e Nove Dias', 'Estude por 29 dias', '📆', 'dias', 'dias', 29, 86, 'facil'),
('dia_30', 'Um Mes', 'Estude por 30 dias', '🗓️', 'dias', 'dias', 30, 88, 'facil'),
('dia_35', 'Trinta e Cinco Dias', 'Estude por 35 dias', '📅', 'dias', 'dias', 35, 95, 'facil'),
('dia_40', 'Quarenta Dias', 'Estude por 40 dias', '📆', 'dias', 'dias', 40, 100, 'medio'),
('dia_45', 'Quarenta e Cinco Dias', 'Estude por 45 dias', '🗓️', 'dias', 'dias', 45, 105, 'medio'),
('dia_50', 'Cinquenta Dias', 'Estude por 50 dias', '📅', 'dias', 'dias', 50, 110, 'medio'),
('dia_60', 'Sessenta Dias', 'Estude por 60 dias', '📆', 'dias', 'dias', 60, 120, 'medio'),
('dia_70', 'Setenta Dias', 'Estude por 70 dias', '🗓️', 'dias', 'dias', 70, 130, 'medio'),
('dia_80', 'Oitenta Dias', 'Estude por 80 dias', '📅', 'dias', 'dias', 80, 140, 'medio'),
('dia_90', 'Noventa Dias', 'Estude por 90 dias', '📆', 'dias', 'dias', 90, 150, 'medio'),
('dia_100', 'Cem Dias', 'Estude por 100 dias', '🗓️', 'dias', 'dias', 100, 160, 'dificil'),
('dia_110', 'Cento e Dez Dias', 'Estude por 110 dias', '📅', 'dias', 'dias', 110, 170, 'dificil'),
('dia_120', 'Cento e Vinte Dias', 'Estude por 120 dias', '📆', 'dias', 'dias', 120, 180, 'dificil'),
('dia_130', 'Cento e Trinta Dias', 'Estude por 130 dias', '🗓️', 'dias', 'dias', 130, 190, 'dificil'),
('dia_140', 'Cento e Quarenta Dias', 'Estude por 140 dias', '📅', 'dias', 'dias', 140, 200, 'dificil'),
('dia_150', 'Cento e Cinquenta Dias', 'Estude por 150 dias', '📆', 'dias', 'dias', 150, 210, 'dificil'),
('dia_175', 'Cento e Setenta e Cinco Dias', 'Estude por 175 dias', '🗓️', 'dias', 'dias', 175, 230, 'dificil'),
('dia_200', 'Duzentos Dias', 'Estude por 200 dias', '📅', 'dias', 'dias', 200, 250, 'lendario'),
('dia_225', 'Duzentos e Vinte e Cinco Dias', 'Estude por 225 dias', '📆', 'dias', 'dias', 225, 270, 'lendario'),
('dia_250', 'Duzentos e Cinquenta Dias', 'Estude por 250 dias', '🗓️', 'dias', 'dias', 250, 300, 'lendario'),
('dia_275', 'Duzentos e Setenta e Cinco Dias', 'Estude por 275 dias', '📅', 'dias', 'dias', 275, 330, 'lendario'),
('dia_300', 'Trezentos Dias', 'Estude por 300 dias', '📆', 'dias', 'dias', 300, 350, 'lendario'),
('dia_330', 'Trezentos e Trinta Dias', 'Estude por 330 dias', '🗓️', 'dias', 'dias', 330, 380, 'lendario'),
('dia_365', 'Um Ano', 'Estude por 365 dias', '🏆', 'dias', 'dias', 365, 500, 'lendario');

-- =====================================================
-- CONQUISTAS DE STREAK (dias seguidos)
-- =====================================================
INSERT INTO conquistas_base (conquista_key, titulo, descricao, icone, categoria, tipo_valor, meta, xp_bonus, dificuldade) VALUES
('streak_1', 'Inicio da Sequencia', 'Mantenha 1 dia seguido', '🔥', 'streak', 'streak', 1, 10, 'facil'),
('streak_2', 'Dois Seguido', 'Mantenha 2 dias seguidos', '🔥', 'streak', 'streak', 2, 15, 'facil'),
('streak_3', 'Tres Seguido', 'Mantenha 3 dias seguidos', '🔥', 'streak', 'streak', 3, 20, 'facil'),
('streak_4', 'Quatro Seguido', 'Mantenha 4 dias seguidos', '🔥', 'streak', 'streak', 4, 25, 'facil'),
('streak_5', 'Cinco Seguido', 'Mantenha 5 dias seguidos', '🔥', 'streak', 'streak', 5, 30, 'facil'),
('streak_6', 'Seis Seguido', 'Mantenha 6 dias seguidos', '🔥', 'streak', 'streak', 6, 35, 'facil'),
('streak_7', 'Semana de Fogo', 'Mantenha 7 dias seguidos', '🔥', 'streak', 'streak', 7, 40, 'facil'),
('streak_8', 'Oito Seguido', 'Mantenha 8 dias seguidos', '🔥', 'streak', 'streak', 8, 42, 'facil'),
('streak_9', 'Nove Seguido', 'Mantenha 9 dias seguidos', '🔥', 'streak', 'streak', 9, 44, 'facil'),
('streak_10', 'Dez Seguido', 'Mantenha 10 dias seguidos', '🔥', 'streak', 'streak', 10, 46, 'facil'),
('streak_14', 'Quatorze Seguido', 'Mantenha 14 dias seguidos', '🔥', 'streak', 'streak', 14, 54, 'facil'),
('streak_21', 'Vinte e Um Seguido', 'Mantenha 21 dias seguidos', '🔥', 'streak', 'streak', 21, 70, 'medio'),
('streak_28', 'Vinte e Oito Seguido', 'Mantenha 28 dias seguidos', '🔥', 'streak', 'streak', 28, 84, 'medio'),
('streak_30', 'Um Mes Seguido', 'Mantenha 30 dias seguidos', '⚡', 'streak', 'streak', 30, 90, 'medio'),
('streak_45', 'Quarenta e Cinco Seguido', 'Mantenha 45 dias seguidos', '⚡', 'streak', 'streak', 45, 105, 'medio'),
('streak_60', 'Sessenta Seguido', 'Mantenha 60 dias seguidos', '🛡️', 'streak', 'streak', 60, 120, 'dificil'),
('streak_75', 'Setenta e Cinco Seguido', 'Mantenha 75 dias seguidos', '🛡️', 'streak', 'streak', 75, 135, 'dificil'),
('streak_90', 'Noventa Seguido', 'Mantenha 90 dias seguidos', '🛡️', 'streak', 'streak', 90, 150, 'dificil'),
('streak_120', 'Cento e Vinte Seguido', 'Mantenha 120 dias seguidos', '👑', 'streak', 'streak', 120, 180, 'lendario'),
('streak_180', 'Seis Meses Seguido', 'Mantenha 180 dias seguidos', '👑', 'streak', 'streak', 180, 250, 'lendario'),
('streak_365', 'Um Ano Inteiro', 'Mantenha 365 dias seguidos', '🏆', 'streak', 'streak', 365, 500, 'lendario');

-- =====================================================
-- CONQUISTAS DE SIMULADOS
-- =====================================================
INSERT INTO conquistas_base (conquista_key, titulo, descricao, icone, categoria, tipo_valor, meta, xp_bonus, dificuldade) VALUES
('sim_1', 'Primeiro Simulado', 'Faca 1 simulado', '📋', 'simulados', 'simulados', 1, 50, 'facil'),
('sim_2', 'Dois Simulados', 'Faca 2 simulados', '📑', 'simulados', 'simulados', 2, 55, 'facil'),
('sim_3', 'Tres Simulados', 'Faca 3 simulados', '📊', 'simulados', 'simulados', 3, 60, 'facil'),
('sim_4', 'Quatro Simulados', 'Faca 4 simulados', '📈', 'simulados', 'simulados', 4, 65, 'facil'),
('sim_5', 'Cinco Simulados', 'Faca 5 simulados', '📉', 'simulados', 'simulados', 5, 70, 'facil'),
('sim_6', 'Seis Simulados', 'Faca 6 simulados', '📋', 'simulados', 'simulados', 6, 75, 'facil'),
('sim_7', 'Sete Simulados', 'Faca 7 simulados', '📑', 'simulados', 'simulados', 7, 80, 'facil'),
('sim_8', 'Oito Simulados', 'Faca 8 simulados', '📊', 'simulados', 'simulados', 8, 85, 'facil'),
('sim_9', 'Nove Simulados', 'Faca 9 simulados', '📈', 'simulados', 'simulados', 9, 90, 'facil'),
('sim_10', 'Dez Simulados', 'Faca 10 simulados', '📉', 'simulados', 'simulados', 10, 95, 'facil'),
('sim_15', 'Quinze Simulados', 'Faca 15 simulados', '📋', 'simulados', 'simulados', 15, 110, 'medio'),
('sim_20', 'Vinte Simulados', 'Faca 20 simulados', '📑', 'simulados', 'simulados', 20, 130, 'medio'),
('sim_25', 'Vinte e Cinco Simulados', 'Faca 25 simulados', '📊', 'simulados', 'simulados', 25, 150, 'medio'),
('sim_30', 'Trinta Simulados', 'Faca 30 simulados', '📈', 'simulados', 'simulados', 30, 170, 'medio'),
('sim_40', 'Quarenta Simulados', 'Faca 40 simulados', '📉', 'simulados', 'simulados', 40, 200, 'dificil'),
('sim_50', 'Cinquenta Simulados', 'Faca 50 simulados', '🏆', 'simulados', 'simulados', 50, 250, 'dificil'),
('sim_75', 'Setenta e Cinco Simulados', 'Faca 75 simulados', '🎖️', 'simulados', 'simulados', 75, 350, 'lendario'),
('sim_100', 'Cem Simulados', 'Faca 100 simulados', '👑', 'simulados', 'simulados', 100, 500, 'lendario'),
('sim_150', 'Cento e Cinquenta Simulados', 'Faca 150 simulados', '💎', 'simulados', 'simulados', 150, 750, 'lendario'),
('sim_200', 'Duzentos Simulados', 'Faca 200 simulados', '🌟', 'simulados', 'simulados', 200, 1000, 'lendario');

-- =====================================================
-- CONQUISTAS DE REVISÕES
-- =====================================================
INSERT INTO conquistas_base (conquista_key, titulo, descricao, icone, categoria, tipo_valor, meta, xp_bonus, dificuldade) VALUES
('rev_1', 'Primeira Revisao', 'Faca 1 revisao', '🔄', 'revisoes', 'revisoes', 1, 25, 'facil'),
('rev_2', 'Duas Revisoes', 'Faca 2 revisoes', '🔁', 'revisoes', 'revisoes', 2, 30, 'facil'),
('rev_3', 'Tres Revisoes', 'Faca 3 revisoes', '🔂', 'revisoes', 'revisoes', 3, 35, 'facil'),
('rev_4', 'Quatro Revisoes', 'Faca 4 revisoes', '📌', 'revisoes', 'revisoes', 4, 40, 'facil'),
('rev_5', 'Cinco Revisoes', 'Faca 5 revisoes', '📍', 'revisoes', 'revisoes', 5, 45, 'facil'),
('rev_6', 'Seis Revisoes', 'Faca 6 revisoes', '🔄', 'revisoes', 'revisoes', 6, 50, 'facil'),
('rev_7', 'Sete Revisoes', 'Faca 7 revisoes', '🔁', 'revisoes', 'revisoes', 7, 55, 'facil'),
('rev_8', 'Oito Revisoes', 'Faca 8 revisoes', '🔂', 'revisoes', 'revisoes', 8, 60, 'facil'),
('rev_9', 'Nove Revisoes', 'Faca 9 revisoes', '📌', 'revisoes', 'revisoes', 9, 65, 'facil'),
('rev_10', 'Dez Revisoes', 'Faca 10 revisoes', '📍', 'revisoes', 'revisoes', 10, 70, 'facil'),
('rev_15', 'Quinze Revisoes', 'Faca 15 revisoes', '🔄', 'revisoes', 'revisoes', 15, 85, 'medio'),
('rev_20', 'Vinte Revisoes', 'Faca 20 revisoes', '🔁', 'revisoes', 'revisoes', 20, 100, 'medio'),
('rev_25', 'Vinte e Cinco Revisoes', 'Faca 25 revisoes', '🧠', 'revisoes', 'revisoes', 25, 120, 'medio'),
('rev_30', 'Trinta Revisoes', 'Faca 30 revisoes', '💪', 'revisoes', 'revisoes', 30, 140, 'medio'),
('rev_40', 'Quarenta Revisoes', 'Faca 40 revisoes', '🎯', 'revisoes', 'revisoes', 40, 170, 'dificil'),
('rev_50', 'Cinquenta Revisoes', 'Faca 50 revisoes', '⭐', 'revisoes', 'revisoes', 50, 200, 'dificil'),
('rev_75', 'Setenta e Cinco Revisoes', 'Faca 75 revisoes', '🌟', 'revisoes', 'revisoes', 75, 280, 'lendario'),
('rev_100', 'Cem Revisoes', 'Faca 100 revisoes', '🏆', 'revisoes', 'revisoes', 100, 400, 'lendario'),
('rev_150', 'Cento e Cinquenta Revisoes', 'Faca 150 revisoes', '👑', 'revisoes', 'revisoes', 150, 600, 'lendario'),
('rev_200', 'Duzentas Revisoes', 'Faca 200 revisoes', '💎', 'revisoes', 'revisoes', 200, 800, 'lendario');

-- =====================================================
-- CONQUISTAS DE METAS
-- =====================================================
INSERT INTO conquistas_base (conquista_key, titulo, descricao, icone, categoria, tipo_valor, meta, xp_bonus, dificuldade) VALUES
('meta_1', 'Primeira Meta', 'Complete 1 meta', '🎯', 'metas', 'metas', 1, 100, 'facil'),
('meta_2', 'Duas Metas', 'Complete 2 metas', '🏅', 'metas', 'metas', 2, 120, 'facil'),
('meta_3', 'Tres Metas', 'Complete 3 metas', '🥇', 'metas', 'metas', 3, 140, 'facil'),
('meta_4', 'Quatro Metas', 'Complete 4 metas', '🥈', 'metas', 'metas', 4, 160, 'facil'),
('meta_5', 'Cinco Metas', 'Complete 5 metas', '🥉', 'metas', 'metas', 5, 180, 'facil'),
('meta_6', 'Seis Metas', 'Complete 6 metas', '🎖️', 'metas', 'metas', 6, 200, 'medio'),
('meta_7', 'Sete Metas', 'Complete 7 metas', '🏆', 'metas', 'metas', 7, 220, 'medio'),
('meta_8', 'Oito Metas', 'Complete 8 metas', '⭐', 'metas', 'metas', 8, 240, 'medio'),
('meta_9', 'Nove Metas', 'Complete 9 metas', '🌟', 'metas', 'metas', 9, 260, 'medio'),
('meta_10', 'Dez Metas', 'Complete 10 metas', '👑', 'metas', 'metas', 10, 300, 'dificil'),
('meta_15', 'Quinze Metas', 'Complete 15 metas', '💎', 'metas', 'metas', , 'l15, 400endario'),
('meta_20', 'Vinte Metas', 'Complete 20 metas', '🔮', 'metas', 'metas', 20, 500, 'lendario');

-- =====================================================
-- CONQUISTAS DE TAXA DE ACERTO
-- =====================================================
INSERT INTO conquistas_base (conquista_key, titulo, descricao, icone, categoria, tipo_valor, meta, xp_bonus, dificuldade) VALUES
('taxa_30', 'Taxa Inicial', 'Atinga 30% de taxa', '📊', 'taxa', 'taxa', 30, 50, 'facil'),
('taxa_40', 'Taxa Basica', 'Atinga 40% de taxa', '📈', 'taxa', 'taxa', 40, 60, 'facil'),
('taxa_50', 'Meio Meio', 'Atinga 50% de taxa', '📉', 'taxa', 'taxa', 50, 70, 'facil'),
('taxa_55', 'Taxa Boa', 'Atinga 55% de taxa', '📊', 'taxa', 'taxa', 55, 80, 'facil'),
('taxa_60', 'Sessenta Por Cento', 'Atinga 60% de taxa', '📈', 'taxa', 'taxa', 60, 90, 'facil'),
('taxa_65', 'Sessenta e Cinco', 'Atinga 65% de taxa', '📉', 'taxa', 'taxa', 65, 100, 'medio'),
('taxa_70', 'Setenta Por Cento', 'Atinga 70% de taxa', '📊', 'taxa', 'taxa', 70, 120, 'medio'),
('taxa_75', 'Setenta e Cinco', 'Atinga 75% de taxa', '📈', 'taxa', 'taxa', 75, 140, 'medio'),
('taxa_80', 'Oitenta Por Cento', 'Atinga 80% de taxa', '🎯', 'taxa', 'taxa', 80, 180, 'dificil'),
('taxa_85', 'Oitenta e Cinco', 'Atinga 85% de taxa', '⭐', 'taxa', 'taxa', 85, 250, 'dificil'),
('taxa_90', 'Noventa Por Cento', 'Atinga 90% de taxa', '🌟', 'taxa', 'taxa', 90, 350, 'lendario'),
('taxa_95', 'Noventa e Cinco', 'Atinga 95% de taxa', '👑', 'taxa', 'taxa', 95, 500, 'lendario'),
('taxa_100', 'Perfeito', 'Atinga 100% de taxa', '💎', 'taxa', 'taxa', 100, 1000, 'lendario');

-- =====================================================
-- CONQUISTAS DE NÍVEL
-- =====================================================
INSERT INTO conquistas_base (conquista_key, titulo, descricao, icone, categoria, tipo_valor, meta, xp_bonus, dificuldade) VALUES
('nivel_1', 'Nivel 1', 'Chegue ao nivel 1', '1️⃣', 'nivel', 'nivel', 1, 10, 'facil'),
('nivel_2', 'Nivel 2', 'Chegue ao nivel 2', '2️⃣', 'nivel', 'nivel', 2, 20, 'facil'),
('nivel_3', 'Nivel 3', 'Chegue ao nivel 3', '3️⃣', 'nivel', 'nivel', 3, 30, 'facil'),
('nivel_4', 'Nivel 4', 'Chegue ao nivel 4', '4️⃣', 'nivel', 'nivel', 4, 40, 'facil'),
('nivel_5', 'Nivel 5', 'Chegue ao nivel 5', '5️⃣', 'nivel', 'nivel', 5, 50, 'facil'),
('nivel_6', 'Nivel 6', 'Chegue ao nivel 6', '6️⃣', 'nivel', 'nivel', 6, 70, 'medio'),
('nivel_7', 'Nivel 7', 'Chegue ao nivel 7', '7️⃣', 'nivel', 'nivel', 7, 90, 'medio'),
('nivel_8', 'Nivel 8', 'Chegue ao nivel 8', '8️⃣', 'nivel', 'nivel', 8, 120, 'medio'),
('nivel_9', 'Nivel 9', 'Chegue ao nivel 9', '9️⃣', 'nivel', 'nivel', 9, 150, 'medio'),
('nivel_10', 'Nivel 10', 'Chegue ao nivel 10', '🔟', 'nivel', 'nivel', 10, 200, 'dificil'),
('nivel_15', 'Nivel 15', 'Chegue ao nivel 15', '💎', 'nivel', 'nivel', 15, 400, 'lendario'),
('nivel_20', 'Nivel 20', 'Chegue ao nivel 20', '👑', 'nivel', 'nivel', 20, 800, 'lendario'),
('nivel_25', 'Nivel 25', 'Chegue ao nivel 25', '🏆', 'nivel', 'nivel', 25, 1200, 'lendario'),
('nivel_30', 'Nivel 30', 'Chegue ao nivel 30', '🌟', 'nivel', 'nivel', 30, 2000, 'lendario');

-- Criar índices para performance
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_conquistas_user ON user_conquistas(user_id);
CREATE INDEX idx_xp_history_user ON xp_history(user_id);
CREATE INDEX idx_conquistas_base_key ON conquistas_base(conquista_key);
