# API Documentation - Bex 7386 Budgeting App

## Overview

The Bex 7386 Budgeting App uses Google Apps Script as a backend API. This document describes all available endpoints and data formats.

## Base URL

```
https://script.google.com/macros/d/{DEPLOYMENT_ID}/useweb?v=1
```

Replace `{DEPLOYMENT_ID}` with your deployment ID from Google Apps Script.

---

## Endpoints

### 1. Submit Transaction

**Endpoint:** `POST /` (default)

**Purpose:** Submit a new transaction (income, expense, or investment)

#### Request

```http
POST /useweb?v=1 HTTP/1.1
Content-Type: application/x-www-form-urlencoded
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| owner | string | Yes | "Tama" or "Nana" |
| date | string | Yes | Transaction date (YYYY-MM-DD) |
| type | string | Yes | "pemasukan", "pengeluaran", or "investasi" |
| category | string | Yes | Category key (see Config sheet) |
| detail | string | Yes | Transaction description |
| amount | number | Yes | Amount in Rupiah (min: 1000, max: 999999999) |
| note | string | No | Additional notes (optional) |
| image | file | No | Image attachment (JPEG/PNG, max 5MB) |

**Example:**
```javascript
const formData = new FormData();
formData.append('owner', 'Tama');
formData.append('date', '2026-05-24');
formData.append('type', 'pengeluaran');
formData.append('category', 'makan');
formData.append('detail', 'Makan siang di warung');
formData.append('amount', '50000');
formData.append('note', 'Bersama rekan kerja');

fetch('YOUR_APPS_SCRIPT_URL', {
  method: 'POST',
  body: formData
})
.then(r => r.json())
.then(data => console.log(data));
```

#### Response

**Success (200):**
```json
{
  "success": true,
  "error": null,
  "data": {
    "entry_id": "a1b2c3d4",
    "timestamp": "2026-05-24T10:30:00.000Z"
  },
  "timestamp": "2026-05-24T10:30:00.000Z"
}
```

**Error (400/500):**
```json
{
  "success": false,
  "error": "Invalid owner: Badra",
  "data": {},
  "timestamp": "2026-05-24T10:30:00.000Z"
}
```

#### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| owner | Must be "Tama" or "Nana" | "Invalid owner" |
| date | Format YYYY-MM-DD | "Invalid date format" |
| type | One of: pemasukan, pengeluaran, investasi | "Invalid type" |
| category | Must match type categories | See Config sheet |
| detail | 1-200 characters | "Detail required" |
| amount | 1000 - 999999999 | "Invalid amount" |
| image | JPEG, PNG, WebP, max 5MB | "File too large" |

---

### 2. Get Configuration

**Endpoint:** `GET ?action=getConfig`

**Purpose:** Retrieve app configuration (categories, types, owners, etc.)

#### Request

```http
GET /useweb?v=1&action=getConfig HTTP/1.1
```

#### Response

```json
{
  "success": true,
  "config": [
    ["owner", "Tama", "graphite_black", "Space Grotesk"],
    ["owner", "Nana", "vintage", "Playfair + Handwriting"],
    ["type", "pemasukan", "Income", "green"],
    ["type", "pengeluaran", "Expense", "red"],
    ["type", "investasi", "Investment", "gold"],
    ["pemasukan", "uang_jajan", "Uang Jajan", "fixed"],
    ["pemasukan", "gaji_honor", "Gaji/Honor", "fixed"],
    ["pengeluaran", "makan", "Makan", "daily"],
    ["pengeluaran", "transport", "Transport", "operational"],
    ["investasi", "saham", "Saham", "long_term"],
    ["investasi", "emas", "Beli Emas", "hedge"],
    ["ui", "currency", "IDR", "Rupiah"],
    ["ui", "locale", "id-ID", "Indonesia"],
    ["validation", "min_amount", "1000", "rupiah"],
    ["validation", "max_amount", "999999999", "rupiah"]
  ],
  "timestamp": "2026-05-24T10:30:00.000Z"
}
```

**Data Format:**
```
[section, key, value, extra]
```

| Section | Key | Value | Extra | Notes |
|---------|-----|-------|-------|-------|
| owner | Name | Theme | Font | Display name, theme ID, font family |
| type | Type | Display | Color | Income/Expense/Investment, display name, color |
| {type} | Category | Display | Category Type | Category key, category display name, type classification |
| ui | Setting | Value | Description | UI settings (currency, locale, date format) |
| validation | Rule | Value | Unit | Validation rules and constraints |

---

## Data Models

### Transaction Object

**Structure:**
```json
{
  "timestamp": "2026-05-24T10:30:00.000Z",
  "date": "2026-05-24",
  "month_key": "2026-05",
  "type": "pengeluaran",
  "category": "makan",
  "detail": "Makan siang",
  "amount": 50000,
  "note": "Bersama rekan",
  "image_url": "https://drive.google.com/open?id=...",
  "entry_id": "a1b2c3d4",
  "sync_status": "synced"
}
```

**Stored in:** Tama or Nana sheet

---

### Categories

#### Pemasukan (Income)
```
uang_jajan      - Uang Jajan (fixed)
gaji_honor      - Gaji/Honor (fixed)
given           - Given^°^ (emotional)
hadiah          - Hadiah (optional)
freelance       - Freelance (optional)
lainnya         - Lainnya (custom)
```

#### Pengeluaran (Expense)
```
tagihan         - Tagihan (fixed)
kebutuhan       - Kebutuhan (fixed)
hobi            - Hobi (flexible)
transport       - Transport (operational)
makan           - Makan (daily)
kesehatan       - Kesehatan (important)
gift            - Gift (optional)
lainnya         - Lainnya (custom)
```

#### Investasi (Investment)
```
saham           - Saham (long_term)
nabung          - Nabung (safe)
emas            - Beli Emas (hedge)
crypto          - Crypto (volatile)
reksadana       - Reksadana (medium)
lainnya         - Lainnya (custom)
```

---

## Error Codes

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| 400 | Missing required fields | Incomplete form | Check all fields are filled |
| 400 | Invalid owner | Owner not Tama/Nana | Select valid owner |
| 400 | Invalid date format | Date not YYYY-MM-DD | Use correct date format |
| 400 | Invalid amount | Amount < 1000 | Enter amount ≥ 1000 |
| 500 | Image upload failed | Drive folder issue | Check folder structure |
| 500 | Sheet write failed | Sheet error | Check sheet exists |
| 500 | Internal error | Unknown issue | Check Apps Script logs |

---

## Rate Limiting

- **No official rate limit** from Google
- **Practical limit:** ~100 requests/minute
- **Quotas:** See Google Apps Script quotas

---

## CORS Policy

- **Apps Script URL:** Accessible from any origin
- **No CORS headers needed:** Apps Script handles this
- **Cross-domain:** OK to call from any frontend URL

---

## Authentication

- **Current:** None (public endpoint)
- **Recommendation:** Add token-based auth for production
  
```javascript
// Add this to Code.gs
function validateToken(token) {
  const validToken = 'YOUR_SECRET_TOKEN_HERE';
  return token === validToken;
}
```

---

## Image Upload

### Format Requirements
- **Accepted:** JPEG, PNG, WebP, GIF
- **Max size:** 5MB
- **Dimensions:** No limit (will be resized if needed)

### Storage
- **Location:** Google Drive
- **Path:** `Budgeting_7386_Attachments/{owner}/{month_key}/`
- **Filename:** `YYYY-MM-DD_{owner}_{entry_id}.{ext}`
- **Access:** Shared link returned in response

### Example
```
Budgeting_7386_Attachments/
├── Tama/
│   ├── 2026-05/
│   │   ├── 2026-05-24_Tama_a1b2c3.jpg
│   │   └── 2026-05-25_Tama_d4e5f6.png
│   └── 2026-06/
└── Nana/
    └── 2026-05/
        └── 2026-05-24_Nana_x7y8z9.jpg
