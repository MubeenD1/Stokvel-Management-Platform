const originalExit = process.exit;
process.exit = function(code) {
    console.error('PROCESS.EXIT CALLED WITH CODE: ' + code);
    console.trace('Here is the trace of exactly what file killed the server:');
    originalExit(code);
};

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED PROMISE REJECTION:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const groupRoutes = require('./src/routes/groupRoutes');
const authRoutes = require('./routes/auth');
const roleRoutes = require('./routes/role');
const contributionRoutes = require('./routes/contribution');
const payfastRoutes = require('./routes/payfast');
const sarbRoutes = require('./src/routes/sarbRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/groups', roleRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/payfast', payfastRoutes);
app.use('/api/sarb', sarbRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
});