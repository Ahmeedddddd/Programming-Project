//src/Server/SERVICES/checkVATServ.js

const key_id = "D4lpbv7LaT7e"; // Jouw key_id
const key = "ZpX7MQkepQYv";       // Jouw key

class VATService {
  
  /**
   * Valideer VAT nummer via VIES API (gebaseerd op jouw originele code)
   * @param {string} vatNumber - Het BTW-nummer (bijvoorbeeld: "BE0123456789")
   * @returns {Promise<object>} - Validatie resultaat
   */
  static async validateVATNumber(vatNumber) {
    try {
      // Input sanitization
      const cleanVAT = this.sanitizeVATNumber(vatNumber);
      
      if (!this.isValidFormat(cleanVAT)) {
        return {
          isValid: false,
          error: 'Invalid VAT number format',
          message: 'VAT nummer heeft een ongeldig formaat',
          vatNumber: cleanVAT
        };
      }

      console.log(`🔍 Validating VAT number: ${cleanVAT}`);

      // URL voor VIES API endpoint (jouw originele aanpak)
      const url = `https://${key_id}:${key}@viesapi.eu/api/get/vies/euvat/${cleanVAT}`;
      
      // Jouw originele fetch code, maar dan als Promise
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('VAT API Response:', data);
      
      // Process de response
      return this.processVATResponse(data, cleanVAT);
      
    } catch (error) {
      console.error('VAT validation error:', error);
      
      // Fallback naar format validatie als API faalt
      return this.fallbackValidation(vatNumber);
    }
  }

  /**
   * Process VAT API response
   */
  static processVATResponse(data, vatNumber) {
    // data.valid === true betekent dat het BTW-nummer bestaat en klopt
    if (data.valid === true) {
      return {
        isValid: true,
        vatNumber: vatNumber,
        companyName: data.company_name || null,
        companyAddress: data.company_address || null,
        countryCode: data.country_code || null,
        message: 'VAT nummer is geldig en bestaat',
        apiResponse: data
      };
    } else {
      return {
        isValid: false,
        vatNumber: vatNumber,
        error: 'VAT number not found',
        message: 'VAT nummer bestaat niet of is niet geldig',
        apiResponse: data
      };
    }
  }

  /**
   * Sanitize VAT nummer input
   */
  static sanitizeVATNumber(vatNumber) {
    if (!vatNumber) return '';
    
    return vatNumber
      .toString()
      .toUpperCase()
      .replace(/[\s\-\.]/g, '') // Remove spaces, hyphens, dots
      .trim();
  }

  /**
   * Basic format validatie voor EU VAT nummers
   */
  static isValidFormat(vatNumber) {
    // EU VAT patterns
    const patterns = {
      'BE': /^BE[0-9]{10}$/,           // België (jouw gebruik)
      'NL': /^NL[0-9]{9}B[0-9]{2}$/,   // Nederland  
      'DE': /^DE[0-9]{9}$/,            // Duitsland
      'FR': /^FR[0-9A-Z]{2}[0-9]{9}$/, // Frankrijk
      'GB': /^GB[0-9]{9}$|^GB[0-9]{12}$/, // UK
      'IT': /^IT[0-9]{11}$/,           // Italië
      'ES': /^ES[0-9A-Z][0-9]{7}[0-9A-Z]$/, // Spanje
      'PL': /^PL[0-9]{10}$/            // Polen
    };

    const countryCode = vatNumber.substring(0, 2);
    const pattern = patterns[countryCode];
    
    return pattern ? pattern.test(vatNumber) : false;
  }

  /**
   * Fallback validatie als API niet werkt
   */
  static fallbackValidation(vatNumber) {
    const cleanVAT = this.sanitizeVATNumber(vatNumber);
    
    return {
      isValid: this.isValidFormat(cleanVAT),
      vatNumber: cleanVAT,
      message: this.isValidFormat(cleanVAT) 
        ? 'VAT nummer heeft correct formaat (niet geverifieerd via externe service)'
        : 'VAT nummer heeft incorrect formaat',
      fallback: true
    };
  }

  /**
   * Belgische VAT checksum validatie (extra security voor BE nummers)
   */
  static validateBelgianChecksum(vatNumber) {
    const cleanVAT = this.sanitizeVATNumber(vatNumber);
    
    if (!cleanVAT.startsWith('BE') || cleanVAT.length !== 12) {
      return false;
    }

    const digits = cleanVAT.substring(2); // Remove "BE"
    const baseNumber = parseInt(digits.substring(0, 8));
    const checkDigits = parseInt(digits.substring(8, 10));
    
    const calculatedCheck = 97 - (baseNumber % 97);
    
    return calculatedCheck === checkDigits;
  }

  /**
   * Quick VAT check (voor frontend gebruik)
   */
  static async quickValidate(vatNumber) {
    try {
      const result = await this.validateVATNumber(vatNumber);
      return {
        isValid: result.isValid,
        companyName: result.companyName,
        message: result.message
      };
    } catch (error) {
      return {
        isValid: false,
        message: 'VAT validatie mislukt'
      };
    }
  }

  /**
   * Batch validatie voor meerdere VAT nummers
   */
  static async validateMultiple(vatNumbers) {
    const results = [];
    
    for (const vatNumber of vatNumbers) {
      const result = await this.validateVATNumber(vatNumber);
      results.push(result);
      
      // Rate limiting: wacht tussen requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results;
  }
}

/**
 * Backwards compatibility - behoud jouw originele functie signatuur
 */
function getVATNumber() {
  // Deze functie kun je implementeren om VAT number op te halen
  // Voor nu return een voorbeeld
  return "BE0123456789";
}

/**
 * Jouw originele code als standalone functie (voor backwards compatibility)
 */
async function checkVAT(vatNumber) {
  const url = `https://${key_id}:${key}@viesapi.eu/api/get/vies/euvat/${vatNumber}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(data);
    // data.valid === true betekent dat het BTW-nummer bestaat en klopt
    return data;
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Export voor gebruik in andere bestanden
module.exports = {
  VATService,
  checkVAT,           // Jouw originele functie
  getVATNumber,       // Helper functie
  
  // Main functie voor gebruik in authController
  validateVATNumber: VATService.validateVATNumber.bind(VATService),
  quickValidate: VATService.quickValidate.bind(VATService)
};

// Als dit bestand direct wordt uitgevoerd (jouw originele gebruik)
if (require.main === module) {
  const vatNumber = getVATNumber();
  checkVAT(vatNumber)
    .then(data => {
      console.log('VAT validation result:', data);
    })
    .catch(error => {
      console.error('VAT validation failed:', error);
    });
}