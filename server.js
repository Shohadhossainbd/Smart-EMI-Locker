const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const KEY_FILE = './service-account.json';
const SCOPES = ['https://www.googleapis.com/auth/androidmanagement'];
const PORT = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());

// Serve the HTML from root (no public folder)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Google Auth
const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE,
  scopes: SCOPES,
});

async function androidManagementClient() {
  const client = await auth.getClient();
  return google.androidmanagement({ version: 'v1', auth: client });
}

// 1) Create enterprise
app.post('/create-enterprise', async (req, res) => {
  try {
    const { projectId, displayName, adminEmail } = req.body;
    const androidmanagement = await androidManagementClient();

    const response = await androidmanagement.enterprises.create({
      projectId,
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
