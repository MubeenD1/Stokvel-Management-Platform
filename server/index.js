const express = require('express');
const cors = require('cors');
require('dotenv').config();

const groupRoutes = require('./src/routes/groupRoutes');
const authRoutes = require('./routes/auth');
const roleRoutes = require('./routes/role');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// auth routes
app.use('/api/auth', authRoutes);

// group routes
app.use('/api/groups', groupRoutes);

// role routes
app.use('/api/roles', roleRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});