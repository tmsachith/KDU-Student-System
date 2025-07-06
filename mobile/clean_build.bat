@echo off
echo Cleaning Flutter and Gradle build cache...

cd /d "D:\Projects\KDU Student System\mobile"

echo Cleaning Flutter...
flutter clean

echo Cleaning Gradle...
cd android
./gradlew clean
cd ..

echo Getting Flutter packages...
flutter pub get

echo Build cleanup complete!
echo You can now run: flutter run
pause
