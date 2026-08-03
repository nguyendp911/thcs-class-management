<?php

use Illuminate\Support\Facades\Schedule;

// Schedule daily backup and warning check tasks
Schedule::command('queue:work --once')->everyMinute();
