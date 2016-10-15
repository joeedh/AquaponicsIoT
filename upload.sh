#!/usr/bin/env bash

#expects variable AQUASERVER to be set
echo make sure AQUASERVER and SCP are set

export SCP=/c/dev/putty/pscp
export AQUASERVER=172.0.16.184

tar -czf ../aquaponic.tgz *
$SCP -pw aquaponic ../aquaponic.tgz  root@$AQUASERVER:/node_app_slot/aquaponic.tgz
