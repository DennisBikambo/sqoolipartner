echo "Switching to branch main"
git checkout master


echo "Build app..."
npm run build


echo "Deploying files to server"
scp -r dist/* deploy@139.84.235.14:/var/www/sqooli/

echo "App deployed!"