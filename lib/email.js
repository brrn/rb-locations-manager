const nodemailer = require("nodemailer");
const debug = (process.env.DEBUG === "true") | false;

const transporter = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "brian@rarebrew.com",
    pass: process.env.GMAIL_PASSWORD,
  },
});

const sendEmail = (body) => {
  const eMailOptions = {
    from: "brian@rarebrew.com",
    to: "brian@rarebrew.com",
    subject: "Notification from updateMapData.js",
    text: body,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(eMailOptions, (emailError, info) => {
      if (emailError) {
        console.log("Error sending error email notification:", emailError);
        reject(emailError);
      } else {
        console.log("Email notification sent successfully");
        resolve();
      }
    });
  });
};

module.exports = { sendEmail };
