// Módulo local de gestión de datos actualizado
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'vault.json');
let data = { registry: [], tasks: [] };

// Cargar datos existentes
if (fs.existsSync(DB_FILE)) {
    data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function save() {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
    // Usuarios
    insertAccount: (user) => {
        if (data.registry.some(u => u.userID === user.userID)) {
            throw new Error('Usuario ya existe');
        }
        data.registry.push(user);
        save();
    },

    fetchLoginMatch: (userID, accessKey) => {
        return data.registry.find(u => 
            u.userID === userID && 
            u.accessKey === accessKey
        ) || null;
    },

    // Tareas
    addTask: (task) => {
        const newTask = {
            id: Date.now(),
            text: task.text,
            datetime: task.datetime || null,
            user: task.user,
            completed: false,
            createdAt: new Date().toISOString()
        };
        data.tasks.push(newTask);
        save();
        return newTask;
    },

    getTasks: (user) => {
        return data.tasks
            .filter(t => t.user === user)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    getTaskById: (id) => {
        return data.tasks.find(t => t.id === id) || null;
    },

    updateTask: (id, text, datetime) => {
        const task = data.tasks.find(t => t.id === id);
        if (!task) throw new Error('Tarea no encontrada');
        
        task.text = text;
        task.datetime = datetime;
        task.updatedAt = new Date().toISOString();
        save();
        return task;
    },

    deleteTask: (id) => {
        data.tasks = data.tasks.filter(t => t.id !== id);
        save();
    }
};