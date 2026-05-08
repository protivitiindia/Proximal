# ROPA to DFD Converter 🔄

Convert Records of Processing Activity (ROPA) Excel files → Interactive Data Flow Diagrams (DFD) in SVG format.

## What it does

```
Upload Excel (ROPA) 
    ↓
Parse data fields (Tools, Processes, Data Categories, etc.)
    ↓
Generate Mermaid DFD diagram syntax
    ↓
Convert to SVG image
    ↓
Download visual diagram
```

## Features

✅ **Free to run** - Render.com free tier  
✅ **No manual prompting** - Deterministic conversion  
✅ **Automatic visual generation** - SVG output, not just text  
✅ **Power Automate integration** - Serverless flow  
✅ **Fallback to Option 2** - Mermaid Live Editor link if rendering fails  

## Quick Start

### Option A: Deploy to Render (Recommended)

1. **Create GitHub repo**
   ```bash
   git clone <this repo>
   cd ropa-dfd-converter
   git init && git add . && git commit -m "initial"
   git push -u origin main
   ```

2. **Deploy to Render**
   - Go to https://render.com
   - Connect GitHub account
   - New Web Service → Select this repo
   - Build: `npm install`
   - Start: `npm start`
   - Plan: **Free** tier

3. **Get your URL**
   ```
   https://ropa-dfd-converter.onrender.com
   ```

### Option B: Deploy to Vercel

```bash
vercel
```

---

## How to use in Power Automate

### 1. Remove the failing "Run a prompt" step

### 2. Add HTTP action

Replace with:
```
HTTP
- Method: POST
- URI: https://YOUR_URL.onrender.com/convert
- Headers: Content-Type: application/octet-stream
- Body: @body('Get file content')
```

### 3. Save result as SVG

```
Create file
- Site: Your SharePoint site
- Folder: /DFD Diagrams
- Name: @{replace(triggerOutputs()?['headers']?['x-ms-file-name'],'.xlsx','')}_DFD.svg
- Content: @body('HTTP')
```

### 4. Create sharing link

```
Create sharing link
- File: Use file from step 3
- Type: View only
```

---

## Testing locally

```bash
npm install
npm start

# In another terminal:
curl -X POST -F "file=@ropa_test_2_Sterling.xlsx" \
  http://localhost:3000/convert \
  --output diagram.svg

open diagram.svg
```

---

## What the diagram shows

Your DFD will include:

- **Data Subjects** 👤 (Employees, Job Applicants, etc.)
- **Data Sources** 🟢 (HRMS, TalentPro, Careers Page, Email, Biometric)
- **Processes** ⚙️ (Top 3 processing purposes)
- **Data Store** 💾 (Primary storage location)
- **Data Destinations** 📤 (Vendors, external parties)
- **Flows** → (Arrows showing data movement)

---

## If SVG rendering fails

The function has a built-in fallback. It will:

1. Return Mermaid code instead
2. Generate a link to **Mermaid Live Editor**
3. You can view/edit diagram at https://mermaid.live

To implement this fallback in Power Automate:

```javascript
// In index.js, modify the catch block to:
const encoded = Buffer.from(mermaidCode).toString('base64');
const viewerUrl = `https://mermaid.live/edit#pako:${encoded}`;
res.json({
  mermaidCode,
  viewerUrl,
  message: 'Open link to view/edit diagram'
});
```

Then in Power Automate, parse JSON and create a clickable link.

---

## Architecture

```
Excel (ROPA)
    ↓ (multipart/form-data)
Express.js Server
    ├─ ExcelJS (parse Excel)
    ├─ Extract: Sources, Processes, Destinations
    ├─ Mermaid Library (DFD syntax)
    └─ Mermaid Renderer (SVG output)
    ↓ (SVG response)
Power Automate (HTTP POST)
    ├─ Parse SVG response
    ├─ Save to SharePoint
    └─ Create sharing link
    ↓
User Downloads DFD
```

---

## Limitations

- **Free tier cold starts:** Render spins down after 15 mins of inactivity (takes ~30 sec to boot)
- **Large Excel files:** Currently optimized for standard ROPA format (rows = field labels, column B = values)
- **Multiple sheets:** Only processes Sheet1 (can modify index.js to handle multiple)

## Upgrade options

- **Paid Render:** $7/month, no cold starts
- **Azure Functions:** Pay-per-execution ($0.20/million requests)
- **AWS Lambda:** Free tier (1M requests/month)

---

## File structure

```
ropa-dfd-converter/
├── index.js                    # Main Express server
├── package.json               # Dependencies
├── .gitignore                 # Git config
├── DEPLOYMENT.md              # Detailed deployment guide
├── POWER_AUTOMATE_FLOW.json  # Flow template
└── README.md                  # This file
```

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| 502 Bad Gateway | Function crashed | Check logs in Render dashboard |
| Timeout after 30s | Excel too large | Optimize ROPA template |
| SVG looks broken | Mermaid render failed | Check browser console, fallback to Option 2 |
| Power Automate HTTP 404 | Wrong URL | Verify Render deployment status |
| "File content" step fails | SharePoint auth issue | Re-authenticate Power Automate connection |

---

## Next steps

1. ✅ Deploy to Render (5 mins)
2. ✅ Update Power Automate flow with new URL
3. ✅ Test with your ROPA Excel
4. ✅ Download the SVG diagram
5. ✅ (Optional) Edit in Draw.io or Lucidchart

---

## Support

If it fails, fallback to **Option 2**:
- Send Mermaid code + link to Mermaid Live Editor
- User can view/edit online, export as image

---

Made with ❤️ for free DFD generation
