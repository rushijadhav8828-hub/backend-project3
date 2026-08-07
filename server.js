const express = require("express");
const db = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Authentication API Running Successfully"
  });
});

console.log("Register API Loaded");

app.post("/register", async (req, res) => {

    console.log("REGISTER HIT");
    console.log(req.body);

    const { name, email, password } = req.body;
    const hashedPassword= await bcrypt.hash(password, 10);

    db.query(
        "INSERT INTO users(name, email, password) VALUES (?, ?, ?)",
        [name, email, hashedPassword],
        (err, result) => {

            if (err) {
              if (err.code === "ER_DUP_ENTRY")
              { 
                return res.status(400).json({
                  message:"Email already exists"
                });
              }
                return res.status(500).json(err);
            }

            res.json({
                message: "User Registered Successfully"
            });

        }
    );

});

//const bcrypt = require("bcrypt");
//const jwt = require("jsonwebtoken");

app.post("/login", (req, res) => {

    const { email, password } = req.body;

    db.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            if (result.length === 0) {
                return res.status(404).json({
                    message: "User Not Found"
                });
            }

            const user = result[0];

            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(401).json({
                    message: "Invalid Password"
                });
            }

            const token = jwt.sign(
                {
                   id: user.id,
                   email: user.email
                },
                "mysecretkey",
                {
                    expiresIn: "1h"
                }
            );

            res.json({
                message: "Login Successful",
                token
            });
        }
    );
  });




app.get("/test", (req, res) => {
  res.send("TEST OK");
})
const verifyToken = (req, res, next) => {

    const authHeader = req.headers.authorization;

if (!authHeader) {
  return res.status(401).json({
    message: "Token Required"
  });
}

const token = authHeader.split(" ")[1];

try {
  const decoded = jwt.verify(token, "mysecretkey");
  req.user = decoded;
  next();
} catch (err) {
  return res.status(403).json({
    message: "Invalid Token"
  });
}
};

app.get("/profile", verifyToken, (req, res) => {

    res.json({
        message: "Welcome User",
        user: req.user
    });

});

app.listen(3000, () => {
    console.log("Server Running On http://localhost:3000");
});