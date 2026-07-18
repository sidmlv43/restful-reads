###################################################
# Stage 1: deps
# Install only production dependencies
###################################################
FROM node:18-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

###################################################
# Stage 2: final
# Lean production image
###################################################
FROM node:18-alpine AS final
WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY index.js ./
COPY config ./config
COPY controllers ./controllers
COPY middleware ./middleware
COPY models ./models
COPY routes ./routes
COPY utils ./utils
COPY seed.js ./

EXPOSE 5000

# Seed first, then start the server
CMD ["sh", "-c", "node seed.js && node index.js"]