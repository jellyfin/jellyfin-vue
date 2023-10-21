This Dockerfile must have it's context at the root of the repository. From this folder:

``
docker build ../.. -t your/tag -f Dockerfile
``

Alternatively, with the shell at the root of this repository:

``
docker build . -t your/tag -f packaging/docker/Dockerfile
``
