//src/Server/SERVICES/handlebarsEmailService.js

const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const path = require('path');
const config = require('../CONFIG/config');

class HandlebarsEmailService {
  constructor() {
    // Create transporter
    this.transporter = nodemailer.createTransporter({
      host: config.email.host,
      port: config.email.port,
      secure: false,
      auth: {
        user: config.email.user,
        pass: config.email.password
      }
    });

    // Configure handlebars
    this.transporter.use('compile', hbs({
      viewEngine: {
        extName: '.hbs',
        partialsDir: path.join(__dirname, '../TEMPLATES/emails/partials'),
        layoutsDir: path.join(__dirname, '../TEMPLATES/emails/layouts'),
        defaultLayout: 'main',
        helpers: {
          // Custom helpers
          formatDate: function(date) {
            return new Date(date).toLocaleDateString('nl-NL');
          },
          uppercase: function(str) {
            return str.toUpperCase();
          },
          eq: function(a, b) {
            return a === b;
          }
        }
      },
      viewPath: path.join(__dirname, '../TEMPLATES/emails'),
      extName: '.hbs'
    }));

    // Verify connection
    this.verifyConnection();
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email server connection verified');
    } catch (error) {
      console.error('❌ Email server connection failed:', error);
    }
  }

  /**
   * Verstuur welcome email naar nieuwe student
   */
  async sendStudentWelcomeEmail(studentData) {
    try {
      const mailOptions = {
        from: {
          name: 'CareerLaunch EHB',
          address: config.email.user
        },
        to: studentData.email,
        subject: '🎓 Welkom bij CareerLaunch EHB!',
        template: 'student-welcome',
        context: {
          voornaam: studentData.voornaam,
          achternaam: studentData.achternaam,
          studentnummer: studentData.studentnummer,
          email: studentData.email,
          opleiding: studentData.opleiding,
          opleidingsrichting: studentData.opleidingsrichting || '',
          loginUrl: 'http://localhost:3301/login',
          currentYear: new Date().getFullYear(),
          eventDate: '25 juni 2025'
        }
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
      const mailOptions = {
        from: {
          name: 'CareerLaunch Partnership Team',
          address: config.email.user
        },
        to: bedrijfData.email,
        subject: '🏢 Welkom bij CareerLaunch EHB - Partnership Bevestigd!',
        template: 'bedrijf-welcome',
        context: {
          bedrijfNaam: bedrijfData.naam,
          contactVoornaam: bedrijfData.voornaam || 'Contactpersoon',
          contactAchternaam: bedrijfData.achternaam || '',
          email: bedrijfData.email,
          TVA_nummer: bedrijfData.TVA_nummer,
          sector: bedrijfData.sector || '',
          gemeente: bedrijfData.gemeente,
          straatnaam: bedrijfData.straatnaam,
          huisnummer: bedrijfData.huisnummer,
          postcode: bedrijfData.postcode,
          vatValidated: vatInfo?.isValid || false,
          vatCompanyName: vatInfo?.companyName || null,
          loginUrl: 'http://localhost:3301/login',
          currentYear: new Date().getFullYear(),
          eventDate: '25 juni 2025',
          partnershipEmail: 'partnerships@ehb.be',
          partnershipPhone: '+32 2 418 61 11'
        }
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
   * Verstuur test email (voor development)
   */
  async sendTestEmail(toEmail) {
    try {
      const mailOptions = {
        from: {
          name: 'CareerLaunch Test',
          address: config.email.user
        },
        to: toEmail,
        subject: '🧪 Test Email - CareerLaunch',
        template: 'test-email',
        context: {
          testMessage: 'Dit is een test email van het CareerLaunch systeem.',
          timestamp: new Date().toISOString(),
          currentYear: new Date().getFullYear()
        }
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

  /**
   * Bestaande functionaliteit voor backwards compatibility
   */
  async sendWelcomeEmail(userEmail, userName) {
    const mailOptions = {
      from: config.email.user,
      to: userEmail,
      subject: 'Welkom bij CareerLaunch!',
      template: 'generic-welcome',
      context: {
        userName: userName,
        currentYear: new Date().getFullYear()
      }
    };
    return await this.transporter.sendMail(mailOptions);
  }

  async sendInvoice(invoiceData) {
    const { email, naam, factuurId } = invoiceData;
   
    const mailOptions = {
      from: config.email.user,
      to: email,
      subject: `CareerLaunch Factuur #${factuurId}`,
      template: 'invoice',
      context: {
        naam: naam,
        factuurId: factuurId,
        currentYear: new Date().getFullYear()
      }
    };
    return await this.transporter.sendMail(mailOptions);
  }

  async sendAppointmentConfirmation(studentEmail, bedrijfNaam, startTijd) {
    const mailOptions = {
      from: config.email.user,
      to: studentEmail,
      subject: 'Afspraak bevestiging - CareerLaunch',
      template: 'appointment-confirmation',
      context: {
        bedrijfNaam: bedrijfNaam,
        startTijd: new Date(startTijd).toLocaleString('nl-NL'),
        currentYear: new Date().getFullYear()
      }
    };
    return await this.transporter.sendMail(mailOptions);
  }
}

module.exports = new HandlebarsEmailService();