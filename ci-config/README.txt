# CI Config Context
In order to run our integration tests quickly, we want to run an up-to-date version of rippled.

XRPL Labs maintains a docker container with the latest pulbic releases of rippled ([here](https://github.com/WietseWind/docker-rippled)).
We extend that image in order to start the container in standalone mode and set the public

## How to update the docker file

1. From this folder, build the docker image with:
```
docker build -t latest .
```

2. Run the image and test if it works with the updated integration tests
```
docker run -p 6006:6006 -it latest
```

Then in another terminal run the integration tests and see if they pass.

3. Find the docker container with the working image from the list provided by:
```
docker container ls -a
```

4. Commit that image
```
docker commit <container-id> jst5000/ci-rippled:latest
```

5. Push that container
```
docker container push
```

Make sure you're logged into your Docker (with `docker login`) and that your account has permissions to push/pull from `jst5000/ci-rippled`
