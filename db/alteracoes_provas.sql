-- =====================================================
-- Migração para adicionar campos na tabela provas
-- Execute este arquivo no seu banco de dados MySQL
-- =====================================================

-- Verificar e adicionar cada coluna individualmente
-- (Execute cada linha separadamente se necessário)

-- Adicionar status_inscricao
-- ALTER TABLE provas ADD COLUMN status_inscricao VARCHAR(50) DEFAULT 'nao_iniciada';

-- Adicionar data_inscricao_inicio
-- ALTER TABLE provas ADD COLUMN data_inscricao_inicio DATE DEFAULT NULL;

-- Adicionar data_inscricao_fim
-- ALTER TABLE provas ADD COLUMN data_inscricao_fim DATE DEFAULT NULL;

-- Adicionar data_pagamento
-- ALTER TABLE provas ADD COLUMN data_pagamento DATE DEFAULT NULL;

-- Adicionar endereco
-- ALTER TABLE provas ADD COLUMN endereco VARCHAR(255) DEFAULT NULL;

-- Adicionar link_inscricao
-- ALTER TABLE provas ADD COLUMN link_inscricao VARCHAR(255) DEFAULT NULL;

-- Adicionar nota_corte
-- ALTER TABLE provas ADD COLUMN nota_corte FLOAT DEFAULT NULL;

-- Adicionar nota_obtida
-- ALTER TABLE provas ADD COLUMN nota_obtida FLOAT DEFAULT NULL;

-- Adicionar posicao
-- ALTER TABLE provas ADD COLUMN posicao INT DEFAULT NULL;

-- Adicionar resultado
-- ALTER TABLE provas ADD COLUMN resultado VARCHAR(50) DEFAULT NULL;

-- =====================================================
-- Para verificar as colunas existentes:
-- =====================================================
-- DESCRIBE provas;

-- =====================================================
-- Para reverter (se necessário):
-- =====================================================
-- ALTER TABLE provas DROP COLUMN status_inscricao;
-- ALTER TABLE provas DROP COLUMN data_inscricao_inicio;
-- ALTER TABLE provas DROP COLUMN data_inscricao_fim;
-- ALTER TABLE provas DROP COLUMN data_pagamento;
-- ALTER TABLE provas DROP COLUMN endereco;
-- ALTER TABLE provas DROP COLUMN link_inscricao;
-- ALTER TABLE provas DROP COLUMN nota_corte;
-- ALTER TABLE provas DROP COLUMN nota_obtida;
-- ALTER TABLE provas DROP COLUMN posicao;
-- ALTER TABLE provas DROP COLUMN resultado;

