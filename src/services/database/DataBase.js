import mongoose from "mongoose";
const DataBase = async () => {
  try {
   await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to database successfully");
  } catch (error) {
    console.log(`Error in connecting to database: ${error}`);
  }
};
export default DataBase;
