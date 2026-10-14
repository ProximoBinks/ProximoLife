import nodemailer from "nodemailer";
const token = process.env.POSTMARK_SERVER_TOKEN;
const recipient = process.env.CONTACT_EMAIL;
if (!token || !recipient) throw new Error("Set POSTMARK_SERVER_TOKEN and CONTACT_EMAIL first");
const transport = nodemailer.createTransport({ host: "smtp.postmarkapp.com", port: 587, secure: false, requireTLS: true, auth: { user: token, pass: token } });
await transport.sendMail({ from: recipient, to: recipient, subject: "Proximo email test", text: "Email delivery is working." });
console.log("Test message sent.");
