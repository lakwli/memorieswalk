


docker ps -a
docker rm 
docker rmi memorieswalk_devcontainer-app
docker rmi postgres
docker volume ls
docker volume rm memorieswalk_devcontainer_postgres_data


docker logs memorieswalk


docker inspect memorieswalk | grep -A 5 "Env"
docker exec -it memorieswalk env | grep VITE_API_URL


docker rmi ghcr.io/lakwli/memorieswalk:app ghcr.io/lakwli/memorieswalk:db
docker volume rm deploy_memorieswalk_data deploy_memorieswalk_db_data
docker network prune



# Configure npm (run once):
npm config set registry https://registry.npmjs.org/

# Start Backend (in one terminal):
cd /workspace/server
rm -rf node_modules package-lock.json
npm install
npm run dev

# Start Frontend (in another terminal):
cd /workspace
npm install
npm run frontend:dev

Ports:
- Backend: http://localhost:3000
- Frontend: http://localhost:5173



sudo apt-get install postgresql-client
psql -h localhost -p 5432 -U node -d memorieswalk
\dt
\q