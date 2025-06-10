import {pool}  from '../config/dbConfig.js';
import { generateToken, hashPassword, comparePassword } from '../config/encrypt-decrypt.js';

const signupUser = async (req, res) => {
    try {
        const {firstName, email, password, provider, uid} = req.body;
        
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

        // Include provider information for Google users
        const insertQuery = provider ? 
            'INSERT INTO tbluser(firstName, email, password, provider, uid) VALUES($1, $2, $3, $4, $5) RETURNING *' :
            'INSERT INTO tbluser(firstName, email, password) VALUES($1, $2, $3) RETURNING *';
        
        const insertValues = provider ? 
            [firstName, email, hashedPassword, provider, uid] :
            [firstName, email, hashedPassword];

        const user = await pool.query({
            text: insertQuery,
            values: insertValues
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
        const {email, password, provider, uid} = req.body;

        if(!email) {
            return res.status(400).json({ 
                status: false,
                message: "Email is required" 
            });
        }

        // For Google OAuth users, handle differently
        if (provider === 'google' && uid) {
            const user = await pool.query({
                text: 'SELECT * FROM tbluser WHERE email = $1 AND (provider = $2 OR provider IS NULL)',
                values: [email, provider]
            });

            if(user.rows.length === 0) {
                return res.status(400).json({ 
                    status: false,
                    message: "User with this email does not exist" 
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
        }

        // Regular email/password signin
        if(!password) {
            return res.status(400).json({ 
                status: false,
                message: "Password is required" 
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