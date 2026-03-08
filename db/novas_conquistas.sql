-- =====================================================
-- NOVAS CONQUISTAS KMed - Sistema Completo
-- Criado em Mars 2026
-- =====================================================

-- =====================================================
-- CONQUISTAS DE HORAS DE ESTUDO (até 1000 horas)
-- =====================================================
INSERT INTO conquistas_base (conquista_key, titulo, descricao, icone, categoria, tipo_valor, meta, xp_bonus, dificuldade) VALUES
('hora_1', 'Primeira Hora', 'Estude por 1 hora', '⏰', 'horas', 'horas', 1, 10, 'facil'),
('hora_2', 'Duas Horas', 'Estude por 2 horas', '⏱️', 'horas', 'horas', 2, 12, 'facil'),
('hora_3', 'Tres Horas', 'Estude por 3 horas', '🕐', 'horas', 'horas', 3, 15, 'facil'),
('hora_4', 'Quatro Horas', 'Estude por 4 horas', '🕑', 'horas', 'horas', 4, 18, 'facil'),
('hora_5', 'Cinco Horas', 'Estude por 5 horas', '🕒', 'horas', 'horas', 5, 20, 'facil'),
('hora_6', 'Seis Horas', 'Estude por 6 horas', '🕓', 'horas', 'horas', 6, 22, 'facil'),
('hora_7', 'Sete Horas', 'Estude por 7 horas', '🕔', 'horas', 'horas', 7, 24, 'facil'),
('hora_8', 'Oito Horas', 'Estude por 8 horas', '🕕', 'horas', 'horas', 8, 26, 'facil'),
('hora_9', 'Nove Horas', 'Estude por 9 horas', '🕖', 'horas', 'horas', 9, 28, 'facil'),
('hora_10', 'Dez Horas', 'Estude por 10 horas', '🕗', 'horas', 'horas', 10, 30, 'facil'),
('hora_15', 'Quinze Horas', 'Estude por 15 horas', '🕘', 'horas', 'horas', 15, 40, 'facil'),
('hora_20', 'Vinte Horas', 'Estude por 20 horas', '🕙', 'horas', 'horas', 20, 50, 'facil'),
('hora_25', 'Vinte e Cinco Horas', 'Estude por 25 horas', '🕚', 'horas', 'horas', 25, 60, 'facil'),
('hora_30', 'Trinta Horas', 'Estude por 30 horas', '🕛', 'horas', 'horas', 30, 70, 'medio'),
('hora_35', 'Trinta e Cinco Horas', 'Estude por 35 horas', '📚', 'horas', 'horas', 35, 80, 'medio'),
('hora_40', 'Quarenta Horas', 'Estude por 40 horas', '📖', 'horas', 'horas', 40, 90, 'medio'),
('hora_45', 'Quarenta e Cinco Horas', 'Estude por 45 horas', '📕', 'horas', 'horas', 45, 100, 'medio'),
('hora_50', 'Cinquenta Horas', 'Estude por 50 horas', '📗', 'horas', 'horas', 50, 110, 'medio'),
('hora_60', 'Sessenta Horas', 'Estude por 60 horas', '📘', 'horas', 'horas', 60, 130, 'medio'),
('hora_70', 'Setenta Horas', 'Estude por 70 horas', '📙', 'horas', 'horas', 70, 150, 'medio'),
('hora_80', 'Oitenta Horas', 'Estude por 80 horas', '📓', 'horas', 'horas', 80, 170, 'dificil'),
('hora_90', 'Noventa Horas', 'Estude por 90 horas', '📔', 'horas', 'horas', 90, 190, 'dificil'),
('hora_100', 'Cem Horas', 'Estude por 100 horas', '🎓', 'horas', 'horas', 100, 210, 'dificil'),
('hora_125', 'Cento e Vinte e Cinco Horas', 'Estude por 125 horas', '🏅', 'horas', 'horas', 125, 250, 'dificil'),
('hora_150', 'Cento e Cinquenta Horas', 'Estude por 150 horas', '🥇', 'horas', 'horas', 150, 300, 'dificil'),
('hora_175', 'Cento e Setenta e Cinco Horas', 'Estude por 175 horas', '🥈', 'horas', 'horas', 175, 350, 'dificil'),
('hora_200', 'Duzentas Horas', 'Estude por 200 horas', '🥉', 'horas', 'horas', 200, 400, 'lendario'),
('hora_250', 'Duzentas e Cinquenta Horas', 'Estude por 250 horas', '⭐', 'horas', 'horas', 250, 500, 'lendario'),
('hora_300', 'Trezentas Horas', 'Estude por 300 horas', '🌟', 'horas', 'horas', 300, 600, 'lendario'),
('hora_350', 'Trezentas e Cinquenta Horas', 'Estude por 350 horas', '💫', 'horas', 'horas', 350, 700, 'lendario'),
('hora_400', 'Quatrocentas Horas', 'Estude por 400 horas', '✨', 'horas', 'horas', 400, 800, 'lendario'),
('hora_450', 'Quatrocentas e Cinquenta Horas', 'Estude por 450 horas', '🌠', 'horas', 'horas', 450, 900, 'lendario'),
('hora_500', 'Quinhentas Horas', 'Estude por 500 horas', '🏆', 'horas', 'horas', 500, 1000, 'lendario'),
('hora_600', 'Seiscentas Horas', 'Estude por 600 horas', '👑', 'horas', 'horas', 600, 1200, 'lendario'),
('hora_700', 'Setecentas Horas', 'Estude por 700 horas', '💎', 'horas', 'horas', 700, 1400, 'lendario'),
('hora_800', 'Oitocentas Horas', 'Estude por 800 horas', '🔮', 'horas', 'horas', 800, 1600, 'lendario'),
('hora_900', 'Novecentas Horas', 'Estude por 900 horas', '🎖️', 'horas', 'horas', 900, 1800, 'lendario'),
('hora_1000', 'Mil Horas', 'Estude por 1000 horas', '🏅', 'horas', 'horas', 1000, 2000, 'lendario');

