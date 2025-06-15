//src/Server/SERVICES/handlebarsEmailService.js

const nodemailer = require('nodemailer');
const config = require('../CONFIG/config');

class HandlebarsEmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // Use the same configuration as your existing emailService.js
      this.transporter = nodemailer.createTransporter({
        host: config.email.host,
        port: config.email.port,
        secure: false,
        auth: {
          user: config.email.user,
          pass: config.email.password
        }
      });

      console.log('✅ Email transporter initialized');
    } catch (error) {
      console.error('❌ Email transporter failed to initialize:', error);
      this.transporter = null;
    }
  }

  /**
   * Verstuur welcome email naar nieuwe student
   */
  async sendStudentWelcomeEmail(studentData) {
    try {
      if (!this.transporter) {
        console.warn('📧 Email service not available, skipping email');
        return { success: false, error: 'Email service not configured' };
      }

      const emailContent = `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #881538 0%, #A91B47 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">🎓 Welkom bij CareerLaunch!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Erasmus Hogeschool Brussels</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #881538; font-size: 24px; margin-bottom: 20px;">Hallo ${studentData.voornaam}!</h2>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Je account is succesvol aangemaakt voor CareerLaunch EHB. Je bent nu klaar om deel te nemen aan dit geweldige evenement!
            </p>
            
            <div style="background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 25px 0;">
              <h3 style="color: #881538; margin-top: 0;">📋 Jouw accountgegevens:</h3>
              <ul style="color: #666; line-height: 1.8;">
                <li><strong>Studentnummer:</strong> ${studentData.studentnummer}</li>
                <li><strong>Email:</strong> ${studentData.email}</li>
                <li><strong>Opleiding:</strong> ${studentData.opleiding}</li>
                ${studentData.opleidingsrichting ? `<li><strong>Richting:</strong> ${studentData.opleidingsrichting}</li>` : ''}
              </ul>
            </div>
            
            <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 25px; margin: 25px 0;">
              <h3 style="color: #881538; margin-top: 0;">🚀 Wat kun je nu doen?</h3>
              <ul style="color: #666; line-height: 1.8;">
                <li>Inloggen op het platform</li>
                <li>Je project uploaden en beschrijven</li>
                <li>Bedrijven ontdekken en gesprekken plannen</li>
                <li>Het programma bekijken</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:8383/login" style="background: linear-gradient(135deg, #881538, #A91B47); color: white; padding: 15px 30px; border-radius: 50px; text-decoration: none; font-weight: 600; display: inline-block; box-shadow: 0 4px 15px rgba(136, 21, 56, 0.4);">
                🔑 Inloggen op CareerLaunch
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <strong>Evenement datum:</strong> Donderdag 13 Maart 2025<br>
              <strong>Locatie:</strong> Erasmus Hogeschool Brussels
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              © ${new Date().getFullYear()} Erasmus Hogeschool Brussels - CareerLaunch
            </p>
          </div>
        </div>
      `;

      const mailOptions = {
        from: {
          name: 'CareerLaunch EHB',
          address: config.email.user
        },
        to: studentData.email,
        subject: '🎓 Welkom bij CareerLaunch EHB!',
        html: emailContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Student welcome email sent to ${studentData.email}`);
      return {
        success: true,
        messageId: result.messageId,
        recipient: studentData.email
      };

    } catch (error) {
      console.error('❌ Failed to send student welcome email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verstuur welcome email naar nieuw bedrijf
   */
  async sendBedrijfWelcomeEmail(bedrijfData, vatInfo = null) {
    try {
      if (!this.transporter) {
        console.warn('📧 Email service not available, skipping email');
        return { success: false, error: 'Email service not configured' };
      }

      let vatStatus = '';
      if (vatInfo) {
        vatStatus = vatInfo.isValid 
          ? `<div style="color: #28a745; font-weight: 600;">✅ TVA nummer gevalideerd</div>`
          : `<div style="color: #ffc107; font-weight: 600;">⚠️ TVA nummer verificatie pending</div>`;
      }

      const emailContent = `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #881538 0%, #A91B47 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">🏢 Welkom bij CareerLaunch!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Partnership Bevestiging</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #881538; font-size: 24px; margin-bottom: 20px;">Welkom ${bedrijfData.naam}!</h2>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Uw bedrijfsaccount is succesvol aangemaakt voor CareerLaunch EHB. We kijken er naar uit om samen talent te ontdekken!
            </p>
            
            <div style="background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 25px 0;">
              <h3 style="color: #881538; margin-top: 0;">📋 Bedrijfsgegevens:</h3>
              <ul style="color: #666; line-height: 1.8;">
                <li><strong>Bedrijfsnaam:</strong> ${bedrijfData.naam}</li>
                <li><strong>Email:</strong> ${bedrijfData.email}</li>
                <li><strong>Sector:</strong> ${bedrijfData.sector || 'Niet opgegeven'}</li>
                <li><strong>TVA nummer:</strong> ${bedrijfData.TVA_nummer} ${vatStatus}</li>
                <li><strong>Locatie:</strong> ${bedrijfData.gemeente}, ${bedrijfData.postcode}</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:8383/login" style="background: linear-gradient(135deg, #881538, #A91B47); color: white; padding: 15px 30px; border-radius: 50px; text-decoration: none; font-weight: 600; display: inline-block; box-shadow: 0 4px 15px rgba(136, 21, 56, 0.4);">
                🔑 Inloggen op Platform
              </a>
            </div>
          </div>
        </div>
      `;

      const mailOptions = {
        from: {
          name: 'CareerLaunch Partnership Team',
          address: config.email.user
        },
        to: bedrijfData.email,
        subject: '🏢 Welkom bij CareerLaunch EHB - Partnership Bevestigd!',
        html: emailContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Bedrijf welcome email sent to ${bedrijfData.email}`);
      return {
        success: true,
        messageId: result.messageId,
        recipient: bedrijfData.email
      };

    } catch (error) {
      console.error('❌ Failed to send bedrijf welcome email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test email functie
   */
  async sendTestEmail(toEmail) {
    try {
      if (!this.transporter) {
        return { success: false, error: 'Email service not configured' };
      }

      const mailOptions = {
        from: {
          name: 'CareerLaunch Test',
          address: config.email.user
        },
        to: toEmail,
        subject: '🧪 Test Email - CareerLaunch',
        html: `
          <h2>Test Email Successful!</h2>
          <p>This is a test email from the CareerLaunch system.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Test email sent to ${toEmail}`);
      return {
        success: true,
        messageId: result.messageId,
        recipient: toEmail
      };

    } catch (error) {
      console.error('❌ Failed to send test email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Backward compatibility met jouw bestaande emailService.js
  async sendWelcomeEmail(userEmail, userName) {
    const mailOptions = {
      from: config.email.user,
      to: userEmail,
      subject: 'Welkom bij CareerLaunch!',
      html: `
        <h1>Welkom ${userName}!</h1>
        <p>Je account is succesvol aangemaakt voor CareerLaunch.</p>
        <p>Je kunt nu inloggen en deelnemen aan het evenement.</p>
      `
    };
    return await this.transporter.sendMail(mailOptions);
  }

  async sendInvoice(invoiceData) {
    const { email, naam, factuurId } = invoiceData;
   
    const mailOptions = {
      from: config.email.user,
      to: email,
      subject: `CareerLaunch Factuur #${factuurId}`,
      html: `
        <h1>Factuur CareerLaunch</h1>
        <p>Beste ${naam},</p>
        <p>Bedankt voor je deelname aan CareerLaunch!</p>
        <p>Factuur nummer: ${factuurId}</p>
      `
    };
    return await this.transporter.sendMail(mailOptions);
  }

  async sendAppointmentConfirmation(studentEmail, bedrijfNaam, startTijd) {
    const mailOptions = {
      from: config.email.user,
      to: studentEmail,
      subject: 'Afspraak bevestiging - CareerLaunch',
      html: `
        <h1>Afspraak bevestigd!</h1>
        <p>Je afspraak met ${bedrijfNaam} is bevestigd.</p>
        <p>Tijd: ${new Date(startTijd).toLocaleString('nl-NL')}</p>
      `
    };
    return await this.transporter.sendMail(mailOptions);
  }
}

module.exports = new HandlebarsEmailService();