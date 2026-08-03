<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conduct_criteria', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_year_id')->constrained('school_years')->onDelete('cascade');
            $table->string('code', 30);
            $table->string('name');
            $table->string('category'); // chuyên cần, kỷ luật, trách nhiệm, phong trào
            $table->string('event_type'); // positive, infraction
            $table->integer('default_points')->default(0);
            $table->string('visibility')->default('public');
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('conduct_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('class_id')->constrained('classes')->onDelete('cascade');
            $table->foreignId('criterion_id')->constrained('conduct_criteria')->onDelete('cascade');
            $table->timestamp('occurred_at')->useCurrent();
            $table->integer('points')->default(0);
            $table->text('description');
            $table->string('visibility')->default('public');
            $table->unsignedBigInteger('recorded_by');
            $table->string('source_type')->nullable();
            $table->unsignedBigInteger('source_id')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->onDelete('cascade');
            $table->char('public_id', 26)->unique();
            $table->string('title');
            $table->string('type');
            $table->string('severity')->default('trung bình');
            $table->timestamp('occurred_at')->useCurrent();
            $table->string('location')->nullable();
            $table->text('description');
            $table->string('visibility')->default('restricted');
            $table->unsignedBigInteger('owner_id');
            $table->string('status')->default('OPEN'); // OPEN, IN_REVIEW, RESOLVED, CLOSED
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('incident_students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('incident_id')->constrained('incidents')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->string('involvement_type')->default('involved');
            $table->text('note')->nullable();
            $table->unique(['incident_id', 'student_id', 'involvement_type'], 'unique_incident_student');
            $table->timestamps();
        });

        Schema::create('incident_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('incident_id')->constrained('incidents')->onDelete('cascade');
            $table->string('action_type');
            $table->text('description');
            $table->unsignedBigInteger('assignee_id')->nullable();
            $table->timestamp('due_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->string('status')->default('pending');
            $table->unsignedBigInteger('created_by');
            $table->timestamps();
        });

        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->onDelete('cascade');
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->timestamp('assigned_at')->useCurrent();
            $table->timestamp('due_at')->nullable();
            $table->string('audience_type')->default('all');
            $table->string('status')->default('PUBLISHED');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });

        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('class_id')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('task_type')->default('trực nhật');
            $table->string('priority')->default('trung bình');
            $table->timestamp('due_at')->nullable();
            $table->string('status')->default('TODO'); // TODO, IN_PROGRESS, DONE, CANCELLED
            $table->unsignedBigInteger('created_by');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('class_id')->nullable();
            $table->unsignedBigInteger('author_id');
            $table->string('title');
            $table->longText('body_html');
            $table->string('priority')->default('quan trọng');
            $table->string('status')->default('PUBLISHED');
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->boolean('acknowledgement_required')->default(true);
            $table->timestamp('acknowledgement_due_at')->nullable();
            $table->timestamps();
        });

        Schema::create('files', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('owner_user_id');
            $table->string('disk')->default('local');
            $table->string('path')->unique();
            $table->string('original_name');
            $table->string('mime_type');
            $table->unsignedBigInteger('size_bytes');
            $table->string('checksum')->nullable();
            $table->string('visibility')->default('private');
            $table->string('status')->default('active');
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('type');
            $table->string('title');
            $table->text('body');
            $table->json('data')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->string('idempotency_key')->unique()->nullable();
            $table->timestamps();
        });

        Schema::create('report_exports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('report_type');
            $table->json('filters')->nullable();
            $table->string('format')->default('excel');
            $table->string('status')->default('QUEUED');
            $table->unsignedBigInteger('file_id')->nullable();
            $table->integer('row_count')->default(0);
            $table->text('error_message')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_exports');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('files');
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('assignments');
        Schema::dropIfExists('incident_actions');
        Schema::dropIfExists('incident_students');
        Schema::dropIfExists('incidents');
        Schema::dropIfExists('conduct_events');
        Schema::dropIfExists('conduct_criteria');
    }
};
