docker logs memorieswalk


docker inspect memorieswalk | grep -A 5 "Env"
docker exec -it memorieswalk env | grep VITE_API_URL


docker rmi ghcr.io/lakwli/memorieswalk:app ghcr.io/lakwli/memorieswalk:db
docker volume rm deploy_memorieswalk_data deploy_memorieswalk_db_data
docker network prune