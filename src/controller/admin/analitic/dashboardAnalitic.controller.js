import Order from "../../../models/odars/OrderModal.js";
import Product from "../../../models/product/ProductModal.js";
import User from "../../../models/client/ClientModal.js";

const getDashboardData = async (req, res) => {
  try {
    const now = new Date();

    // ===============================
    // DATE RANGES
    // ===============================
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // ===============================
    // TOTAL REVENUE (All Time)
    // ===============================
    const totalRevenueAgg = await Order.aggregate([
      { $match: { orderStatus: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    // ===============================
    // MONTHLY REVENUE
    // ===============================
    const lastMonthRevenueAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: firstDayLastMonth, $lte: lastDayLastMonth },
          orderStatus: { $ne: "cancelled" },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const currentMonthRevenueAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: firstDayThisMonth },
          orderStatus: { $ne: "cancelled" },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const lastMonthRevenue = lastMonthRevenueAgg[0]?.total || 0;
    const currentMonthRevenue = currentMonthRevenueAgg[0]?.total || 0;

    const revenueGrowth =
      lastMonthRevenue > 0
        ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

    // ===============================
    // TOTAL ORDERS + GROWTH
    // ===============================
    const totalOrders = await Order.countDocuments({
      orderStatus: { $ne: "cancelled" },
    });

    const lastMonthOrders = await Order.countDocuments({
      createdAt: { $gte: firstDayLastMonth, $lte: lastDayLastMonth },
      orderStatus: { $ne: "cancelled" },
    });

    const currentMonthOrders = await Order.countDocuments({
      createdAt: { $gte: firstDayThisMonth },
      orderStatus: { $ne: "cancelled" },
    });

    const orderGrowth =
      lastMonthOrders > 0
        ? ((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100
        : 0;

    // ===============================
    // PRODUCTS + CUSTOMERS
    // ===============================
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalCustomers = await User.countDocuments();

    // ===============================
    // LAST 7 DAYS GRAPH
    // ===============================
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(today.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const rawData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: today },
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

    const last7DaysGraph = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      const found = rawData.find(
        (item) =>
          item._id.year === year &&
          item._id.month === month &&
          item._id.day === day,
      );

      const revenue = found ? found.revenue : 0;
      const orders = found ? found.orders : 0;

      const monthShort = date.toLocaleString("default", { month: "short" });
      const dayName = date.toLocaleString("default", { weekday: "short" });

      last7DaysGraph.push({
        date: `${year}-${month}-${day}`,
        label: `${monthShort} ${day} (${dayName})`,
        revenue,
        orders,
        description:
          orders > 0
            ? `${orders} orders placed generating ₹${revenue.toLocaleString()} revenue`
            : "No orders on this day",
      });
    }

    // ===============================
    // CATEGORY DISTRIBUTION (Pie Chart)
    // ===============================
    const categoryAgg = await Order.aggregate([
      { $match: { orderStatus: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productData",
        },
      },
      { $unwind: "$productData" },
      {
        $group: {
          _id: "$productData.category",
          total: { $sum: "$items.quantity" },
        },
      },
    ]);

    const totalCategorySales = categoryAgg.reduce(
      (acc, item) => acc + item.total,
      0,
    );

    // Light theme friendly colors
    const lightColors = [
      "#FFB3BA", // pink
      "#BAE1FF", // light blue
      "#BAFFC9", // light green
      "#FFFFBA", // light yellow
      "#FFDFBA", // light orange
      "#E2BAFF", // light purple
      "#FFC9DE", // light rose
      "#C9FFFF", // cyan
      "#FFE2BA", // peach
    ];

    // Map categoryDistribution with random colors
    const categoryDistribution = categoryAgg.map((item, index) => ({
      category: item._id,
      percentage:
        totalCategorySales > 0
          ? Number(((item.total / totalCategorySales) * 100).toFixed(1))
          : 0,
      color: lightColors[index % lightColors.length], // repeat colors if more categories
    }));

    // ===============================
    // RECENT ORDERS
    // ===============================
    const recentOrders = await Order.find({
      orderStatus: { $ne: "cancelled" },
    })
      .populate({
        path: "customer",
        select: "name whatsappNumber", // jo fields chahiye
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("orderId totalAmount orderStatus createdAt customer");

    // ===============================
    // TOP PRODUCTS
    // ===============================
    const topProductsAgg = await Order.aggregate([
      { $match: { orderStatus: { $ne: "cancelled" } } },
      { $unwind: "$items" },

      // Join with Product collection to get category
      {
        $lookup: {
          from: "products", // Product collection
          localField: "items.product", // ObjectId reference in Order.items
          foreignField: "_id",
          as: "productData",
        },
      },
      { $unwind: "$productData" }, // Flatten array

      {
        $group: {
          _id: "$items.title", // group by product title
          sales: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
          image: { $first: "$items.image.url" },
          category: { $first: "$productData.category" },
        },
      },
      { $sort: { sales: -1 } },
      { $limit: 5 },
    ]);

    // Format output cleanly
    const topProducts = topProductsAgg.map((item) => ({
      product: item._id,
      sales: item.sales,
      revenue: item.revenue,
      image: item.image || null,
      category: item.category || null,
    }));

    // ===============================
    // FINAL RESPONSE
    // ===============================
    res.status(200).json({
      success: true,
      summaryCards: {
        totalRevenue,
        revenueGrowth: Number(revenueGrowth.toFixed(2)),
        totalOrders,
        orderGrowth: Number(orderGrowth.toFixed(2)),
        totalProducts,
        totalCustomers,
      },
      last7DaysGraph,
      categoryDistribution,
      recentOrders,
      topProducts,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default getDashboardData;
