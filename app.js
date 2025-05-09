const express = require("express");
const app = express();
const path = require("path");
const session = require("express-session");
const passport = require("./config/passport");
const env = require("dotenv").config();
const db = require("./config/db");
const userRouter = require("./routes/userRouter");
const adminRouter = require("./routes/adminRouter");
const MongoStore = require("connect-mongo");

// Connect to DB
db();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
        mongoUrl: process.env.MONGODB_URI,
        ttl: 24 * 60 * 60 // 1 day
    }),
    cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Make user available to all views
app.use((req, res, next) => {
    res.locals.user = req.user || req.session.user || null;
    next();
});

// View engine setup
app.set("view engine", "ejs");
app.set("views", [
    path.join(__dirname, "views"),
    path.join(__dirname, "views/user"), 
    path.join(__dirname, "views/admin")
]);

// app.set("views", path.join(__dirname, "views"));



// Static files
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/", userRouter);
app.use("/admin", adminRouter)

// Prevent caching
app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = app;

