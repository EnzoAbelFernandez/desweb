// Script modificado: gestión de cuentas y tareas almacenadas localmente
// Datos en window.localStorage
let accountList = JSON.parse(window.localStorage.getItem('accountList')) || [];
let jobEntries = JSON.parse(window.localStorage.getItem('jobEntries')) || [];
let activeAccount = null;

// Funciones de autenticación
function createAccount() {
    const userID = document.getElementById('userID').value;
    const userKey = document.getElementById('userKey').value;
    
    if (accountList.some(u => u.userID === userID)) {
        alert('Este ID ya está en uso');
        return;
    }
    
    accountList.push({ userID, userKey });
    window.localStorage.setItem('accountList', JSON.stringify(accountList));
    alert('Cuenta creada con éxito');
}

function accessAccount() {
    const userID = document.getElementById('userID').value;
    const userKey = document.getElementById('userKey').value;

    const user = accountList.find(u => u.userID === userID && u.userKey === userKey);
    if (user) {
        activeAccount = userID;
        window.localStorage.setItem('activeAccount', activeAccount);
        document.querySelector('.auth-section').style.display = 'none';
        document.getElementById('taskSection').style.display = 'block';
        loadTasks();
        alert('Inicio de sesión exitoso');
    } else {
        alert('Credenciales incorrectas');
    }
}

function logout() {
    activeAccount = null;
    window.localStorage.removeItem('activeAccount');
    document.getElementById('taskSection').style.display = 'none';
    document.querySelector('.auth-section').style.display = 'block';
}
//verif asi hay ususario logueado
window.onload = () => {
    activeAccount = window.localStorage.getItem('activeAccount');
    if (activeAccount) {
        document.querySelector('.auth-section').style.display = 'none';
        document.getElementById('taskSection').style.display = 'block';
        loadTasks();
    } else {
        document.querySelector('.auth-section').style.display = 'block';
        document.getElementById('taskSection').style.display = 'none';
    }
};




// Funciones de tareas
function addTask() {
    const taskText = document.getElementById('newTask').value;
    const taskDateTime = document.getElementById('taskDateTime').value;
    
    if (taskText.trim() === '') {
        alert('Por favor ingresa una descripción para la tarea');
        return;
    }
    
    jobEntries.push({
        id: Date.now(),
        text: taskText,
        datetime: taskDateTime,  // Guardamos la fecha y hora
        user: activeAccount,
        completed: false
    });
    
    window.localStorage.setItem('jobEntries', JSON.stringify(jobEntries));
    document.getElementById('newTask').value = '';
    document.getElementById('taskDateTime').value = '';
    loadTasks();
}

function loadTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    
    const userTasks = jobEntries.filter(t => t.user === activeAccount);
    
    userTasks.forEach(task => {
        const li = document.createElement('li');
        const taskDate = task.datetime ? new Date(task.datetime).toLocaleString() : 'Sin fecha';
        
        li.innerHTML = `
            <div class="task-content">
                <span class="task-text">${task.text}</span>
                <span class="task-date">${taskDate}</span>
            </div>
            <div class="task-actions">
                <button class="btn-success" onclick="editTask(${task.id})">Editar</button>
                <button class="btn-danger" onclick="deleteTask(${task.id})">Eliminar</button>
            </div>
        `;
        taskList.appendChild(li);
    });
}
function editTask(id) {
    const task = jobEntries.find(t => t.id === id);
    if (!task) return;

    const taskElement = document.querySelector(`li span.task-text`).parentElement;
    const currentText = task.text;
    const currentDate = task.datetime || '';

    taskElement.innerHTML = `
        <div class="edit-task-content">
            <input type="text" id="edit-text-${id}" value="${currentText}" />
            <input type="datetime-local" id="edit-date-${id}" value="${currentDate}" />
            <button class="btn-success" onclick="saveTask(${id})">Guardar</button>
        </div>
    `;
}
function saveTask(id) {
    const newText = document.getElementById(`edit-text-${id}`).value.trim();
    const newDate = document.getElementById(`edit-date-${id}`).value;
    
    if (newText === '') return;

    const taskIndex = jobEntries.findIndex(t => t.id === id);
    if (taskIndex !== -1) {
        jobEntries[taskIndex].text = newText;
        jobEntries[taskIndex].datetime = newDate;
        window.localStorage.setItem('jobEntries', JSON.stringify(jobEntries));
        loadTasks();
    }
}

function deleteTask(id) {
    jobEntries = jobEntries.filter(t => t.id !== id);
    window.localStorage.setItem('jobEntries', JSON.stringify(jobEntries));
    loadTasks();
}

// Inicialización
if (activeAccount) {
    document.getElementById('taskSection').style.display = 'block';
    loadTasks();
}