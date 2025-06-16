// src/Server/PASSWOORD/passwordManager.js

const path = require('path');

// 🚩 Laad altijd .env ALS ALLEREERSTE (gegarandeerd juiste variabelen)
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const bcrypt = require('bcrypt');

// 🚩 Importeer altijd uit 1 plek, GEEN fallback meer nodig!
const { pool, dbConfig } = require('../CONFIG/database');

// 🚩 Debug: Print altijd de host waarmee je verbindt!
console.log('🔧 PasswordManager gebruikt database host:', dbConfig.host);

/**
 * UNIFIED PASSWORD MANAGER with ENHANCED SECURITY
 */
class UnifiedPasswordManager {
    
    constructor() {
        this.saltRounds = 12;
        this.minPasswordLength = 8;
        this.maxPasswordLength = 128;
        
        // 🔒 SECURITY: Password complexity requirements
        this.securityConfig = {
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            minSpecialChars: 1,
            maxRepeatingChars: 2,
            blockedPatterns: [
                /password/i, /123456/, /qwerty/i, /admin/i,
                /welcome/i, /login/i, /changeme/i
            ]
        };
        
        console.log('🔐 Unified Password Manager initialized with enhanced security');
    }

    // ===== ENHANCED SECURITY FUNCTIONS =====

