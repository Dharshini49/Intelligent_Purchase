@echo off
echo Setting up frontend...

REM Create public folder if not exists
if not exist "public" mkdir public

REM Create index.html
echo ^<!DOCTYPE html^> > public\index.html
echo ^<html lang="en"^> >> public\index.html
echo   ^<head^> >> public\index.html
echo     ^<meta charset="utf-8"^> >> public\index.html
echo     ^<link rel="icon" href="%%PUBLIC_URL%%/favicon.ico"^> >> public\index.html
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1"^> >> public\index.html
echo     ^<meta name="theme-color" content="#000000"^> >> public\index.html
echo     ^<meta name="description" content="Price Decision System"^> >> public\index.html
echo     ^<title^>Price Decision System^</title^> >> public\index.html
echo   ^</head^> >> public\index.html
echo   ^<body^> >> public\index.html
echo     ^<noscript^>You need to enable JavaScript to run this app.^</noscript^> >> public\index.html
echo     ^<div id="root"^>^</div^> >> public\index.html
echo   ^</body^> >> public\index.html
echo ^</html^> >> public\index.html

echo ✓ index.html created successfully!

REM Install dependencies if node_modules is missing
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

echo ✓ Setup complete!
echo Run 'npm start' to start the application.