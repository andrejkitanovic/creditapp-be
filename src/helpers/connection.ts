import mongoose from 'mongoose';
import { Express } from 'express';

const PORT: number | string = process.env.PORT || 8080;

export default function (app: Express) {
  mongoose.connect(
    process.env.MONGODB_URI || 'mongodb://localhost/credit-app-be',
  );

  const server = app.listen(PORT, () => {
    console.log('Server is on PORT: ', PORT);
  });

  return server;
};
