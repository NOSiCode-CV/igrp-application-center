# Run Dockerfile

docker build -t igrp-application-center .

docker run --rm -it -p 3000:3000 --name igrp-application-center igrp-application-center
