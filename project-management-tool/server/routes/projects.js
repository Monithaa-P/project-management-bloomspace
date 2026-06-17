const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const User = require('../models/User');

// Get all projects for user
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.userId },
        { members: req.userId }
      ]
    }).populate('owner', 'name email');
    
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get single project
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user has access
    if (project.owner._id.toString() !== req.userId && 
        !project.members.some(m => m._id.toString() === req.userId)) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create project
router.post('/', auth, async (req, res) => {
  const { name, description } = req.body;
  
  try {
    const project = new Project({
      name,
      description,
      owner: req.userId
    });
    
    await project.save();
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Add member to project (direct add)
router.post('/:id/members', auth, async (req, res) => {
  const { email } = req.body;
  
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is owner
    if (project.owner.toString() !== req.userId) {
      return res.status(401).json({ message: 'Only project owner can add members' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (project.members.includes(user._id)) {
      return res.status(400).json({ message: 'User already in project' });
    }
    
    project.members.push(user._id);
    await project.save();
    
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get project members
router.get('/:id/members', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('members', 'name email');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user has access
    if (project.owner.toString() !== req.userId && 
        !project.members.some(m => m._id.toString() === req.userId)) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    res.json(project.members);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send invitation
// Send invitation
router.post('/:id/invite', auth, async (req, res) => {
  const { email, inviterName, projectName } = req.body;
  
  console.log("📨 Invitation request:");
  console.log("  Project ID:", req.params.id);
  console.log("  Email:", email);
  console.log("  Inviter:", inviterName);
  console.log("  User ID from token (inviter):", req.userId);
  
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    console.log("  Project owner ID:", project.owner.toString());
    console.log("  Inviter ID:", req.userId.toString());
    console.log("  Do they match?", project.owner.toString() === req.userId.toString());
    
    // FIX: Convert both to string for comparison
    if (project.owner.toString() !== req.userId.toString()) {
      console.log("❌ Access denied - not the owner");
      return res.status(401).json({ message: 'Only project owner can invite members' });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }
    
    if (project.members.includes(user._id)) {
      return res.status(400).json({ message: 'User is already a member' });
    }
    
    if (project.owner.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'You cannot invite yourself' });
    }
    
    const io = req.app.get('io');
    io.emit(`invitation-${user._id}`, {
      inviterName: inviterName,
      projectName: project.name,
      projectId: project._id,
      inviterId: req.userId
    });
    
    io.emit('invitation-received', {
      inviteeEmail: email,
      inviterName: inviterName,
      projectName: project.name,
      projectId: project._id,
      inviterId: req.userId
    });
    
    console.log("✅ Invitation sent successfully");
    res.json({ message: 'Invitation sent successfully' });
  } catch (err) {
    console.error("❌ Invitation error:", err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Accept invitation
router.post('/:id/accept', auth, async (req, res) => {
  console.log("✅ Accepting invitation for project:", req.params.id);
  console.log("  User ID:", req.userId);
  
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if already a member
    if (project.members.includes(req.userId)) {
      return res.status(400).json({ message: 'Already a member' });
    }
    
    // Add user to members
    project.members.push(req.userId);
    await project.save();
    
    // Get user info for notification
    const user = await User.findById(req.userId);
    
    // Notify everyone in the project
    const io = req.app.get('io');
    io.to(`project-${project._id}`).emit('member-joined', {
      projectId: project._id,
      userName: user.name,
      userId: req.userId
    });
    
    console.log("✅ User", user.name, "joined project", project.name);
    res.json({ message: 'Joined project successfully' });
  } catch (err) {
    console.error("❌ Accept error:", err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Update project
router.put('/:id', auth, async (req, res) => {
  const { name, description, status } = req.body;
  
  try {
    let project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.owner.toString() !== req.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, status },
      { new: true }
    );
    
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.owner.toString() !== req.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;