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
app.use(express.urlencoded({
    extended: true,
    limit: '10kb'
}))

app.use(express.static('public'))

app.use(cookieParser())


export {app};
