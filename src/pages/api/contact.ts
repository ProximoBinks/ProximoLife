import type { APIRoute } from "astro";
import nodemailer from "nodemailer";
import { allowRequest, json, readBody, sameOrigin } from "../../utils/http";
export const POST: APIRoute = async (context) => {
  if (!sameOrigin(context.request)) return json({ error: "Forbidden" }, 403);
  try {
    const { name, email, message, website } = await readBody(context.request);
    if (website) return json({ success: true });
    if (typeof name !== "string" || !name.trim() || name.length > 100 || typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof message !== "string" || !message.trim() || message.length > 10000) return json({ error: "Enter a name, valid email address, and message (up to 10,000 characters)." }, 400);
    if (!await allowRequest(context, "contact", 5)) return json({ error: "Too many messages. Please try again in 15 minutes." }, 429);
    const token = import.meta.env.POSTMARK_SERVER_TOKEN;
    const recipient = import.meta.env.CONTACT_EMAIL;
    if (!token || !recipient) return json({ error: "Email is temporarily unavailable. Please try again later." }, 503);
    const transporter = nodemailer.createTransport({ host: "smtp.postmarkapp.com", port: 587, secure: false, requireTLS: true, auth: { user: token, pass: token }, connectionTimeout: 10000, socketTimeout: 15000 });
    await transporter.sendMail({ from: recipient, to: recipient, replyTo: email, subject: "New message from proximo.life", text: `From: ${name} <${email}>\n\n${message}` });
    return json({ success: true });
  } catch { return json({ error: "Your message could not be sent. Please try again." }, 503); }
};
