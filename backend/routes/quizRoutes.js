const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const QuizResult = require('../models/QuizResult');

// Save quiz results
router.post('/results', auth, async (req, res) => {
  try {
    const { moduleId, score, totalQuestions, answers } = req.body;
    const userId = req.user.id;

    // Check if a result already exists for this user and module
    let quizResult = await QuizResult.findOne({ userId, moduleId });

    if (quizResult) {
      // Update existing result if score is better
      if (score > quizResult.score) {
        quizResult.score = score;
        quizResult.totalQuestions = totalQuestions;
        quizResult.answers = answers;
        quizResult.attemptedAt = Date.now();
        quizResult.attempts = quizResult.attempts + 1;
      } else {
        // Just increment attempts if score isn't better
        quizResult.attempts = quizResult.attempts + 1;
      }
    } else {
      // Create new result
      quizResult = new QuizResult({
        userId,
        moduleId,
        score,
        totalQuestions,
        answers,
        attempts: 1
      });
    }

    await quizResult.save();
    res.status(200).json(quizResult);
  } catch (error) {
    console.error('Error saving quiz result:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get quiz results for a specific module
router.get('/results/:moduleId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { moduleId } = req.params;

    const quizResult = await QuizResult.findOne({ userId, moduleId });
    
    if (!quizResult) {
      return res.status(404).json({ message: "No quiz results found" });
    }

    res.status(200).json(quizResult);
  } catch (error) {
    console.error('Error fetching quiz result:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;