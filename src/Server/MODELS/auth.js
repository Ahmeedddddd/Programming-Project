//src/Server/MODELS/auth.js - Past bij jouw projectstructuur

const { pool } = require('../CONFIG/database');

// Import jouw bestaande password hasher
const {
  hashPassword,
  verifyPassword,
  authenticateUser,
  findUser,
  createUserCredentials,
  updatePassword
} = require('../PASSWOORD/CONFIG/passwordhasher');

class Auth {
  
  // 🔍 Find user by email (across all user types)
  static async findUserByEmail(email) {
    try {
      // Check in STUDENT table 
      const [students] = await pool.query(
        'SELECT studentnummer as id, email, "student" as userType FROM STUDENT WHERE email = ?',
        [email]
      );
      if (students.length > 0) return students[0];

      // Check in BEDRIJF table  
      const [bedrijven] = await pool.query(
        'SELECT bedrijfsnummer as id, email, "bedrijf" as userType FROM BEDRIJF WHERE email = ?',
        [email]
      );
      if (bedrijven.length > 0) return bedrijven[0];

      // Check in ORGANISATOR table
      const [organisators] = await pool.query(
        'SELECT organisatorId as id, email, "organisator" as userType FROM ORGANISATOR WHERE email = ?',
        [email]
      );
      if (organisators.length > 0) return organisators[0];

      return null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  // 🔐 Get login credentials (gebruik jouw authenticateUser)
  static async getLoginCredentials(email) {
    try {
      const user = await this.findUserByEmail(email);
      if (!user) return null;

      // Gebruik jouw findUser functie
      let userCredentials;
      
      if (user.userType === 'student') {
        userCredentials = await findUser('student', user.id);
      } else if (user.userType === 'bedrijf') {
        userCredentials = await findUser('bedrijf', user.id);
      } else if (user.userType === 'organisator') {
        userCredentials = await findUser('organisator', user.email);
      }

      if (userCredentials) {
        return {
          ...userCredentials,
          email: user.email,
          userType: user.userType,
          userId: user.id
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting login credentials:', error);
      throw error;
    }
  }

  // 📝 Register new student - aangepast voor jouw database schema
  static async registerStudent(studentData, password) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Create student record - using your exact schema
      const {
        studentnummer, voornaam, achternaam, email, gsm_nummer,
        opleiding, opleidingsrichting = '', projectTitel = '', projectBeschrijving = '',
        overMezelf = '', huisnummer = '', straatnaam = '', gemeente = '', postcode = '', bus = '', 
        evenementId = 1, leerjaar = 3, tafelNr = 1
      } = studentData;

      await connection.query(`
        INSERT INTO STUDENT (
          studentnummer, evenementId, voornaam, achternaam, email, gsm_nummer,
          opleiding, projectTitel, projectBeschrijving, opleidingsrichting,
          huisnummer, straatnaam, gemeente, postcode, bus, overMezelf,
          leerjaar, tafelNr
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        studentnummer, evenementId, voornaam, achternaam, email, gsm_nummer,
        opleiding, projectTitel, projectBeschrijving, opleidingsrichting,
        huisnummer, straatnaam, gemeente, postcode, bus, overMezelf,
        leerjaar, tafelNr
      ]);

      await connection.commit();
      
      // 2. Gebruik jouw createUserCredentials functie
      const credentialsResult = await createUserCredentials('student', studentnummer, password);
      
      if (!credentialsResult.success) {
        throw new Error(credentialsResult.message);
      }
      
      return {
        gebruikersId: credentialsResult.gebruikersId,
        userId: studentnummer,
        userType: 'student',
        email: email
      };

    } catch (error) {
      await connection.rollback();
      console.error('Error registering student:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // 🏢 Register new bedrijf - aangepast voor jouw database schema
  static async registerBedrijf(bedrijfData, password) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Create bedrijf record - using your exact schema
      const {
        naam, email, gsm_nummer, sector = '', TVA_nummer,
        huisnummer, straatnaam, gemeente, postcode, bus = '',
        land = 'België', tafelNr = 1, bechrijving = '' // Note: "bechrijving" typo in your schema
      } = bedrijfData;

      const [bedrijfResult] = await connection.query(`
        INSERT INTO BEDRIJF (
          TVA_nummer, naam, email, gsm_nummer, sector,
          huisnummer, straatnaam, gemeente, postcode, bus, land,
          tafelNr, bechrijving
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        TVA_nummer, naam, email, gsm_nummer, sector,
        huisnummer, straatnaam, gemeente, postcode, bus, land,
        tafelNr, bechrijving
      ]);

      const bedrijfsnummer = bedrijfResult.insertId;

      await connection.commit();
      
      // 2. Gebruik jouw createUserCredentials functie
      const credentialsResult = await createUserCredentials('bedrijf', bedrijfsnummer, password);
      
      if (!credentialsResult.success) {
        throw new Error(credentialsResult.message);
      }
      
      return {
        gebruikersId: credentialsResult.gebruikersId,
        userId: bedrijfsnummer,
        userType: 'bedrijf',
        email: email
      };

    } catch (error) {
      await connection.rollback();
      console.error('Error registering bedrijf:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // 👔 Register new organisator
  static async registerOrganisator(organisatorData, password) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Create organisator record first
      const { voornaam, achternaam, email } = organisatorData;

      const [orgResult] = await connection.query(`
        INSERT INTO ORGANISATOR (gebruikersId, voornaam, achternaam, email)
        VALUES (NULL, ?, ?, ?)
      `, [voornaam, achternaam, email]);

      const organisatorId = orgResult.insertId;

      await connection.commit();
      
      // 2. Gebruik jouw createUserCredentials functie voor organisator
      const credentialsResult = await createUserCredentials('organisator', email, password);
      
      if (!credentialsResult.success) {
        throw new Error(credentialsResult.message);
      }

      // 3. Update organisator record met gebruikersId
      await connection.query(
        'UPDATE ORGANISATOR SET gebruikersId = ? WHERE organisatorId = ?',
        [credentialsResult.gebruikersId, organisatorId]
      );
      
      return {
        gebruikersId: credentialsResult.gebruikersId,
        userId: organisatorId,
        userType: 'organisator',
        email: email
      };

    } catch (error) {
      await connection.rollback();
      console.error('Error registering organisator:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // 🔑 Verify password (gebruik jouw verifyPassword)
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await verifyPassword(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  // 🔄 Update password
  static async updatePassword(gebruikersId, newPassword) {
    try {
      const hashedPassword = await hashPassword(newPassword);
      
      const [result] = await pool.query(
        'UPDATE LOGINBEHEER SET passwoord_hash = ? WHERE gebruikersId = ?',
        [hashedPassword, gebruikersId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  // 🗑️ Delete user account
  static async deleteAccount(gebruikersId) {
    try {
      const [result] = await pool.query(
        'DELETE FROM LOGINBEHEER WHERE gebruikersId = ?',
        [gebruikersId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }
}

module.exports = Auth;