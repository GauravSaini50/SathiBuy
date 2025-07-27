import express from "express";
import connectDB from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();
connectDB();

// const app = express();
// app.use(express.json());

// // Routes
// import userRoutes from "./routes/userRoutes.js";
// app.use("/api/users", userRoutes);

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));



const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const requestRoutes = require('./routes/requests');
const supplierRoutes = require('./routes/suppliers');
const aiRoutes = require('./routes/ai');
const chatRoutes = require('./routes/chat');
const analyticsRoutes = require('./routes/analytics');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sathibuy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/sathibuy-backend/auth', authRoutes);
app.use('/sathibuy-backend/users', userRoutes);
app.use('/sathibuy-backend/groups', groupRoutes);
app.use('/sathibuy-backend/requests', requestRoutes);
app.use('/sathibuy-backend/suppliers', supplierRoutes);
app.use('/sathibuy-backend/ai', aiRoutes);
app.use('/sathibuy-backend/chat', chatRoutes);
app.use('/sathibuy-backend/analytics', analyticsRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});