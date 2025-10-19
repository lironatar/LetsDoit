@echo off
echo Pushing Google OAuth Fix to GitHub...
cd /d "C:\Users\liron\OneDrive\שולחן העבודה\New folder\ToDoFast2"
git add -A
git commit -m "Fix: Add VITE_GOOGLE_OAUTH_CLIENT_ID export to build script for Railway production"
git push
echo Done!
pause
