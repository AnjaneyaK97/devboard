import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../src/models/index.js';
import { generateAccessToken } from '../src/services/auth.service.js';

let mongoServer;

export const setupTestDB = () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  }, 30000);

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });
};

export const createTestUser = async (overrides = {}) => {
  const defaultUser = {
    name: 'Test Seeker',
    email: `seeker_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`,
    password: 'Password123!',
    role: 'seeker',
    skills: ['javascript', 'react', 'node.js'],
    experienceYears: 3,
    ...overrides,
  };

  const user = await User.create(defaultUser);
  const token = generateAccessToken(user);

  return {
    user: user.toSafeObject(),
    rawUser: user,
    token,
    authHeader: `Bearer ${token}`,
  };
};
