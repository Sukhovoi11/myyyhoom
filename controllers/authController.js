// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

//handle errors
const handleErrors = (err) => {
    console.log(err.message, err.code);
    let errors = { email: '', password: ''};

    //incorect email
    if (err.message === 'incorrect email') {
        errors.email = 'that email is not registered';
    }

    //incorect passsword
    if (err.message === 'incorrect password') {
        errors.password = 'that password is incorrect';
    }

    //dublicate error code
    if (err.code === 11000){
        errors.email = 'that email is already registered';
        return errors;
    }

    // validation errors
    if (err.message.includes('user validation failed')) {
        Object.values(err.errors).forEach(({properties}) => {
            errors[properties.path] = properties.message;
        })
    }
    return errors;
}

const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
    return jwt.sign({ id }, 'net ninja secret', {
        expiresIn: maxAge
    });
}

module.exports.signup_get = (req, res) => {
    res.render('signup');
}

module.exports.login_get = (req, res) => {
    res.render('login');
}

module.exports.signup_post = async (req, res) => {
    const { email, password } = req.body;
    console.log('Request body:', req.body); // добавлено для диагностики

    try {
        const user = await User.create ({ email, password });
        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000});
        res.status(201).json({user: user._id});
    }
    catch (err) {
        const errors = handleErrors(err);
        console.log('Error details:', errors); // добавлено для диагностики
        res.status(400).json({ errors });
    }
}

module.exports.login_post = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.login(email, password);
        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000});
        res.status(200).json({user: user._id})
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

module.exports.logout_get = (req, res) => {
    res.cookie('jwt', '', { maxAge: 1});
    res.redirect('/');
}

module.exports.profile_get = async (req, res) => {
    try {
        const user = res.locals.user;
        res.render('profile', { user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching user profile');
    }
}

module.exports.topUp_post = async (req, res) => {
    const { amount } = req.body;
    try {
        const user = res.locals.user;
        user.balance += parseInt(amount);
        await user.save();
        res.redirect('/profile'); // Перенаправляем на страницу профиля или любую другую желаемую страницу
    } catch (err) {
        console.error(err);
        res.status(500).send('Error topping up balance');
    }
}