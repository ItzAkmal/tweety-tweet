"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const express_1 = require("express");
const http_status_codes_1 = require("http-status-codes");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../entity/User"));
const auth_1 = __importDefault(require("../middlewares/auth"));
const registerSchema_1 = __importDefault(require("../validation/registerSchema"));
const router = express_1.Router();
// Get all users
router.get('/', auth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.admin) {
            res.status(http_status_codes_1.StatusCodes.FORBIDDEN);
            throw new Error('Access denied');
        }
        const users = yield User_1.default.find();
        if (!users) {
            res.status(http_status_codes_1.StatusCodes.NOT_FOUND);
            throw new Error('No users found');
        }
        res.status(http_status_codes_1.StatusCodes.OK).json(users);
    }
    catch (error) {
        next(error);
    }
}));
// Get one user
router.get('/profile/:id', auth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.default.find({ id: req.params.id });
        if (!user) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST);
            throw new Error('User not found');
        }
        res.status(http_status_codes_1.StatusCodes.OK).json(user);
    }
    catch (error) {
        next(error);
    }
}));
// Signup new user
router.post('/signup', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password, displayName, bio } = req.body;
        const { error } = registerSchema_1.default.validate(req.body);
        if (error) {
            const [err] = error.details;
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST);
            throw err;
        }
        const emailExists = yield User_1.default.findOne({ email: email });
        if (emailExists) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST);
            throw new Error('User already exists with given email');
        }
        // TODO: use lowercase to make unique
        const usernameExists = yield User_1.default.findOne({ username: username.toLowerCase() });
        if (usernameExists) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST);
            throw new Error('User already exists with given username');
        }
        const salt = yield bcryptjs_1.default.genSalt();
        const passwordHash = yield bcryptjs_1.default.hash(password, salt);
        const newUser = yield User_1.default.create({
            username: username.toLowerCase(),
            displayName,
            bio,
            email,
            password: passwordHash,
        });
        yield newUser.save();
        res.status(http_status_codes_1.StatusCodes.OK).json({ success: true });
    }
    catch (error) {
        next(error);
    }
}));
// Signin as user
router.post('/signin', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield User_1.default.findOne({ email });
        if (!user) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST);
            throw new Error('Invalid Credentials');
        }
        const validated = yield bcryptjs_1.default.compare(password, user.password);
        if (!validated) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST);
            throw new Error('Invalid Credentials');
        }
        const payload = {
            id: user.id,
        };
        const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'sercet', {
            expiresIn: '24h',
        });
        const refreshToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_REFRESH_SECRET || 'sercet', {
            expiresIn: '1y',
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            id: user.id,
            token: token,
            refreshToken: refreshToken,
        });
    }
    catch (error) {
        next(error);
    }
}));
// Refreshes the authorization token
router.get('/refreshtoken', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const refreshToken = req.headers['refresh-token'];
        if (!refreshToken) {
            res.status(http_status_codes_1.StatusCodes.FORBIDDEN);
            throw new Error('Access denied');
        }
        const verifiedUser = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'sercet');
        if (!verifiedUser) {
            res.status(http_status_codes_1.StatusCodes.FORBIDDEN);
            throw new Error('Access denied');
        }
        const payload = {
            id: verifiedUser.id,
        };
        const newToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'sercet', {
            expiresIn: '24h',
        });
        const newRefreshToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_REFRESH_SECRET || 'sercet', {
            expiresIn: '1y',
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            id: verifiedUser.id,
            token: newToken,
            refreshToken: newRefreshToken,
        });
    }
    catch (error) {
        next(error);
    }
}));
// Get authenticated users data
router.get('/info/:id', auth_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.default.findOne({ id: req.params.id });
        if (!user) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST);
            throw new Error('User not found');
        }
        const data = {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            bio: user.bio,
            createdAt: user.createdAt,
            isAdmin: user.isAdmin,
        };
        res.status(http_status_codes_1.StatusCodes.OK).json(data);
    }
    catch (error) {
        next(error);
    }
}));
// Check if a user is admin
router.get('/isadmin/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.default.findOne({ id: req.params.id });
        if (!user) {
            res.status(http_status_codes_1.StatusCodes.NOT_FOUND);
            throw new Error('User not found');
        }
        res.status(http_status_codes_1.StatusCodes.OK).json({ isAdmin: user.isAdmin, id: user.id });
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;