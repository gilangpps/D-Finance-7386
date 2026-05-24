# Bex 7386 Budgeting Web App v1

## 📋 Overview

Lightweight web app for managing finances for Tama and Nana. Focuses on:
- ✨ Clean, fast form input
- 🎨 Two beautiful themes (Tama & Nana)
- 💾 Direct Google Sheets integration
- 📸 Optional image attachments to Drive
- 📊 Dashboard & summary reports

## 🚀 Quick Start

### For Users
1. Open [Frontend](./frontend/index.html) in your browser
2. Choose owner (Tama or Nana)
3. Fill in transaction details
4. Click "Simpan Transaksi"
5. Data syncs to Google Sheets automatically

### For Developers
1. **Setup Google Apps Script:**
   - See [SETUP.md](./docs/SETUP.md)
   
2. **Deploy Backend:**
   - See [DEPLOYMENT.md](./docs/DEPLOYMENT.md)
   
3. **Configure Frontend:**
   - Enter Apps Script URL in browser or `localStorage`

## 📁 Project Structure

```
2605_7386-Budgeting/
├── frontend/
│   ├── index.html              # Main form interface
│   ├── css/
│   │   ├── main.css            # Core styles
│   │   ├── theme-tama.css      # Tama theme (graphite black)
│   │   └── theme-nana.css      # Nana theme (vintage)
│   └── js/
│       ├── main.js             # App initialization
│       ├── config-loader.js    # Load config from Sheets
│       ├── form-handler.js     # Form logic & validation
│       └── theme-manager.js    # Theme switching
├── google-apps-script/
│   ├── Code.gs                 # Main backend logic
│   ├── Config.gs               # Configuration utilities
│   └── README.md               # Apps Script guide
└── docs/
    ├── SETUP.md                # Initial setup guide
    ├── DEPLOYMENT.md           # Deployment instructions
    ├── API.md                  # API documentation
    └── README.md               # This file
```

## 🎨 Themes

### Tama Theme
- **Color:** Graphite Black (#1f2937)
- **Font:** Space Grotesk (modern, technical)
- **Feel:** Professional, minimalist, modern
- **Icon:** 💼

### Nana Theme
- **Color:** Vintage Gold (#d4a574)
- **Font:** Playfair Display + Caveat (elegant, personal)
- **Feel:** Warm, aesthetic, artistic
- **Icon:** ✨

Switch themes using the button in the header!

## 💾 Data Flow

```
User Form
    ↓
[Frontend Validation]
    ↓
[Google Apps Script]
    ↓
    ├→ Write to Tama/Nana Sheet
    ├→ Upload Image to Drive
    └→ Update sync status
    ↓
Response to Frontend
    ↓
Show Success/Error Message
```

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5 + CSS3 + Vanilla JavaScript |
| Backend | Google Apps Script |
| Database | Google Sheets |
| Storage | Google Drive |
| Hosting | Static hosting (GitHub Pages, Vercel, etc.) |

## 📊 Data Structure

### Transaction Sheet (Tama & Nana)
```
timestamp | date | month_key | type | category | detail | amount | note | image_url | entry_id | sync_status
```

**Example:**
```
2026-05-24T10:30:00Z | 2026-05-24 | 2026-05 | pengeluaran | makan | Makan siang | 50000 | Nasi kuning | https://drive.google.com/... | a1b2c3d4 | synced
```

### Config Sheet Structure
```
section | key | value | extra
```

**Example:**
```
owner | Tama | graphite_black | Space Grotesk
type | pemasukan | Income | green
pemasukan | uang_jajan | Uang Jajan | fixed
```

## ⚙️ Features

### ✅ Implemented (v1)
- [x] Dual-theme UI switcher
- [x] Owner selection (Tama/Nana)
- [x] Dynamic form fields
- [x] Amount validation
- [x] Optional image upload
- [x] Form validation
- [x] Google Apps Script integration
- [x] Data persistence to Sheets
- [x] Image storage to Drive

### 🔄 Roadmap (v2+)
- [ ] Transaction history view
- [ ] Monthly dashboard
- [ ] Category charts
- [ ] Filter & search
- [ ] Export functionality
- [ ] Mobile app version
- [ ] Offline draft saving
- [ ] Recurring transactions
- [ ] Budget limits

## 🔒 Security Notes

- Frontendvalidation is **not** security
- **All validation must happen on backend (Apps Script)**
- Keep spreadsheet permissions tight
- Restrict Drive folder access
- Use service account for production (if applicable)

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ Mobile browsers (tested on iOS 14+, Android 10+)

## 🐛 Troubleshooting

### "Apps Script URL not configured"
- Open developer console (F12)
- Use: `window.app.setAppsScriptUrl('YOUR_URL')`
- Or set in code: `window.APPS_SCRIPT_URL = 'YOUR_URL'`

### Form not submitting
- Check browser console for errors (F12)
- Verify Apps Script deployment is active
- Ensure CORS headers are correct

### Image not uploading
- Check file size < 5MB
- Verify Drive folder structure exists
- Check Drive permissions

### Data not appearing in Sheets
- Verify sheet headers match specification
- Check Apps Script execution logs
- Confirm sync_status is "synced"

## 📖 Documentation

- [SETUP.md](./docs/SETUP.md) - Google Sheets & Apps Script setup
- [DEPLOYMENT.md](./docs/DEPLOYMENT.md) - How to deploy
- [API.md](./docs/API.md) - API endpoints & format

## 👥 Authors

- **Tama** 💼
- **Nana** ✨

## 📝 License

Private project for Bex 7386

## 📞 Support

For issues or questions, check the documentation or run `window.debugApp` in browser console for diagnostics.

---

**Current Version:** v1.0  
**Last Updated:** May 24, 2026
