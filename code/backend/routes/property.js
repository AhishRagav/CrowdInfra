const express = require('express')
const { property, getProperty, getPropertyById } = require('../controllers/propertyController')
const router = express.Router()

router.post('/property', property)
router.get('/getProperty', getProperty)
router.get('/getPropertyById/:id', getPropertyById) 

module.exports = router