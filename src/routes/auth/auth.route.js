import express from 'express';
import { verifyToken } from '../../middlewares/verify-token.js';
import authController from '../../controllers/auth/auth.controller.js';
import upload from '../../lib/multer.js';

export const authRouter =  express.Router();


/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User Login
 *     description: Logs in a user and returns an authentication token.
 *     tags:
 *       - PUBLISHER AUTH
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email_address:
 *                 type: string
 *                 example: bilal+1@gmail.com
 *               password:
 *                 type: string
 *                 example: 123123123
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: integer
 *                   example: 1
 *                 message:
 *                   type: string
 *                   example: "User login token."
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     token:
 *                       type: string
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
authRouter.post('/login', authController.login);


authRouter.post('/signup-step-one', authController.publisherSignupStepOne);
authRouter.post('/signup-step-two', authController.publisherSignupStepTwo);
authRouter.post('/signup-step-three', authController.publisherSignupStepThree);
authRouter.post('/signup-step-four', upload.single('agreement'), authController.publisherSignupStepFour);
authRouter.post('/signup-step-five', upload.single('signature_image'), authController.publisherSignupStepFive);
authRouter.get('/verify-email', authController.verifyEmail);

authRouter.get('/logout', verifyToken, authController.logout);
// authRouter.get('/profile', verifyToken, authController.getProfile);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get User Profile
 *     description: Retrieve the logged-in user's profile using a JWT token.
 *     tags:
 *       - Publisher - Profile
 *     security:
 *       - JWT: []  # Requires JWT Authentication
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: integer
 *                   example: 1
 *                 message:
 *                   type: string
 *                   example: "User Profile."
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60c72b2f9fd3f946d7e3f5b7"
 *                     email:
 *                       type: string
 *                       example: "bilal+1@gmail.com"
 *                     name:
 *                       type: string
 *                       example: "Bilal Ahmed"
 *       400:
 *         description: User not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: No authorization header provided
 *       500:
 *         description: Internal server error
 */
authRouter.get('/profile', verifyToken, authController.getProfile);


