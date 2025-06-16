const path = require('path');

// 🚩 Laad altijd .env ALS ALLEREERSTE (gegarandeerd juiste variabelen)
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const bcrypt = require('bcrypt');
const { pool, dbConfig } = require('../CONFIG/database');

console.log('🔧 PasswordManager gebruikt database host:', dbConfig.host);

class UnifiedPasswordManager {
    constructor() {
        this.saltRounds = 12;
        this.minPasswordLength = 8;
        this.maxPasswordLength = 128;
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

    generateSecurePassword(length = 12) {
        if (length < this.minPasswordLength) {
            length = this.minPasswordLength;
        }
        
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const special = '!@#$%^&*(),.?":{}|<>';
        
        let password = '';
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += special[Math.floor(Math.random() * special.length)];
        
        const allChars = uppercase + lowercase + numbers + special;
        for (let i = password.length; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }
        
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }

    // ===== CORE PASSWORD FUNCTIONS =====

    async hashPassword(plainPassword) {
        try {
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

    async verifyPassword(plainPassword, storedHash) {
        try {
            if (!plainPassword || !storedHash) {
                console.log('⚠️ Missing password or hash');
                return false;
            }

            console.log(`🔍 Verifying password... Hash type: ${this.detectHashType(storedHash)}`);

            if (storedHash.startsWith('$2b$') || storedHash.startsWith('$2a$')) {
                const result = await bcrypt.compare(plainPassword, storedHash);
                console.log(`🔒 Bcrypt verification: ${result ? 'SUCCESS' : 'FAILED'}`);
                return result;
            }

            if (storedHash.length < 50) {
                const result = plainPassword === storedHash;
                if (result) {
                    console.log('⚠️ Plain text password match - NEEDS SECURITY UPGRADE');
                }
                console.log(`📝 Plain text verification: ${result ? 'SUCCESS' : 'FAILED'}`);
                return result;
            }

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

    detectHashType(hash) {
        if (!hash) return 'NULL';
        if (hash.startsWith('$2b$')) return 'bcrypt_modern';
        if (hash.startsWith('$2a$')) return 'bcrypt_legacy';
        if (hash.length < 50) return 'plain_text_INSECURE';
        if (hash.startsWith('$')) return 'unknown_hash';
        return 'unknown';
    }

    // ===== DATABASE USER FUNCTIONS =====

    async findUserByEmail(email) {
        try {
            console.log(`🔍 Finding user by email: ${email}`);

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

    async authenticateUser(email, password) {
        try {
            console.log(`🔐 Authenticating user: ${email}`);

            const user = await this.findUserByEmail(email);
            if (!user) {
                console.log('🔒 Security: Authentication failed - user not found');
                return {
                    success: false,
                    message: 'Geen account gevonden met dit email adres'
                };
            }

            const hashType = this.detectHashType(user.passwoord_hash);
            if (hashType === 'plain_text_INSECURE') {
                console.log('🚨 SECURITY WARNING: Plain text password detected for user:', email);
            }

            const isValidPassword = await this.verifyPassword(password, user.passwoord_hash);
            if (!isValidPassword) {
                console.log('🔒 Security: Authentication failed - invalid password');
                return {
                    success: false,
                    message: 'Onjuist wachtwoord'
                };
            }

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

    // ===== REGISTER CREDENTIALS (toegevoegd!) =====

    async createUserCredentials(userType, userIdentifier, plainPassword) {
        try {
            const hashedPassword = await this.hashPassword(plainPassword);

            let column, value;
            if (userType === 'student') {
                column = 'studentnummer';
                value = userIdentifier;
            } else if (userType === 'bedrijf') {
                column = 'bedrijfsnummer';
                value = userIdentifier;
            } else if (userType === 'organisator') {
                column = 'gebruikersId';
                value = userIdentifier;
            } else {
                return { success: false, message: 'Onbekend userType in createUserCredentials' };
            }

            const [result] = await pool.query(
                `INSERT INTO LOGINBEHEER (${column}, passwoord_hash) VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE passwoord_hash = VALUES(passwoord_hash)`,
                [value, hashedPassword]
            );

            let gebruikersId;
            if (result.insertId) {
                gebruikersId = result.insertId;
            } else {
                const [rows] = await pool.query(
                    `SELECT gebruikersId FROM LOGINBEHEER WHERE ${column} = ?`,
                    [value]
                );
                gebruikersId = rows[0]?.gebruikersId;
            }

            return { success: true, gebruikersId };
        } catch (error) {
            console.error('Error in createUserCredentials:', error);
            return { success: false, message: error.message };
        }
    }

    // ===== PASSWORD UPDATE FUNCTIONS =====

    async updatePassword(gebruikersId, newPassword, currentPassword = null) {
        try {
            console.log(`🔄 Updating password for user ${gebruikersId}`);

            const validation = this.validatePasswordStrength(newPassword);
            if (!validation.isValid) {
                console.log(`🔒 Security: Password rejected - ${validation.message}`);
                throw new Error(`Beveiligingsfout: ${validation.message}`);
            }

            console.log(`🔒 Security: New password meets requirements (Level: ${validation.securityLevel})`);

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

                await this.addPasswordToHistory(gebruikersId, currentUser[0].passwoord_hash);
            }

            const newHashedPassword = await this.hashPassword(newPassword);

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

const passwordManager = new UnifiedPasswordManager();

module.exports = {
    UnifiedPasswordManager,
    passwordManager,
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

console.log('🔐 Enhanced Password Manager initialized');
console.log('📝 This replaces: passwordManager.js, passwordhasher.js');
console.log('✅ Compatible with new authController.js');
console.log('🔒 Enhanced security: uppercase, lowercase, numbers, special chars required');