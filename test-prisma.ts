import prisma from './lib/prisma';

async function main() {
  const session = await prisma.chatSession.create({
    data: {
      messages: {
        create: {
          role: 'user',
          content: 'Hello'
        }
      }
    }
  });
  console.log('Created session:', session);
  const fetched = await prisma.chatSession.findMany({ include: { messages: true }});
  console.log('All sessions:', JSON.stringify(fetched, null, 2));
}

main().catch(console.error);
