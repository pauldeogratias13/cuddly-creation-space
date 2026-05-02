import { PrismaClient, UserRole, UserStatus, PostType, PostVisibility } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding NEXUS database...');

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminPasswordHash = await argon2.hash('Admin1234!');
  const userPasswordHash = await argon2.hash('User1234!');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@nexus.app' },
    update: {},
    create: {
      email: 'admin@nexus.app',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          handle: 'nexus_admin',
          displayName: 'NEXUS Admin',
          bio: 'Platform administrator',
          verified: true,
          isCreator: false,
        },
      },
    },
  });

  const creator1 = await prisma.user.upsert({
    where: { email: 'creator@nexus.app' },
    update: {},
    create: {
      email: 'creator@nexus.app',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      passwordHash: userPasswordHash,
      role: UserRole.CREATOR,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          handle: 'gosbert_creator',
          displayName: 'Gosbert',
          bio: 'Building the future of social platforms. Tech, design, and beyond.',
          verified: true,
          isCreator: true,
          reputationScore: 950,
        },
      },
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'user1@nexus.app' },
    update: {},
    create: {
      email: 'user1@nexus.app',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      passwordHash: userPasswordHash,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          handle: 'tech_explorer',
          displayName: 'Tech Explorer',
          bio: 'Passionate about AI and future tech',
          reputationScore: 450,
        },
      },
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@nexus.app' },
    update: {},
    create: {
      email: 'user2@nexus.app',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      passwordHash: userPasswordHash,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          handle: 'design_wizard',
          displayName: 'Design Wizard',
          bio: 'UI/UX designer & creative director',
          reputationScore: 300,
        },
      },
    },
  });

  console.log('✅ Users seeded');

  // ── Creator Tiers ──────────────────────────────────────────────────────────
  await prisma.creatorTier.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      creatorId: creator1.id,
      name: 'Supporter',
      description: 'Support my work and get exclusive updates',
      price: 4.99,
      currency: 'USD',
      benefits: ['Early access to posts', 'Monthly Q&A', 'Exclusive Discord'],
      isActive: true,
    },
  });

  await prisma.creatorTier.upsert({
    where: { id: '00000000-0000-0000-0000-000000000011' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000011',
      creatorId: creator1.id,
      name: 'Builder',
      description: 'Full access to all my content and source code',
      price: 14.99,
      currency: 'USD',
      benefits: ['Everything in Supporter', 'Access to source code', '1:1 calls', 'Custom badge'],
      isActive: true,
    },
  });

  console.log('✅ Creator tiers seeded');

  // ── Sample Posts ───────────────────────────────────────────────────────────
  await prisma.post.createMany({
    skipDuplicates: true,
    data: [
      {
        userId: creator1.id,
        type: PostType.TEXT,
        text: 'Just shipped the new NEXUS backend — full production stack with Fastify, Prisma, Redis, WebSockets, and end-to-end encrypted messaging. The future is being built today. 🚀 #NEXUS #BuildInPublic',
        visibility: PostVisibility.PUBLIC,
        intentTag: 'create',
        domainTag: 'Engineering',
        likesCount: 42,
        commentsCount: 8,
      },
      {
        userId: creator1.id,
        type: PostType.TEXT,
        text: 'Thread on zero-knowledge proofs for auth: Why traditional JWT is not enough for privacy-preserving systems, and how ZK-SNARKs can change the game. 🔬 #ZeroKnowledge #Privacy',
        visibility: PostVisibility.PUBLIC,
        intentTag: 'learn',
        domainTag: 'Engineering',
        likesCount: 89,
        commentsCount: 14,
      },
      {
        userId: user1.id,
        type: PostType.TEXT,
        text: 'AI is changing everything. From how we code to how we create. The ones who learn to work WITH the models will build the next generation of software. 🌍 #AI #FutureTech',
        visibility: PostVisibility.PUBLIC,
        intentTag: 'explore',
        likesCount: 27,
        commentsCount: 5,
      },
      {
        userId: user2.id,
        type: PostType.TEXT,
        text: 'Good design is invisible. You only notice it when it is gone. Working on some new UI patterns for NEXUS's mobile app — brutally clean and fast. 🎨 #Design #UI',
        visibility: PostVisibility.PUBLIC,
        intentTag: 'create',
        domainTag: 'Design',
        likesCount: 63,
        commentsCount: 11,
      },
    ],
  });

  console.log('✅ Posts seeded');

  // ── Follows ────────────────────────────────────────────────────────────────
  await prisma.follow.createMany({
    skipDuplicates: true,
    data: [
      { followerId: user1.id, followingId: creator1.id },
      { followerId: user2.id, followingId: creator1.id },
      { followerId: creator1.id, followingId: user1.id },
    ],
  });

  console.log('✅ Follows seeded');

  // ── Hashtags ───────────────────────────────────────────────────────────────
  await prisma.hashtag.createMany({
    skipDuplicates: true,
    data: [
      { tag: 'NEXUS', postsCount: 10 },
      { tag: 'BuildInPublic', postsCount: 7 },
      { tag: 'AI', postsCount: 25 },
      { tag: 'Design', postsCount: 15 },
      { tag: 'ZeroKnowledge', postsCount: 3 },
      { tag: 'Engineering', postsCount: 18 },
      { tag: 'FutureTech', postsCount: 8 },
    ],
  });

  console.log('✅ Hashtags seeded');

  console.log('');
  console.log('🎉 Seed complete!');
  console.log('');
  console.log('Demo credentials:');
  console.log('  Admin:   admin@nexus.app / Admin1234!');
  console.log('  Creator: creator@nexus.app / User1234!');
  console.log('  User:    user1@nexus.app / User1234!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
