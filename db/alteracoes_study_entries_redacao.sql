-- Ajustes de Redação em study_entries
-- Execute no MySQL antes de usar as novas funcionalidades.

ALTER TABLE study_entries
  ADD COLUMN IF NOT EXISTS tema VARCHAR(255) NULL COMMENT 'Tema da redação',
  ADD COLUMN IF NOT EXISTS redacao_comentario TEXT NULL COMMENT 'Comentário/feedback da redação';

-- Opcional: índices para consultas em estatísticas de redação
CREATE INDEX idx_study_entries_user_subject_data ON study_entries (user_id, subject_id, data);
CREATE INDEX idx_study_entries_user_subject_nota ON study_entries (user_id, subject_id, redacao_nota);

-- Opcional (recomendado): limpar histórico antigo para não contar acertos/questões de redação
UPDATE study_entries se
JOIN subjects s ON s.id = se.subject_id
SET se.questoes = 0,
    se.acertos = 0
WHERE s.nome = 'Redação';