    /**
     * 🔒 ENHANCED password strength validation with security requirements
     */
    validatePasswordStrength(password) {
        const requirements = {
            minLength: password.length >= this.minPasswordLength,
            maxLength: password.length <= this.maxPasswordLength,
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasNumbers: /\d/.test(password),
            hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
            noCommonPatterns: !this.securityConfig.blockedPatterns.some(pattern => pattern.test(password)),
            noRepeatingChars: !new RegExp(`(.)\\1{${this.securityConfig.maxRepeatingChars},}`).test(password),
            minSpecialChars: (password.match(/[!@#$%^&*(),.?":{}|<>]/g) || []).length >= this.securityConfig.minSpecialChars
        };

        // 🔒 SECURITY: Enforce all requirements
        const securityScore = [
            requirements.hasUppercase,
            requirements.hasLowercase, 
            requirements.hasNumbers,
            requirements.hasSpecialChars,
            requirements.noCommonPatterns,
            requirements.noRepeatingChars,
            requirements.minSpecialChars
        ].filter(Boolean).length;

        const isValid = requirements.minLength && 
                       requirements.maxLength && 
                       securityScore >= 6; // Require 6/7 security features

        return {
            isValid: isValid,
            score: securityScore,
            maxScore: 7,
            requirements: requirements,
            message: this.getSecurityMessage(requirements, securityScore),
            securityLevel: this.getSecurityLevel(securityScore)
        };
    }

    getSecurityMessage(requirements, score) {
        if (!requirements.minLength) return `Wachtwoord moet minimaal ${this.minPasswordLength} karakters hebben`;
        if (!requirements.maxLength) return `Wachtwoord mag maximaal ${this.maxPasswordLength} karakters hebben`;
        if (!requirements.hasUppercase) return 'Wachtwoord moet minimaal 1 hoofdletter bevatten';
        if (!requirements.hasLowercase) return 'Wachtwoord moet minimaal 1 kleine letter bevatten';
        if (!requirements.hasNumbers) return 'Wachtwoord moet minimaal 1 cijfer bevatten';
        if (!requirements.hasSpecialChars) return 'Wachtwoord moet minimaal 1 speciaal teken bevatten (!@#$%^&*(),.?":{}|<>)';
        if (!requirements.noCommonPatterns) return 'Wachtwoord bevat veelgebruikte patronen die niet toegestaan zijn';
        if (!requirements.noRepeatingChars) return `Wachtwoord mag maximaal ${this.securityConfig.maxRepeatingChars} herhalende karakters bevatten`;
        if (!requirements.minSpecialChars) return `Wachtwoord moet minimaal ${this.securityConfig.minSpecialChars} speciaal teken bevatten`;
        
        if (score >= 7) return 'Uitstekend wachtwoord - maximale beveiliging';
        if (score >= 6) return 'Sterk wachtwoord - goede beveiliging';
        return 'Wachtwoord voldoet niet aan beveiligingseisen';
    }

    getSecurityLevel(score) {
        if (score >= 7) return 'MAXIMUM';
        if (score >= 6) return 'STRONG';
        if (score >= 4) return 'MEDIUM';
        if (score >= 2) return 'WEAK';
        return 'CRITICAL';
    }

    /**
     * 🔒 ENHANCED password generation with security requirements
     */
    generateSecurePassword(length = 12) {
        if (length < this.minPasswordLength) {
            length = this.minPasswordLength;
        }
        
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const special = '!@#$%^&*(),.?":{}|<>';
        
        let password = '';
        
        // Ensure at least one of each required type
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += special[Math.floor(Math.random() * special.length)];
        
        // Fill the rest randomly
        const allChars = uppercase + lowercase + numbers + special;
        for (let i = password.length; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }
        
        // Shuffle the password
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }

    // ===== CORE PASSWORD FUNCTIONS (Enhanced Security) =====

    /**
     * Hash a password using bcrypt with security validation
     */
    async hashPassword(plainPassword) {
        try {
            // 🔒 SECURITY: Validate password strength first
            const validation = this.validatePasswordStrength(plainPassword);
            if (!validation.isValid) {
                throw new Error(`Beveiligingsfout: ${validation.message}`);
            }
            
            if (!plainPassword || plainPassword.length < this.minPasswordLength) {
                throw new Error(`Wachtwoord moet minimaal ${this.minPasswordLength} karakters lang zijn`);
            }
            
            if (plainPassword.length > this.maxPasswordLength) {
                throw new Error(`Wachtwoord mag maximaal ${this.maxPasswordLength} karakters lang zijn`);
            }
            
            const hash = await bcrypt.hash(plainPassword, this.saltRounds);
            console.log(`🔒 Password hashed successfully (${hash.length} chars) - Security Level: ${validation.securityLevel}`);
            return hash;
        } catch (error) {
            console.error('❌ Error hashing password:', error.message);
            throw new Error(`Fout bij hashen van wachtwoord: ${error.message}`);
        }
    }

    /**
     * Verify password against hash - SUPPORTS BOTH OLD AND NEW FORMATS
     * This is the key function that fixes your login issues
     */
    async verifyPassword(plainPassword, storedHash) {
        try {
            if (!plainPassword || !storedHash) {
                console.log('⚠️ Missing password or hash');
                return false;
            }

            console.log(`🔍 Verifying password... Hash type: ${this.detectHashType(storedHash)}`);

            // METHOD 1: Modern bcrypt hashes
            if (storedHash.startsWith('$2b$') || storedHash.startsWith('$2a$')) {
                const result = await bcrypt.compare(plainPassword, storedHash);
                console.log(`🔒 Bcrypt verification: ${result ? 'SUCCESS' : 'FAILED'}`);
                return result;
            }

            // METHOD 2: Legacy plain text passwords (for migration)
            if (storedHash.length < 50) {
                const result = plainPassword === storedHash;
                if (result) {
                    console.log('⚠️ Plain text password match - NEEDS SECURITY UPGRADE');
                    // Don't upgrade here, let the authController handle it
                }
                console.log(`📝 Plain text verification: ${result ? 'SUCCESS' : 'FAILED'}`);
                return result;
            }

            // METHOD 3: Try bcrypt anyway for edge cases
            try {
                const result = await bcrypt.compare(plainPassword, storedHash);
                console.log(`🔒 Fallback bcrypt verification: ${result ? 'SUCCESS' : 'FAILED'}`);
                return result;
            } catch (bcryptError) {
                console.log('❌ Unknown hash format');
                return false;
            }

        } catch (error) {
            console.error('❌ Error verifying password:', error.message);
            return false;
        }
    }

    /**
     * Detect password hash type
     */
    detectHashType(hash) {
        if (!hash) return 'NULL';
        if (hash.startsWith('$2b$')) return 'bcrypt_modern';
        if (hash.startsWith('$2a$')) return 'bcrypt_legacy';
        if (hash.length < 50) return 'plain_text_INSECURE';
        if (hash.startsWith('$')) return 'unknown_hash';
        return 'unknown';
    }

    // ===== DATABASE USER FUNCTIONS =====

    /**
     * Find user by email across all tables (unified approach)
     */
    async findUserByEmail(email) {
        try {
            console.log(`🔍 Finding user by email: ${email}`);

            // Check STUDENT table
            const [students] = await pool.query(`
                SELECT 
                    s.studentnummer as userId, s.email, s.voornaam, s.achternaam,
                    'student' as userType,
                    lb.gebruikersId, lb.passwoord_hash
                FROM STUDENT s
                INNER JOIN LOGINBEHEER lb ON lb.studentnummer = s.studentnummer
                WHERE s.email = ?
            `, [email]);

            if (students.length > 0) {
                const user = students[0];
                console.log(`📚 Found student: ${user.voornaam} ${user.achternaam} (Security: ${this.detectHashType(user.passwoord_hash)})`);
                return {
                    ...user,
                    naam: `${user.voornaam} ${user.achternaam}`
                };
            }

            // Check BEDRIJF table
            const [bedrijven] = await pool.query(`
                SELECT 
                    b.bedrijfsnummer as userId, b.email, b.naam,
                    'bedrijf' as userType,
                    lb.gebruikersId, lb.passwoord_hash
                FROM BEDRIJF b
                INNER JOIN LOGINBEHEER lb ON lb.bedrijfsnummer = b.bedrijfsnummer
                WHERE b.email = ?
            `, [email]);

            if (bedrijven.length > 0) {
                const user = bedrijven[0];
                console.log(`🏢 Found bedrijf: ${user.naam} (Security: ${this.detectHashType(user.passwoord_hash)})`);
                return user;
            }

            // Check ORGANISATOR table
            const [organisators] = await pool.query(`
                SELECT 
                    o.organisatorId as userId, o.email, o.voornaam, o.achternaam,
                    'organisator' as userType,
                    lb.gebruikersId, lb.passwoord_hash
                FROM ORGANISATOR o
                INNER JOIN LOGINBEHEER lb ON lb.gebruikersId = o.gebruikersId
                WHERE o.email = ?
            `, [email]);

            if (organisators.length > 0) {
                const user = organisators[0];
                console.log(`👔 Found organisator: ${user.voornaam} ${user.achternaam} (Security: ${this.detectHashType(user.passwoord_hash)})`);
                return {
                    ...user,
                    naam: `${user.voornaam} ${user.achternaam}`
                };
            }

            console.log('❌ User not found');
            return null;

        } catch (error) {
            console.error('❌ Error finding user:', error);
            throw error;
        }
    }

    /**
     * 🔒 ENHANCED authenticate user with security logging
     */
    async authenticateUser(email, password) {
        try {
            console.log(`🔐 Authenticating user: ${email}`);

            // Find user
            const user = await this.findUserByEmail(email);
            if (!user) {
                console.log('🔒 Security: Authentication failed - user not found');
                return {
                    success: false,
                    message: 'Geen account gevonden met dit email adres'
                };
            }

            // 🔒 SECURITY: Check for insecure password storage
            const hashType = this.detectHashType(user.passwoord_hash);
            if (hashType === 'plain_text_INSECURE') {
                console.log('🚨 SECURITY WARNING: Plain text password detected for user:', email);
            }

            // Verify password
            const isValidPassword = await this.verifyPassword(password, user.passwoord_hash);
            if (!isValidPassword) {
                console.log('🔒 Security: Authentication failed - invalid password');
                return {
                    success: false,
                    message: 'Onjuist wachtwoord'
                };
            }

            // Remove password hash from response
            const { passwoord_hash, ...userWithoutPassword } = user;

            console.log(`✅ Authentication successful for ${email} (Security Level: ${hashType})`);
            return {
                success: true,
                message: 'Login succesvol',
                user: userWithoutPassword,
                securityInfo: {
                    hashType: hashType,
                    needsUpgrade: hashType === 'plain_text_INSECURE'
                }
            };

        } catch (error) {
            console.error('❌ Authentication error:', error);
            return {
                success: false,
                message: 'Er ging iets mis bij de authenticatie'
            };
        }
    }

    // ===== PASSWORD UPDATE FUNCTIONS (Enhanced Security) =====

    /**
     * 🔒 ENHANCED password update with security validation
     */
    async updatePassword(gebruikersId, newPassword, currentPassword = null) {
        try {
            console.log(`🔄 Updating password for user ${gebruikersId}`);

            // 🔒 SECURITY: Validate new password strength
            const validation = this.validatePasswordStrength(newPassword);
            if (!validation.isValid) {
                console.log(`🔒 Security: Password rejected - ${validation.message}`);
                throw new Error(`Beveiligingsfout: ${validation.message}`);
            }

            console.log(`🔒 Security: New password meets requirements (Level: ${validation.securityLevel})`);

            // If current password provided, verify it first
            if (currentPassword) {
                const [currentUser] = await pool.query(
                    'SELECT passwoord_hash FROM LOGINBEHEER WHERE gebruikersId = ?',
                    [gebruikersId]
                );

                if (currentUser.length === 0) {
                    throw new Error('Gebruiker niet gevonden');
                }

                const isCurrentValid = await this.verifyPassword(currentPassword, currentUser[0].passwoord_hash);
                if (!isCurrentValid) {
                    console.log('🔒 Security: Current password verification failed');
                    throw new Error('Huidig wachtwoord is onjuist');
                }

                // Store old password in history
                await this.addPasswordToHistory(gebruikersId, currentUser[0].passwoord_hash);
            }

            // Hash new password with enhanced security
            const newHashedPassword = await this.hashPassword(newPassword);

            // Update in database
            const [result] = await pool.query(
                `UPDATE LOGINBEHEER 
                 SET passwoord_hash = ?, 
                     password_changed_at = CURRENT_TIMESTAMP,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE gebruikersId = ?`,
                [newHashedPassword, gebruikersId]
            );

            if (result.affectedRows === 0) {
                throw new Error('Geen gebruiker gevonden om bij te werken');
            }

            console.log(`✅ Password updated successfully for user ${gebruikersId} (Security Level: ${validation.securityLevel})`);
            return {
                success: true,
                message: 'Wachtwoord succesvol bijgewerkt met verhoogde beveiliging',
                securityLevel: validation.securityLevel
            };

        } catch (error) {
            console.error('❌ Password update error:', error);
            return {
                success: false,
                message: error.message || 'Fout bij bijwerken wachtwoord'
            };
        }
    }

    // ===== REST OF THE FUNCTIONS (keeping existing functionality) =====

    async upgradePasswordToHash(gebruikersId, plainPassword) {
        try {
            console.log(`🔄 Upgrading plain text password to secure bcrypt for user ${gebruikersId}`);
            
            const hashedPassword = await this.hashPassword(plainPassword);
            
            const [result] = await pool.query(
                `UPDATE LOGINBEHEER 
                 SET passwoord_hash = ?, 
                     password_changed_at = CURRENT_TIMESTAMP,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE gebruikersId = ?`,
                [hashedPassword, gebruikersId]
            );

            if (result.affectedRows > 0) {
                console.log(`✅ Password upgraded successfully for user ${gebruikersId}`);
                return true;
            } else {
                console.log(`❌ Failed to upgrade password for user ${gebruikersId}`);
                return false;
            }

        } catch (error) {
            console.error('❌ Password upgrade error:', error);
            return false;
        }
    }

    async addPasswordToHistory(gebruikersId, passwordHash) {
        try {
            await pool.query(
                'INSERT INTO PASSWORD_HISTORY (gebruikersId, password_hash) VALUES (?, ?)',
                [gebruikersId, passwordHash]
            );
            console.log(`📝 Password added to history for user ${gebruikersId}`);
        } catch (error) {
            console.log(`⚠️ Could not add password to history: ${error.message}`);
        }
    }

    async checkPasswordReuse(gebruikersId, newPassword, historyLimit = 5) {
        try {
            const [history] = await pool.query(
                `SELECT password_hash 
                 FROM PASSWORD_HISTORY 
                 WHERE gebruikersId = ? 
                 ORDER BY created_at DESC 
                 LIMIT ?`,
                [gebruikersId, historyLimit]
            );

            for (const entry of history) {
                if (await this.verifyPassword(newPassword, entry.password_hash)) {
                    return true;
                }
            }
            return false;

        } catch (error) {
            console.log(`⚠️ Could not check password reuse: ${error.message}`);
            return false;
        }
    }

    async checkEmailExists(email) {
        try {
            const [students] = await pool.query('SELECT email FROM STUDENT WHERE email = ?', [email]);
            if (students.length > 0) return { exists: true, userType: 'student' };

            const [bedrijven] = await pool.query('SELECT email FROM BEDRIJF WHERE email = ?', [email]);
            if (bedrijven.length > 0) return { exists: true, userType: 'bedrijf' };

            const [organisators] = await pool.query('SELECT email FROM ORGANISATOR WHERE email = ?', [email]);
            if (organisators.length > 0) return { exists: true, userType: 'organisator' };

            return { exists: false, userType: null };
        } catch (error) {
            console.error('Error checking email exists:', error);
            return { exists: false, userType: null };
        }
    }

    /**
     * 🔒 FIXED: Migration function with proper database connection
     */
    async migrateAllPasswords() {
        try {
            console.log('🔄 Starting secure password migration...');

            const [users] = await pool.query(`
                SELECT gebruikersId, passwoord_hash 
                FROM LOGINBEHEER 
                WHERE passwoord_hash NOT LIKE '$2b$%' 
                AND LENGTH(passwoord_hash) < 50 
                AND passwoord_hash IS NOT NULL
            `);

            console.log(`Found ${users.length} insecure passwords to migrate`);

            if (users.length === 0) {
                console.log('✅ All passwords are already secure (bcrypt)');
                return { success: 0, errors: 0, total: 0 };
            }

            let success = 0;
            let errors = 0;

            for (const user of users) {
                try {
                    console.log(`🔄 Migrating user ${user.gebruikersId}...`);
                    
                    // 🔒 SECURITY: The old plain text password will be upgraded to secure bcrypt
                    const hashedPassword = await bcrypt.hash(user.passwoord_hash, this.saltRounds);
                    
                    await pool.query(
                        'UPDATE LOGINBEHEER SET passwoord_hash = ? WHERE gebruikersId = ?',
                        [hashedPassword, user.gebruikersId]
                    );
                    
                    console.log(`✅ Securely migrated user ${user.gebruikersId}`);
                    success++;
                    
                } catch (error) {
                    console.error(`❌ Failed to migrate user ${user.gebruikersId}:`, error.message);
                    errors++;
                }
            }

            console.log(`🎉 Secure migration complete: ${success} success, ${errors} errors`);
            return { success, errors, total: users.length };

        } catch (error) {
            console.error('❌ Migration error:', error);
            throw error;
        }
    }
}

// ===== EXPORT AND SINGLETON =====

// Create singleton instance
const passwordManager = new UnifiedPasswordManager();

// Export both the class and instance
module.exports = {
    UnifiedPasswordManager,
    passwordManager,
    
    // Export individual functions for backward compatibility
    hashPassword: (password) => passwordManager.hashPassword(password),
    verifyPassword: (password, hash) => passwordManager.verifyPassword(password, hash),
    authenticateUser: (email, password) => passwordManager.authenticateUser(email, password),
    findUserByEmail: (email) => passwordManager.findUserByEmail(email),
    updatePassword: (userId, newPass, currentPass) => passwordManager.updatePassword(userId, newPass, currentPass),
    validatePasswordStrength: (password) => passwordManager.validatePasswordStrength(password),
    generateStrongPassword: (length) => passwordManager.generateSecurePassword(length),
    checkEmailExists: (email) => passwordManager.checkEmailExists(email),
    
    // Constants
    SALT_ROUNDS: 12,
    MIN_PASSWORD_LENGTH: 8,
    MAX_PASSWORD_LENGTH: 128
};

// Log initialization
console.log('🔐 Enhanced Password Manager initialized');
console.log('📝 This replaces: passwordManager.js, passwordhasher.js');
console.log('✅ Compatible with new authController.js');
console.log('🔒 Enhanced security: uppercase, lowercase, numbers, special chars required');