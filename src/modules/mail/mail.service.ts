import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class MailService {
  private readonly resend: Resend;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(process.env.RESEND_KEY);
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    try {
      const response = await this.resend.emails.send({
        from: process.env.MAIL_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (response.error) {
        console.error("Error sending with Resend:", response.error);
        throw new Error("Failed to send email via Resend");
      }

      console.log(`Email sent to ${options.to}`);
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send email");
    }
  }

  async sendOtpEmail(email: string, otp: string): Promise<void> {
    const subject = "Your OTP Code";
    const text = `Your OTP code is ${otp}. It will expire in 10 minutes.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #333;">OTP Verification</h2>
        <p>Your one-time password (OTP) is:</p>
        <div style="background: #f4f4f4; padding: 10px 15px; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 2px; text-align: center;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes. Please do not share this code with anyone.</p>
        <p style="color: #888; font-size: 12px; margin-top: 30px;">
          If you didn't request this OTP, please ignore this email or contact support.
        </p>
      </div>
    `;

    await this.sendMail({
      to: email,
      subject,
      text,
      html,
    });
  }
}
