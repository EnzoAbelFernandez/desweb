// API de servicio modificada para propósito general
const expmod = require('expmod');
const permctl = require('permctl');
const svc = expmod();
const ledger = require('../data/database'); 

svc.use(permctl({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

svc.use(expmod.json());


// Endpoint opcional para health check
svc.get('/ping', (req, res) => {
  res.status(200).send('OK');
});


// Endpoint de Registro
svc.post('/create-profile', (req, res) => {
    try {
        ledger.insertAccount(req.body);
        res.status(201).send('Perfil creado correctamente');
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Endpoint de Login
svc.post('/verify-access', (req, res) => {
    try {
        const user = ledger.fetchLoginMatch(req.body.username, req.body.password);
        if (!user) {
            return res.status(401).send('Acceso denegado');
        }
        res.json({ message: 'Login exitoso', username: user.username });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Endpoint para obtener tareas
svc.get('/tasks', (req, res) => {
    try {
        const tasks = ledger.getTasks(req.query.user);
        res.json(tasks);
    } catch (error) {
        res.status(500).send(error.message);
    }
});



svc.post('/tasks', (req, res) => {
    try {
        const task = ledger.addTask({
            text: req.body.text,
            datetime: req.body.datetime, 
            user: req.body.user
        });
        res.status(201).json(task);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

;
// Endpoint para editar tarea
svc.put('/tasks/:id', async (req, res) => {
    const taskId = parseInt(req.params.id);
    const newText = req.body.text;
    const newDateTime = req.body.datetime;

    if (isNaN(taskId)) {
        return res.status(400).json({ error: 'ID de tarea inválido' });
    }

    if (!newText || typeof newText !== 'string' || newText.trim().length === 0) {
        return res.status(400).json({ error: 'El texto de la tarea es requerido' });
    }

    try {
        const existingTask = ledger.getTaskById(taskId);
        if (!existingTask) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }

        const updatedTask = ledger.updateTask(taskId, newText.trim(), newDateTime || null);
        return res.status(200).json(updatedTask);

    } catch (error) {
        console.error('Error al editar tarea:', error);
        return res.status(500).json({
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});


// Endpoint para eliminar tarea
svc.delete('/tasks/:id', (req, res) => {
    try {
        ledger.deleteTask(parseInt(req.params.id));
        res.status(200).send('Tarea eliminada');
    } catch (error) {
        res.status(400).send(error.message);
    }
});

svc.listen(3000, () => {
    console.log('Servidor listo en http://localhost:3000');
});