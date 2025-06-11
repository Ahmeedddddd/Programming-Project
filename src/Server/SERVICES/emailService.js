const nodemailer = require('nodemailer');
const config = require('../CONFIG/config');

const transporter = nodemailer.createTransporter({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: {
    user: config.email.user,
    pass: config.email.password
  }
});

const emailService = {
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

    return await transporter.sendMail(mailOptions);
  },

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

    return await transporter.sendMail(mailOptions);
  },

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

    return await transporter.sendMail(mailOptions);
  }
};

module.exports = emailService;