// Import the express module
import express from 'express';

// Create an instance
// Express application
const app = express();

// Define a port number
const PORT = 3001;

const orders = [];

// Enable static file serving
app.use(express.static('public'));

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));

// Define a defaule route ("/")
app.get('/', (req, res) => {
    res.sendFile(`${import.meta.dirname}/views/home.html`)
});

app.post('/submit-order', (req, res) => {
    const order = req.body;
    order['timestamp'] = new Date();

    console.log(order);

    orders.push(order);
    console.log(orders);

    res.render('confirm', {order});
})

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});