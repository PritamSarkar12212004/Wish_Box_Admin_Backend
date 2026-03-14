import User from "../../../models/client/ClientModal.js";
import Order from "../../../models/odars/OrderModal.js";

const customargetData = async (req, res) => {
  try {
    /* ===============================
       📊 SUMMARY STATS
    =============================== */

    const totalCustomers = await User.countDocuments();

    // Total Spend + Total Orders (only non-cancelled)
    const revenueAgg = await Order.aggregate([
      { $match: { orderStatus: { $ne: "cancelled" } } },
      {
        $group: {
          _id: null,
          totalSpend: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    const totalSpend = revenueAgg[0]?.totalSpend || 0;
    const totalOrders = revenueAgg[0]?.totalOrders || 0;

    const avgOrderValue = totalOrders > 0 ? totalSpend / totalOrders : 0;

    /* ===============================
       👥 CUSTOMER FULL DATA
    =============================== */

    const customers = await User.aggregate([
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "customer",
          as: "orders",
        },
      },
      {
        $addFields: {
          totalOrders: {
            $size: {
              $filter: {
                input: "$orders",
                as: "order",
                cond: { $ne: ["$$order.orderStatus", "cancelled"] },
              },
            },
          },
          totalSpent: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$orders",
                    as: "order",
                    cond: { $ne: ["$$order.orderStatus", "cancelled"] },
                  },
                },
                as: "order",
                in: "$$order.totalAmount",
              },
            },
          },
          lastOrderDate: {
            $max: "$orders.createdAt",
          },
        },
      },
      {
        $project: {
          password: 0,
          orders: 0,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    /* ===============================
       ✅ RESPONSE
    =============================== */

    res.status(200).json({
      success: true,
      summary: {
        totalCustomers,
        totalSpend,
        avgOrderValue: avgOrderValue.toFixed(2),
      },
      customers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export default customargetData;
