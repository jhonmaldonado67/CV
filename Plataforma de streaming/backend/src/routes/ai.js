import express from 'express';
import { chatAssistant, getRecommendations, getTrivia } from '../controllers/aiController.js';

const router = express.Router();

router.post('/chat', chatAssistant);
router.post('/recommend', getRecommendations); // Overriding old one
router.post('/trivia', getTrivia);

export default router;
