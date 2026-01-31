import app from "./app";

const PORT = 9990;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});