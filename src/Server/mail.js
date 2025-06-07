// src/server/mail.js
// Deze module is verantwoordelijk voor het verzenden van e-mails met facturen
// Zorg ervoor dat je de juiste modules hebt geïnstalleerd:
// npm install nodemailer nodemailer-express-handlebars express-handlebars

const nodemailer = require('nodemailer');
const hbsModule = require('nodemailer-express-handlebars');
const hbs = typeof hbsModule === 'function' ? hbsModule : hbsModule.default;
const path = require('path');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'tom1dekoning@gmail.com',
    pass: 'arltbzxupcdcqowf'
  }
});

const handlebarOptions = {
  viewEngine: {
    extname: '.handlebars',
    partialsDir: path.resolve(__dirname, '../templates/'),
    layoutsDir: path.resolve(__dirname, '../templates/'),
    defaultLayout: false
  },
  viewPath: path.resolve(__dirname, '../templates/'),
  extName: '.handlebars'
};

transporter.use('compile', hbs(handlebarOptions));

async function sendInvoice(data) {
  const mailOptions = {
    from: '"CareerLaunch" <tom1dekoning@gmail.com>',
    to: data.email,
    subject: 'Je factuur voor CareerLaunch',
    template: 'invoice',
    context: data
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendInvoice };
