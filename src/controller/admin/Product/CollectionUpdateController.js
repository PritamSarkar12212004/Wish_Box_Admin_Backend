import CollectionModal from "../../../models/product/CollectionModal.js";

const CollectionUpdateController = async (req, res) => {
  try {
    const {
      productId,
      secondaryColor,
      theme,
      coverImages,
      status,
      subtitle,
      title,
    } = req.body;
    if (
      !productId ||
      !secondaryColor ||
      !theme?.primaryColor ||
      !theme?.categoryName ||
      !coverImages?.url
    ) {
      return res.status(400).json({
        message: "Missing required fields",
        status: false,
      });
    }

    const collection = await CollectionModal.findById(productId);
    if (!collection) {
      return res.status(404).json({
        message: "Collection not found",
        status: false,
      });
    }
    if (title && title !== collection.title) {
      const existing = await CollectionModal.findOne({ title });
      if (existing) {
        return res.status(400).json({
          message: "Another collection with this title already exists",
          status: false,
        });
      }
    }

    collection.title = title || collection.title;
    collection.subtitle = subtitle || collection.subtitle;
    collection.categoryName = theme.categoryName || collection.categoryName;
    collection.theme = {
      primaryColor: theme.primaryColor,
      secondaryColor: secondaryColor,
    };
    collection.coverImages = [
      { url: coverImages.url, public_id: coverImages.public_id || "" },
    ];
    collection.isActive = status === "active";
    await collection.save();
    const collectionMeta = {
      _id: collection._id,
      title: collection.title,
      categoryName: collection.categoryName,
    };

    console.log("🔹 Sending response");
    res.status(200).json({
      message: "Collection updated successfully",
      collection,
      collectionMeta,
      status: true,
    });
  } catch (error) {
    console.error("❌ COLLECTION UPDATE ERROR:", error);
    res.status(500).json({
      message: "Error updating collection",
      error: error.message,
      status: false,
    });
  }
};

export default CollectionUpdateController;
