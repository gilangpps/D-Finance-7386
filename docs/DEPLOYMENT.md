# Deployment Guide - Bex 7386 Budgeting App

## 🚀 Deployment Options

Choose based on your needs:

| Option | Difficulty | Cost | Best For |
|--------|-----------|------|----------|
| Local/File | ⭐ Easy | Free | Development, Testing |
| GitHub Pages | ⭐⭐ Medium | Free | Public projects |
| Vercel | ⭐⭐ Medium | Free | Modern hosting |
| Netlify | ⭐⭐ Medium | Free | Jamstack |
| Traditional Host | ⭐⭐⭐ Hard | $ | Custom domains |

## 📋 Pre-Deployment Checklist

- [ ] Google Apps Script deployed and working
- [ ] Deployment URL tested
- [ ] All data flows working
- [ ] Images uploading correctly
- [ ] Config loading from Sheets
- [ ] Both themes working
- [ ] Mobile responsiveness tested
- [ ] No console errors in browser

## Option 1: Local / File Based (Simplest)

### For Development & Testing

1. **Direct file access:**
   ```
   file:///C:/path/to/frontend/index.html
   ```

2. **Or use Python simple server:**
   ```bash
   # Navigate to frontend folder
   cd frontend
   
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```
   Then visit: `http://localhost:8000`

### Limitations
- ❌ Can't upload images to Drive
- ❌ Can't access external APIs
- ✅ Great for testing forms locally

---

## Option 2: GitHub Pages (Free & Easy)

### Prerequisites
- GitHub account
- Git installed locally

### Steps

1. **Create GitHub repository:**
   - Go to https://github.com/new
   - Name: `bex-7386-budgeting` (or similar)
   - Choose Public
   - Click "Create repository"

