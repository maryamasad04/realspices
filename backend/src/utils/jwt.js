import jwt from 'jsonwebtoken';

export const generateToken = (userId, role = 'USER') => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};
