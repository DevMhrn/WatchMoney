import { pool } from "../config/dbConfig.js";

export const getAccountTypes = async (req, res) => {
    try {
        const accountTypes = await pool.query({
            text: 'SELECT * FROM tblaccounttype WHERE is_active = true ORDER BY type_name',
            values: []
        });

        return res.status(200).json({ 
            status: true,
            accountTypes: accountTypes.rows
        });
        
    } catch (error) {
        console.log(error);
        return res.status(400).json({ 
            status: false,
            error: error.message
        });
    }
};

export const createAccountType = async (req, res) => {
    try {
        const { type_name, description, icon_name } = req.body;
        
        if (!type_name) {
            return res.status(400).json({
                status: false,
                message: "Account type name is required"
            });
        }

        const newAccountType = await pool.query({
            text: 'INSERT INTO tblaccounttype (type_name, description, icon_name) VALUES ($1, $2, $3) RETURNING *',
            values: [type_name, description, icon_name]
        });

        return res.status(201).json({
            status: true,
            message: "Account type created successfully",
            accountType: newAccountType.rows[0]
        });
        
    } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
            return res.status(400).json({ 
                status: false,
                message: "Account type already exists"
            });
        }
        
        console.log(error);
        return res.status(400).json({ 
            status: false,
            error: error.message
        });
    }
};
