// server.js
const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const path = require('path');

const SCOPES = ['https://www.googleapis.com/auth/androidmanagement'];
const PORT = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());

// Serve frontend
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ✅ Google Auth using ENV (NO JSON FILE)
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  projectId: process.env.GOOGLE_PROJECT_ID,
  scopes: SCOPES,
});

async function androidManagementClient() {
  const client = await auth.getClient();
  return google.androidmanagement({ version: 'v1', auth: client });
}

// 1) Create enterprise
app.post('/create-enterprise', async (req, res) => {
  try {
    const { displayName, adminEmail } = req.body;
    const androidmanagement = await androidManagementClient();

    const response = await androidmanagement.enterprises.create({
      projectId: process.env.GOOGLE_PROJECT_ID,
      requestBody: {
        enterpriseDisplayName: displayName || 'My Enterprise',
        adminEmail,
      },
    });

    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 2) Create enrollment token
app.post('/create-token', async (req, res) => {
  try {
    const { enterpriseName, policyName } = req.body;
    const androidmanagement = await androidManagementClient();

    const resp = await androidmanagement.enterprises.enrollmentTokens.create({
      parent: enterpriseName,
      requestBody: { policyName },
    });

    res.json({ token: resp.data.value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
