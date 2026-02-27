import 'dotenv/config';
import http from 'http';
import { app } from './app';
import { prisma } from './lib/prisma';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected (Supabase PostgreSQL)');

    server.listen(PORT, () => {
      console.log('');
      console.log('🚀 UHID API Server running');
      console.log(`   Local:   http://localhost:${PORT}`);
      console.log(`   Mode:    ${process.env.NODE_ENV || 'development'}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

main();
