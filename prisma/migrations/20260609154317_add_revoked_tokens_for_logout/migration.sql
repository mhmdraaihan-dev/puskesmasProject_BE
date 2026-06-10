-- CreateTable
CREATE TABLE "revoked_tokens" (
    "revoked_token_id" TEXT NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "jti" TEXT,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revoked_tokens_pkey" PRIMARY KEY ("revoked_token_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "revoked_tokens_token_hash_key" ON "revoked_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "revoked_tokens_jti_key" ON "revoked_tokens"("jti");

-- CreateIndex
CREATE INDEX "revoked_tokens_user_id_idx" ON "revoked_tokens"("user_id");

-- CreateIndex
CREATE INDEX "revoked_tokens_expires_at_idx" ON "revoked_tokens"("expires_at");

-- AddForeignKey
ALTER TABLE "revoked_tokens" ADD CONSTRAINT "revoked_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
