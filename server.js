const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');

const KEY_FILE = './service-account.json';
const SCOPES = ['https://www.googleapis.com/auth/androidmanagement'];
const PORT = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE,
  scopes: SCOPES,
});

async function androidManagementClient() {
  const client = await auth.getClient();
  return google.androidmanagement({ version: 'v1', auth: client });
}

// Enterprise create (একবার)
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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Enrollment token
app.post('/create-token', async (req, res) => {
  try {
    const { enterpriseName, policyName } = req.body;
    const androidmanagement = await androidManagementClient();

    const resp = await androidmanagement.enterprises.enrollmentTokens.create({
      parent: enterpriseName,
      requestBody: { policyName },
    });

    res.json({ token: resp.data.value });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});