
const originalExit = process.exit;
process.exit = function(code) {
    console.error(`\n🚨 PROCESS.EXIT CALLED WITH CODE: ${code} 🚨`);
    console.trace('Here is the trace of exactly what file killed the server:');
    originalExit(code);
};

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 UNHANDLED PROMISE REJECTION:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('🚨 UNCAUGHT EXCEPTION:', err);
});
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const groupRoutes = require('./src/routes/groupRoutes');
const authRoutes = require('./routes/auth');
const roleRoutes = require('./routes/role');
const contributionRoutes = require('./routes/contributions');
const app = express();
app.use(cors());
app.use(express.json());
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});
app.use('/api/auth', authRoutes);
app.use('/api/groups', roleRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/contributions', contributionRoutes);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});