import mongoose from "mongoose";
const imageSchema = new mongoose.Schema(
  {
    quality: {
      type: String,
      enum: ["q30", "q50", "q75", "q100"],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    public_id: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);
const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    tags: [{ type: String }],
    pricing: {
      originalPrice: { type: Number, required: true },
      salePrice: { type: Number, required: true },
      totalSaving: { type: Number, default: 0 },
    },
    stock: { type: Number, default: 0 },
    stockStatus: {
      type: String,
      enum: ["in_stock", "out_of_stock"],
      default: "in_stock",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    isActive: { type: Boolean, default: true },
    paperSpecs: {
      gsm: { type: Number, required: true },
      height: { type: Number, required: true },
      width: { type: Number, required: true },
      unit: {
        type: String,
        enum: ["cm", "inch"],
        default: "cm",
      },
    },
    images: {
      primary: [imageSchema],
    },
    gallery: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GalleryImage",
      },
    ],
    productCollection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Product", productSchema);
