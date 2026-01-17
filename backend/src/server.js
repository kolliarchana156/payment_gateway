const app = require('./app');
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
});