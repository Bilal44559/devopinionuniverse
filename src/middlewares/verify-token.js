import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // console.log("authHeader",authHeader);
  if (!authHeader) {
    return res.status(403).json({ message: 'No authorization header provided' });
  }
  const token = authHeader.split(' ')[1];

  if (!token) {

    return res.status(403).json({ message: 'No token provided' });

  }

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized' });
    } 
    // console.log("decoded", decoded);
    if (decoded.user) {
      req.userId = decoded.user._id;
      // console.log("user data");
    } else if (decoded.adminUser) {
      req.userId = decoded.adminUser._id;
      // console.log("admin data");
    } else {
      req.userId = '';
      // console.log("else"); 
    }
    
    next();
  });
};
