const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');

// Initialize Express app
const app = express();
const port = 5000;

// Enable CORS for your Netlify frontend domain
app.use(cors({
  origin: 'https://sujalschantbot.netlify.app', // Allow only this domain to access your backend
  methods: ['GET', 'POST'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type'], // Allowed headers
}));

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// MySQL database setup (Using XAMPP's MySQL default settings)
const db = mysql.createConnection({
  host: 'localhost',        // MySQL host (localhost for XAMPP)
  user: 'root',             // Default MySQL username for XAMPP is 'root'
  password: '',             // Default MySQL password for XAMPP is an empty string
  database: 'chatbot'       // Name of your database
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + db.threadId);
});

// Create messages table if it doesn't exist
db.query(`
  CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error('Error creating table:', err.stack);
  }
});

// Function to generate chatbot responses
const generateResponse = (message) => {
  const lowerMessage = message.toLowerCase().trim();

  if (lowerMessage.includes("hi") || lowerMessage.includes("hello")) {
    return "Hello! How can I assist you today?";
  }
  if (lowerMessage.includes("how are you")) {
    return "I'm doing great, thank you! How about you?";
  }
  if (lowerMessage.includes("bye")) {
    return "Goodbye! Have a great day!";
  }

  return "Sorry, I didn't understand that. Could you please rephrase?";
};

// Route to send message and store it in the database
app.post('/send', (req, res) => {
  const { user, message } = req.body;

  // Insert message into MySQL database
  db.query('INSERT INTO messages (user, message) VALUES (?, ?)', [user, message], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Generate a response for the chatbot
    const botResponse = generateResponse(message);

    // Insert the chatbot's response into the database
    db.query('INSERT INTO messages (user, message) VALUES (?, ?)', ['Chatbot', botResponse], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      // Return the user's message and chatbot's response
      res.status(200).json({ id: result.insertId, user, message, botResponse });
    });
  });
});

// Route to get all messages
app.get('/messages', (req, res) => {
  db.query('SELECT * FROM messages ORDER BY timestamp DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json({ messages: rows });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