2. **Clone and add files:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/bex-7386-budgeting.git
   cd bex-7386-budgeting
   
   # Copy frontend folder to repo
   cp -r path/to/frontend/* .
   
   # Add and commit
   git add .
   git commit -m "Initial commit: budgeting app"
   git push -u origin main
   ```

3. **Enable GitHub Pages:**
   - Go to repository Settings
   - Scroll to "Pages" section
   - Source: Branch `main`, folder `/root`
   - Save

4. **Access your app:**
   ```
   https://YOUR_USERNAME.github.io/bex-7386-budgeting/
   ```

5. **Update frontend to use Apps Script:**
   - Edit `frontend/js/main.js` around line 60
   - Or use browser console to set URL

### Advantages
- ✅ Free hosting
- ✅ Easy deployment
- ✅ Works with Apps Script
- ✅ HTTPS by default

---

## Option 3: Vercel (Modern & Fast)

### Prerequisites
- Vercel account (free at vercel.com)
- GitHub account connected

### Steps

1. **Create Vercel project:**
   - Go to https://vercel.com/import
   - Connect GitHub repository (from Option 2)
   - Select your budgeting app repo
   - Click Import

2. **Configure:**
   - Framework: `Other` (static)
   - Root Directory: `frontend`
   - Click Deploy

3. **Your app is live at:**
   ```
   https://[PROJECT_NAME].vercel.app
   ```

4. **Auto-deploys on push:**
   ```bash
   git push origin main
   # Vercel automatically deploys changes
   ```

### Advantages
- ✅ Free tier available
- ✅ Auto-deploys from GitHub
- ✅ Fast global CDN
- ✅ HTTPS by default

---

## Option 4: Netlify (Also Modern)

### Prerequisites
- Netlify account (free at netlify.com)
- GitHub account connected

### Steps

1. **Connect to GitHub:**
   - Go to https://app.netlify.com
   - Click "New site from Git"
   - Choose GitHub
   - Select repository
   - Authorize if needed

2. **Build settings:**
   - Build command: (leave empty)
   - Publish directory: `frontend`
   - Click "Deploy site"

3. **Your app is live at:**
   ```
   https://[random-name].netlify.app
   ```

### Advantages
- ✅ Simple setup
- ✅ Free hosting
- ✅ Good interface
- ✅ Form submissions supported

---

## Option 5: Custom Domain

### Using GitHub Pages + Custom Domain

1. **Buy domain:**
   - Namecheap, GoDaddy, Google Domains, etc.

2. **Update DNS:**
   - Point to GitHub Pages:
     ```
     A: 185.199.108.153
     A: 185.199.109.153
     A: 185.199.110.153
     A: 185.199.111.153
     CNAME: username.github.io
     ```

3. **Update GitHub Pages settings:**
   - Repository Settings → Pages
   - Custom domain: `yourdomain.com`
   - Enable HTTPS

4. **Access at:**
   ```
   https://yourdomain.com
   ```

---

## 🔐 Production Considerations

### Security

1. **Environment Variables:**
   ```javascript
   // DON'T hardcode sensitive data
   // Use environment variables instead
   const APPS_SCRIPT_URL = process.env.REACT_APP_SCRIPT_URL;
   ```

2. **CORS Headers:**
   - Apps Script handles CORS automatically
   - Frontend can call from any domain

3. **Validation:**
   - Frontend validation is for UX
   - Backend validation (Apps Script) is for security
   - Always validate on backend!

### Performance

1. **Minimize CSS/JS:**
   ```bash
   # Install build tools
   npm install -D cssnano terser
   
   # Minify CSS
   npx cssnano css/main.css -o css/main.min.css
   ```

2. **Optimize Images:**
   - Compress before uploading
   - Users already manage via frontend

3. **Lazy Load:**
   - Load config only once
   - Cache in localStorage

### Monitoring

1. **Track errors:**
   - Set up Sentry.io (free tier)
   - Or Google Analytics

2. **Monitor Form Submissions:**
   - Check Apps Script execution logs
   - Monitor sheet data growth

---

## 📊 Staging vs Production

### Development
- Local file or local server
- Test with sample data
- Check console for errors

### Staging
- GitHub Pages or similar
- Share link with Tama/Nana for testing
- Verify all flows work

### Production
- Custom domain or stable URL
- Monitor performance
- Keep backups of Sheets
- Document changes

---

## 🔄 Update Process

After changes to code:

1. **Update frontend:**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```

2. **Deploy automatically:**
   - GitHub Pages / Vercel / Netlify auto-deploy
   - Usually takes 1-5 minutes

3. **Update backend (if needed):**
   - Edit `Code.gs` or `Config.gs`
   - Click Save in Apps Script editor
   - Redeploy if needed (for version changes)

---

## 🐛 Deployment Troubleshooting

### "Blank page or 404"
- Check deployment completed successfully
- Check files are in correct directory
- Check path to `index.html`

### "Scripts don't load"
- Check file paths are correct
- Ensure CSS/JS files are uploaded
- Check browser console for 404 errors

### "Can't submit form"
- Verify Apps Script deployment URL
- Check browser console for CORS errors
- Apps Script URL must be set before first submit

### "Images not uploading"
- Check Drive folder structure exists
- Verify Google account has access
- Check folder permissions

---

## 📞 Performance Monitoring

### Monitor Form Submissions
```javascript
// In browser console
fetch('YOUR_APPS_SCRIPT_URL', {
  method: 'POST',
  body: new FormData(document.getElementById('transactionForm'))
})
.then(r => r.json())
.then(data => console.log(data))
```

### Check Sheets Performance
- Google Sheets → Tools → Performance
- View execution details
- Optimize queries if needed

---

## 🎉 You're Deployed!

Your app is now live and ready for use!

- ✅ Share the URL with Tama & Nana
- ✅ Start logging transactions
- ✅ Data persists to Sheets automatically
- ✅ Images upload to Drive
- ✅ Switch themes as needed

---

## Next Steps

1. Monitor for errors in first week
2. Gather feedback from users
3. Plan v2 features
4. Consider improvements based on usage

---

**Current Deployment Status:**
- Frontend: [Your URL]
- Backend: [Your Apps Script URL]
- Database: [Your Spreadsheet]
- Storage: [Your Drive Folder]

---

For questions, see [README.md](../README.md) or [SETUP.md](./SETUP.md).
