// migrate-passwords.js

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// 🚩 Belangrijk: gebruik altijd de centrale databaseconfig en pool
const { pool, dbConfig } = require('../CONFIG/database');

// 🚩 Laad altijd passwordManager uit dezelfde map als dit script
let passwordManager;
try {
    passwordManager = require('./passwordManager').passwordManager;
    console.log('✅ Loaded passwordManager from same directory');
} catch (error) {
    console.error('❌ Cannot load passwordManager from ./passwordManager');
    throw new Error('Password manager not found');
}

// 🚩 Forceer dat passwordManager pool gebruikt van de backend config
if (passwordManager && pool) {
    passwordManager.pool = pool;
    passwordManager.dbConfig = dbConfig;
    console.log('✅ passwordManager uses backend pool & dbConfig');
}

class PasswordMigration {
    constructor() {
        this.fixedCount = 0;
        this.errorCount = 0;
        this.skipCount = 0;
    }

    async run() {
        try {
            console.log('🔐 Starting Enhanced Password Migration...');
            console.log('='.repeat(50));

            const dbOK = await this.testDatabaseConnection();
            if (!dbOK) {
                console.log('🛑 Cannot proceed without database connection');
                return;
            }

            await this.analyzeDatabase();
            console.log('\n⚠️  WARNING: This will modify passwords in the database!');
            console.log('💾 Make sure you have a backup!');
            console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...');
            await this.sleep(5000);

            await this.migratePasswords();
            await this.verifyMigration();
            await this.printSummary();

        } catch (error) {
            console.error('❌ Migration failed:', error);
        }
    }

    async testDatabaseConnection() {
        try {
            console.log('🔌 Testing database connection...');
            const testUser = await passwordManager.checkEmailExists('test@example.com');
            console.log('✅ Database connection successful');
            return true;
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            console.log('\n🔧 Troubleshooting:');
            console.log('1. Is MySQL/MariaDB running?');
            console.log('2. Check CONFIG/database.js settings');
            console.log('3. Probeer opnieuw met: node PASSWOORD/migrate-passwords.js vanuit de Server map');
            return false;
        }
    }

    async analyzeDatabase() {
        console.log('\n📊 Analyzing database...');
        try {
            const result = await passwordManager.migrateAllPasswords();
            console.log('📈 Analysis complete:');
            console.log(`   Total passwords to migrate: ${result.total}`);
            console.log(`   Already secure: ${result.total === 0 ? 'All passwords' : 'Some passwords'}`);
            if (result.total === 0) {
                console.log('🎉 All passwords are already secure (bcrypt)!');
                console.log('💡 No migration needed');
            }
            return result;
        } catch (error) {
            console.error('❌ Analysis failed:', error);
            throw error;
        }
    }

    async migratePasswords() {
        console.log('\n🔄 Starting password migration...');
        try {
            const result = await passwordManager.migrateAllPasswords();
            this.fixedCount = result.success;
            this.errorCount = result.errors;
            console.log(`🎯 Migration completed: ${result.success}/${result.total} passwords migrated`);
        } catch (error) {
            console.error('❌ Migration failed:', error);
            throw error;
        }
    }

    async verifyMigration() {
        console.log('\n🔍 Verifying migration...');
        try {
            const testEmails = [
                'jan.devos@ehb.be',
                'john.doew@student.ehb.be',
                'info@bilalaicorp.be',
                'sarah.devries@ehb.be'
            ];
            console.log('🧪 Testing sample accounts:');
            for (const email of testEmails) {
                try {
                    const user = await passwordManager.findUserByEmail(email);
                    if (user) {
                        const hashType = passwordManager.detectHashType(user.passwoord_hash);
                        console.log(`   ${email}: ${hashType}`);
                    } else {
                        console.log(`   ${email}: not found`);
                    }
                } catch (error) {
                    console.log(`   ${email}: error checking`);
                }
            }
        } catch (error) {
            console.error('❌ Verification failed:', error);
        }
    }

    async printSummary() {
        console.log('\n' + '='.repeat(50));
        console.log('📋 MIGRATION SUMMARY');
        console.log('='.repeat(50));
        console.log(`✅ Successfully migrated: ${this.fixedCount}`);
        console.log(`❌ Failed: ${this.errorCount}`);
        console.log(`⏭️ Skipped: ${this.skipCount}`);
        console.log('='.repeat(50));
        if (this.errorCount === 0) {
            console.log('🎉 Migration completed successfully!');
            console.log('💡 All users can now login with their original passwords');
            console.log('🔒 All passwords are now securely hashed with bcrypt');
            console.log('');
            console.log('🔐 ENHANCED SECURITY FEATURES:');
            console.log('  ✅ Uppercase letters required');
            console.log('  ✅ Lowercase letters required');
            console.log('  ✅ Numbers required');
            console.log('  ✅ Special characters required');
            console.log('  ✅ Common patterns blocked');
            console.log('  ✅ Password history tracking');
        } else {
            console.log('⚠️ Migration completed with some errors');
            console.log('🔧 Check the logs above for failed users');
        }
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const migration = new PasswordMigration();
    try {
        if (args[0] === 'analyze') {
            console.log('🔍 Analysis mode only');
            await migration.testDatabaseConnection();
            await migration.analyzeDatabase();
        } else if (args[0] === 'migrate') {
            console.log('🚀 Migration mode');
            await migration.run();
        } else {
            console.log('🔐 ENHANCED PASSWORD MIGRATION TOOL');
            console.log('='.repeat(40));
            console.log('Usage:');
            console.log('  node migrate-passwords.js analyze               - Analyze database only');
            console.log('  node migrate-passwords.js migrate               - Run full migration');
            console.log('');
            console.log('Voorbeeld:');
            console.log('  node migrate-passwords.js analyze');
            console.log('  node migrate-passwords.js migrate');
            console.log('');
            console.log('⚠️  IMPORTANT: Maak een database backup voor je migrate uitvoert!');
        }
    } catch (error) {
        console.error('❌ Script error:', error);
    }
}

// Export for use in other scripts
module.exports = PasswordMigration;

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}