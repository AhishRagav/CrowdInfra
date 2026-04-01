const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const getUserModel = require('../models/User')
const path = require('path')
const fs = require('fs')
const colors = require('colors')
const nodemailer = require('nodemailer')

// Use a strong environment-specific secret with fallback for development only
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  console.error(
    'WARNING: JWT_SECRET environment variable not set. Using insecure default for development only.'
  )
}

const saveProfilePhoto = (userId, file) => {
  if (!file) {
    console.log('No file provided for upload')
    return ''
  }

  try {
    // Use an absolute path relative to project root
    const uploadDir = path.join(process.cwd(), 'uploads')
    console.log(`Creating upload directory: ${uploadDir}`)

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
      console.log(`Created directory: ${uploadDir}`)
    }

    // Rest of your function remains the same
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.avif']
    const ext = path.extname(file.originalname).toLowerCase()

    if (!allowedExtensions.includes(ext)) {
      throw new Error('Invalid file type. Only JPG, PNG and GIF are allowed.')
    }

    const filename = `${userId}${ext}`
    const filePath = path.join(uploadDir, filename)

    console.log(`Saving file to: ${filePath}`)
    fs.writeFileSync(filePath, file.buffer)

    console.log(`Profile photo saved: ${filePath}`)

    return `/uploads/${filename}`
  } catch (error) {
    console.error(`Error saving profile photo: ${error}`)
    return '' // Return empty string but don't throw, to continue registration
  }
}

// Generate a stronger 6-digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000) // Generates a 6-digit number (100000-999999)
}

// Use a more persistent storage solution in production
// This is a simple in-memory store for demonstration
let otpStore = {}

