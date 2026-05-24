# Google Apps Script Guide

## 📝 Overview

This folder contains the Google Apps Script backend for Bex 7386 Budgeting App.

**Two files:**
- `Code.gs` - Main application logic
- `Config.gs` - Configuration utilities

## 🔧 Quick Start

1. **Copy both files to Apps Script editor**
2. **Update SPREADSHEET_ID in Code.gs**
3. **Run `setup()` function**
4. **Deploy as web app**

## 📄 File Structure

### Code.gs

Main backend logic for:
- Receiving form submissions
- Validating transaction data
- Writing to sheets
- Uploading images to Drive
- Returning API responses

**Key Functions:**
- `doPost(e)` - Handle form submissions
- `doGet(e)` - Handle GET requests (config retrieval)
- `addTransactionToSheet()` - Write row to sheet
- `uploadImage()` - Handle image uploads
- `validateTransaction()` - Validate data
- `setup()` - Initialize app (run once)
- `testPost()` - Test functionality

### Config.gs

Utility functions for:
- Sheet initialization
- Data validation
- Statistics and reporting
- CSV export
- Debugging

**Key Functions:**
- `initializeSheetHeaders()` - Create headers in sheets
- `getSummaryStats()` - Get monthly statistics
- `exportToCSV()` - Export data as CSV
- `validateSheetStructure()` - Verify sheet setup
- `clearAllData()` - Clear for testing

## 🚀 Deployment

### Step 1: Add to Apps Script

1. Open your Google Sheet
2. Extensions → Apps Script
3. Delete default code
4. Copy `Code.gs` content
5. File → New → Script file → `Config.gs`
6. Copy `Config.gs` content

### Step 2: Configure

In `Code.gs`, line 11:
```javascript
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
```

Get your ID from the sheet URL:
```
https://docs.google.com/spreadsheets/d/[THIS_IS_YOUR_ID]/edit
```

### Step 3: Initialize

1. Select `setup` from function dropdown
2. Click ▶️ Run
3. Check logs (Ctrl+Enter)

### Step 4: Deploy

1. Click "Deploy" → "New deployment"
2. Type: Web app
3. Execute as: Your email
4. Access: Anyone
5. Click Deploy
6. Copy URL to frontend config

## 📊 Data Flow

```
Form Submission
    ↓
doPost() receives data
    ↓
validateTransaction()
    ↓
uploadImage() [if provided]
    ↓
addTransactionToSheet()
    ↓
Return JSON response
```

## 🔐 Validation

All validations happen in `validateTransaction()`:

```javascript
{
  owner: Must be 'Tama' or 'Nana'
  date: Must be YYYY-MM-DD format
  type: Must be pemasukan/pengeluaran/investasi
  category: Must exist in config for type
  detail: Required, 1-200 chars
  amount: 1000 - 999999999
  image: Max 5MB, image file only
}
```

## 🖼️ Image Upload

### Process

1. **Validate file:**
   - Check type (image/*)
   - Check size (< 5MB)

2. **Create folder structure:**
   - `Budgeting_7386_Attachments/`
   - └─ `{owner}/`
   - └─ `{month_key}/`

3. **Upload file:**
   - Name: `YYYY-MM-DD_{owner}_{entry_id}.ext`
   - Example: `2026-05-24_Tama_a1b2c3.jpg`

4. **Return URL:**
   - Shareable Google Drive link

### Folder Structure

Automatically created on first upload:
```
Budgeting_7386_Attachments/
├── Tama/
│   ├── 2026-05/
│   ├── 2026-06/
│   └── 2026-07/
└── Nana/
    ├── 2026-05/
    ├── 2026-06/
    └── 2026-07/
```

## 📋 Configuration

Config is read from the `Config` sheet. Format:

```
section | key | value | extra
--------|-----|-------|------
owner   | Tama | graphite_black | Space Grotesk
type    | pemasukan | Income | green
pemasukan | uang_jajan | Uang Jajan | fixed
ui | currency | IDR | Rupiah
validation | min_amount | 1000 | rupiah
```

The `getConfigData()` function reads this and returns to frontend.

## 🧪 Testing

### Test Function

Use `testPost()` to simulate form submission:

```javascript
// Adds a test transaction to Tama sheet
testPost()
```

Check the Tama sheet for new row.

### Manual Testing

In browser console:
```javascript
const data = new FormData();
data.append('owner', 'Tama');
data.append('date', '2026-05-24');
data.append('type', 'pengeluaran');
data.append('category', 'makan');
data.append('detail', 'Test');
data.append('amount', '50000');

fetch('YOUR_APPS_SCRIPT_URL', {
  method: 'POST',
  body: data
})
.then(r => r.json())
.then(d => console.log(d))
```

## 🐛 Debugging

### View Logs

1. In Apps Script editor
2. View → Execution log (Ctrl+Enter)
3. Shows all `Logger.log()` calls

### Add Debug Logging

```javascript
Logger.log('Transaction received: ' + owner);
Logger.log('Image size: ' + imageBlob.getSize());
Logger.log('Row added to sheet: ' + sheet.getName());
```

### Common Issues

**"Spreadsheet not found"**
- Check SPREADSHEET_ID is correct

**"Sheet not found"**
- Create Tama, Nana, Config sheets
- Check exact names

**"Upload failed"**
- Check Drive folder exists
- Run `setup()` to create folders

**"No response from API"**
- Check deployment is active
- Try redeploying

## 📈 Scaling

### For Large Datasets

Current implementation works well up to:
- 10,000+ transactions
- 100+ uploads per month

For larger scale:
- Consider Firestore instead of Sheets
- Use BigQuery for analytics
- Implement caching layer

### Performance Tips

1. **Batch writes:** Group multiple saves
2. **Async uploads:** Don't wait for Drive
3. **Cache config:** Load once, reuse
4. **Index sheets:** Sort by month_key

## 🔄 Updates & Maintenance

### Updating Code

1. Edit in Apps Script editor
2. Save (Ctrl+S)
3. Changes take effect immediately
4. No redeployment needed (unless version bump)

### Updating Configuration

1. Edit Config sheet
2. Changes loaded automatically by frontend
3. Or clear `localStorage` to force reload

### Checking Execution Time

- Apps Script quota: 30 minutes/day free
- Monitor in Quotas section
- Optimize if approaching limit

## 🚨 Error Handling

### Frontend Error Handling

Checks for:
- Empty responses
- HTTP errors
- Timeout errors
- Network errors

```javascript
try {
  const response = await fetch(url, options);
  const result = await response.json();
  if (result.success) {
    // Handle success
  } else {
    // Show error: result.error
  }
} catch (error) {
  // Network or parse error
}
```

### Backend Error Handling

- Validates all inputs
- Returns JSON error response
- Logs errors for debugging
- Continues despite image failures

## 📞 Support

For issues:

1. **Check execution logs** (Ctrl+Enter)
2. **Review this guide**
3. **See [SETUP.md](../docs/SETUP.md)**
4. **Test with `testPost()`**

---

**Version:** v1.0  
**Last Updated:** May 24, 2026
