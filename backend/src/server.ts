import express from "express";
import authRoutes from "./routes/authRoutes.js";


const app = express();


app.use(express.json());


app.get("/", (req, res) => {
    res.send("TaskManager API is running");
});


app.use("/api/auth", authRoutes);


app.listen(5000, () => {
    console.log("Server running on port 5000");
});