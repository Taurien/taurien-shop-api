const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const { Op } = require('sequelize');
const { promisify } = require('util');

// Models
const { User } = require('../models/user.model');
const { Product } = require('../models/product.model');

// Utils
const { catchAsync } = require("../utils/catchAsync");
const { AppError } = require("../utils/appError");

dotenv.config({ path: './config.env' })

exports.verifyJWT = catchAsync(async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('Invalid session', 401))
  }
    
  // const result = jwt.verify(token, process.env.JWT_KEY)

  // Validate token
	const decoded = await promisify(jwt.verify)(token, process.env.JWT_KEY);

	if (!decoded) return next(new AppError('Invalid token', 401));

    
  const user = await User.findOne({
    attributes: { exclude: ['password'] },
    where: { id: decoded.id, status: 'available' }
  })
  

  if (!user) {
    return next(new AppError('User session is not longer valid' ,401))
  }

  // Add data to req
  req.currentUser = user

  next()
})

exports.isProductOwner = catchAsync(async (req, res, next) => {
  const { id } = req.params
  const { currentUser } = req

  const item = await Product.findOne({
    where: { id, status: { [Op.or]: ['active', 'soldOut'] }} 
  })

  if (!item) return next(new AppError('Product not found', 404))

  if (item.userId !== currentUser.id) return next(new AppError('Not owner', 401))

  req.item = item

  next()
})

exports.isAccountOwner = catchAsync(async (req, res, next) => {
  const { id } = req.params
  const { currentUser } = req
  // the active user has already been declared.

  if (+id !== +currentUser.id) return next(new AppError(`Youre trying to edit someone else's account`, 500))
  next()
})