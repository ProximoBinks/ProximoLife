// src/pages/api/contact.ts

import type { APIRoute } from "astro";
import nodemailer from "nodemailer";

/** 
 * This function handles POST requests to /api/contact.
 * The "APIRoute" type is the typical pattern in Astro for server endpoints.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Parse incoming JSON
    const { name, email, message } = await request.json();

    // 2. Create nodemailer transporter (using Postmark)
    const transporter = nodemailer.createTransport({
      host: "smtp.postmarkapp.com",
      port: 587,
      secure: false,
      auth: {
        user: "17d205c6-8892-4a98-8b18-34c8525411c0",
        pass: "17d205c6-8892-4a98-8b18-34c8525411c0",
      },
    });

    // 3. Define mail options
    const mailOptions = {
      from: `"Proximo" <elliot@proximo.life>`,
      to: "elliot@proximo.life",
      subject: "New Contact Form Submission",
      text: `
        From: ${name} <${email}>
        Message: ${message}
      `,
    };

    // 4. Send email
    await transporter.sendMail(mailOptions);

    // 5. Return a success response
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
