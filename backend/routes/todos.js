const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');
const { authenticateToken } = require('../middleware/auth');

// Get all todos for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ todos });
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new todo
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (!dueDate) {
      return res.status(400).json({ message: 'Due date is required' });
    }

    if (title.trim().length > 100) {
      return res.status(400).json({ message: 'Title must be less than 100 characters' });
    }

    if (description && description.length > 500) {
      return res.status(400).json({ message: 'Description must be less than 500 characters' });
    }

    const todo = new Todo({
      title: title.trim(),
      description: description ? description.trim() : '',
      dueDate: new Date(dueDate),
      userId: req.user.id
    });

    await todo.save();
    res.status(201).json({ todo });
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a todo
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, dueDate, completed } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (!dueDate) {
      return res.status(400).json({ message: 'Due date is required' });
    }

    if (title.trim().length > 100) {
      return res.status(400).json({ message: 'Title must be less than 100 characters' });
    }

    if (description && description.length > 500) {
      return res.status(400).json({ message: 'Description must be less than 500 characters' });
    }

    const todo = await Todo.findOne({ _id: req.params.id, userId: req.user.id });

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    todo.title = title.trim();
    todo.description = description ? description.trim() : '';
    todo.dueDate = new Date(dueDate);
    todo.completed = completed !== undefined ? completed : todo.completed;

    await todo.save();
    res.json({ todo });
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle todo completion status
router.patch('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, userId: req.user.id });

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    todo.completed = !todo.completed;
    await todo.save();

    res.json({ todo });
  } catch (error) {
    console.error('Error toggling todo:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a todo
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, userId: req.user.id });

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    await Todo.deleteOne({ _id: req.params.id });
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get todo statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const [
      totalTodos,
      completedTodos,
      pendingTodos,
      overdueTodos,
      todayTodos
    ] = await Promise.all([
      Todo.countDocuments({ userId }),
      Todo.countDocuments({ userId, completed: true }),
      Todo.countDocuments({ userId, completed: false }),
      Todo.countDocuments({ 
        userId, 
        completed: false, 
        dueDate: { $lt: now } 
      }),
      Todo.countDocuments({
        userId,
        dueDate: {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        }
      })
    ]);

    res.json({
      total: totalTodos,
      completed: completedTodos,
      pending: pendingTodos,
      overdue: overdueTodos,
      dueToday: todayTodos,
      completionRate: totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0
    });
  } catch (error) {
    console.error('Error fetching todo stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