-- =====================================================
-- CONQUISTAS DE QUESTOES RESPONDIDAS (ate 20000)
-- =====================================================
INSERT INTO conquistas_base (conquista_key, titulo, descricao, icone, categoria, tipo_valor, meta, xp_bonus, dificuldade) VALUES
('q_10', 'Dez Questoes', 'Responda 10 questoes', '❓', 'questoes', 'questoes', 10, 10, 'facil'),
('q_25', 'Vinte e Cinco Questoes', 'Responda 25 questoes', '❔', 'questoes', 'questoes', 25, 15, 'facil'),
('q_50', 'Cinquenta Questoes', 'Responda 50 questoes', '❕', 'questoes', 'questoes', 50, 20, 'facil'),
('q_75', 'Setenta e Cinco Questoes', 'Responda 75 questoes', '📝', 'questoes', 'questoes', 75, 25, 'facil'),
('q_100', 'Cem Questoes', 'Responda 100 questoes', '📋', 'questoes', 'questoes', 100, 30, 'facil'),
('q_150', 'Cento e Cinquenta Questoes', 'Responda 150 questoes', '📄', 'questoes', 'questoes', 150, 40, 'facil'),
('q_200', 'Duzentas Questoes', 'Responda 200 questoes', '📃', 'questoes', 'questoes', 200, 50, 'facil'),
('q_250', 'Duzentas e Cinquenta Questoes', 'Responda 250 questoes', '📜', 'questoes', 'questoes', 250, 60, 'facil'),
('q_300', 'Trezentas Questoes', 'Responda 300 questoes', '📑', 'questoes', 'questoes', 300, 70, 'facil'),
('q_350', 'Trezentas e Cinquenta Questoes', 'Responda 350 questoes', '🗂️', 'questoes', 'questoes', 350, 80, 'facil'),
('q_400', 'Quatrocentas Questoes', 'Responda 400 questoes', '📁', 'questoes', 'questoes', 400, 90, 'facil'),
('q_450', 'Quatrocentas e Cinquenta Questoes', 'Responda 450 questoes', '📂', 'questoes', 'questoes', 450, 100, 'medio'),
('q_500', 'Quinhentas Questoes', 'Responda 500 questoes', '📤', 'questoes', 'questoes', 500, 110, 'medio'),
('q_600', 'Seiscentas Questoes', 'Responda 600 questoes', '📥', 'questoes', 'questoes', 600, 130, 'medio'),
('q_700', 'Setecentas Questoes', 'Responda 700 questoes', '📧', 'questoes', 'questoes', 700, 150, 'medio'),
('q_800', 'Oitocentas Questoes', 'Responda 800 questoes', '📩', 'questoes', 'questoes', 800, 170, 'medio'),
('q_900', 'Novecentas Questoes', 'Responda 900 questoes', '📨', 'questoes', 'questoes', 900, 190, 'medio'),
('q_1000', 'Mil Questoes', 'Responda 1000 questoes', '✏️', 'questoes', 'questoes', 1000, 210, 'dificil'),
('q_1250', 'Mil Duzentas e Cinquenta Questoes', 'Responda 1250 questoes', '🖊️', 'questoes', 'questoes', 1250, 260, 'dificil'),
('q_1500', 'Mil e Quinhentas Questoes', 'Responda 1500 questoes', '🖋️', 'questoes', 'questoes', 1500, 320, 'dificil'),
('q_1750', 'Mil Setecentas e Cinquenta Questoes', 'Responda 1750 questoes', '✒️', 'questoes', 'questoes', 1750, 380, 'dificil'),
('q_2000', 'Duas Mil Questoes', 'Responda 2000 questoes', '🔎', 'questoes', 'questoes', 2000, 450, 'dificil'),
('q_2500', 'Duas Mil e Quinhentas Questoes', 'Responda 2500 questoes', '🔍', 'questoes', 'questoes', 2500, 550, 'lendario'),
('q_3000', 'Tres Mil Questoes', 'Responda 3000 questoes', '🔬', 'questoes', 'questoes', 3000, 650, 'lendario'),
('q_3500', 'Tres Mil e Quinhentas Questoes', 'Responda 3500 questoes', '🔭', 'questoes', 'questoes', 3500, 750, 'lendario'),
('q_4000', 'Quatro Mil Questoes', 'Responda 4000 questoes', '🔮', 'questoes', 'questoes', 4000, 850, 'lendario'),
('q_4500', 'Quatro Mil e Quinhentas Questoes', 'Responda 4500 questoes', '💎', 'questoes', 'questoes', 4500, 950, 'lendario'),
('q_5000', 'Cinco Mil Questoes', 'Responda 5000 questoes', '⭐', 'questoes', 'questoes', 5000, 1050, 'lendario'),
('q_6000', 'Seis Mil Questoes', 'Responda 6000 questoes', '🌟', 'questoes', 'questoes', 6000, 1250, 'lendario'),
('q_7000', 'Sete Mil Questoes', 'Responda 7000 questoes', '💫', 'questoes', 'questoes', 7000, 1450, 'lendario'),
('q_8000', 'Oito Mil Questoes', 'Responda 8000 questoes', '✨', 'questoes', 'questoes', 8000, 1650, 'lendario'),
('q_9000', 'Nove Mil Questoes', 'Responda 9000 questoes', '🌠', 'questoes', 'questoes', 9000, 1850, 'lendario'),
('q_10000', 'Dez Mil Questoes', 'Responda 10000 questoes', '🏆', 'questoes', 'questoes', 10000, 2000, 'lendario'),
('q_12000', 'Doze Mil Questoes', 'Responda 12000 questoes', '👑', 'questoes', 'questoes', 12000, 2400, 'lendario'),
('q_14000', 'Quatorze Mil Questoes', 'Responda 14000 questoes', '🎖️', 'questoes', 'questoes', 14000, 2800, 'lendario'),
('q_16000', 'Dezesseis Mil Questoes', 'Responda 16000 questoes', '🏅', 'questoes', 'questoes', 16000, 3200, 'lendario'),
('q_18000', 'Dezoito Mil Questoes', 'Responda 18000 questoes', '🥇', 'questoes', 'questoes', 18000, 3600, 'lendario'),
('q_20000', 'Vinte Mil Questoes', 'Responda 20000 questoes', '🥇', 'questoes', 'questoes', 20000, 4000, 'lendario');

