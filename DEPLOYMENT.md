# ROPA DFD Converter - Deployment Guide

## Deploy to Render.com (FREE)

### Step 1: Push code to GitHub
```bash
# Create a new GitHub repo and push this code
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ropa-dfd-converter.git
git branch -M main
git push -u origin main
```

### Step 2: Create Render account
1. Go to **https://render.com**
2. Sign up with GitHub
3. Click **New** → **Web Service**
4. Select your GitHub repo
5. Configure:
   - **Name:** ropa-dfd-converter
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
6. Click **Create Web Service**

### Step 3: Get your endpoint
Once deployed, you'll get a URL like:
```
https://ropa-dfd-converter.onrender.com
```

---

## Test the function locally

```bash
# Install dependencies
npm install

# Start server
npm start

# In another terminal, test with curl:
curl -X POST -F "file=@/path/to/ropa_test_2_Sterling.xlsx" \
  http://localhost:3000/convert \
  --output diagram.svg
```

---

## Use in Power Automate

### Step 1: Replace "Run a prompt" with HTTP action
1. Delete the failing "Run a prompt" step
2. Add **HTTP** action
3. Configure:
   - **Method:** POST
   - **URI:** `https://your-render-url.onrender.com/convert`
   - **Headers:** 
     ```
     Content-Type: application/octet-stream
     ```
   - **Body:** `@body('Get file content')`

### Step 2: Save SVG to SharePoint
1. Add **Create file** action
2. Configure:
   - **Site Address:** Your SharePoint site
   - **Folder Path:** `/DFD Diagrams/`
   - **File Name:** `@{triggerOutputs()?['headers']?['x-ms-file-name']}.svg`
   - **File Content:** `@body('HTTP')`

### Step 3: Create shareable link
1. Add **Create sharing link for a file or folder**
2. Use the file created in step 2
3. Set link type to **View only**

---

## Fallback to Option 2 (if SVG rendering fails)

If mermaid SVG generation fails, the function will:
1. Return Mermaid code instead
2. Generate a link to **Mermaid Live Editor**
3. User can view/edit diagram online

Edit `index.js` line ~90 to add fallback:

```javascript
// Fallback: Send to Mermaid Live Editor
const encoded = Buffer.from(mermaidCode).toString('base64');
const viewerUrl = `https://mermaid.live/edit#pako:${encoded}`;
res.json({ 
  mermaidCode,
  viewerUrl,
  message: 'Open in Mermaid Live Editor'
});
```

Then in Power Automate, parse the JSON and create a clickable link.

---

## Troubleshooting

**Issue:** Function times out
- **Solution:** Render free tier spins down after 15 mins. Upgrade to paid, or use Option 2 (Mermaid Live Editor)

**Issue:** SVG not rendering properly
- **Solution:** Fall back to Option 2 (send Mermaid code + link)

**Issue:** Excel parsing fails
- **Solution:** Ensure Excel has data in columns A & B only, with field names in A and values in B

