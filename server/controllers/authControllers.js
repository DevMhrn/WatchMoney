import {pool}  from '../config/dbConfig.js';
import { generateToken, hashPassword, comparePassword } from '../config/encrypt-decrypt.js';

const signupUser = async (req, res) => {
    try {
        const {firstName, email, password} = req.body;
        
        if(!firstName || !email || !password) {
            return res.status(400).json({ 
                status: false,
                message: "Please provide all required fields" 
            });
        }

        // Check for existing user - modified to properly check existence
        const existingUser = await pool.query({
            text: 'SELECT * FROM tbluser WHERE email = $1',
            values: [email]
        });

        if(existingUser.rows.length > 0) {
            return res.status(400).json({ 
                status: false,
                message: "User with this email already exists" 
            });
        }

        const hashedPassword = await hashPassword(password);

        const user = await pool.query({
            text: 'INSERT INTO tbluser(firstName, email, password) VALUES($1, $2, $3) RETURNING *',
            values: [firstName, email, hashedPassword]
        });

        // Generate token for new user
        const token = generateToken(user.rows[0].id);
        
        // Remove password from response
        const userResponse = { ...user.rows[0] };
        delete userResponse.password;

        return res.status(201).json({ 
            status: true,
            message: "Signup successful",
            user: userResponse,
            token
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({ 
            status: false,
            error: error.message,
            message: "Signup failed, please try again"
        });
    }
};

const signinUser = async (req, res) => {
    try {
        const {email, password} = req.body;

        if(!email || !password) {
            return res.status(400).json({ 
                status: false,
                message: "Please provide all required fields" 
            });
        }

        const user = await pool.query({
            text: 'SELECT * FROM tbluser WHERE email = $1',
            values: [email]
        });

        if(user.rows.length === 0) {
            return res.status(400).json({ 
                status: false,
                message: "User with this email does not exist" 
            });
        }

        const match = await comparePassword(password, user.rows[0].password);
        if(!match) {
            return res.status(400).json({ 
                status: false,
                message: "Invalid password, please try again" 
            });
        }

        const token = generateToken(user.rows[0].id);
        
        // Remove password from response
        const userResponse = { ...user.rows[0] };
        delete userResponse.password;

        return res.status(200).json({
            status: true,
            message: "Signin successful",
            user: userResponse,
            token
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({ 
            status: false,
            error: error.message
        });
    }
};

export { signupUser, signinUser };