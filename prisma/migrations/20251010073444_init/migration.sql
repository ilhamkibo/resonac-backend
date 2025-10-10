CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- CreateEnum
CREATE TYPE "error_status" AS ENUM ('HIGH', 'LOW');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('admin', 'operator');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT,
    "email" TEXT,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'operator',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thresholds" (
    "id" SERIAL NOT NULL,
    "area" TEXT NOT NULL,
    "parameter" TEXT NOT NULL,
    "lower_limit" DOUBLE PRECISION,
    "upper_limit" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "thresholds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_history" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "area" TEXT NOT NULL,
    "parameter" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "threshold_id" INTEGER,
    "status" "error_status" NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "user_ack" INTEGER,

    CONSTRAINT "error_history_pkey" PRIMARY KEY ("id","timestamp")
);

-- CreateTable
CREATE TABLE "manual_inputs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER,
    "timestamp" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manual_inputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manual_input_details" (
    "id" BIGSERIAL NOT NULL,
    "manual_input_id" BIGINT,
    "area" TEXT NOT NULL,
    "ampere_r" DOUBLE PRECISION,
    "ampere_s" DOUBLE PRECISION,
    "ampere_t" DOUBLE PRECISION,
    "volt_r" DOUBLE PRECISION,
    "volt_s" DOUBLE PRECISION,
    "volt_t" DOUBLE PRECISION,
    "pf" DOUBLE PRECISION,
    "kwh" DOUBLE PRECISION,
    "oil_pressure" DOUBLE PRECISION,
    "oil_temperature" DOUBLE PRECISION,

    CONSTRAINT "manual_input_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measurements" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "area" TEXT NOT NULL,
    "ampere_rs" DOUBLE PRECISION,
    "ampere_st" DOUBLE PRECISION,
    "ampere_tr" DOUBLE PRECISION,
    "volt_rs" DOUBLE PRECISION,
    "volt_st" DOUBLE PRECISION,
    "volt_tr" DOUBLE PRECISION,
    "pf" DOUBLE PRECISION,
    "kwh" DOUBLE PRECISION,
    "oil_pressure" DOUBLE PRECISION,
    "oil_temperature" DOUBLE PRECISION,

    CONSTRAINT "measurements_pkey" PRIMARY KEY ("id","timestamp")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "error_history" ADD CONSTRAINT "error_history_threshold_id_fkey" FOREIGN KEY ("threshold_id") REFERENCES "thresholds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_history" ADD CONSTRAINT "error_history_user_ack_fkey" FOREIGN KEY ("user_ack") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_inputs" ADD CONSTRAINT "manual_inputs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_input_details" ADD CONSTRAINT "manual_input_details_manual_input_id_fkey" FOREIGN KEY ("manual_input_id") REFERENCES "manual_inputs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Enable TimescaleDB hypertables
SELECT create_hypertable('measurements', 'timestamp', if_not_exists => TRUE);
SELECT create_hypertable('error_history', 'timestamp', if_not_exists => TRUE);
