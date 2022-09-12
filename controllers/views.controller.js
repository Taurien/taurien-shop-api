const path = require('path')

exports.renderIndex = (req, res, next) => {
	return res.status(200).render('welcome.pug', { message: 'Hello from NodeJS xD' })
}