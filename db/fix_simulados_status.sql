-- =====================================================
-- CORREÇÃO: Adicionar status 'revisao' à tabela simulados
-- Execute este script no MySQL
-- =====================================================

-- Verificar se a coluna já tem o valor 'revisao'
-- Se não tiver, precisamos modificar a coluna

-- Primeiro, vamos ver os valores atuais
-- SHOW COLUMNS FROM simulados LIKE 'status';

-- Se não houver 'revisao', execute:
ALTER TABLE simulados MODIFY COLUMN status ENUM('em_andamento', 'finalizado', 'revisao') NOT NULL DEFAULT 'em_andamento';

-- Verificar se funcionou
-- SHOW COLUMNS FROM simulados LIKE 'status';

