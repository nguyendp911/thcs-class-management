from ftplib import FTP
import urllib.request
import io
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

php_code = """<?php
header('Content-Type: text/plain; charset=utf-8');
echo "CURRENT DIR: " . __DIR__ . "\\n\\n";

$targets = [
    '/home/kjioxydi/public_html',
    '/home/kjioxydi/public_html/thcs',
    '/home/kjioxydi/download',
    dirname(__DIR__),
    dirname(__DIR__) . '/public_html',
    dirname(__DIR__) . '/public_html/thcs',
];

foreach ($targets as $t) {
    $exists = file_exists($t);
    echo "Path: $t => " . ($exists ? "EXISTS" : "NOT FOUND") . "\\n";
    if ($exists && is_dir($t)) {
        $files = @scandir($t);
        echo "   Files: " . implode(", ", array_slice($files ?: [], 0, 10)) . "\\n";
    }
}
?>"""

ftp = FTP('free02.123host.vn', timeout=15)
ftp.login('nguyendp9292@vie.info.vn', '123456')
ftp.storbinary('STOR deploy_helper.php', io.BytesIO(php_code.encode('utf-8')))
ftp.quit()

print("Uploaded deploy_helper.php to FTP host. Calling HTTP endpoint...")
url = 'https://vie.info.vn/download/deploy_helper.php'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
res = urllib.request.urlopen(req).read().decode('utf-8')
print("--- RESPONSE FROM HOST ---")
print(res)
