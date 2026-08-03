<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade');
            $table->char('public_id', 26)->unique();
            $table->string('student_code', 30);
            $table->string('first_name');
            $table->string('last_name');
            $table->string('full_name_normalized');
            $table->date('date_of_birth');
            $table->string('gender', 10);
            $table->string('address')->nullable();
            $table->unsignedBigInteger('avatar_file_id')->nullable();
            $table->string('status')->default('đang học');
            $table->unique(['school_id', 'student_code']);
            $table->timestamps();
        });

        Schema::create('student_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('school_year_id')->constrained('school_years')->onDelete('cascade');
            $table->foreignId('class_id')->constrained('classes')->onDelete('cascade');
            $table->unsignedBigInteger('group_id')->nullable();
            $table->integer('roll_number')->nullable();
            $table->date('starts_on');
            $table->date('ends_on')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('guardians', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade');
            $table->string('full_name');
            $table->string('phone');
            $table->string('phone_normalized');
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->string('occupation')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('student_guardians', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('guardian_id')->constrained('guardians')->onDelete('cascade');
            $table->string('relationship'); // Cha, Mẹ, Người giám hộ
            $table->boolean('is_primary')->default(true);
            $table->boolean('is_emergency')->default(true);
            $table->boolean('can_receive_notifications')->default(true);
            $table->string('verification_status')->default('verified');
            $table->unique(['student_id', 'guardian_id']);
            $table->timestamps();
        });

        Schema::create('student_health_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->unique()->constrained('students')->onDelete('cascade');
            $table->string('blood_type', 10)->nullable();
            $table->text('allergies')->nullable();
            $table->text('conditions')->nullable();
            $table->text('medications')->nullable();
            $table->text('emergency_notes')->nullable();
            $table->string('visibility_level')->default('restricted');
            $table->timestamps();
        });

        Schema::create('student_tags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade');
            $table->string('name');
            $table->string('color', 20)->default('blue');
            $table->boolean('is_sensitive')->default(false);
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('student_tag_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('tag_id')->constrained('student_tags')->onDelete('cascade');
            $table->unsignedBigInteger('assigned_by')->nullable();
            $table->date('expires_at')->nullable();
            $table->unique(['student_id', 'tag_id']);
            $table->timestamps();
        });

        Schema::create('student_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->unsignedBigInteger('author_id');
            $table->string('category')->default('general');
            $table->text('content');
            $table->string('visibility')->default('homeroom');
            $table->timestamp('occurred_at')->useCurrent();
            $table->timestamp('pinned_at')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('student_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->unsignedBigInteger('file_id');
            $table->string('document_type');
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('issued_on')->nullable();
            $table->date('expires_on')->nullable();
            $table->string('visibility')->default('homeroom');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_documents');
        Schema::dropIfExists('student_notes');
        Schema::dropIfExists('student_tag_assignments');
        Schema::dropIfExists('student_tags');
        Schema::dropIfExists('student_health_profiles');
        Schema::dropIfExists('student_guardians');
        Schema::dropIfExists('guardians');
        Schema::dropIfExists('student_enrollments');
        Schema::dropIfExists('students');
    }
};
