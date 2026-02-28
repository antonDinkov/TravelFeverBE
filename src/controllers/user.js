const { Router } = require('express');
const { register, login, updateUserService } = require('../services/user');
const { isGuest, isUser } = require('../middlewares/guards');
const { createToken } = require('../services/jwt');
const { body, validationResult } = require('express-validator');
const { parseError } = require('../utils/errorParser');
const multer = require('multer');
const { User } = require('../models/User');
const { uploadUserToCloudinary } = require('../utils/cloudinaryApi');

const userRouter = Router();

const upload = multer({ dest: 'uploads/' });

userRouter.get('/register', isGuest(), (req, res) => {
    res.render('register', { title: 'Register' });
});
userRouter.post('/register', isGuest(),
    body('firstName').trim().isLength({ min: 4 }).withMessage('Firstname must be atleast 3 characters long'),
    body('lastName').trim().isLength({ min: 4 }).withMessage('Lastname must be atleast 3 characters long'),
    body('email').trim().isEmail().isLength({ min: 10 }).withMessage('Email must be atleast 10 characters long'),
    body('password').trim().isLength({ min: 4 }).withMessage('Password must be atleast 4 characters long'),
    body('repass').trim().custom((value, { req }) => value == req.body.password).withMessage('Password don\'t match'),
    async (req, res) => {
        try {
            const validation = validationResult(req);
            if (!validation.isEmpty()) {
                console.log('Validation errors:', validation.array());
                throw validation.array();
            };

            const lat = req.headers['x-user-lat'];
            const lng = req.headers['x-user-lng'];

            const userData = await register(req.body.email, req.body.firstName, req.body.lastName, req.body.password, lat, lng);

            const token = createToken(userData);

            res.status(201).json({ message: 'User registered successfully', user: userData, token });
        } catch (err) {
            console.error('Error in /register:', err);
            res.status(500).json({ errors: parseError(err).errors });
        }

    });

userRouter.get('/login', isGuest(), (req, res) => {
    res.render('login', { title: 'Login' });
});

userRouter.post('/login',
    isGuest(),
    body('email').trim().isLength({ min: 10 }).withMessage('Email must be atleast 10 characters long'),
    body('password').trim().isLength({ min: 4 }).withMessage('Password must be atleast 4 characters long'),
    async (req, res) => {

        console.log("Login route hit");

        try {
            const validation = validationResult(req);
            if (!validation.isEmpty()) {
                throw validation.array();
            }

            const lat = req.headers['x-user-lat'];
            const lng = req.headers['x-user-lng'];

            const { email, password } = req.body;

            console.log(email, "and ", password);

            const userData = await login(email, password, lat, lng);

            const token = createToken(userData);

            res.status(200).json({
                message: 'User logged in successfully',
                user: userData,
                token,
            });

        } catch (err) {
            e
            const parsed = parseError(rr);
            res.status(parsed.status || 400).json({ errors: parsed.errors });
        }
    }
);


userRouter.get('/logout', isUser(), (req, res) => {
    res.status(200).json({ message: 'Logout successful' });
});


async function updateProfile(req, res) {
    try {
        const userId = req.user._id;
        
        const {
            firstName,
            lastName,
            email,
            removePicture
        } = req.body;
        
        const existingUser = await User.findById(userId);

        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }

        if (email && email !== existingUser.email) {
            const emailTaken = await User.findOne({ email });

            if (emailTaken && emailTaken._id.toString() !== userId.toString()) {
                return res.status(400).json({ message: "Email already in use" });
            }
        }

        let picture = existingUser.picture;
        let pictureId = existingUser.pictureId;

        if (req.file) {
            const imagePath = req.file.path;

            if (pictureId) {
                await deleteFromCloudinary(pictureId);
            }

            const uploadedImage = await uploadUserToCloudinary(imagePath);

            picture = uploadedImage.url;
            pictureId = uploadedImage.public_id;
        }

        if (removePicture === "true") {
            if (pictureId) {
                await deleteFromCloudinary(pictureId);
            }

            picture = null;
            pictureId = "";
        }

        const updatedData = {
            firstName: firstName ?? existingUser.firstName,
            lastName: lastName ?? existingUser.lastName,
            email: email ?? existingUser.email,
            picture,
            pictureId
        };

        const updatedUser = await updateUserService(userId, updatedData);

        res.status(200).json(updatedUser);

    } catch (err) {
        console.error(err);
        const parsedError = parseError(err);
        res.status(500).json({
            message: parsedError.message || "Unknown error"
        });
    }
}

userRouter.put(
    "/profile/edit",
    isUser(),
    upload.single("image"),
    updateProfile
);


module.exports = { userRouter };




/* userRouter.get('/me', async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    try {
        const userData = await getUserById(req.user._id);
        res.json({ user: userData });
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
}) */

/* userRouter.put('/profile/edit',
    body('firstName').trim().isLength({ min: 3 }).withMessage('Firstname must be atleast 3 characters long'),
    body('lastName').trim().isLength({ min: 3 }).withMessage('Lastname must be atleast 3 characters long'),
    body('email').trim().isEmail().isLength({ min: 10 }).withMessage('Email must be atleast 10 characters long'),
    body('password').trim().isLength({ min: 4 }).withMessage('Password must be atleast 4 characters long'),
    body('repass').trim().custom((value, { req }) => value == req.body.password).withMessage('Password don\'t match'),
    async (req, res) => {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ message: 'Unauthorized' });

        try {
            const userData = await updateUserInfo(req.body.oldEmail, req.body.email, req.body.firstName, req.body.lastName, req.body.password, req.body.picture, req.body.pictureId);
            res.json({ user: userData });
        } catch (err) {
            res.status(401).json({ message: err.message });
        }
    })

userRouter.put('/update/profile/remove-picture', async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const email = req.body.email;
        console.log(email);

        const user = await removePicture(email);
        console.log(user);

        res.json({ user });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
})

userRouter.delete('/profile/:id', isUser(), async (req, res) => {
    try {
        const userId = req.user._id;
        await deleteById(userId);
        res.status(200).json({ success: true, message: 'Your Profile is successfully deleted' });
    } catch (err) {
        console.error('Error occurred: ', err);
        res.status(400).json({ success: false, error: err.message || 'Unknown error' });
    }
}); */
