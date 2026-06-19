const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Parsa JSON-bodar
app.use(express.json());

// CORS headers för cross-origin requests (tillåter React på 5173 att anropa)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Servera statiska filer från den aktuella mappen
app.use(express.static(__dirname));

// POST API för registrering av admin-tid (från RTM-chattbott)
app.post('/api/admin-time', (req, res) => {
  console.log('===================================================');
  console.log('  Mottog RTM-integrationsbegäran:');
  console.log('  Agent:', req.body.agentName);
  console.log('  Varaktighet:', req.body.durationMinutes, 'min');
  console.log('  Anledning:', req.body.reason);
  console.log('===================================================');
  
  res.json({
    success: true,
    message: 'Admin-tid framgångsrikt synkroniserad med WFM-databasen',
    timestamp: new Date().toISOString(),
    receivedData: req.body
  });
});

// Skicka alla övriga förfrågningar till index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log('===================================================');
  console.log('  Schemly server startade framgångsrikt!');
  console.log(`  Öppna appen i webbläsaren: http://localhost:${PORT}`);
  console.log('  Avsluta servern genom att trycka på Ctrl+C');
  console.log('===================================================');
});
