const helpers = {
    formatDate(date) {
      return new Date(date).toLocaleDateString('nl-NL');
    },
  
    formatDateTime(date) {
      return new Date(date).toLocaleString('nl-NL');
    },
  
    generateRandomId(length = 8) {
      return Math.random().toString(36).substring(2, length + 2);
    },
  
    calculateAge(birthDate) {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    },
  
    slugify(text) {
      return text
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
    }
  };
  
  module.exports = helpers;