<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->onDelete('cascade');
            $table->date('session_date');
            $table->string('session_type'); // morning, afternoon, period
            $table->integer('period_no')->nullable();
            $table->string('status')->default('open'); // open, locked
            $table->timestamp('locked_at')->nullable();
            $table->unsignedBigInteger('locked_by')->nullable();
            $table->unique(['class_id', 'session_date', 'session_type', 'period_no'], 'unique_attendance_session');
            $table->timestamps();
        });

        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('attendance_sessions')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->string('status'); // PRESENT, EXCUSED_ABSENCE, UNEXCUSED_ABSENCE, LATE, EARLY_LEAVE, EXEMPT
            $table->integer('minutes_late')->nullable();
            $table->string('note')->nullable();
            $table->string('source_type')->default('manual');
            $table->unsignedBigInteger('source_id')->nullable();
            $table->unsignedBigInteger('recorded_by');
            $table->unique(['session_id', 'student_id']);
            $table->timestamps();
        });

        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->unsignedBigInteger('guardian_id')->nullable();
            $table->date('starts_at');
            $table->date('ends_at');
            $table->string('session_scope')->default('cả ngày');
            $table->text('reason');
            $table->string('status')->default('PENDING'); // PENDING, APPROVED, REJECTED, CANCELLED
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->text('review_note')->nullable();
            $table->char('public_id', 26)->unique();
            $table->timestamps();
        });

        Schema::create('leave_request_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('leave_request_id')->constrained('leave_requests')->onDelete('cascade');
            $table->unsignedBigInteger('file_id');
            $table->unique(['leave_request_id', 'file_id']);
            $table->timestamps();
        });

        Schema::create('grade_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_year_id')->constrained('school_years')->onDelete('cascade');
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('code', 20);
            $table->string('name');
            $table->decimal('weight', 4, 2)->nullable();
            $table->json('calculation_rule')->nullable();
            $table->integer('sort_order')->default(1);
            $table->timestamps();
        });

        Schema::create('assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->onDelete('cascade');
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->foreignId('semester_id')->constrained('semesters')->onDelete('cascade');
            $table->foreignId('category_id')->constrained('grade_categories')->onDelete('cascade');
            $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->date('assessment_date');
            $table->decimal('max_score', 4, 2)->default(10.00);
            $table->decimal('weight', 4, 2)->default(1.00);
            $table->string('status')->default('draft'); // draft, released, locked
            $table->timestamp('released_at')->nullable();
            $table->timestamp('locked_at')->nullable();
            $table->timestamps();
        });

        Schema::create('student_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assessment_id')->constrained('assessments')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->decimal('score', 4, 2)->nullable();
            $table->string('score_status')->default('valid'); // valid, exempt, missing
            $table->text('comment')->nullable();
            $table->unsignedBigInteger('entered_by');
            $table->timestamp('released_at')->nullable();
            $table->text('revision_reason')->nullable();
            $table->unique(['assessment_id', 'student_id']);
            $table->timestamps();
        });

        Schema::create('score_revisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_score_id')->constrained('student_scores')->onDelete('cascade');
            $table->decimal('old_score', 4, 2)->nullable();
            $table->decimal('new_score', 4, 2)->nullable();
            $table->string('old_status')->nullable();
            $table->string('new_status')->nullable();
            $table->text('reason');
            $table->unsignedBigInteger('changed_by');
            $table->timestamp('changed_at')->useCurrent();
        });

        Schema::create('learning_support_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('school_year_id')->constrained('school_years')->onDelete('cascade');
            $table->string('title');
            $table->string('reason_type');
            $table->text('goals');
            $table->text('actions');
            $table->unsignedBigInteger('owner_id');
            $table->date('review_on')->nullable();
            $table->string('status')->default('active');
            $table->string('visibility')->default('homeroom');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('learning_support_plans');
        Schema::dropIfExists('score_revisions');
        Schema::dropIfExists('student_scores');
        Schema::dropIfExists('assessments');
        Schema::dropIfExists('grade_categories');
        Schema::dropIfExists('leave_request_files');
        Schema::dropIfExists('leave_requests');
        Schema::dropIfExists('attendance_records');
        Schema::dropIfExists('attendance_sessions');
    }
};
