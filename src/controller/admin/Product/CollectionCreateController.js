import CollectionModal from "../../../models/product/CollectionModal.js";

const CollectionCreateController = async (req, res) => {
  try {
    const { title, subtitle, status, theme, coverImages, secondaryColor } =
      req.body;

    const { primaryColor, categoryName } = theme || {};
    const { url, public_id } = coverImages || {};

    if (
      !title ||
      !categoryName ||
      !url ||
      !public_id ||
      !primaryColor ||
      !secondaryColor
    ) {
      return res.status(400).json({
        message: "Missing required fields",
        status: false,
      });
    }

    const existing = await CollectionModal.findOne({ title });
    if (existing) {
      return res.status(400).json({
        message: "Collection with this title already exists",
        status: false,
      });
    }
    const collection = await CollectionModal.create({
      title,
      subtitle,
      categoryName,
      theme: {
        primaryColor,
        secondaryColor,
      },
      coverImages: {
        url,
        public_id,
      },
      isActive: status === "active",
    });
    const collectionMeta = {
      _id: collection._id,
      title: collection.title,
      categoryName: collection.categoryName,
    };

    res.status(201).json({
      message: "Collection created successfully",
      collection,
      collectionMeta,
      status: true,
    });
  } catch (error) {
    console.error("COLLECTION CREATE ERROR:", error);
    res.status(500).json({
      message: "Error creating collection",
      error: error.message,
      status: false,
    });
  }
};

export default CollectionCreateController;
