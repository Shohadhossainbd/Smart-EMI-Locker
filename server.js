// server.js
const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const path = require('path');

const SCOPES = ['https://www.googleapis.com/auth/androidmanagement'];
const PORT = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());

// Serve frontend (index.html root এ আছে)
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ==============================
// Google Auth (ENV based, NO JSON file)
// ==============================
if (
  !process.env.GOOGLE_PROJECT_ID ||
  !process.env.GOOGLE_CLIENT_EMAIL ||
  !process.env.GOOGLE_PRIVATE_KEY
) {
  console.error('❌ Missing Google Service Account ENV variables');
  process.exit(1);
}

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
  return google.androidmanagement({
    version: 'v1',
    auth: client,
  });
}

// ==============================
// 1) Create Enterprise
// ==============================
app.post('/create-enterprise', async (req, res) => {
  try {
    const { displayName, adminEmail } = req.body;

    if (!adminEmail) {
      return res.status(400).json({ error: 'adminEmail is required' });
    }

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
    console.error('Create enterprise error:', err?.response?.data || err.message);
    res.status(500).json({
      error: err?.response?.data || err.message,
    });
  }
});

// ==============================
// 2) Create Enrollment Token
// ==============================
app.post('/create-token', async (req, res) => {
  try {
    const { enterpriseName, policyName } = req.body;

    if (!enterpriseName) {
      return res.status(400).json({ error: 'enterpriseName is required' });
    }

    const androidmanagement = await androidManagementClient();

    const response =
      await androidmanagement.enterprises.enrollmentTokens.create({
        parent: enterpriseName,
        requestBody: {
          policyName: policyName || 'defaultPolicy',
        },
      });

    res.json({
      token: response.data.value,
      expireTime: response.data.expireTime,
    });
  } catch (err) {
    console.error('Create token error:', err?.response?.data || err.message);
    res.status(500).json({
      error: err?.response?.data || err.message,
    });
  }
});

// ==============================
// Start Server
// ==============================
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
