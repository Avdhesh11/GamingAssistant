// server.ts
import express, { Request, Response } from 'express';
import {resolveQuery} from "./service";

const app = express();
const PORT = process.env.PORT || 7005;

app.use(express.json()); // Middleware to parse JSON bodies

app.post('/resolveQuery', async (req: Request, res: Response) => {
    try {
        const message = await resolveQuery(req.body);
        res.json({ message });
    } catch (error) {
        console.error('Error in /resolveQuery:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
