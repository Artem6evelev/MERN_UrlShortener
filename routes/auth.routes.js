const {Router} = require('express')
const bcrypt = require('bcryptjs')
const config = require('config')
const jwt = require('jsonwebtoken')
const {check, validationResult} = require('express-validator')
const User = require('../models/User')
const router = Router()

// api/auth/register
router.post(
    '/register', 
    [
        check('email', 'Incorrect email').isEmail(),
        check('password', 'Minimal password length 6 symbols')
            .isLength({ min: 6 })
    ],
    async (req, res) => {
    try {
        const errors = validationResult(req)

        if(!errors.isEmpty) {
            return res.status(400).json({
                errors: errors.array(),
                message: 'Incorrect registration data'
            })
        }

        const {email, password} = req.body //that what we will send from client
        //registration logic
        const candidate = await User.findOne({ email })

        if(candidate) {
            return res.status(400).json({ 'This user already exists' })
        }

        //Hashing password with bcryptjs
        const hashedPassword = await bcrypt.hash(password, 12)
        const user = new User ({ email, password: hashedPassword })

        await user.save()

        res.status(201).json({ message: 'User was created' })

    } catch (e) {
        res.status(500).json({ message: 'Something goes wrong, try again' })
    }
})

// api/auth/login
router.post(
    '/login', 
    [
        check('email', 'Write correct email').normalizeEmail().isEmail(),
        check('password', 'Write password').exists()
    ],
    async (req, res) => {
    try {
        const errors = validationResult(req)

        if(!errors.isEmpty) {
            return res.status(400).json({
                errors: errors.array(),
                message: 'Incorrect registration entering to system'
            })
        }

        //logic to create a user with a password and login name
        const {email, password} = req.body

        const user = await User.findOne({ email })

        if (!user) {
            return res.status(400).json({ message: 'User was not found' })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect password try again' })
        }

        //User autorization
        const token = jwt.sign(
            { userId: user.id },
            config.get('jwtSecret'),
            { expiresI: '1h' }
        )

        res.json({ token, userId: user.id })



    } catch (e) {
        res.status(500).json({ message: 'Something goes wrong, try again' })
    }
})

module.exports = router