//Server/PASSWOORD/CONFIG/passwordhasher.js
// Wachtwoord hashing en verificatie systeem voor CareerLaunch

const bcrypt = require('bcrypt');
const { executeQuery } = require('../../CONFIG/database');
// Configuratie
const SALT_ROUNDS = 12; // Verhoogd voor betere security
const MIN_PASSWORD_LENGTH = 8;

// PASSWORD HASHING FUNCTIES

/**
 * Hash een wachtwoord met bcrypt
 * @param {string} plainPassword - Het plain text wachtwoord
 * @returns {Promise<string>} - De gehashte wachtwoord string
 */
async function hashPassword(plainPassword) {
  try {
    if (!plainPassword || plainPassword.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`Wachtwoord moet minimaal ${MIN_PASSWORD_LENGTH} karakters lang zijn`);
    }
    
    const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
    return hash;
  } catch (error) {
    console.error('Error hashing password:', error.message);
    throw new Error('Fout bij hashen van wachtwoord');
  }
}

/**
 * Vergelijk een plain text wachtwoord met een hash
 * @param {string} plainPassword - Het plain text wachtwoord
 * @param {string} hashedPassword - De gehashte wachtwoord uit database
 * @returns {Promise<boolean>} - True als wachtwoord correct is
 */
async function verifyPassword(plainPassword, hashedPassword) {
  try {
    if (!plainPassword || !hashedPassword) {
      return false;
    }
    
    const isValid = await bcrypt.compare(plainPassword, hashedPassword);
    return isValid;
  } catch (error) {
    console.error('Error verifying password:', error.message);
    return false;
  }
}

// =========================
// DATABASE INTEGRATIE FUNCTIES
// =========================

/**
 * Zoek gebruiker in LOGINBEHEER tabel op basis van type en ID
 * @param {string} userType - 'organisator', 'bedrijf', of 'student'
 * @param {string|number} identifier - Het ID van de gebruiker
 * @returns {Promise<object|null>} - Gebruiker object of null
 */
async function findUser(userType, identifier) {
  try {
    let query;
    let params;
    
    switch(userType.toLowerCase()) {
      case 'organisator':
        // Voor organisatoren: beide NULL en dan ORGANISATOR tabel joinen
        query = `
          SELECT l.gebruikersId, l.passwoord_hash, o.organisatorId, o.voornaam, o.achternaam, o.email
          FROM LOGINBEHEER l 
          INNER JOIN ORGANISATOR o ON l.gebruikersId = o.gebruikersId
          WHERE o.email = ? AND l.bedrijfsnummer IS NULL AND l.studentnummer IS NULL
        `;
        params = [identifier];
        break;
        
      case 'bedrijf':
        query = `
          SELECT l.gebruikersId, l.bedrijfsnummer, l.passwoord_hash, b.naam, b.email
          FROM LOGINBEHEER l 
          INNER JOIN BEDRIJF b ON l.bedrijfsnummer = b.bedrijfsnummer
          WHERE l.bedrijfsnummer = ? AND l.studentnummer IS NULL
        `;
        params = [identifier];
        break;
        
      case 'student':
        query = `
          SELECT l.gebruikersId, l.studentnummer, l.passwoord_hash, s.voornaam, s.achternaam, s.email
          FROM LOGINBEHEER l 
          INNER JOIN STUDENT s ON l.studentnummer = s.studentnummer
          WHERE l.studentnummer = ? AND l.bedrijfsnummer IS NULL
        `;
        params = [identifier];
        break;
        
      default:
        throw new Error('Ongeldig gebruikerstype');
    }
    
    const results = await executeQuery(query, params);
    return results.length > 0 ? results[0] : null;
    
  } catch (error) {
    console.error('Error finding user:', error.message);
    throw new Error('Fout bij zoeken gebruiker');
  }
}

/**
 * Authenticeer een gebruiker
 * @param {string} userType - 'organisator', 'bedrijf', of 'student'
 * @param {string|number} identifier - Email (organisator) of ID (bedrijf/student)
 * @param {string} plainPassword - Het ingevoerde wachtwoord
 * @returns {Promise<object>} - Authenticatie resultaat
 */
