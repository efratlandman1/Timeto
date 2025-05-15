const Service = require('../models/service');

// קבלת כל השירותים
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find({});
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching services', error });
  }
};

// קבלת שירותים לפי קטגוריה
exports.getServicesByCategory = async (req, res) => {
  const { categoryId } = req.params;
  try {
    const services = await Service.find({ categoryId, active: true });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching services by category', error });
  }
};

// יצירת שירות חדש
exports.createService = async (req, res) => {
  const { categoryId, name, active } = req.body;
  try {
    const newService = new Service({ categoryId, name, active });
    await newService.save();
    res.status(201).json(newService);
  } catch (error) {
    res.status(400).json({ message: 'Error creating service', error });
  }
};