-- =====================================================
-- CONQUISTAS DE ACERTOS (ate 15000)
-- =====================================================
INSERT INTO conquistas_base (conquista_key, titulo, descricao, icone, categoria, tipo_valor, meta, xp_bonus, dificuldade) VALUES
('acerto_10', 'Dez Acertos', 'Acertar 10 questoes', '✅', 'acertos', 'acertos', 10, 15, 'facil'),
('acerto_25', 'Vinte e Cinco Acertos', 'Acertar 25 questoes', '✅', 'acertos', 'acertos', 25, 20, 'facil'),
('acerto_50', 'Cinquenta Acertos', 'Acertar 50 questoes', '✅', 'acertos', 'acertos', 50, 30, 'facil'),
('acerto_75', 'Setenta e Cinco Acertos', 'Acertar 75 questoes', '✔️', 'acertos', 'acertos', 75, 40, 'facil'),
('acerto_100', 'Cem Acertos', 'Acertar 100 questoes', '✔️', 'acertos', 'acertos', 100, 50, 'facil'),
('acerto_150', 'Cento e Cinquenta Acertos', 'Acertar 150 questoes', '✔️', 'acertos', 'acertos', 150, 70, 'facil'),
('acerto_200', 'Duzentos Acertos', 'Acertar 200 questoes', '☑️', 'acertos', 'acertos', 200, 90, 'facil'),
('acerto_250', 'Duzentos e Cinquenta Acertos', 'Acertar 250 questoes', '☑️', 'acertos', 'acertos', 250, 110, 'facil'),
('acerto_300', 'Trezentos Acertos', 'Acertar 300 questoes', '☑️', 'acertos', 'acertos', 300, 130, 'medio'),
('acerto_350', 'Trezentos e Cinquenta Acertos', 'Acertar 350 questoes', '🔘', 'acertos', 'acertos', 350, 150, 'medio'),
('acerto_400', 'Quatrocentos Acertos', 'Acertar 400 questoes', '🔘', 'acertos', 'acertos', 400, 170, 'medio'),
('acerto_450', 'Quatrocentos e Cinquenta Acertos', 'Acertar 450 questoes', '⚪', 'acertos', 'acertos', 450, 190, 'medio'),
('acerto_500', 'Quinhentos Acertos', 'Acertar 500 questoes', '⚫', 'acertos', 'acertos', 500, 210, 'medio'),
('acerto_600', 'Seiscentos Acertos', 'Acertar 600 questoes', '🔴', 'acertos', 'acertos', 600, 250, 'dificil'),
('acerto_700', 'Setecentos Acertos', 'Acertar 700 questoes', '🔵', 'acertos', 'acertos', 700, 290, 'dificil'),
('acerto_800', 'Oitocentos Acertos', 'Acertar 800 questoes', '🟢', 'acertos', 'acertos', 800, 330, 'dificil'),
('acerto_900', 'Novecentos Acertos', 'Acertar 900 questoes', '🟡', 'acertos', 'acertos', 900, 370, 'dificil'),
('acerto_1000', 'Mil Acertos', 'Acertar 1000 questoes', '🟠', 'acertos', 'acertos', 1000, 420, 'dificil'),
('acerto_1250', 'Mil Duzentos e Cinquenta Acertos', 'Acertar 1250 questoes', '🟣', 'acertos', 'acertos', 1250, 520, 'lendario'),
('acerto_1500', 'Mil e Quinhentos Acertos', 'Acertar 1500 questoes', '🟤', 'acertos', 'acertos', 1500, 620, 'lendario'),
('acerto_1750', 'Mil Setecentos e Cinquenta Acertos', 'Acertar 1750 questoes', '⚪', 'acertos', 'acertos', 1750, 720, 'lendario'),
('acerto_2000', 'Dois Mil Acertos', 'Acertar 2000 questoes', '⬜', 'acertos', 'acertos', 2000, 820, 'lendario'),
('acerto_2500', 'Dois Mil e Quinhentos Acertos', 'Acertar 2500 questoes', '🌈', 'acertos', 'acertos', 2500, 1020, 'lendario'),
('acerto_3000', 'Tres Mil Acertos', 'Acertar 3000 questoes', '🌤️', 'acertos', 'acertos', 3000, 1220, 'lendario'),
('acerto_3500', 'Tres Mil e Quinhentos Acertos', 'Acertar 3500 questoes', '☀️', 'acertos', 'acertos', 3500, 1420, 'lendario'),
('acerto_4000', 'Quatro Mil Acertos', 'Acertar 4000 questoes', '🌞', 'acertos', 'acertos', 4000, 1620, 'lendario'),
('acerto_4500', 'Quatro Mil e Quinhentos Acertos', 'Acertar 4500 questoes', '🌝', 'acertos', 'acertos', 4500, 1820, 'lendario'),
('acerto_5000', 'Cinco Mil Acertos', 'Acertar 5000 questoes', '🌟', 'acertos', 'acertos', 5000, 2000, 'lendario'),
('acerto_6000', 'Seis Mil Acertos', 'Acertar 6000 questoes', '💫', 'acertos', 'acertos', 6000, 2400, 'lendario'),
('acerto_7000', 'Sete Mil Acertos', 'Acertar 7000 questoes', '✨', 'acertos', 'acertos', 7000, 2800, 'lendario'),
('acerto_8000', 'Oito Mil Acertos', 'Acertar 8000 questoes', '⭐', 'acertos', 'acertos', 8000, 3200, 'lendario'),
('acerto_9000', 'Nove Mil Acertos', 'Acertar 9000 questoes', '🌠', 'acertos', 'acertos', 9000, 3600, 'lendario'),
('acerto_10000', 'Dez Mil Acertos', 'Acertar 10000 questoes', '🏆', 'acertos', 'acertos', 10000, 4000, 'lendario'),
('acerto_12000', 'Doze Mil Acertos', 'Acertar 12000 questoes', '👑', 'acertos', 'acertos', 12000, 4800, 'lendario'),
('acerto_15000', 'Quinze Mil Acertos', 'Acertar 15000 questoes', '💎', 'acertos', 'acertos', 15000, 6000, 'lendario');

-- =====================================================
-- CONQUISTAS DE MATERIAS ESTUDADAS
-- =====================================================
INSERT INTO conquistas_base (conquista_key, titulo, descricao, icone, categoria, tipo_valor, meta, xp_bonus, dificuldade) VALUES
('materia_1', 'Primeira Materia', 'Estude 1 materia', '📚', 'materias', 'materias', 1, 20, 'facil'),
('materia_2', 'Duas Materias', 'Estude 2 materias', '📕', 'materias', 'materias', 2, 25, 'facil'),
('materia_3', 'Tres Materias', 'Estude 3 materias', '📗', 'materias', 'materias', 3, 30, 'facil'),
('materia_4', 'Quatro Materias', 'Estude 4 materias', '📘', 'materias', 'materias', 4, 35, 'facil'),
('materia_5', 'Cinco Materias', 'Estude 5 materias', '📙', 'materias', 'materias', 5, 40, 'facil'),
('materia_6', 'Seis Materias', 'Estude 6 materias', '📓', 'materias', 'materias', 6, 45, 'facil'),
('materia_7', 'Sete Materias', 'Estude 7 materias', '📔', 'materias', 'materias', 7, 50, 'facil'),
('materia_8', 'Oito Materias', 'Estude 8 materias', '📎', 'materias', 'materias', 8, 55, 'facil'),
('materia_9', 'Nove Materias', 'Estude 9 materias', '📏', 'materias', 'materias', 9, 60, 'facil'),
('materia_10', 'Dez Materias', 'Estude 10 materias', '📐', 'materias', 'materias', 10, 70, 'medio'),
('materia_12', 'Doze Materias', 'Estude 12 materias', '📏', 'materias', 'materias', 12, 85, 'medio'),
('materia_15', 'Quinze Materias', 'Estude 15 materias', '🧮', 'materias', 'materias', 15, 100, 'medio'),
('materia_18', 'Dezoito Materias', 'Estude 18 materias', '⚗️', 'materias', 'materias', 18, 120, 'dificil'),
('materia_20', 'Vinte Materias', 'Estude 20 materias', '🧬', 'materias', 'materias', 20, 150, 'dificil'),
('materia_25', 'Vinte e Cinco Materias', 'Estude 25 materias', '🔬', 'materias', 'materias', 25, 200, 'lendario'),
('materia_30', 'Trinta Materias', 'Estude 30 materias', '🧭', 'materias', 'materias', 30, 300, 'lendario'),
('materia_40', 'Quarenta Materias', 'Estude 40 materias', '🌍', 'materias', 'materias', 40, 400, 'lendario'),
('materia_50', 'Cinquenta Materias', 'Estude 50 materias', '🌎', 'materias', 'materias', 50, 500, 'lendario');

