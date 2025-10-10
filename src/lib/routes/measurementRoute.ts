import { Router } from 'express';
import {
  getLastHourAverages,
  getMeasurementsByInterval,
} from '../../controllers/measurementController';
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
router.get('/aggregate/last-hour', getLastHourAverages);
router.get('/aggregate', getMeasurementsByInterval);

export default router;
