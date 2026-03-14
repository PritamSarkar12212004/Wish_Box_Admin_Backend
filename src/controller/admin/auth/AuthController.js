import api from "../../../services/axios/api.js";

const OtpCallController = async (req, res) => {
  const { phone } = req.body;
  try {
    const response = await api.post("/api/whatsapp/otp/wishbox", {
      number: phone,
      otp: "123456",
      type: "Login",
    });
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export default OtpCallController;
