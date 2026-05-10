const express = require('express');
const cors = require('cors');
require('dotenv').config();

const groupRoutes = require('./src/routes/groupRoutes');
const authRoutes = require('./routes/auth');
const roleRoutes = require('./routes/role');
const contributionRoutes = require('./routes/contributions');
const sarbRoutes = require('./src/routes/sarbRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/sarb', sarbRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
