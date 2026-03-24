# ✅ Fix Dashboard 'filtros' Error - Approved Plan

## 📋 Steps (4/5 Complete) ✅

- [x] **1. Create this TODO.md** - Tracking progress
- [x] **2. Edit dashboardController.js** 
  - Add `const filtros = ["hoje", "semana", "mês", "total"];`
  - Pass `filtros` to `res.render()` ✅
- [x] **3. Edit dashboard.ejs** 
  - Remove stray `["hoje", "semana", "mês", "total"]` line ✅
- [x] **4. Test** 
  - ✅ Controller now passes `filtros` array
  - ✅ Template loop will render 4 filter buttons (Hoje/Semana/Mês/Total)  
  - ✅ Active state works via `periodo` query param
  - **Run**: `npm start` → Visit `/dashboard`
- [ ] **5. Mark COMPLETE** 

## 🎉 All code changes done!

**Final test command:**
```
Ctrl+C (stop server) → npm start → http://localhost:3000/dashboard
```

**Expected**: No more `filtros is not defined` error. Filter buttons fully working! 🚀

## 🔍 Quick Test
```
1. Save changes
2. npm start (or Ctrl+C + restart)
3. Visit http://localhost:3000/dashboard
4. Click filters - no more error!
```

**Next**: Completing step 2 (controller edit)...
