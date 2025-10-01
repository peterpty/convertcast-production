@echo off
echo ================================================
echo WINDOWS DEFENDER RTMP FIX FOR OBS STUDIO
echo ================================================
echo.
echo This script will add OBS Studio to Windows Defender exceptions
echo Run this as Administrator for best results
echo.
pause

echo Adding OBS Studio to Windows Defender exclusions...
powershell -Command "Add-MpPreference -ExclusionProcess 'obs64.exe'"
powershell -Command "Add-MpPreference -ExclusionProcess 'obs32.exe'"
powershell -Command "Add-MpPreference -ExclusionPath '%ProgramFiles%\obs-studio\'"

echo.
echo Adding Windows Firewall rules for OBS...
netsh advfirewall firewall add rule name="OBS Studio Out" dir=out action=allow program="%ProgramFiles%\obs-studio\bin\64bit\obs64.exe" enable=yes
netsh advfirewall firewall add rule name="OBS Studio In" dir=in action=allow program="%ProgramFiles%\obs-studio\bin\64bit\obs64.exe" enable=yes

echo.
echo ================================================
echo NEXT STEPS:
echo 1. Close OBS Studio completely
echo 2. Run OBS as Administrator
echo 3. Use these EXACT settings:
echo    Service: Custom...
echo    Server: rtmp://global-live.mux.com/live
echo    Stream Key: b7696af8-3029-7ec7-3cfe-dcfad507c1b7
echo 4. Start Streaming
echo ================================================
pause