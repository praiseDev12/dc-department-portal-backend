import * as unitService from '../services/unit.service.js';

export async function getUnits(req, res) {
  try {
    const units = await unitService.getUnits({
      user: req.user,
    });

    res.status(200).json({
      units,
    });
  } catch (error) {
    console.error('getUnits error:', error);

    res.status(500).json({
      message: error.message || 'Failed to load units',
    });
  }
}

export async function createUnit(req, res) {
  try {
    const unit = await unitService.createUnit({
      user: req.user,
      name: req.body?.name,
    });

    res.status(201).json({
      message: 'Unit created successfully',
      unit,
    });
  } catch (error) {
    console.error('createUnit error:', error);

    res.status(400).json({
      message: error.message || 'Failed to create unit',
    });
  }
}

export async function updateUnit(req, res) {
  try {
    const unit = await unitService.updateUnit({
      user: req.user,
      unitId: req.params.id,
      name: req.body?.name,
    });

    res.status(200).json({
      message: 'Unit updated successfully',
      unit,
    });
  } catch (error) {
    console.error('updateUnit error:', error);

    const status = error.message === 'Unit not found' ? 404 : 400;

    res.status(status).json({
      message: error.message || 'Failed to update unit',
    });
  }
}

export async function deleteUnit(req, res) {
  try {
    await unitService.deleteUnit({
      user: req.user,
      unitId: req.params.id,
      setupCode: req.body?.setupCode,
    });

    res.status(200).json({
      message: 'Unit deleted successfully',
    });
  } catch (error) {
    console.error('deleteUnit error:', error);

    const status = error.message === 'Unit not found' ? 404 : 400;

    res.status(status).json({
      message: error.message || 'Failed to delete unit',
    });
  }
}
