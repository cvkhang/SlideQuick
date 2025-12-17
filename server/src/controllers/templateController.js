const templateService = require('../services/templateService');

exports.getTemplates = async (req, res) => {
  try {
    const filters = {
      is_standard: req.query.is_standard,
      search: req.query.search,
      tag: req.query.tag
    };
    const templates = templateService.getTemplates(filters);
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
};

exports.getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const favorites = templateService.getFavorites(userId);
    res.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
};

exports.toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const templateId = req.params.id;
    const result = templateService.toggleFavorite(userId, templateId);
    res.json(result);
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = templateService.getHistory(userId);
    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

exports.recordUsage = async (req, res) => {
  try {
    const userId = req.user.id;
    const templateId = req.params.id;
    templateService.recordUsage(userId, templateId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error recording usage:', error);
    res.status(500).json({ error: 'Failed to record usage' });
  }
};