-- =====================================================
-- CONQUISTAS DE TOPICOS ESTUDADOS
-- =====================================================
INSERT INTO conquistas_base (conquista_key, titulo, descricao, icone, categoria, tipo_valor, meta, xp_bonus, dificuldade) VALUES
('topico_1', 'Primeiro Topico', 'Estude 1 topico', '📌', 'topicos', 'topicos', 1, 15, 'facil'),
('topico_5', 'Cinco Topicos', 'Estude 5 topicos', '📍', 'topicos', 'topicos', 5, 25, 'facil'),
('topico_10', 'Dez Topicos', 'Estude 10 topicos', '🗂️', 'topicos', 'topicos', 10, 40, 'facil'),
('topico_15', 'Quinze Topicos', 'Estude 15 topicos', '📁', 'topicos', 'topicos', 15, 55, 'facil'),
('topico_20', 'Vinte Topicos', 'Estude 20 topicos', '📂', 'topicos', 'topicos', 20, 70, 'facil'),
('topico_25', 'Vinte e Cinco Topicos', 'Estude 25 topicos', '🗃️', 'topicos', 'topicos', 25, 85, 'facil'),
('topico_30', 'Trinta Topicos', 'Estude 30 topicos', '🗄️', 'topicos', 'topicos', 30, 100, 'medio'),
('topico_40', 'Quarenta Topicos', 'Estude 40 topicos', '📋', 'topicos', 'topicos', 40, 130, 'medio'),
('topico_50', 'Cinquenta Topicos', 'Estude 50 topicos', '📑', 'topicos', 'topicos', 50, 160, 'medio'),
('topico_60', 'Sessenta Topicos', 'Estude 60 topicos', '🗞️', 'topicos', 'topicos', 60, 190, 'medio'),
('topico_70', 'Setenta Topicos', 'Estude 70 topicos', '📰', 'topicos', 'topicos', 70, 220, 'dificil'),
('topico_80', 'Oitenta Topicos', 'Estude 80 topicos', '📓', 'topicos', 'topicos', 80, 250, 'dificil'),
('topico_90', 'Noventa Topicos', 'Estude 90 topicos', '📔', 'topicos', 'topicos', 90, 280, 'dificil'),
('topico_100', 'Cem Topicos', 'Estude 100 topicos', '📚', 'topicos', 'topicos', 100, 320, 'dificil'),
('topico_125', 'Cento e Vinte e Cinco Topicos', 'Estude 125 topicos', '🏅', 'topicos', 'topicos', 125, 400, 'lendario'),
('topico_150', 'Cento e Cinquenta Topicos', 'Estude 150 topicos', '🥇', 'topicos', 'topicos', 150, 480, 'lendario'),
('topico_175', 'Cento e Setenta e Cinco Topicos', 'Estude 175 topicos', '🥈', 'topicos', 'topicos', 175, 560, 'lendario'),
('topico_200', 'Duzentos Topicos', 'Estude 200 topicos', '🥉', 'topicos', 'topicos', 200, 640, 'lendario'),
('topico_250', 'Duzentos e Cinquenta Topicos', 'Estude 250 topicos', '⭐', 'topicos', 'topicos', 250, 800, 'lendario'),
('topico_300', 'Trezentos Topicos', 'Estude 300 topicos', '🌟', 'topicos', 'topicos', 300, 1000, 'lendario');

-- =====================================================
-- CONQUISTAS DE BLOCOS DE SIMULADO
-- =====================================================
INSERT INTO conquistas_base (conquista_key, titulo, descricao, icone, categoria, tipo_valor, meta, xp_bonus, dificuldade) VALUES
('bloco_1', 'Primeiro Bloco', 'Complete 1 bloco de simulado', '📝', 'blocos', 'blocos', 1, 30, 'facil'),
('bloco_2', 'Dois Blocos', 'Complete 2 blocos de simulado', '📋', 'blocos', 'blocos', 2, 35, 'facil'),
('bloco_3', 'Tres Blocos', 'Complete 3 blocos de simulado', '📄', 'blocos', 'blocos', 3, 40, 'facil'),
('bloco_4', 'Quatro Blocos', 'Complete 4 blocos de simulado', '📃', 'blocos', 'blocos', 4, 45, 'facil'),
('bloco_5', 'Cinco Blocos', 'Complete 5 blocos de simulado', '📜', 'blocos', 'blocos', 5, 50, 'facil'),
('bloco_6', 'Seis Blocos', 'Complete 6 blocos de simulado', '📑', 'blocos', 'blocos', 6, 55, 'facil'),
('bloco_7', 'Sete Blocos', 'Complete 7 blocos de simulado', '📰', 'blocos', 'blocos', 7, 60, 'facil'),
('bloco_8', 'Oito Blocos', 'Complete 8 blocos de simulado', '🗞️', 'blocos', 'blocos', 8, 65, 'facil'),
('bloco_9', 'Nove Blocos', 'Complete 9 blocos de simulado', '📰', 'blocos', 'blocos', 9, 70, 'facil'),
('bloco_10', 'Dez Blocos', 'Complete 10 blocos de simulado', '📚', 'blocos', 'blocos', 10, 80, 'facil'),
('bloco_15', 'Quinze Blocos', 'Complete 15 blocos de simulado', '📖', 'blocos', 'blocos', 15, 100, 'medio'),
('bloco_20', 'Vinte Blocos', 'Complete 20 blocos de simulado', '📕', 'blocos', 'blocos', 20, 130, 'medio'),
('bloco_25', 'Vinte e Cinco Blocos', 'Complete 25 blocos de simulado', '📗', 'blocos', 'blocos', 25, 160, 'medio'),
('bloco_30', 'Trinta Blocos', 'Complete 30 blocos de simulado', '📘', 'blocos', 'blocos', 30, 190, 'medio'),
('bloco_35', 'Trinta e Cinco Blocos', 'Complete 35 blocos de simulado', '📙', 'blocos', 'blocos', 35, 220, 'dificil'),
('bloco_40', 'Quarenta Blocos', 'Complete 40 blocos de simulado', '📓', 'blocos', 'blocos', 40, 250, 'dificil'),
('bloco_45', 'Quarenta e Cinco Blocos', 'Complete 45 blocos de simulado', '📔', 'blocos', 'blocos', 45, 280, 'dificil'),
('bloco_50', 'Cinquenta Blocos', 'Complete 50 blocos de simulado', '📎', 'blocos', 'blocos', 50, 320, 'dificil'),
('bloco_60', 'Sessenta Blocos', 'Complete 60 blocos de simulado', '🖇️', 'blocos', 'blocos', 60, 380, 'lendario'),
('bloco_70', 'Setenta Blocos', 'Complete 70 blocos de simulado', '📌', 'blocos', 'blocos', 70, 440, 'lendario'),
('bloco_80', 'Oitenta Blocos', 'Complete 80 blocos de simulado', '📍', 'blocos', 'blocos', 80, 500, 'lendario'),
('bloco_90', 'Noventa Blocos', 'Complete 90 blocos de simulado', '🏷️', 'blocos', 'blocos', 90, 560, 'lendario'),
('bloco_100', 'Cem Blocos', 'Complete 100 blocos de simulado', '🏅', 'blocos', 'blocos', 100, 630, 'lendario'),
('bloco_125', 'Cento e Vinte e Cinco Blocos', 'Complete 125 blocos de simulado', '🥇', 'blocos', 'blocos', 125, 780, 'lendario'),
('bloco_150', 'Cento e Cinquenta Blocos', 'Complete 150 blocos de simulado', '🥈', 'blocos', 'blocos', 150, 940, 'lendario'),
('bloco_175', 'Cento e Setenta e Cinco Blocos', 'Complete 175 blocos de simulado', '🥉', 'blocos', 'blocos', 175, 1100, 'lendario'),
('bloco_200', 'Duzentos Blocos', 'Complete 200 blocos de simulado', '⭐', 'blocos', 'blocos', 200, 1250, 'lendario');

