<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_years', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade');
            $table->string('name');
            $table->date('starts_on');
            $table->date('ends_on');
            $table->string('status')->default('active');
            $table->boolean('is_current')->default(false);
            $table->unique(['school_id', 'name']);
            $table->timestamps();
        });

        Schema::create('semesters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_year_id')->constrained('school_years')->onDelete('cascade');
            $table->string('code', 20);
            $table->string('name');
            $table->date('starts_on');
            $table->date('ends_on');
            $table->string('status')->default('active');
            $table->json('grading_config_snapshot')->nullable();
            $table->unique(['school_year_id', 'code']);
            $table->timestamps();
        });

        Schema::create('grade_levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade');
            $table->string('code', 20);
            $table->string('name');
            $table->integer('sort_order')->default(1);
            $table->unique(['school_id', 'code']);
            $table->timestamps();
        });

        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade');
            $table->foreignId('school_year_id')->constrained('school_years')->onDelete('cascade');
            $table->foreignId('grade_level_id')->constrained('grade_levels')->onDelete('cascade');
            $table->string('code', 20);
            $table->string('name');
            $table->string('room')->nullable();
            $table->integer('capacity')->default(45);
            $table->string('status')->default('active');
            $table->unique(['school_year_id', 'code']);
            $table->timestamps();
        });

        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade');
            $table->string('code', 20);
            $table->string('name');
            $table->string('short_name');
            $table->string('status')->default('active');
            $table->integer('sort_order')->default(1);
            $table->unique(['school_id', 'code']);
            $table->timestamps();
        });

        Schema::create('teacher_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('class_id')->constrained('classes')->onDelete('cascade');
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('assignment_type'); // homeroom, subject
            $table->date('starts_on');
            $table->date('ends_on')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('class_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->onDelete('cascade');
            $table->string('name');
            $table->unsignedBigInteger('leader_student_id')->nullable();
            $table->integer('sort_order')->default(1);
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('timetable_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->onDelete('cascade');
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
            $table->integer('weekday'); // 2..7
            $table->integer('period_no'); // 1..5
            $table->time('starts_at');
            $table->time('ends_at');
            $table->string('room')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('lesson_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('timetable_entry_id')->nullable();
            $table->foreignId('class_id')->constrained('classes')->onDelete('cascade');
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
            $table->date('lesson_date');
            $table->integer('period_no');
            $table->text('content');
            $table->text('homework')->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('completed');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_logs');
        Schema::dropIfExists('timetable_entries');
        Schema::dropIfExists('class_groups');
        Schema::dropIfExists('teacher_assignments');
        Schema::dropIfExists('subjects');
        Schema::dropIfExists('classes');
        Schema::dropIfExists('grade_levels');
        Schema::dropIfExists('semesters');
        Schema::dropIfExists('school_years');
    }
};
