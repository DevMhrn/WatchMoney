import bcrypt from 'bcrypt';
import JWT from 'jsonwebtoken';


export const hashPassword =  async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}

export const comparePassword = async (password, hashedPassword) => {
    try {
        const match =  await bcrypt.compare(password, hashedPassword);
        return match;
    } catch (error) {
        console.log(error);
        return false;
        
    }
}

export const generateToken = (payload) => {
    console.log('Payload:', payload);
    try {
        return JWT.sign({
            payload   
        }, 
        process.env.JWT_SECRET_KEY, 
        { 
            expiresIn: '24h'  // Correct format for expiresIn
        });
    } catch (error) {   
        console.log('Token generation error:', error);
        throw error;
    }
}