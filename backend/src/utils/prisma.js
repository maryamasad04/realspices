import { PrismaClient } from '@prisma/client';

// Ensure BigInt values can be serialized to JSON responses.
// Prisma may return BigInt for some DB types (e.g. PostgreSQL "bigint").
// JSON.stringify throws on BigInt by default, so provide a toJSON
// implementation that converts BigInt to string.
if (typeof BigInt !== 'undefined' && !BigInt.prototype.toJSON) {
	Object.defineProperty(BigInt.prototype, 'toJSON', {
		value: function () {
			return this.toString();
		},
		configurable: true,
		writable: true,
		enumerable: false,
	});
}
let prisma;

if (process.env.NODE_ENV === 'production') {
	prisma = new PrismaClient();
} else {
	// In development, prevent creating multiple instances of PrismaClient
	// during hot-reloads by attaching it to the global object.
	if (!globalThis._prisma) {
		globalThis._prisma = new PrismaClient();
	}
	prisma = globalThis._prisma;
}

// Try to connect and log a clear error if the DB is unreachable.
(async () => {
	try {
		await prisma.$connect();
	} catch (e) {
		console.error('Prisma connection error:', e.message || e);
	}
})();

export default prisma;