//> Send OTP function
const sendOtp = async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email is required' })

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' })
  }

  const otp = generateOtp()
  otpStore[email] = { otp, expires: Date.now() + 300000 } // Expires in 5 min

  // Only log in development environment
  if (process.env.NODE_ENV === 'development') {
    console.log(`OTP for ${email}: ${otp}`) // For debugging only
  }

  try {
    // Validate required environment variables
    if (!process.env.EMAIL || !process.env.PASSWORD) {
      throw new Error('Email service credentials are not properly configured')
    }

    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    })

    await transporter.sendMail({
      from: `"CrowdInfra Security" <${process.env.EMAIL}>`,
      to: email,
      subject: '🔑 Your Secure OTP Code - CrowdInfra',
      html: `
<div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 40px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table width="550px" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12); overflow: hidden; margin: 0 auto;">
          <!-- Header with enhanced gradient and animation -->
          <tr>
            <td style="background: linear-gradient(90deg, #3a7bd5 0%, #00d2ff 100%); padding: 30px 0; text-align: center; position: relative; overflow: hidden;">
              <!-- Animated particles background (fallback to static gradient) -->
              <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: url('${process.env.NEXT_PUBLIC_BACKEND_URL}/particles-bg.png'); background-size: cover; opacity: 0.2;"></div>
              
              <div style="position: relative; z-index: 2;">
                <img src="${process.env.NEXT_PUBLIC_BACKEND_URL}/logo.png" width="80" height="80" style="display: inline-block; border-radius: 50%; background: white; padding: 5px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); transition: transform 0.3s;" alt="CrowdInfra Logo">
                <h1 style="color: #ffffff; font-size: 26px; margin: 15px 0 5px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); letter-spacing: 1.2px; font-weight: 600;">SECURITY VERIFICATION</h1>
                <p style="color: rgba(255, 255, 255, 0.95); font-size: 14px; margin: 0; font-weight: 300; letter-spacing: 0.5px;">Protecting your account with advanced security</p>
              </div>
            </td>
          </tr>
          
          <!-- Main content with improved styling -->
          <tr>
            <td style="padding: 40px 50px 30px;">
              <p style="font-size: 16px; color: #444444; margin-top: 0; font-weight: 500;">Hello,</p>
              <p style="font-size: 16px; color: #555555; line-height: 1.7;">We received a request to verify your identity. Use the verification code below to complete the process:</p>
              
              <!-- Enhanced OTP Display with 3D effect -->
              <div style="text-align: center; margin: 35px 0; perspective: 1000px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center">
                      <div style="display: inline-block; background: linear-gradient(90deg, #3a7bd5 0%, #00d2ff 100%); padding: 3px; border-radius: 12px; box-shadow: 0 15px 30px rgba(58, 123, 213, 0.4); transform: rotateX(10deg); transition: transform 0.3s;">
                        <div style="background: radial-gradient(circle at center, #ffffff 0%, #f8f9fa 100%); border-radius: 10px; padding: 5px;">
                          <span style="display: block; font-size: 42px; font-weight: 700; letter-spacing: 8px; padding: 15px 30px; color: #333; font-family: 'Courier New', monospace; text-shadow: 1px 1px 0 #fff, 2px 2px 0 rgba(0,0,0,0.1);">
                            ${otp}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Improved Timer section with fallback -->
              <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; background-color: #f8f9fa; border-radius: 10px; padding: 15px 25px; box-shadow: 0 3px 10px rgba(0,0,0,0.08);">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td width="24" valign="middle">
                        <!-- Video with image fallback -->
                        <picture>
                          <source srcset="${process.env.NEXT_PUBLIC_BACKEND_URL}/timer" type="video/gif">
                          <img src="${process.env.NEXT_PUBLIC_BACKEND_URL}/timer.png" width="24" height="24" style="display: inline-block; margin-right: 10px;" alt="Timer">
                        </picture>
                      </td>
                      <td valign="middle" style="padding-left: 10px; text-align: left;">
                        <span style="font-size: 14px; color: #555; font-weight: 500;">This code expires in <strong style="color: #3a7bd5;">5 minutes</strong></span>
                      </td>
                    </tr>
                  </table>
                </div>
              </div>
              
              <p style="font-size: 16px; color: #555555; line-height: 1.7;">If you didn't request this code, please ignore this email or <a href="#" style="color: #3a7bd5; text-decoration: none; font-weight: 500; position: relative; display: inline-block; padding-bottom: 2px; border-bottom: 1px solid rgba(58, 123, 213, 0.3); transition: all 0.2s;">contact support</a> if you have concerns.</p>
            </td>
          </tr>
          
          <!-- Enhanced Security tips section -->
          <tr>
            <td style="padding: 0 50px 40px;">
              <div style="background: linear-gradient(to right, #f8f9fa, #ffffff); border-left: 4px solid #ffc107; border-radius: 8px; padding: 20px; box-shadow: 0 3px 15px rgba(0,0,0,0.05);">
                <h3 style="color: #333; font-size: 16px; margin: 0 0 12px; display: flex; align-items: center;">
                  <span style="display: inline-block; width: 20px; height: 20px; margin-right: 10px; position: relative;">
                    <img src="${process.env.NEXT_PUBLIC_BACKEND_URL}/tips.png" width="20" height="20" style="position: relative; z-index: 2;" alt="Security">
                    <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 30px; height: 30px; background: rgba(255, 193, 7, 0.2); border-radius: 50%; z-index: 1;"></span>
                  </span>
                  Security Tip
                </h3>
                <p style="font-size: 14px; color: #555; margin: 0; line-height: 1.7;">
                  CrowdInfra will never ask for your password or full account details via email. Always verify that login pages are secure before entering your credentials.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Visually enhanced Footer -->
          <tr>
            <td style="background: linear-gradient(135deg, #f5f7fa 0%, #e8edf5 100%); padding: 30px 50px; border-top: 1px solid #eaeaea;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="font-size: 13px; color: #888888; margin: 0 0 10px; letter-spacing: 0.5px;">
                      © 2025 CrowdInfra Technologies • All rights reserved
                    </p>
                    <div style="margin: 15px 0;">
                      <!-- Enhanced Social icons -->
                      <a href="#" style="display: inline-block; margin: 0 8px; transition: transform 0.2s;">
                        <img src="https://api.iconify.design/mdi:twitter.svg?color=%233a7bd5" width="22" height="22" alt="Twitter">
                      </a>
                      <a href="#" style="display: inline-block; margin: 0 8px; transition: transform 0.2s;">
                        <img src="https://api.iconify.design/mdi:linkedin.svg?color=%233a7bd5" width="22" height="22" alt="LinkedIn">
                      </a>
                      <a href="#" style="display: inline-block; margin: 0 8px; transition: transform 0.2s;">
                        <img src="https://api.iconify.design/mdi:facebook.svg?color=%233a7bd5" width="22" height="22" alt="Facebook">
                      </a>
                    </div>
                    <p style="font-size: 12px; color: #888888; margin: 15px 0 0;">
                      <a href="#" style="color: #666; text-decoration: none; margin: 0 12px; transition: color 0.2s;">Privacy Policy</a>
                      <a href="#" style="color: #666; text-decoration: none; margin: 0 12px; transition: color 0.2s;">Terms of Service</a>
                      <a href="#" style="color: #666; text-decoration: none; margin: 0 12px; transition: color 0.2s;">Contact Us</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Email client support message -->
        <p style="font-size: 12px; color: #999999; text-align: center; margin-top: 20px;">
          If you're having trouble viewing this email, <a href="#" style="color: #3a7bd5; text-decoration: none;">view it in your browser</a>
        </p>
      </td>
    </tr>
  </table>
</div>

<!-- Embedded Three.js animated background (with fallback) -->
<script type="text/javascript">
  // This script will only run if the email client supports JavaScript (rare in emails)
  // It's included as a progressive enhancement
  try {
    if(typeof THREE !== 'undefined') {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ alpha: true });
      
      renderer.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(renderer.domElement);
      
      const particles = [];
      const particleCount = 100;
      
      for(let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0x3a7bd5 })
        );
        
        particle.position.x = Math.random() * 10 - 5;
        particle.position.y = Math.random() * 10 - 5;
        particle.position.z = Math.random() * 10 - 5;
        
        scene.add(particle);
        particles.push({
          mesh: particle,
          speed: Math.random() * 0.02
        });
      }
      
      camera.position.z = 5;
      
      function animate() {
        requestAnimationFrame(animate);
        
        particles.forEach(p => {
          p.mesh.rotation.x += p.speed;
          p.mesh.rotation.y += p.speed;
        });
        
        renderer.render(scene, camera);
      }
      
      animate();
    }
  } catch(e) {
    // Fallback is the static gradient already in place
    console.log('Three.js not supported in this environment');
  }
</script>
  `,
      text: `
CROWDINFRA SECURITY VERIFICATION

Hello,

We received a request to verify your identity. Use this verification code to complete the process:

${otp}

This code expires in 5 minutes.

If you didn't request this code, please ignore this email or contact support if you have concerns.

SECURITY TIP:
CrowdInfra will never ask for your password or full account details via email. Always verify that login pages are secure before entering your credentials.

© 2025 CrowdInfra Technologies • All rights reserved
  `,
    })

    res.json({ message: 'OTP sent successfully' })
  } catch (error) {
    console.error('OTP sending error:', error.message)
    res
      .status(500)
      .json({ error: 'Failed to send OTP. Please try again later.' })
  }
}

