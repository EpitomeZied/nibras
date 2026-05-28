-- Add rating badge category for competitive programming peak-rating achievements
ALTER TYPE "BadgeCategory" ADD VALUE IF NOT EXISTS 'rating';
