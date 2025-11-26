import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();


const MONGO_URL = process.env.MONGO_URL || 'mongodb://atlas-sql-690e67c070608c2503b1e195-bpijjp.a.query.mongodb.net/sample_mflix?ssl=true&authSource=admin';

mongoose.connect(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB Atlas connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

export default mongoose;
