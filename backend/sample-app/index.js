require('dotenv').config();
const express = require('express');
const client = require('prom-client');
const mongoose = require('mongoose');
const cors = require('cors');
const todoRoutes = require('./routes/todos');

const app = express();
const PORT = process.env.PORT || 5000;

//enabling automatic default tracking
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register })

//creating CUSTOM metric counter to record new tasks
app.locals.todosCreatedCounter = new client.Counter({
  name: 'todo_app_todos_created_total',
  help: 'Total number of todo tasks created in the application',
});

app.use(cors());
app.use(express.json());

//exposing the metrics gate for the Prometheus robot to read data
app.get('/metrics', async (req, res) =>{
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.use('/api/todos', todoRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Todo API is running' });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
