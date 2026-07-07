import { Router } from 'express';

import {
    createFeature,
    listFeatures,
    toggleFeature,
    updateFeature,
} from '../controllers/FeatureController.js';
import { requireApiKey } from '../middlewares/apiKeyAuth.js';
import { validateFeature } from '../validators/feature.validators.js';

export const featureRoutes = Router();

// Secure all feature routes
featureRoutes.use(requireApiKey);

featureRoutes.post('/', validateFeature, createFeature);
featureRoutes.get('/', listFeatures);
featureRoutes.put('/:id', validateFeature, updateFeature);
featureRoutes.patch('/:id/toggle', toggleFeature);
