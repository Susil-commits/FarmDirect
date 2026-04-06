import CropListing from '../models/CropListing.js';

// @route POST /api/crops
// @desc Create a new crop listing (Farmer only)
// @access Private
export const createCrop = async (req, res, next) => {
  try {
    const { name, category, price, quantity, description, specifications, harvestDate, certifications } = req.body;

    const crop = await CropListing.create({
      farmerId: req.user._id,
      name,
      category,
      price,
      quantity,
      description,
      specifications,
      harvestDate,
      certifications,
      status: 'pending_review',
    });

    res.status(201).json({
      message: 'Crop listing created successfully',
      crop,
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/crops
// @desc Get all active crops with filters
// @access Public
export const getCrops = async (req, res, next) => {
  try {
    const { category, minPrice, maxPrice, search, page = 1, limit = 12 } = req.query;

    const query = { status: 'active' };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const crops = await CropListing.find(query)
      .populate('farmerId', 'name avatar rating location')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await CropListing.countDocuments(query);

    res.status(200).json({
      crops,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/crops/:id
// @desc Get single crop details
// @access Public
export const getCropById = async (req, res, next) => {
  try {
    const crop = await CropListing.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate([
      { path: 'farmerId', select: 'name avatar rating location bio' },
      {
        path: 'reviews',
        populate: { path: 'userId', select: 'name avatar' },
      },
    ]);

    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    res.status(200).json({ crop });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/crops/:id
// @desc Update crop listing (Farmer only - owner)
// @access Private
export const updateCrop = async (req, res, next) => {
  try {
    let crop = await CropListing.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    // Check ownership
    if (crop.farmerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this crop' });
    }

    // Update allowed fields
    const { name, category, price, quantity, description, specifications, certifications, status } = req.body;

    crop = await CropListing.findByIdAndUpdate(
      req.params.id,
      {
        name,
        category,
        price,
        quantity,
        description,
        specifications,
        certifications,
        ...(req.user.role === 'admin' && { status }),
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Crop updated successfully',
      crop,
    });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/crops/:id
// @desc Delete crop listing (Farmer only - owner)
// @access Private
export const deleteCrop = async (req, res, next) => {
  try {
    const crop = await CropListing.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    // Check ownership
    if (crop.farmerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this crop' });
    }

    await CropListing.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Crop deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/crops/farmer/:farmerId
// @desc Get all crops by a farmer
// @access Public
export const getCropsByFarmer = async (req, res, next) => {
  try {
    const crops = await CropListing.find({
      farmerId: req.params.farmerId,
      status: 'active',
    }).sort({ createdAt: -1 });

    res.status(200).json({ crops });
  } catch (error) {
    next(error);
  }
};
