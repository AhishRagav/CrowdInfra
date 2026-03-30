const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Fallback for JWT_SECRET if not set in the environment variables
const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key";

// Signup Route
router.post(
  "/signup",
  [
    body("firstName").not().isEmpty().withMessage("First name is required"),
    body("lastName").not().isEmpty().withMessage("Last name is required"),
    body("dob").isDate().withMessage("Date of birth must be a valid date"),
    body("gender").isIn(["Male", "Female", "Other"]).withMessage("Gender must be Male, Female, or Other"),
    body("status").not().isEmpty().withMessage("Status is required"),
    body("email").isEmail().withMessage("Please include a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, dob, gender, status, partnerName, email, password } = req.body;

    try {
      // Check if the user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ msg: "User already exists" });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new user instance
      user = new User({
        firstName,
        lastName,
        dob,
        gender,
        status,
        partnerName: partnerName || null,
        email,
        password: hashedPassword,
      });

      // Save the user to the database
      await user.save();

      // Generate a JWT token
      const payload = {
        user: { id: user.id },
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

      res.status(201).json({ msg: "User registered successfully", token });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// Login Route
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please include a valid email"),
    body("password").exists().withMessage("Password is required"),
  ],
  async (req, res) => {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check if the user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: "Invalid credentials" });
      }

      // Check if the password matches
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Invalid credentials" });
      }

      // Generate a JWT token
      const payload = {
        user: { id: user.id },
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
      console.log(token);
      res.json({ msg: "Login successful", token });
      
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

module.exports = router;