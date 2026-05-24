# Setup Guide - Bex 7386 Budgeting App

## 📋 Prerequisites

- Google Account
- Google Sheets with structure ready
- Google Drive folder for attachments
- Basic knowledge of Google Apps Script

## 🔧 Step-by-Step Setup

### Step 1: Prepare Google Sheets

Your spreadsheet should have these sheets:

#### Sheet 1: `Tama`
Headers (Row 1):
```
timestamp | date | month_key | type | category | detail | amount | note | image_url | entry_id | sync_status
```

Leave rows below empty for data entry.

#### Sheet 2: `Nana`
Same headers as `Tama`:
```
timestamp | date | month_key | type | category | detail | amount | note | image_url | entry_id | sync_status
```

#### Sheet 3: `Dashboard`
(Optional) For summary and charts. Format as needed.

#### Sheet 4: `Config`
Headers (Row 1):
```
section | key | value | extra
```

Data (starting Row 2):
```
owner|Tama|graphite_black|Space Grotesk
owner|Nana|vintage|Playfair + Handwriting
type|pemasukan|Income|green
type|pengeluaran|Expense|red
type|investasi|Investment|gold
pemasukan|uang_jajan|Uang Jajan|fixed
pemasukan|gaji_honor|Gaji/Honor|fixed
pemasukan|given|Given^°^|emotional
pemasukan|hadiah|Hadiah|optional
pemasukan|freelance|Freelance|optional
pemasukan|lainnya|Lainnya|custom
pengeluaran|tagihan|Tagihan|fixed
pengeluaran|kebutuhan|Kebutuhan|fixed
pengeluaran|hobi|Hobi|flexible
pengeluaran|transport|Transport|operational
pengeluaran|makan|Makan|daily
pengeluaran|kesehatan|Kesehatan|important
pengeluaran|gift|Gift|optional
pengeluaran|lainnya|Lainnya|custom
investasi|saham|Saham|long_term
investasi|nabung|Nabung|safe
investasi|emas|Beli Emas|hedge
investasi|crypto|Crypto|volatile
investasi|reksadana|Reksadana|medium
investasi|lainnya|Lainnya|custom
ui|currency|IDR|Rupiah
ui|locale|id-ID|Indonesia
ui|date_format|YYYY-MM-DD|ISO
ui|month_format|YYYY-MM|bucket
drive|root_folder|Budgeting_7386_Attachments|main
drive|tama_folder|Tama|owner
drive|nana_folder|Nana|owner
validation|min_amount|1000|rupiah
validation|max_amount|999999999|rupiah
validation|image_required|FALSE|optional
validation|note_required|FALSE|optional
```

### Step 2: Prepare Google Drive Folder Structure

Create this folder structure in your Google Drive:

```
Budgeting_7386_Attachments/
├── Tama/
│   └── [Will create month folders automatically]
└── Nana/
    └── [Will create month folders automatically]
```

You can create this manually, or let the Apps Script create it automatically on first run.

### Step 3: Set Up Google Apps Script

1. **Open your Google Sheet**
2. **Go to:** Extensions → Apps Script
3. **Delete default `Code.gs`** if present
4. **Create two files:**
   - `Code.gs` - Copy from `google-apps-script/Code.gs`
   - `Config.gs` - Copy from `google-apps-script/Config.gs`

### Step 4: Configure Apps Script

In `Code.gs`, find these lines and update:

```javascript
// Line 11-12: Replace with your spreadsheet ID
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

// You can get your spreadsheet ID from the URL:
// https://docs.google.com/spreadsheets/d/[THIS_IS_YOUR_ID]/edit
```

### Step 5: Initialize Apps Script

1. **In Apps Script editor:**
   - Select function dropdown (top)
   - Choose `setup`
   - Click ▶️ **Run**

2. **Check logs (Ctrl+Enter):**
   - Should see: "✓ Setup completed successfully!"
   - Should confirm sheets are connected
   - Should create Drive folders

### Step 6: Test Backend

1. **In Apps Script editor:**
   - Select `testPost` from function dropdown
   - Click ▶️ **Run**

2. **Check logs:**
   - Should see "Test result" with entry ID
   - Check your `Tama` sheet - new row should appear

3. **Check Drive:**
   - Verify folder structure was created in Drive

