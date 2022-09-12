const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')

// Models
const { User } = require('../models/user.model')

// Utils
const { AppError } = require('../utils/appError')
const { catchAsync } = require('../utils/catchAsync')
const { cookie } = require('express-validator')
const { Email } = require('../utils/email')


dotenv.config({ path: './config.env' })

exports.loginUser = catchAsync(async (req, res, next) => {
	const { email, password } = req.body

	// If user exists with the email
	const user = await User.findOne({ where: { email, status: 'available' } })

	if (!user || !(await bcrypt.compare(password, user.password))) {
		return next(new AppError('Credentials are not valid', 404))
	}

	// JWT
	const token = await jwt.sign(
		{ id: user.id },
		process.env.JWT_KEY, 
		{ expiresIn: process.env.JWT_EXPIRES_IN }
	)

	const cookieOptions = {
		httpOnly: true,
		expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 60 * 60 * 1000),
		sameSite: true,
		// secure: true
	}

	if (process.env.NODE_ENV === 'production') cookieOptions.secure = true

	res.cookie('jwt', token, cookieOptions)

	user.password = undefined;

	return res.status(200).json({
		status: 'success',
		data: { user, token }
	})

})

exports.getUserById = catchAsync(async (req, res, next) => {
	const { id } = req.params

	const user = await User.findOne({
		attributes: { exclude: ['password'] },
		where: { id },
	})

	if (!user) {
		return next(new AppError('User not found', 404))
	}

	return res.status(200).json({
		status: 'success',
		data: {
			user,
		},
	})
})

exports.createUser = catchAsync(async (req, res, next) => {
	const { name, email, password, role } = req.body

	const salt = await bcrypt.genSalt(12)
	const hashedPassword = await bcrypt.hash(password, salt)

	const newUser = await User.create({
		name,
		email,
		password: hashedPassword,
		role: role || 'standard',
	})

	// Remove password from response
	newUser.password = undefined

	//send Email
	await new Email(newUser.email).sendWelcome(newUser.name, newUser.email)

	return res.status(201).json({
		status: 'success',
		data: { user: newUser },
	})
})

exports.updateUser = catchAsync(async (req, res, next) => {
	// no matter what id is being passed in the url. / i.e.(only user1 can edit user1's information)
	const user = req.currentUser
	const { name, email } = req.body

	await user.update({ name, email })

	return res.status(204).json({ status: 'success' })
})

exports.disableUserAccount = catchAsync(async (req, res, next) => {
	const user = req.currentUser

	await user.update({ status: 'disabled' })

	return res.status(204).json({ status: 'success' })
})
