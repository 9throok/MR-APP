require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const dcrRoutes = require('./routes/dcr');
const aiRoutes = require('./routes/ai');
const productRoutes = require('./routes/product');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const knowledgeRoutes = require('./routes/knowledge');
const adverseEventRoutes = require('./routes/adverse-events');
const doctorRoutes = require('./routes/doctors');
const doctorRequestRoutes = require('./routes/doctor-requests');
const rcpaRoutes = require('./routes/rcpa');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/dcr', authenticateToken, dcrRoutes);
app.use('/api/ai', authenticateToken, aiRoutes);
app.use('/api/products', authenticateToken, productRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/adverse-events', authenticateToken, adverseEventRoutes);
app.use('/api/doctors', authenticateToken, doctorRoutes);
app.use('/api/doctor-requests', authenticateToken, doctorRequestRoutes);
app.use('/api/rcpa', authenticateToken, rcpaRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
