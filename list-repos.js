// Node hack to mock "server-only" import
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(modulePath) {
  if (modulePath === 'server-only') {
    return {};
  }
  return originalRequire.apply(this, arguments);
};

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

const { prisma } = require('./lib/server/db.js');

async function listRepos() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        githubData: {
          accessToken: { not: null }
        }
      },
      include: { githubData: true }
    });

    if (!user) {
      console.log('No user found with GitHub data.');
      return;
    }

    console.log(`User: ${user.name || user.email}`);
    const repos = user.githubData?.repositories || [];
    console.log(`Total repos stored in GitHubData: ${repos.length}`);
    repos.forEach((r, idx) => {
      console.log(`${idx + 1}. Name: "${r.name}"`);
      console.log(`   Language: ${r.language}`);
      console.log(`   Fork: ${r.fork}`);
      console.log(`   Topics: ${JSON.stringify(r.topics || [])}`);
      console.log(`   Description: "${r.description}"`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

listRepos();
