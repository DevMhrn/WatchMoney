import nodemailer from 'nodemailer';

class EmailConfig {
    constructor() {
        this.transporter = null;
        this.testAccount = null;
        this.init();
    }

    async init() {
        // Email service temporarily disabled
        console.log('📧 Email service disabled - skipping email configuration');
        this.transporter = null;
        this.testAccount = null;
        
        /* Original email initialization (commented out):
        try {
            // For MVP/Testing: Use Ethereal Email (fake SMTP service for testing)
            console.log('🧪 Setting up Ethereal Email for testing...');
            
            // Create test account
            this.testAccount = await nodemailer.createTestAccount();
            
            this.transporter = nodemailer.createTransporter({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: this.testAccount.user,
                    pass: this.testAccount.pass
                }
            });
            
            console.log('✅ Ethereal Email test account created:');
            console.log(`   📧 User: ${this.testAccount.user}`);
            console.log(`   🔑 Pass: ${this.testAccount.pass}`);
            console.log('   🌐 Preview emails at: https://ethereal.email/');
            console.log('   ℹ️  All emails will be captured by Ethereal for testing');

        } catch (error) {
            console.error('❌ Failed to setup email transporter:', error.message);
            
            // Fallback: create a simple transporter that won't fail
            this.transporter = nodemailer.createTransporter({
                streamTransport: true,
                newline: 'unix',
                buffer: true
            });
        }
        */
    }

    async verifyConnection() {
        // Email service disabled
        console.log('📧 Email verification skipped - email service is disabled');
        return false;
        
        /* Original verification code (commented out):
        try {
            if (!this.transporter) {
                console.log('⚠️  Email transporter not initialized - skipping verification');
                return false;
            }
            
            await this.transporter.verify();
            console.log('✅ Ethereal Email connection verified');
            return true;
        } catch (error) {
            console.error('❌ Email verification failed:', error.message);
            return false;
        }
        */
    }

    getTransporter() {
        return null; // Email service disabled
    }

    getDefaultFromAddress() {
        return {
            name: 'DdevFinance Budget Alerts',
            address: 'noreply@ddevfinance.local'
        };
    }

    // Test email sending (disabled)
    async sendTestEmail(to = 'devlearncoding37@gmail.com') {
        console.log('📧 Test email skipped - email service is disabled');
        return {
            success: true,
            messageId: 'disabled',
            message: 'Email service is currently disabled'
        };
        
        /* Original test email code (commented out):
        try {
            if (!this.transporter) {
                throw new Error('Email transporter not initialized');
            }

            const mailOptions = {
                from: this.getDefaultFromAddress(),
                to: to,
                subject: 'Test Email from DdevFinance Budget Alert Service',
                text: 'This is a test email to verify the email configuration is working correctly.',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">DdevFinance Budget Alert Service</h2>
                        <p>This is a test email to verify that the email configuration is working correctly.</p>
                        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #374151; margin-top: 0;">Test Details:</h3>
                            <ul style="color: #6b7280;">
                                <li>Service: Budget Alert Service</li>
                                <li>Environment: Development/Testing</li>
                                <li>Email Provider: Ethereal Email (Testing)</li>
                                <li>Timestamp: ${new Date().toISOString()}</li>
                            </ul>
                        </div>
                        <p style="color: #6b7280; font-size: 14px;">
                            This email was sent from the DdevFinance budget alert microservice for testing purposes.
                        </p>
                    </div>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            const previewUrl = this.getPreviewUrl(info);

            console.log('✅ Test email sent successfully');
            console.log('📧 Message ID:', info.messageId);
            if (previewUrl) {
                console.log('🌐 Preview URL:', previewUrl);
            }

            return {
                success: true,
                messageId: info.messageId,
                previewUrl: previewUrl
            };

        } catch (error) {
            console.error('❌ Failed to send test email:', error.message);
            throw error;
        }
        */
    }
}

export default new EmailConfig();
