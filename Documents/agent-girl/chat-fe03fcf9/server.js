import express from 'express'
import nodemailer from 'nodemailer'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config()

const app = express()
const PORT = 3002

app.use(cors())
app.use(express.json())

app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, message } = req.body

    if (!to || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to: to,
      subject: subject,
      text: message,
      html: `<p>${message}</p>`,
    }

    await transporter.sendMail(mailOptions)

    res.json({ message: 'Email sent successfully!' })
  } catch (error) {
    console.error('Error sending email:', error)
    res.status(500).json({ error: 'Failed to send email' })
  }
})

app.get('/', (req, res) => {
  res.send('Email server is running!')
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})