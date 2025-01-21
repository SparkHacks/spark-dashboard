import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: import.meta.env.NODEMAILER_SERVICE,
  auth: {
    user: import.meta.env.NODEMAILER_EMAIL,
    pass: import.meta.env.NODEMAILER_PASS
  }
})

export const sendEmailConfirmation = (to: string) => {
  const mailOption = {
    from: import.meta.env.NODEMAILER_EMAIL,
    to: to,
    subject: 'SparkHacks 2025 Registration Confirmation',
    text: "This is confirmation that we receive your registration form to SparkHacks 2025! 🐋"
  }

  transporter.sendMail(mailOption, function(error, info){
    if (error) {
      console.error(error);
    } else {
      console.log(`Email sent to ${to}: ${info.response}`);
    }
  })
}