const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
const upload = multer();

app.use(cors());

app.post('/vectorize', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucune image fournie' });
  }

  const apiId = process.env.VECTORIZER_API_ID;
  const apiSecret = process.env.VECTORIZER_API_SECRET;

  if (!apiId || !apiSecret) {
    return res.status(500).json({ error: 'Identifiants API manquants' });
  }

  const credentials = Buffer.from(`${apiId}:${apiSecret}`).toString('base64');
  const authHeader = `Basic ${credentials}`;

  try {
    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const response = await fetch('https://vectorizer.ai/api/v1/vectorize', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
      },
      body: formData,
    });

    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('image/svg+xml')) {
      const svg = await response.text();
      return res.status(200).json({ svgContent: svg });
    } else if (contentType && contentType.includes('application/json')) {
      const json = await response.json();
      return res.status(response.status).json(json);
    } else {
      const rawText = await response.text();
      return res.status(response.status).json({
        error: 'Réponse inattendue',
        raw: rawText,
      });
    }
  } catch (error) {
    console.error('❌ Erreur proxy :', error);
    res.status(500).json({ error: 'Erreur proxy', details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Proxy Vectorizer.AI démarré sur le port ${PORT}`);
});
