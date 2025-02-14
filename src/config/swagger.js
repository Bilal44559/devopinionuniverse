import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Opinion Universe API",
            version: "1.0.0",
            description: "API documentation for Opinion Universe",
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "Local server",
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        }
    },
    // apis: ["./routes/*.js"], // Yahan apni route files ka path den
    apis: [path.join(__dirname, "../routes/**/*.js")], 
    // apis: [path.join(__dirname, "../routes/auth/auth.route.js")], 

};

const swaggerSpec = swaggerJsDoc(options);

const swaggerDocs = (app) => {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

// module.exports = swaggerDocs;
export default swaggerDocs;