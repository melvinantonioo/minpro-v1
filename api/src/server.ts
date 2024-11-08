import express, { Request, Response, Application } from 'express';
import { PORT as port } from './config/index';

// import cors from 'cors';

import authRoutes from './routes/authRoutes'
import eventRoutes from './routes/eventRoutes'
import userRoutes from './routes/userRoutes'



const PORT = Number(port) || 8000;

const app: Application = express();

// app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/users', userRoutes);


// Error handling middleware
// app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server jalan di ${PORT}`)
})

export default app;