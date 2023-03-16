FROM xrpllabsofficial/xrpld:latest

# Use our local configs to run rippled over 0.0.0.0 instead of 127.0.0.0
# So we can connect to it from outside the container
COPY rippled.cfg /opt/ripple/etc/rippled.cfg

COPY validators.txt /opt/ripple/etc/validators.txt

# Start rippled in standalone mode
ENV ENV_ARGS="-a --start"

ENTRYPOINT [ "/entrypoint.sh" ]
