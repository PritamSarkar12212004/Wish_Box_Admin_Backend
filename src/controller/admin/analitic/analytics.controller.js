import Order from "../../../models/odars/OrderModal.js";

const getAnalytics = async (req, res) => {
  try {
    const now = new Date();

    // ===============================
    // DATE RANGES
    // ===============================
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const last7DaysStart = new Date();
    last7DaysStart.setDate(today.getDate() - 6);
    last7DaysStart.setHours(0, 0, 0, 0);

    // ===============================
    // 6 MONTH REVENUE + ORDERS
    // ===============================
    const sixMonthAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          orderStatus: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    let totalRevenue6Months = 0;
    let totalOrders6Months = 0;

    const monthlyRevenueTrend = sixMonthAgg.map((item) => {
      totalRevenue6Months += item.revenue;
      totalOrders6Months += item.orders;

      const monthName = new Date(
        item._id.year,
        item._id.month - 1,
      ).toLocaleString("default", { month: "short" });

      return {
        month: monthName,
        revenue: item.revenue,
        orders: item.orders,
      };
    });

    const avgMonthlyRevenue =
      monthlyRevenueTrend.length > 0
        ? totalRevenue6Months / monthlyRevenueTrend.length
        : 0;

    // ===============================
    // AVG ORDER VALUE
    // ===============================
    const avgOrderAgg = await Order.aggregate([
      { $match: { orderStatus: { $ne: "cancelled" } } },
      {
        $group: {
          _id: null,
          avg: { $avg: "$totalAmount" },
        },
      },
    ]);

    const avgOrderValue = avgOrderAgg[0]?.avg || 0;

    // ===============================
    // ORDERS BY STATUS (BAR / DONUT)
    // ===============================
    const orderStatusAgg = await Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const ordersByStatus = {};
    orderStatusAgg.forEach((item) => {
      ordersByStatus[item._id] = item.count;
    });

    // ===============================
    // DAILY REVENUE (LAST 7 DAYS)
    // ===============================
    const dailyAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: last7DaysStart, $lte: today },
          orderStatus: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
    ]);

    const dailyRevenue = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(last7DaysStart);
      date.setDate(last7DaysStart.getDate() + i);

      const found = dailyAgg.find(
        (d) =>
          d._id.year === date.getFullYear() &&
          d._id.month === date.getMonth() + 1 &&
          d._id.day === date.getDate(),
      );

      dailyRevenue.push({
        label: `${date.toLocaleString("default", {
          month: "short",
        })} ${date.getDate()}`,
        revenue: found ? found.revenue : 0,
        orders: found ? found.orders : 0,
      });
    }

    // ===============================
    // CATEGORY SALES SHARE (PIE)
    // ===============================
    const categoryAgg = await Order.aggregate([
      { $match: { orderStatus: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category",
          total: { $sum: "$items.quantity" },
        },
      },
    ]);

    const totalCategorySales = categoryAgg.reduce(
      (sum, item) => sum + item.total,
      0,
    );

    const categorySalesShare = categoryAgg.map((item) => ({
      category: item._id,
      percentage:
        totalCategorySales > 0
          ? Number(((item.total / totalCategorySales) * 100).toFixed(1))
          : 0,
    }));

    // ===============================
    // FINAL RESPONSE
    // ===============================
    res.status(200).json({
      success: true,

      summary: {
        sixMonthRevenue: totalRevenue6Months,
        sixMonthOrders: totalOrders6Months,
        avgMonthlyRevenue: Math.round(avgMonthlyRevenue),
        avgOrderValue: Math.round(avgOrderValue),
      },

      monthlyRevenueTrend,
      ordersByStatus,
      dailyRevenue,
      categorySalesShare,
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export default getAnalytics;
