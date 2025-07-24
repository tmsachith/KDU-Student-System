@echo off
echo Formatting Dart files...

REM Navigate to mobile directory
cd /d "d:\Projects\KDU Student System\mobile"

REM Run dart format on the specific file
echo Formatting my_discussions_screen.dart...
dart format lib\screens\my_discussions_screen.dart

echo Formatting edit_discussion_screen.dart...
dart format lib\screens\edit_discussion_screen.dart

echo Formatting discussion_service.dart...
dart format lib\services\discussion_service.dart

echo Formatting discussion.dart...
dart format lib\models\discussion.dart

echo All files formatted successfully!
pause
