import OrderModal from "../../../models/odars/OrderModal.js";
const OdrsController = async (req, res) => {
  try {
    const {
      orderId,
      customer,
      items,
      shippingAddress,
      totalAmount,
      payment,
      orderStatus,
    } = req.body; // ✅ direct body use karo

    if (
      !orderId ||
      !customer ||
      !items ||
      !shippingAddress ||
      !totalAmount ||
      !payment
    ) {
      return res.status(400).json({
        message: "Order requires all mandatory fields",
        status: false,
      });
    }

    const order = await OrderModal.create({
      orderId,
      customer,
      items, // ✅ array as it is
      shippingAddress,
      totalAmount,
      payment,
      orderStatus,
    });

    res.status(201).json({
      message: "Order created successfully",
      order,
      status: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating order",
      error: error.message,
      status: false,
    });
  }
};

export default OdrsController;
