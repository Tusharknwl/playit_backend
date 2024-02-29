import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();


/********Middleware configuration**********/
// to handle the cors
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
// to limit the size of the request
app.use(express.json({limit: '10kb'}))
// to handle the encoded url and limit the size of the request
app.use(express.urlencoded({extended: true, limit: '10kb'}))
app.use(express.static('public'))
app.use(cookieParser())

// import routes
import userRouter from './routes/user.routes.js';

//routes declaration
app.use('/api/v1/users', userRouter)


export {app};
