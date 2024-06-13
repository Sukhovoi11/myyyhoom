const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');
const { requireAuth, checkUser } = require('./middleware/authMiddleware');
const https = require('https');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();

// Middleware
app.use(express.static('public'));
app.use(express.static(__dirname));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// View engine
app.set('view engine', 'ejs');

// Database connection
const dbURI = 'mongodb+srv://new1:test12345@cluster1.ve6i4ky.mongodb.net/node-auth?retryWrites=true&w=majority';
mongoose.connect(dbURI)
    .then((result) => app.listen(3000))
    .catch((err) => console.log(err));

// Function to get exchange rate
function getExchangeRate(callback) {
    const url = 'https://api.nbp.pl/api/exchangerates/rates/A/USD/?format=json';

    https.get(url, (response) => {
        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
        });

        response.on('end', () => {
            const jsonData = JSON.parse(data);
            const exchangeRate = jsonData.rates[0].mid;
            callback(exchangeRate);
        });
    }).on('error', (error) => {
        console.error('Ошибка запроса:', error.message);
        callback(null);
    });
}

// Routes
app.get('*', checkUser);
app.get('/', (req, res) => res.render('home'));
app.get('/crypto', requireAuth, (req, res) => res.render('crypto'));
app.use(authRoutes);

// Route to get exchange rate
app.get('/exchange-rate', requireAuth, (req, res) => {
    getExchangeRate((rate) => {
        if (rate) {
            res.render('exchange-rate', { rate });
        } else {
            res.status(500).send('Не удалось получить курс доллара');
        }
    });
});

// Route to display payment button
app.get('/pay', (req, res) => {
    res.send(`
        <html>
        <body>
            <form action="/payu-payment" method="POST">
                <button type="submit">Оплатить с PayU</button>
            </form>
        </body>
        </html>
    `);
});

// Route to handle payment
app.post('/payu-payment', async (req, res) => {
    try {
        const response = await axios.post('https://secure.snd.payu.com/pl/standard/user/oauth/authorize', {
            grant_type: 'client_credentials',
            client_id: '300746',
            client_secret: '2ee86a66e5d97e3fadc400c9f19b065d'
        });

        const { access_token } = response.data;

        const order = {
            notifyUrl: 'http://yourdomain.com/notify',
            customerIp: '127.0.0.1',
            merchantPosId: '300746',
            description: 'Product description',
            currencyCode: 'PLN',
            totalAmount: '10000',
            buyer: {
                email: 'buyer@example.com',
                phone: '123456789',
                firstName: 'John',
                lastName: 'Doe'
            },
            products: [
                {
                    name: 'Product 1',
                    unitPrice: '10000',
                    quantity: '1'
                }
            ]
        };

        const paymentResponse = await axios.post('https://secure.snd.payu.com/api/v2_1/orders', order, {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        const { redirectUri } = paymentResponse.data;

        res.redirect(redirectUri);
    } catch (error) {
        console.error('Ошибка при создании заказа:', error);
        res.status(500).send('Ошибка при создании заказа');
    }
});

// Route to display top-up page
app.get('/top-up', (req, res) => {
    res.render('top-up');
});

module.exports = app;