-- =====================================================
-- CONQUISTAS DE ERROS REVISADOS
-- =====================================================
INSERT INTO conquistas_base (conquista_key, titulo, descricao, icone, categoria, tipo_valor, meta, xp_bonus, dificuldade) VALUES
('erro_rev_1', 'Primeiro Erro Revisado', 'Revise 1 erro', '🔧', 'erros_revisados', 'erros_revisados', 1, 20, 'facil'),
('erro_rev_3', 'Tres Erros Revisados', 'Revise 3 erros', '🛠️', 'erros_revisados', 'erros_revisados', 3, 30, 'facil'),
('erro_rev_5', 'Cinco Erros Revisados', 'Revise 5 erros', '🔩', 'erros_revisados', 'erros_revisados', 5, 40, 'facil'),
('erro_rev_7', 'Sete Erros Revisados', 'Revise 7 erros', '⚙️', 'erros_revisados', 'erros_revisados', 7, 50, 'facil'),
('erro_rev_10', 'Dez Erros Revisados', 'Revise 10 erros', '🔨', 'erros_revisados', 'erros_revisados', 10, 65, 'facil'),
('erro_rev_15', 'Quinze Erros Revisados', 'Revise 15 erros', '🔧', 'erros_revisados', 'erros_revisados', 15, 85, 'facil'),
('erro_rev_20', 'Vinte Erros Revisados', 'Revise 20 erros', '🪛', 'erros_revisados', 'erros_revisados', 20, 100, 'facil'),
('erro_rev_25', 'Vinte e Cinco Erros Revisados', 'Revise 25 erros', '🔨', 'erros_revisados', 'erros_revisados', 25, 120, 'medio'),
('erro_rev_30', 'Trinta Erros Revisados', 'Revise 30 erros', '🛠️', 'erros_revisados', 'erros_revisados', 30, 140, 'medio'),
('erro_rev_40', 'Quarenta Erros Revisados', 'Revise 40 erros', '🔩', 'erros_revisados', 'erros_revisados', 40, 180, 'medio'),
('erro_rev_50', 'Cinquenta Erros Revisados', 'Revise 50 erros', '⚙️', 'erros_revisados', 'erros_revisados', 50, 220, 'medio'),
('erro_rev_60', 'Sessenta Erros Revisados', 'Revise 60 erros', '🔧', 'erros_revisados', 'erros_revisados', 60, 260, 'dificil'),
('erro_rev_70', 'Setenta Erros Revisados', 'Revise 70 erros', '🪛', 'erros_revisados', 'erros_revisados', 70, 300, 'dificil'),
('erro_rev_80', 'Oitenta Erros Revisados', 'Revise 80 erros', '🔨', 'erros_revisados', 'erros_revisados', 80, 340, 'dificil'),
('erro_rev_90', 'Noventa Erros Revisados', 'Revise 90 erros', '🛠️', 'erros_revisados', 'erros_revisados', 90, 380, 'dificil'),
('erro_rev_100', 'Cem Erros Revisados', 'Revise 100 erros', '🔩', 'erros_revisados', 'erros_revisados', 100, 420, 'dificil'),
('erro_rev_125', 'Cento e Vinte e Cinco Erros Revisados', 'Revise 125 erros', '⚙️', 'erros_revisados', 'erros_revisados', 125, 520, 'lendario'),
('erro_rev_150', 'Cento e Cinquenta Erros Revisados', 'Revise 150 erros', '🏅', 'erros_revisados', 'erros_revisados', 150, 630, 'lendario'),
('erro_rev_175', 'Cento e Setenta e Cinco Erros Revisados', 'Revise 175 erros', '🥇', 'erros_revisados', 'erros_revisados', 175, 740, 'lendario'),
('erro_rev_200', 'Duzentos Erros Revisados', 'Revise 200 erros', '⭐', 'erros_revisados', 'erros_revisados', 200, 850, 'lendario'),
('erro_rev_250', 'Duzentos e Cinquenta Erros Revisados', 'Revise 250 erros', '🌟', 'erros_revisados', 'erros_revisados', 250, 1050, 'lendario'),
('erro_rev_300', 'Trezentos Erros Revisados', 'Revise 300 erros', '🏆', 'erros_revisados', 'erros_revisados', 300, 1250, 'lendario'),
('erro_rev_400', 'Quatrocentos Erros Revisados', 'Revise 400 erros', '👑', 'erros_revisados', 'erros_revisados', 400, 1650, 'lendario'),
('erro_rev_500', 'Quinhentos Erros Revisados', 'Revise 500 erros', '💎', 'erros_revisados', 'erros_revisados', 500, 2050, 'lendario');

-- =====================================================
-- CONQUISTAS FIM DE SEMANA (WEEKEND WARRIOR)
-- =====================================================
INSERT INTO conquistas_base (conquista_key, titulo, descricao, icone, categoria, tipo_valor, meta, xp_bonus, dificuldade) VALUES
('fds_1', 'Primeiro Fim de Semana', 'Estude em 1 fim de semana', '🎉', 'fds', 'fds', 1, 25, 'facil'),
('fds_2', 'Dois Fins de Semana', 'Estude em 2 fins de semana', '🎊', 'fds', 'fds', 2, 30, 'facil'),
('fds_3', 'Tres Fins de Semana', 'Estude em 3 fins de semana', '🎈', 'fds', 'fds', 3, 35, 'facil'),
('fds_4', 'Quatro Fins de Semana', 'Estude em 4 fins de semana', '🎂', 'fds', 'fds', 4, 40, 'facil'),
('fds_5', 'Cinco Fins de Semana', 'Estude em 5 fins de semana', '🥳', 'fds', 'fds', 5, 45, 'facil'),
('fds_6', 'Seis Fins de Semana', 'Estude em 6 fins de semana', '🥲', 'fds', 'fds', 6, 50, 'facil'),
('fds_7', 'Sete Fins de Semana', 'Estude em 7 fins de semana', '😎', 'fds', 'fds', 7, 55, 'facil'),
('fds_8', 'Oito Fins de Semana', 'Estude em 8 fins de semana', '🤓', 'fds', 'fds', 8, 60, 'facil'),
('fds_9', 'Nove Fins de Semana', 'Estude em 9 fins de semana', '😄', 'fds', 'fds', 9, 65, 'facil'),
('fds_10', 'Dez Fins de Semana', 'Estude em 10 fins de semana', '😁', 'fds', 'fds', 10, 75, 'facil'),
('fds_12', 'Doze Fins de Semana', 'Estude em 12 fins de semana', '😊', 'fds', 'fds', 12, 90, 'medio'),
('fds_15', 'Quinze Fins de Semana', 'Estude em 15 fins de semana', '🙂', 'fds', 'fds', 15, 110, 'medio'),
('fds_18', 'Dezoito Fins de Semana', 'Estude em 18 fins de semana', '😀', 'fds', 'fds', 18, 130, 'medio'),
('fds_20', 'Vinte Fins de Semana', 'Estude em 20 fins de semana', '😃', 'fds', 'fds', 20, 150, 'medio'),
('fds_25', 'Vinte e Cinco Fins de Semana', 'Estude em 25 fins de semana', '😸', 'fds', 'fds', 25, 190, 'dificil'),
('fds_30', 'Trinta Fins de Semana', 'Estude em 30 fins de semana', '😹', 'fds', 'fds', 30, 230, 'dificil'),
('fds_35', 'Trinta e Cinco Fins de Semana', 'Estude em 35 fins de semana', '😻', 'fds', 'fds', 35, 270, 'dificil'),
('fds_40', 'Quarenta Fins de Semana', 'Estude em 40 fins de semana', '😼', 'fds', 'fds', 40, 310, 'dificil'),
('fds_45', 'Quarenta e Cinco Fins de Semana', 'Estude em 45 fins de semana', '😽', 'fds', 'fds', 45, 350, 'dificil'),
('fds_50', 'Cinquenta Fins de Semana', 'Estude em 50 fins de semana', '🙀', 'fds', 'fds', 50, 400, 'lendario'),
('fds_60', 'Sessenta Fins de Semana', 'Estude em 60 fins de semana', '😿', 'fds', 'fds', 60, 480, 'lendario'),
('fds_70', 'Setenta Fins de Semana', 'Estude em 70 fins de semana', '😾', 'fds', 'fds', 70, 560, 'lendario'),
('fds_80', 'Oitenta Fins de Semana', 'Estude em 80 fins de semana', '🙀', 'fds', 'fds', 80, 640, 'lendario'),
('fds_90', 'Noventa Fins de Semana', 'Estude em 90 fins de semana', '😿', 'fds', 'fds', 90, 720, 'lendario'),
('fds_100', 'Cem Fins de Semana', 'Estude em 100 fins de semana', '🏆', 'fds', 'fds', 100, 800, 'lendario');

