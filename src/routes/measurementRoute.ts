import { Router } from 'express';
import {
  getLastHourAverages,
  getMeasurementsByInterval,
  getMeasurementDataDashboard,
  getMeasurementsDynamic,
} from '../controllers/measurementController';
// import {
//   getAllMeasurements,
//   getMeasurementById,
//   getLastHourAverages,
//   getMeasurementsByInterval,
// } from "../controllers/measurementController";

const router = Router();

// 🔹 Raw data
// router.get("/", getAllMeasurements);
// router.get("/:id", getMeasurementById);

// 🔹 Aggregated data
router.get('/last-hour', getLastHourAverages);
router.get('/aggregate', getMeasurementsByInterval);
router.get('/dynamic', getMeasurementsDynamic);
router.get('/dashboard', getMeasurementDataDashboard);

export default router;
