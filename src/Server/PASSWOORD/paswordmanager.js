// src/Server/PASSWORD/passwordManager.js
const bcrypt = require('bcrypt');

class PasswordManager {
    constructor(dbConnection) {
        this.db = dbConnection;
    }

    async updatePassword(gebruikersId, newPassword) {
        try {
            const newPasswordHash = await bcrypt.hash(newPassword, 12);
            
            // Roep de stored procedure aan
            const [result] = await this.db.execute(
                'CALL UpdateUserPassword(?, ?)', 
                [gebruikersId, newPasswordHash]
            );
            
            return { success: true, message: 'Wachtwoord succesvol bijgewerkt' };
        } catch (error) {
            console.error('Password update error:', error);
            return { success: false, message: 'Fout bij bijwerken wachtwoord' };
        }
    }

    // ... rest van de methods
}

module.exports = PasswordManager;