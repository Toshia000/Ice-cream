// Import the express module
import express from 'express';
import mysql2 from 'mysql2';
import dotenv from 'dotenv';
import session from 'express-session';

// Create an instance
// Express application
const app = express();

// Define a port number
const PORT = 3004;

const orders = [];

// Load the environment variables from .env file
dotenv.config();

    // Create a database connection pool with multiple connections

const pool = mysql2.createPool({

    host: process.env.DB_HOST,

    user: process.env.DB_USER,

    password: process.env.DB_PASSWORD,

    database: process.env.DB_NAME,

    port: process.env.DB_PORT

}).promise();

// Enable static file serving
app.use(express.static('public'));

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));

// Session middleware: lets the server remember users between requests
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 }   // 1 hour
}));

// Only let logged-in users through; send everyone else to /login
function requireLogin(req, res, next) {
    if (req.session.loggedIn) {
        next();
    } else {
        res.redirect('/login');
    }
}

app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Process the login form
app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
 
    // Compare the form values to the values in .env
    if (username === process.env.ADMIN_USER &&
        password === process.env.ADMIN_PASSWORD) {
        req.session.loggedIn = true;
        res.redirect('/admin');
    } else {
        res.render('login',
            { error: 'Invalid username or password.' });
    }
});

// Log out by deleting the session
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// Define a default route ("/")
app.get('/', (req, res) => {
    res.render('home');
});

// Confirmation route - handles form submission
app.post('/confirm', async (req, res) => {

    try {

        // Get form data from req.body
        const order = req.body;        

        // Log the order data (for debugging)
        console.log('New order submitted:', order);

        // Convert toppings array to comma-separated string 
        order.toppings = Array.isArray(order.toppings) ? order.toppings.join(", ") : ""; 

        // SQL INSERT query with placeholders to prevent SQL injection
        const sql = `INSERT INTO orders(customer, email, flavor, cone, toppings, comment) VALUES (?, ?, ?, ?, ?, ?);`;

        // Parameters array must match the order of ? placeholders
        // Make sure your property names match your order names

        const params = [
           order.name, order.email, order.flavor, order.cone, order.toppings, order.comments
        ];

        // Execute the query and grab the primary key of the new row
        // Array destructuring with [result] gives us the first element
        const [result] = await pool.execute(sql, params);

          // Add the order ID to the order object
          order.id = result.insertId;
          console.log('Order saved with ID:', order.id);

        // Render confirmation page with the order data
        res.render('confirm', { order });        

    } catch (err) {
        console.error('Error saving order:', err);
        res.status(500).send(`Sorry, there was an error processing your order. Please try again.`);

    }

});

app.get('/admin', requireLogin, async (req, res) => {
        try {

        // Fetch all orders from database, most recent first
        const [orders] = await pool.query(`SELECT * FROM orders
                ORDER BY timestamp DESC`);  
        // Render the admin page
        res.render('admin', { orders });        
    } catch (err) {
        console.error('Database error:', err); 
        res.status(500).send('Error loading orders: ' + err.message);
    }
});


app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

// Database test route (for debugging)

// app.get('/db-test', async (req, res) => {

//     try {

//          // [orders] uses array destructuring to get just the data

//  const [orders] = await pool.query('SELECT * FROM orders');

//               res.send(orders);

//     } catch (err) {

//        console.error('Database error:', err);

//        res.status(500).send('Database error: ' + err.message);

//   }
//  }
// );