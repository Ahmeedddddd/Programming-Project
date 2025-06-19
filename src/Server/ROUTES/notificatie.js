const express = require('express');
const router = express.Router();
const Notificatie = require('../MODELS/notificatie');
const { authenticateToken, requireRole } = require('../MIDDLEWARE/auth');

// CREATE notificatie (alleen organisator of backend mag dit direct)
router.post('/', authenticateToken, requireRole(['organisator']), async (req, res) => {
  try {
    const { studentnummer, bedrijfsnummer, type, boodschap } = req.body;
    if (!type || !boodschap) {
      return res.status(400).json({ success: false, message: 'Type en boodschap zijn verplicht.' });
    }
    const id = await Notificatie.create({ studentnummer, bedrijfsnummer, type, boodschap });
    res.status(201).json({ success: true, notificatieId: id });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ success: false, message: 'Kon notificatie niet aanmaken.' });
  }
});

// GET alle notificaties voor ingelogde gebruiker
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const { studentnummer, bedrijfsnummer, userType, userId } = req.user;
    let notificaties;
    if (userType === 'student') {
      notificaties = await Notificatie.getAllForUser({ studentnummer: userId });
    } else if (userType === 'bedrijf') {
      notificaties = await Notificatie.getAllForUser({ bedrijfsnummer: userId });
    } else {
      return res.status(403).json({ success: false, message: 'Geen toegang.' });
    }
    res.json({ success: true, data: notificaties });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Kon notificaties niet ophalen.' });
  }
});

// GET ongelezen notificaties
router.get('/unread', authenticateToken, async (req, res) => {
  try {
    const { userType, userId } = req.user;
    let notificaties;
    if (userType === 'student') {
      notificaties = await Notificatie.getUnreadForUser({ studentnummer: userId });
    } else if (userType === 'bedrijf') {
      notificaties = await Notificatie.getUnreadForUser({ bedrijfsnummer: userId });
    } else {
      return res.status(403).json({ success: false, message: 'Geen toegang.' });
    }
    res.json({ success: true, data: notificaties });
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({ success: false, message: 'Kon ongelezen notificaties niet ophalen.' });
  }
});

// PUT markeer notificatie als gelezen
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const affected = await Notificatie.markAsRead(id);
    if (affected === 0) {
      return res.status(404).json({ success: false, message: 'Notificatie niet gevonden.' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Kon notificatie niet bijwerken.' });
  }
});

// PUT markeer alle als gelezen
router.put('/read/all', authenticateToken, async (req, res) => {
  try {
    const { userType, userId } = req.user;
    let affected;
    if (userType === 'student') {
      affected = await Notificatie.markAllAsRead({ studentnummer: userId });
    } else if (userType === 'bedrijf') {
      affected = await Notificatie.markAllAsRead({ bedrijfsnummer: userId });
    } else {
      return res.status(403).json({ success: false, message: 'Geen toegang.' });
    }
    res.json({ success: true, updated: affected });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Kon notificaties niet bijwerken.' });
  }
});

// DELETE notificatie
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const affected = await Notificatie.delete(id);
    if (affected === 0) {
      return res.status(404).json({ success: false, message: 'Notificatie niet gevonden.' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Kon notificatie niet verwijderen.' });
  }
});

module.exports = router; 