//> Verify OTP function
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' })
  }

  const storedOtpData = otpStore[email]

  if (!storedOtpData) {
    return res
      .status(400)
      .json({ error: 'No OTP was requested for this email' })
  }

  if (Date.now() > storedOtpData.expires) {
    delete otpStore[email] // Clean up expired OTP
    return res
      .status(400)
      .json({ error: 'OTP has expired. Please request a new one.' })
  }

  if (parseInt(otp) !== storedOtpData.otp) {
    return res.status(400).json({ error: 'Invalid OTP' })
  }

  // OTP is valid - clean up and proceed
  delete otpStore[email]
  return res.json({ verified: true, message: 'Email verified successfully' })
}

//> Signup Controller
const signupUser = async (req, res) => {
  const User = await getUserModel()

  const { name, email, password, phone, address, gender } = req.body
  const profilePhoto = req.file // Uploaded file

  try {
    // Input validation
    if (!name || !email || !password) {
      console.log('Missing required fields'.red)
      return res
        .status(400)
        .json({ error: 'Name, email and password are required' })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('Invalid email format'.red)
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Validate password strength
    if (password.length < 6) {
      console.log('Weak password'.red)
      return res
        .status(400)
        .json({ error: 'Password must be at least 6 characters long' })
    }

    // Check if user already exists
    let user = await User.findOne({ email })
    if (user) {
      console.log('User already exists'.red)
      return res.status(400).json({ error: 'User already exists' })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Step 1: Create User First (Without Profile Photo)
    user = new User({
      name,
      email,
      password: hashedPassword,
      phone: phone || '',
      address: address || '',
      gender: gender || '',
      profile_image: '', // Initially empty
    })

    await user.save() // Save user to generate `_id`

    // Step 2: Now Save Profile Photo with `_id`
    let profileImagePath = ''
    if (profilePhoto) {
      try {
        profileImagePath = saveProfilePhoto(user._id, profilePhoto)
        user.profile_image = profileImagePath
        await user.save() // Update user with image path
      } catch (photoError) {
        console.error('Profile photo error:', photoError.message)
        // Continue registration even if photo upload fails
      }
    }

    // Return response (exclude password from response)
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        gender: user.gender,
        profile_image: profileImagePath,
        role: user.role,
        createdAt: user.createdAt,
      },
    })
  } catch (err) {
    console.error('Signup error:', err.message)
    res
      .status(500)
      .json({ error: 'Server error during registration. Please try again.' })
  }
}

// > Login Controller
const loginUser = async (req, res) => {
  const User = await getUserModel()
  const { email, password } = req.body

  try {
    // Input validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Check if user exists
    let user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' })
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' })
    }

    // Generate JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    }

    // Make sure JWT_SECRET is defined before signing
    if (!JWT_SECRET) {
      return res
        .status(500)
        .json({ error: 'Authentication service misconfigured' })
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '10h' })

    // Set cookie based on environment
    const isProduction = process.env.NODE_ENV === 'production'

    res.cookie('crowdInfra_token', token, {
      httpOnly: true, 
      secure: true,
      sameSite: 'None', 
      partitioned: true,
      maxAge: 10 * 60 * 60 * 1000,
    })

    res.status(200).json({ message: 'Login successful', success: true })
  } catch (err) {
    console.error('Login error:', err.message)
    res
      .status(500)
      .json({ error: 'Server error during login. Please try again.' })
  }
}

//> Logout controller
const logoutUser = (req, res) => {
  res.clearCookie('crowdInfra_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Only secure in production
    sameSite: 'Strict',
  })

  res.status(200).json({ success: true, message: 'Logged out successfully' })
}

module.exports = {
  signupUser,
  loginUser,
  logoutUser,
  sendOtp,
  verifyOtp,
}

