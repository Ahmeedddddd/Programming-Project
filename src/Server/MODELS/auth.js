// src/Server/MODELS/auth.js

const { pool } = require('../CONFIG/database');

// Importeer het unified passwordManager-object
const { passwordManager } = require('../PASSWOORD/passwordManager');

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

  // 🔐 Get login credentials (gebruik jouw passwordManager.findUser)
  static async getLoginCredentials(email) {
    try {
      const user = await this.findUserByEmail(email);
      if (!user) return null;

      // Gebruik je unified passwordManager
      let userCredentials;
      if (user.userType === 'student') {
        userCredentials = await passwordManager.findUser('student', user.id);
      } else if (user.userType === 'bedrijf') {
        userCredentials = await passwordManager.findUser('bedrijf', user.id);
      } else if (user.userType === 'organisator') {
        userCredentials = await passwordManager.findUser('organisator', user.email);
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

  // 📝 Register new student - FIXED VERSION
  static async registerStudent(studentData, password) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const {
        voornaam, achternaam, email, gsm_nummer,
        opleiding, opleidingsrichting = '', projectTitel = '', projectBeschrijving = '',
        overMezelf = '', huisnummer = '', straatnaam = '', gemeente = '', postcode = '', bus = '', 
        evenementId = 1, leerjaar = 3, tafelNr = 1
      } = studentData;

      // 1. First insert the student record
      const [result] = await connection.query(`
        INSERT INTO STUDENT (
          evenementId, voornaam, achternaam, email, gsm_nummer,
          opleiding, projectTitel, projectBeschrijving, opleidingsrichting,
          huisnummer, straatnaam, gemeente, postcode, bus, overMezelf,
          leerjaar, tafelNr
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        evenementId, voornaam, achternaam, email, gsm_nummer,
        opleiding, projectTitel, projectBeschrijving, opleidingsrichting,
        huisnummer, straatnaam, gemeente, postcode, bus, overMezelf,
        leerjaar, tafelNr
      ]);

      const studentnummer = result.insertId;

      // 2. Hash the password
      const hashedPassword = await passwordManager.hashPassword(password);

      // 3. Insert into LOGINBEHEER using the SAME connection
      const [loginResult] = await connection.query(`
        INSERT INTO LOGINBEHEER (studentnummer, passwoord_hash, created_at, password_changed_at) 
        VALUES (?, ?, NOW(), NOW())
      `, [studentnummer, hashedPassword]);

      const gebruikersId = loginResult.insertId;

      // 4. Commit the transaction
      await connection.commit();
      
      console.log(`✅ Student registered successfully: ID ${studentnummer}, GebruikersId ${gebruikersId}`);
      
      return {
        gebruikersId: gebruikersId,
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

  // 🏢 Register new bedrijf - FIXED VERSION
  static async registerBedrijf(bedrijfData, password) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const {
        naam, email, gsm_nummer, sector = '', TVA_nummer,
        huisnummer, straatnaam, gemeente, postcode, bus = '',
        land = 'België', tafelNr = 1, bechrijving = ''
      } = bedrijfData;

      // 1. First insert the bedrijf record
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

      // 2. Hash the password
      const hashedPassword = await passwordManager.hashPassword(password);

      // 3. Insert into LOGINBEHEER using the SAME connection
      const [loginResult] = await connection.query(`
        INSERT INTO LOGINBEHEER (bedrijfsnummer, passwoord_hash, created_at, password_changed_at) 
        VALUES (?, ?, NOW(), NOW())
      `, [bedrijfsnummer, hashedPassword]);

      const gebruikersId = loginResult.insertId;

      // 4. Commit the transaction
      await connection.commit();
      
      console.log(`✅ Bedrijf registered successfully: ID ${bedrijfsnummer}, GebruikersId ${gebruikersId}`);
      
      return {
        gebruikersId: gebruikersId,
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

  // 👔 Register new organisator - FIXED VERSION
  static async registerOrganisator(organisatorData, password) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { voornaam, achternaam, email } = organisatorData;

      // 1. Hash the password first
      const hashedPassword = await passwordManager.hashPassword(password);

      // 2. Insert into LOGINBEHEER first (since organisator references it)
      const [loginResult] = await connection.query(`
        INSERT INTO LOGINBEHEER (passwoord_hash, created_at, password_changed_at) 
        VALUES (?, NOW(), NOW())
      `, [hashedPassword]);

      const gebruikersId = loginResult.insertId;

      // 3. Insert the organisator record with the gebruikersId
      const [orgResult] = await connection.query(`
        INSERT INTO ORGANISATOR (gebruikersId, voornaam, achternaam, email)
        VALUES (?, ?, ?, ?)
      `, [gebruikersId, voornaam, achternaam, email]);

      const organisatorId = orgResult.insertId;

      // 4. Commit the transaction
      await connection.commit();
      
      console.log(`✅ Organisator registered successfully: ID ${organisatorId}, GebruikersId ${gebruikersId}`);
      
      return {
        gebruikersId: gebruikersId,
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

  // 🔑 Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await passwordManager.verifyPassword(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  // 🔄 Update password
  static async updatePassword(gebruikersId, newPassword) {
    try {
      const hashedPassword = await passwordManager.hashPassword(newPassword);
      const [result] = await pool.query(
        'UPDATE LOGINBEHEER SET passwoord_hash = ?, password_changed_at = NOW() WHERE gebruikersId = ?',
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