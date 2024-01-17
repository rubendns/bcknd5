import { Router } from "express";
import userModel from "../dao/models/user.model.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { first_name, last_name, email, age, password } = req.body;
  console.log("Registrando usuario:");
  console.log(req.body);

  const exist = await userModel.findOne({ email });
  if (exist) {
    return res
      .status(400)
      .send({ status: "error", message: "User already exists" });
  }

  const user = {
    first_name,
    last_name,
    email,
    age,
    password,
  };

  const result = await userModel.create(user);
  res.send({
    status: "success",
    message: "Successfully created user with ID: " + result.id,
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (email === "adminCoder@coder.com" && password === "adminCod3r123") {
    req.session.rol = "admin";
    req.session.user = {
      name: "Admin",
      email: "adminCoder@coder.com",
      rol: "admin",
      age: 0,
    };

    return res.send({
      status: "success",
      payload: req.session.user,
      message: "Admin login done :)",
    });
  }

  const user = await userModel.findOne({ email, password });

  if (!user) {
    return res
      .status(401)
      .send({ status: "error", error: "Incorrect credentials" });
  }

  req.session.rol = "user";
  req.session.user = {
    name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    rol: req.session.rol,
    age: user.age,
  };

  res.send({
    status: "success",
    payload: req.session.user,
    message: "User login done :)",
  });
});


router.post("/logout", (req, res) => {
  const userName = req.session.user ? req.session.user.name : "Unknown User";
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res
        .status(500)
        .send({ status: "error", msg: "Internal Server Error" });
    }
    console.log(`User ${userName} logged out successfully.`);
    res.redirect("/users/login");
  });
});

export default router;
