const API_URL = 'http://localhost:5000/api';
let currentUser = null;
let currentProject = null;
let socket = null;
let currentTaskId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        const user = JSON.parse(localStorage.getItem('user'));
        currentUser = user;
        showMainApp();
        loadProjects();
        connectSocket();
    } else {
        showAuth();
    }
}

function connectSocket() {
    const token = localStorage.getItem('token');
    socket = io('http://localhost:5000', {
        auth: { token }
    });
    
    socket.on('task-created', (task) => {
        if (currentProject && task.project === currentProject._id) {
            loadTasks();
        }
    });
    
    socket.on('task-updated', (task) => {
        if (currentProject && task.project === currentProject._id) {
            loadTasks();
        }
    });
    
    socket.on('comment-added', (comment) => {
        if (currentTaskId) {
            loadComments(currentTaskId);
        }
    });
}

function setupEventListeners() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                currentUser = data.user;
                showMainApp();
                loadProjects();
                connectSocket();
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed');
        }
    });
    
    // Register form
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                currentUser = data.user;
                showMainApp();
                loadProjects();
                connectSocket();
            } else {
                alert(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Register error:', error);
            alert('Registration failed');
        }
    });
    
    // Create project form
    document.getElementById('create-project-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('project-name-input').value;
        const description = document.getElementById('project-description-input').value;
        
        try {
            const response = await fetch(`${API_URL}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('token')
                },
                body: JSON.stringify({ name, description })
            });
            
            if (response.ok) {
                closeModal('create-project-modal');
                loadProjects();
                document.getElementById('create-project-form').reset();
            } else {
                alert('Failed to create project');
            }
        } catch (error) {
            console.error('Create project error:', error);
        }
    });
    
    // Create task form
    document.getElementById('create-task-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-description').value;
        const priority = document.getElementById('task-priority').value;
        const dueDate = document.getElementById('task-due-date').value;
        const status = document.getElementById('task-status').value;
        
        try {
            const response = await fetch(`${API_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('token')
                },
                body: JSON.stringify({
                    title,
                    description,
                    project: currentProject._id,
                    priority,
                    dueDate,
                    status
                })
            });
            
            if (response.ok) {
                const task = await response.json();
                closeModal('create-task-modal');
                loadTasks();
                document.getElementById('create-task-form').reset();
                if (socket) {
                    socket.emit('new-task', { projectId: currentProject._id, task });
                }
            } else {
                alert('Failed to create task');
            }
        } catch (error) {
            console.error('Create task error:', error);
        }
    });
    
    // Add member form
    document.getElementById('add-member-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('member-email').value;
        
        try {
            const response = await fetch(`${API_URL}/projects/${currentProject._id}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('token')
                },
                body: JSON.stringify({ email })
            });
            
            if (response.ok) {
                closeModal('add-member-modal');
                alert('Member added successfully');
                document.getElementById('add-member-form').reset();
            } else {
                const data = await response.json();
                alert(data.message);
            }
        } catch (error) {
            console.error('Add member error:', error);
        }
    });
}

async function loadProjects() {
    try {
        const response = await fetch(`${API_URL}/projects`, {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        
        const projects = await response.json();
        displayProjects(projects);
    } catch (error) {
        console.error('Load projects error:', error);
    }
}

function displayProjects(projects) {
    const projectsList = document.getElementById('projects-list');
    projectsList.innerHTML = '';
    
    if (projects.length === 0) {
        projectsList.innerHTML = '<div style="text-align:center;color:#999;">No projects yet<br>Click + to create</div>';
        return;
    }
    
    projects.forEach(project => {
        const projectDiv = document.createElement('div');
        projectDiv.className = 'project-item';
        if (currentProject && currentProject._id === project._id) {
            projectDiv.classList.add('active');
        }
        projectDiv.innerHTML = `
            <div><strong>${project.name}</strong></div>
            <small>${project.description.substring(0, 50)}</small>
        `;
        projectDiv.onclick = () => selectProject(project);
        projectsList.appendChild(projectDiv);
    });
}

async function selectProject(project) {
    currentProject = project;
    document.getElementById('project-name').textContent = project.name;
    document.getElementById('project-description').textContent = project.description;
    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('project-view').style.display = 'block';
    
    if (socket) {
        socket.emit('join-project', project._id);
    }
    
    await loadTasks();
    highlightActiveProject(project._id);
}

function highlightActiveProject(projectId) {
    document.querySelectorAll('.project-item').forEach(item => {
        if (item.querySelector('strong').innerText === currentProject.name) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

async function loadTasks() {
    if (!currentProject) return;
    
    try {
        const response = await fetch(`${API_URL}/tasks/project/${currentProject._id}`, {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        
        const tasks = await response.json();
        displayTasks(tasks);
    } catch (error) {
        console.error('Load tasks error:', error);
    }
}

function displayTasks(tasks) {
    const columns = {
        'todo': document.getElementById('todo-tasks'),
        'in-progress': document.getElementById('inprogress-tasks'),
        'review': document.getElementById('review-tasks'),
        'done': document.getElementById('done-tasks')
    };
    
    Object.keys(columns).forEach(key => {
        columns[key].innerHTML = '';
    });
    
    if (tasks.length === 0) {
        Object.keys(columns).forEach(key => {
            columns[key].innerHTML = '<div style="text-align:center;color:#999;padding:20px;">No tasks</div>';
        });
        return;
    }
    
    tasks.forEach(task => {
        const taskCard = createTaskCard(task);
        if (columns[task.status]) {
            columns[task.status].appendChild(taskCard);
        }
    });
}

function createTaskCard(task) {
    const div = document.createElement('div');
    div.className = 'task-card';
    div.innerHTML = `
        <div class="task-title">${task.title}</div>
        <div class="task-description" style="font-size:12px;color:#666;margin-top:5px;">${task.description.substring(0, 80)}${task.description.length > 80 ? '...' : ''}</div>
        <div class="task-priority priority-${task.priority}">${task.priority}</div>
        ${task.assignedTo ? `<small style="display:block;margin-top:8px;">👤 ${task.assignedTo.name}</small>` : ''}
        ${task.dueDate ? `<small style="display:block;">📅 ${new Date(task.dueDate).toLocaleDateString()}</small>` : ''}
    `;
    div.onclick = (e) => {
        e.stopPropagation();
        showTaskDetails(task);
    };
    return div;
}

async function showTaskDetails(task) {
    const modal = document.getElementById('task-detail-modal');
    const content = document.getElementById('task-detail-content');
    currentTaskId = task._id;
    
    // Load comments
    const comments = await loadComments(task._id);
    
    content.innerHTML = `
        <h2>${task.title}</h2>
        <p><strong>Description:</strong> ${task.description}</p>
        <p><strong>Priority:</strong> <span class="task-priority priority-${task.priority}">${task.priority}</span></p>
        <p><strong>Status:</strong> 
            <select id="task-status-select" onchange="updateTaskStatus('${task._id}', this.value)" style="padding:5px;margin-left:10px;">
                <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>To Do</option>
                <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                <option value="review" ${task.status === 'review' ? 'selected' : ''}>Review</option>
                <option value="done" ${task.status === 'done' ? 'selected' : ''}>Done</option>
            </select>
        </p>
        <p><strong>Created:</strong> ${new Date(task.createdAt).toLocaleDateString()}</p>
        ${task.dueDate ? `<p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>` : ''}
        
        <div class="comments-section">
            <h3>Comments (${comments.length})</h3>
            <div id="comments-list" style="max-height:300px;overflow-y:auto;margin-top:15px;">
                ${comments.length === 0 ? '<div style="text-align:center;color:#999;padding:20px;">No comments yet</div>' : 
                    comments.map(comment => `
                        <div class="comment">
                            <div class="comment-header">
                                <strong>${comment.user.name}</strong> - ${new Date(comment.createdAt).toLocaleString()}
                            </div>
                            <div>${comment.content}</div>
                        </div>
                    `).join('')
                }
            </div>
            <textarea id="new-comment" placeholder="Add a comment..." rows="3" style="width:100%;padding:10px;margin-top:15px;border:1px solid #ddd;border-radius:5px;"></textarea>
            <button onclick="addComment('${task._id}')" class="btn-primary" style="margin-top: 10px;">Add Comment</button>
        </div>
    `;
    
    modal.style.display = 'block';
}

async function loadComments(taskId) {
    try {
        const response = await fetch(`${API_URL}/comments/task/${taskId}`, {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        return await response.json();
    } catch (error) {
        console.error('Load comments error:', error);
        return [];
    }
}

async function addComment(taskId) {
    const content = document.getElementById('new-comment').value;
    if (!content.trim()) {
        alert('Please enter a comment');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ content, task: taskId })
        });
        
        if (response.ok) {
            const comment = await response.json();
            if (socket && currentProject) {
                socket.emit('new-comment', { projectId: currentProject._id, comment });
            }
            // Refresh task details to show new comment
            const task = await fetch(`${API_URL}/tasks/${taskId}`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            const taskData = await task.json();
            showTaskDetails(taskData);
        } else {
            alert('Failed to add comment');
        }
    } catch (error) {
        console.error('Add comment error:', error);
        alert('Failed to add comment');
    }
}

async function updateTaskStatus(taskId, newStatus) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            const task = await response.json();
            if (socket && currentProject) {
                socket.emit('update-task', { projectId: currentProject._id, task });
            }
            loadTasks();
            closeModal('task-detail-modal');
        } else {
            alert('Failed to update task status');
        }
    } catch (error) {
        console.error('Update task status error:', error);
    }
}

function showLogin() {
    document.getElementById('login-form').classList.add('active');
    document.getElementById('register-form').classList.remove('active');
}

function showRegister() {
    document.getElementById('register-form').classList.add('active');
    document.getElementById('login-form').classList.remove('active');
}

function showMainApp() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('main-container').style.display = 'block';
    document.getElementById('user-name').textContent = currentUser.name;
}

function showAuth() {
    document.getElementById('auth-container').style.display = 'flex';
    document.getElementById('main-container').style.display = 'none';
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    currentProject = null;
    if (socket) {
        socket.disconnect();
    }
    showAuth();
    location.reload();
}

function showCreateProjectModal() {
    document.getElementById('create-project-modal').style.display = 'block';
}

function showCreateTaskModal(status) {
    document.getElementById('task-status').value = status;
    document.getElementById('create-task-modal').style.display = 'block';
}

function showAddMemberModal() {
    if (!currentProject) {
        alert('Please select a project first');
        return;
    }
    document.getElementById('add-member-modal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}