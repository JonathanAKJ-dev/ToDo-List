// DOM Elements
const taskList = document.getElementById('task-list');
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const taskTitle = document.getElementById('task-title');
const taskCategory = document.getElementById('task-category');
const taskDeadline = document.getElementById('task-deadline');
const addTaskBtn = document.getElementById('add-task');
const cancelTaskBtn = document.getElementById('cancel-task');
const toggleDarkBtn = document.getElementById('toggle-dark');
const searchInput = document.getElementById('search');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const customCategoryContainer = document.getElementById('custom-category-container');
const customCategoryInput = document.getElementById('custom-category');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let editIndex = null;

// Show/hide custom category input based on selection
taskCategory.addEventListener('change', () => {
    if (taskCategory.value === 'others') {
        customCategoryContainer.classList.remove('hidden');
        customCategoryInput.required = true;
    } else {
        customCategoryContainer.classList.add('hidden');
        customCategoryInput.required = false;
        customCategoryInput.value = '';
    }
});

function renderTasks() {
    const filter = searchInput.value.toLowerCase();
    const filteredTasks = tasks.filter(task =>
        task.title.toLowerCase().includes(filter) ||
        task.category.toLowerCase().includes(filter)
    );
    const completed = tasks.filter(task => task.completed).length;
    progressBar.value = tasks.length ? (completed / tasks.length) * 100 : 0;
    progressText.textContent = `${Math.round(progressBar.value)}% Complete (${completed}/${tasks.length} tasks)`;

    taskList.innerHTML = '';
    filteredTasks.forEach((task, index) => {
        const taskEl = document.createElement('div');
        taskEl.className = `flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm transition-all ${task.completed ? 'task-completed' : ''}`;
        taskEl.innerHTML = `
            <div class="flex items-center gap-4">
                <input type="checkbox" ${task.completed ? 'checked' : ''} onclick="toggleComplete(${index})">
                <div>
                    <strong class="text-gray-800 dark:text-gray-100">${task.title}</strong>
                    <span class="category-tag ${task.category.toLowerCase()} ml-2">${task.category}</span>
                    ${task.deadline ? `<small class="block text-gray-600 dark:text-gray-400">Due: ${new Date(task.deadline).toLocaleString()}</small>` : ''}
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="editTask(${index})" class="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors">Edit</button>
                <button onclick="deleteTask(${index})" class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">Delete</button>
            </div>
        `;
        taskList.appendChild(taskEl);
    });
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
}

function toggleComplete(index) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
}

function editTask(index) {
    editIndex = index;
    const task = tasks[index];
    taskTitle.value = task.title;
    taskCategory.value = ['work', 'personal', 'others'].includes(task.category.toLowerCase()) ? task.category.toLowerCase() : 'others';
    if (taskCategory.value === 'others') {
        customCategoryContainer.classList.remove('hidden');
        customCategoryInput.value = task.category;
        customCategoryInput.required = true;
    } else {
        customCategoryContainer.classList.add('hidden');
        customCategoryInput.value = '';
        customCategoryInput.required = false;
    }
    taskDeadline.value = task.deadline || '';
    taskModal.classList.remove('hidden');
}

function deleteTask(index) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks.splice(index, 1);
        saveTasks();
    }
}

// Event Listeners
addTaskBtn.addEventListener('click', () => {
    editIndex = null;
    taskForm.reset();
    customCategoryContainer.classList.add('hidden');
    customCategoryInput.required = false;
    taskModal.classList.remove('hidden');
});

cancelTaskBtn.addEventListener('click', () => {
    taskModal.classList.add('hidden');
});

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = taskTitle.value.trim();
    let category = taskCategory.value;
    if (category === 'others') {
        category = customCategoryInput.value.trim() || 'others';
    }
    const deadline = taskDeadline.value;

    if (editIndex !== null) {
        tasks[editIndex] = { ...tasks[editIndex], title, category, deadline, notified: false };
    } else {
        tasks.push({ title, category, deadline, completed: false, notified: false });
    }
    saveTasks();
    taskModal.classList.add('hidden');
});


toggleDarkBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('darkMode', document.body.classList.contains('dark'));
});

searchInput.addEventListener('input', renderTasks);

// Notification permission request
if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission();
}

// Check deadlines every 30 seconds and notify
function checkDeadlines() {
    const now = new Date();
    tasks.forEach((task, index) => {
        if (task.deadline && !task.notified && !task.completed) {
            const deadlineDate = new Date(task.deadline);
            if (deadlineDate <= now) {
                if (Notification.permission === 'granted') {
                    new Notification('Task Reminder', {
                        body: `Time to: ${task.title}`,
                        icon: 'https://cdn-icons-png.flaticon.com/512/1827/1827504.png'
                    });
                } else {
                    alert(`Reminder: Time to do "${task.title}"`);
                }
                tasks[index].notified = true;
                saveTasks();
            }
        }
    });
}

// Initialize
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
}
renderTasks();
checkDeadlines();
setInterval(checkDeadlines, 30000);

// Expose functions to global scope for inline handlers
window.toggleComplete = toggleComplete;
window.editTask = editTask;
window.deleteTask = deleteTask;
