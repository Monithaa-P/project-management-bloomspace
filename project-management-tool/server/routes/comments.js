const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Comment = require('../models/Comment');
const Project = require('../models/Project');

// Get comments for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const comments = await Comment.find({ projectId: req.params.projectId })
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a comment
router.post('/', auth, async (req, res) => {
  const { content, projectId, userName } = req.body;
  
  try {
    // Check if user has access to project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is owner or member
    if (project.owner.toString() !== req.userId && 
        !project.members.includes(req.userId)) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    const comment = new Comment({
      content,
      projectId,
      userId: req.userId,
      userName: userName || 'User'
    });
    
    await comment.save();
    
    // Get the populated comment to send back
    const savedComment = await Comment.findById(comment._id);
    
    res.json(savedComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a comment
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if user owns the comment
    if (comment.userId.toString() !== req.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;