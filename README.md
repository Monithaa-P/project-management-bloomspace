# 🌸 BloomSpace - Collaborative Project Management Tool

A beautiful, real-time project management tool designed for team collaboration. Features task boards, team invitations, real-time chat, and a stunning floral UI with comet cursor effect.

---

## ✨ Features

- 🔐 **User Authentication** - Register/Login with JWT
- 🌸 **Beautiful UI** - Floral design with comet cursor effect
- 📋 **Kanban Board** - 4 columns (To Do, In Progress, Review, Done)
- 👥 **Team Collaboration** - Invite members via email with real-time notifications
- 💬 **Real-time Chat** - Discussion board for each project
- 📝 **Task Management** - Create, update, prioritize tasks
- 🔄 **Real-time Updates** - WebSocket powered live updates
- 🎯 **Task Priorities** - Low, Medium, High, Urgent
- 📱 **Responsive** - Works on all devices

---

## 🛠️ Tech Stack

### Frontend
- HTML5, CSS3, JavaScript
- Font Awesome Icons
- Google Fonts (Quicksand, Dancing Script)
- Custom CSS with animations

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB Atlas** - Cloud database
- **Socket.io** - Real-time WebSocket communication
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

---
bloomspace-project-management/
├── server/
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   └── Comment.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   └── comments.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   └── package.json
├── client/
│   └── index.html
└── README.md



---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account

### Step 1: Clone the repository

```bash
cd bloomspace-project-management
Step 2: Install dependencies
bash
cd server
npm install
Step 3: Set up environment variables
Create a .env file in the server folder:

env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/project_management?retryWrites=true&w=majority
JWT_SECRET=your_secret_key_change_this
PORT=5000
Step 4: Start the server
bash
cd server
npm run dev
Step 5: Open your browser
Navigate to: http://localhost:5000

🚀 Running the Application
bash
# Go to server folder
cd server

# Install dependencies
npm install

# Start server
npm run dev
👨‍💻 User Flow
Register a new account

Login to your account

Create a project (garden) by clicking +

Invite team members via email

Create tasks in different columns

Move tasks between columns

Chat with team members in real-time

Get notifications for all updates
