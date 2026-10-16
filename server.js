require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const WRITE_KEY = process.env.WRITE_KEY || ''; // खाली हो तो कोई भी सेव कर सकता है

if (!MONGODB_URI) {
  console.error('MONGODB_URI सेट नहीं है (.env या Render Environment में डालें)');
  process.exit(1);
}

const Question = mongoose.model(
  'Question',
  new mongoose.Schema({ id: { type: Number, unique: true, index: true } }, { strict: false, versionKey: false })
);
const Meta = mongoose.model(
  'Meta',
  new mongoose.Schema({ _id: String, v: mongoose.Schema.Types.Mixed }, { versionKey: false })
);

const app = express();
app.use(express.json({ limit: '10mb' }));

const needKey = (req, res, next) => {
  if (!WRITE_KEY || req.get('x-write-key') === WRITE_KEY) return next();
  res.status(401).json({ error: 'unauthorized' });
};

app.get('/healthz', (req, res) => res.send('ok'));

app.get('/api/data', async (req, res) => {
  try {
    const [questions, seenDoc, seededDoc, trashDoc] = await Promise.all([
      Question.find({}, { _id: 0 }).sort({ id: 1 }).lean(),
      Meta.findById('seen').lean(),
      Meta.findById('seeded').lean(),
      Meta.findById('trash').lean(),
    ]);
    res.json({
      questions,
      seen: (seenDoc && seenDoc.v) || {},
      seeded: !!seededDoc,
      trash: (trashDoc && trashDoc.v) || [],
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server error' });
  }
});

app.put('/api/questions', needKey, async (req, res) => {
  try {
    let qs = req.body && req.body.questions;
    if (!Array.isArray(qs) || qs.some((q) => !q || typeof q.q !== 'string' || !Array.isArray(q.a))) {
      return res.status(400).json({ error: 'invalid questions' });
    }
    const used = new Set();
    let extra = 0;
    qs = qs.map((q) => {
      const item = { ...q };
      delete item._id;
      if (typeof item.id !== 'number' || used.has(item.id)) item.id = Date.now() * 1000 + 900 + extra++;
      used.add(item.id);
      return item;
    });
    if (qs.length) {
      await Question.bulkWrite(
        qs.map((q) => ({ replaceOne: { filter: { id: q.id }, replacement: q, upsert: true } })),
        { ordered: false }
      );
    }
    await Question.deleteMany({ id: { $nin: qs.map((q) => q.id) } });
    await Meta.updateOne({ _id: 'seeded' }, { $set: { v: true } }, { upsert: true });
    res.json({ ok: true, count: qs.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server error' });
  }
});

app.put('/api/seen', needKey, async (req, res) => {
  try {
    const seen = req.body && req.body.seen;
    if (!seen || typeof seen !== 'object' || Array.isArray(seen)) return res.status(400).json({ error: 'invalid seen' });
    await Meta.updateOne({ _id: 'seen' }, { $set: { v: seen } }, { upsert: true });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server error' });
  }
});

app.put('/api/trash', needKey, async (req, res) => {
  try {
    const trash = req.body && req.body.trash;
    if (!Array.isArray(trash)) return res.status(400).json({ error: 'invalid trash' });
    await Meta.updateOne({ _id: 'trash' }, { $set: { v: trash.slice(0, 50) } }, { upsert: true });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server error' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => console.log('Server चालू: पोर्ट ' + PORT));
  })
  .catch((err) => {
    console.error('MongoDB से कनेक्ट नहीं हुआ:', err.message);
    process.exit(1);
  });
