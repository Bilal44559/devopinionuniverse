import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto'
import { devConfig } from '../config/config.js';
import validator from 'email-validator';

export const getJWTToken = async payload => {
  const token = jwt.sign(
    payload,
    devConfig.secret, {
    expiresIn: '365d',
  }
  );
  return token;
};

export const verifyJWTToken = async (token) => {
  return new Promise((resolve, reject) => {
      jwt.verify(token, devConfig.secret, (err, decoded) => {
          if (err) {
              reject(err);
          } else {
              resolve(decoded);
          }
      });
  });
};

export const getEncryptedPassword = async password => {
  const salt = await bcryptjs.genSalt();
  const hash = await bcryptjs.hash(password, salt);
  return hash;
};

export const checkValidEmail = async (email) => {
  return validator.validate(email);
};

export const randomValueHex = async (len) => {

  let randomstring = crypto.randomBytes(Math.ceil(len / 2))
    .toString('hex') // convert to hexadecimal format
    .slice(0, len).toUpperCase();   // return required number of characters
  return randomstring;
}