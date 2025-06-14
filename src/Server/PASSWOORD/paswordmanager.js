// src/Server/PASSWORD/passwordManager.js
const bcrypt = require('bcrypt');
const { executeQuery } = require('../CONFIG/database');

class PasswordManager {
    constructor() {
        // Gebruik de bestaande database connectie uit je config
    }

    /**
     * Update user password using stored procedure
     */
    async updatePasswordWithHistory(gebruikersId, newPassword) {
        try {
            // Hash het nieuwe wachtwoord
            const newPasswordHash = await bcrypt.hash(newPassword, 12);
            
            console.log(`🔐 Updating password for user ${gebruikersId}`);
            
            // Roep de stored procedure aan
            const result = await executeQuery(
                'CALL UpdateUserPassword(?, ?)', 
                [gebruikersId, newPasswordHash]
            );
            
            console.log('✅ Password updated successfully with history tracking');
            return { 
                success: true, 
                message: 'Wachtwoord succesvol bijgewerkt' 
            };
        } catch (error) {
            console.error('❌ Password update error:', error);
            
            // Check for specific database errors
            if (error.code === 'ER_SP_DOES_NOT_EXIST') {
                return { 
                    success: false, 
                    message: 'Stored procedure niet gevonden. Gebruik fallback methode.' 
                };
            }
            
            return { 
                success: false, 
                message: 'Fout bij bijwerken wachtwoord' 
            };
        }
    }

    /**
     * Fallback method - update password without stored procedure
     */
    async updatePasswordFallback(gebruikersId, newPassword) {
        try {
            console.log(`🔄 Using fallback password update for user ${gebruikersId}`);
            
            // Haal oude password op
            const oldPasswordRows = await executeQuery(
                'SELECT passwoord_hash FROM LOGINBEHEER WHERE gebruikersId = ?',
                [gebruikersId]
            );
            
            if (oldPasswordRows.length === 0) {
                throw new Error('User not found');
            }
            
            const oldPasswordHash = oldPasswordRows[0].passwoord_hash;
            const newPasswordHash = await bcrypt.hash(newPassword, 12);
            
            // Check if password actually changed
            if (oldPasswordHash !== newPasswordHash) {
                // Voeg oude password toe aan history (als tabel bestaat)
                try {
                    await executeQuery(
                        'INSERT INTO PASSWORD_HISTORY (gebruikersId, password_hash) VALUES (?, ?)',
                        [gebruikersId, oldPasswordHash]
                    );
                    console.log('📝 Password history recorded');
                } catch (historyError) {
                    console.log('⚠️  Password history table not available, skipping history');
                }
                
                // Update het password
                await executeQuery(
                    `UPDATE LOGINBEHEER 
                     SET passwoord_hash = ?, 
                         password_changed_at = CURRENT_TIMESTAMP,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE gebruikersId = ?`,
                    [newPasswordHash, gebruikersId]
                );
            }
            
            console.log('✅ Password updated successfully (fallback method)');
            return { 
                success: true, 
                message: 'Wachtwoord succesvol bijgewerkt' 
            };
        } catch (error) {
            console.error('❌ Fallback password update error:', error);
            return { 
                success: false, 
                message: 'Fout bij bijwerken wachtwoord' 
            };
        }
    }

    /**
     * Verify current password
     */
    async verifyCurrentPassword(gebruikersId, currentPassword) {
        try {
            const rows = await executeQuery(
                'SELECT passwoord_hash FROM LOGINBEHEER WHERE gebruikersId = ?',
                [gebruikersId]
            );
            
            if (rows.length === 0) {
                return false;
            }
            
            return await bcrypt.compare(currentPassword, rows[0].passwoord_hash);
        } catch (error) {
            console.error('❌ Password verification error:', error);
            return false;
        }
    }

    /**
     * Get password history for user
     */
    async getPasswordHistory(gebruikersId, limit = 5) {
        try {
            const rows = await executeQuery(
                `SELECT password_hash, created_at 
                 FROM PASSWORD_HISTORY 
                 WHERE gebruikersId = ? 
                 ORDER BY created_at DESC 
                 LIMIT ?`,
                [gebruikersId, limit]
            );
            return rows;
        } catch (error) {
            console.error('❌ Get password history error:', error);
            return [];
        }
    }

    /**
     * Check if password was recently used
     */
    async checkPasswordReuse(gebruikersId, newPassword, historyLimit = 5) {
        try {
            const history = await this.getPasswordHistory(gebruikersId, historyLimit);
            
            for (const entry of history) {
                if (await bcrypt.compare(newPassword, entry.password_hash)) {
                    return true; // Password was al gebruikt
                }
            }
            return false;
        } catch (error) {
            console.error('❌ Check password reuse error:', error);
            return false; // Bij fout, sta password toe
        }
    }

    /**
     * Main password update method with automatic fallback
     */
    async updatePassword(gebruikersId, newPassword) {
        // Probeer eerst de stored procedure
        const result = await this.updatePasswordWithHistory(gebruikersId, newPassword);
        
        // Als stored procedure niet werkt, gebruik fallback
        if (!result.success && result.message.includes('Stored procedure')) {
            console.log('🔄 Stored procedure failed, using fallback method');
            return await this.updatePasswordFallback(gebruikersId, newPassword);
        }
        
        return result;
    }
}

module.exports = PasswordManager;