-- =====================================================
-- CONQUISTAS DE SESSOES MARATONA (4+ horas)
-- =====================================================
INSERT INTO conquistas_base (conquista_key, titulo, descricao, icone, categoria, tipo_valor, meta, xp_bonus, dificuldade) VALUES
('maratona_1', 'Primeira Maratona', 'Faca 1 sessao de 4+ horas', '🏃', 'maratonas', 'maratonas', 1, 40, 'facil'),
('maratona_2', 'Duas Maratonas', 'Faca 2 sessoes de 4+ horas', '🏃‍♂️', 'maratonas', 'maratonas', 2, 50, 'facil'),
('maratona_3', 'Tres Maratonas', 'Faca 3 sessoes de 4+ horas', '🏃‍♀️', 'maratonas', 'maratonas', 3, 60, 'facil'),
('maratona_4', 'Quatro Maratonas', 'Faca 4 sessoes de 4+ horas', '🏃🤑', 'maratonas', 'maratonas', 4, 70, 'facil'),
('maratona_5', 'Cinco Maratonas', 'Faca 5 sessoes de 4+ horas', '💨', 'maratonas', 'maratonas', 5, 80, 'facil'),
('maratona_6', 'Seis Maratonas', 'Faca 6 sessoes de 4+ horas', '💪', 'maratonas', 'maratonas', 6, 90, 'facil'),
('maratona_7', 'Sete Maratonas', 'Faca 7 sessoes de 4+ horas', '💪🏻', 'maratonas', 'maratonas', 7, 100, 'facil'),
('maratona_8', 'Oito Maratonas', 'Faca 8 sessoes de 4+ horas', '💪🏼', 'maratonas', 'maratonas', 8, 110, 'medio'),
('maratona_9', 'Nove Maratonas', 'Faca 9 sessoes de 4+ horas', '💪🏽', 'maratonas', 'maratonas', 9, 120, 'medio'),
('maratona_10', 'Dez Maratonas', 'Faca 10 sessoes de 4+ horas', '💪🏾', 'maratonas', 'maratonas', 10, 140, 'medio'),
('maratona_12', 'Doze Maratonas', 'Faca 12 sessoes de 4+ horas', '💪🏿', 'maratonas', 'maratonas', 12, 170, 'medio'),
('maratona_15', 'Quinze Maratonas', 'Faca 15 sessoes de 4+ horas', '🦾', 'maratonas', 'maratonas', 15, 210, 'dificil'),
('maratona_18', 'Dezoito Maratonas', 'Faca 18 sessoes de 4+ horas', '🦿', 'maratonas', 'maratonas', 18, 250, 'dificil'),
('maratona_20', 'Vinte Maratonas', 'Faca 20 sessoes de 4+ horas', '🦵', 'maratonas', 'maratonas', 20, 290, 'dificil'),
('maratona_25', 'Vinte e Cinco Maratonas', 'Faca 25 sessoes de 4+ horas', '🦶', 'maratonas', 'maratonas', 25, 360, 'lendario'),
('maratona_30', 'Trinta Maratonas', 'Faca 30 sessoes de 4+ horas', '👟', 'maratonas', 'maratonas', 30, 430, 'lendario'),
('maratona_40', 'Quarenta Maratonas', 'Faca 40 sessoes de 4+ horas', '👟', 'maratonas', 'maratonas', 40, 570, 'lendario'),
('maratona_50', 'Cinquenta Maratonas', 'Faca 50 sessoes de 4+ horas', '🏅', 'maratonas', 'maratonas', 50, 710, 'lendario'),
('maratona_75', 'Setenta e Cinco Maratonas', 'Faca 75 sessoes de 4+ horas', '🥇', 'maratonas', 'maratonas', 75, 1050, 'lendario'),
('maratona_100', 'Cem Maratonas', 'Faca 100 sessoes de 4+ horas', '🏆', 'maratonas', 'maratonas', 100, 1400, 'lendario');

