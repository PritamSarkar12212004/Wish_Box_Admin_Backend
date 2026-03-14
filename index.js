import express from "express";
import dns from "node:dns/promises";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import DataBase from "./src/services/database/DataBase.js";
import AdminRoute from "./src/routes/admin/AdminRoute.js";

dotenv.config({ quiet: true });
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();
const port = process.env.port || 3000;

app.use(express.json());
app.use(
  cors({
    origin: "*",
  }),
);
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/api/admin", AdminRoute);

DataBase()
  .then(() => {
    app.listen(port, () => {
      console.log(`server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(`Error in connecting to database: ${err}`);
  });
