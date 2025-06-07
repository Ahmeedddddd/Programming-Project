const nodemailer = require('nodemailer');
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

(async () => {
  const hbsModule = await import('nodemailer-express-handlebars');
  const hbs = hbsModule.default;
  transporter.use('compile', hbs(handlebarOptions));
})();

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