-- =====================================================
-- CONQUISTAS DE PERFEITAO (100% acerto em uma sessao)
-- =====================================================
INSERT INTO conquistas_base (conquista_key, titulo, descricao, icone, categoria, tipo_valor, meta, xp_bonus, dificuldade) VALUES
('perfeito_1', 'Primeira Perfekta', 'Acertar 100% em 1 sessao', '🎯', 'perfeitos', 'perfeitos', 1, 50, 'facil'),
('perfeito_2', 'Duas Perfektas', 'Acertar 100% em 2 sessoes', '🎯', 'perfeitos', 'perfeitos', 2, 70, 'facil'),
('perfeito_3', 'Tres Perfektas', 'Acertar 100% em 3 sessoes', '🎯', 'perfeitos', 'perfeitos', 3, 90, 'facil'),
('perfeito_4', 'Quatro Perfektas', 'Acertar 100% em 4 sessoes', '🎯', 'perfeitos', 'perfeitos', 4, 110, 'facil'),
('perfeito_5', 'Cinco Perfektas', 'Acertar 100% em 5 sessoes', '💯', 'perfeitos', 'perfeitos', 5, 140, 'facil'),
('perfeito_6', 'Seis Perfektas', 'Acertar 100% em 6 sessoes', '💯', 'perfeitos', 'perfeitos', 6, 170, 'medio'),
('perfeito_7', 'Sete Perfektas', 'Acertar 100% em 7 sessoes', '💯', 'perfeitos', 'perfeitos', 7, 200, 'medio'),
('perfeito_8', 'Oito Perfektas', 'Acertar 100% em 8 sessoes', '💯', 'perfeitos', 'perfeitos', 8, 230, 'medio'),
('perfeito_9', 'Nove Perfektas', 'Acertar 100% em 9 sessoes', '💯', 'perfeitos', 'perfeitos', 9, 260, 'medio'),
('perfeito_10', 'Dez Perfektas', 'Acertar 100% em 10 sessoes', '💯', 'perfeitos', 'perfeitos', 10, 300, 'dificil'),
('perfeito_15', 'Quinze Perfektas', 'Acertar 100% em 15 sessoes', '🚀', 'perfeitos', 'perfeitos', 15, 450, 'dificil'),
('perfeito_20', 'Vinte Perfektas', 'Acertar 100% em 20 sessoes', '🌟', 'perfeitos', 'perfeitos', 20, 600, 'dificil'),
('perfeito_25', 'Vinte e Cinco Perfektas', 'Acertar 100% em 25 sessoes', '⭐', 'perfeitos', 'perfeitos', 25, 750, 'lendario'),
('perfeito_30', 'Trinta Perfektas', 'Acertar 100% em 30 sessoes', '🌠', 'perfeitos', 'perfeitos', 30, 900, 'lendario'),
('perfeito_40', 'Quarenta Perfektas', 'Acertar 100% em 40 sessoes', '🏆', 'perfeitos', 'perfeitos', 40, 1200, 'lendario'),
('perfeito_50', 'Cinquenta Perfektas', 'Acertar 100% em 50 sessoes', '👑', 'perfeitos', 'perfeitos', 50, 1500, 'lendario');

-- =====================================================
-- CONQUISTAS DE VOLUME DIARIO (muitas questoes por dia)
-- =====================================================
INSERT INTO conquistas_base (conquista_key, titulo, descricao, icone, categoria, tipo_valor, meta, xp_bonus, dificuldade) VALUES
('volume_10', 'Volume 10', 'Responda 10 questoes em 1 dia', '📊', 'volume', 'volume', 10, 20, 'facil'),
('volume_20', 'Volume 20', 'Responda 20 questoes em 1 dia', '📈', 'volume', 'volume', 20, 30, 'facil'),
('volume_30', 'Volume 30', 'Responda 30 questoes em 1 dia', '📉', 'volume', 'volume', 30, 40, 'facil'),
('volume_40', 'Volume 40', 'Responda 40 questoes em 1 dia', '📊', 'volume', 'volume', 40, 50, 'facil'),
('volume_50', 'Volume 50', 'Responda 50 questoes em 1 dia', '📈', 'volume', 'volume', 50, 65, 'facil'),
('volume_60', 'Volume 60', 'Responda 60 questoes em 1 dia', '📉', 'volume', 'volume', 60, 80, 'medio'),
('volume_70', 'Volume 70', 'Responda 70 questoes em 1 dia', '📊', 'volume', 'volume', 70, 95, 'medio'),
('volume_80', 'Volume 80', 'Responda 80 questoes em 1 dia', '📈', 'volume', 'volume', 80, 110, 'medio'),
('volume_90', 'Volume 90', 'Responda 90 questoes em 1 dia', '📉', 'volume', 'volume', 90, 125, 'medio'),
('volume_100', 'Volume 100', 'Responda 100 questoes em 1 dia', '📊', 'volume', 'volume', 100, 150, 'dificil'),
('volume_125', 'Volume 125', 'Responda 125 questoes em 1 dia', '📈', 'volume', 'volume', 125, 190, 'dificil'),
('volume_150', 'Volume 150', 'Responda 150 questoes em 1 dia', '📉', 'volume', 'volume', 150, 230, 'dificil'),
('volume_175', 'Volume 175', 'Responda 175 questoes em 1 dia', '🚀', 'volume', 'volume', 175, 270, 'lendario'),
('volume_200', 'Volume 200', 'Responda 200 questoes em 1 dia', '🌟', 'volume', 'volume', 200, 320, 'lendario'),
('volume_250', 'Volume 250', 'Responda 250 questoes em 1 dia', '⭐', 'volume', 'volume', 250, 400, 'lendario'),
('volume_300', 'Volume 300', 'Responda 300 questoes em 1 dia', '🏆', 'volume', 'volume', 300, 480, 'lendario');

-- =====================================================
-- CONQUISTAS ESPECIAIS DIVERSAS
-- =====================================================
INSERT INTO conquistas_base (conquista_key, titulo, descricao, icone, categoria, tipo_valor, meta, xp_bonus, dificuldade) VALUES
('estudo_diario_7', 'Semana Completa', 'Estude todos os dias por 1 semana', '📆', 'estudo_diario', 'estudo_diario', 7, 70, 'facil'),
('estudo_diario_14', 'Duas Semanas', 'Estude todos os dias por 2 semanas', '🗓️', 'estudo_diario', 'estudo_diario', 14, 140, 'medio'),
('estudo_diario_21', 'Tres Semanas', 'Estude todos os dias por 3 semanas', '📅', 'estudo_diario', 'estudo_diario', 21, 210, 'medio'),
('estudo_diario_30', 'Um Mes Completo', 'Estude todos os dias por 1 mes', '🗃️', 'estudo_diario', 'estudo_diario', 30, 300, 'dificil'),
('estudo_diario_60', 'Dois Meses Completos', 'Estude todos os dias por 2 meses', '📁', 'estudo_diario', 'estudo_diario', 60, 600, 'lendario'),
('estudo_diario_90', 'Tres Meses Completos', 'Estude todos os dias por 3 meses', '📂', 'estudo_diario', 'estudo_diario', 90, 900, 'lendario'),
('diversidade_1', 'Diversificado', 'Estude 2 materias diferentes', '🎨', 'diversidade', 'diversidade', 2, 15, 'facil'),
('diversidade_2', 'Muito Diversificado', 'Estude 3 materias diferentes', '🌈', 'diversidade', 'diversidade', 3, 25, 'facil'),
('diversidade_3', 'Extremamente Diversificado', 'Estude 4 materias diferentes', '🌤️', 'diversidade', 'diversidade', 4, 35, 'facil'),
('diversidade_4', 'Estudante Universal', 'Estude 5 materias diferentes', '🌍', 'diversidade', 'diversidade', 5, 50, 'medio'),
('diversidade_5', 'Mestre da Diversidade', 'Estude 6+ materias diferentes', '🌎', 'diversidade', 'diversidade', 6, 75, 'lendario'),
('consistencia_semanal_4', 'Consistencia Semanal', 'Estude pelo menos 4 dias por semana', '📆', 'consistencia_semanal', 'consistencia_semanal', 4, 30, 'facil'),
('consistencia_semanal_8', 'Consistencia Bi-Semanal', 'Estude pelo menos 4 dias por 2 semanas', '🗓️', 'consistencia_semanal', 'consistencia_semanal', 8, 60, 'medio'),
('consistencia_semanal_12', 'Consistencia Mensal', 'Estude pelo menos 4 dias por 3 semanas', '📅', 'consistencia_semanal', 'consistencia_semanal', 12, 90, 'dificil'),
('consistencia_mensal_3', 'Tres Meses Consistente', 'Estude pelo menos 15 dias por 3 meses', '🏆', 'consistencia_mensal', 'consistencia_mensal', 3, 300, 'lendario'),
('consistencia_mensal_6', 'Seis Meses Consistente', 'Estude pelo menos 15 dias por 6 meses', '👑', 'consistencia_mensal', 'consistencia_mensal', 6, 600, 'lendario'),
('highscore_50', 'Highscore 50', 'Acerte 50 questoes em 1 dia', '🎮', 'highscore', 'highscore', 50, 100, 'facil'),
('highscore_100', 'Highscore 100', 'Acerte 100 questoes em 1 dia', '🎮', 'highscore', 'highscore', 100, 200, 'medio'),
('highscore_150', 'Highscore 150', 'Acerte 150 questoes em 1 dia', '🎮', 'highscore', 'highscore', 150, 300, 'dificil'),
('highscore_200', 'Highscore 200', 'Acerte 200 questoes em 1 dia', '🎮', 'highscore', 'highscore', 200, 400, 'lendario'),
('highscore_300', 'Highscore 300', 'Acerte 300 questoes em 1 dia', '🎮', 'highscore', 'highscore', 300, 600, 'lendario');

