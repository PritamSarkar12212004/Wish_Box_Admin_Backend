import Order from "../../../models/odars/OrderModal.js";

const OrderGetDataController = async (req, res) => {
  try {
    /* ===============================
       📊 4 BOX SUMMARY STATS
    =============================== */

    const totalOrders = await Order.countDocuments();

    const revenueAgg = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    const pendingOrders = await Order.countDocuments({
      orderStatus: "pending",
    });

    const processingOrders = await Order.countDocuments({
      orderStatus: "processing",
    });

    /* ===============================
       📦 FETCH ALL ORDERS (FULL INFO)
    =============================== */

    const orders = await Order.find()
      .populate("customer") // full customer info
      .sort({ createdAt: -1 });

    /* ===============================
       ✅ RESPONSE
    =============================== */

    res.status(200).json({
      success: true,
      summary: {
        totalOrders,
        totalRevenue,
        pending: pendingOrders,
        processing: processingOrders,
      },
      orders, // full raw order data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export default OrderGetDataController;
