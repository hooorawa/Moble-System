import jwt from "jsonwebtoken"

const authmiddleware = async (req, res, next) => {
    try {
        // Read token from cookies (set by backend during login)
        const token = req.cookies?.token;
        
        if (!token) {
            return res.status(401).json({ success: false, message: "Not Authorized. Please login again." })
        }
        
        const token_decode = jwt.verify(token, process.env.JWT_SECRET);
        
        // Store user info in req.user (safer than req.body, especially with multer)
        req.user = {
            userId: token_decode.id,
            userRole: token_decode.role
        };
        
        // Also set in req.body for backward compatibility - but only if it exists
        if (req.body && typeof req.body === 'object') {
            req.body.userId = token_decode.id;
            req.body.userRole = token_decode.role;
        }
        
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid or expired token. Please login again." })
    }
}

export default authmiddleware;
