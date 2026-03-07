import express from 'express';
import dotenv from 'dotenv';
import caseRoutes from './routes/case'
import cors from 'cors';
import { authorizeInvestigatorFromBlockchain } from './middleware';


dotenv.config();
const app = express();


app.use(cors())
app.use(express.json());

app.use('/api/v1/case', authorizeInvestigatorFromBlockchain, caseRoutes);

app.listen(5000, () => {
    console.log("Server is running on port 5000")
})