import mongoose from "mongoose";

const galleryImageSchema = new mongoose.Schema(
  {
    versions: [
      {
        quality: {
          type: String,
          enum: ["q50", "q100"],
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
    ],
  },
  { timestamps: true },
);

export default mongoose.model("GalleryImage", galleryImageSchema);
