import { Request, Response, NextFunction } from 'express';
import { formatErrorResponse } from '../../utils/formatters/apiResponseFormatter';

export const validateSchema = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      res.status(400).json(formatErrorResponse(error.details[0].message));
      return;
    }
    
    next();
  };
};