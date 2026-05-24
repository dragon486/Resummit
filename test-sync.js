// Node hack to mock "server-only" import
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(modulePath) {
  if (modulePath === 'server-only') {
    return {};
  }
  return originalRequire.apply(this, arguments);
};

process.env.NODE_ENV = 'development';

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

const { prisma } = require('./lib/server/db.js');
const { runSmartSync } = require('./lib/suggestionEngine');

async function testSync() {
  try {
    console.log('Finding a user with active GitHub token in the database...');
    const user = await prisma.user.findFirst({
      where: {
        githubData: {
          accessToken: { not: null }
        }
      },
      include: { githubData: true }
    });

    if (!user) {
      console.error('❌ No user with active GitHub token found.');
      process.exit(1);
    }

    console.log(`Found user: ${user.name || user.email || user.id}`);
    const token = user.githubData?.accessToken;
    if (!token) {
      console.error('❌ User does not have a GitHub accessToken saved.');
      process.exit(1);
    }

    console.log('Starting runSmartSync...');
    console.time('runSmartSync');
    const result = await runSmartSync(user.id, token, user.email || undefined);
    console.timeEnd('runSmartSync');

    console.log('🎉 runSmartSync completed successfully!');
    console.log('Result:', result);

    const suggestions = await prisma.suggestion.findMany({
      where: { userId: user.id }
    });
    console.log(`Number of suggestions now in database: ${suggestions.length}`);
  } catch (err) {
    console.error('❌ runSmartSync threw an error:');
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

testSync();
