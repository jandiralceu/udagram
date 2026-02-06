// Import the framework and instantiate it
import Fastify from 'fastify'
const fastify = Fastify({
  logger: true,
})

// Declare a route
fastify.get('/health', async function handler(request, reply) {
  return { status: 'ok' }
})

// Run the server!
try {
  await fastify.listen({ port: 5200 })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
