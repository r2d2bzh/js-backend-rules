# DO NOT EDIT THIS FILE AS IT IS GENERATED BY @r2d2bzh/js-backend-rules
# The registry where docker-build-nodejs images are located can be set from
# { "r2d2bzh": { "dockerRegistry": ... } } in the package.json file of the root project
# For additional runtime commands, add { "r2d2bzh": { "dockerfileCommands": [ ... ] } }
# in deep/deep-service/package.json
# For additional builder commands, you can also use the following syntax:
# { "r2d2bzh": { "dockerfileCommands": { "builder": [ ... ], "runtime": [ ...] } } }
ARG DOCKER_BUILD_NODEJS_VERSION
FROM https:/test-registry/fake/tools/docker-build-nodejs-builder:${DOCKER_BUILD_NODEJS_VERSION} as builder
FROM https:/test-registry/fake/tools/docker-build-nodejs-runtime:${DOCKER_BUILD_NODEJS_VERSION}
