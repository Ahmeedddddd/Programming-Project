const express = require('express');
const router = express.Router();
const { passwordManager } = require('../../PASSWOORD/passwordManager');

router.post('/change-password', async (req, res) => {
    try {
        const { gebruikersId, currentPassword, newPassword } = req.body;

        if (!gebruikersId || !currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Alle velden zijn verplicht'
            });
        }

        const updateResult = await passwordManager.updatePassword(
            gebruikersId, 
            newPassword, 
            currentPassword
        );

        if (updateResult.success) {
            return res.json({
                success: true,
                message: updateResult.message
            });
        } else {
            return res.status(400).json({
                success: false,
                message: updateResult.message
            });
        }

    } catch (error) {
        console.error('Password change error:', error);
        return res.status(500).json({
            success: false,
            message: 'Er ging iets mis bij het wijzigen van het wachtwoord'
        });
    }
});

module.exports = router;