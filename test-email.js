import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.postmarkapp.com",
  port: 587,
  secure: false,
  auth: {
    user: "17d205c6-8892-4a98-8b18-34c8525411c0", 
    pass: "17d205c6-8892-4a98-8b18-34c8525411c0", 
  },
});

const mailOptions = {
  from: '"proximo" <elliot@proximo.life>',
  to: "elliot@proximo.life",
  subject: "Test Email",
  text: "This is a test email from Postmark.",
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Email sent:", info.response);
  }
});
