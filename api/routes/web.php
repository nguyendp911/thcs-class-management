<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'app' => 'Website Quản lý Lớp THCS API',
        'version' => '1.0.0',
        'status' => 'active'
    ]);
});
