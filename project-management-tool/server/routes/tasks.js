const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Project = require('../models/Project');

// Get tasks for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    
    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create task
router.post('/', auth, async (req, res) => {
  const { title, description, project, assignedTo, priority, dueDate, status } = req.body;
  
  try {
    // Check if user has access to project
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (projectDoc.owner.toString() !== req.userId && 
        !projectDoc.members.includes(req.userId)) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    const task = new Task({
      title,
      description,
      project,
      assignedTo: assignedTo || null,
      createdBy: req.userId,
      priority,
      dueDate,
      status: status || 'todo'
    });
    
    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    
    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update task
router.put('/:id', auth, async (req, res) => {
  const { title, description, assignedTo, status, priority, dueDate } = req.body;
  
  try {
    let task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check project access
    const projectDoc = await Project.findById(task.project);
    if (projectDoc.owner.toString() !== req.userId && 
        !projectDoc.members.includes(req.userId)) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    task = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, assignedTo, status, priority, dueDate },
      { new: true }
    ).populate('assignedTo', 'name email')
     .populate('createdBy', 'name email');
    
    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    const projectDoc = await Project.findById(task.project);
    if (projectDoc.owner.toString() !== req.userId) {
      return res.status(401).json({ message: 'Only project owner can delete tasks' });
    }
    
    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;