### Step 7: Deploy as Web App

1. **In Apps Script editor:**
   - Click **Deploy** → **New deployment**
   - Select type: **Web app**
   - Execute as: **Your email**
   - Who has access: **Anyone**
   - Click **Deploy**

2. **Copy the deployment URL:**
   ```
   https://script.google.com/macros/d/{DEPLOYMENT_ID}/useweb?v=1
   ```

3. **Save this URL** - you'll need it for the frontend

### Step 8: Configure Frontend

#### Option A: Set URL via Browser Console

1. Open `frontend/index.html` in browser
2. Open Developer Console (F12)
3. Paste:
   ```javascript
   window.app.setAppsScriptUrl('YOUR_DEPLOYMENT_URL_HERE')
   ```

#### Option B: Hardcode in Frontend (Not Recommended)

Edit `frontend/js/main.js`:
```javascript
// Line ~60, in BudgetingApp.init():
this.appsScriptUrl = 'YOUR_DEPLOYMENT_URL_HERE'; // Add this line
```

#### Option C: Use Environment Variable

Set before loading frontend:
```html
<script>
  window.APPS_SCRIPT_URL = 'YOUR_DEPLOYMENT_URL_HERE';
</script>
<!-- Then load app -->
<script src="js/main.js"></script>
```

### Step 9: Test Frontend

1. **Open `frontend/index.html` in browser**
2. **Fill in a test transaction:**
   - Owner: Tama
   - Date: Today
   - Type: Pengeluaran
   - Category: Makan
   - Detail: Test transaction
   - Amount: 50000
   - Leave image blank for now

3. **Click "Simpan Transaksi"**

4. **Expected:**
   - Green success message appears
   - Form resets
   - New row appears in Tama sheet

5. **If error:**
   - Open browser console (F12)
   - Check error message
   - See troubleshooting below

## ✅ Verification Checklist

- [ ] Google Sheet has all 4 sheets (Tama, Nana, Dashboard, Config)
- [ ] Sheet headers match specification
- [ ] Config sheet populated with all values
- [ ] Drive folder structure created
- [ ] Apps Script deployed and tested
- [ ] Deployment URL copied
- [ ] Frontend configured with Apps Script URL
- [ ] Test transaction successfully saved
- [ ] Data appears in correct Tama/Nana sheet
- [ ] Both themes work (try switching)

## 🐛 Common Issues & Fixes

### Issue: "Spreadsheet not found"
**Solution:**
- Check SPREADSHEET_ID is correct
- Get ID from URL: `https://docs.google.com/spreadsheets/d/[ID]/edit`
- Paste in `Code.gs` line 11

### Issue: "Sheet [name] not found"
**Solution:**
- Create the sheet in your spreadsheet
- Match name exactly: `Tama`, `Nana`, `Config`, `Dashboard`
- No typos or extra spaces

### Issue: "Script execution failed"
**Solution:**
- Check browser console (F12)
- Click "Apps Script: Code.gs" link in console
- View execution logs for details
- Fix errors and redeploy

### Issue: "Cannot upload image"
**Solution:**
- Create Drive folder structure:
  - `Budgeting_7386_Attachments/Tama/`
  - `Budgeting_7386_Attachments/Nana/`
- Or let script create it by running `setup()`

### Issue: "Form won't submit"
**Solution:**
- Check Apps Script URL is correct
- Try browser console: `window.debugApp.getConfig()`
- Ensure all required fields are filled
- Check CORS is enabled (Apps Script handles this)

## 📞 Need Help?

1. **Check logs:**
   - Frontend: Browser DevTools (F12)
   - Backend: Apps Script Editor → Execution log

2. **Test API:**
   ```javascript
   // In browser console
   window.debugApp.getConfig()  // Check config loaded
   window.debugApp.getTheme()   // Check theme
   ```

3. **Reset configuration:**
   ```javascript
   localStorage.clear()  // Clear all local settings
   ```

## 🎉 You're Ready!

Once all steps are complete:
- ✅ Share frontend URL with users
- ✅ Users can start logging transactions
- ✅ Data automatically syncs to Sheets
- ✅ Images automatically upload to Drive

---

**Next:** See [DEPLOYMENT.md](./DEPLOYMENT.md) for deploying to production hosting.
