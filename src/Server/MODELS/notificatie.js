const { pool } = require('../CONFIG/database');

class Notificatie {
  // CREATE
  static async create({ studentnummer = null, bedrijfsnummer = null, type, boodschap }) {
    const [result] = await pool.query(
      `INSERT INTO NOTIFICATIE (studentnummer, bedrijfsnummer, type, boodschap) VALUES (?, ?, ?, ?)`,
      [studentnummer, bedrijfsnummer, type, boodschap]
    );
    return result.insertId;
  }

  // READ: alle notificaties voor een student of bedrijf
  static async getAllForUser({ studentnummer = null, bedrijfsnummer = null }) {
    let query = 'SELECT * FROM NOTIFICATIE WHERE ';
    let params = [];
    if (studentnummer) {
      query += 'studentnummer = ?';
      params.push(studentnummer);
    } else if (bedrijfsnummer) {
      query += 'bedrijfsnummer = ?';
      params.push(bedrijfsnummer);
    } else {
      throw new Error('studentnummer of bedrijfsnummer vereist');
    }
    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  // READ: ongelezen notificaties
  static async getUnreadForUser({ studentnummer = null, bedrijfsnummer = null }) {
    let query = 'SELECT * FROM NOTIFICATIE WHERE is_gelezen = 0 AND ';
    let params = [];
    if (studentnummer) {
      query += 'studentnummer = ?';
      params.push(studentnummer);
    } else if (bedrijfsnummer) {
      query += 'bedrijfsnummer = ?';
      params.push(bedrijfsnummer);
    } else {
      throw new Error('studentnummer of bedrijfsnummer vereist');
    }
    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  // UPDATE: markeer als gelezen
  static async markAsRead(notificatieId) {
    const [result] = await pool.query(
      'UPDATE NOTIFICATIE SET is_gelezen = 1 WHERE notificatieId = ?',
      [notificatieId]
    );
    return result.affectedRows;
  }

  // UPDATE: markeer alle als gelezen voor gebruiker
  static async markAllAsRead({ studentnummer = null, bedrijfsnummer = null }) {
    let query = 'UPDATE NOTIFICATIE SET is_gelezen = 1 WHERE ';
    let params = [];
    if (studentnummer) {
      query += 'studentnummer = ?';
      params.push(studentnummer);
    } else if (bedrijfsnummer) {
      query += 'bedrijfsnummer = ?';
      params.push(bedrijfsnummer);
    } else {
      throw new Error('studentnummer of bedrijfsnummer vereist');
    }
    const [result] = await pool.query(query, params);
    return result.affectedRows;
  }

  // DELETE: verwijder notificatie
  static async delete(notificatieId) {
    const [result] = await pool.query(
      'DELETE FROM NOTIFICATIE WHERE notificatieId = ?',
      [notificatieId]
    );
    return result.affectedRows;
  }
}

module.exports = Notificatie; 