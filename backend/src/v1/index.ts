import express from 'express';
import dotenv from 'dotenv';
import caseRoutes from './routes/case';
import folderRoutes from './routes/folder';
import eventRoute from './routes/event'
import cors from 'cors';
import { authorizeInvestigatorFromBlockchain } from './middleware';


import { setupBlockchainListeners } from '../listeners/blockchainEvents';
import pinataRoutes from './routes/pinata';

dotenv.config();
const app = express();

app.use(cors())
app.use(express.json());

// Initialize Blockchain listeners
setupBlockchainListeners();

app.use('/api/v1/case', authorizeInvestigatorFromBlockchain, caseRoutes);
app.use('/api/v1/folder', authorizeInvestigatorFromBlockchain, folderRoutes);
app.use('/api/v1/pinata', authorizeInvestigatorFromBlockchain, pinataRoutes);
app.use('/api/v1/event', authorizeInvestigatorFromBlockchain, eventRoute)

app.listen(5000, () => {
    console.log("Server is running on port 5000")
})