import { Router, type IRouter } from "express";
import healthRouter from "./health";
import categoriesRouter from "./categories";
import productsRouter from "./products";
import adminRouter from "./admin";
import settingsRouter from "./settings";
import ordersRouter from "./orders";
import customersRouter from "./customers";
import discountsRouter from "./discounts";
import reviewsRouter from "./reviews";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(categoriesRouter);
router.use(productsRouter);
router.use(adminRouter);
router.use(settingsRouter);
router.use(ordersRouter);
router.use(customersRouter);
router.use(discountsRouter);
router.use(reviewsRouter);
router.use(analyticsRouter);

export default router;
