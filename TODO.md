# TODO - Melhorias no Sistema de Simulados

## ✅ Concluídas
- [x] Análise do sistema existente
- [x] Atualizar Model Simulado - Adicionar 'revisao' ao ENUM de status
- [x] Atualizar Controller - Remover bloqueios para status 'revisao'
- [x] Atualizar Controller - Adicionar método toggleRevisao()
- [x] Atualizar Rotas - Adicionar rota para alternar modo revisão
- [x] Atualizar View detalhes.ejs - Mostrar edição quando status = 'revisao'
- [x] Atualizar View detalhes.ejs - Adicionar botão para entrar/sair do modo revisão
- [x] Reorganizar View erros.ejs - Sistema de abas por área
- [x] Reorganizar View erros.ejs - Accordions por matéria
- [x] Reorganizar View erros.ejs - Contadores de pendentes/revisados
- [x] Atualizar CSS detalhes.ejs - Estilo modo revisão + banner
- [x] Atualizar CSS erros.ejs - Abas + accordions + design premium
- [x] Atualizar SQL - Adicionar 'revisao' ao ENUM

---

**Status: ✅ COMPLETO**

## 📝 Para aplicar no banco de dados:
Execute o comando SQL para atualizar o ENUM:
```sql
ALTER TABLE simulados MODIFY COLUMN status ENUM('em_andamento','finalizado','revisao') NOT NULL DEFAULT 'em_andamento';
```

