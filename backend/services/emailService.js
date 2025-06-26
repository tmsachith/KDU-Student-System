const nodemailer = require('nodemailer');

class EmailService {  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendVerificationEmail(email, name, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"KDU Student System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - KDU Student System',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">KDU Student System</h1>
          </div>
          
          <div style="background-color: #f8fafc; padding: 30px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin-bottom: 20px;">Welcome, ${name}!</h2>
            
            <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
              Thank you for registering with KDU Student System. To complete your registration and secure your account, please verify your email address.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin-bottom: 10px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="color: #2563eb; word-break: break-all; font-size: 14px;">
              ${verificationUrl}
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #64748b; font-size: 12px; text-align: center;">
              This verification link will expire in 24 hours. If you didn't create an account, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 12px;">
            <p>© 2025 KDU Student System. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Verification email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(email, name, userRole) {
    const platformMessage = userRole === 'student' 
      ? 'You can now access the KDU Student Mobile App with your verified account.'
      : 'You can now access the KDU Student System web application.';

    const mailOptions = {
      from: `"KDU Student System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to KDU Student System',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">KDU Student System</h1>
          </div>
          
          <div style="background-color: #f0fdf4; padding: 30px; border-radius: 8px; border: 1px solid #bbf7d0;">
            <h2 style="color: #166534; margin-bottom: 20px;">Email Verified Successfully!</h2>
            
            <p style="color: #166534; line-height: 1.6; margin-bottom: 20px;">
              Hello ${name}, your email has been successfully verified. Welcome to KDU Student System!
            </p>
            
            <p style="color: #166534; line-height: 1.6; margin-bottom: 20px;">
              ${platformMessage}
            </p>
            
            <div style="background-color: #dcfce7; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="color: #166534; margin: 0; font-weight: bold;">Account Details:</p>
              <p style="color: #166534; margin: 5px 0 0 0;">Role: ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 12px;">
            <p>© 2025 KDU Student System. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
