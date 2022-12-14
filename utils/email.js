const nodemailer = require('nodemailer')
const pug = require('pug')
const path = require('path')
const { htmlToText } = require('html-to-text')
const dotenv = require('dotenv')

dotenv.config({ path: './config.env' })

class Email {
	constructor(emails) {
		this.emails = emails
	}

	createTransport() {
		if (process.env.NODE_ENV === 'production') {
			return nodemailer.createTransport({
				// service: 'SendGrid',
        host: 'smtp.sendgrid.net',
        port: 587,
				auth: {
					user: 'apikey',
					pass: process.env.SENDGRID_API_KEY,
				},
			})
		}


		return nodemailer.createTransport({
			host: 'smtp.mailtrap.io',
			port: 2525,
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASSWORD,
			},
		})
	}

	async send(template, subject, templateOptions = {}) {
		const transport = await this.createTransport()

		const templatePath = path.join(
			__dirname,
			'..',
			'views',
			'emails',
			`${template}.pug`
		)

		const html = pug.renderFile(templatePath, templateOptions)

		const mailOptions = {
			subject,
			from: process.env.EMAIL_FROM,
			to: this.emails,
			html,
			text: htmlToText(html),
		}

		await transport.sendMail(mailOptions)
	}

	async sendWelcome(username, email) {
		await this.send('welcome', 'New account :D in Taurien Shop', { username, email })
	}

	async sendReceipt(username, products, totalprice) {
		await this.send('receipt', 'Taurien Shop Receipt :D', { username, products, totalprice })
	}
}

module.exports = { Email }
