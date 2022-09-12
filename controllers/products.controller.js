const { ref, uploadBytes, getDownloadURL } = require('firebase/storage')

// Models
const { Product } = require('../models/product.model')
const { ProductImg } = require('../models/productImg.model')
const { User } = require('../models/user.model')

// Utils
const { catchAsync } = require("../utils/catchAsync")
const { AppError } = require('../utils/appError')
const { filterObj } = require('../utils/filterObj')
const { firebaseStorage, firebaseApp } = require('../utils/firebase.config')

exports.createProduct = catchAsync(async (req, res, next) => {

  const { name, description, price, quantity, category  } = req.body
  const images = req.files.productImgs

  const userId = req.currentUser.id

  const newProduct = await Product.create({
    name,
    description,
    price,
    quantity,
    category,
    userId
  })

  if (images) {
    //Save img path
    const imgsPromises = images.map(async img => {

      const imgName = `/img/products/${newProduct.id}-${userId}-${img.originalname}`
      const imgRef = ref(firebaseStorage, imgName)

      const result = await uploadBytes(imgRef, img.buffer)
      const url = await getDownloadURL(result.ref)
      
      await ProductImg.create({
        productId: newProduct.id,
        imgPath: result.metadata.fullPath,
        imgUrl: url
      })
      
    })
  
    await Promise.all(imgsPromises)
  }

  return res.status(200).json({
    status: 'success',
    // data: { newProduct }
  })
})

exports.getAllProducts = catchAsync(async (req, res, next) => {
  
  const allProducts = await Product.findAll({
    where: { status: 'active' },
    include: [
      { model: User, attributes: { exclude: ['id', 'password', 'status', 'role'] } },
      { model: ProductImg }
    ]
  })

  return res.status(200).json({
    status: 'success',
    data : { allProducts }
  })
})

exports.getProductDetails = catchAsync(async (req, res, next) => {

  const { id } = req.params

  const item = await Product.findOne({
    where: { id },
    include: [
      { model: User, attributes: { exclude: ['password'] } },
      { model: ProductImg }
    ]
  })

  if (!item) next(new AppError('Product not found', 404))

  return res.status(200).json({
    status: 'success',
    data : { item }
  })
})

exports.updateProduct = catchAsync(async (req, res, next) => {

  const { item } = req
  // { name, description, price, quantity, category }

  const filter = filterObj(
    req.body,
    'name',
    'description',
    'price',
    'quantity',
    'category',
   )

  if (filter.quantity && filter.quantity < 0) {
    return next(new AppError('Invalid product quantity', 400))
  }

  const updatedItem = await item.update({
    ...filter,
    quantity: filter.quantity ? item.quantity + filter.quantity : item.quantity
  })

  return res.status(200).json({
    status: 'success',
    data : { updatedItem }
  })
})

exports.disableProduct = catchAsync(async (req, res, next) => {

  const { item } = req

  await item.update({ status: 'deleted' })

  return res.status(200).json({
    status: 'success',
    data : { item }
  })
})

exports.getUserProducts = catchAsync(async (req, res, next) => {
	
  // Get the user's products based on its id
  const user = req.currentUser

  const allItems = await Product.findAll({
    where: {
      userId: user.id,
      status: 'active'
    }
  })

  if (allItems.length ===0) {
    return res.status(200).json({
      status: 'success',
      data: 'You dont have products yet',
    })
  }

	return res.status(200).json({
		status: 'success',
		data: { allItems },
	})
})
