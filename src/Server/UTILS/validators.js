const validators = {
    isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },
  
    isValidPhoneNumber(phone) {
      const phoneRegex = /^(\+32|0)[1-9][0-9]{7,8}$/;
      return phoneRegex.test(phone);
    },
  
    isValidStudentNumber(studentnummer) {
      const studentRegex = /^S\d{8}$/;
      return studentRegex.test(studentnummer);
    },
  
    isValidTVANumber(tva) {
      const tvaRegex = /^[A-Z]{2}\d{9,12}$/;
      return tvaRegex.test(tva);
    },
  
    sanitizeInput(input) {
      if (typeof input !== 'string') return input;
      return input.trim().replace(/[<>]/g, '');
    }
  };
  
  module.exports = validators;