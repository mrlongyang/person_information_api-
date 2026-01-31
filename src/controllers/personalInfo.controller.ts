import { Request, Response } from "express";
import { db } from "../db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export async function createPersonalInfo(req: Request, res: Response) {
    const { firstName, lastName, tel, dateOfBirth, addresses } = req.body;

    // 1. Basic validation
    if (!firstName || !lastName || !tel || !dateOfBirth) {
        return res.status(400).json({ 
            message: "Missing personal information fields"
        });
    }

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        // 1. Insert personal info
        const [personResult] = await conn.execute<ResultSetHeader>(
        `INSERT INTO Tb_PersonalInfo
        (firstname, lastname, tel, dateofbirth)
        VALUES (?, ?, ?, ?)`,
        [firstName, lastName, tel, dateOfBirth]
        );


        const personalId = personResult.insertId;
        // 2. Insert addresses 
        if (Array.isArray(addresses)) {
            for (const addr of addresses) {
                await conn.execute(
                    `INSERT INTO Tb_Address (village, district, province, personalId)
                    VALUES (?, ?, ?, ?)`,
                    [addr.village, addr.district, addr.province, personalId]
                );
            }
        }

        await conn.commit();

        // 3. Build formatted addrsses string

        let formattedAddresses = "";

        if (Array.isArray(addresses)) {
        formattedAddresses = addresses
            .map(
            (a: any) =>
                `village:${a.village}, district:${a.district}, province:${a.province}`
            )
            .join(" | ");
        }

        // 4. Final response (MATCHES YOUR TEMPLATE)
        return res.status(201).json({
            firstName,
            lastName,
            dateOfBirth,
            tel,
            address: formattedAddresses
        });

    } catch (error) {
        await conn.rollback();
        console.error(error);
        return res.status(500).json({ message : "Database error occurred" });
    } finally {
        conn.release();
    }
}

export async function getPersonalInfo(req: Request, res: Response) {
  const { id } = req.params;

    const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT p.id, p.firstname, p.lastname, p.tel,
            TIMESTAMPDIFF(YEAR, p.dateofbirth, CURDATE()) AS age,
            a.id AS addressId, a.village, a.district, a.province
    FROM Tb_PersonalInfo p
    LEFT JOIN Tb_Address a ON p.id = a.personalId
    WHERE p.id = ?`,
    [id]
    );


  if (rows.length === 0) {
    return res.status(404).json({ message: "Not found" });
  }

  const person = {
    id: rows[0].id,
    firstName: rows[0].firstname,
    lastName: rows[0].lastname,
    tel: rows[0].tel,
    age: rows[0].age,
    address: rows
      .filter(r => r.addressId)
      .map(r => ({
        id: r.addressId,
        village: r.village,
        district: r.district,
        province: r.province
      }))
  };

  res.json(person);
}

export async function getAllPersonalInfo(req: Request, res: Response) {
  const [rows] = await db.execute<RowDataPacket[]>(`
    SELECT p.id, p.firstname, p.lastname, p.tel,
           TIMESTAMPDIFF(YEAR, p.dateofbirth, CURDATE()) AS age,
           a.id AS addressId, a.village, a.district, a.province
    FROM Tb_PersonalInfo p
    LEFT JOIN Tb_Address a ON p.id = a.personalId
    ORDER BY p.id
  `);

  const result: any[] = [];

  for (const r of rows) {
    let person = result.find(p => p.id === r.id);

    if (!person) {
      person = {
        id: r.id,
        firstName: r.firstname,
        lastName: r.lastname,
        tel: r.tel,
        age: r.age,
        address: []
      };
      result.push(person);
    }

    if (r.addressId) {
      person.address.push({
        id: r.addressId,
        village: r.village,
        district: r.district,
        province: r.province
      });
    }
  }

  res.json(result);
}
