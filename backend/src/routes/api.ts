import { Router, Request, Response } from 'express';
import multer from 'multer';
import { extractText } from '../services/pdfParser';
import { processDocuments, queryRAG, getSession } from '../services/ragPipeline';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// upload resume + JD, get match analysis
router.post(
  '/upload',
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'jobDescription', maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (!files?.resume?.[0] || !files?.jobDescription?.[0]) {
        return res.status(400).json({ error: 'Both resume and job description files are required.' });
      }

      const resumeFile = files.resume[0];
      const jdFile = files.jobDescription[0];

      const resumeText = await extractText(resumeFile.buffer, resumeFile.originalname);
      const jdText = await extractText(jdFile.buffer, jdFile.originalname);

      if (!resumeText.trim() || !jdText.trim()) {
        return res.status(400).json({ error: 'Could not extract text from uploaded files.' });
      }

      const session = await processDocuments(resumeText, jdText);

      res.json({
        sessionId: session.id,
        matchResult: session.matchResult,
      });
    } catch (error: any) {
      console.error('[API] Upload error:', error);
      res.status(500).json({ error: error.message || 'Processing failed' });
    }
  }
);

// chat with RAG
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { sessionId, question } = req.body;

    if (!sessionId || !question) {
      return res.status(400).json({ error: 'sessionId and question are required.' });
    }

    const result = await queryRAG(sessionId, question);
    res.json(result);
  } catch (error: any) {
    console.error('[API] Chat error:', error);
    res.status(500).json({ error: error.message || 'Chat query failed' });
  }
});

// get session data
router.get('/session/:id', (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const session = getSession(id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json({
    sessionId: session.id,
    matchResult: session.matchResult,
    conversationHistory: session.conversationHistory,
  });
});

export default router;
