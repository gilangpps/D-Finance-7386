# Quick Reference Guide

## 🚀 First Time Setup (5 minutes)

### 1. Prepare Google Sheet
```
✓ Create sheets: Tama, Nana, Dashboard, Config
✓ Add headers to Tama/Nana sheets
✓ Fill Config sheet with categories
```
**File:** [docs/SETUP.md](./docs/SETUP.md) (Step 1)

### 2. Setup Google Apps Script
```
✓ Copy Code.gs and Config.gs
✓ Set SPREADSHEET_ID
✓ Run setup() function
```
**File:** [docs/SETUP.md](./docs/SETUP.md) (Steps 3-5)

### 3. Deploy as Web App
```
✓ Deploy > New deployment
✓ Type: Web app
✓ Copy URL
```
**File:** [docs/SETUP.md](./docs/SETUP.md) (Step 7)

### 4. Configure Frontend
```
✓ Open frontend/index.html
✓ Set Apps Script URL (console or code)
✓ Test with sample transaction
```
**File:** [docs/SETUP.md](./docs/SETUP.md) (Step 8-9)

---

## 📖 Documentation Map

| Document | Purpose | Time |
|----------|---------|------|
| [README.md](./README.md) | Overview & features | 5 min |
| [docs/SETUP.md](./docs/SETUP.md) | Initial setup guide | 15 min |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Deploy to production | 10 min |
| [docs/API.md](./docs/API.md) | API reference | 10 min |
| [google-apps-script/README.md](./google-apps-script/README.md) | Backend guide | 10 min |

---

## 🎯 Common Tasks

### Add a New Category

1. **Edit Config sheet**
   - Section: pengeluaran/pemasukan/investasi
   - Key: unique_name
   - Value: Display Name
   - Extra: type_classification

2. **Frontend auto-loads** from Config sheet

### Change Theme Colors

1. **Edit frontend/css/theme-tama.css** or **theme-nana.css**
2. **Update color values** in :root selector
3. **Reload browser** (Ctrl+F5 for hard refresh)

### Backup Data

1. **In Google Sheets:**
   - Select all data
   - File > Download > CSV
   - Save locally

2. **Or use Apps Script:**
   - Run `exportToCSV('Tama', '2026-05')` in console
   - Copy output

### View Error Logs

**Frontend:**
- Open DevTools (F12)
- Check Console tab

**Backend (Apps Script):**
- Open Script Editor
- View > Execution log (Ctrl+Enter)

---

## 🐛 Troubleshooting

### Form won't submit?
→ [See SETUP.md troubleshooting](./docs/SETUP.md#-common-issues--fixes)

### Data not appearing?
→ Check Apps Script execution logs

### Images not uploading?
→ Verify Drive folder structure exists

### Style looks different?
→ Hard refresh browser (Ctrl+Shift+R)

---

## 💻 Developer Info

### File Structure
```
frontend/           # User-facing app
├── index.html      # Main interface
├── css/            # Styles
└── js/             # Logic
  ├── main.js       # Init
  ├── config-loader.js
  ├── form-handler.js
  └── theme-manager.js

google-apps-script/ # Backend
├── Code.gs         # Main logic
└── Config.gs       # Utilities

docs/               # Documentation
```

### Technology Stack
- **Frontend:** HTML5, CSS3, Vanilla JS
- **Backend:** Google Apps Script
- **Database:** Google Sheets
- **Storage:** Google Drive

### Browser Console Helpers

```javascript
// View all configuration
window.debugApp.getConfig()

// Check current theme
window.debugApp.getTheme()

// Set Apps Script URL
window.app.setAppsScriptUrl('YOUR_URL')

// View form data
window.debugApp.getFormData()
```

---

## 📋 Checklist for Production

- [ ] Google Sheet setup complete
- [ ] Apps Script deployed and tested
- [ ] Frontend accessible via URL
- [ ] Theme switching works
- [ ] Form submission works
- [ ] Data appears in Sheets
- [ ] Images upload to Drive
- [ ] Both owners (Tama/Nana) tested
- [ ] Mobile responsive tested
- [ ] Share URL with users

---

## 🎨 UI/Theme

### Tama (Graphite Black)
- Modern, minimalist
- Font: Space Grotesk
- Color: #1f2937 (dark graphite)
- Icon: 💼

### Nana (Vintage)
- Warm, aesthetic
- Font: Playfair + Caveat
- Color: #d4a574 (vintage gold)
- Icon: ✨

Switch in app header!

---

## 📞 Need Help?

1. **Quick questions:** Check [docs/API.md](./docs/API.md)
2. **Setup issues:** See [docs/SETUP.md](./docs/SETUP.md#-common-issues--fixes)
3. **Deployment help:** Read [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
4. **General guide:** Review [README.md](./README.md)

---

## 🔄 Version History

| Version | Date | Status |
|---------|------|--------|
| v1.0 | 2026-05-24 | 🟢 Released |
| v2.0 | TBD | 🟡 Planned |

---

**Last Updated:** May 24, 2026  
**Status:** ✅ Production Ready
