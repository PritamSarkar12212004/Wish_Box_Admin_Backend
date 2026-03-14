import Product from "../../../models/product/ProductModal.js";
import Collection from "../../../models/product/CollectionModal.js";
import GalleryImage from "../../../models/product/GalleryImageModal.js";

const ProductUploadController = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      category,
      collectionName,
      originalPrice,
      price,
      stock,
      status,
      tags,
      images,
      gallery,
      gsm,
      height,
      width,
      sizeUnit,
    } = req.body.data || {};
    if (
      !title ||
      !description ||
      !category ||
      !collectionName ||
      !originalPrice ||
      !price ||
      !gsm ||
      !height ||
      !width ||
      !Array.isArray(images) ||
      images.length === 0
    ) {
      return res.status(400).json({
        status: false,
        message: "Missing required product fields",
      });
    }

    const allowedQualities = ["q30", "q50", "q75", "q100"];

    const invalidImage = images.some(
      (img) =>
        !allowedQualities.includes(img.quality) || !img.url || !img.public_id,
    );

    if (invalidImage) {
      return res.status(400).json({
        status: false,
        message: "Invalid image format",
      });
    }
    let collection = await Collection.findOne({ title: collectionName });

    if (!collection) {
      collection = await Collection.create({
        title: collectionName,
        subtitle,
        categoryName: category,
      });
    }
    let galleryIds = [];

    if (Array.isArray(gallery) && gallery.length > 0) {
      const galleryDocs = await GalleryImage.insertMany(
        gallery.map((versions) => ({
          versions: versions.filter(
            (v) => allowedQualities.includes(v.quality) && v.url && v.public_id,
          ),
        })),
      );

      galleryIds = galleryDocs.map((doc) => doc._id);
    }
    const product = await Product.create({
      title,
      subtitle,
      description,
      category,
      tags,
      pricing: {
        originalPrice,
        salePrice: price,
        totalSaving: originalPrice - price,
      },

      stock,
      status,
      isActive: status === "active",

      paperSpecs: {
        gsm: Number(gsm),
        height: Number(height),
        width: Number(width),
        unit: sizeUnit || "cm",
      },

      images: {
        primary: images,
      },

      gallery: galleryIds,
      productCollection: collection._id,
    });

    return res.status(201).json({
      status: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("PRODUCT CREATE ERROR:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export default ProductUploadController;
