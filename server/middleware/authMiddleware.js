import JWT from 'jsonwebtoken';


export const authMiddleware = (req, res, next) => {
    const authHeader = req?.headers?.authorization;

    if(!authHeader || !authHeader?.startsWith('Bearer')) {
        return res.status(401).json({
            status: false,
            message:'Header not provided or auth does not start with Bearer',
            error: 'Unauthorized Access',
        });
    }
    
    const token = authHeader?.split(' ')[1];
    try{
        const decoded = JWT.verify(token, process.env.JWT_SECRET_KEY);
        console.log('Decoded:', decoded);
        req.body.user = {
            userId : decoded.payload,
        }
        next();
    }
    catch(error) {
        console.log(error);
        return res.status(401).json({
            status: false,
            message:'Invalid token',
            error: 'Unauthorized Access',
        });
    }
}