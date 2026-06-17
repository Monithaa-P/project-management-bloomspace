const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:5000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// ✅ IMPORTANT: Set io so routes can access it
app.set('io', io);

// Middleware
app.use(cors({
  origin: "*",
  credentials: true
}));

app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb+srv://monithaa_db_user:monithaa2121@cluster0.e00dgtq.mongodb.net/project_management?retryWrites=true&w=majority')
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.log('❌ MongoDB connection error:', err));

// Models
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
const Comment = require('./models/Comment');

// Routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const commentRoutes = require('./routes/comments');

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);

// Serve frontend files
app.use(express.static(path.join(__dirname, '../client')));

// Socket.io for real-time updates - NO AUTH MIDDLEWARE
io.on('connection', (socket) => {
  console.log('🌸 New client connected, ID:', socket.id);
  
  // Store user ID with socket
  socket.on('register-user', (userId) => {
    socket.userId = userId;
    console.log(`✅ User ${userId} registered with socket ${socket.id}`);
  });
  
  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
    console.log(`🌿 User ${socket.userId} joined project ${projectId}`);
  });
  
  socket.on('new-task', (data) => {
    console.log(`📝 New task in project ${data.projectId}`);
    io.to(`project-${data.projectId}`).emit('task-created', data.task);
  });
  
  socket.on('update-task', (data) => {
    console.log(`🔄 Task updated in project ${data.projectId}`);
    io.to(`project-${data.projectId}`).emit('task-updated', data.task);
  });
  
  socket.on('new-comment', (data) => {
    console.log(`💬 New comment in project ${data.projectId}`);
    io.to(`project-${data.projectId}`).emit('new-comment', data);
  });
  
  socket.on('invitation-accepted', (data) => {
    console.log(`🎉 Invitation accepted for project ${data.projectId}`);
    io.to(`project-${data.projectId}`).emit('member-joined', data);
  });
  
  socket.on('disconnect', () => {
    console.log(`❌ Client ${socket.id} disconnected`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌸 BloomSpace is ready! Open http://localhost:${PORT}`);
});