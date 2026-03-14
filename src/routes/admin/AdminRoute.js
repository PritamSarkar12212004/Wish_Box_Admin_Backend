import express from "express";
import routeHandler from "express-async-handler";
import ProductUploadController from "../../controller/admin/Product/ProductUploadController.js";
import CollectionCreateController from "../../controller/admin/Product/CollectionCreateController.js";
import OdrsController from "../../controller/admin/ords/OdrsController.js";
import getDashboardStats from "../../controller/admin/analitic/dashboardAnalitic.controller.js";
import getAnalytics from "../../controller/admin/analitic/analytics.controller.js";
import OrderGetDataController from "../../controller/admin/ords/OrderGetDataController.js";
import customargetData from "../../controller/admin/analitic/customargetData.controller.js";
import OtpCallController from "../../controller/admin/auth/AuthController.js";
import CollectionDataFetchController from "../../controller/admin/Product/CollectionDataFetchController.js";
import CollectionUpdateController from "../../controller/admin/Product/CollectionUpdateController.js";
import FetxhProductController from "../../controller/admin/Product/FetxhProductController.js";
const route = express.Router();
route.post("/product/upload", routeHandler(ProductUploadController));
route.post("/product/fetch/data", routeHandler(FetxhProductController));
route.post("/collection/create", routeHandler(CollectionCreateController));
route.post(
  "/collection/fetch/data",
  routeHandler(CollectionDataFetchController),
);
route.post("/collection/update", routeHandler(CollectionUpdateController));
route.post("/create/order", routeHandler(OdrsController));
route.post("/orders/getdata", routeHandler(OrderGetDataController));
route.post("/customar/getdata", routeHandler(customargetData));
route.post("/analitics/dashboard", routeHandler(getDashboardStats));
route.post("/analitics/analize", routeHandler(getAnalytics));
// auth
route.post("/auth/login/otp", routeHandler(OtpCallController));
export default route;
