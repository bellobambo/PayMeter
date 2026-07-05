import type { NextFunction, Response } from 'express';

import { supabase } from '../config/supabase.js';
import { successResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';
import type { AuthenticatedRequest } from '../middlewares/auth.js';

export async function createFeature(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const founderId = req.founder?.id;
    const { name, price } = req.body;

    if (!founderId) {
      throw new AppError('Unauthorized.', 401);
    }

    // Check unique name for this founder
    const { data: existing } = await supabase
      .from('features')
      .select('id')
      .eq('founder_id', founderId)
      .eq('name', name)
      .maybeSingle();

    if (existing) {
      throw new AppError('Feature with this name already exists.', 409, {
        name: 'You have already defined a feature with this name.',
      });
    }

    const { data: feature, error } = await supabase
      .from('features')
      .insert({
        founder_id: founderId,
        name,
        price,
        is_active: true,
      })
      .select('*')
      .single();

    if (error || !feature) {
      throw new AppError('Unable to create feature. Please try again.', 500);
    }

    return successResponse(res, {
      statusCode: 201,
      message: 'Feature created successfully.',
      data: {
        id: feature.id,
        name: feature.name,
        price: Number(feature.price),
        isActive: feature.is_active,
        createdAt: feature.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listFeatures(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const founderId = req.founder?.id;

    if (!founderId) {
      throw new AppError('Unauthorized.', 401);
    }

    const { data: features, error } = await supabase
      .from('features')
      .select('*')
      .eq('founder_id', founderId)
      .order('created_at', { ascending: false });

    if (error || !features) {
      throw new AppError('Unable to retrieve features. Please try again.', 500);
    }

    const mappedFeatures = features.map((f) => ({
      id: f.id,
      name: f.name,
      price: Number(f.price),
      isActive: f.is_active,
      createdAt: f.created_at,
    }));

    return successResponse(res, {
      message: 'Features retrieved successfully.',
      data: mappedFeatures,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateFeature(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const founderId = req.founder?.id;
    const { id } = req.params;
    const { name, price } = req.body;

    if (!founderId) {
      throw new AppError('Unauthorized.', 401);
    }

    // Check if feature exists and belongs to this founder
    const { data: existing } = await supabase
      .from('features')
      .select('*')
      .eq('id', id)
      .eq('founder_id', founderId)
      .maybeSingle();

    if (!existing) {
      throw new AppError('Feature not found or unauthorized.', 404);
    }

    // Check if name is changing and clashes with another feature
    if (name !== existing.name) {
      const { data: nameClash } = await supabase
        .from('features')
        .select('id')
        .eq('founder_id', founderId)
        .eq('name', name)
        .maybeSingle();

      if (nameClash) {
        throw new AppError('Feature name already in use.', 409, {
          name: 'Another feature already exists with this name.',
        });
      }
    }

    const { data: updated, error } = await supabase
      .from('features')
      .update({
        name,
        price,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !updated) {
      throw new AppError('Unable to update feature. Please try again.', 500);
    }

    return successResponse(res, {
      message: 'Feature updated successfully.',
      data: {
        id: updated.id,
        name: updated.name,
        price: Number(updated.price),
        isActive: updated.is_active,
        updatedAt: updated.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleFeature(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const founderId = req.founder?.id;
    const { id } = req.params;

    if (!founderId) {
      throw new AppError('Unauthorized.', 401);
    }

    // Fetch current state
    const { data: existing } = await supabase
      .from('features')
      .select('*')
      .eq('id', id)
      .eq('founder_id', founderId)
      .maybeSingle();

    if (!existing) {
      throw new AppError('Feature not found or unauthorized.', 404);
    }

    const newStatus = !existing.is_active;

    const { data: updated, error } = await supabase
      .from('features')
      .update({
        is_active: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !updated) {
      throw new AppError('Unable to toggle feature status. Please try again.', 500);
    }

    return successResponse(res, {
      message: `Feature ${newStatus ? 'activated' : 'deactivated'} successfully.`,
      data: {
        id: updated.id,
        name: updated.name,
        price: Number(updated.price),
        isActive: updated.is_active,
        updatedAt: updated.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
}
