const express = require('express');
const app = express();
const port = 3005;

// This is a middleware to help parse incoming POST request payloads as text
app.use(express.text());

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}/`);
});
