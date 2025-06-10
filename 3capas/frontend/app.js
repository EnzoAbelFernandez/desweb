// Cliente JS modificado con nuevas rutas y lógica
const BASE_URI = 'http://localhost:3000';
let activeProfile = null;
let editingTaskId = null;

// Verificar conexión al iniciar
checkConnection();

async function checkConnection() {
    try {
        const response = await fetch(`${BASE_URI}/ping`);
        if (!response.ok) throw new Error('No se detecta servicio');
        console.log('Conexión con el backend establecida');
    } catch (error) {
        console.error('Error de conexión:', error);
        alert('No se pudo conectar al servidor. Verifica que el backend esté corriendo.');
    }
}

// Funciones de autenticación
async function createProfile() {
    const userID = document.getElementById('userID').value;
    const accessKey = document.getElementById('accessKey').value;
    
    if (!userID || !accessKey) {
        alert('Usuario y contraseña son requeridos');
        return;
    }

    try {
        const response = await fetch(`${BASE_URI}/create-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userID, accessKey })
        });
        
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.error || 'Error en registro');
        
        alert('Registro exitoso');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function attemptAccess() {
    const userID = document.getElementById('userID').value;
    const accessKey = document.getElementById('accessKey').value;
    
    try {
        const response = await fetch(`${BASE_URI}/verify-access`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userID, accessKey })
        });
        
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.error || 'Credenciales incorrectas');
        
        activeProfile = userID;
        localStorage.setItem('activeProfile', userID);
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('taskSection').style.display = 'block';
        document.getElementById('logoutButton').style.display = 'inline-block';
        await loadTasks();
        alert('Inicio de sesión exitoso');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function logout() {
    localStorage.removeItem('activeProfile');
    activeProfile = null;
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('taskSection').style.display = 'none';
    document.getElementById('logoutButton').style.display = 'none';
}

// Funciones para tareas
async function addTask() {
    const taskText = document.getElementById('newTask').value;
    const taskDateTime = document.getElementById('taskDateTime').value;
    
    if (!taskText.trim()) {
        alert('La descripción de la tarea es requerida');
        return;
    }

    try {
        const response = await fetch(`${BASE_URI}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                text: taskText, 
                datetime: taskDateTime,
                user: activeProfile 
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.error || 'Error al crear tarea');
        
        document.getElementById('newTask').value = '';
        document.getElementById('taskDateTime').value = '';
        await loadTasks();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function loadTasks() {
    if (!activeProfile) return;
    
    try {
        const response = await fetch(`${BASE_URI}/tasks?user=${activeProfile}`);
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.error || 'Error al cargar tareas');
        
        renderTasks(result);
    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
    }
}

function renderTasks(tasks) {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    
    tasks.forEach(task => {
        const li = document.createElement('li');
        const taskDate = task.datetime ? new Date(task.datetime).toLocaleString() : 'Sin fecha';
        
        if (editingTaskId === task.id) {
            li.innerHTML = `
                <div class="edit-task-content">
                    <input type="text" id="edit-text-${task.id}" value="${escapeHtml(task.text)}">
                    <input type="datetime-local" id="edit-date-${task.id}" value="${task.datetime || ''}">
                    <div class="edit-buttons">
                        <button class="btn-success" onclick="saveTask(${task.id})">Guardar</button>
                        <button class="btn-cancel" onclick="cancelEdit()">Cancelar</button>
                    </div>
                </div>
            `;
        } else {
            li.innerHTML = `
                <div class="task-content">
                    <span class="task-text">${escapeHtml(task.text)}</span>
                    <span class="task-date">${taskDate}</span>
                </div>
                <div class="task-actions">
                    <button class="btn-edit" onclick="startEdit(${task.id})">Editar</button>
                    <button class="btn-delete" onclick="deleteTask(${task.id})">Eliminar</button>
                </div>
            `;
        }
        
        taskList.appendChild(li);
    });
}

function startEdit(taskId) {
    editingTaskId = taskId;
    loadTasks();
}

async function saveTask(taskId) {
    const newText = document.getElementById(`edit-text-${taskId}`).value.trim();
    const newDate = document.getElementById(`edit-date-${taskId}`).value;
    
    if (!newText) {
        alert('La descripción no puede estar vacía');
        return;
    }

    try {
        const response = await fetch(`${BASE_URI}/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                text: newText,
                datetime: newDate,
                user: activeProfile 
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.error || 'Error al actualizar tarea');
        
        editingTaskId = null;
        await loadTasks();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function cancelEdit() {
    editingTaskId = null;
    loadTasks();
}

async function deleteTask(taskId) {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;
    
    try {
        const response = await fetch(`${BASE_URI}/tasks/${taskId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.error || 'Error al eliminar tarea');
        
        await loadTasks();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Funciones auxiliares
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Inicialización
if (localStorage.getItem('activeProfile')) {
    activeProfile = localStorage.getItem('activeProfile');
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('taskSection').style.display = 'block';
    document.getElementById('logoutButton').style.display = 'inline-block';
    loadTasks();
}