async function authenticateUser(userType, identifier, plainPassword) {
  try {
    // Input validatie
    if (!userType || !identifier || !plainPassword) {
      return {
        success: false,
        message: 'Alle velden zijn verplicht'
      };
    }
    
    // Zoek gebruiker
    const user = await findUser(userType, identifier);
    if (!user) {
      return {
        success: false,
        message: 'Gebruiker niet gevonden'
      };
    }
    
    // Verificeer wachtwoord
    const isValidPassword = await verifyPassword(plainPassword, user.passwoord_hash);
    if (!isValidPassword) {
      return {
        success: false,
        message: 'Onjuist wachtwoord'
      };
    }
    
    // Succesvol - return user data zonder wachtwoord hash
    const userData = { ...user };
    delete userData.passwoord_hash;
    
    return {
      success: true,
      message: 'Login succesvol',
      user: userData,
      userType: userType
    };
    
  } catch (error) {
    console.error('Authentication error:', error.message);
    return {
      success: false,
      message: 'Er is een fout opgetreden bij het inloggen'
    };
  }
}

/**
 * Maak nieuwe gebruiker aan in LOGINBEHEER tabel
 * @param {string} userType - 'organisator', 'bedrijf', of 'student'
 * @param {string|number} identifier - Het ID van de gebruiker
 * @param {string} plainPassword - Het nieuwe wachtwoord
 * @returns {Promise<object>} - Registratie resultaat
 */
async function createUserCredentials(userType, identifier, plainPassword) {
  try {
    // Validatie
    if (!userType || !identifier || !plainPassword) {
      return {
        success: false,
        message: 'Alle velden zijn verplicht'
      };
    }
    
    if (plainPassword.length < MIN_PASSWORD_LENGTH) {
      return {
        success: false,
        message: `Wachtwoord moet minimaal ${MIN_PASSWORD_LENGTH} karakters lang zijn`
      };
    }
    
    // Check of gebruiker al bestaat
    const existingUser = await findUser(userType, identifier);
    if (existingUser) {
      return {
        success: false,
        message: 'Gebruiker heeft al login credentials'
      };
    }
    
    // Hash wachtwoord
    const hashedPassword = await hashPassword(plainPassword);
    
    // Insert in database
    let query;
    let params;
    
    switch(userType.toLowerCase()) {
      case 'organisator':
        // Voor organisatoren: eerst login record, dan organisator record
        query = 'INSERT INTO LOGINBEHEER (bedrijfsnummer, studentnummer, passwoord_hash) VALUES (NULL, NULL, ?)';
        params = [hashedPassword];
        break;
        
      case 'bedrijf':
        query = 'INSERT INTO LOGINBEHEER (bedrijfsnummer, studentnummer, passwoord_hash) VALUES (?, NULL, ?)';
        params = [identifier, hashedPassword];
        break;
        
      case 'student':
        query = 'INSERT INTO LOGINBEHEER (bedrijfsnummer, studentnummer, passwoord_hash) VALUES (NULL, ?, ?)';
        params = [identifier, hashedPassword];
        break;
        
      default:
        throw new Error('Ongeldig gebruikerstype');
    }
    
    const result = await executeQuery(query, params);
    
    return {
      success: true,
      message: 'Gebruiker credentials succesvol aangemaakt',
      gebruikersId: result.insertId
    };
    
  } catch (error) {
    console.error('Error creating user credentials:', error.message);
    return {
      success: false,
      message: 'Fout bij aanmaken gebruiker credentials'
    };
  }
}

/**
 * Update wachtwoord voor bestaande gebruiker
 * @param {string} userType - 'organisator', 'bedrijf', of 'student'
 * @param {string|number} identifier - Het ID van de gebruiker
 * @param {string} oldPassword - Het huidige wachtwoord
 * @param {string} newPassword - Het nieuwe wachtwoord
 * @returns {Promise<object>} - Update resultaat
 */
