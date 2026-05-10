import Service from '../models/serviceModel.js';

const toTwoDigits = (value) => String(value).padStart(2, '0');

const getCurrentTime = () => {
  const now = new Date();
  return `${toTwoDigits(now.getHours())}:${toTwoDigits(now.getMinutes())}`;
};

export const createService = async (req, res) => {
  try {
    const { date, services, serviceType, cost, remark } = req.body;

    if (!date || !services || !serviceType || cost === undefined || cost === null || cost === '') {
      return res.status(400).json({
        success: false,
        message: 'Date, services, service type and cost are required'
      });
    }

    const parsedCost = Number(cost);
    if (!Number.isFinite(parsedCost) || parsedCost < 0) {
      return res.status(400).json({
        success: false,
        message: 'Cost must be a valid non-negative number'
      });
    }

    const createdBy = req.admin?._id;
    const createdByModel = req.isEmployer ? 'Employer' : 'Admin';

    const newService = await Service.create({
      date: String(date).trim(),
      time: getCurrentTime(),
      services: String(services).trim(),
      serviceType: String(serviceType).trim(),
      cost: parsedCost,
      remark: remark ? String(remark).trim() : '',
      createdBy,
      createdByModel
    });

    return res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: newService
    });
  } catch (error) {
    console.error('Create service error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create service',
      error: error.message
    });
  }
};

export const getServices = async (req, res) => {
  try {
    const services = await Service.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');

    return res.json({
      success: true,
      message: 'Services fetched successfully',
      data: services
    });
  } catch (error) {
    console.error('Get services error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
      error: error.message
    });
  }
};

export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findByIdAndDelete(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    return res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete service',
      error: error.message
    });
  }
};

export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, services, serviceType, cost, remark } = req.body;

    if (!date || !services || !serviceType || cost === undefined || cost === null || cost === '') {
      return res.status(400).json({
        success: false,
        message: 'Date, services, service type and cost are required'
      });
    }

    const parsedCost = Number(cost);
    if (!Number.isFinite(parsedCost) || parsedCost < 0) {
      return res.status(400).json({
        success: false,
        message: 'Cost must be a valid non-negative number'
      });
    }

    const updated = await Service.findByIdAndUpdate(
      id,
      {
        date: String(date).trim(),
        services: String(services).trim(),
        serviceType: String(serviceType).trim(),
        cost: parsedCost,
        remark: remark ? String(remark).trim() : ''
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    return res.json({
      success: true,
      message: 'Service updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Update service error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update service',
      error: error.message
    });
  }
};
