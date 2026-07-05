import { Router } from 'express';

import {
  createFeature,
  listFeatures,
  toggleFeature,
  updateFeature,
} from '../controllers/FeatureController.js';
import { requireFounderAuth } from '../middlewares/auth.js';
import { validateFeature } from '../validators/feature.validators.js';

export const featureRoutes = Router();

// Secure all feature routes
featureRoutes.use(requireFounderAuth);

featureRoutes.post('/', validateFeature, createFeature);
featureRoutes.get('/', listFeatures);
featureRoutes.put('/:id', validateFeature, updateFeature);
featureRoutes.patch('/:id/toggle', toggleFeature);
