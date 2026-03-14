import CollectionModal from "../../../models/product/CollectionModal.js";
import Product from "../../../models/product/ProductModal.js";

const CollectionDataFetchController = async (req, res) => {
  try {
    const collections = await CollectionModal.find().sort({
      createdAt: -1,
    });

    const collectionMeta = await CollectionModal.find(
      {},
      { title: 1, categoryName: 1 },
    ).sort({ title: 1 });
    const productGrouped = await Product.aggregate([
      {
        $match: {
          productCollection: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$productCollection",
          totalProducts: { $sum: 1 },
          products: {
            $push: {
              _id: "$_id",
              title: "$title",
              price: "$pricing.salePrice",
              stock: "$stock",
              status: "$status",
            },
          },
        },
      },
    ]);
    const productMap = {};
    productGrouped.forEach((item) => {
      productMap[item._id.toString()] = {
        totalProducts: item.totalProducts,
        products: item.products,
      };
    });

    const collectionsWithProducts = collections.map((collection) => {
      const linkedData = productMap[collection._id.toString()] || {
        totalProducts: 0,
        products: [],
      };

      return {
        ...collection.toObject(),
        linkedProducts: linkedData.products,
        linkedProductCount: linkedData.totalProducts,
      };
    });

    res.status(200).json({
      success: true,
      message: "Collections fetched successfully",
      data: {
        collections: collectionsWithProducts,
        collectionMeta,
      },
    });
  } catch (error) {
    console.error("COLLECTION FETCH ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export default CollectionDataFetchController;
