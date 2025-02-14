import { StatusCodes } from 'http-status-codes';
export default {
    
    testing: async (req, res) => {
        console.log('req: running');
        try {
            res.status(StatusCodes.OK).json({});
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server error' });
        }
    },

};