```

---

## Timestamps

- **Format:** ISO 8601 (RFC 3339)
- **Timezone:** UTC
- **Example:** `2026-05-24T10:30:45.000Z`

---

## Sheet Structure

### Transaction Sheets (Tama & Nana)

| Column | Type | Format | Notes |
|--------|------|--------|-------|
| A | timestamp | ISO 8601 | Auto-generated server time |
| B | date | YYYY-MM-DD | User input date |
| C | month_key | YYYY-MM | Derived from date |
| D | type | string | pemasukan/pengeluaran/investasi |
| E | category | string | From config |
| F | detail | string | User description |
| G | amount | number | In Rupiah |
| H | note | string | Optional user notes |
| I | image_url | URL | Google Drive link (if uploaded) |
| J | entry_id | string | Unique ID (8 chars) |
| K | sync_status | string | pending/synced/failed |

---

## Examples

### cURL Example

```bash
curl -X POST "YOUR_APPS_SCRIPT_URL" \
  -d "owner=Tama" \
  -d "date=2026-05-24" \
  -d "type=pengeluaran" \
  -d "category=makan" \
  -d "detail=Makan siang" \
  -d "amount=50000" \
  -d "note=Bersama rekan"
```

### Python Example

```python
import requests

url = "YOUR_APPS_SCRIPT_URL"
data = {
    'owner': 'Tama',
    'date': '2026-05-24',
    'type': 'pengeluaran',
    'category': 'makan',
    'detail': 'Makan siang',
    'amount': '50000',
    'note': 'Bersama rekan'
}

response = requests.post(url, data=data)
print(response.json())
```

### JavaScript Example

```javascript
const data = new FormData();
data.append('owner', 'Tama');
data.append('date', '2026-05-24');
data.append('type', 'pengeluaran');
data.append('category', 'makan');
data.append('detail', 'Makan siang');
data.append('amount', '50000');
data.append('note', 'Bersama rekan');

fetch('YOUR_APPS_SCRIPT_URL', {
  method: 'POST',
  body: data
})
.then(response => response.json())
.then(result => console.log(result));
```

---

## Webhook Integration

Not currently supported, but can be added. Contact developers for custom integrations.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | 2026-05-24 | Initial release |

---

## Support

- **Questions?** Check [README.md](../README.md)
- **Issues?** See [SETUP.md](./SETUP.md) troubleshooting
- **Suggestions?** Contribute to v2 features

---

**Last Updated:** May 24, 2026
