import swaggerUI from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import createHttpError from 'http-errors';

const SWAGGER_PATH = path.join(process.cwd(), 'docs', 'swagger.json');

export const swaggerDocs = () => {
  return (req, res, next) => {
    try {
      const swaggerDoc = JSON.parse(fs.readFileSync(SWAGGER_PATH, 'utf-8'));

      swaggerUI.serve(req, res, next);
      swaggerUI.setup(swaggerDoc)(req, res, next);
    } catch (err) {
      next(createHttpError(500, "Не вдалося завантажити Swagger документацію"));
    }
  };
};
