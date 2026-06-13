require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { initDatabase } = require('./database');

const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const expenseRoutes = require('./routes/expenses');
const settlementRoutes = require('./routes/settlements');
const chatRoutes = require('./routes/chat');
const analyticsRoutes = require('./routes/analytics');
const emailRoutes = require('./routes/email');
const contactRoutes = require('./routes/contacts');
const notificationRoutes = require('./routes/notifications');
const { startScheduler } = require('./utils/scheduler');

async function startServer() {
  await initDatabase();
  console.log('Database initialized');

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  app.set('io', io);

  app.use(cors());
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/groups', groupRoutes);
  app.use('/api/expenses', expenseRoutes);
  app.use('/api/settlements', settlementRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/email', emailRoutes);
  app.use('/api/contacts', contactRoutes);
  app.use('/api/notifications', notificationRoutes);

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_group', (groupId) => {
      socket.join(`group_${groupId}`);
      console.log(`User joined group_${groupId}`);
    });

    socket.on('leave_group', (groupId) => {
      socket.leave(`group_${groupId}`);
    });

    socket.on('send_message', (data) => {
      io.to(`group_${data.groupId}`).emit('new_message', data);
    });

    socket.on('typing', (data) => {
      socket.to(`group_${data.groupId}`).emit('user_typing', data);
    });

    socket.on('stop_typing', (data) => {
      socket.to(`group_${data.groupId}`).emit('user_stop_typing', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  if (process.env.NODE_ENV === 'production' || process.env.SERVE_FRONTEND === 'true') {
    app.use(express.static(path.join(__dirname, '../frontend/build')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
    });
  }

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`WebSocket server ready`);
    startScheduler();
  });

  module.exports = { app, server, io };
}

startServer().catch(console.error);
