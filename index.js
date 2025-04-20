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
    console.log("⚠️ Aucune image reçue dans la requête");
    return res.status(400).json({ error: 'Aucune image fournie' });
  }

  const apiId = process.env.VECTORIZER_API_ID;
  const apiSecret = process.env.VECTORIZER_API_SECRET;

  if (!apiId || !apiSecret) {
    console.log("❌ Identifiants API manquants");
    return res.status(500).json({ error: 'Identifiants API manquants' });
  }

  // Création de l'encodage Basic Auth
  const credentials = Buffer.from(`${apiId}:${apiSecret}`).toString('base64');
  const authHeader = `Basic ${credentials}`;

  console.log("🔐 Auth header utilisé :", authHeader);

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

    const data = await response.json();
    console.log("📦 Réponse de Vectorizer.AI :", data);
    res.status(response.status).json(data);
  } catch (error) {
    console.error('❌ Erreur dans le proxy (catch) :', error);
    res.status(500).json({ error: 'Erreur interne du proxy', details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Proxy Vectorizer.AI démarré sur le port ${PORT}`);
});
