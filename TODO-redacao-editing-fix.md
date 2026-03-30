# TODO: Fix 'editing is not defined' error in redacao.ejs

## Steps:
- [x] 1. Create TODO.md with plan breakdown ✅
- [x] 2. Edit src/controllers/studyController.js - Add `editing: false` to defaults in redacaoPage() ✅
- [x] 3. Edit src/views/app/redacao.ejs - Make form action safe with `(editing || false)` and `(entryId || '')` ✅
- [ ] 4. Test /redacao (create mode, no crash)
- [ ] 5. Test /redacao/editar/[ID] (edit mode, correct form action)
- [ ] 6. Update TODO with completion
- [ ] 7. attempt_completion

Current progress: Plan approved, starting implementation.