-- =====================================================
-- CONQUISTAS DE SIMULADO NOTA ALTA
-- =====================================================
INSERT INTO conquistas_base (conquista_key, titulo, descricao, icone, categoria, tipo_valor, meta, xp_bonus, dificuldade) VALUES
('nota_50', 'Aprovado', 'Tire 50% em um simulado', '📝', 'nota_simulado', 'nota_simulado', 50, 50, 'facil'),
('nota_60', 'Na Media', 'Tire 60% em um simulado', '📋', 'nota_simulado', 'nota_simulado', 60, 70, 'facil'),
('nota_70', 'Bom', 'Tire 70% em um simulado', '📄', 'nota_simulado', 'nota_simulado', 70, 100, 'medio'),
('nota_75', 'Muito Bom', 'Tire 75% em um simulado', '📃', 'nota_simulado', 'nota_simulado', 75, 130, 'medio'),
('nota_80', 'Excelente', 'Tire 80% em um simulado', '📜', 'nota_simulado', 'nota_simulado', 80, 180, 'dificil'),
('nota_85', 'Parabens', 'Tire 85% em um simulado', '🏅', 'nota_simulado', 'nota_simulado', 85, 250, 'dificil'),
('nota_90', 'Nota 10', 'Tire 90% em um simulado', '🥇', 'nota_simulado', 'nota_simulado', 90, 350, 'lendario'),
('nota_95', 'Perfeito', 'Tire 95% em um simulado', '🏆', 'nota_simulado', 'nota_simulado', 95, 500, 'lendario'),
('nota_100', 'Incrivel', 'Tire 100% em um simulado', '💎', 'nota_simulado', 'nota_simulado', 100, 1000, 'lendario'),
('notas_5', 'Cinco Notas', 'Tire 70%+ em 5 simulados', '⭐', 'notas_consecutivas', 'notas_consecutivas', 5, 200, 'dificil'),
('notas_10', 'Dez Notas', 'Tire 70%+ em 10 simulados', '🌟', 'notas_consecutivas', 'notas_consecutivas', 10, 400, 'lendario'),
('notas_20', 'Vinte Notas', 'Tire 70%+ em 20 simulados', '👑', 'notas_consecutivas', 'notas_consecutivas', 20, 800, 'lendario');

-- =====================================================
-- CONQUISTAS DE ESTUDO EM DIFERENTES DIAS DA SEMANA
-- =====================================================
INSERT INTO conquistas_base (conquista_key, titulo, descricao, icone, categoria, tipo_valor, meta, xp_bonus, dificuldade) VALUES
('segunda_1', 'Segunda-feira', 'Estude em 1 segunda', '1️⃣', 'dia_semana', 'segunda', 1, 10, 'facil'),
('segunda_10', 'Segunda Ferrequente', 'Estude em 10 segundas', '1️⃣', 'dia_semana', 'segunda', 10, 80, 'medio'),
('segunda_20', 'Mestre da Segunda', 'Estude em 20 segundas', '1️⃣', 'dia_semana', 'segunda', 20, 160, 'lendario'),
('terca_1', 'Terca-feira', 'Estude em 1 terca', '2️⃣', 'dia_semana', 'terca', 1, 10, 'facil'),
('terca_10', 'Terca Frequente', 'Estude em 10 tercas', '2️⃣', 'dia_semana', 'terca', 10, 80, 'medio'),
('terca_20', 'Mestre da Terca', 'Estude em 20 tercas', '2️⃣', 'dia_semana', 'terca', 20, 160, 'lendario'),
('quarta_1', 'Quarta-feira', 'Estude em 1 quarta', '3️⃣', 'dia_semana', 'quarta', 1, 10, 'facil'),
('quarta_10', 'Quarta Frequente', 'Estude em 10 quartas', '3️⃣', 'dia_semana', 'quarta', 10, 80, 'medio'),
('quarta_20', 'Mestre da Quarta', 'Estude em 20 quartas', '3️⃣', 'dia_semana', 'quarta', 20, 160, 'lendario'),
('quinta_1', 'Quinta-feira', 'Estude em 1 quinta', '4️⃣', 'dia_semana', 'quinta', 1, 10, 'facil'),
('quinta_10', 'Quinta Frequente', 'Estude em 10 quintas', '4️⃣', 'dia_semana', 'quinta', 10, 80, 'medio'),
('quinta_20', 'Mestre da Quinta', 'Estude em 20 quintas', '4️⃣', 'dia_semana', 'quinta', 20, 160, 'lendario'),
('sexta_1', 'Sexta-feira', 'Estude em 1 sexta', '5️⃣', 'dia_semana', 'sexta', 1, 10, 'facil'),
('sexta_10', 'Sexta Frequente', 'Estude em 10 sextas', '5️⃣', 'dia_semana', 'sexta', 10, 80, 'medio'),
('sexta_20', 'Mestre da Sexta', 'Estude em 20 sextas', '5️⃣', 'dia_semana', 'sexta', 20, 160, 'lendario'),
('sabado_1', 'Sabado', 'Estude em 1 sabado', '6️⃣', 'dia_semana', 'sabado', 1, 15, 'facil'),
('sabado_10', 'Sabado Frequente', 'Estude em 10 sabados', '6️⃣', 'dia_semana', 'sabado', 10, 120, 'medio'),
('sabado_20', 'Mestre do Sabado', 'Estude em 20 sabados', '6️⃣', 'dia_semana', 'sabado', 20, 240, 'lendario'),
('domingo_1', 'Domingo', 'Estude em 1 domingo', '7️⃣', 'dia_semana', 'domingo', 1, 15, 'facil'),
('domingo_10', 'Domingo Frequente', 'Estude em 10 domingos', '7️⃣', 'dia_semana', 'domingo', 10, 120, 'medio'),
('domingo_20', 'Mestre do Domingo', 'Estude em 20 domingos', '7️⃣', 'dia_semana', 'domingo', 20, 240, 'lendario');
