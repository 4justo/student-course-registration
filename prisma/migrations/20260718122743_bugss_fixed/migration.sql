-- CreateTable
CREATE TABLE "courses" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "abbreviation" VARCHAR(20) NOT NULL,
    "category" VARCHAR(100) NOT NULL DEFAULT 'General',
    "instructor" VARCHAR(150) NOT NULL DEFAULT 'TBA',
    "schedule" VARCHAR(150) NOT NULL DEFAULT 'TBA',
    "credits" INTEGER NOT NULL DEFAULT 3,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.5,
    "description" TEXT,
    "prereqs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "capacity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" BIGSERIAL NOT NULL,
    "course_id" BIGINT NOT NULL,
    "student_id" BIGINT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'registered',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "reg_no" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "gender" VARCHAR(20),
    "role" VARCHAR(20) NOT NULL DEFAULT 'student',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "courses_abbreviation_key" ON "courses"("abbreviation");

-- CreateIndex
CREATE INDEX "idx_registrations_course_id" ON "registrations"("course_id");

-- CreateIndex
CREATE INDEX "idx_registrations_student_id" ON "registrations"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_course_id_student_id_key" ON "registrations"("course_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_reg_no_key" ON "students"("reg_no");

-- CreateIndex
CREATE INDEX "idx_students_user_id" ON "students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