async function updatePassword(userType, identifier, oldPassword, newPassword) {
  try {
    // Validatie
    if (!userType || !identifier || !oldPassword || !newPassword) {
      return {
        success: false,
        message: 'Alle velden zijn verplicht'
      };
    }
    
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return {
        success: false,
        message: `Nieuw wachtwoord moet minimaal ${MIN_PASSWORD_LENGTH} karakters lang zijn`
      };
    }
    
    // Authenticeer eerst met oude wachtwoord
    const authResult = await authenticateUser(userType, identifier, oldPassword);
    if (!authResult.success) {
      return {
        success: false,
        message: 'Huidig wachtwoord is onjuist'
      };
    }
    
    // Hash nieuw wachtwoord
    const hashedPassword = await hashPassword(newPassword);
    
    // Update in database
    const query = 'UPDATE LOGINBEHEER SET passwoord_hash = ? WHERE gebruikersId = ?';
    await executeQuery(query, [hashedPassword, authResult.user.gebruikersId]);
    
    return {
      success: true,
      message: 'Wachtwoord succesvol gewijzigd'
    };
    
  } catch (error) {
    console.error('Error updating password:', error.message);
    return {
      success: false,
      message: 'Fout bij wijzigen wachtwoord'
    };
  }
}

// =========================
// BATCH OPERATIONS (voor migratie/setup)
// =========================

/**
 * Hash alle bestaande plain text wachtwoorden in database
 * GEBRUIK DIT ALLEEN VOOR MIGRATIE!
 */
async function hashExistingPasswords() {
  try {
    console.log('🔒 Starting password hashing migration...');
    
    // Haal alle users op die plain text passwords hebben
    const query = `
      SELECT gebruikersId, passwoord_hash 
      FROM LOGINBEHEER 
      WHERE LENGTH(passwoord_hash) < 50  -- bcrypt hashes zijn ~60 karakters
    `;
    
    const users = await executeQuery(query);
    console.log(`Found ${users.length} users with plain text passwords`);
    
    let success = 0;
    let errors = 0;
    
    for (const user of users) {
      try {
        const hashedPassword = await hashPassword(user.passwoord_hash);
        
        await executeQuery(
          'UPDATE LOGINBEHEER SET passwoord_hash = ? WHERE gebruikersId = ?',
          [hashedPassword, user.gebruikersId]
        );
        
        console.log(`✅ User ID ${user.gebruikersId} password hashed`);
        success++;
        
      } catch (error) {
        console.error(`❌ Error hashing password for user ${user.gebruikersId}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n📊 Migration complete: ${success} success, ${errors} errors`);
    return { success, errors };
    
  } catch (error) {
    console.error('Migration error:', error.message);
    throw error;
  }
}

// =========================
// UTILITY FUNCTIES
// =========================

/**
 * Genereer een sterk wachtwoord
 * @param {number} length - Lengte van het wachtwoord (default 12)
 * @returns {string} - Gegenereerd wachtwoord
 */
function generateStrongPassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
}

/**
 * Valideer wachtwoord sterkte
 * @param {string} password - Het te valideren wachtwoord
 * @returns {object} - Validatie resultaat
 */
function validatePasswordStrength(password) {
  const requirements = {
    minLength: password.length >= MIN_PASSWORD_LENGTH,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const score = Object.values(requirements).filter(Boolean).length;
  
  return {
    isValid: requirements.minLength && score >= 3,
    score: score,
    requirements: requirements,
    message: score < 3 ? 'Wachtwoord is te zwak' : score === 5 ? 'Zeer sterk wachtwoord' : 'Goed wachtwoord'
  };
}

// =========================
// EXPORT
// =========================

module.exports = {
  // Core functies
  hashPassword,
  verifyPassword,
  authenticateUser,
  createUserCredentials,
  updatePassword,
  findUser,
  
  // Utility functies
  generateStrongPassword,
  validatePasswordStrength,
  
  // Migration functie
  hashExistingPasswords,
  
  // Constants
  SALT_ROUNDS,
  MIN_PASSWORD_LENGTH
};