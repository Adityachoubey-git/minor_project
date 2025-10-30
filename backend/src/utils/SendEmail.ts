import nodeMailer from "nodemailer";
import  SMTPTransport from "nodemailer/lib/smtp-transport";
import fs from 'fs';
import path from 'path';

export const sendEmail = async (
  email: string,
  subject: string,
  message: string
) => {
  const transporter = nodeMailer.createTransport(
    new SMTPTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  );

  const options = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject,
    html: message,
  };

  const logDir = path.join(process.cwd(), 'logs');
  const logFilePath = path.join(logDir, 'mail_log.txt');

  // Ensure logs directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  try {
    const response = await transporter.sendMail(options);

    const logEntry = {
      to: email,
      subject,
      messageSnippet: message,
      response,
      timestamp: new Date().toISOString(),
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(logFilePath, logLine);

    console.log("Mail response:", response);
  } catch (error) {
    console.error("Error sending mail:", error);

    const errorLog = {
      to: email,
      subject,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };

    fs.appendFileSync(logFilePath, JSON.stringify(errorLog) + '\n');
  }
};