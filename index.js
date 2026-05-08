const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ExcelJS = require('exceljs');
const { mermaidToImage } = require('mermaid');
const fs = require('fs');
const path = require('path');

const app = express();

// Enable CORS for GitHub Pages
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

const upload = multer({ storage: multer.memoryStorage() });

// Parse ROPA Excel and extract key data
async function parseROPA(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];

  const data = {};
  for (let row of worksheet.getSheetValues()) {
    if (row && row[1] && row[2]) {
      const key = String(row[1]).trim().toLowerCase();
      const value = String(row[2]).trim();
      data[key] = value;
    }
  }

  return data;
}

// Extract structured info from ROPA text fields
function extractInfo(ropData) {
  const sources = extractItems(ropData['tools/ application'] || '');
  const processes = extractItems(ropData['purpose of processing'] || '');
  const dataCategories = extractItems(ropData['categories of personal data'] || '');
  const destinations = extractItems(ropData['data destination'] || '');
  const locations = extractItems(ropData['location of personal data'] || '');
  const dataSubjects = extractItems(ropData['categories of data principals'] || '');

  return {
    businessFunction: ropData['business function'] || 'Data Processing',
    sources,
    processes,
    dataCategories,
    locations,
    destinations,
    dataSubjects,
  };
}

// Helper: extract numbered/bulleted list items
function extractItems(text) {
  if (!text) return [];
  return text
    .split(/[\n,]+/)
    .map(item => item.replace(/^\d+\.\s*|^[-*]\s*/, '').trim())
    .filter(item => item.length > 2 && item.length < 50);
}

// Generate Mermaid DFD syntax
function generateMermaidDFD(info) {
  let mermaid = 'graph TD\n';

  // Define nodes
  const dataSubjectsNode = 'DS["👤 Data Subjects<br/>' + info.dataSubjects.slice(0, 2).join(', ') + '"]';
  const sourcesNodes = info.sources.slice(0, 4).map((s, i) => `SRC${i}["${s}"]`);
  const processesNodes = info.processes.slice(0, 3).map((p, i) => `PROC${i}["⚙️ ${p}"]`);
  const dataStoreNode = `DS["💾 Data Store<br/>${info.locations.slice(0, 1).join(', ')}"]`;
  const destinationsNodes = info.destinations.slice(0, 2).map((d, i) => `DEST${i}["📤 ${d}"]`);

  // Add nodes
  mermaid += `\n${dataSubjectsNode}\n`;
  mermaid += sourcesNodes.join('\n') + '\n';
  mermaid += processesNodes.join('\n') + '\n';
  mermaid += dataStoreNode + '\n';
  mermaid += destinationsNodes.join('\n') + '\n';

  // Add connections
  info.sources.slice(0, 3).forEach((_, i) => {
    mermaid += `SRC${i} --> PROC0\n`;
  });

  info.processes.slice(0, 3).forEach((_, i) => {
    mermaid += `PROC${i} --> DS\n`;
  });

  mermaid += `DS --> DEST0\n`;
  if (destinationsNodes.length > 1) mermaid += `DS --> DEST1\n`;

  mermaid += `\nclassDef source fill:#90EE90,stroke:#2d5016,stroke-width:2px\n`;
  mermaid += `classDef process fill:#87CEEB,stroke:#003d99,stroke-width:2px\n`;
  mermaid += `classDef store fill:#DDA0DD,stroke:#663366,stroke-width:2px\n`;
  mermaid += `classDef destination fill:#FFB347,stroke:#994400,stroke-width:2px\n`;
  mermaid += `class ${sourcesNodes.map((_, i) => `SRC${i}`).join(',')} source\n`;
  mermaid += `class ${processesNodes.map((_, i) => `PROC${i}`).join(',')} process\n`;
  mermaid += `class DS store\n`;
  mermaid += `class ${destinationsNodes.map((_, i) => `DEST${i}`).join(',')} destination\n`;

  return mermaid;
}

// Convert Mermaid to SVG using mermaid-cli
async function mermaidToSVG(mermaidCode) {
  try {
    const { render } = await import('mermaid');
    
    // Initialize mermaid
    render.setConfig({ 
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose'
    });

    const { svg } = await render.render('diagram', mermaidCode);
    return svg;
  } catch (error) {
    console.error('Mermaid render error:', error);
    // Fallback: return mermaid code as-is with instructions
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="400">
        <rect width="100%" height="100%" fill="white" stroke="black" stroke-width="2"/>
        <text x="50" y="50" font-size="16" fill="black">
          Mermaid Diagram (render at mermaid.live)
        </text>
        <text x="50" y="100" font-size="12" font-family="monospace" fill="gray">
          ${mermaidCode.split('\n').slice(0, 5).join('<tspan x="50" dy="20">')}
        </text>
      </svg>
    `;
  }
}

// Main endpoint
app.post('/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Parse Excel
    const ropData = await parseROPA(req.file.buffer);
    const info = extractInfo(ropData);

    // Generate Mermaid
    const mermaidCode = generateMermaidDFD(info);

    // Convert to SVG
    const svg = await mermaidToSVG(mermaidCode);

    // Return SVG
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ROPA DFD Converter running on port ${PORT}`);
});
