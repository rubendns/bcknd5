import express from "express";
import { ProductRouter } from "./routes/products.routes.js";
import { CartsRouter } from "./routes/carts.routes.js";
import handlebars from "express-handlebars";
import { __dirname } from "./utils.js";
import { viewsRouter } from "./routes/views.routes.js";
import { Server } from "socket.io";
import mongoose from "mongoose";
import Handlebars from "handlebars";
import { allowInsecurePrototypeAccess } from "@handlebars/allow-prototype-access";
import messagesDao from "./dao/mdbManagers/messages.dao.js";
import sessionsRouter from "./routes/sessions.routes.js";
import userViewRouter from "./routes/users.views.routes.js";
import session from "express-session";
import MongoStore from "connect-mongo";

const app = express();
const PORT = 8080;
const httpServer = app.listen(PORT, () => {
  `Server listening on port ${PORT}`;
});

const MONGO_URL =
  "mongodb://127.0.0.1:27017/ecommerce?retryWrites=true&w=majority";

app.use(
  session({
    store: MongoStore.create({ mongoUrl: MONGO_URL }),
    mongoOptions: { useNewUrlParser: true, useUnifiedTopology: true },
    ttl: 10 * 60,
    secret: "c0d1g0",
    resave: false,
    saveUninitialized: true,
  })
);

const connectMondoDB = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Successfully connected to the DB using Mongoose");
  } catch (error) {
    console.error("Could not connect to the DB using Mongoose: " + error);
    process.exit();
  }
};

mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to database");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error: " + err);
});

connectMondoDB();

const io = new Server(httpServer);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/products", ProductRouter);
app.use("/api/carts", CartsRouter);

app.engine(
  "hbs",
  handlebars.engine({
    extname: ".hbs",
    defaultLayout: "main",
    handlebars: allowInsecurePrototypeAccess(Handlebars),
  })
);
app.set("view engine", "hbs");
app.set("views", `${__dirname}/views`);

app.use(express.static(`${__dirname}/public`));

app.use("/", viewsRouter);
app.use("/users", userViewRouter);
app.use("/api/sessions", sessionsRouter);

io.on("connection", (socket) => {
  console.log("New client connected: " + socket.id);

  socket.on("message", async (data) => {
    console.log(data);
    await messagesDao.createMessage(data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected: " + socket.id);
  });
});