import mysql from "mysql2/promise";


export const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password:"tryappserv",
    database: "personal_information_api",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});