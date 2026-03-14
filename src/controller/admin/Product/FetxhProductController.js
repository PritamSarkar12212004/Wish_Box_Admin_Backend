import ProductModal from "../../../models/product/ProductModal.js";
import CollectionModal from "../../../models/product/CollectionModal.js";

const FetchAllProductsController = async (req, res) => {
  try {
    const products = await ProductModal.find()
      .populate("productCollection")
      .sort({ createdAt: -1 });
    if (!products || products.length === 0) {
      const collections = (
        await CollectionModal.find({}, { title: 1 }).sort({ title: 1 })
      ).map((c) => c.title);

      return res.status(200).json({
        status: true,
        message: "No products found",
        products: [],
        categories: [],
        collections,
      });
    }
    const productList = products.map((product) => ({
      _id: product._id,
      title: product.title,
      subtitle: product.subtitle,
      description: product.description,
      pricing: product.pricing,
      stock: product.stock,
      status: product.status,
      tags: product.tags,
      images: product.images,
      gallery: product.gallery,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      categoryName: product.category ?? null,
      collectionName: product.productCollection
        ? product.productCollection.title
        : null,
    }));
    const categories = [
      ...new Set(products.map((p) => p.category).filter(Boolean)),
    ];

    const collections = (
      await CollectionModal.find({}, { title: 1 }).sort({ title: 1 })
    ).map((c) => c.title);
    res.status(200).json({
      status: true,
      message: "Data fetched successfully",
      products: productList,
      categories,
      collections,
    });
  } catch (error) {
    console.error("FETCH PRODUCTS ERROR:", error);
    res.status(500).json({
      status: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};

export default FetchAllProductsController;
